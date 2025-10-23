# 🤖 AI Assistant - Integrasi dengan Firestore

> AI Assistant sekarang terhubung langsung dengan data aktivitas lingkungan Anda di Firestore!

## 🎯 Fitur Baru

### **AI dengan Context Data Real User**

AI Assistant sekarang **otomatis mengakses** data aktivitas lingkungan yang sudah Anda input di halaman "Input Data". Tidak perlu menjelaskan lagi apa yang sudah Anda input!

---

## ✨ Keuntungan

### **1. Konsultasi Lebih Personal** 🎯
- AI tahu semua data limbah yang sudah Anda input
- Analisis berdasarkan data **real**, bukan asumsi
- Rekomendasi disesuaikan dengan **kondisi aktual** bisnis Anda

### **2. Hemat Waktu** ⚡
- **Tidak perlu** menjelaskan ulang data limbah
- **Tidak perlu** copy-paste data manual
- Langsung tanya, AI sudah tahu konteksnya

### **3. Analisis Lebih Akurat** 📊
- AI menganalisis **seluruh histori** aktivitas
- Melihat **pola** dan **trend** dari data Anda
- Memberikan insight berdasarkan **statistik real**

---

## 🚀 Cara Menggunakan

### **Step 1: Input Data Aktivitas**

1. Buka halaman **"Input Data"**
2. Isi form aktivitas lingkungan:
   ```
   - Jenis Aktivitas: Pengelolaan Limbah
   - Material: Plastik
   - Jumlah: 50 kg
   - Aksi: Daur Ulang
   ```
3. Submit → Data tersimpan di Firestore ✅

### **Step 2: Buka AI Assistant**

1. Navigasi ke **"AI Assistant"**
2. **Otomatis** muncul ringkasan data Anda:
   ```
   📊 Ringkasan Data Aktivitas Anda
   Total Aktivitas: 2
   Total Limbah: 100 kg
   Nilai Ekonomi: Rp 450,000
   Rata-rata Eco-Score: 8/10
   ```

### **Step 3: Tanya AI**

Langsung tanya tanpa perlu explain data:

**❌ DULU (Tanpa Integrasi):**
```
User: "Saya punya limbah plastik 50kg dan kertas 30kg. 
       Sudah didaur ulang. Bagaimana analisisnya?"
```

**✅ SEKARANG (Dengan Integrasi):**
```
User: "Analisis data limbah saya"
AI: "Berdasarkan data yang sudah Anda input:
     - Plastik: 50 kg (Daur Ulang) - Nilai: Rp 225,000
     - Kertas: 30 kg (Daur Ulang) - Nilai: Rp 90,000
     Total: Rp 315,000
     
     Saran: Dengan pola ini, Anda bisa membuat..."
```

---

## 💬 Contoh Pertanyaan yang Bisa Ditanya

### **Analisis Data**
- ✅ "Analisis semua data limbah saya"
- ✅ "Bagaimana trend limbah saya bulan ini?"
- ✅ "Mana aktivitas yang paling menguntungkan?"

### **Saran Produk**
- ✅ "Berdasarkan data saya, produk apa yang bisa dibuat?"
- ✅ "Dari plastik yang sudah saya kumpulkan, bisa jadi apa?"
- ✅ "Saran bisnis circular economy untuk limbah saya"

### **Hitung Profit**
- ✅ "Hitung potensi profit dari data limbah saya"
- ✅ "Berapa ROI jika saya olah limbah plastik saya?"
- ✅ "Analisis nilai ekonomi total aktivitas saya"

### **Ringkasan & Insight**
- ✅ "Tampilkan ringkasan aktivitas saya"
- ✅ "Apa insight dari data limbah saya?"
- ✅ "Bagaimana cara optimalkan nilai ekonomi data saya?"

---

## 📊 Data yang Diakses AI

AI memiliki akses ke:

### **1. Aktivitas Terbaru (10 terakhir)**
```javascript
{
  no: 1,
  type: "waste",                    // Jenis aktivitas
  material: "plastic",              // Material
  amount: "50 kg",                  // Jumlah + unit
  action: "recycled",               // Aksi
  economicValue: "Rp 225,000",      // Nilai ekonomi
  ecoScore: 8,                      // Eco-Score
  date: "2025-01-23",               // Tanggal
  notes: "Plastik kemasan produk"   // Catatan
}
```

### **2. Statistik Agregat**
```javascript
{
  totalActivities: 10,              // Total aktivitas
  totalWaste: "250 kg",             // Total limbah
  totalEconomicValue: "Rp 1,500,000", // Total nilai ekonomi
  averageEcoScore: 7.5,             // Rata-rata eco-score
  breakdown: {                      // Breakdown per jenis
    waste: 5,
    energy: 2,
    water: 3
  }
}
```

---

## 🔧 Implementasi Teknis

### **File yang Diubah:**

#### **1. `assets/js/core/gemini-service.js`**

**Fungsi Baru:**
```javascript
async function getUserDataContext() {
  // Fetch activities dan stats dari Firestore
  const [activities, stats] = await Promise.all([
    getUserActivities(10),
    getActivityStats()
  ]);
  
  // Format data untuk AI context
  return {
    hasData: true,
    totalActivities: stats.totalActivities,
    recentActivities: [...],
    stats: {...}
  };
}
```

**Enhanced System Prompt:**
```javascript
// AI prompt sekarang include user data
if (userContext && userContext.hasData) {
  systemPrompt += `
    DATA AKTIVITAS PENGGUNA:
    Total: ${userContext.totalActivities}
    Aktivitas Terbaru:
    1. Plastik 50kg - Daur Ulang - Rp 225,000
    2. Kertas 30kg - Daur Ulang - Rp 90,000
    ...
    
    PENTING: Gunakan data ini untuk analisis personal!
  `;
}
```

#### **2. `pages/features/chat.html`**

**UI Components:**
```html
<!-- Ringkasan Data Card -->
<div id="user-data-summary">
  <h3>📊 Ringkasan Data Aktivitas Anda</h3>
  <p>Total Aktivitas: 10</p>
  <p>Total Limbah: 250 kg</p>
  <p>Nilai Ekonomi: Rp 1,500,000</p>
</div>
```

**JavaScript Functions:**
```javascript
async function loadUserDataSummary() {
  const userContext = await getUserDataContext();
  // Display summary in UI
}
```

**Updated Quick Actions:**
- "Analisis data limbah saya"
- "Berdasarkan data saya, saran produk apa?"
- "Hitung profit dari data saya"

---

## 🎨 User Interface

### **Before Chat:**
```
┌─────────────────────────────────────┐
│ 🌱 AI Assistant                     │
├─────────────────────────────────────┤
│ Halo! Saya AI Assistant...          │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 📊 Ringkasan Data Anda      │   │
│ │ Total Aktivitas: 2          │   │
│ │ Total Limbah: 100 kg        │   │
│ │ Nilai: Rp 450,000           │   │
│ │ Eco-Score: 8/10             │   │
│ │ 💡 AI sudah tahu data Anda! │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │📊    │ │♻️    │ │💰    │        │
│ │Analisis│ │Produk│ │Profit│       │
│ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘
```

### **Chat Example:**
```
You: Analisis data saya

AI: 📊 Berdasarkan data aktivitas Anda:

RINGKASAN:
• Total Aktivitas: 2
• Total Limbah: 100 kg
• Nilai Ekonomi: Rp 450,000
• Rata-rata Eco-Score: 8/10

DETAIL AKTIVITAS:
1. Plastik - 50 kg (Daur Ulang)
   💰 Nilai: Rp 225,000
   🌱 Eco-Score: 8/10

2. Kertas - 50 kg (Daur Ulang)
   💰 Nilai: Rp 225,000
   🌱 Eco-Score: 8/10

ANALISIS & INSIGHT:
✅ Sangat bagus! Eco-Score rata-rata 8/10
✅ Fokus pada daur ulang - strategi yang tepat
💡 Potensi peningkatan nilai hingga Rp 900,000 
   jika diolah menjadi produk

REKOMENDASI:
1. Dari plastik 50kg, bisa dibuat:
   • Ecobrick (30 unit) - Profit: Rp 300,000
   • Pot Tanaman (20 unit) - Profit: Rp 340,000

2. Dari kertas 50kg, bisa dibuat:
   • Kertas Daur Ulang - Profit: Rp 300,000
   • Buku Catatan (25 unit) - Profit: Rp 325,000

Total Potensi Profit: Rp 965,000
ROI: +114% dari nilai saat ini!
```

---

## 🔒 Keamanan & Privacy

### **Data Protection:**
- ✅ Data **hanya milik user** yang login
- ✅ AI **tidak bisa akses** data user lain
- ✅ Firestore rules melindungi privacy
- ✅ Data **tidak disimpan** di server AI

### **Firestore Security Rules:**
```javascript
match /environmental_activities/{activityId} {
  // User hanya bisa baca data sendiri
  allow read: if request.auth.uid == resource.data.userId;
}
```

---

## ✅ Testing

### **Test Flow:**

1. **Input Data:**
   ```
   ✅ Login → Input Data → Submit
   ✅ Data tersimpan di Firestore
   ```

2. **Check AI Context:**
   ```
   ✅ Buka AI Assistant
   ✅ Ringkasan data muncul
   ✅ Console: "User data context fetched"
   ```

3. **Test AI Response:**
   ```
   ✅ Tanya: "Analisis data saya"
   ✅ AI menjawab dengan data real
   ✅ AI menyebut jumlah spesifik dari data
   ```

### **Expected Console Logs:**
```
📊 Fetching user data context from Firestore...
📖 Fetching user activities from Firestore...
📊 Calculating activity statistics...
✅ User data context fetched: {totalActivities: 2, ...}
✅ User data summary loaded
🤖 Starting Gemini API call...
📝 Message: Analisis data saya
```

---

## 📝 Changelog

### **v1.0.0 - Firestore Integration**
- ✅ AI terhubung dengan Firestore `environmental_activities`
- ✅ Auto-fetch user activities saat chat load
- ✅ System prompt enhanced dengan user data
- ✅ UI ringkasan data di chat interface
- ✅ Quick actions disesuaikan dengan data context
- ✅ Real-time stats dari Firestore

---

## 🐛 Troubleshooting

### **Error: "User belum login"**
```
Solusi:
- Pastikan sudah login dengan Google
- Refresh halaman AI Assistant
```

### **Error: "Could not fetch activities"**
```
Solusi:
- Cek Firestore Index sudah dibuat
- Wait 2-5 menit untuk index building
- Refresh halaman
```

### **Ringkasan data tidak muncul**
```
Solusi:
- Pastikan sudah input data di halaman Input Data
- Cek browser console untuk error
- Verifikasi data di Firebase Console
```

### **AI tidak menyebut data spesifik**
```
Solusi:
- Cek console: "User data context fetched"
- Pastikan userContext.hasData = true
- Coba pertanyaan lebih spesifik: "Tampilkan data saya"
```

---

## 🎯 Best Practices

### **Untuk User:**

1. **Input Data Lengkap:**
   - Selalu isi catatan untuk context lebih baik
   - Input data secara teratur
   - Categorize dengan benar (jenis & material)

2. **Tanya dengan Spesifik:**
   - ✅ "Analisis limbah plastik saya bulan ini"
   - ✅ "Hitung profit dari data kertas saya"
   - ❌ "Bagaimana cara daur ulang?" (terlalu umum)

3. **Maksimalkan Quick Actions:**
   - Gunakan button "Analisis Data Saya"
   - Klik "Saran Produk" untuk rekomendasi
   - "Hitung Profit" untuk ROI analysis

---

## 🚀 Future Enhancements

### **Planned Features:**

- [ ] **Filter by Date Range** - Analisis per periode
- [ ] **Compare Periods** - Bandingkan bulan ini vs bulan lalu
- [ ] **AI Insights Dashboard** - Visual insights dari AI
- [ ] **Predictive Analytics** - Prediksi profit bulan depan
- [ ] **Recommendation Engine** - Saran otomatis berdasarkan pattern
- [ ] **Export AI Analysis** - Download laporan PDF

---

## 📞 Support

Jika ada masalah dengan integrasi:
1. Check browser console (F12)
2. Verifikasi data di Firebase Console
3. Test dengan data sample
4. Lihat dokumentasi Firestore

---

**Dibuat dengan ❤️ untuk Greenomics Platform**

*AI Assistant yang lebih pintar, lebih personal, dan lebih membantu!* 🌱🤖

