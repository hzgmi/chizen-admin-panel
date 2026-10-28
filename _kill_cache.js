const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="chizen-cache-killer"')) {
  console.log('⚠️ كود إلغاء الكاش موجود مسبقاً');
  process.exit(0);
}

const cacheKiller = `
<!-- CHIZEN CACHE KILLER -->
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<script id="chizen-cache-killer">
(function(){
  // 1. إلغاء تسجيل أي Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      for(var i=0; i<regs.length; i++) regs[i].unregister();
    });
  }
  // 2. مسح كل الكاش (Cache API)
  if (window.caches) {
    caches.keys().then(function(keys) {
      keys.forEach(function(key) { caches.delete(key); });
    });
  }
  console.log('[CHIZEN] SW & Caches Cleared.');
})();
</script>
<!-- END CHIZEN CACHE KILLER -->
`;

// حقن الكود في أقرب مكان لـ <head>
const headMatch = h.match(/<head[^>]*>/i);
if (headMatch) {
  const insertPos = headMatch.index + headMatch[0].length;
  h = h.slice(0, insertPos) + cacheKiller + h.slice(insertPos);
  fs.writeFileSync('index.html', h);
  console.log('✅ تم حقن كود إلغاء الكاش في <head> |', before, '->', h.length);
} else {
  console.log('❌ لم يتم العثور على <head>');
}
