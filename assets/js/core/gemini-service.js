// gemini-service.js - Prioritize gemini-2.0-flash with safe fallbacks
import { geminiApiKey, appConfig } from "../../../config/config.js";
import { getUserActivities, getActivityStats } from './environmental-activity-service.js';

// Cache & state
let genAI = null;
let GoogleGenerativeAI = null;
let availableModels = null;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Rate limiting (existing logic)
let lastRequestTime = 0;
let requestCount = 0;
let dailyRequestCount = parseInt(localStorage.getItem('gemini_daily_requests') || '0');
let lastResetDate = localStorage.getItem('gemini_last_reset') || new Date().toDateString();
if (lastResetDate !== new Date().toDateString()) {
    dailyRequestCount = 0;
    localStorage.setItem('gemini_daily_requests', '0');
    localStorage.setItem('gemini_last_reset', new Date().toDateString());
}

const FREE_TIER_LIMITS = {
    RPM: 15,
    DAILY: 1500,
    MIN_INTERVAL: 4000
};

async function initializeGemini() {
    if (!genAI) {
        try {
            if (!GoogleGenerativeAI) {
                const module = await import('https://esm.run/@google/generative-ai');
                GoogleGenerativeAI = module.GoogleGenerativeAI;
            }
            genAI = new GoogleGenerativeAI(geminiApiKey);
            console.log('✅ Gemini AI initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Gemini AI:', error);
            genAI = null;
        }
    }
    return genAI;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkRateLimit() {
    const now = Date.now();
    if (dailyRequestCount >= FREE_TIER_LIMITS.DAILY) {
        throw new Error('Daily quota exceeded. Please wait until tomorrow or upgrade to paid plan.');
    }
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < FREE_TIER_LIMITS.MIN_INTERVAL) {
        const waitTime = FREE_TIER_LIMITS.MIN_INTERVAL - timeSinceLastRequest;
        console.log(`🕒 Rate limiting: waiting ${waitTime}ms before next request`);
        await delay(waitTime);
    }
    lastRequestTime = Date.now();
    requestCount++;
    dailyRequestCount++;
    localStorage.setItem('gemini_daily_requests', dailyRequestCount.toString());
}

// Get available models from API but prioritize gemini-2.0-flash
async function getAvailableModels() {
    if (availableModels) return availableModels;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // All model names (normalize)
        const modelsFromApi = (data.models || []).map(m => m.name.replace('models/', ''));

        // Preferred explicit order: gemini-2.0-flash first, then its variants, then older flash/pro models
        const preferredOrder = [
            'gemini-2.0-flash',
            'gemini-2.0-flash-latest',
            'gemini-2.0-pro',
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro',
            'gemini-pro'
        ];

        // Build result: include preferred models that exist in API first, then any other useful models
        const prioritized = [];
        for (const pref of preferredOrder) {
            if (modelsFromApi.includes(pref)) prioritized.push(pref);
        }

        // Add other flash/pro models returned by API (avoid duplicates)
        for (const m of modelsFromApi) {
            if (!prioritized.includes(m) && (m.includes('flash') || m.includes('pro') || m.includes('2.0') || m.includes('1.5'))) {
                prioritized.push(m);
            }
        }

        // As last resort, allow any model returned
        for (const m of modelsFromApi) {
            if (!prioritized.includes(m)) prioritized.push(m);
        }

        availableModels = prioritized;
        console.log('✅ Available models (prioritized):', availableModels);
        return availableModels;

    } catch (error) {
        console.error('❌ Failed to fetch available models:', error);
        // Provide robust fallback list including gemini-2.0-flash names
        return [
            'gemini-2.0-flash',
            'gemini-2.0-flash-latest',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash',
            'gemini-pro'
        ];
    }
}

// Try to get model instance with explicit preference for gemini-2.0-flash
async function getModelWithFallback(retryCount = 0) {
    const ai = await initializeGemini();
    if (!ai) {
        throw new Error('Gemini AI is not properly initialized. Please check your API key.');
    }

    const models = await getAvailableModels();
    if (!models || models.length === 0) {
        throw new Error('No models available. Please check your API key permissions.');
    }

    let lastError = null;

    // Try models in order returned by getAvailableModels (which was prioritized)
    for (const modelName of models) {
        try {
            // Use exact modelName to get generative model instance
            const model = ai.getGenerativeModel({ model: modelName });
            console.log(`✅ Using model: ${modelName}`);
            return model;
        } catch (error) {
            console.warn(`⚠️ Failed to use model ${modelName}:`, error?.message || error);
            lastError = error;
        }
    }

    throw new Error(`All models are currently unavailable. Last error: ${lastError?.message || lastError}`);
}

function getErrorMessage(error) {
    const errorMsg = (error && error.message) ? error.message : String(error);

    if (errorMsg.includes('quota') || errorMsg.includes('429')) {
        return { message: "API quota exceeded. Menunggu reset atau upgrade plan.", type: 'quota', waitTime: 60000 };
    }
    if (errorMsg.includes('API key') || errorMsg.includes('401')) {
        return { message: "API key tidak valid. Generate API key baru di https://aistudio.google.com/app/apikey", type: 'auth' };
    }
    if (errorMsg.includes('503')) {
        return { message: "Server Gemini sedang sibuk. Mencoba lagi...", type: 'server', waitTime: 5000 };
    }
    if (errorMsg.includes('404') || errorMsg.includes('Model tidak tersedia') || errorMsg.includes('not found')) {
        return { message: "Model tidak tersedia. Periksa kembali nama model atau hak akses API key.", type: 'model' };
    }
    return { message: "Terjadi kesalahan. Silakan coba lagi dalam beberapa saat.", type: 'general', waitTime: 3000 };
}

/**
 * Fetch user's environmental activities data from Firestore
 * @returns {Promise<Object>} User data context
 */
async function getUserDataContext() {
    try {
        console.log('📊 Fetching user data context from Firestore...');
        
        // Get recent activities and stats
        const [activities, stats] = await Promise.all([
            getUserActivities(10).catch(err => {
                console.warn('Could not fetch activities:', err);
                return [];
            }),
            getActivityStats().catch(err => {
                console.warn('Could not fetch stats:', err);
                return null;
            })
        ]);

        if (!activities || activities.length === 0) {
            console.log('No activities data available');
            return null;
        }

        // Format activities data
        const activitiesContext = activities.map((act, index) => ({
            no: index + 1,
            type: act.activityType,
            material: act.materialType,
            amount: `${act.amount} ${act.unit}`,
            action: act.action,
            economicValue: `Rp ${act.economicValue?.toLocaleString()}`,
            ecoScore: act.ecoScore,
            date: act.timestamp || act.createdAt,
            notes: act.notes || '-'
        }));

        const context = {
            hasData: true,
            totalActivities: stats?.totalActivities || activities.length,
            recentActivities: activitiesContext,
            stats: stats ? {
                totalWaste: `${stats.totalWasteAmount} kg`,
                totalEconomicValue: `Rp ${stats.totalEconomicValue?.toLocaleString()}`,
                averageEcoScore: stats.averageEcoScore,
                breakdown: stats.activityBreakdown
            } : null
        };

        console.log('✅ User data context fetched:', context);
        return context;

    } catch (error) {
        console.error('❌ Error fetching user data context:', error);
        return null;
    }
}

// Main function to get chat response
export async function getChatResponse(prompt, chatHistory = [], retryCount = 0) {
    try {
        console.log('🤖 Starting Gemini API call...');
        console.log('📝 Message:', prompt);
        console.log('📊 Daily requests:', dailyRequestCount);
        
        await checkRateLimit();

        const model = await getModelWithFallback();
        console.log('✅ Using model:', model);
        // generation config (bounded for free tier)
        const generationConfig = {
            temperature: appConfig.temperature || 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: Math.min(appConfig.maxTokens || 1024, 1024),
        };

        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ];

        // Fetch user data context from Firestore
        const userContext = await getUserDataContext();
        
        let systemPrompt = `Anda adalah AI asisten ahli Green Accounting dan Konsultan Lingkungan untuk UMKM. Anda membantu pengguna dalam:

1. **Kalkulasi Limbah & Nilai Ekonomi:**
   - Menghitung nilai ekonomi dari limbah
   - Menganalisis potensi pengolahan limbah
   - Memberikan saran strategi waste management

2. **Konsultasi Green Accounting:**
   - Analisis dampak lingkungan bisnis
   - Saran penghematan energi dan sumber daya
   - Strategi sustainability untuk UMKM

3. **Analisis Profit dari Pengolahan Limbah:**
   - Identifikasi produk yang bisa dibuat dari limbah
   - Kalkulasi ROI pengolahan limbah
   - Saran bisnis circular economy

4. **Panduan Praktis:**
   - Cara mengurangi waste production
   - Teknik recycling dan upcycling
   - Implementasi green practices

Berikan jawaban yang:
- Praktis dan mudah diterapkan untuk UMKM
- Berdasarkan data dan fakta lingkungan
- Menggunakan contoh nyata dari industri
- Ramah dan mendukung
- Fokus pada profitabilitas dan sustainability`;

        // Add user data context if available
        if (userContext && userContext.hasData) {
            systemPrompt += `\n\n**DATA AKTIVITAS PENGGUNA YANG SUDAH DIINPUT:**\n`;
            systemPrompt += `Total Aktivitas: ${userContext.totalActivities}\n`;
            
            if (userContext.stats) {
                systemPrompt += `\nStatistik:\n`;
                systemPrompt += `- Total Limbah Dikelola: ${userContext.stats.totalWaste}\n`;
                systemPrompt += `- Total Nilai Ekonomi: ${userContext.stats.totalEconomicValue}\n`;
                systemPrompt += `- Rata-rata Eco-Score: ${userContext.stats.averageEcoScore}\n`;
            }
            
            systemPrompt += `\nAktivitas Terbaru (10 terakhir):\n`;
            userContext.recentActivities.forEach((act, index) => {
                systemPrompt += `${index + 1}. ${act.material} (${act.type}) - ${act.amount}, ${act.action}\n`;
                systemPrompt += `   Nilai Ekonomi: ${act.economicValue}, Eco-Score: ${act.ecoScore}\n`;
                if (act.notes && act.notes !== '-') {
                    systemPrompt += `   Catatan: ${act.notes}\n`;
                }
            });
            
            systemPrompt += `\n**PENTING:** Gunakan data aktivitas di atas untuk memberikan analisis dan rekomendasi yang lebih personal dan relevan. Jika user menanyakan tentang data mereka, histori, atau minta analisis, langsung gunakan data ini tanpa perlu user menjelaskan lagi.`;
        }
        
        systemPrompt += `\n\nJawab dalam bahasa Indonesia yang natural dan mudah dipahami.`;

        const history = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Baik, saya siap membantu Anda dengan konsultasi Green Accounting dan analisis limbah untuk UMKM. Saya bisa membantu menghitung nilai ekonomi limbah, memberikan saran pengolahan, dan menganalisis potensi profit dari circular economy." }] },
            ...chatHistory.slice(-8)
        ];

        const chat = model.startChat({
            generationConfig,
            safetySettings,
            history: history
        });

        let result, response, text;

        try {
            console.log('🔄 Sending message to Gemini with chat...');
            result = await chat.sendMessage(prompt);
            response = await result.response;
            text = response.text();
            console.log('✅ Response received from chat:', text);

            if (!text || text.trim() === '') {
                console.log('Empty response from chat, attempting fallback generation...');
                if (response.candidates && response.candidates[0]) {
                    const candidate = response.candidates[0];
                    if (candidate.finishReason === 'SAFETY') {
                        return "Maaf, respons diblokir oleh filter keamanan. Coba ajukan pertanyaan dengan cara yang berbeda.";
                    }
                }
                const directResult = await model.generateContent(prompt);
                const directResponse = await directResult.response;
                text = directResponse.text();
                console.log('Response from direct generation fallback:', text);
            }
        } catch (chatError) {
            console.warn('Chat method failed, trying direct generation:', chatError?.message || chatError);
            const directResult = await model.generateContent(prompt);
            const directResponse = await directResult.response;
            text = directResponse.text();
            console.log('Response from fallback direct generation:', text);
        }

        if (!text || text.trim() === '') {
            console.warn('Still empty response after all attempts');
            return "Maaf, saya tidak dapat memberikan respons saat ini. Silakan coba dengan pertanyaan yang lebih spesifik.";
        }

        console.log(`📊 Requests today: ${dailyRequestCount}/${FREE_TIER_LIMITS.DAILY}`);
        return text.trim();

    } catch (error) {
        console.error('❌ Error getting chat response:', error);
        console.error('❌ Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        // Check for specific API key errors
        if (error.message.includes('API_KEY') || error.message.includes('403')) {
            console.error('❌ API Key Error - Check your Gemini API key');
            return "❌ Error: API Key tidak valid atau tidak aktif. Silakan periksa konfigurasi API key di config.js";
        }
        
        // Check for quota errors
        if (error.message.includes('quota') || error.message.includes('429')) {
            console.error('❌ Quota Error - Daily limit exceeded');
            return "❌ Error: Kuota harian AI telah habis. Silakan coba lagi besok atau upgrade ke paket berbayar.";
        }
        
        const errorInfo = getErrorMessage(error);

        if (errorInfo.type === 'quota' || errorInfo.type === 'server') {
            if (retryCount < MAX_RETRIES) {
                const waitTime = errorInfo.waitTime * (retryCount + 1);
                console.log(`🔄 Retrying in ${waitTime}ms... (${retryCount + 1}/${MAX_RETRIES})`);
                await delay(waitTime);
                return getChatResponse(prompt, chatHistory, retryCount + 1);
            }
        }
        return errorInfo.message;
    }
}

export async function getResponseWithContext(context, prompt, chatHistory = []) {
    try {
        await checkRateLimit();
        const model = await getModelWithFallback();

        const generationConfig = {
            temperature: 0.6,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 1024,
        };

        const limitedContext = context.substring(0, 2000) + (context.length > 2000 ? '...' : '');

        const contextPrompt = `Berdasarkan dokumen/konten berikut:

${limitedContext}

Pertanyaan: ${prompt}

Berikan analisis yang komprehensif dan praktis berdasarkan konten tersebut. Fokus pada insights yang berguna dan actionable.`;

        const chat = model.startChat({
            generationConfig,
            history: chatHistory.slice(-6)
        });

        const result = await chat.sendMessage(contextPrompt);
        const response = await result.response;
        const text = response.text();

        return text.trim();

    } catch (error) {
        console.error('❌ Error getting context response:', error);
        const errorInfo = getErrorMessage(error);
        return errorInfo.message;
    }
}

// =============================
// Waste Analysis Functions
// =============================

/**
 * Analisis limbah dan berikan saran pengolahan
 * @param {Object} wasteData - Data limbah dari user
 * @returns {Promise<Object>} - Analisis dan saran
 */
export async function analyzeWasteData(wasteData) {
    try {
        const analysisPrompt = `
Sebagai konsultan Green Accounting, analisis data limbah berikut:

**Data Limbah:**
- Jenis: ${wasteData.materialType}
- Jumlah: ${wasteData.amount} ${wasteData.unit}
- Aksi: ${wasteData.action}
- Biaya: Rp ${wasteData.cost || 0}
- Catatan: ${wasteData.notes || 'Tidak ada'}

**Berikan analisis dalam format JSON:**
{
    "economicValue": {
        "currentValue": "Nilai ekonomi saat ini",
        "potentialValue": "Nilai ekonomi potensial",
        "savings": "Penghematan yang bisa dicapai"
    },
    "processingOptions": [
        {
            "method": "Metode pengolahan",
            "description": "Deskripsi metode",
            "investment": "Investasi yang dibutuhkan",
            "profit": "Potensi profit",
            "roi": "ROI dalam persen",
            "timeline": "Waktu implementasi"
        }
    ],
    "productSuggestions": [
        {
            "product": "Nama produk",
            "description": "Deskripsi produk",
            "marketPrice": "Harga pasar",
            "productionCost": "Biaya produksi",
            "profitMargin": "Margin profit"
        }
    ],
    "recommendations": [
        "Rekomendasi praktis 1",
        "Rekomendasi praktis 2",
        "Rekomendasi praktis 3"
    ],
    "nextSteps": [
        "Langkah selanjutnya 1",
        "Langkah selanjutnya 2",
        "Langkah selanjutnya 3"
    ]
}

Berikan analisis yang praktis dan bisa diterapkan untuk UMKM.`;

        const response = await getChatResponse(analysisPrompt);
        
        // Parse JSON response
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.warn('Failed to parse JSON response:', parseError);
        }

        // Fallback jika parsing gagal
        return {
            economicValue: {
                currentValue: "Analisis sedang diproses",
                potentialValue: "Potensi nilai ekonomi sedang dianalisis",
                savings: "Penghematan sedang dihitung"
            },
            processingOptions: [],
            productSuggestions: [],
            recommendations: ["Analisis sedang diproses", "Silakan tunggu sebentar"],
            nextSteps: ["Analisis sedang diproses"],
            rawResponse: response
        };

    } catch (error) {
        console.error('❌ Error analyzing waste data:', error);
        throw new Error(`Gagal menganalisis data limbah: ${error.message}`);
    }
}

/**
 * Kalkulasi nilai ekonomi limbah
 * @param {Object} wasteData - Data limbah
 * @returns {Object} - Kalkulasi nilai ekonomi
 */
export function calculateWasteEconomicValue(wasteData) {
    const amount = parseFloat(wasteData.amount) || 0;
    const materialType = wasteData.materialType;
    const action = wasteData.action;
    
    // Base prices per kg untuk berbagai material
    const basePrices = {
        'plastic': {
            'recycled': 3000,
            'reused': 2500,
            'reduced': 2000,
            'disposed': 500,
            'conserved': 4000
        },
        'paper': {
            'recycled': 2000,
            'reused': 1500,
            'reduced': 1000,
            'disposed': 200,
            'conserved': 3000
        },
        'metal': {
            'recycled': 5000,
            'reused': 4000,
            'reduced': 3000,
            'disposed': 1000,
            'conserved': 6000
        },
        'organic': {
            'recycled': 1500,
            'reused': 1000,
            'reduced': 800,
            'disposed': 100,
            'conserved': 2000
        },
        'electricity': {
            'conserved': 1500,
            'reduced': 1000,
            'reused': 800,
            'recycled': 600,
            'disposed': 0
        },
        'water': {
            'conserved': 500,
            'reduced': 300,
            'reused': 200,
            'recycled': 150,
            'disposed': 0
        }
    };

    const materialPrices = basePrices[materialType] || {
        'recycled': 1000,
        'reused': 800,
        'reduced': 600,
        'disposed': 100,
        'conserved': 1200
    };

    const basePrice = materialPrices[action] || 1000;
    const currentValue = Math.round(amount * basePrice);
    
    // Potensi nilai jika diolah lebih lanjut
    const potentialMultiplier = {
        'plastic': 2.5,
        'paper': 2.0,
        'metal': 3.0,
        'organic': 1.8,
        'electricity': 1.5,
        'water': 1.3
    };

    const multiplier = potentialMultiplier[materialType] || 2.0;
    const potentialValue = Math.round(currentValue * multiplier);
    const savings = potentialValue - currentValue;

    return {
        currentValue,
        potentialValue,
        savings,
        basePrice,
        multiplier
    };
}

/**
 * Generate saran produk dari limbah
 * @param {Object} wasteData - Data limbah
 * @returns {Array} - Array saran produk
 */
export function generateProductSuggestions(wasteData) {
    const materialType = wasteData.materialType;
    const amount = parseFloat(wasteData.amount) || 0;

    const productSuggestions = {
        'plastic': [
            {
                product: 'Ecobrick',
                description: 'Bata ramah lingkungan dari botol plastik',
                marketPrice: 15000,
                productionCost: 5000,
                profitMargin: 200,
                materials: 'Botol plastik + sampah organik'
            },
            {
                product: 'Pot Tanaman',
                description: 'Pot tanaman dari botol plastik bekas',
                marketPrice: 25000,
                productionCost: 8000,
                profitMargin: 212,
                materials: 'Botol plastik besar'
            },
            {
                product: 'Tas Belanja',
                description: 'Tas belanja dari plastik daur ulang',
                marketPrice: 35000,
                productionCost: 15000,
                profitMargin: 133,
                materials: 'Kantong plastik bekas'
            }
        ],
        'paper': [
            {
                product: 'Kertas Daur Ulang',
                description: 'Kertas baru dari kertas bekas',
                marketPrice: 12000,
                productionCost: 6000,
                profitMargin: 100,
                materials: 'Kertas bekas + air'
            },
            {
                product: 'Buku Catatan',
                description: 'Buku catatan dari kertas daur ulang',
                marketPrice: 25000,
                productionCost: 12000,
                profitMargin: 108,
                materials: 'Kertas bekas + binding'
            },
            {
                product: 'Kemasan Produk',
                description: 'Kemasan ramah lingkungan',
                marketPrice: 8000,
                productionCost: 3000,
                profitMargin: 167,
                materials: 'Kertas bekas + printing'
            }
        ],
        'organic': [
            {
                product: 'Kompos',
                description: 'Pupuk organik dari sampah organik',
                marketPrice: 10000,
                productionCost: 3000,
                profitMargin: 233,
                materials: 'Sampah organik + waktu'
            },
            {
                product: 'Biogas',
                description: 'Energi biogas dari sampah organik',
                marketPrice: 5000,
                productionCost: 2000,
                profitMargin: 150,
                materials: 'Sampah organik + digester'
            },
            {
                product: 'Pakan Ternak',
                description: 'Pakan ternak dari limbah organik',
                marketPrice: 15000,
                productionCost: 8000,
                profitMargin: 87,
                materials: 'Limbah organik + nutrisi'
            }
        ],
        'metal': [
            {
                product: 'Kerajinan Logam',
                description: 'Kerajinan dari logam bekas',
                marketPrice: 50000,
                productionCost: 20000,
                profitMargin: 150,
                materials: 'Logam bekas + kreativitas'
            },
            {
                product: 'Alat Pertukangan',
                description: 'Alat pertukangan dari logam daur ulang',
                marketPrice: 75000,
                productionCost: 35000,
                profitMargin: 114,
                materials: 'Logam bekas + finishing'
            }
        ]
    };

    const suggestions = productSuggestions[materialType] || [
        {
            product: 'Produk Daur Ulang',
            description: 'Produk kreatif dari limbah',
            marketPrice: 20000,
            productionCost: 10000,
            profitMargin: 100,
            materials: 'Limbah + kreativitas'
        }
    ];

    // Filter berdasarkan jumlah material yang tersedia
    return suggestions.filter(suggestion => {
        const requiredAmount = suggestion.materials.includes('besar') ? 5 : 1;
        return amount >= requiredAmount;
    });
}

export function getQuotaStatus() {
    return {
        dailyUsed: dailyRequestCount,
        dailyLimit: FREE_TIER_LIMITS.DAILY,
        remaining: FREE_TIER_LIMITS.DAILY - dailyRequestCount,
        resetTime: 'midnight UTC'
    };
}

// Export functions for window access
window.getChatResponse = getChatResponse;
window.getResponseWithContext = getResponseWithContext;
window.getQuotaStatus = getQuotaStatus;
window.analyzeWasteData = analyzeWasteData;
window.calculateWasteEconomicValue = calculateWasteEconomicValue;
window.generateProductSuggestions = generateProductSuggestions;
window.getUserDataContext = getUserDataContext;

// Export for module usage
export { getUserDataContext };

console.log('✅ Improved Gemini service module loaded (2.0-flash prioritized)');
console.log(`📊 Current quota: ${dailyRequestCount}/${FREE_TIER_LIMITS.DAILY} requests used today`);
