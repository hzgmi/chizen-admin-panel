const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const sa = require('/data/data/com.termux/files/home/wa-otp/serviceAccountKey.json');
const catalog = require('./seed-catalog.js');

initializeApp({ credential: cert(sa) });
const db = getFirestore();

// صور Unsplash حقيقية لكل قسم (4-6 صور لكل قسم)
const PHOTOS = {
  electronics: [
    'photo-1511707171634-5f897ff02aa9',
    'photo-1514473776127-61e2dc1dded3',
    'photo-1704230972797-e0e3aba0fce7',
    'photo-1546435770-a3e426bf472b',
    'photo-1585011664466-b7bbe92f34ef',
    'photo-1496181133206-80ce9b88a853'
  ],
  fashion: [
    'photo-1445205170230-053b83016050',
    'photo-1548036328-c9fa89d128fa',
    'photo-1550639525-c97d455acf70',
    'photo-1469334031218-e382a71b716b',
    'photo-1483985988355-763728e1935b'
  ],
  clothing: [
    'photo-1523381210434-271e8be1f52b',
    'photo-1521572163474-6864f9cf17ab',
    'photo-1576566588028-4147f3842f27',
    'photo-1503341504253-dff4815485f1',
    'photo-1489987707025-afc232f7ea0f'
  ],
  sports: [
    'photo-1542291026-7eec264c27ff',
    'photo-1460353581641-37baddab0fa2',
    'photo-1517836357463-d25dfeac3438',
    'photo-1571019613454-1cb2f99b2d8b',
    'photo-1534438327276-14e5300c3a48'
  ],
  beauty: [
    'photo-1596462502278-27bfdc403348',
    'photo-1512496015851-a90fb38ba796',
    'photo-1541643600914-78b084683601',
    'photo-1592945403244-b3fbafd7f539',
    'photo-1522335789203-aabd1fc54bc9'
  ],
  kids: [
    'photo-1558060370-d644479cb6f7',
    'photo-1596461404969-9ae70f2830c1',
    'photo-1566576912321-d58ddd7a6088',
    'photo-1515488042361-ee00e0ddd4e4',
    'photo-1519689680058-324335c77eba'
  ],
  tools: [
    'photo-1581235720704-06d3acfcb36f',
    'photo-1530124566582-a618bc2615dc',
    'photo-1504148455328-c376907d081c',
    'photo-1572981779307-38b8cabb2407',
    'photo-1416879595882-3373a0480b5b'
  ],
  home: [
    'photo-1513694203232-719a280e022f',
    'photo-1567767292278-a4f21aa2d36e',
    'photo-1580480055273-228ff5388ef8',
    'photo-1555041469-a586c61ea9bc',
    'photo-1493663284031-b7e3aefcae8e'
  ]
};

function imgUrl(id) {
  return `https://images.unsplash.com/${id}?w=500&q=80&auto=format&fit=crop`;
}

(async () => {
  try {
    console.log('🚀 إعادة الزرع بصور Unsplash الحقيقية');
    console.log('');

    // حذف الكل
    const existing = await db.collection('products').get();
    console.log('🗑️  حذف', existing.size, 'منتج قديم...');
    const delBatch = db.batch();
    existing.docs.forEach(d => delBatch.delete(d.ref));
    await delBatch.commit();
    console.log('✅ حُذف الكل');
    console.log('');

    // بناء الـ 100
    const all = [];
    let globalIdx = 0;
    for (const catKey of Object.keys(catalog)) {
      const photos = PHOTOS[catKey];
      let photoIdx = 0;
      for (const item of catalog[catKey]) {
        globalIdx++;
        // 4 صور: نأخذ من مجموعة القسم بالتناوب
        const imgs = [];
        for (let k = 0; k < 4; k++) {
          imgs.push(imgUrl(photos[(photoIdx + k) % photos.length]));
        }
        photoIdx++;
        all.push({
          name: item.n,
          brand: item.b,
          category: catKey,
          price: item.p,
          old: item.o || null,
          desc: item.d,
          features: item.f,
          img: imgs[0],
          imgs: imgs,
          rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
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

    console.log('منتجات جاهزة:', all.length);
    console.log('نموذج:', all[0].name, '|', all[0].img);
    console.log('');

    // كتابة
    console.log('⏳ جاري الزرع...');
    const batch = db.batch();
    all.forEach(p => {
      const ref = db.collection('products').doc();
      batch.set(ref, p);
    });
    await batch.commit();
    console.log('✅ تم زرع 100 منتج بصور حقيقية');

    const final = await db.collection('products').get();
    console.log('');
    console.log('إجمالي المنتجات الآن:', final.size);
    process.exit(0);
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
})();
