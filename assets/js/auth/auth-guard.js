import { auth } from "../../../config/firebase-init.js";

// Hide content initially
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.style.opacity = '0';
        appContainer.style.visibility = 'hidden';
    }
});

auth.onAuthStateChanged(function(user) {
    console.log('Auth state changed. User:', user);
    const appContainer = document.getElementById('app-container');
    
    if (!user) {
        const currentPath = window.location.pathname;
        console.log('Current path:', currentPath);
        if (currentPath !== '/pages/auth/login.html' && currentPath !== '/pages/auth/register.html') {
            console.log('Redirecting to login...');
            window.location.href = '/pages/auth/login.html';
        } else {
            // Show content on login/register pages
            if (appContainer) {
                appContainer.style.opacity = '1';
                appContainer.style.visibility = 'visible';
            }
        }
    } else {
        console.log('User logged in, showing content');
        // Show content for authenticated users
        if (appContainer) {
            appContainer.style.opacity = '1';
            appContainer.style.visibility = 'visible';
        }
    }
});