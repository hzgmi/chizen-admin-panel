(function(){
  'use strict';
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 300) return setTimeout(hook, 100);
    if(!window.__v102Ready) return setTimeout(hook, 100);
    if(window.__v102bReady) return;
    if(!window.__GH){ console.warn('[V102b] _gh_config.js غير محمّل'); return; }
    window.__v102bReady = true;
    try { install(); } catch(e){ console.error('[V102b] install:', e); }
  }

  function install(){
    var GH = window.__GH;
    var db = firebase.firestore();

    // عدّاد لكل مستودع (في الذاكرة)
    var repoCounts = {};

    async function loadRepoCounts(){
      // تحميل عدد الصور في كل مستودع من GitHub API
      for(var i=0; i<GH.repos.length; i++){
        var repo = GH.repos[i];
        try {
          var res = await fetch('https://api.github.com/repos/' + GH.username + '/' + repo + '/contents/?ref=' + GH.branch, {
            headers: { 'Authorization': 'token ' + GH.token, 'Accept': 'application/vnd.github+json' }
          });
          if(res.ok){
            var files = await res.json();
            repoCounts[repo] = Array.isArray(files) ? files.filter(function(f){ return f.type==='file'; }).length : 0;
          } else {
            repoCounts[repo] = 0;
          }
        } catch(e){ repoCounts[repo] = 0; }
      }
      console.log('[V102b] repo counts:', repoCounts);
    }

    function getActiveRepo(){
      for(var i=0; i<GH.repos.length; i++){
        var r = GH.repos[i];
        if((repoCounts[r] || 0) < GH.maxPerRepo) return r;
      }
      return null; // كل المستودعات ممتلئة
    }

    async function uploadToGitHub(file){
      var repo = getActiveRepo();
      if(!repo) throw new Error('كل المستودعات ممتلئة — أضف مستودعاً جديداً في _gh_config.js');

      // ضغط الصورة قبل الرفع (لتوفير المساحة)
      var compressed = await compressImage(file, 1200, 0.82);
      var base64 = await fileToBase64(compressed);
      var ext = 'jpg';
      var filename = Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
      var path = 'products/' + new Date().getFullYear() + '/' + (new Date().getMonth()+1) + '/' + filename;

      // رفع عبر GitHub Contents API
      var res = await fetch('https://api.github.com/repos/' + GH.username + '/' + repo + '/contents/' + path, {
        method: 'PUT',
        headers: { 'Authorization': 'token ' + GH.token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'upload ' + filename, content: base64, branch: GH.branch })
      });

      if(!res.ok){
        var err = await res.text();
        throw new Error('GitHub ' + res.status + ': ' + err.slice(0,100));
      }

      repoCounts[repo] = (repoCounts[repo] || 0) + 1;

      // رابط jsDelivr
      return 'https://cdn.jsdelivr.net/gh/' + GH.username + '/' + repo + '@' + GH.branch + '/' + path;
    }

    function compressImage(file, maxDim, quality){
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
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(function(blob){
            if(!blob) return reject(new Error('compress failed'));
            resolve(blob);
          }, 'image/jpeg', quality);
        };
        img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('load failed')); };
        img.src = url;
      });
    }

    function fileToBase64(blob){
      return new Promise(function(resolve, reject){
        var reader = new FileReader();
        reader.onload = function(){ resolve(reader.result.split(',')[1]); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // استبدال دالة الرفع في v102
    if(window.__v102UploadHook){
      window.__v102UploadHook(uploadToGitHub, loadRepoCounts);
      console.log('[V102b] GitHub upload hooked');
    } else {
      console.warn('[V102b] __v102UploadHook غير موجود — قد تحتاج تحديث v102');
    }
  }
  hook();
})();
