# Firebase Authentication Debug Guide

## Error: "Refused to frame 'https://greenomics-7639d.firebaseapp.com/'"

### Penyebab:
1. **CSP frame-src**: Domain Firebase tidak diizinkan dalam Content Security Policy
2. **Firebase Authorized Domains**: Domain localhost/127.0.0.1 belum ditambahkan di Firebase Console

### Solusi:

#### 1. ✅ Update CSP (Sudah Diperbaiki)
```html
frame-src 'self' https://accounts.google.com https://*.firebaseapp.com;
```

#### 2. 🔧 Tambahkan Authorized Domains di Firebase Console

**Langkah-langkah:**
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project `greenomics-7639d`
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Tambahkan domain berikut:
   - `127.0.0.1` 
   - `localhost`
   - `127.0.0.1:8080` (jika menggunakan port spesifik)
   - `localhost:8080`

#### 3. 🚨 Jika Masih Error - Gunakan CSP Debug

Ganti CSP di `login.html` dengan versi debug dari `csp-debug.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:;
    connect-src 'self' https: http: ws: wss:;
    frame-src 'self' https: http:;
">
```

#### 4. 🔍 Debugging Steps

1. **Buka Developer Tools** (F12)
2. **Cek Console** untuk error CSP
3. **Cek Network tab** untuk failed requests
4. **Test login** dengan CSP debug version
5. **Gradually tighten CSP** setelah login berhasil

#### 5. 📱 Alternative: Gunakan signInWithRedirect

Jika popup masih bermasalah, auth-service.js sudah dikonfigurasi untuk fallback ke redirect:

```javascript
// Otomatis fallback jika popup gagal
if (popupError.code === 'auth/popup-blocked') {
    await signInWithRedirect(this.auth, this.provider);
}
```

### Expected Result:
✅ Login Google berhasil tanpa CSP error
✅ Redirect ke dashboard setelah login
✅ User data tersimpan di Firestore
