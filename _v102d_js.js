(function(){
  'use strict';
  console.log('[V102d] loading...');
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.__v102cReady) return setTimeout(hook, 100);
    if(window.__v102dReady) return;
    window.__v102dReady = true;
    
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
      if(!res.ok) {
        var txt = await res.text();
        throw new Error('فشل الرفع: ' + res.status + ' ' + txt.slice(0, 50));
      }
      var data = await res.json();
      if(!data.url) throw new Error('لم يتم إرجاع رابط الصورة');
      return data.url;
    }

    // استبدال دالة الرفع القديمة (التي كانت تطلب توكن) بالدالة الجديدة
    window.__v102c_uploadBatch = async function(files, category, callbacks){
      callbacks = callbacks || {};
      var onProgress = callbacks.onProgress || function(){};
      var onUrl = callbacks.onUrl || function(){};
      var onError = callbacks.onError || function(e){ console.error(e); };

      var total = files.length, success = 0;
      for(var i=0; i<total; i++){
        var f = files[i];
        if(f.size > 15*1024*1024){ onError(new Error(f.name + ' حجمها كبير جداً')); continue; }
        try {
          var url = await uploadToWorker(f);
          onUrl(url); success++;
          onProgress(Math.round((i+1)/total*100));
        } catch(e){
          onError(e);
        }
      }
      if(success === 0 && total > 0) throw new Error('فشل رفع الصور، تحقق من الاتصال');
    };

    console.log('[V102d] Ready! Uploads go to Cloudflare Worker.');
  }
  hook();
})();
