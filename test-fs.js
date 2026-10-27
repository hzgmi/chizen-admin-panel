const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const sa = require('/data/data/com.termux/files/home/wa-otp/serviceAccountKey.json');

initializeApp({ credential: cert(sa) });
const db = getFirestore();

(async () => {
  try {
    const snap = await db.collection('products').limit(5).get();
    console.log('✅ اتصال Firestore ناجح');
    console.log('عدد المنتجات (نموذج):', snap.size);
    if (snap.size > 0) {
      console.log('\nأول منتج:');
      const d = snap.docs[0].data();
      console.log('  id:', snap.docs[0].id);
      console.log('  name:', d.name);
      console.log('  img:', d.img ? d.img.slice(0, 60) + '...' : '(لا صورة)');
      console.log('  imgs:', d.imgs ? 'موجود (' + d.imgs.length + ')' : '❌ غير موجود');
      console.log('  category:', d.category);
      console.log('  price:', d.price);
    }
    // عد إجمالي المنتجات
    const all = await db.collection('products').get();
    console.log('\n=== إجمالي المنتجات:', all.size);
    // عد الأقسام
    const cats = await db.collection('config').doc('categories').get();
    if (cats.exists) {
      const cl = cats.data().list || [];
      console.log('=== الأقسام في Firestore:', cl.length);
      cl.forEach(c => console.log('  -', c.key, ':', c.name));
    }
    process.exit(0);
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
})();
