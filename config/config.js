// config.js - Firebase Configuration untuk Google Login - Updated: 2025-01-01 15:30
export const firebaseConfig = {
    apiKey: "AIzaSyD43R9_h0qZc5TFTrBn_Zt76Il3jDKP7kw",
    authDomain: "greenomics-id.firebaseapp.com",
    projectId: "greenomics-id",
    storageBucket: "greenomics-id.firebasestorage.app",
    messagingSenderId: "5727343643",
    appId: "1:5727343643:web:0b84a6197ee989aa5dd4be"
};

// Gemini API Key
export const geminiApiKey = "AIzaSyBKCLB3d6ucJOMjnShtQogMFh6OHVL2Mck";

// App Configuration
export const appConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    maxTokens: 2048,
    temperature: 0.7
};

// Notification function
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

// Export untuk global access
window.showNotification = showNotification;