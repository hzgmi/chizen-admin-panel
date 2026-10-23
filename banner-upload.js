// ═══════════════════════════════════════════════════════
// CHIZEN Banner Upload & Interactive Preview
// ملف مستقل — لا يؤثر على index.html
// ═══════════════════════════════════════════════════════
(function() {
  'use strict';
  
  // ═══ ImgBB Key ═══
  function getKey() {
    var k = localStorage.getItem('chizen_imgbb_key');
    if (!k) {
      k = prompt('🔑 مفتاح ImgBB API (مرة واحدة فقط):\\n\\n1. افتح api.imgbb.com\\n2. سجل بالجوجل\\n3. انسخ API Key والصقه هنا');
      if (k && k.trim()) {
        localStorage.setItem('chizen_imgbb_key', k.trim());
        return k.trim();
      }
      return null;
    }
    return k;
  }
  
  async function uploadImgBB(file) {
    var key = getKey();
    if (!key) throw new Error('مفتاح ImgBB مطلوب');
    var fd = new FormData();
    fd.append('image', file);
    var res = await fetch('https://api.imgbb.com/1/upload?key=' + key, { method: 'POST', body: fd });
    var data = await res.json();
    if (!data.success) throw new Error('فشل الرفع');
    return data.data.url;
  }
  
  // ═══ State ═══
  var S = {
    img: '',
    x: 50, y: 50,
    scale: 1, rotate: 0,
    height: 200,
    fit: 'cover',
    align: 'right',
    overlay: 50
  };
  window._chzBannerState = S;
  
  function setup() {
    var sc = document.getElementById('sc-banners');
    if (!sc) return;
    if (sc.querySelector('.chz-up')) return;
    
    var imgField = sc.querySelector('#bn-img');
    if (!imgField) return;
    var urlWrap = imgField.closest('.fl');
    if (urlWrap) urlWrap.style.display = 'none';
    
    var addBtn = sc.querySelector('button[onclick*="saveBanner"]');
    if (!addBtn) return;
    var card = addBtn.parentElement;
    if (!card) return;
    
    var ui = document.createElement('div');
    ui.className = 'chz-up';
    ui.style.cssText = 'margin-bottom:15px;';
    ui.innerHTML = '<input type="file" id="chz-f" accept="image/*" style="display:none;">' +
      '<button type="button" id="chz-up-btn" style="width:100%;padding:14px;background:linear-gradient(135deg,#ff27c9,#8d24ff);color:#fff;border:none;border-radius:12px;font-weight:900;font-size:14px;cursor:pointer;box-shadow:0 4px 15px rgba(255,39,201,0.3);margin-bottom:10px;">📷 اختر صورة من جهازك</button>' +
      '<div id="chz-stat" style="text-align:center;min-height:16px;font-size:12px;margin-bottom:10px;"></div>' +
      '<div id="chz-prev" style="position:relative;width:100%;height:200px;border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#0a0a15,#1a1a2e);border:1px solid #333;cursor:grab;touch-action:none;user-select:none;">' +
        '<img id="chz-img" src="" style="width:100%;height:100%;object-fit:cover;object-position:50% 50%;display:none;transform-origin:center;pointer-events:none;">' +
        '<div id="chz-ov" style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 25px;pointer-events:none;">' +
          '<div id="chz-t" style="color:#fff;font-weight:900;font-size:22px;margin-bottom:6px;text-shadow:0 2px 8px rgba(0,0,0,0.6);"></div>' +
          '<div id="chz-s" style="color:#fff;font-size:13px;margin-bottom:12px;text-shadow:0 2px 6px rgba(0,0,0,0.6);"></div>' +
          '<div id="chz-b" style="background:linear-gradient(135deg,#ff27c9,#8d24ff);color:#fff;border-radius:10px;padding:9px 20px;font-weight:900;font-size:13px;box-shadow:0 4px 12px rgba(255,39,201,0.4);"></div>' +
        '</div>' +
        '<div id="chz-noimg" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#666;font-size:13px;font-weight:700;flex-direction:column;gap:8px;">' +
          '<div style="font-size:40px;opacity:0.5;">🖼️</div><div>ارفع صورة للتحكم</div>' +
        '</div>' +
        '<div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:6px;font-size:10px;">✋ اسحب · 🤏 كبّر</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">' +
        '<div><label style="font-size:10px;color:#b8c5ee;font-weight:700;">🔍 التكبير: <span id="chz-sv" style="color:#ff27c9;">100%</span></label><input type="range" id="chz-sc" min="50" max="300" value="100" step="5" style="width:100%;accent-color:#ff27c9;"></div>' +
        '<div><label style="font-size:10px;color:#b8c5ee;font-weight:700;">🔄 التدوير: <span id="chz-rv" style="color:#ff27c9;">0°</span></label><input type="range" id="chz-r" min="-180" max="180" value="0" step="5" style="width:100%;accent-color:#ff27c9;"></div>' +
        '<div><label style="font-size:10px;color:#b8c5ee;font-weight:700;">📏 الارتفاع: <span id="chz-hv" style="color:#ff27c9;">200</span>px</label><input type="range" id="chz-h" min="150" max="400" value="200" step="10" style="width:100%;accent-color:#ff27c9;"></div>' +
        '<div><label style="font-size:10px;color:#b8c5ee;font-weight:700;">🌑 تعتيم: <span id="chz-ovv" style="color:#ff27c9;">50</span>%</label><input type="range" id="chz-ovs" min="0" max="100" value="50" step="5" style="width:100%;accent-color:#ff27c9;"></div>' +
        '<div><label style="font-size:10px;color:#b8c5ee;font-weight:700;">📐 العرض</label><select id="chz-f" style="width:100%;padding:8px;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:6px;font-family:inherit;font-size:11px;"><option value="cover">ملء</option><option value="contain">احتواء</option><option value="fill">تمدد</option></select></div>' +
        '<div><label style="font-size:10px;color:#b8c5ee;font-weight:700;">↔️ محاذاة</label><select id="chz-a" style="width:100%;padding:8px;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:6px;font-family:inherit;font-size:11px;"><option value="right">يمين</option><option value="center">وسط</option><option value="left">يسار</option></select></div>' +
      '</div>';
    
    card.insertBefore(ui, addBtn);
    
    var $ = function(id) { return document.getElementById(id); };
    var prev = $('chz-prev'), img = $('chz-img'), noImg = $('chz-noimg'), ov = $('chz-ov');
    var tIn = document.getElementById('bn-title'), sIn = document.getElementById('bn-sub'), bIn = document.getElementById('bn-btn');
    
    function update() {
      prev.style.height = S.height + 'px';
      img.style.objectFit = S.fit;
      img.style.objectPosition = S.x + '% ' + S.y + '%';
      img.style.transform = 'scale(' + S.scale + ') rotate(' + S.rotate + 'deg)';
      var ta = S.align === 'center' ? 'center' : (S.align === 'left' ? 'left' : 'right');
      var ai = S.align === 'center' ? 'center' : (S.align === 'left' ? 'flex-start' : 'flex-end');
      var dir = S.align === 'left' ? '270deg' : (S.align === 'center' ? '180deg' : '90deg');
      ov.style.textAlign = ta;
      ov.style.alignItems = ai;
      ov.style.background = 'linear-gradient(' + dir + ',rgba(0,0,0,' + (S.overlay/100) + ') 0%,transparent 80%)';
      $('chz-t').textContent = tIn.value;
      $('chz-t').style.display = tIn.value ? 'block' : 'none';
      $('chz-s').textContent = sIn.value;
      $('chz-s').style.display = sIn.value ? 'block' : 'none';
      $('chz-b').textContent = bIn.value;
      $('chz-b').style.display = bIn.value ? 'block' : 'none';
    }
    
    $('chz-up-btn').onclick = function() { $('chz-f').click(); };
    
    $('chz-f').onchange = async function() {
      var f = this.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) { $('chz-stat').textContent = '❌ ليس صورة'; $('chz-stat').style.color = '#ff4d6d'; return; }
      if (f.size > 15*1024*1024) { $('chz-stat').textContent = '❌ كبيرة (15MB)'; $('chz-stat').style.color = '#ff4d6d'; return; }
      $('chz-stat').textContent = '⏳ جاري الرفع...';
      $('chz-stat').style.color = '#ff27c9';
      $('chz-up-btn').disabled = true;
      try {
        var url = await uploadImgBB(f);
        S.img = url;
        imgField.value = url;
        img.src = url;
        img.style.display = 'block';
        noImg.style.display = 'none';
        S.x = 50; S.y = 50; S.scale = 1; S.rotate = 0;
        $('chz-sc').value = 100; $('chz-r').value = 0;
        $('chz-sv').textContent = '100%'; $('chz-rv').textContent = '0°';
        update();
        $('chz-stat').textContent = '✅ تم الرفع';
        $('chz-stat').style.color = '#22c55e';
        $('chz-up-btn').textContent = '🔄 استبدال الصورة';
      } catch(e) {
        $('chz-stat').textContent = '❌ ' + e.message;
        $('chz-stat').style.color = '#ff4d6d';
      } finally { $('chz-up-btn').disabled = false; }
    };
    
    $('chz-sc').oninput = function() { S.scale = parseInt(this.value)/100; $('chz-sv').textContent = this.value+'%'; update(); };
    $('chz-r').oninput = function() { S.rotate = parseInt(this.value); $('chz-rv').textContent = this.value+'°'; update(); };
    $('chz-h').oninput = function() { S.height = parseInt(this.value); $('chz-hv').textContent = this.value; update(); };
    $('chz-ovs').oninput = function() { S.overlay = parseInt(this.value); $('chz-ovv').textContent = this.value; update(); };
    $('chz-f').onchange = function() { S.fit = this.value; update(); };
    $('chz-a').onchange = function() { S.align = this.value; update(); };
    if (tIn) tIn.oninput = update;
    if (sIn) sIn.oninput = update;
    if (bIn) bIn.oninput = update;
    
    // ═══ Drag to reposition ═══
    var dragging = false, sx = 0, sy = 0, px = 50, py = 50;
    
    function start(e) {
      if (!S.img) return;
      dragging = true;
      var pt = e.touches ? e.touches[0] : e;
      sx = pt.clientX; sy = pt.clientY; px = S.x; py = S.y;
      prev.style.cursor = 'grabbing';
      if (e.cancelable) e.preventDefault();
    }
    function move(e) {
      if (!dragging) return;
      var pt = e.touches ? e.touches[0] : e;
      var dx = pt.clientX - sx, dy = pt.clientY - sy;
      var r = prev.getBoundingClientRect();
      S.x = Math.max(0, Math.min(100, px - (dx/r.width)*100));
      S.y = Math.max(0, Math.min(100, py - (dy/r.height)*100));
      img.style.objectPosition = S.x + '% ' + S.y + '%';
      if (e.cancelable) e.preventDefault();
    }
    function end() { if (dragging) { dragging = false; prev.style.cursor = 'grab'; } }
    
    prev.addEventListener('mousedown', start);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    prev.addEventListener('touchstart', start, { passive: false });
    prev.addEventListener('touchmove', move, { passive: false });
    prev.addEventListener('touchend', end);
    
    // ═══ Pinch to zoom ═══
    var pinchDist = 0, pinchScale = 1;
    prev.addEventListener('touchstart', function(e) {
      if (e.touches.length === 2 && S.img) {
        pinchDist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
        pinchScale = S.scale;
      }
    });
    prev.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2 && pinchDist > 0) {
        var d = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
        S.scale = Math.max(0.5, Math.min(3, pinchScale * (d/pinchDist)));
        $('chz-sc').value = Math.round(S.scale*100);
        $('chz-sv').textContent = Math.round(S.scale*100) + '%';
        update();
        e.preventDefault();
      }
    }, { passive: false });
    prev.addEventListener('touchend', function() { pinchDist = 0; });
    
    update();
  }
  
  setTimeout(setup, 1500);
  document.addEventListener('click', function(e) {
    if (e.target && e.target.getAttribute && (e.target.getAttribute('onclick') || '').indexOf("tab('banners'") !== -1) {
      setTimeout(setup, 200);
    }
  });
})();
