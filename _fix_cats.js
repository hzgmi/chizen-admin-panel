const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const sa = require('/data/data/com.termux/files/home/wa-otp/serviceAccountKey.json');
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const auth = getAuth();

// ═══ 1. إصلاح catLabels ═══
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;
const catRe = /var catLabels = \{[^}]+\};/;
const newCats = "var catLabels = {electronics:'إلكترونيات',fashion:'أزياء',clothing:'ملابس',sports:'أدوات رياضية',beauty:'جمال وعطور',kids:'مستلزمات أطفال',tools:'أدوات منزلية',home:'منزل وأثاث'};";
if (catRe.test(h)) {
  h = h.replace(catRe, newCats);
  fs.writeFileSync('index.html', h);
  console.log('✅ catLabels fixed |', before, '->', h.length);
} else {
  console.log('⚠️ catLabels not found — skipped');
}

// ═══ 2. إنشاء حسابي clothing + tools ═══
const PASSWORD = 'Chizen@2026';
const DOMAIN = 'chizen-app.test';
const TO_CREATE = [
  { key:'clothing', name:'ملابس' },
  { key:'tools',    name:'أدوات منزلية' },
];

(async () => {
  for (const c of TO_CREATE) {
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
    console.log(`   📧 ${email} | 🔑 ${PASSWORD} | 🆔 ${uid}`);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
