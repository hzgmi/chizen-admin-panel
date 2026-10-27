const fs = require('fs');
const path = require('path');
const HOME = process.env.HOME;

const adminHtml = fs.readFileSync('index.html', 'utf8');
const clientHtml = fs.readFileSync(path.join(HOME, 'chizen-app/client/chizen.html'), 'utf8');

console.log('════════════════════════════════════════════════════');
console.log('  🔍 فحص البانرات (الأدمن + العميل)');
console.log('════════════════════════════════════════════════════\n');

// ═══ 1) الأدمن: زر التبويب ═══
console.log('📌 1) الأدمن — زر التبويب:');
const tabBtnMatch = adminHtml.match(/<button[^>]*onclick="A\.tab\(['"]banners['"][^>]*>([^<]*)<\/button>/);
console.log('  ' + (tabBtnMatch ? '✅ "' + tabBtnMatch[1].trim() + '"' : '❌ زر البانرات مفقود'));

// ═══ 2) الأدمن: شاشة البانرات ═══
console.log('\n📌 2) الأدمن — شاشة HTML:');
const scStart = adminHtml.indexOf('id="sc-banners"');
console.log('  ' + (scStart !== -1 ? '✅ sc-banners موجودة' : '❌ sc-banners مفقودة'));

if (scStart !== -1) {
  const scEnd = adminHtml.indexOf('<div class="sc"', scStart + 100);
  const scContent = adminHtml.slice(scStart, scEnd !== -1 ? scEnd : scStart + 2000);
  
  // حقول الإدخال
  ['bn-img', 'bn-title', 'bn-sub', 'bn-btn', 'bn-link'].forEach(field => {
    console.log('  ' + (scContent.includes('id="' + field + '"') ? '✅' : '❌') + ' حقل: ' + field);
  });
  
  // حاوية القائمة
  console.log('  ' + (scContent.includes('id="banners-list"') ? '✅' : '❌') + ' banners-list');
  
  // زر الإضافة
  console.log('  ' + (scContent.includes('onclick="A.saveBanner()"') ? '✅' : '❌') + ' زر إضافة بانر');
}

// ═══ 3) الأدمن: دوال JavaScript ═══
console.log('\n📌 3) الأدمن — دوال:');
const adminFns = ['saveBanner', 'loadBanners', 'deleteBanner'];
adminFns.forEach(fn => {
  const exists = new RegExp(fn + '\\s*:\\s*(?:async\\s+)?function').test(adminHtml) ||
                 new RegExp(fn + '\\s*=\\s*(?:async\\s+)?function').test(adminHtml);
  console.log('  ' + (exists ? '✅' : '❌') + ' ' + fn);
});

// ═══ 4) الأدمن: كيف يحفظ البيانات؟ ═══
console.log('\n📌 4) الأدمن — كيفية الحفظ في Firebase:');
const saveMatch = adminHtml.match(/saveBanner\s*:\s*(?:async\s+)?function[\s\S]*?\n\s{2,4}\}/);
if (saveMatch) {
  const body = saveMatch[0];
  console.log('  ' + (body.includes("config") ? '✅ يستخدم config' : '❌ لا يستخدم config'));
  console.log('  ' + (body.includes("'banners'") || body.includes('"banners"') ? '✅ doc banners' : '❌ doc banners مفقود'));
  console.log('  ' + (body.includes(".set(") ? '✅ يستخدم .set()' : '❌ لا يستخدم .set()'));
  console.log('  ' + (body.includes("merge: true") || body.includes("merge:true") ? '✅ merge' : '⚠️ بدون merge'));
  
  // استخراج البنية
  const structureMatch = body.match(/\{\s*list:\s*arr[^}]*\}/);
  if (structureMatch) {
    console.log('  📋 البنية: ' + structureMatch[0]);
  }
}

// ═══ 5) الأدمن: كيف يحمل البانرات؟ ═══
console.log('\n📌 5) الأدمن — كيفية التحميل:');
const loadMatch = adminHtml.match(/loadBanners\s*:\s*(?:async\s+)?function[\s\S]*?\n\s{2,4}\}/);
if (loadMatch) {
  const body = loadMatch[0];
  console.log('  ' + (body.includes("config") ? '✅ يستخدم config' : '❌'));
  console.log('  ' + (body.includes(".get(") ? '✅ يستخدم .get()' : '❌'));
  console.log('  ' + (body.includes("doc.data().list") ? '✅ يقرأ doc.data().list' : '❌ لا يقرأ list'));
}

// ═══ 6) العميل: كيف يحمل البانرات؟ ═══
console.log('\n📌 6) العميل — كيفية التحميل:');
// في chizen.html، يبحث عن getBanners
const getBannersMatch = clientHtml.match(/getBanners\s*:\s*(?:async\s+)?function[\s\S]*?\n\s{2,4}\}/);
if (getBannersMatch) {
  const body = getBannersMatch[0];
  console.log('  ✅ FB.getBanners موجودة');
  console.log('  ' + (body.includes("'banners'") || body.includes('"banners"') ? '✅ doc banners' : '❌ doc banners مفقود'));
  console.log('  ' + (body.includes("d.list") || body.includes("data().list") ? '✅ يقرأ list' : '❌ لا يقرأ list'));
} else {
  console.log('  ⚠️ getBanners في chizen.html غير موجودة مباشرة (قد تكون في firebase-service.js)');
}

// ═══ 7) العميل: كيف يعرض البانرات؟ ═══
console.log('\n📌 7) العميل — كيف يعرض renderBanners:');
const renderMatch = clientHtml.match(/renderBanners\s*:\s*function[\s\S]*?\n\s{2,4}\}/);
if (renderMatch) {
  const body = renderMatch[0];
  console.log('  ✅ renderBanners موجودة');
  console.log('  ' + (body.includes("'slides'") ? '✅ حاوية slides' : '❌ slides مفقودة'));
  console.log('  ' + (body.includes("'dots'") ? '✅ حاوية dots' : '❌ dots مفقودة'));
  console.log('  ' + (body.includes('b.img') ? '✅ يستخدم b.img' : '❌ لا يستخدم b.img'));
  console.log('  ' + (body.includes('b.title') ? '✅ يستخدم b.title' : '❌ لا يستخدم b.title'));
} else {
  console.log('  ❌ renderBanners مفقودة!');
}

// ═══ 8) العميل: كيف يحمل البيانات؟ ═══
console.log('\n📌 8) العميل — تحميل البيانات من Firebase:');
const getBannersCalls = clientHtml.match(/getConfig\(['"]banners['"]\)/g);
console.log('  ' + (getBannersCalls ? '✅ getConfig(banners) موجودة (' + getBannersCalls.length + ')' : '❌ getConfig(banners) مفقودة'));

// ═══ 9) التحقق من تطابق البنية ═══
console.log('\n📌 9) تطابق البنية بين الأدمن والعميل:');
console.log('  الأدمن يحفظ: { list: [{ img, title, sub, btn, link }] }');
console.log('  العميل يقرأ: b.img, b.title, b.sub, b.btn');
console.log('  ' + (adminHtml.includes('img:') && clientHtml.includes('b.img') ? '✅ متطابق' : '⚠️ تحقق يدوياً'));

// ═══ 10) فحص Syntax للدوال ═══
console.log('\n📌 10) فحص Syntax لدوال البانرات:');
const os = require('os');
adminFns.forEach(fn => {
  const fnMatch = adminHtml.match(new RegExp(fn + '\\s*:\\s*(?:async\\s+)?function\\s*\\([^)]*\\)\\s*\\{'));
  if (fnMatch) {
    let depth = 1, pos = fnMatch.index + fnMatch[0].length;
    while (pos < adminHtml.length && depth > 0) {
      if (adminHtml[pos] === '{') depth++;
      else if (adminHtml[pos] === '}') depth--;
      pos++;
    }
    const fnCode = adminHtml.slice(fnMatch.index, pos);
    const tmp = path.join(os.tmpdir(), 'bn_' + fn + '_' + Date.now() + '.js');
    try {
      fs.writeFileSync(tmp, 'var x = {' + fnCode + '};');
      require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 5000 });
      console.log('  ✅ ' + fn + ' سليم');
    } catch (e) {
      console.log('  ❌ ' + fn + ' خطأ');
    } finally { try { fs.unlinkSync(tmp); } catch(_){} }
  }
});
