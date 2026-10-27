const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const sa = require('/data/data/com.termux/files/home/wa-otp/serviceAccountKey.json');
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const auth = getAuth();

const CATS = [
  { key:'electronics', name:'إلكترونيات' },
  { key:'fashion',     name:'أزياء' },
  { key:'home',        name:'منزل' },
  { key:'beauty',      name:'تجميل' },
  { key:'kids',        name:'أطفال' },
  { key:'sports',      name:'رياضة' },
  { key:'groceries',   name:'بقالة' },
  { key:'auto',        name:'سيارات' },
];
const PASSWORD = 'Chizen@2026';
const DOMAIN = 'chizen-app.test';

(async () => {
  const ex = await db.collection('users').where('role','==','cat_manager').get();
  const taken = new Set();
  ex.forEach(d => { const c = d.data().assignedCategory; if(c) taken.add(c); });
  console.log('أقسام لها مدير:', Array.from(taken));

  const report = [];
  for (const c of CATS) {
    if (taken.has(c.key)) { console.log(`⏭️  ${c.key}: مدير موجود`); continue; }
    const email = `${c.key}.mgr@${DOMAIN}`;
    let uid;
    try {
      const u = await auth.createUser({ email, password: PASSWORD, displayName:`مدير ${c.name} (مؤقت)`, emailVerified:true });
      uid = u.uid;
      console.log(`✅ Auth: ${email}`);
    } catch(e) {
      if (e.code === 'auth/email-already-exists') {
        uid = (await auth.getUserByEmail(email)).uid;
        console.log(`♻️  موجود: ${email}`);
      } else { console.error(`❌ ${email}:`, e.message); continue; }
    }
    await db.collection('users').doc(uid).set({
      name:`مدير ${c.name} (مؤقت)`, email, phone:'0000000000',
      role:'cat_manager', assignedCategory:c.key,
      isTemporary:true, createdAt:new Date()
    }, { merge:true });
    report.push({ cat:c.key, catName:c.name, email, uid });
  }

  console.log('\n═══════════ بيانات الدخول ═══════════');
  report.forEach(r => {
    console.log(`\n📂 ${r.catName} (${r.cat})`);
    console.log(`   📧 ${r.email}`);
    console.log(`   🔑 ${PASSWORD}`);
    console.log(`   🆔 ${r.uid}`);
  });
  console.log(`\nتم إنشاء ${report.length} حساب.`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
