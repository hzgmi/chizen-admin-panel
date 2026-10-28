const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

const v200 = `
<script id="v200-worker-upload">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.__v102cReady) return setTimeout(hook, 100); // ننتظر حتى يتم تحميل النموذج
    if(window.__v200Ready) return;
    window.__v200Ready = true;

    var WORKER_URL = "https://chizen-uploader.hazimchat.workers.dev";

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
      if(!res.ok) throw new Error('فشل الرفع: ' + res.status);
      var data = await res.json();
      if(!data.url) throw new Error('لم يتم إرجاع رابط');
      return data.url;
    }

    // استبدال دالة الرفع القديمة (التي تطلب توكن) بالدالة الجديدة
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
      if(success === 0 && total > 0) throw new Error('فشل رفع الصور');
    };
    
    // منع ظهور مودال التوكن القديم نهائياً
    window.__v102b_showTokenModal = function(){ return Promise.resolve("worker-handled"); };

    console.log('[V200] Cloudflare Worker upload active. No tokens needed.');
  }
  hook();
})();
</script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + v200 + h.slice(idx);
fs.writeFileSync('index.html', h);
console.log('✅ تم تفعيل الرفع عبر Cloudflare Worker (بدون توكن)');
