const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

// استبدال showBannerManager بالكامل
const oldStart = 'async function showBannerManager(){';
const oldEnd = 'function showBannerEditor(banner, index){';
const sIdx = h.indexOf(oldStart);
const eIdx = h.indexOf(oldEnd);
if (sIdx === -1 || eIdx === -1) { console.log('❌ markers not found'); process.exit(1); }

const newFunc = `async function showBannerManager(){
  var data = await __loadBanners();
  window.__currentBanners = data.items;
  window.__currentBannerField = data.field;
  
  var cb = document.querySelector('#modal-close'); if(cb) cb.click();
  
  var ov = document.createElement('div');
  ov.id = 'banner-manager';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999999;background:#0a0825;display:flex;flex-direction:column;overflow:hidden';
  
  // ─────── PREVIEW SECTION ───────
  var previewHtml = '';
  var items = data.items.filter(function(b){ return b && b.img && b.active !== false; });
  if (items.length === 0) {
    previewHtml = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#a78bfa;font-size:13px;font-weight:700">لا توجد بانرات نشطة — أضف بانراً</div>';
  } else {
    previewHtml = '<div id="b276-slider" style="display:flex;height:100%;transition:transform 0.4s ease">'
      + items.map(function(b){
          return '<div style="flex:0 0 100%;height:100%;position:relative"><img src="' + esc(b.img) + '" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.opacity=0.3"></div>';
        }).join('')
      + '</div>'
      + '<div id="b276-dots" style="position:absolute;bottom:8px;left:0;right:0;display:flex;justify-content:center;gap:6px;z-index:2">'
      + items.map(function(_, i){
          return '<div data-slide-to="' + i + '" style="width:6px;height:6px;border-radius:50%;background:' + (i===0?'#fff':'rgba(255,255,255,0.4)') + ';cursor:pointer"></div>';
        }).join('')
      + '</div>';
  }
  
  ov.innerHTML = 
    // Preview section (mimics client banner exactly)
    '<div style="padding:12px 16px 0;background:#0a0825;flex-shrink:0">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'
    +     '<div style="font-size:13px;font-weight:800;color:#fff">👁️ معاينة حية (كما في العميل)</div>'
    +     '<button id="b276-close" style="background:rgba(155,77,255,0.15);border:1px solid rgba(155,77,255,0.3);color:#a78bfa;width:32px;height:32px;border-radius:50%;cursor:pointer;font-family:inherit;font-size:14px">✕</button>'
    +   '</div>'
    +   '<div id="b276-preview" style="position:relative;width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#111;box-shadow:0 8px 24px rgba(0,0,0,0.4)">' + previewHtml + '</div>'
    +   '<div style="height:14px"></div>'
    + '</div>'
    // Toolbar
    + '<div style="padding:0 16px 12px;display:flex;justify-content:space-between;align-items:center;gap:10px;background:#0a0825;flex-shrink:0">'
    +   '<div style="font-size:13px;font-weight:900;color:#fff">🖼️ البانرات (' + data.items.length + ')</div>'
    +   '<button id="b276-add" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none;padding:10px 16px;border-radius:12px;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap">➕ بانر جديد</button>'
    + '</div>'
    // List
    + '<div id="b276-list" style="flex:1;overflow-y:auto;padding:0 16px 16px">' + __renderBannerList(data.items) + '</div>';
  
  document.body.appendChild(ov);
  
  // Auto-play carousel
  var current = 0, count = items.length, interval;
  function goTo(idx){
    if (count === 0) return;
    current = ((idx % count) + count) % count;
    var slider = document.getElementById('b276-slider');
    if (slider) slider.style.transform = 'translateX(' + (current * 100) + '%)';
    document.querySelectorAll('#b276-dots [data-slide-to]').forEach(function(d, i){
      d.style.background = (i === current) ? '#fff' : 'rgba(255,255,255,0.4)';
    });
  }
  function startAuto(){
    if (count <= 1) return;
    clearInterval(interval);
    interval = setInterval(function(){ goTo(current + 1); }, 4000);
  }
  function resetAuto(){ clearInterval(interval); startAuto(); }
  
  document.querySelectorAll('#b276-dots [data-slide-to]').forEach(function(d){
    d.onclick = function(){ goTo(parseInt(this.dataset.slideTo, 10)); resetAuto(); };
  });
  
  // Swipe
  var preview = document.getElementById('b276-preview');
  if (preview && count > 1) {
    var startX = 0, isDragging = false;
    preview.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; isDragging = true; }, {passive:true});
    preview.addEventListener('touchend', function(e){
      if (!isDragging) return; isDragging = false;
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); resetAuto(); }
    });
  }
  
  startAuto();
  
  // Bindings
  document.getElementById('b276-close').onclick = function(){ clearInterval(interval); ov.remove(); };
  document.getElementById('b276-add').onclick = function(){ clearInterval(interval); ov.remove(); showBannerEditor(null, -1); };
  
  document.querySelectorAll('[data-bedit]').forEach(function(btn){
    btn.onclick = function(){ clearInterval(interval); var i = parseInt(this.dataset.bedit, 10); ov.remove(); showBannerEditor(window.__currentBanners[i], i); };
  });
  document.querySelectorAll('[data-bdel]').forEach(function(btn){
    btn.onclick = function(){ var i = parseInt(this.dataset.bdel, 10); __deleteBanner(i, ov, interval); };
  });
}

function __renderBannerList(items){
  if (!items.length) return '<div class="vempty"><div class="vempty-icon">🖼️</div><div class="vempty-txt">لا توجد بانرات — أضف أول بانر</div></div>';
  return items.map(function(b, i){
    var isActive = b.active !== false;
    var stStyle = isActive ? 'background:rgba(34,197,94,0.9);color:#fff' : 'background:rgba(107,114,128,0.9);color:#fff';
    return '<div style="border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#1a1230,#121028);border:1px solid rgba(155,77,255,0.2);margin-bottom:12px">'
      + '<div style="aspect-ratio:16/9;background:#111;position:relative">'
      +   (b.img ? '<img src="' + esc(b.img) + '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.opacity=0.3">' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:36px">🖼️</div>')
      +   '<div style="position:absolute;top:6px;right:6px;' + stStyle + ';padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700">' + (isActive ? '● نشط' : '○ مخفي') + '</div>'
      +   '<div style="position:absolute;top:6px;left:6px;background:rgba(10,8,37,0.9);color:#fff;padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700">#' + (i+1) + '</div>'
      + '</div>'
      + '<div style="padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px">'
      +   '<div style="min-width:0;flex:1">'
      +     (b.title ? '<div style="font-size:12px;color:#fff;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(b.title) + '</div>' : '<div style="font-size:12px;color:#a78bfa;opacity:0.6">بدون عنوان</div>')
      +     (b.link ? '<div style="font-size:10px;color:#a78bfa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">🔗 ' + esc(b.link) + '</div>' : '')
      +   '</div>'
      +   '<div style="display:flex;gap:6px;flex-shrink:0">'
      +     '<button data-bedit="' + i + '" style="background:rgba(155,77,255,0.15);border:1px solid rgba(155,77,255,0.3);color:#a78bfa;padding:8px 10px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer">✏️</button>'
      +     '<button data-bdel="' + i + '" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:8px 10px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer">🗑️</button>'
      +   '</div>'
      + '</div></div>';
  }).join('');
}

async function __deleteBanner(index, ov, interval){
  var b = window.__currentBanners[index];
  if (!b) return;
  if (!confirm('حذف "' + (b.title || 'هذا البانر') + '" نهائياً؟')) return;
  var items = window.__currentBanners.slice();
  items.splice(index, 1);
  try {
    await __saveBanners(window.__currentBannerField, items);
    toast('✅ تم الحذف', 'success');
    if (interval) clearInterval(interval);
    if (ov) ov.remove();
    setTimeout(showBannerManager, 200);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

`;

h = h.slice(0, sIdx) + newFunc + h.slice(eIdx);

// حذف __deleteBanner القديمة (النسخة القديمة)
const oldDelStart = 'async function __deleteBanner(index){';
const oldDelEnd = 'async function showBannerManager(){';
const dsIdx = h.indexOf(oldDelStart);
const deIdx = h.indexOf(oldDelEnd);
if (dsIdx !== -1 && deIdx !== -1 && dsIdx < deIdx) {
  h = h.slice(0, dsIdx) + h.slice(deIdx);
}

fs.writeFileSync('dashboard.html', h);
console.log('✅ v276c: carousel preview | ' + before + ' -> ' + h.length);
