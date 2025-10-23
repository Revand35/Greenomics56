# 📚 Panduan Firebase Environmental Activities

> Dokumentasi lengkap untuk sistem penyimpanan aktivitas lingkungan ke Firebase Firestore

## 📋 Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Struktur Data](#struktur-data)
3. [Firestore Rules](#firestore-rules)
4. [Cara Menggunakan](#cara-menggunakan)
5. [API Functions](#api-functions)
6. [Testing](#testing)

---

## 🎯 Pengenalan

Sistem ini dirancang untuk menyimpan dan mengelola **aktivitas lingkungan (environmental activities)** dari pengguna UMKM ke Firebase Firestore. Data yang disimpan meliputi:

- ♻️ Pengelolaan Limbah
- ⚡ Penggunaan Energi
- 💧 Penggunaan Air
- 🌍 Emisi Karbon
- 🔄 Daur Ulang

### Keuntungan Menggunakan Firebase:
✅ **Real-time sync** - Data tersinkronisasi otomatis  
✅ **Cloud storage** - Data tersimpan di cloud, aman dari kehilangan  
✅ **Multi-device** - Akses dari berbagai perangkat  
✅ **Security rules** - Keamanan data terjamin  
✅ **Scalable** - Dapat menangani banyak pengguna  

---

## 📊 Struktur Data

### Collection: `environmental_activities`

Setiap dokumen dalam koleksi ini memiliki struktur:

```javascript
{
  // User Information
  userId: "firebase_user_uid",           // UID dari Firebase Auth
  userEmail: "user@example.com",         // Email pengguna
  userName: "Nama Pengguna",             // Nama pengguna
  
  // Activity Details
  activityType: "waste",                 // waste|energy|water|carbon|recycling
  materialType: "plastic",               // plastic|paper|metal|organic|electricity|water
  amount: 50,                            // Jumlah (number)
  unit: "kg",                            // kg|liter|kwh|m3|piece
  action: "recycled",                    // recycled|reduced|reused|disposed|conserved
  notes: "Catatan tambahan",             // String (optional)
  
  // Calculated Values
  economicValue: 225000,                 // Nilai ekonomi (Rupiah)
  ecoScore: 8,                           // Score 1-10
  
  // Metadata
  createdAt: Timestamp,                  // Firebase server timestamp
  updatedAt: Timestamp,                  // Firebase server timestamp
  timestamp: "2025-01-23T10:30:00.000Z" // ISO string untuk sorting
}
```

### Contoh Data Lengkap:

```json
{
  "userId": "abc123xyz",
  "userEmail": "john@example.com",
  "userName": "John Doe",
  "activityType": "recycling",
  "materialType": "plastic",
  "amount": 50,
  "unit": "kg",
  "action": "recycled",
  "notes": "Plastik dari kemasan produk",
  "economicValue": 225000,
  "ecoScore": 8,
  "createdAt": "Firebase Timestamp",
  "updatedAt": "Firebase Timestamp",
  "timestamp": "2025-01-23T10:30:00.000Z"
}
```

---

## 🔒 Firestore Rules

Aturan keamanan yang sudah dikonfigurasi di `config/firestore.rules`:

```javascript
// Environmental Activities - Aktivitas Lingkungan
match /environmental_activities/{activityId} {
  // User bisa membaca data milik sendiri atau admin bisa membaca semua
  allow read: if request.auth != null && 
                 (resource.data.userId == request.auth.uid || isAdmin());
  
  // User hanya bisa create dengan userId dan email yang sesuai
  allow create: if request.auth != null &&
                  request.resource.data.userId == request.auth.uid &&
                  request.resource.data.userEmail == request.auth.token.email;
  
  // User bisa update data sendiri atau admin
  allow update: if request.auth != null && 
                   (resource.data.userId == request.auth.uid || isAdmin());
  
  // User bisa delete data sendiri atau admin
  allow delete: if request.auth != null && 
                   (resource.data.userId == request.auth.uid || isAdmin());
}
```

### Cara Deploy Firestore Rules:

```bash
# 1. Pastikan Firebase CLI sudah terinstall
npm install -g firebase-tools

# 2. Login ke Firebase
firebase login

# 3. Deploy rules
firebase deploy --only firestore:rules
```

---

## 🚀 Cara Menggunakan

### 1. Import Service

```javascript
import { 
  saveEnvironmentalActivity, 
  getUserActivities, 
  getActivityStats 
} from '../../assets/js/core/environmental-activity-service.js';
```

### 2. Menyimpan Aktivitas Baru

```javascript
// Data form
const formData = {
  activityType: 'recycling',
  materialType: 'plastic',
  amount: 50,
  unit: 'kg',
  action: 'recycled',
  cost: 0, // Optional, akan dikalkulasi otomatis jika kosong
  notes: 'Plastik dari kemasan produk'
};

// Simpan ke Firebase
try {
  const savedActivity = await saveEnvironmentalActivity(formData);
  console.log('✅ Saved:', savedActivity);
  console.log('💰 Economic Value:', savedActivity.economicValue);
  console.log('🌱 Eco Score:', savedActivity.ecoScore);
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

### 3. Mengambil Data Aktivitas

```javascript
// Ambil 10 aktivitas terbaru
try {
  const activities = await getUserActivities(10);
  console.log('📋 Total activities:', activities.length);
  
  activities.forEach(activity => {
    console.log(`- ${activity.materialType}: ${activity.amount} ${activity.unit}`);
  });
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

### 4. Mengambil Statistik

```javascript
try {
  const stats = await getActivityStats();
  
  console.log('📊 Statistics:');
  console.log('- Total activities:', stats.totalActivities);
  console.log('- Total waste:', stats.totalWasteAmount, 'kg');
  console.log('- Total economic value: Rp', stats.totalEconomicValue.toLocaleString());
  console.log('- Average eco score:', stats.averageEcoScore);
  console.log('- Activity breakdown:', stats.activityBreakdown);
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

---

## 📚 API Functions

### `saveEnvironmentalActivity(activityData)`

Menyimpan aktivitas lingkungan baru ke Firestore.

**Parameters:**
- `activityData` (Object): Data aktivitas yang akan disimpan

**Returns:**
- Promise<Object>: Data aktivitas yang telah disimpan dengan ID

**Example:**
```javascript
const activity = await saveEnvironmentalActivity({
  activityType: 'waste',
  materialType: 'plastic',
  amount: 25,
  unit: 'kg',
  action: 'recycled',
  notes: 'Sample activity'
});
```

---

### `getUserActivities(limitCount)`

Mengambil semua aktivitas user dari Firestore.

**Parameters:**
- `limitCount` (Number): Jumlah maksimal data (default: 50)

**Returns:**
- Promise<Array>: Array of activities

**Example:**
```javascript
const recentActivities = await getUserActivities(5);
```

---

### `getActivityStats()`

Menghitung statistik agregat dari semua aktivitas user.

**Returns:**
- Promise<Object>: Statistik agregat

**Response Structure:**
```javascript
{
  totalActivities: 10,
  totalWasteAmount: 250,
  totalEconomicValue: 1500000,
  totalEcoScore: 75,
  averageEcoScore: 7.5,
  activityBreakdown: {
    waste: 5,
    energy: 2,
    water: 1,
    carbon: 1,
    recycling: 1
  },
  actionBreakdown: {
    recycled: 6,
    reduced: 2,
    reused: 1,
    disposed: 0,
    conserved: 1
  }
}
```

---

### `updateActivity(activityId, updates)`

Update aktivitas yang sudah ada.

**Parameters:**
- `activityId` (String): ID dokumen di Firestore
- `updates` (Object): Data yang akan diupdate

**Example:**
```javascript
await updateActivity('abc123', {
  notes: 'Updated notes',
  amount: 60
});
```

---

### `deleteActivity(activityId)`

Hapus aktivitas dari Firestore.

**Parameters:**
- `activityId` (String): ID dokumen di Firestore

**Example:**
```javascript
await deleteActivity('abc123');
```

---

## 🧪 Testing

### 1. Test di Browser Console

Buka halaman `pages/features/materi.html` dan buka browser console:

```javascript
// Test save activity
const testData = {
  activityType: 'recycling',
  materialType: 'plastic',
  amount: 100,
  unit: 'kg',
  action: 'recycled',
  notes: 'Test data'
};

// Gunakan fungsi global dari service
saveEnvironmentalActivity(testData)
  .then(result => console.log('✅ Success:', result))
  .catch(error => console.error('❌ Error:', error));
```

### 2. Test di Firebase Console

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project "Greenomics"
3. Navigasi ke **Firestore Database**
4. Cek collection `environmental_activities`
5. Verifikasi data yang tersimpan

### 3. Test Manual di UI

1. Login ke aplikasi
2. Navigasi ke halaman **Input Data** (`materi.html`)
3. Isi form aktivitas lingkungan:
   - Jenis Aktivitas: Pilih salah satu
   - Material: Pilih salah satu
   - Jumlah: Masukkan angka
   - Unit: Pilih satuan
   - Aksi: Pilih aksi
   - Catatan: (Optional)
4. Klik **Hitung Nilai Ekonomi**
5. Cek notifikasi sukses
6. Verifikasi data muncul di "Aktivitas Terbaru"
7. Cek stats di bagian atas halaman

---

## 🔧 Troubleshooting

### Error: "User belum login"

**Solusi:** Pastikan user sudah login dengan Google Auth terlebih dahulu.

```javascript
import { auth } from '../../../config/firebase-init.js';
console.log('Current user:', auth.currentUser);
```

---

### Error: "Permission denied"

**Solusi:** Periksa Firestore rules sudah di-deploy dengan benar.

```bash
firebase deploy --only firestore:rules
```

---

### Data tidak muncul di UI

**Solusi:** 
1. Buka console dan cek error messages
2. Pastikan fungsi `loadRecentActivities()` dipanggil saat page load
3. Periksa network tab di browser DevTools

---

### Nilai ekonomi atau Eco-Score tidak sesuai

**Solusi:** Periksa fungsi kalkulasi di `environmental-activity-service.js`:
- `calculateEconomicValue()`
- `calculateEcoScore()`

---

## 📞 Support

Jika ada pertanyaan atau masalah, silakan:
1. Periksa console untuk error messages
2. Verifikasi Firebase configuration di `config/firebase-init.js`
3. Cek Firestore rules di Firebase Console

---

## 📝 Changelog

### v1.0.0 (2025-01-23)
- ✅ Initial release
- ✅ Implementasi penyimpanan ke Firestore
- ✅ Firestore security rules
- ✅ Calculate economic value & eco-score
- ✅ Real-time statistics
- ✅ User activity tracking

---

**Dibuat dengan ❤️ untuk Greenomics Platform**

