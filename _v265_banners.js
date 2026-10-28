const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

if (h.includes('function showBannerManager()')) { console.log('⚠️ already applied'); process.exit(0); }

const oldHandler = "  if (tool === 'banners') return showConfigEditor('banners', 'البانرات');";
if (!h.includes(oldHandler)) { console.log('❌ handler not found'); process.exit(1); }
h = h.replace(oldHandler, "  if (tool === 'banners') return showBannerManager();");

const newCode = `
// ═══ v265: Banner Management ═══

async function __dashUpload(file){
  var WORKER_URL = 'https://chizen-uploader.hazimchat.workers.dev';
  return new Promise(function(resolve, reject){
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function(){
      URL.revokeObjectURL(url);
      var w = img.width, h = img.height, maxDim = 1600;
      if(w > maxDim || h > maxDim){
        if(w > h){ h = Math.round(h*maxDim/w); w = maxDim; }
        else { w = Math.round(w*maxDim/h); h = maxDim; }
      }
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob(function(blob){
        if(!blob){ reject(new Error('compress')); return; }
        fetch(WORKER_URL, { method: 'POST', headers: {'Content-Type': 'image/jpeg'}, body: blob })
          .then(function(r){ return r.ok ? r.json() : r.text().then(function(t){ throw new Error('فشل ' + r.status); }); })
          .then(function(d){ d.url ? resolve(d.url) : reject(new Error('لا رابط')); })
          .catch(reject);
      }, 'image/jpeg', 0.85);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('تحميل فشل')); };
    img.src = url;
  });
}

async function __loadBanners(){
  try {
    var doc = await db.collection('config').doc('banners').get();
    if(!doc.exists) return {field:'list', items:[]};
    var d = doc.data();
    if(d.list && Array.isArray(d.list)) return {field:'list', items:d.list.slice()};
    if(d.items && Array.isArray(d.items)) return {field:'items', items:d.items.slice()};
    if(d.banners && Array.isArray(d.banners)) return {field:'banners', items:d.banners.slice()};
    return {field:'list', items: Object.keys(d).map(function(k){ return Object.assign({id:k}, d[k]); })};
  } catch(e){ return {field:'list', items:[]}; }
}

async function __saveBanners(field, items){
  var data = {}; data[field] = items;
  await db.collection('config').doc('banners').set(data, {merge:true});
}

async function __deleteBanner(index){
  var b = window.__currentBanners[index];
  if(!b) return;
  if(!confirm('حذف "' + (b.title || 'هذا البانر') + '" نهائياً؟')) return;
  var items = window.__currentBanners.slice();
  items.splice(index, 1);
  try {
    await __saveBanners(window.__currentBannerField, items);
    toast('✅ تم الحذف', 'success');
    var cb = document.querySelector('#modal-close'); if(cb) cb.click();
    setTimeout(showBannerManager, 200);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

async function showBannerManager(){
  var data = await __loadBanners();
  window.__currentBanners = data.items;
  window.__currentBannerField = data.field;
  
  var listHtml = data.items.length ? data.items.map(function(b, i){
    var isActive = b.active !== false;
    var stStyle = isActive ? 'background:rgba(34,197,94,0.9);color:#fff' : 'background:rgba(107,114,128,0.9);color:#fff';
    return '<div style="border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#1a1230,#121028);border:1px solid rgba(155,77,255,0.2);margin-bottom:12px">'
      + '<div style="aspect-ratio:16/9;background:#111;position:relative">'
      +   (b.img ? '<img src="' + esc(b.img) + '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.opacity=0.3">' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:36px">🖼️</div>')
      +   '<div style="position:absolute;top:6px;right:6px;' + stStyle + ';padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700">' + (isActive ? '● نشط' : '○ مخفي') + '</div>'
      +   (b.title ? '<div style="position:absolute;bottom:0;left:0;right:0;padding:10px 14px;background:linear-gradient(to top,rgba(10,8,37,0.9),transparent);color:#fff;font-size:12px;font-weight:800">' + esc(b.title) + '</div>' : '')
      + '</div>'
      + '<div style="padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +   '<div style="min-width:0;flex:1"><div style="font-size:12px;color:#fff;font-weight:800">الترتيب: ' + (Number(b.order)||0) + '</div>'
      +   (b.link ? '<div style="font-size:10px;color:#a78bfa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🔗 ' + esc(b.link) + '</div>' : '') + '</div>'
      +   '<div style="display:flex;gap:6px;flex-shrink:0">'
      +     '<button data-bedit="' + i + '" style="background:rgba(155,77,255,0.15);border:1px solid rgba(155,77,255,0.3);color:#a78bfa;padding:8px 10px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer">✏️</button>'
      +     '<button data-bdel="' + i + '" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:8px 10px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer">🗑️</button>'
      +   '</div>'
      + '</div></div>';
  }).join('') : '<div class="vempty"><div class="vempty-icon">🖼️</div><div class="vempty-txt">لا توجد بانرات — أضف أول بانر</div></div>';
  
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px">'
    + '<div style="font-size:14px;font-weight:900;color:#fff">🖼️ البانرات (' + data.items.length + ')</div>'
    + '<button data-badd="1" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none;padding:10px 16px;border-radius:12px;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap">➕ بانر جديد</button>'
    + '</div>' + listHtml;
  
  showModal('🖼️ إدارة البانرات', html);
  
  document.querySelectorAll('[data-bedit]').forEach(function(btn){
    btn.onclick = function(e){ e.stopPropagation(); showBannerEditor(window.__currentBanners[parseInt(this.dataset.bedit,10)], parseInt(this.dataset.bedit,10)); };
  });
  document.querySelectorAll('[data-bdel]').forEach(function(btn){
    btn.onclick = function(e){ e.stopPropagation(); __deleteBanner(parseInt(this.dataset.bdel,10)); };
  });
  document.querySelectorAll('[data-badd]').forEach(function(btn){
    btn.onclick = function(e){ e.stopPropagation(); showBannerEditor(null, -1); };
  });
}

function showBannerEditor(banner, index){
  var isEdit = index >= 0;
  var b = banner || {img:'', title:'', link:'', order: window.__currentBanners.length, active:true};
  
  var cb = document.querySelector('#modal-close'); if(cb) cb.click();
  
  var ov = document.createElement('div');
  ov.id = 'banner-editor';
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999999;background:#0a0825;display:flex;flex-direction:column';
  
  var iS = 'width:100%;padding:12px 14px;background:rgba(10,8,37,0.7);border:1px solid rgba(155,77,255,0.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box';
  var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:6px';
  
  ov.innerHTML = 
    '<div style="padding:14px 16px;background:#0a0825;border-bottom:1px solid rgba(155,77,255,0.2);flex-shrink:0">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    +     '<div style="font-size:16px;font-weight:900;color:#fff">' + (isEdit?'✏️ تعديل البانر':'➕ بانر جديد') + '</div>'
    +     '<button id="be-close" style="background:rgba(155,77,255,0.15);border:1px solid rgba(155,77,255,0.3);color:#a78bfa;width:32px;height:32px;border-radius:50%;cursor:pointer;font-family:inherit;font-size:14px">✕</button>'
    +   '</div>'
    +   '<div style="font-size:11px;color:#a78bfa;font-weight:700;margin-bottom:6px">👁️ معاينة مباشرة (كما يظهر في العميل)</div>'
    +   '<div id="be-preview" style="aspect-ratio:16/9;max-height:170px;border-radius:14px;overflow:hidden;position:relative;background:#111;border:2px solid rgba(155,77,255,0.4);box-shadow:0 8px 24px rgba(0,0,0,0.4)"></div>'
    + '</div>'
    + '<div style="flex:1;overflow-y:auto;padding:14px 16px">'
    +   '<label style="' + lS + '">الصورة *</label>'
    +   '<input type="file" id="be-file" accept="image/*" style="display:none">'
    +   '<button id="be-upload" type="button" style="width:100%;padding:12px;background:rgba(155,77,255,0.15);border:1px dashed rgba(155,77,255,0.5);border-radius:12px;color:#a78bfa;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">📷 رفع صورة (16:9 أفضل)</button>'
    +   '<input id="be-img" type="url" placeholder="أو الصق رابط الصورة" value="' + esc(b.img||'') + '" style="' + iS + '">'
    +   '<div id="be-prog" style="display:none;height:6px;background:rgba(10,8,37,0.7);border-radius:3px;overflow:hidden;margin-bottom:12px"><div id="be-bar" style="height:100%;background:linear-gradient(90deg,#7c3aed,#ec4899);width:0%;transition:width 0.2s"></div></div>'
    +   '<label style="' + lS + '">العنوان (اختياري)</label>'
    +   '<input id="be-title" type="text" placeholder="مثال: تخفيضات الصيف" value="' + esc(b.title||'') + '" style="' + iS + '">'
    +   '<label style="' + lS + '">الرابط (اختياري)</label>'
    +   '<input id="be-link" type="text" placeholder="#offers أو /product/123" value="' + esc(b.link||'') + '" style="' + iS + '">'
    +   '<label style="' + lS + '">الترتيب (الأصغر أولاً)</label>'
    +   '<input id="be-order" type="number" min="0" value="' + (Number(b.order)||0) + '" style="' + iS + '">'
    +   '<label style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(155,77,255,0.1);border-radius:12px;cursor:pointer">'
    +     '<input id="be-active" type="checkbox" ' + (b.active!==false?'checked':'') + ' style="width:20px;height:20px;accent-color:#22c55e">'
    +     '<span style="color:#fff;font-weight:700;font-size:13px">نشط (يظهر للعملاء)</span>'
    +   '</label>'
    + '</div>'
    + '<div style="padding:12px 16px;background:#0a0825;border-top:1px solid rgba(155,77,255,0.3);display:flex;gap:10px;flex-shrink:0">'
    +   '<button id="be-cancel" style="flex:1;padding:14px;border-radius:12px;background:rgba(155,77,255,0.15);color:#a78bfa;border:1px solid rgba(155,77,255,0.3);font-family:inherit;font-weight:800;font-size:14px;cursor:pointer">إلغاء</button>'
    +   '<button id="be-save" style="flex:2;padding:14px;border-radius:12px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer">💾 ' + (isEdit?'حفظ':'إضافة') + '</button>'
    + '</div>';
  
  document.body.appendChild(ov);
  
  var $ = function(id){ return document.getElementById(id); };
  var currentImg = b.img || '';
  
  function updatePreview(){
    var img = $('be-img').value.trim() || currentImg;
    var title = $('be-title').value.trim();
    var html = '';
    if(img){ html += '<img src="' + esc(img) + '" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.opacity=0.3">'; }
    else { html += '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#a78bfa;font-size:48px;opacity:0.4">🖼️</div>'; }
    html += '<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(10,8,37,0.9) 0%,rgba(10,8,37,0.3) 40%,transparent 70%);pointer-events:none"></div>';
    if(title){ html += '<div style="position:absolute;bottom:14px;left:16px;right:16px;color:#fff;font-size:15px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,0.8);line-height:1.3">' + esc(title) + '</div>'; }
    $('be-preview').innerHTML = html;
  }
  
  $('be-img').addEventListener('input', updatePreview);
  $('be-title').addEventListener('input', updatePreview);
  updatePreview();
  
  $('be-upload').onclick = function(){ $('be-file').click(); };
  $('be-file').onchange = async function(e){
    var files = Array.prototype.slice.call(e.target.files);
    if(!files.length) return;
    $('be-prog').style.display = 'block';
    $('be-bar').style.width = '30%';
    try {
      var url = await __dashUpload(files[0]);
      currentImg = url; $('be-img').value = url; $('be-bar').style.width = '100%'; updatePreview();
      toast('✅ تم رفع الصورة', 'success');
    } catch(err){ toast('❌ ' + err.message, 'error'); }
    setTimeout(function(){ $('be-prog').style.display = 'none'; $('be-bar').style.width = '0%'; }, 600);
    e.target.value = '';
  };
  
  $('be-cancel').onclick = $('be-close').onclick = function(){ ov.remove(); setTimeout(showBannerManager, 100); };
  
  $('be-save').onclick = async function(){
    var img = $('be-img').value.trim() || currentImg;
    var title = $('be-title').value.trim();
    var link = $('be-link').value.trim();
    var order = Number($('be-order').value) || 0;
    var active = $('be-active').checked;
    if(!img){ toast('⚠️ الصورة مطلوبة', 'error'); return; }
    var newBanner = {img: img, title: title, link: link, order: order, active: active};
    var items = window.__currentBanners.slice();
    if(isEdit){ if(b.id) newBanner.id = b.id; items[index] = newBanner; }
    else { items.push(newBanner); }
    items.sort(function(a,b){ return (Number(a.order)||0) - (Number(b.order)||0); });
    this.disabled = true; this.textContent = '⏳...';
    try {
      await __saveBanners(window.__currentBannerField, items);
      toast('✅ تم الحفظ', 'success');
      ov.remove();
      setTimeout(showBannerManager, 200);
    } catch(e){ this.disabled = false; this.textContent = '💾 حفظ'; toast('❌ ' + e.message, 'error'); }
  };
}

`;

const lastEnd = h.lastIndexOf('</script>');
if (lastEnd === -1) { console.log('❌ no script tag'); process.exit(1); }
h = h.slice(0, lastEnd) + newCode + h.slice(lastEnd);

fs.writeFileSync('dashboard.html', h);
console.log('✅ v265: banner mgmt | ' + before + ' -> ' + h.length);
