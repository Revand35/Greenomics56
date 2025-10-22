import { supabase } from '../../config/supabase-init.js';
import { db } from '../../config/firebase-init.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const BUCKET_NAME = 'Mobile-Intelligence';
const FOLDER_PATH = 'materi';

export const uploadFile = async (file, metadata) => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${FOLDER_PATH}/${fileName}`;

    // Upload file ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Ambil public URL
    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Simpan metadata ke Firestore
    const docRef = await addDoc(collection(db, 'materi'), {
      nama_file: fileName,
      original_name: file.name,
      url_file: publicData.publicUrl,
      judul: metadata.judul || file.name,
      deskripsi: metadata.deskripsi || '',
      tipe_file: file.type,
      ukuran_file: file.size,
      uploaded_at: serverTimestamp(),
      created_at: new Date().toISOString()
    });

    return {
      id: docRef.id,
      fileName,
      publicUrl: publicData.publicUrl,
      ...metadata
    };
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw error;
  }
};

export const getAllMateri = async () => {
  try {
    // Import additional Firestore functions
    const { query, orderBy, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    // Load from Firestore
    const q = query(collection(db, 'materi'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);

    const materials = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      materials.push({
        id: doc.id,
        nama_file: data.nama_file,
        original_name: data.original_name,
        url_file: data.url_file,
        judul: data.judul,
        deskripsi: data.deskripsi,
        tipe_file: data.tipe_file,
        ukuran_file: data.ukuran_file,
        uploaded_at: data.uploaded_at || data.created_at
      });
    });

    return materials;
  } catch (error) {
    console.error('❌ Error fetching materials:', error);
    throw error;
  }
};

export const deleteMateri = async (materiId, fileName) => {
  try {
    // Import deleteDoc
    const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const filePath = `${FOLDER_PATH}/${fileName}`;

    // Hapus dari Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) throw storageError;

    // Hapus dari Firestore
    await deleteDoc(doc(db, 'materi', materiId));

    return true;
  } catch (error) {
    console.error('❌ Error deleting material:', error);
    throw error;
  }
};