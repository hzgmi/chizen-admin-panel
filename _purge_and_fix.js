const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// قائمة الأكواد القديمة والمتعارضة التي سيتم حذفها نهائياً
const toRemove = [
  'v97b-theme', 'v97c-css', 'v97e-pro', 'v97e-redesign-js',
  'v97f-css', 'v97f-dashboard', 'v97h-css', 'v97i2-css',
  'v102c-main', 'v102d-main'
];

toRemove.forEach(id => {
  // حذف الـ style
  const s1 = `<style id="${id}"`; const e1 = `</style>`;
  let i = h.indexOf(s1);
  while(i !== -1) { const end = h.indexOf(e1, i); if(end!==-1) h = h.slice(0,i)+h.slice(end+e1.length); i = h.indexOf(s1); }
  
  // حذف الـ script
  const s2 = `<script id="${id}"`; const e2 = `</script>`;
  i = h.indexOf(s2);
  while(i !== -1) { const end = h.indexOf(e2, i); if(end!==-1) h = h.slice(0,i)+h.slice(end+e2.length); i = h.indexOf(s2); }
});

// زرع سكربت الرفع النظيف (بدون أي مودال توكن)
const cleanJs = `
<script id="v102f-main">
(function(){
  var WORKER_URL = "https://chizen-uploader.hazimchat.workers.dev";
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 100);
    if(window.__v102fReady) return;
    window.__v102fReady = true;

    function compressImage(file, maxDim, quality) {
      return new Promise(function(resolve, reject){
        var img = new Image();
        var url = URL.createObjectURL(file);
        img.onload = function(){
          URL.revokeObjectURL(url);
          var w = img.width, h = img.height;
          if(w > maxDim || h > maxDim){
            if(w > h){ h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(function(blob){
            if(!blob) return reject(new Error('compress failed'));
            resolve(blob);
          }, 'image/jpeg', quality);
        };
        img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('load failed')); };
        img.src = url;
      });
    }

    async function uploadToWorker(file) {
      var compressed = await compressImage(file, 1200, 0.82);
      var res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: compressed
      });
      if(!res.ok) throw new Error('فشل الرفع');
      var data = await res.json();
      if(!data.url) throw new Error('لم يتم إرجاع رابط');
      return data.url;
    }

    // تعريف الدالة التي يتوقعها نموذج المنتج v102
    window.__v102c_uploadBatch = async function(files, category, callbacks){
      callbacks = callbacks || {};
      var onProgress = callbacks.onProgress || function(){};
      var onUrl = callbacks.onUrl || function(){};
      var onError = callbacks.onError || function(e){ console.error(e); };
      var total = files.length, success = 0;
      for(var i=0; i<total; i++){
        try {
          var url = await uploadToWorker(files[i]);
          onUrl(url); success++;
          onProgress(Math.round((i+1)/total*100));
        } catch(e){ onError(e); }
      }
      if(success === 0 && total > 0) throw new Error('فشل الرفع');
    };
    console.log('[V102f] Clean uploader ready.');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + cleanJs + h.slice(idx);

fs.writeFileSync('index.html', h);
console.log('✅ تم تنظيف الملف وزرع كود الرفع النظيف |', before, '->', h.length);
