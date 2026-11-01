const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const sa = require('/data/data/com.termux/files/home/wa-otp/serviceAccountKey.json');
const catalog = require('./seed-catalog.js');

initializeApp({ credential: cert(sa) });
const db = getFirestore();

const DRY_RUN = process.argv[2] !== '--commit';
const DELETE_OLD = process.argv.includes('--delete-old');

function photoUrls(kw, idx) {
  // 4 صور: رئيسية + 3 بدائل (loremflickr مستقر)
  const base = idx * 10;
  return [
    `https://loremflickr.com/500/500/${kw}?lock=${base + 1}`,
    `https://loremflickr.com/500/500/${kw}?lock=${base + 2}`,
    `https://loremflickr.com/500/500/${kw}?lock=${base + 3}`,
    `https://loremflickr.com/500/500/${kw}?lock=${base + 4}`
  ];
}

(async () => {
  try {
    console.log(DRY_RUN ? '🔍 DRY RUN — no writes will happen' : '🚀 COMMIT MODE — writing to Firestore');
    console.log('');

    // عد المنتجات الحالية
    const existing = await db.collection('products').get();
    console.log('المنتجات الحالية في Firestore:', existing.size);

    if (DELETE_OLD && !DRY_RUN) {
      console.log('🗑️  حذف المنتجات القديمة...');
      const batch = db.batch();
      existing.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      console.log('✅ حُذفت', existing.size, 'منتج');
    }

    // بناء قائمة الـ 100
    const all = [];
    let idx = 0;
    for (const catKey of Object.keys(catalog)) {
      for (const item of catalog[catKey]) {
        idx++;
        const photos = photoUrls(item.kw, idx);
        all.push({
          name: item.n,
          brand: item.b,
          category: catKey,
          price: item.p,
          old: item.o || null,
          desc: item.d,
          features: item.f,
          img: photos[0],
          imgs: photos,
          rating: 4.5 + (Math.random() * 0.5),
          reviews: Math.floor(Math.random() * 200) + 20,
          sold: Math.floor(Math.random() * 500),
          stock: 50,
          badge: null,
          colors: [],
          active: true,
          featured: false,
          createdAt: new Date()
        });
      }
    }

    console.log('منتجات جاهزة للزرع:', all.length);
    console.log('');
    console.log('نموذج أول منتج:');
    console.log(JSON.stringify(all[0], null, 2));

    if (DRY_RUN) {
      console.log('');
      console.log('✅ DRY RUN OK — للتطبيق الفعلي:');
      console.log('   node seed-100.js --commit --delete-old   (حذف القديم + زرع 100)');
      console.log('   node seed-100.js --commit                 (زرع فوق الموجود)');
      process.exit(0);
    }

    // كتابة بـ batch (500 max — لدينا 100 فقط)
    console.log('');
    console.log('⏳ جاري الزرع...');
    const batch = db.batch();
    all.forEach(p => {
      const ref = db.collection('products').doc();
      batch.set(ref, p);
    });
    await batch.commit();
    console.log('✅ تم زرع 100 منتج بنجاح');

    // تحقق نهائي
    const final = await db.collection('products').get();
    console.log('');
    console.log('إجمالي المنتجات الآن:', final.size);
    process.exit(0);
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
})();
