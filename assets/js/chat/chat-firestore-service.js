import { db, auth } from '../../../config/firebase-init.js';
import { 
  collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CHAT_HISTORY_COLLECTION = 'chatHistory';

// Simpan chat ke Firestore
export async function saveChatToFirestore(message, role = 'user') {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const chatData = {
      userId: user.uid,
      role,                   // 'user' atau 'ai'
      message,
      createdAt: serverTimestamp(),  // native timestamp
      timestamp: new Date().toISOString() // fallback ISO string
    };

    const docRef = await addDoc(collection(db, CHAT_HISTORY_COLLECTION), chatData);
    return docRef.id;
  } catch (err) {
    console.error('❌ Gagal simpan chat ke Firestore:', err);
    return null;
  }
}

// Ambil history chat user
export async function getChatHistoryFromFirestore(limitCount = 50) {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
      collection(db, CHAT_HISTORY_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc'),   // pakai ISO biar stabil
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (err) {
    console.error('❌ Gagal ambil history chat:', err);
    return [];
  }
}

// Hapus chat tertentu
export async function deleteChatHistoryItem(id) {
  try {
    await deleteDoc(doc(db, CHAT_HISTORY_COLLECTION, id));
    return true;
  } catch (err) {
    console.error('❌ Gagal hapus chat:', err);
    return false;
  }
}