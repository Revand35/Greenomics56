# 🧪 Testing Guide: AI Auto Notification

> Panduan cepat untuk testing fitur AI notification setelah input data

---

## ✅ Pre-requisites

- [x] User sudah login (Google Auth)
- [x] Firestore index sudah dibuat
- [x] Browser console terbuka (F12)

---

## 🎯 Test Flow

### **Step 1: Buka Halaman Input Data**

1. Klik menu **"Input Data"** di bottom navigation
2. Verify page load dengan console log:
   ```
   ✅ UserStatsManager initialized
   ```

### **Step 2: Input Data Aktivitas**

Fill form dengan data test:

| Field | Value |
|-------|-------|
| Jenis Aktivitas | Pengelolaan Limbah |
| Jenis Material | Plastik (plastic) |
| Jumlah | 50 |
| Satuan | kg |
| Aksi | Daur Ulang (recycled) |
| Biaya | 50000 |
| Catatan | Test notification |

3. Klik **"Hitung Nilai Ekonomi"**

### **Step 3: Verify Save Success**

Check console:
```
💾 Saving environmental activity to Firestore...
✅ Activity saved successfully with ID: [ID]
```

Check notifikasi muncul:
```
┌─────────────────────────────────────┐
│ 🎉 Aktivitas berhasil disimpan!    │
│ Nilai ekonomi: Rp 225,000          │
│ Eco-Score: +8                      │
│ 📝 Data tersimpan di cloud         │
│ 💡 Buka AI untuk konsultasi!       │
│                                     │
│ [🤖 Konsultasi AI]  [Tutup]       │
└─────────────────────────────────────┘
```

### **Step 4: Check sessionStorage**

Buka console dan run:
```javascript
JSON.parse(sessionStorage.getItem('latestActivity'))
```

Expected output:
```javascript
{
  material: "plastic",
  amount: "50",
  unit: "kg",
  action: "recycled",
  economicValue: 225000,
  ecoScore: 8,
  timestamp: "2025-10-23T14:30:00.000Z",
  activityType: "waste_management"
}
```

### **Step 5: Klik "Konsultasi AI"**

1. Klik button **"Konsultasi AI"** di notifikasi
2. Page redirect ke `chat.html`
3. Wait 1 second untuk AI message

### **Step 6: Verify AI Message**

Check console:
```
📢 Latest activity detected: {material: "plastic"...}
```

Check AI message muncul:
```
🎉 Saya lihat Anda baru saja menginput data 
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

### **Step 7: Verify sessionStorage Cleared**

Run di console:
```javascript
sessionStorage.getItem('latestActivity')
```

Expected: `null` (sudah di-clear)

---

## 🧪 Additional Test Cases

### **Test Case 1: Different Materials**

Test semua material types:

| Material | Expected Indonesian |
|----------|-------------------|
| plastic | plastik |
| paper | kertas |
| metal | logam |
| organic | organik |
| electricity | listrik |
| water | air |

### **Test Case 2: Different Actions**

| Action | Expected Indonesian |
|--------|-------------------|
| recycled | didaur ulang |
| reduced | dikurangi |
| reused | digunakan ulang |
| disposed | dibuang |
| conserved | dihemat |

### **Test Case 3: Timing Test**

**Scenario A: Immediate (< 5 min)**
1. Input data → timestamp: 10:00
2. Open AI at 10:02
3. ✅ Message should appear

**Scenario B: Delayed (> 5 min)**
1. Input data → timestamp: 10:00
2. Wait 6 minutes
3. Open AI at 10:06
4. ❌ Message should NOT appear

**To test this manually:**
```javascript
// Manually set old timestamp
const oldActivity = JSON.parse(sessionStorage.getItem('latestActivity'));
oldActivity.timestamp = new Date(Date.now() - 6*60*1000).toISOString();
sessionStorage.setItem('latestActivity', JSON.stringify(oldActivity));
```

### **Test Case 4: Multiple Inputs**

1. Input plastic 50kg → Save
2. Input paper 30kg → Save
3. Open AI
4. ✅ Should show ONLY paper 30kg (latest)

### **Test Case 5: Manual Navigation**

1. Input data → Notifikasi muncul
2. DON'T click "Konsultasi AI"
3. Manually navigate via bottom menu to AI Assistant
4. ✅ Message should still appear

### **Test Case 6: Refresh Page**

1. Input data → Get to AI Assistant → See message
2. Refresh chat.html (F5)
3. ❌ Message should NOT appear again (sessionStorage cleared)

---

## 🔍 Console Debugging

### **Key Console Logs:**

**Input Data Page (materi.html):**
```
💾 Saving environmental activity to Firestore...
✅ Activity saved successfully with ID: abc123
```

**AI Assistant Page (chat.html):**
```
🚀 Initializing chat page...
📊 Loading user data summary...
📢 Latest activity detected: {material: "plastic"...}
✅ User data summary loaded
```

**No Activity Detected:**
```
🚀 Initializing chat page...
📊 Loading user data summary...
// No "Latest activity detected" log
```

---

## ❌ Error Scenarios

### **Error 1: sessionStorage empty**

**Console:**
```
sessionStorage.getItem('latestActivity') → null
```

**Cause:**
- Data not saved properly
- sessionStorage cleared by user
- Private browsing mode

**Fix:**
- Input data again
- Use normal browser mode
- Check browser settings

### **Error 2: AI message not showing**

**Console:**
```
📢 Latest activity detected: {...}
// But no message in chat
```

**Cause:**
- `addMessageToChat` function issue
- DOM not ready

**Debug:**
```javascript
// Check if function exists
console.log(typeof addMessageToChat);
// Should be "function"
```

### **Error 3: Wrong material/action name**

**Message shows:**
```
plastik ❌ → Should show "Plastik" (capitalized)
```

**Fix:**
Check mapping in chat.html:
```javascript
const materialName = materialNames[activity.material] || activity.material;
// Add capitalize:
materialName.charAt(0).toUpperCase() + materialName.slice(1)
```

---

## 📊 Success Criteria

✅ All checks must pass:

- [ ] Notifikasi muncul setelah save data
- [ ] Button "Konsultasi AI" berfungsi
- [ ] Redirect ke chat.html berhasil
- [ ] AI message muncul dalam 1-2 detik
- [ ] Message content correct (material, amount, value)
- [ ] Material & action name dalam bahasa Indonesia
- [ ] sessionStorage cleared setelah message ditampilkan
- [ ] No errors di console
- [ ] Timing check works (< 5 min = show, > 5 min = no show)
- [ ] Multiple input hanya show yang terakhir

---

## 🎬 Video Test Script

**Untuk demo/recording:**

```
[00:00] Login ke aplikasi
[00:05] Navigate ke "Input Data"
[00:10] Fill form:
        - Material: Plastik
        - Jumlah: 50 kg
        - Aksi: Daur Ulang
[00:20] Submit form
[00:25] Notifikasi muncul ✅
[00:28] Klik "Konsultasi AI" button
[00:30] Redirect ke AI Assistant ✅
[00:32] AI message muncul ✅
[00:35] Show detail message content
[00:40] Demo: Ask AI follow-up question
[00:50] AI responds with context ✅
[01:00] End
```

---

## 📝 Bug Report Template

Jika menemukan bug, report dengan format:

```markdown
### Bug: [Short Description]

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Behavior:**
...

**Actual Behavior:**
...

**Console Errors:**
```
[paste errors here]
```

**Screenshots:**
[attach if relevant]

**Environment:**
- Browser: Chrome/Firefox/Edge
- Version: ...
- OS: Windows/Mac/Linux
```

---

## ✅ Quick Checklist

Before testing, verify:

- [ ] Firebase login working
- [ ] Firestore connection OK
- [ ] Browser console open (F12)
- [ ] sessionStorage enabled (not private mode)
- [ ] Network tab ready (for Firestore calls)

During testing, check:

- [ ] Console logs appear correctly
- [ ] No red errors in console
- [ ] Notifikasi UI looks good
- [ ] AI message formatting correct
- [ ] Timing logic works

After testing:

- [ ] sessionStorage cleared automatically
- [ ] Can repeat test (input new data)
- [ ] No leftover artifacts

---

**Happy Testing! 🎉**

*Jika semua test pass, fitur ready untuk production!* ✅

