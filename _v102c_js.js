(function(){
  'use strict';
  console.log('[V102c] loading...');

  var GH_USER = 'hzgmi';
  var GH_BRANCH = 'main';
  var TOKEN_KEY = 'chizen_gh_token';
  var ROT_KEY = 'chizen_gh_rot';

  var REPOS = {
    products: ['chizen-assets-1','chizen-assets-2','chizen-assets-3','chizen-assets-4','chizen-assets-5','chizen-products-1','chizen-products-2','chizen-products-3','chizen-products-4'],
    listings: ['chizen-listings-1'],
    receipts: ['chizen-products-4'],
    vouchers: ['chizen-products-3'],
    misc:     ['chizen-assets-5']
  };

  function getToken(){ try{ return localStorage.getItem(TOKEN_KEY) || ''; }catch(e){ return ''; } }
  function setToken(t){ try{ localStorage.setItem(TOKEN_KEY, t); }catch(e){} }
  function clearToken(){ try{ localStorage.removeItem(TOKEN_KEY); }catch(e){} }

  function toast(m){
    var t=document.createElement('div'); t.className='v101-toast'; t.textContent=m;
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity='0'; }, 2200);
    setTimeout(function(){ if(t.parentNode)t.remove(); }, 2600);
  }

  function promptToken(){
    return new Promise(function(resolve){
      var overlay=document.createElement('div');
      overlay.className='v101-modal-overlay active';
      overlay.innerHTML = ''
        + '<div class="v101-modal">'
        +   '<div class="v101-m-head"><h3>🔐 مفتاح GitHub للرفع</h3></div>'
        +   '<div class="v101-m-body">'
        +     '<p style="font-size:13px;color:#a78bfa;margin:0 0 12px;line-height:1.7">الصق توكن GitHub (يبدأ بـ <code style="color:#fff;background:rgba(155,77,255,.2);padding:2px 6px;border-radius:4px">ghp_</code> أو <code style="color:#fff;background:rgba(155,77,255,.2);padding:2px 6px;border-radius:4px">github_pat_</code>).<br>يُحفظ في متصفحك فقط — لن يُرسل لأي خادم.</p>'
        +     '<textarea id="v102b-token-input" rows="3" placeholder="ghp_..." style="width:100%;box-sizing:border-box;padding:12px;background:rgba(10,8,37,.7);border:1px solid rgba(155,77,255,.3);border-radius:12px;color:#fff;font-family:monospace;font-size:12px;resize:vertical"></textarea>'
        +     '<p style="font-size:11px;color:#888;margin:8px 0 0;line-height:1.6">🔒 يُطلب مرة واحدة فقط على هذا الجهاز.<br>لمسحه لاحقاً: امسح <code style="color:#a78bfa">localStorage.chizen_gh_token</code></p>'
        +   '</div>'
        +   '<div class="v101-m-foot">'
        +     '<button class="v101-btn-cancel" type="button" id="v102b-cancel">إلغاء</button>'
        +     '<button class="v101-btn-save" type="button" id="v102b-save">💾 حفظ</button>'
        +   '</div>'
        + '</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#v102b-cancel').onclick = function(){ overlay.remove(); resolve(''); };
      overlay.querySelector('#v102b-save').onclick = function(){
        var t = overlay.querySelector('#v102b-token-input').value.trim();
        if(!t){ alert('⚠️ الصق التوكن أولاً'); return; }
        if(t.length < 20){ alert('⚠️ التوكن قصير جداً — تحقق'); return; }
        setToken(t); overlay.remove(); toast('✅ حُفظ التوكن'); resolve(t);
      };
    });
  }

  function pickRepo(category){
    var group = REPOS.products;
    if(REPOS[category]) group = REPOS[category];
    else if(['listings','cars','phones','car','phone'].indexOf(category) !== -1) group = REPOS.listings;
    var rot = parseInt(localStorage.getItem(ROT_KEY) || '0', 10) || 0;
    var repo = group[rot % group.length];
    try{ localStorage.setItem(ROT_KEY, String((rot + 1) % 100000)); }catch(e){}
    return repo;
  }

  function compressImage(file, maxDim, quality){
    return new Promise(function(resolve, reject){
      var img=new Image(); var url=URL.createObjectURL(file);
      img.onload=function(){
        URL.revokeObjectURL(url);
        var w=img.width, h=img.height;
        if(w>maxDim || h>maxDim){
          if(w>h){ h=Math.round(h*maxDim/w); w=maxDim; }
          else { w=Math.round(w*maxDim/h); h=maxDim; }
        }
        var canvas=document.createElement('canvas');
        canvas.width=w; canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        canvas.toBlob(function(blob){
          if(!blob) return reject(new Error('compress failed'));
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.onerror=function(){ URL.revokeObjectURL(url); reject(new Error('load failed')); };
      img.src=url;
    });
  }

  function blobToBase64(blob){
    return new Promise(function(resolve, reject){
      var reader=new FileReader();
      reader.onload=function(){ resolve(reader.result.split(',')[1]); };
      reader.onerror=reject;
      reader.readAsDataURL(blob);
    });
  }

  async function uploadOne(file, category, token){
    var repo = pickRepo(category);
    var compressed = await compressImage(file, 1200, 0.82);
    var base64 = await blobToBase64(compressed);
    var now = new Date();
    var filename = now.getTime() + '_' + Math.random().toString(36).slice(2,8) + '.jpg';
    var path = category + '/' + now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '/' + filename;

    var res = await fetch('https://api.github.com/repos/'+GH_USER+'/'+repo+'/contents/'+path, {
      method: 'PUT',
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'upload ' + filename, content: base64, branch: GH_BRANCH })
    });

    if(!res.ok){
      var txt = await res.text();
      if(res.status===401){ clearToken(); throw new Error('التوكن غير صالح — أعد إدخاله'); }
      if(res.status===403){ throw new Error('تجاوزت حد GitHub — انتظر دقائق'); }
      if(res.status===422){ throw new Error('الملف موجود — أعد المحاولة'); }
      throw new Error('GitHub ' + res.status + ': ' + txt.slice(0,60));
    }
    return 'https://cdn.jsdelivr.net/gh/'+GH_USER+'/'+repo+'@'+GH_BRANCH+'/'+path;
  }

  window.__v102c_uploadBatch = async function(files, category, callbacks){
    callbacks = callbacks || {};
    var onProgress = callbacks.onProgress || function(){};
    var onUrl = callbacks.onUrl || function(){};
    var onError = callbacks.onError || function(e){ console.error(e); };

    var token = getToken();
    if(!token){
      token = await promptToken();
      if(!token) throw new Error('رفضت إدخال التوكن');
    }

    var total = files.length, success = 0;
    for(var i=0; i<total; i++){
      var f = files[i];
      if(f.size > 15*1024*1024){ onError(new Error(f.name + ' > 15MB')); continue; }
      try {
        var url = await uploadOne(f, category, token);
        onUrl(url); success++;
        onProgress(Math.round((i+1)/total*100));
      } catch(e){
        if(e.message && e.message.indexOf('التوكن غير صالح') !== -1){
          var nt = await promptToken();
          if(!nt){ onError(new Error('لا يمكن الرفع بدون التوكن')); break; }
          token = nt;
          try {
            var u2 = await uploadOne(f, category, token);
            onUrl(u2); success++;
            onProgress(Math.round((i+1)/total*100));
          } catch(e2){ onError(e2); }
        } else {
          onError(e);
        }
      }
    }
    if(success===0 && total>0) throw new Error('فشل رفع كل الصور');
  };

  window.__v102c_hasToken = function(){ return !!getToken(); };
  window.__v102c_clearToken = function(){ clearToken(); toast('✅ تم مسح التوكن'); };
  window.__v102c_showTokenModal = function(){ return promptToken(); };

  console.log('[V102c] ready | products:', REPOS.products.length, 'repos');
})();
