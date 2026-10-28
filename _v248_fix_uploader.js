const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. إصلاح v200: استبدال الشرط المعلّق
h = h.replace(
  "if(!window.__v102cReady) return setTimeout(hook, 100);",
  "if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 100);"
);

// 2. v248: uploader مستقل (يعمل بغض النظر عن v200)
h = h.replace(/<script id="v248-uploader">[\s\S]*?<\/script>/g, '');
const v248 = `
<script id="v248-uploader">
(function(){
  var WORKER_URL = "https://chizen-uploader.hazimchat.workers.dev";
  
  function compressImage(file, maxDim, quality) {
    return new Promise(function(resolve, reject){
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function(){
        URL.revokeObjectURL(url);
        var w = img.width, h = img.height;
        if(w > maxDim || h > maxDim){
          if(w > h){ h = Math.round(h*maxDim/w); w = maxDim; }
          else { w = Math.round(w*maxDim/h); h = maxDim; }
        }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob(function(b){ b ? resolve(b) : reject(new Error('compress')); }, 'image/jpeg', quality);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('load')); };
      img.src = url;
    });
  }
  
  async function uploadOne(file) {
    var blob = await compressImage(file, 1200, 0.82);
    var res = await fetch(WORKER_URL, { method:'POST', headers:{'Content-Type':'image/jpeg'}, body:blob });
    if(!res.ok) throw new Error('فشل: ' + res.status);
    var data = await res.json();
    if(!data.url) throw new Error('لا رابط');
    return data.url;
  }
  
  window.__v102c_uploadBatch = async function(files, category, callbacks){
    callbacks = callbacks || {};
    var onProgress = callbacks.onProgress || function(){};
    var onUrl = callbacks.onUrl || function(){};
    var onError = callbacks.onError || function(e){ console.error(e); };
    var total = files.length, success = 0;
    for(var i=0; i<total; i++){
      try {
        var url = await uploadOne(files[i]);
        onUrl(url); success++;
        onProgress(Math.round((i+1)/total*100));
      } catch(e){ onError(e); }
    }
    if(success === 0 && total > 0) throw new Error('فشل رفع الصور');
  };
  
  window.__v102b_showTokenModal = function(){ return Promise.resolve("worker"); };
  console.log('[V248] Standalone uploader ready');
})();
</script>
`;
h = h.replace('</body>', v248 + '\n</body>');

fs.writeFileSync('index.html', h);
console.log('✅ v248: أُصلح v200 + uploader مستقل');
console.log('الحجم:', before, '->', h.length);
