# 🚀 Deploy Firestore Rules - Panduan Cepat

## ✅ Langkah-Langkah Deploy Rules

### 1️⃣ Install Firebase CLI (Jika Belum)

```bash
npm install -g firebase-tools
```

### 2️⃣ Login ke Firebase

```bash
firebase login
```

Ikuti instruksi di browser untuk login dengan akun Google yang digunakan untuk project Greenomics.

### 3️⃣ Inisialisasi Project (Jika Belum)

```bash
firebase init
```

- Pilih **Firestore**
- Pilih **Use an existing project**
- Pilih project: **greenomics-7639d**
- Firestore rules file: **config/firestore.rules**
- Firestore indexes file: (tekan enter untuk default)

### 4️⃣ Deploy Rules

```bash
firebase deploy --only firestore:rules
```

Atau dari root directory project:

```bash
cd C:\Users\USER\Documents\GREENOMICS\Greenomics
firebase deploy --only firestore:rules
```

### 5️⃣ Verifikasi Deploy

Setelah deploy berhasil, Anda akan melihat pesan:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/greenomics-7639d/overview
```

### 6️⃣ Cek di Firebase Console

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project **greenomics-7639d**
3. Navigasi ke **Firestore Database** → **Rules**
4. Verifikasi rules sudah terupdate

---

## 📋 Isi Rules yang Sudah Dikonfigurasi

Rules untuk `environmental_activities` collection:

```javascript
// Environmental Activities - Aktivitas Lingkungan
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
```

**Keamanan:**
- ✅ User hanya bisa baca data milik sendiri
- ✅ User hanya bisa create dengan userId yang sesuai
- ✅ User hanya bisa update/delete data sendiri
- ✅ Admin bisa akses semua data

---

## 🧪 Test Rules

Setelah deploy, test dengan:

1. **Login ke aplikasi** dengan Google Auth
2. **Buka halaman Input Data** (materi.html)
3. **Isi form** dan submit aktivitas
4. **Cek di Firebase Console** → Firestore Database → environmental_activities

Anda seharusnya melihat data tersimpan dengan struktur:
- userId: (UID Anda)
- userEmail: (Email Anda)
- activityType, materialType, amount, dll.

---

## ❌ Troubleshooting

### Error: "Command not found: firebase"

```bash
# Install ulang Firebase CLI
npm install -g firebase-tools

# Atau gunakan npx
npx firebase-tools deploy --only firestore:rules
```

### Error: "Permission denied"

Pastikan Anda login dengan akun yang memiliki akses ke project:

```bash
firebase logout
firebase login
```

### Error: "Project not found"

```bash
# Cek project list
firebase projects:list

# Pilih project yang benar
firebase use greenomics-7639d
```

---

## 📝 Catatan Penting

⚠️ **JANGAN** edit rules langsung di Firebase Console  
⚠️ **SELALU** edit di file `config/firestore.rules`  
⚠️ **DEPLOY** setiap kali ada perubahan rules  

Ini memastikan:
- Version control dengan Git
- Konsistensi antara development dan production
- Backup rules di source code

---

## ✅ Checklist Deploy

- [ ] Firebase CLI sudah terinstall
- [ ] Login dengan akun yang benar
- [ ] File `config/firestore.rules` sudah ada dan benar
- [ ] Deploy berhasil tanpa error
- [ ] Verifikasi di Firebase Console
- [ ] Test create data dari aplikasi
- [ ] Test read data dari aplikasi
- [ ] Data tersimpan dengan benar

---

**Deploy berhasil?** 🎉  
Sekarang data aktivitas lingkungan akan tersimpan ke Firebase Firestore!

