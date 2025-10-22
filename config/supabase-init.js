// 📁 ../../config/supabase-init.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ Ganti dengan credentials kamu
const SUPABASE_URL = 'https://leqtvucfgxwukfgsvnei.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlcXR2dWNmZ3h3dWtmZ3N2bmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5OTg2MDYsImV4cCI6MjA3MzU3NDYwNn0.cEO_Bzv183QIzEBOnqYAId4aZAkYaW0_jsnwiA1atzQ';

// ✅ Inisialisasi Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ Test koneksi sederhana ke storage
(async () => {
  try {
    const { data, error } = await supabase.storage.getBucket('Mobile-Intelligence');
    if (error) {
      console.warn('⚠️ Bucket Mobile-Intelligence tidak ditemukan atau tidak bisa diakses:', error.message);
    } else {
      console.log('✅ Supabase Storage "Mobile-Intelligence" siap digunakan');
    }
  } catch (err) {
    console.error('❌ Gagal menginisialisasi Supabase:', err);
  }
})();

console.log('✅ Supabase client initialized');
