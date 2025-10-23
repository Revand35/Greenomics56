# 🔔 AI Auto Notification - Real-time Activity Detection

> AI Assistant sekarang otomatis memberi tahu Anda tentang data yang baru saja diinput!

## 🎯 Fitur Baru

### **AI Mendeteksi Input Data Terbaru**

Saat Anda input data di halaman **"Input Data"**, AI Assistant akan **otomatis mendeteksi** dan memberikan pesan seperti:

```
🎉 Saya lihat Anda baru saja menginput data plastik 
   sebanyak 50 kg yang didaur ulang!

📊 Detail Aktivitas:
• Material: Plastik
• Jumlah: 50 kg
• Aksi: Didaur Ulang
• Nilai Ekonomi: Rp 225,000
• Eco-Score: 8/10

💡 Apa yang bisa saya bantu?
• Ingin analisis lebih detail tentang plastik ini?
• Butuh saran produk yang bisa dibuat?
• Mau hitung potensi profit dari plastik Anda?
```

---

## ✨ Keuntungan

### **1. Seamless Flow** 🔄
- Input Data → Langsung ke AI → Konsultasi
- Tidak perlu menjelaskan ulang apa yang baru diinput
- Flow yang natural dan intuitif

### **2. Context Aware** 🧠
- AI tahu **exact data** yang baru diinput
- Bisa langsung tanya detail tentang material tersebut
- Rekomendasi lebih spesifik dan relevan

### **3. Quick Action** ⚡
- Button "Konsultasi AI" langsung di notifikasi
- One-click ke AI Assistant
- Hemat waktu navigasi

---

## 🚀 Cara Kerja

### **Step 1: Input Data di Halaman "Input Data"**

1. Isi form aktivitas:
   ```
   Jenis: Pengelolaan Limbah
   Material: Plastik
   Jumlah: 50
   Unit: kg
   Aksi: Daur Ulang
   ```

2. Klik **"Hitung Nilai Ekonomi"**

3. Data tersimpan ke Firestore ✅

### **Step 2: Notifikasi Muncul**

Setelah sukses menyimpan, muncul notifikasi:

```
┌─────────────────────────────────────┐
│ 🎉 Aktivitas berhasil disimpan!    │
│                                     │
│ Nilai ekonomi: Rp 225,000          │
│ Eco-Score: +8                      │
│ 📝 Data tersimpan di cloud         │
│ 💡 Buka AI Assistant untuk         │
│    konsultasi lanjutan!            │
│                                     │
│ ┌──────────────┐  ┌──────┐        │
│ │🤖 Konsultasi │  │Tutup │        │
│ │   AI         │  │      │        │
│ └──────────────┘  └──────┘        │
└─────────────────────────────────────┘
```

### **Step 3: Klik "Konsultasi AI"**

Otomatis redirect ke AI Assistant dan AI langsung memberi pesan:

```
AI: 🎉 Saya lihat Anda baru saja menginput data 
    plastik sebanyak 50 kg yang didaur ulang!

    📊 Detail Aktivitas:
    • Material: Plastik
    • Jumlah: 50 kg
    • Aksi: Didaur Ulang
    • Nilai Ekonomi: Rp 225,000
    • Eco-Score: 8/10

    💡 Apa yang bisa saya bantu?
    • Ingin analisis lebih detail tentang plastik ini?
    • Butuh saran produk yang bisa dibuat?
    • Mau hitung potensi profit dari plastik Anda?

    Silakan tanya apapun tentang data yang baru saja 
    Anda input! 😊
```

### **Step 4: Tanya AI**

Langsung tanya tanpa perlu explain:

```
User: "Produk apa yang bisa dibuat?"

AI: "Dari 50 kg plastik yang Anda punya, berikut 
     produk yang bisa dibuat:

     1. Ecobrick (300 buah)
        • Harga jual: Rp 15,000/buah
        • Total: Rp 4,500,000
        • Profit: +1900%

     2. Pot Tanaman (200 buah)
        • Harga jual: Rp 25,000/buah
        • Total: Rp 5,000,000
        • Profit: +2122%
     
     Rekomendasi: Fokus ke Pot Tanaman untuk 
     profit maksimal!"
```

---

## 🔧 Implementasi Teknis

### **File yang Diubah:**

#### **1. `pages/features/materi.html`**

**Saat Submit Form:**
```javascript
// Simpan info ke sessionStorage
sessionStorage.setItem('latestActivity', JSON.stringify({
    material: formData.materialType,
    amount: formData.amount,
    unit: formData.unit,
    action: formData.action,
    economicValue: savedActivity.economicValue,
    ecoScore: savedActivity.ecoScore,
    timestamp: new Date().toISOString(),
    activityType: formData.activityType
}));
```

**Enhanced Notification:**
```javascript
// Notifikasi dengan button "Konsultasi AI"
notification.innerHTML = `
    <div>
        <p>✅ Aktivitas berhasil disimpan!</p>
        <a href="chat.html">🤖 Konsultasi AI</a>
        <button>Tutup</button>
    </div>
`;
```

#### **2. `pages/features/chat.html`**

**Auto-detect Latest Activity:**
```javascript
async function checkLatestActivity() {
    const latestActivityStr = sessionStorage.getItem('latestActivity');
    
    if (latestActivityStr) {
        const activity = JSON.parse(latestActivityStr);
        const activityTime = new Date(activity.timestamp);
        const diffMinutes = (now - activityTime) / (1000 * 60);
        
        // Tampilkan jika dalam 5 menit terakhir
        if (diffMinutes < 5) {
            const aiMessage = `🎉 Saya lihat Anda baru saja 
                menginput data ${activity.material}...`;
            
            addMessageToChat(aiMessage, 'assistant');
            sessionStorage.removeItem('latestActivity');
        }
    }
}
```

**Material & Action Mapping:**
```javascript
const materialNames = {
    'plastic': 'plastik',
    'paper': 'kertas',
    'metal': 'logam',
    'organic': 'organik',
    'electricity': 'listrik',
    'water': 'air'
};

const actionNames = {
    'recycled': 'didaur ulang',
    'reduced': 'dikurangi',
    'reused': 'digunakan ulang',
    'disposed': 'dibuang',
    'conserved': 'dihemat'
};
```

---

## 📊 Data Flow

```
┌─────────────────┐
│  Input Data     │
│  (materi.html)  │
└────────┬────────┘
         │
         ├─► Save to Firestore ✅
         │
         └─► Save to sessionStorage
             {
               material: "plastic",
               amount: 50,
               unit: "kg",
               action: "recycled",
               economicValue: 225000,
               ecoScore: 8,
               timestamp: "2025-01-23..."
             }
             
         ┌────────────────────┐
         │  User clicks       │
         │  "Konsultasi AI"   │
         └────────┬───────────┘
                  │
         ┌────────▼────────────┐
         │  AI Assistant       │
         │  (chat.html)        │
         └────────┬────────────┘
                  │
                  ├─► Read sessionStorage
                  │
                  ├─► Check timestamp (< 5 min)
                  │
                  └─► Show AI message ✅
                      Clear sessionStorage
```

---

## ⏱️ Timing Logic

### **Notification Window: 5 Minutes**

Notifikasi AI hanya muncul jika:
- ✅ Data diinput dalam **5 menit** terakhir
- ✅ User membuka AI Assistant
- ✅ sessionStorage memiliki data

**Alasan 5 menit:**
- Cukup waktu untuk user navigate
- Tidak terlalu lama (relevansi)
- Tidak terlalu cepat (memberi waktu baca notifikasi)

### **Auto-clear sessionStorage**

Setelah notifikasi ditampilkan:
```javascript
sessionStorage.removeItem('latestActivity');
```

**Alasan:**
- Avoid duplicate notifications
- Keep sessionStorage clean
- Ensure fresh data setiap kali

---

## 🎨 UI/UX Design

### **Notification Card (Input Data Page)**

```
┌─────────────────────────────────────┐
│ 🎉                                  │
│ ✅ Aktivitas berhasil disimpan!    │
│ Nilai ekonomi: Rp 225,000          │
│ Eco-Score: +8                      │
│ 📝 Data tersimpan di cloud         │
│ 💡 Buka AI untuk konsultasi!       │
│                                     │
│ ┌──────────────┐  ┌──────┐        │
│ │ Konsultasi AI│  │Tutup │  ◄─── Actions
│ └──────────────┘  └──────┘        │
└─────────────────────────────────────┘
  │                    │
  └─► ke chat.html    └─► Close
```

**Features:**
- ✅ Prominent button "Konsultasi AI"
- ✅ Auto-close after 10 seconds
- ✅ Manual close button
- ✅ Green theme (success)

### **AI Message (AI Assistant Page)**

```
┌─────────────────────────────────────┐
│ 🌱 AI Assistant                     │
├─────────────────────────────────────┤
│                                     │
│  🎉 Saya lihat Anda baru saja      │
│     menginput data plastik          │
│     sebanyak 50 kg yang didaur      │
│     ulang!                          │
│                                     │
│  📊 Detail Aktivitas:               │
│  • Material: Plastik                │
│  • Jumlah: 50 kg                    │
│  • Aksi: Didaur Ulang              │
│  • Nilai Ekonomi: Rp 225,000       │
│  • Eco-Score: 8/10                 │
│                                     │
│  💡 Apa yang bisa saya bantu?      │
│  • Ingin analisis detail?          │
│  • Butuh saran produk?             │
│  • Mau hitung potensi profit?      │
│                                     │
│  Silakan tanya apapun! 😊          │
└─────────────────────────────────────┘
```

**Features:**
- ✅ Friendly greeting
- ✅ Detailed activity summary
- ✅ Clear next actions
- ✅ Encouraging tone

---

## 🧪 Testing

### **Test Scenario 1: Happy Path**

1. **Input Data:**
   - Material: Plastik
   - Amount: 50 kg
   - Action: Daur Ulang

2. **Expected:**
   - ✅ Notifikasi muncul dengan button
   - ✅ sessionStorage terisi
   - ✅ Console log: "Aktivitas berhasil"

3. **Klik "Konsultasi AI":**
   - ✅ Redirect ke chat.html
   - ✅ AI message muncul otomatis
   - ✅ sessionStorage cleared

### **Test Scenario 2: Timing Check**

1. **Input data** (time: 10:00)
2. **Wait 3 minutes**
3. **Open AI** (time: 10:03)
   - ✅ Message muncul (< 5 min)

4. **Input data** (time: 10:00)
5. **Wait 6 minutes**
6. **Open AI** (time: 10:06)
   - ❌ No message (> 5 min)

### **Test Scenario 3: Multiple Inputs**

1. **Input plastic 50kg** → Save
2. **Input paper 30kg** → Save
3. **Open AI**
   - ✅ Only show LAST input (paper 30kg)

### **Console Logs to Check:**

```
✅ Activity saved successfully with ID: abc123
📢 Latest activity detected: {material: "plastic"...}
✅ Auto-message displayed
```

---

## 🔒 Privacy & Security

### **Data Storage:**
- ✅ **sessionStorage** only (not localStorage)
- ✅ Cleared after use
- ✅ Cleared when browser closed
- ✅ No sensitive data stored

### **Data Structure:**
```javascript
{
  material: "plastic",      // Safe
  amount: 50,              // Safe
  unit: "kg",              // Safe
  action: "recycled",      // Safe
  economicValue: 225000,   // Safe (calculated)
  ecoScore: 8,             // Safe (calculated)
  timestamp: "ISO string"  // Safe
}
```

**No sensitive data:**
- ❌ No userId
- ❌ No userEmail
- ❌ No authentication tokens
- ❌ No personal information

---

## 📝 Best Practices

### **Untuk User:**

1. **Input Data Berkala:**
   - Input data segera setelah aktivitas
   - Jangan tunda-tunda
   - AI akan lebih helpful jika data fresh

2. **Gunakan Button "Konsultasi AI":**
   - Langsung klik setelah input
   - Manfaatkan context yang fresh
   - Tanya detail tentang input terbaru

3. **Tanya Spesifik:**
   - ✅ "Produk apa dari plastik 50kg ini?"
   - ✅ "Hitung profit dari data terbaru saya"
   - ❌ "Bagaimana cara daur ulang?" (terlalu umum)

---

## 🚀 Future Enhancements

### **Planned Features:**

- [ ] **Multiple Activity Detection** - Tampilkan 3 aktivitas terakhir
- [ ] **Daily Summary** - Ringkasan input hari ini
- [ ] **Week Comparison** - Bandingkan minggu ini vs minggu lalu
- [ ] **Achievement Notification** - "Selamat! Target 100kg tercapai!"
- [ ] **AI Proactive Suggestion** - AI suggest produk tanpa ditanya
- [ ] **Voice Notification** - Text-to-speech untuk AI message

---

## 🐛 Troubleshooting

### **AI message tidak muncul**

**Penyebab:**
- Input > 5 menit yang lalu
- sessionStorage cleared manually
- Browser privacy mode

**Solusi:**
- Input data baru dan langsung ke AI
- Gunakan normal browser mode
- Check console untuk errors

### **Duplicate notifications**

**Penyebab:**
- sessionStorage tidak cleared
- Multiple page loads

**Solusi:**
- Hard refresh (Ctrl + Shift + R)
- Clear browser cache
- Check sessionStorage manually

### **Material name tidak terjemahkan**

**Penyebab:**
- Material baru tidak ada di mapping

**Solusi:**
- Tambahkan ke `materialNames` object:
```javascript
const materialNames = {
    'plastic': 'plastik',
    'newMaterial': 'nama_indonesia'
};
```

---

## 📞 Support

Jika ada masalah:
1. Check browser console (F12)
2. Verify sessionStorage: `sessionStorage.getItem('latestActivity')`
3. Check timing: Is input < 5 minutes ago?
4. Test with fresh input

---

**Dibuat dengan ❤️ untuk Greenomics Platform**

*AI Assistant yang lebih responsif dan aware terhadap aktivitas user!* 🌱🤖🔔

