// config.js - Versi sederhana tanpa rate limiting untuk debug - Updated: 2025-01-01 14:30
export const firebaseConfig = {
    apiKey: "AIzaSyC7vfSi6iGzWSkyWJTX1lvTG-k8P1HZL9s",
    authDomain: "greenomics-7639d.firebaseapp.com",
    projectId: "greenomics-7639d",
    storageBucket: "greenomics-7639d.firebasestorage.app",
    messagingSenderId: "381392746735",
    appId: "1:381392746735:web:c9873f430a5b04c4f5031a"
};  

// API key yang sudah benar
export const geminiApiKey = "AIzaSyAkIyXZk5Xk36eG4hrQ0aKlRlkg6B5gaw8";

// Konfigurasi aplikasi
export const appConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    maxTokens: 2048,
    temperature: 0.7
};

// Fungsi untuk menampilkan notifikasi
export function showNotification(message, type = 'info') {
    const existingNotif = document.getElementById('api-notification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const colors = {
        success: 'bg-green-100 text-green-800 border-green-200',
        error: 'bg-red-100 text-red-800 border-red-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        info: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    const notificationHTML = `
        <div id="api-notification" class="fixed top-4 right-4 z-50 ${colors[type]} border rounded-lg p-4 shadow-lg max-w-sm">
            <div class="flex items-center justify-between">
                <p class="text-sm font-medium">${message}</p>
                <button onclick="document.getElementById('api-notification').remove()" class="ml-3 text-lg leading-none">&times;</button>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', notificationHTML);
    
    setTimeout(() => {
        const notif = document.getElementById('api-notification');
        if (notif) notif.remove();
    }, 5000);
}

// Test koneksi API sederhana
async function testAPIConnection() {
    try {
        console.log('Testing API connection...');
        
        if (!geminiApiKey || geminiApiKey === "PASTE_API_KEY_BARU_DISINI") {
            console.error('API key belum diset!');
            showNotification('API key belum diset. Generate di https://aistudio.google.com/app/apikey', 'error');
            return;
        }
        
        const { getChatResponse } = await import('/assets/js/core/gemini-service.js');
        const response = await getChatResponse("Halo");
        
        if (response && !response.includes('Error:') && !response.includes('Maaf') && !response.includes('gangguan')) {
            console.log('API connection successful');
            showNotification('API Gemini berhasil terhubung!', 'success');
        } else {
            console.warn('API responded but with issues');
            showNotification('API terhubung tetapi ada masalah kecil.', 'warning');
        }
        
    } catch (error) {
        console.error('API connection failed:', error);
        showNotification('Tidak dapat terhubung ke API Gemini. Periksa API key Anda.', 'error');
    }
}

// Export untuk global access
window.showNotification = showNotification;

// Inisialisasi saat DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Config loaded - simple version');
    
    // Test koneksi API setelah delay
    setTimeout(() => {
        testAPIConnection();
    }, 3000);
});