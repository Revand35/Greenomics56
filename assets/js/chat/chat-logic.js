// chat-logic.js - FINAL
import { getChatResponse, getResponseWithContext, analyzeWasteData, calculateWasteEconomicValue, generateProductSuggestions } from '../core/gemini-service.js';
import {
  saveChatToFirestore,
  getChatHistoryFromFirestore,
  deleteChatHistoryItem
} from './chat-firestore-service.js';
import { auth } from '../../../config/firebase-init.js';
import { getActivitiesFromLocalStorage, getInputHistory } from '../core/local-storage-service.js';

// =============================
// State
// =============================
let fileContext = null;
let chatHistory = [];
let isProcessing = false;

// =============================
// Helpers: waktu & format
// =============================
function _timeValue(item) {
  if (!item) return 0;
  if (item.createdAt && typeof item.createdAt.toDate === 'function') {
    return item.createdAt.toDate().getTime();
  }
  if (item.createdAt instanceof Date) return item.createdAt.getTime();
  if (typeof item.createdAt === 'number') return item.createdAt;
  if (item.timestamp) {
    const t = Date.parse(item.timestamp);
    if (!isNaN(t)) return t;
  }
  return 0;
}
function _formatTimestampForBubble(item) {
  let ts = null;
  if (item?.createdAt?.toDate) ts = item.createdAt.toDate();
  else if (item?.timestamp) ts = new Date(item.timestamp);
  else if (item?.createdAt instanceof Date) ts = item.createdAt;
  else if (typeof item === 'number') ts = new Date(item);
  else ts = new Date();
  return ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// =============================
// Load history (Firestore / Local)
// =============================
export async function loadChatHistoryOnStartup() {
  const chatContainer = document.getElementById('chat-messages');
  if (!chatContainer) return;

  let chats = [];
  try {
    if (auth?.currentUser) {
      chats = await getChatHistoryFromFirestore(200);
    } else {
      chats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    }
  } catch (err) {
    console.error('❌ Gagal ambil history chat:', err);
  }

  if (!Array.isArray(chats) || chats.length === 0) {
    console.log('ℹ️ Tidak ada riwayat chat.');
    return;
  }

  chats.sort((a, b) => _timeValue(a) - _timeValue(b));

  chatHistory = chats.map(c => ({
    role: c.role === 'user' ? 'user' : 'model',
    parts: [{ text: c.message }]
  }));
  

  chats.forEach((c) => {
    const role = (c.role === 'user') ? 'user' : 'ai';
    const text = c.message ?? (c.parts ? c.parts.map(p => p.text).join(' ') : '');
    addMessageToChat(text, role, false, _formatTimestampForBubble(c));
  });

  scrollToBottom();
}

// =============================
// Setup listeners
// =============================
export function setupChatListeners() {
  const sendButton = document.getElementById('send-chat-btn');
  const chatInput = document.getElementById('chat-input');

  if (sendButton) sendButton.addEventListener('click', handleSendClick);

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendClick();
      }
    });
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = `${Math.min(chatInput.scrollHeight, 120)}px`;
    });
  }

  const fileUploadButton = document.getElementById('file-upload-button');
  const fileInput = document.getElementById('file-input');
  if (fileUploadButton) fileUploadButton.addEventListener('click', () => fileInput.click());
  if (fileInput) fileInput.addEventListener('change', handleFileUpload);

  // refresh chat
  document.getElementById('refresh-chat-btn')?.addEventListener('click', async () => {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;

    chatContainer.innerHTML = '';
    chatHistory = []; // Clear in-memory history
    localStorage.removeItem('chatHistory');

    if (auth?.currentUser) {
      try {
        const items = await getChatHistoryFromFirestore(500);
        for (const it of items) {
          if (it.id) await deleteChatHistoryItem(it.id);
        }
        console.log('✅ Chat history berhasil dihapus dari Firestore');
      } catch (err) {
        console.error('❌ Gagal hapus history Firestore:', err);
      }
    }

    addMessageToChat('Riwayat chat telah dihapus. Mulai percakapan baru!', 'ai');
  });

  // Listen for visibility change - reload chat when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const chatContainer = document.getElementById('chat-messages');
      // Only reload if chat container exists and is visible (in chat mode)
      if (chatContainer && document.body.classList.contains('chat-mode')) {
        reloadChatHistory();
      }
    }
  });

  // Listen for page focus - reload chat when window regains focus
  window.addEventListener('focus', () => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer && document.body.classList.contains('chat-mode')) {
      reloadChatHistory();
    }
  });

  loadChatHistoryOnStartup();
}

// =============================
// Reload chat history
// =============================
async function reloadChatHistory() {
  const chatContainer = document.getElementById('chat-messages');
  if (!chatContainer) return;

  // Get current messages count
  const currentMessagesCount = chatContainer.children.length;

  let chats = [];
  try {
    if (auth?.currentUser) {
      chats = await getChatHistoryFromFirestore(200);
    } else {
      chats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    }
  } catch (err) {
    console.error('❌ Gagal reload chat:', err);
    return;
  }

  // Only reload if there are new messages or messages are missing
  if (chats.length !== currentMessagesCount) {
    console.log('🔄 Reloading chat history...');

    // Clear container
    chatContainer.innerHTML = '';

    // Sort by time
    chats.sort((a, b) => _timeValue(a) - _timeValue(b));

    // Rebuild chatHistory for AI context
    chatHistory = chats.map(c => ({
      role: c.role === 'user' ? 'user' : 'model',
      parts: [{ text: c.message }]
    }));

    // Re-render all messages
    chats.forEach((c) => {
      const role = (c.role === 'user') ? 'user' : 'ai';
      const text = c.message ?? (c.parts ? c.parts.map(p => p.text).join(' ') : '');
      addMessageToChat(text, role, false, _formatTimestampForBubble(c));
    });

    scrollToBottom();
  }
}

// =============================
// Tambah pesan ke UI
// =============================
export function addMessageToChat(message, sender = "ai", isLoading = false, fixedTime = null) {
  const chatContainer = document.getElementById("chat-messages");
  if (!chatContainer) return null;

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = fixedTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let messageHTML = "";

  if (sender === "user") {
    messageHTML = `
      <div class="flex items-end justify-end mb-4 space-x-2">
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-none p-4 shadow-lg max-w-2xl">
          <p class="text-sm whitespace-pre-wrap">${escapeHtml(message)}</p>
          <span class="timestamp">${timestamp}</span>
        </div>
        <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.232.72 5.879 1.926M15 12a3 3 0 10-6 0 3 3 0 006 0z"/>
          </svg>
        </div>
      </div>`;
  } else {
    messageHTML = `
      <div id="${messageId}" class="flex items-start mb-4 space-x-2">
        <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="4" y="8" width="16" height="10" rx="2" ry="2"/>
            <line x1="12" y1="4" x2="12" y2="8"/>
            <circle cx="12" cy="3" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
            <line x1="9" y1="16" x2="15" y2="16" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-lg max-w-2xl">
          <div class="text-gray-800 text-sm message-content">
            ${isLoading ? '<div class="dot-flashing"></div>' : formatAIMessage(message)}
          </div>
          <span class="timestamp">${timestamp}</span>
        </div>
      </div>`;
  }

  chatContainer.insertAdjacentHTML("beforeend", messageHTML);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return messageId;
}

function updateMessage(messageId, newText) {
  const messageElement = document.getElementById(messageId);
  if (!messageElement) return;
  const textElement = messageElement.querySelector('.message-content');
  if (textElement) textElement.innerHTML = formatAIMessage(newText);
}

// =============================
// Send & interaction
// =============================
async function handleSendClick() {
  if (isProcessing) return;
  await sendMessage();
}

async function sendMessage() {
  if (isProcessing) return;
  const input = document.getElementById('chat-input');
  if (!input) return;

  const message = input.value.trim();
  if (message === '' && !fileContext) return;

  isProcessing = true;
  input.value = '';
  input.style.height = '48px';

  try {
    if (fileContext) {
      const prompt = message || 'Tolong analisis dokumen ini.';
      await handleChatInteraction(prompt, fileContext);
      clearFileContext();
    } else {
      await handleChatInteraction(message);
    }
  } finally {
    isProcessing = false;
  }
}

// =============================
// Waste Analysis Functions
// =============================

/**
 * Deteksi apakah pesan mengandung request analisis limbah
 * @param {string} message - Pesan user
 * @returns {boolean} - True jika mengandung request analisis limbah
 */
function isWasteAnalysisRequest(message) {
  const wasteKeywords = [
    'analisis limbah', 'hitung limbah', 'nilai ekonomi limbah',
    'olah limbah', 'daur ulang', 'recycle', 'upcycle',
    'profit dari limbah', 'produk dari limbah', 'circular economy',
    'waste management', 'green accounting', 'sustainability',
    'histori data', 'data input', 'aktivitas terbaru', 'data sebelumnya'
  ];
  
  const lowerMessage = message.toLowerCase();
  return wasteKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Ambil data aktivitas terbaru dari Local Storage
 * @returns {Promise<Array>} - Array aktivitas terbaru
 */
async function getRecentWasteData() {
  try {
    const activities = await getActivitiesFromLocalStorage(10);
    return activities.filter(activity => 
      ['waste', 'energy', 'water', 'carbon', 'recycling'].includes(activity.activityType)
    );
  } catch (error) {
    console.error('Error getting recent waste data:', error);
    return [];
  }
}

/**
 * Ambil histori data input untuk konsultasi AI
 * @returns {Promise<Array>} - Array histori data input
 */
async function getInputHistoryData() {
  try {
    const history = await getInputHistory(20);
    return history;
  } catch (error) {
    console.error('Error fetching input history:', error);
    return [];
  }
}

/**
 * Format waktu relatif (time ago)
 * @param {Date} date - Tanggal
 * @returns {string} - Format waktu relatif
 */
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  return `${Math.floor(diffInSeconds / 2592000)} bulan lalu`;
}

/**
 * Generate waste analysis response
 * @param {string} message - Pesan user
 * @returns {Promise<string>} - Response dengan analisis limbah
 */
async function generateWasteAnalysisResponse(message) {
  try {
    // Ambil data aktivitas terbaru dan histori input
    const recentActivities = await getRecentWasteData();
    const inputHistory = await getInputHistoryData();
    
    if (recentActivities.length === 0 && inputHistory.length === 0) {
      return `Saya tidak menemukan data aktivitas limbah terbaru. Silakan input data aktivitas lingkungan terlebih dahulu di halaman "Input Data" untuk mendapatkan analisis yang lebih akurat.

**Untuk mendapatkan analisis limbah yang komprehensif:**
1. Buka halaman "Input Data" 
2. Input aktivitas limbah Anda (plastik, kertas, organik, dll.)
3. Kembali ke sini untuk konsultasi analisis

**Saya tetap bisa membantu dengan:**
- Saran umum pengolahan limbah
- Strategi circular economy
- Tips green accounting untuk UMKM
- Analisis profit dari berbagai jenis limbah`;
    }

    // Analisis data terbaru
    const latestActivity = recentActivities[0];
    const economicValue = calculateWasteEconomicValue(latestActivity);
    const productSuggestions = generateProductSuggestions(latestActivity);
    
    let response = `## 📊 **Analisis Limbah Terbaru Anda**

**Data Terbaru:**
- **Jenis**: ${latestActivity.materialType} (${latestActivity.amount} ${latestActivity.unit})
- **Aksi**: ${latestActivity.action}
- **Nilai Ekonomi Saat Ini**: Rp ${economicValue.currentValue.toLocaleString()}
- **Potensi Nilai**: Rp ${economicValue.potentialValue.toLocaleString()}
- **Potensi Penghematan**: Rp ${economicValue.savings.toLocaleString()}

## 💡 **Saran Produk dari Limbah Anda**

`;

    // Tambahkan histori data input jika ada
    if (inputHistory.length > 0) {
      response += `## 📋 **Histori Data Input Anda**

**Data Input Terbaru (${inputHistory.length} item):**
`;
      
      inputHistory.slice(0, 5).forEach((item, index) => {
        const timeAgo = getTimeAgo(item.timestamp);
        response += `${index + 1}. **${item.summary}** (${timeAgo})\n`;
      });
      
      if (inputHistory.length > 5) {
        response += `... dan ${inputHistory.length - 5} data lainnya\n`;
      }
      
      response += `\n**💡 Tips**: Anda bisa bertanya tentang data spesifik dari histori di atas, misalnya "analisis data plastik 50 kg" atau "saran produk dari data kertas terbaru".\n\n`;
    }

    // Tambahkan saran produk
    productSuggestions.forEach((suggestion, index) => {
      response += `**${index + 1}. ${suggestion.product}**
- **Deskripsi**: ${suggestion.description}
- **Harga Pasar**: Rp ${suggestion.marketPrice.toLocaleString()}
- **Biaya Produksi**: Rp ${suggestion.productionCost.toLocaleString()}
- **Margin Profit**: ${suggestion.profitMargin}%
- **Bahan**: ${suggestion.materials}

`;
    });

    // Tambahkan rekomendasi umum
    response += `## 🎯 **Rekomendasi Strategis**

1. **Implementasi Circular Economy**: Fokus pada pengolahan limbah menjadi produk bernilai tinggi
2. **Partnership dengan Pengolah**: Cari mitra yang bisa mengolah limbah Anda
3. **Diversifikasi Produk**: Kembangkan berbagai produk dari satu jenis limbah
4. **Market Research**: Analisis permintaan pasar untuk produk daur ulang

## 📈 **Potensi ROI**

Dengan mengolah ${latestActivity.amount} ${latestActivity.unit} ${latestActivity.materialType}, Anda berpotensi mendapatkan:
- **ROI**: ${Math.round((economicValue.savings / economicValue.currentValue) * 100)}%
- **Payback Period**: 3-6 bulan (tergantung investasi)
- **Annual Profit**: Rp ${(economicValue.savings * 12).toLocaleString()}

Apakah Anda ingin analisis lebih detail untuk jenis limbah tertentu?`;

    return response;

  } catch (error) {
    console.error('Error generating waste analysis:', error);
    return `Maaf, terjadi error dalam menganalisis data limbah. Silakan coba lagi atau input data aktivitas terlebih dahulu.`;
  }
}

async function handleChatInteraction(prompt, context = null) {
  addMessageToChat(prompt, 'user');
  persistMessage(prompt, 'user');

  const loadingId = addMessageToChat('Sedang berpikir...', 'ai', true);

  try {
    let responseText = '';
    
    // Cek apakah ini request analisis limbah
    if (isWasteAnalysisRequest(prompt)) {
      responseText = await generateWasteAnalysisResponse(prompt);
    } else if (context) {
      responseText = await getResponseWithContext(context, prompt, chatHistory);
    } else {
      responseText = await getChatResponse(prompt, chatHistory);
    }
    
    if (!responseText) responseText = 'Maaf, saya tidak dapat memberikan respons saat ini.';

    updateMessage(loadingId, responseText);
    persistMessage(responseText, 'ai');

    chatHistory.push({ role: 'user', parts: [{ text: prompt }] });
    chatHistory.push({ role: 'model', parts: [{ text: responseText }] });
  } catch (err) {
    console.error('❌ Error:', err);
    updateMessage(loadingId, `Maaf, terjadi kesalahan: ${err.message}`);
  }
}

// =============================
// Persistence
// =============================
function persistMessage(msg, role) {
  // Only save to Firestore if user is logged in
  if (auth?.currentUser) {
    try {
      if (typeof saveChatToFirestore === 'function') {
        const p = saveChatToFirestore(msg, role);
        if (p?.catch) p.catch(err => console.error('saveChatToFirestore failed', err));
      }
    } catch (e) {
      console.warn('firestore save error', e);
    }
  } else {
    // Only save to localStorage if user is NOT logged in
    try {
      const local = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      local.push({ message: msg, role, timestamp: new Date().toISOString() });
      localStorage.setItem('chatHistory', JSON.stringify(local));
    } catch (e) {
      console.warn('local save failed', e);
    }
  }
}

// =============================
// File Upload (PDF)
// =============================
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    addMessageToChat('Maaf, hanya PDF yang didukung.', 'ai');
    return;
  }
  addMessageToChat(`📄 Menganalisis file: ${file.name}...`, 'ai');

  try {
    if (!window.pdfjsLib) await loadPDFLibrary();
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target.result);
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        let textContent = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(s => s.str).join(' ') + '\n';
        }
        fileContext = textContent;
        addMessageToChat(`✅ File "${file.name}" berhasil dimuat.`, 'ai');
      } catch (err) {
        console.error('PDF error:', err);
        addMessageToChat('❌ Gagal membaca PDF.', 'ai');
        clearFileContext();
      }
    };
    reader.readAsArrayBuffer(file);
  } catch (err) {
    console.error('Error PDF:', err);
    addMessageToChat('❌ Gagal memproses file PDF.', 'ai');
    clearFileContext();
  }
  event.target.value = '';
}
async function loadPDFLibrary() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
function clearFileContext() {
  fileContext = null;
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
}

// =============================
// Utils
// =============================
function formatAIMessage(msg) {
  return msg
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function scrollToBottom() {
  const chatContainer = document.getElementById('chat-messages');
  if (chatContainer) {
    setTimeout(() => {
      chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    }, 100);
  }
}

// =============================
// Reload on mode switch (exposed for test-logic.js)
// =============================
window.reloadChatHistoryOnSwitch = async function() {
  await reloadChatHistory();
};

// =============================
// Expose ke window
// =============================
window.setupChatListeners = setupChatListeners;
window.addMessageToChat = addMessageToChat;
window.handleChatInteraction = handleChatInteraction;
window.handleSendClick = handleSendClick;
