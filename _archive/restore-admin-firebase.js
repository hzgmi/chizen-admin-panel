const fs = require('fs');
const path = require('path');
const HOME = process.env.HOME;

// ═══ 1) نسخ firebase-config.js من العميل (نفس المشروع) ═══
const clientConfig = path.join(HOME, 'chizen-app/client/firebase-config.js');
const adminConfig = 'firebase-config.js';

if (fs.existsSync(clientConfig)) {
  fs.copyFileSync(clientConfig, adminConfig);
  console.log('✅ تم نسخ firebase-config.js من العميل');
} else {
  console.log('❌ firebase-config.js غير موجود في العميل!');
}

// ═══ 2) نسخ firebase-service.js من العميل ═══
const clientService = path.join(HOME, 'chizen-app/client/firebase-service.js');
const adminService = 'firebase-service.js';

if (fs.existsSync(clientService)) {
  fs.copyFileSync(clientService, adminService);
  console.log('✅ تم نسخ firebase-service.js من العميل');
} else {
  console.log('❌ firebase-service.js غير موجود في العميل!');
}

// ═══ 3) التحقق من admin-fix.js ═══
if (!fs.existsSync('admin-fix.js')) {
  console.log('⚠️ admin-fix.js مفقود — نتحقق من index.html');
  
  // ابحث عن مرجع admin-fix.js في index.html
  const html = fs.readFileSync('index.html', 'utf8');
  if (html.includes('admin-fix.js')) {
    console.log('  ⚠️ index.html يشير إلى admin-fix.js لكنه غير موجود!');
    console.log('  → سنحذف المرجع لتجنب خطأ 404');
    
    // احذف السطر الذي يحتوي على admin-fix.js
    let newHtml = html.replace(/<script[^>]*src=["']admin-fix\.js["'][^>]*><\/script>\s*\n?/g, '');
    fs.writeFileSync('index.html', newHtml);
    console.log('  ✅ تم حذف المرجع من index.html');
  } else {
    console.log('  ✅ لا يوجد مرجع لـ admin-fix.js في index.html');
  }
}

// ═══ 4) التحقق النهائي ═══
console.log('\n════════ التحقق ════════');
['firebase-config.js', 'firebase-service.js', 'admin-fix.js'].forEach(f => {
  console.log('  ' + (fs.existsSync(f) ? '✅' : '❌') + ' ' + f);
});
