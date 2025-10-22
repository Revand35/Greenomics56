# 🔥 Firebase Environmental Activities Integration Guide

## 📋 Overview
Sistem ini mengintegrasikan form input aktivitas lingkungan dengan Firebase Firestore untuk menyimpan data secara persisten dan real-time.

## 🚀 Features yang Diimplementasikan

### 1. **Firebase Activity Service** (`firebase-activity-service.js`)
- ✅ Simpan aktivitas lingkungan ke Firestore
- ✅ Ambil data aktivitas user
- ✅ Hitung statistik aktivitas
- ✅ Update dan hapus aktivitas
- ✅ Validasi data yang robust
- ✅ Error handling yang komprehensif

### 2. **Form Integration** (`materi.html`)
- ✅ Form submission dengan Firebase
- ✅ Loading states dan feedback
- ✅ Real-time stats update
- ✅ Recent activities display
- ✅ Error notifications

### 3. **Firestore Security Rules** (`firestore.rules`)
- ✅ User authentication required
- ✅ Data isolation per user
- ✅ Admin access controls
- ✅ CRUD operations security

## 📊 Data Structure

### Environmental Activity Document
```javascript
{
  id: "auto-generated-id",
  userId: "user-uid",
  userEmail: "user@example.com",
  activityType: "waste|energy|water|carbon|recycling",
  materialType: "plastic|paper|metal|organic|electricity|water",
  amount: 25.5,
  unit: "kg|liter|kwh|piece|ton",
  action: "recycled|reused|reduced|disposed|conserved",
  cost: 150000,
  notes: "Optional notes...",
  economicValue: 180000, // Auto-calculated
  ecoScore: 18, // Auto-calculated
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Usage

### 1. **Menyimpan Aktivitas Baru**
```javascript
import { saveActivityToFirestore } from './firebase-activity-service.js';

const activityData = {
  activityType: 'waste',
  materialType: 'plastic',
  amount: '25',
  unit: 'kg',
  action: 'recycled',
  cost: '150000',
  notes: 'Botol plastik dari produksi'
};

try {
  const savedActivity = await saveActivityToFirestore(activityData);
  console.log('Aktivitas tersimpan:', savedActivity);
} catch (error) {
  console.error('Error:', error.message);
}
```

### 2. **Mengambil Data Aktivitas**
```javascript
import { getActivitiesFromFirestore } from './firebase-activity-service.js';

try {
  const activities = await getActivitiesFromFirestore(10); // Ambil 10 aktivitas terbaru
  console.log('Aktivitas:', activities);
} catch (error) {
  console.error('Error:', error.message);
}
```

### 3. **Mengambil Statistik**
```javascript
import { getActivityStatsFromFirestore } from './firebase-activity-service.js';

try {
  const stats = await getActivityStatsFromFirestore();
  console.log('Statistik:', stats);
  // Output: {
  //   totalActivities: 15,
  //   totalWasteAmount: 250,
  //   totalEconomicValue: 7500000,
  //   averageEcoScore: 85,
  //   materialBreakdown: {...},
  //   actionBreakdown: {...},
  //   recommendations: [...]
  // }
} catch (error) {
  console.error('Error:', error.message);
}
```

## 🛡️ Security Features

### 1. **Authentication Required**
- Semua operasi memerlukan user login
- Data diisolasi per user (userId)

### 2. **Data Validation**
- Validasi field wajib
- Validasi tipe data
- Validasi range nilai
- Sanitasi input

### 3. **Firestore Rules**
```javascript
// User hanya bisa akses data sendiri
match /environmental_activities/{activityId} {
  allow read: if request.auth != null && 
                 (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if request.auth != null &&
                  request.resource.data.userId == request.auth.uid;
  // ... rules lainnya
}
```

## 📈 Auto-Calculations

### 1. **Economic Value Calculation**
```javascript
// Berdasarkan material dan aksi
const basePrices = {
  'plastic': 3000,    // Rp 3,000 per kg
  'paper': 2000,      // Rp 2,000 per kg
  'metal': 5000,      // Rp 5,000 per kg
  'electricity': 1500, // Rp 1,500 per kWh
  'water': 500        // Rp 500 per liter
};

const actionMultipliers = {
  'recycled': 1.2,    // +20% value
  'reused': 1.1,      // +10% value
  'reduced': 0.8,     // -20% value
  'conserved': 1.5    // +50% value
};
```

### 2. **Eco-Score Calculation**
```javascript
// Berdasarkan aksi dan jumlah
const actionScores = {
  'recycled': 15,
  'reused': 12,
  'reduced': 10,
  'conserved': 20,
  'disposed': -5
};

// Bonus berdasarkan jumlah (max 10 points)
const amountBonus = Math.min(amount * 0.1, 10);
```

## 🔄 Real-time Updates

### 1. **Stats Update**
- Otomatis update setelah simpan aktivitas
- Real-time calculation dari Firebase data

### 2. **Recent Activities**
- Load otomatis saat page load
- Update setelah simpan aktivitas baru

## 🚨 Error Handling

### 1. **Common Errors**
- `permission-denied`: User tidak login atau tidak ada akses
- `unavailable`: Database tidak tersedia
- `invalid-argument`: Data tidak valid

### 2. **User-Friendly Messages**
- Error messages dalam bahasa Indonesia
- Specific guidance untuk setiap error type
- Retry suggestions

## 🧪 Testing

### 1. **Manual Testing Steps**
1. Login ke aplikasi
2. Buka halaman Input Data (`materi.html`)
3. Isi form dengan data valid
4. Submit form
5. Verifikasi data tersimpan di Firebase Console
6. Check stats update di UI

### 2. **Test Cases**
- ✅ Valid data submission
- ✅ Invalid data validation
- ✅ Empty field validation
- ✅ Network error handling
- ✅ Permission error handling

## 📱 UI Features

### 1. **Loading States**
- Button disabled saat submit
- Loading text "Menyimpan..."
- Spinner indicators

### 2. **Notifications**
- Success notifications dengan detail
- Error notifications dengan guidance
- Auto-dismiss setelah 5 detik

### 3. **Real-time Stats**
- Total waste amount
- Economic value
- Average eco-score
- Efficiency percentage

## 🔮 Future Enhancements

### 1. **Planned Features**
- [ ] Bulk import/export
- [ ] Data visualization charts
- [ ] Activity templates
- [ ] Team collaboration
- [ ] Mobile app integration

### 2. **Performance Optimizations**
- [ ] Pagination for large datasets
- [ ] Caching strategies
- [ ] Offline support
- [ ] Background sync

## 📞 Support

Jika ada masalah dengan integrasi Firebase:
1. Check browser console untuk error messages
2. Verify Firebase configuration
3. Check Firestore rules
4. Ensure user authentication
5. Contact developer untuk assistance

---

**Status**: ✅ **COMPLETED** - Sistem Firebase integration siap digunakan!
**Last Updated**: $(date)
**Version**: 1.0.0
