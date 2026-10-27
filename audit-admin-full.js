const fs = require('fs');
const path = require('path');
const os = require('os');
const adminFile = 'index.html';
const html = fs.readFileSync(adminFile, 'utf8');
const clientFile = path.join(process.env.HOME, 'chizen-app/client/chizen.html');
const clientHtml = fs.readFileSync(clientFile, 'utf8');

console.log('════════════════════════════════════════════════════');
console.log('  🔍 الفحص الشامل للأدمن');
console.log('════════════════════════════════════════════════════\n');
console.log('📊 الحجم: ' + (html.length / 1024).toFixed(1) + ' KB | ' + html.split('\n').length + ' سطر\n');

let score = 0, total = 0;
function check(name, cond, points = 1) {
  total += points;
  if (cond) { score += points; console.log('  ✅ ' + name); }
  else console.log('  ❌ ' + name);
}

// ═══════════════════════════════════════════
// 1) الهيكل الأساسي
// ═══════════════════════════════════════════
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 1) الهيكل الأساسي');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
check('DOCTYPE', html.includes('<!DOCTYPE'));
check('HTML/Body', html.includes('<html') && html.includes('<body') && html.includes('</body>'));
check('Container الرئيسي', html.includes('id="app"') || html.includes('class="app"'));
check('Login Screen', html.includes('login') || html.includes('auth'));

// ═══════════════════════════════════════════
// 2) Firebase
// ═══════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 2) Firebase');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
check('firebase-app-compat.js', html.includes('firebase-app-compat'));
check('firebase-auth-compat.js', html.includes('firebase-auth-compat'));
check('firebase-firestore-compat.js', html.includes('firebase-firestore-compat'));
check('firebase-config.js', html.includes('firebase-config.js'));
check('firebase-service.js', html.includes('firebase-service.js'));

// ═══════════════════════════════════════════
// 3) ربط العميل والأدمن بنفس المشروع
// ═══════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 3) ربط الأدمن بالعميل (نفس المشروع)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
function getProjectId(src) {
  const m = src && src.match(/projectId\s*:\s*["']([^"']+)["']/);
  return m ? m[1] : null;
}
const adminCfg = fs.existsSync('firebase-config.js') ? fs.readFileSync('firebase-config.js', 'utf8') : '';
const clientCfg = fs.existsSync(path.join(process.env.HOME, 'chizen-app/client/firebase-config.js'))
  ? fs.readFileSync(path.join(process.env.HOME, 'chizen-app/client/firebase-config.js'), 'utf8') : '';
const adminProject = getProjectId(adminCfg);
const clientProject = getProjectId(clientCfg);
console.log('  🔗 admin projectId:  ' + (adminProject || '❌'));
console.log('  🔗 client projectId: ' + (clientProject || '❌'));
check('نفس مشروع Firebase', adminProject && clientProject && adminProject === clientProject);

// ═══════════════════════════════════════════
// 4) التبويبات الرئيسية
// ═══════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 4) التبويبات');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const tabs = [
  ['dash', '📊 الرئيسية'],
  ['reports', '📈 التقارير'],
  ['products', '📦 المنتجات'],
  ['brands', '🏷️ الماركات'],
  ['cats', '📂 الأقسام'],
  ['pays', '💳 المدفوعات'],
  ['orders', '🛒 الطلبات'],
  ['push', '🔔 الإشعارات'],
  ['flights', '✈️ الحجوزات'],
  ['sups', '🏪 الموردين'],
  ['balances', '💰 الأرصدة'],
  ['delivery', '🚚 التوصيل'],
  ['users', '👥 العملاء'],
  ['employees', '👤 الموظفين'],
  ['admins', '🛡️ المدراء'],
  ['settings', '⚙️ الإعدادات'],
  ['banners', '🖼️ البانرات']
];
let tabCount = 0;
tabs.forEach(([tab, label]) => {
  const btnExists = html.includes(`A.tab('${tab}'`) || html.includes(`A.tab("${tab}"`);
  const scExists = html.includes(`id="sc-${tab}"`);
  if (btnExists && scExists) { tabCount++; }
  console.log('  ' + ((btnExists && scExists) ? '✅' : '❌') + ' ' + label + (btnExists ? '' : ' (زر مفقود)') + (scExists ? '' : ' (شاشة مفقودة)'));
});
check('كل التبويبات موجودة (' + tabCount + '/' + tabs.length + ')', tabCount === tabs.length);

// ═══════════════════════════════════════════
// 5) دوال الإدارة الرئيسية
// ═══════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 5) دوال الإدارة الرئيسية');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const functions = [
  ['checkAdmin', 'التحقق من الأدمن'],
  ['isProtectedCat', 'حماية الأقسام'],
  ['access', 'التحقق من الصلاحيات'],
  ['tab', 'التنقل بين التبويبات'],
  ['renderDash', 'عرض الرئيسية'],
  ['renderProducts', 'عرض المنتجات'],
  ['renderCats', 'عرض الأقسام'],
  ['renderOrders', 'عرض الطلبات'],
  ['renderEmployees', 'عرض الموظفين'],
  ['saveBanner', 'حفظ البانر'],
  ['loadBanners', 'تحميل البانرات'],
  ['deleteBanner', 'حذف البانر'],
  ['sendPush', 'إرسال إشعار'],
  ['applyPermissions', 'صلاحيات الموظفين']
];
let fnCount = 0;
functions.forEach(([fn, label]) => {
  const exists = new RegExp(fn + '\\s*[:=]').test(html);
  if (exists) fnCount++;
  console.log('  ' + (exists ? '✅' : '❌') + ' ' + label);
});
check('كل الدوال موجودة (' + fnCount + '/' + functions.length + ')', fnCount === functions.length);

// ═══════════════════════════════════════════
// 6) Firebase Collections (مطابقة للعميل)
// ═══════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 6) Firestore Collections (مطابقة العميل)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const collections = ['products', 'orders', 'bookings', 'users', 'admins', 'config', 'notifications', 'push_queue'];
collections.forEach(col => {
  const inAdmin = new RegExp("collection\\(['\"]" + col + "['\"]\\)").test(html);
  const inClient = new RegExp("collection\\(['\"]" + col + "['\"]\\)").test(clientHtml);
  const match = inAdmin && inClient;
  console.log('  ' + (match ? '✅' : '⚠️ ') + col + ' (admin: ' + (inAdmin ? '✓' : '✗') + ', client: ' + (inClient ? '✓' : '✗') + ')');
});

// ═══════════════════════════════════════════
// 7) فحص Syntax
// ═══════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 7) فحص Syntax');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0, syntaxErrs = 0;
while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (/src\s*=/.test(sc[1])) continue;
  if (!sc[2].trim()) continue;
  const tmp = path.join(os.tmpdir(), 'admchk_' + i + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
  } catch (e) {
    syntaxErrs++;
    const errLine = (e.stderr || '').toString().match(/:(\d+)/);
    console.log('  ❌ block #' + i + (errLine ? ' (سطر ' + errLine[1] + ')' : ''));
  }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}
console.log('  ' + (syntaxErrs === 0 ? '✅ كل ' + i + ' كتلة سليمة' : '❌ ' + syntaxErrs + ' خطأ من ' + i));
check('JavaScript سليم', syntaxErrs === 0, 3);

// ═══════════════════════════════════════════
// 8) الملفات الخارجية
// ═══════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 8) الملفات الخارجية');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const extScripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]);
extScripts.filter(s => !s.startsWith('http')).forEach(s => {
  const exists = fs.existsSync(s);
  console.log('  ' + (exists ? '✅' : '❌') + ' ' + s);
});

// ═══════════════════════════════════════════
// التقييم
// ═══════════════════════════════════════════
console.log('\n════════════════════════════════════════════════════');
console.log('  📊 التقييم النهائي');
console.log('════════════════════════════════════════════════════');
const percent = Math.round((score / total) * 100);
console.log('  مجموع: ' + score + ' / ' + total + ' (' + percent + '%)');
if (percent >= 95) console.log('  🏆 ممتاز — الأدمن جاهز');
else if (percent >= 80) console.log('  ✅ جيد — تحسينات بسيطة');
else if (percent >= 60) console.log('  ⚠️ يحتاج إصلاحات');
else console.log('  ❌ يحتاج عمل كثير');
