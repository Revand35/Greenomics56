# 🎉 Fitur Baru: Penyimpanan Data Input ke Firebase

## 📌 Ringkasan Perubahan

Data input aktivitas lingkungan di halaman **Input Data** (materi.html) sekarang **tersimpan di Firebase Firestore** alih-alih Local Storage.

### ✨ Keuntungan:
- ☁️ **Cloud Storage** - Data tersimpan di cloud, tidak hilang
- 🔄 **Real-time Sync** - Data tersinkronisasi otomatis
- 📱 **Multi-device** - Akses dari berbagai perangkat
- 🔒 **Secure** - Dilindungi dengan Firestore security rules
- 📊 **Scalable** - Dapat menangani banyak data

---

## 📂 File yang Dibuat/Diubah

### ✅ File Baru:

1. **`assets/js/core/environmental-activity-service.js`**
   - Service untuk mengelola data aktivitas di Firestore
   - Fungsi: save, read, update, delete, statistics

2. **`FIREBASE_ENVIRONMENTAL_ACTIVITIES_GUIDE.md`**
   - Dokumentasi lengkap penggunaan sistem
   - API reference
   - Testing guide

3. **`DEPLOY_FIRESTORE_RULES.md`**
   - Panduan deploy Firestore rules
   - Troubleshooting tips

4. **`FITUR_BARU_FIREBASE_INPUT_DATA.md`**
   - File ini (ringkasan perubahan)

### ✏️ File yang Diubah:

1. **`pages/features/materi.html`**
   - Form submission sekarang menyimpan ke Firebase
   - Load data dari Firebase Firestore
   - Update statistics dari Firebase

2. **`config/firestore.rules`**
   - Sudah ada rules untuk `environmental_activities`
   - Security rules sudah dikonfigurasi

---

## 🚀 Cara Deploy

### Langkah 1: Deploy Firestore Rules

```bash
# Install Firebase CLI (jika belum)
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### Langkah 2: Test Aplikasi

1. Login ke aplikasi dengan Google Auth
2. Buka halaman **Input Data** (navigasi dari dashboard)
3. Isi form aktivitas lingkungan
4. Klik **Hitung Nilai Ekonomi**
5. Data akan tersimpan ke Firebase

### Langkah 3: Verifikasi di Firebase Console

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project **greenomics-7639d**
3. Navigasi ke **Firestore Database**
4. Cek collection **environmental_activities**
5. Verifikasi data tersimpan

---

## 📊 Struktur Data di Firestore

### Collection: `environmental_activities`

```javascript
{
  // User Info
  userId: "user_uid",
  userEmail: "user@example.com",
  userName: "User Name",
  
  // Activity Data
  activityType: "waste",        // waste|energy|water|carbon|recycling
  materialType: "plastic",      // plastic|paper|metal|organic|electricity|water
  amount: 50,                   // Number
  unit: "kg",                   // kg|liter|kwh|m3|piece
  action: "recycled",           // recycled|reduced|reused|disposed|conserved
  notes: "Catatan",             // String (optional)
  
  // Calculated Values
  economicValue: 225000,        // Rupiah
  ecoScore: 8,                  // Score 1-10
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  timestamp: "2025-01-23T..."
}
```

---

## 🎯 Fitur yang Tersedia

### 1. Simpan Aktivitas ✅
```javascript
import { saveEnvironmentalActivity } from '../../assets/js/core/environmental-activity-service.js';

const formData = {
  activityType: 'recycling',
  materialType: 'plastic',
  amount: 50,
  unit: 'kg',
  action: 'recycled',
  notes: 'Plastik kemasan'
};

const saved = await saveEnvironmentalActivity(formData);
console.log('Saved:', saved);
```

### 2. Ambil Data Aktivitas ✅
```javascript
import { getUserActivities } from '../../assets/js/core/environmental-activity-service.js';

const activities = await getUserActivities(10); // 10 aktivitas terbaru
console.log('Activities:', activities);
```

### 3. Statistik Agregat ✅
```javascript
import { getActivityStats } from '../../assets/js/core/environmental-activity-service.js';

const stats = await getActivityStats();
console.log('Total activities:', stats.totalActivities);
console.log('Total waste:', stats.totalWasteAmount, 'kg');
console.log('Economic value: Rp', stats.totalEconomicValue);
console.log('Average eco-score:', stats.averageEcoScore);
```

---

## 🔒 Keamanan (Firestore Rules)

Rules yang sudah dikonfigurasi:

```javascript
match /environmental_activities/{activityId} {
  // User hanya bisa baca data sendiri
  allow read: if request.auth != null && 
                 resource.data.userId == request.auth.uid;
  
  // User hanya bisa create dengan userId yang sesuai
  allow create: if request.auth != null &&
                  request.resource.data.userId == request.auth.uid;
  
  // User hanya bisa update/delete data sendiri
  allow update, delete: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
}
```

**Admin** dapat mengakses semua data untuk monitoring.

---

## 🧪 Testing

### Test di Browser Console:

```javascript
// 1. Buka halaman Input Data
// 2. Buka Console (F12)
// 3. Run test:

const testData = {
  activityType: 'recycling',
  materialType: 'plastic',
  amount: 100,
  unit: 'kg',
  action: 'recycled',
  notes: 'Test data'
};

// Import service (jika belum)
import('../../assets/js/core/environmental-activity-service.js')
  .then(module => {
    return module.saveEnvironmentalActivity(testData);
  })
  .then(result => {
    console.log('✅ Success:', result);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
```

---

## 📝 Cara Penggunaan untuk User

### 1. Login
- Buka aplikasi
- Login dengan Google Account

### 2. Navigasi ke Input Data
- Dari dashboard, klik **Input Data** di bottom navigation
- Atau klik card **Input Data** di dashboard

### 3. Isi Form
- **Jenis Aktivitas**: Pilih (Pengelolaan Limbah, Penggunaan Energi, dll)
- **Material/Sumber Daya**: Pilih material (Plastik, Kertas, dll)
- **Jumlah**: Masukkan angka
- **Unit**: Pilih satuan (kg, liter, kWh, dll)
- **Aksi**: Pilih aksi (Daur Ulang, Dikurangi, dll)
- **Biaya**: (Optional) Jika ada biaya khusus
- **Catatan**: (Optional) Catatan tambahan

### 4. Submit
- Klik **Hitung Nilai Ekonomi**
- Tunggu notifikasi sukses
- Data akan muncul di **Aktivitas Terbaru**
- Statistik akan terupdate otomatis

### 5. Lihat Data
- Data tersimpan permanen di Firebase
- Bisa diakses kapan saja dari berbagai perangkat
- Data aman dan terenkripsi

---

## 🎓 Formula Perhitungan

### Nilai Ekonomi:
```
Nilai = Jumlah × Nilai_Base_Material × Multiplier_Aksi
```

**Nilai Base Material:**
- Plastik: Rp 3.000/kg
- Kertas: Rp 2.000/kg
- Logam: Rp 5.000/kg
- Organik: Rp 1.000/kg
- Listrik: Rp 1.500/kWh
- Air: Rp 500/liter

**Multiplier Aksi:**
- Daur Ulang: 1.5x
- Penggunaan Ulang: 1.3x
- Penghematan: 1.4x
- Dikurangi: 1.2x
- Dibuang: 0.5x

### Eco-Score:
```
Base Score (berdasarkan aksi) + Bonus Jumlah
```

**Base Score:**
- Daur Ulang: 8
- Penggunaan Ulang: 7
- Dikurangi: 7
- Penghematan: 6
- Dibuang: 3

**Bonus:**
- ≥ 100 unit: +2
- ≥ 50 unit: +1

**Maximum Score: 10**

---

## ❓ FAQ

### Q: Apakah data akan hilang jika clear browser cache?
**A:** Tidak! Data tersimpan di Firebase cloud, bukan di browser.

### Q: Bisa diakses dari perangkat lain?
**A:** Ya! Login dengan akun Google yang sama.

### Q: Apakah data aman?
**A:** Ya! Dilindungi dengan Firebase security rules dan enkripsi.

### Q: Bisa hapus data lama?
**A:** Ya! Fungsi delete sudah tersedia di service.

### Q: Bagaimana jika offline?
**A:** Firebase memiliki offline persistence, data akan tersinkron saat online.

---

## 🐛 Troubleshooting

### Error: "User belum login"
- Pastikan sudah login dengan Google Auth
- Cek console: `console.log(auth.currentUser)`

### Error: "Permission denied"
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Cek rules di Firebase Console

### Data tidak muncul
- Cek console untuk error messages
- Refresh halaman
- Verifikasi data di Firebase Console

---

## 📞 Support

Jika ada masalah:
1. Baca dokumentasi lengkap: `FIREBASE_ENVIRONMENTAL_ACTIVITIES_GUIDE.md`
2. Cek panduan deploy: `DEPLOY_FIRESTORE_RULES.md`
3. Periksa console untuk error messages
4. Verifikasi di Firebase Console

---

## ✅ Checklist Implementasi

- [x] Service file dibuat (`environmental-activity-service.js`)
- [x] Halaman materi diupdate (menggunakan Firebase)
- [x] Firestore rules dikonfigurasi
- [x] Dokumentasi lengkap dibuat
- [x] Formula perhitungan nilai ekonomi & eco-score
- [x] Security rules untuk protect user data
- [x] Real-time statistics calculation
- [ ] **Deploy Firestore rules** ← YANG PERLU DILAKUKAN
- [ ] **Test di production** ← YANG PERLU DILAKUKAN

---

**Status:** ✅ **READY TO DEPLOY**

Silakan deploy Firestore rules sesuai panduan di `DEPLOY_FIRESTORE_RULES.md`

