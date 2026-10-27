const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const sa = require('/data/data/com.termux/files/home/wa-otp/serviceAccountKey.json');
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const BRANDS = [
  { nameAr: 'آبل', nameEn: 'Apple', domain: 'apple.com' },
  { nameAr: 'سامسونج', nameEn: 'Samsung', domain: 'samsung.com' },
  { nameAr: 'سوني', nameEn: 'Sony', domain: 'sony.com' },
  { nameAr: 'نايكي', nameEn: 'Nike', domain: 'nike.com' },
  { nameAr: 'أديداس', nameEn: 'Adidas', domain: 'adidas.com' },
  { nameAr: 'ايكيا', nameEn: 'IKEA', domain: 'ikea.com' },
  { nameAr: 'شانيل', nameEn: 'Chanel', domain: 'chanel.com' },
  { nameAr: 'غوتشي', nameEn: 'Gucci', domain: 'gucci.com' },
  { nameAr: 'راي بان', nameEn: 'Ray-Ban', domain: 'ray-ban.com' },
  { nameAr: 'زارا', nameEn: 'Zara', domain: 'zara.com' },
  { nameAr: 'هوغو بوس', nameEn: 'Hugo Boss', domain: 'hugoboss.com' },
  { nameAr: 'ليفايس', nameEn: "Levi's", domain: 'levi.com' },
  { nameAr: 'لوريال', nameEn: "L'Oréal", domain: 'loreal.com' },
  { nameAr: 'بوش', nameEn: 'Bosch', domain: 'bosch.com' },
  { nameAr: 'ستانلي', nameEn: 'Stanley', domain: 'stanleytools.com' },
  { nameAr: 'فيليبس', nameEn: 'Philips', domain: 'philips.com' },
  { nameAr: 'ليغو', nameEn: 'LEGO', domain: 'lego.com' },
  { nameAr: 'بامبرز', nameEn: 'Pampers', domain: 'pampers.com' },
  { nameAr: 'غارمين', nameEn: 'Garmin', domain: 'garmin.com' },
  { nameAr: 'يونيكلو', nameEn: 'Uniqlo', domain: 'uniqlo.com' },
  { nameAr: 'شاومي', nameEn: 'Xiaomi', domain: 'mi.com' },
  { nameAr: 'كانون', nameEn: 'Canon', domain: 'canon.com' },
  { nameAr: 'ديل', nameEn: 'Dell', domain: 'dell.com' },
  { nameAr: 'رولكس', nameEn: 'Rolex', domain: 'rolex.com' }
];

const list = BRANDS.map(b => ({
  nameAr: b.nameAr,
  nameEn: b.nameEn,
  domain: b.domain,
  logo: `https://www.google.com/s2/favicons?domain=${b.domain}&sz=128`,
  active: true
}));

(async () => {
  await db.collection('config').doc('brands').set({ list: list, updatedAt: new Date() }, { merge: true });
  const check = await db.collection('config').doc('brands').get();
  console.log('✅ Seeded ' + check.data().list.length + ' brands');
  console.log('Sample:', JSON.stringify(check.data().list[0], null, 2));
  process.exit(0);
})();
