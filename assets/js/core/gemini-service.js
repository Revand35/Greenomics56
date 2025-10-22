// gemini-service.js - Prioritize gemini-2.0-flash with safe fallbacks
import { geminiApiKey, appConfig } from "../../../config/config.js";

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

// Main function to get chat response
export async function getChatResponse(prompt, chatHistory = [], retryCount = 0) {
    try {
        await checkRateLimit();

        const model = await getModelWithFallback();
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

        const systemPrompt = `Anda adalah AI asisten yang ahli dalam moral intelligence dan pengembangan karakter. Anda membantu pengguna memahami 7 aspek moral intelligence: Empati, Hati Nurani, Pengendalian Diri, Hormat, Kebaikan Hati, Toleransi, dan Keadilan.

Berikan jawaban yang:
- Praktis dan mudah dipahami
- Berdasarkan teori moral intelligence yang solid
- Menggunakan contoh nyata dari kehidupan sehari-hari
- Mendorong refleksi dan pengembangan diri
- Ramah dan mendukung

Jawab dalam bahasa Indonesia yang natural dan mudah dipahami.`;

        const history = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Baik, saya siap membantu Anda dengan topik moral intelligence dan pengembangan karakter." }] },
            ...chatHistory.slice(-8)
        ];

        const chat = model.startChat({
            generationConfig,
            safetySettings,
            history: history
        });

        let result, response, text;

        try {
            console.log('Sending message to Gemini with chat...');
            result = await chat.sendMessage(prompt);
            response = await result.response;
            text = response.text();
            console.log('Response received from chat:', text);

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

export function getQuotaStatus() {
    return {
        dailyUsed: dailyRequestCount,
        dailyLimit: FREE_TIER_LIMITS.DAILY,
        remaining: FREE_TIER_LIMITS.DAILY - dailyRequestCount,
        resetTime: 'midnight UTC'
    };
}

window.getChatResponse = getChatResponse;
window.getResponseWithContext = getResponseWithContext;
window.getQuotaStatus = getQuotaStatus;

console.log('✅ Improved Gemini service module loaded (2.0-flash prioritized)');
console.log(`📊 Current quota: ${dailyRequestCount}/${FREE_TIER_LIMITS.DAILY} requests used today`);
