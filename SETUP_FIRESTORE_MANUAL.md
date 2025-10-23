# 🔥 Setup Firestore - Panduan Manual

## Metode 1: Firebase Console (Recommended - Paling Mudah)

### Step 1: Login & Buka Project

1. Buka browser: https://console.firebase.google.com/
2. Login dengan Google Account
3. Pilih project: **greenomics-7639d**

### Step 2: Enable Firestore Database

1. Sidebar kiri → Klik **"Firestore Database"**
2. Jika belum ada, klik **"Create database"**
   - Mode: **Production mode**
   - Location: **asia-southeast2 (Jakarta)** atau terdekat
   - Klik **"Enable"**

### Step 3: Buat Collection

1. Klik **"Start collection"**
2. Collection ID: **`environmental_activities`**
3. Klik **"Next"**
4. Document pertama (dummy):
   - Document ID: Auto-ID
   - Field: `test` | Type: `string` | Value: `test`
5. Klik **"Save"**

### Step 4: Setup Security Rules

1. Tab **"Rules"** (di bagian atas)
2. Hapus semua isi yang ada
3. Copy-paste rules dari file `config/firestore.rules`
4. Atau copy dari bawah ini:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email in [
               'admin@greenomics.com',
               'revandjethrosetiawan@gmail.com'
             ];
    }

    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || isAdmin());
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
                       (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }

    match /environmental_activities/{activityId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null &&
                      request.resource.data.userId == request.auth.uid &&
                      request.resource.data.userEmail == request.auth.token.email;
      allow update: if request.auth != null && 
                       (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if request.auth != null && 
                       (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    match /userStats/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    match /chatHistory/{chatId} {
      allow create: if request.auth != null &&
                    request.resource.data.userId == request.auth.uid;
      allow read, delete: if request.auth != null &&
                          resource.data.userId == request.auth.uid;
    }
    
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (request.auth.uid == resource.data.authorId || isAdmin());
    }
  }
}
```

5. Klik **"Publish"**
6. Tunggu "Rules published successfully"

✅ **DONE!** Firestore siap digunakan.

---

## Metode 2: Firebase CLI (Advanced)

### Prerequisites:

```bash
# Install Node.js terlebih dahulu dari: https://nodejs.org/
# Kemudian install Firebase CLI
npm install -g firebase-tools
```

### Step 1: Login

```bash
firebase login
```

Browser akan terbuka, login dengan Google Account.

### Step 2: Initialize Project (Jika Belum)

```bash
cd C:\Users\USER\Documents\GREENOMICS\Greenomics
firebase init
```

- Pilih: **Firestore** (space untuk select, enter untuk confirm)
- Pilih: **Use an existing project**
- Pilih: **greenomics-7639d**
- Firestore rules file: `config/firestore.rules` (atau tekan enter)
- Firestore indexes: (tekan enter)

### Step 3: Deploy Rules

```bash
firebase deploy --only firestore:rules
```

Tunggu hingga muncul:
```
✔  Deploy complete!
```

---

## Verifikasi Setup Berhasil

### 1. Cek di Firebase Console

1. Buka: https://console.firebase.google.com/project/greenomics-7639d/firestore
2. Anda harus melihat:
   - ✅ Collection: `environmental_activities`
   - ✅ Tab "Rules" menunjukkan rules yang sudah dipublish

### 2. Test dari Aplikasi

1. Buka aplikasi Greenomics: http://127.0.0.1:8080
2. Login dengan Google
3. Navigasi ke **Input Data**
4. Isi form:
   - Jenis Aktivitas: Pengelolaan Limbah
   - Material: Plastik
   - Jumlah: 50
   - Unit: kg
   - Aksi: Daur Ulang
   - Catatan: Test input
5. Klik **"Hitung Nilai Ekonomi"**
6. Jika berhasil:
   - ✅ Notifikasi hijau muncul
   - ✅ Data muncul di "Aktivitas Terbaru"
   - ✅ Stats terupdate

### 3. Verifikasi Data di Firestore

1. Kembali ke Firebase Console → Firestore Database
2. Klik collection **environmental_activities**
3. Anda harus melihat document baru dengan data:
   - userId
   - userEmail
   - activityType: "waste"
   - materialType: "plastic"
   - amount: 50
   - dll.

---

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Solusi:**
- Pastikan sudah login di aplikasi
- Cek rules sudah di-publish
- Refresh browser

### Error: "PERMISSION_DENIED"

**Solusi:**
```bash
# Re-deploy rules
firebase deploy --only firestore:rules
```

Atau update manual di Firebase Console → Rules → Publish

### Collection tidak terlihat

**Solusi:**
- Create collection manual di Firebase Console
- Atau submit form di aplikasi (collection akan auto-create)

### Data tidak tersimpan

**Cek:**
1. Browser Console (F12) - lihat error
2. Network tab - cek request ke Firestore
3. Rules di Firebase Console
4. User sudah login

---

## Struktur Data yang Tersimpan

```javascript
// Collection: environmental_activities
{
  "userId": "abc123xyz",              // Auto dari auth.currentUser.uid
  "userEmail": "user@example.com",     // Auto dari auth.currentUser.email
  "userName": "John Doe",              // Auto dari auth.currentUser.displayName
  
  "activityType": "waste",             // Dari form
  "materialType": "plastic",           // Dari form
  "amount": 50,                        // Dari form
  "unit": "kg",                        // Dari form
  "action": "recycled",                // Dari form
  "notes": "Plastik kemasan",          // Dari form (optional)
  
  "economicValue": 225000,             // Auto-calculated
  "ecoScore": 8,                       // Auto-calculated
  
  "createdAt": Timestamp,              // Auto dari serverTimestamp()
  "updatedAt": Timestamp,              // Auto dari serverTimestamp()
  "timestamp": "2025-01-23T..."        // Auto dari new Date()
}
```

---

## Test Connection

Buka file: `test-firebase-input.html`

Test otomatis:
1. Auth status
2. Save activity
3. Load activities
4. Calculate stats

---

## Checklist Setup

- [ ] Firebase Console dibuka
- [ ] Project greenomics-7639d dipilih
- [ ] Firestore Database enabled
- [ ] Collection `environmental_activities` dibuat
- [ ] Security rules di-publish
- [ ] Test input dari aplikasi
- [ ] Data berhasil tersimpan
- [ ] Data terlihat di Firebase Console

✅ Jika semua checked, setup berhasil!

---

## Support

Jika masih ada masalah:
1. Screenshot error di browser console
2. Cek tab Network di DevTools
3. Verifikasi rules di Firebase Console
4. Pastikan user sudah login

**Email admin project:** revandjethrosetiawan@gmail.com

