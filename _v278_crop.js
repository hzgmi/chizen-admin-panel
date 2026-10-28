const fs = require('fs');

// ═══════════════ 1. DASHBOARD: EDITOR ═══════════════
let d = fs.readFileSync('dashboard.html', 'utf8');
const dBefore = d.length;
let changes = 0;

// A) إضافة sliders HTML بعد be-prog
const progBlob = `'<div id="be-prog" style="display:none;height:6px;background:rgba(10,8,37,0.7);border-radius:3px;overflow:hidden;margin-bottom:12px"><div id="be-bar" style="height:100%;background:linear-gradient(90deg,#7c3aed,#ec4899);width:0%;transition:width 0.2s"></div></div>'`;
const progWithSliders = progBlob + `
    +   '<div style="background:rgba(155,77,255,0.08);border:1px solid rgba(155,77,255,0.2);border-radius:12px;padding:12px;margin-bottom:12px">'
    +     '<div style="font-size:12px;font-weight:800;color:#a78bfa;margin-bottom:10px">🎯 ضبط الصورة داخل البانر</div>'
    +     '<label style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#a78bfa;font-weight:700;margin-bottom:6px"><span>🔍 التكبير</span><span id="be-scale-val" style="color:#fff">' + Math.round(((b.scale!=null)?Number(b.scale):1)*100) + '%</span></label>'
    +     '<input id="be-scale" type="range" min="100" max="250" step="5" value="' + Math.round(((b.scale!=null)?Number(b.scale):1)*100) + '" style="width:100%;accent-color:#7c3aed;margin-bottom:10px">'
    +     '<label style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#a78bfa;font-weight:700;margin-bottom:6px"><span>↔️ الموضع الأفقي</span><span id="be-posx-val" style="color:#fff">' + ((b.posX!=null)?b.posX:50) + '%</span></label>'
    +     '<input id="be-posx" type="range" min="0" max="100" step="1" value="' + ((b.posX!=null)?b.posX:50) + '" style="width:100%;accent-color:#7c3aed;margin-bottom:10px">'
    +     '<label style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#a78bfa;font-weight:700;margin-bottom:6px"><span>↕️ الموضع الرأسي</span><span id="be-posy-val" style="color:#fff">' + ((b.posY!=null)?b.posY:50) + '%</span></label>'
    +     '<input id="be-posy" type="range" min="0" max="100" step="1" value="' + ((b.posY!=null)?b.posY:50) + '" style="width:100%;accent-color:#7c3aed">'
    +     '<div style="font-size:10px;color:#a78bfa;opacity:0.7;margin-top:8px;text-align:center">💡 اسحب الصورة في المعاينة أو استخدم المنزلقات</div>'
    +   '</div>'`;

if (d.includes(progBlob)) {
  d = d.replace(progBlob, progWithSliders);
  changes++;
  console.log('✅ A: sliders added');
} else {
  console.log('⚠️ A: prog blob not found');
}

// B) استبدال updatePreview
const oldPrev = `function updatePreview(){
    var img = $('be-img').value.trim() || currentImg;
    var title = $('be-title').value.trim();
    var html = '';
    if(img){ html += '<img src="' + esc(img) + '" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.opacity=0.3">'; }
    else { html += '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#a78bfa;font-size:48px;opacity:0.4">🖼️</div>'; }
    html += '<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(10,8,37,0.9) 0%,rgba(10,8,37,0.3) 40%,transparent 70%);pointer-events:none"></div>';
    if(title){ html += '<div style="position:absolute;bottom:14px;left:16px;right:16px;color:#fff;font-size:15px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,0.8);line-height:1.3">' + esc(title) + '</div>'; }
    $('be-preview').innerHTML = html;
  }`;

const newPrev = `function getScale(){ return (parseFloat($('be-scale') ? $('be-scale').value : 100) || 100) / 100; }
  function getPosX(){ return parseFloat($('be-posx') ? $('be-posx').value : 50) || 0; }
  function getPosY(){ return parseFloat($('be-posy') ? $('be-posy').value : 50) || 0; }
  function updatePreview(){
    var img = $('be-img').value.trim() || currentImg;
    var title = $('be-title').value.trim();
    var scale = getScale();
    var posX = getPosX();
    var posY = getPosY();
    var html = '';
    if(img){ 
      html += '<div style="position:absolute;inset:0;background-image:url(' + JSON.stringify(img) + ');background-size:' + (scale*100) + '% auto;background-position:' + posX + '% ' + posY + '%;background-repeat:no-repeat;background-color:#111"></div>';
    } else { 
      html += '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#a78bfa;font-size:48px;opacity:0.4">🖼️</div>'; 
    }
    html += '<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(10,8,37,0.9) 0%,rgba(10,8,37,0.3) 40%,transparent 70%);pointer-events:none"></div>';
    if(title){ html += '<div style="position:absolute;bottom:14px;left:16px;right:16px;color:#fff;font-size:15px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,0.8);line-height:1.3">' + esc(title) + '</div>'; }
    var pv = $('be-preview'); if(pv) pv.innerHTML = html;
    var sv = $('be-scale-val'); if(sv) sv.textContent = Math.round(scale*100) + '%';
    var pxv = $('be-posx-val'); if(pxv) pxv.textContent = posX + '%';
    var pyv = $('be-posy-val'); if(pyv) pyv.textContent = posY + '%';
  }`;

if (d.includes(oldPrev)) {
  d = d.replace(oldPrev, newPrev);
  changes++;
  console.log('✅ B: updatePreview replaced');
} else {
  console.log('⚠️ B: updatePreview not found');
}

// C) إضافة listeners بعد "updatePreview();"
const afterPrev = `$('be-img').addEventListener('input', updatePreview);
  $('be-title').addEventListener('input', updatePreview);
  updatePreview();`;

const withListeners = `$('be-img').addEventListener('input', updatePreview);
  $('be-title').addEventListener('input', updatePreview);
  if($('be-scale')) $('be-scale').addEventListener('input', updatePreview);
  if($('be-posx')) $('be-posx').addEventListener('input', updatePreview);
  if($('be-posy')) $('be-posy').addEventListener('input', updatePreview);
  updatePreview();

  // Drag to pan
  (function(){
    var preview = $('be-preview');
    if(!preview) return;
    var isDrag = false, dragX = 0, dragY = 0, dragPX = 50, dragPY = 50;
    function onStart(e){
      var t = e.touches ? e.touches[0] : e;
      isDrag = true; dragX = t.clientX; dragY = t.clientY;
      dragPX = getPosX(); dragPY = getPosY();
    }
    function onMove(e){
      if(!isDrag) return;
      var t = e.touches ? e.touches[0] : e;
      var scale = getScale();
      if(scale <= 1.01) return;
      var rect = preview.getBoundingClientRect();
      var overflowX = rect.width * (scale - 1);
      var overflowY = rect.height * (scale - 1);
      var dx = t.clientX - dragX;
      var dy = t.clientY - dragY;
      var px = Math.max(0, Math.min(100, dragPX - (dx / overflowX) * 100));
      var py = Math.max(0, Math.min(100, dragPY - (dy / overflowY) * 100));
      if($('be-posx')) $('be-posx').value = px;
      if($('be-posy')) $('be-posy').value = py;
      updatePreview();
    }
    function onEnd(){ isDrag = false; }
    preview.style.cursor = 'grab';
    preview.style.touchAction = 'none';
    preview.addEventListener('mousedown', onStart);
    preview.addEventListener('mousemove', onMove);
    preview.addEventListener('mouseup', onEnd);
    preview.addEventListener('mouseleave', onEnd);
    preview.addEventListener('touchstart', onStart, {passive: true});
    preview.addEventListener('touchmove', onMove, {passive: true});
    preview.addEventListener('touchend', onEnd);
  })();`;

if (d.includes(afterPrev)) {
  d = d.replace(afterPrev, withListeners);
  changes++;
  console.log('✅ C: listeners + drag added');
} else {
  console.log('⚠️ C: listeners block not found');
}

// D) حفظ القيم
const saveBlob = `var newBanner = {img: img, title: title, link: link, order: order, active: active};`;
const saveWithCrop = `var newBanner = {img: img, title: title, link: link, order: order, active: active, scale: getScale(), posX: getPosX(), posY: getPosY()};`;

if (d.includes(saveBlob)) {
  d = d.replace(saveBlob, saveWithCrop);
  changes++;
  console.log('✅ D: save includes crop');
} else {
  console.log('⚠️ D: save blob not found');
}

// E) preview carousel in showBannerManager
const oldCarousel = `previewHtml = '<div id="b276-slider" style="display:flex;height:100%;transition:transform 0.4s ease">'
      + items.map(function(b){
          return '<div style="flex:0 0 100%;height:100%;position:relative"><img src="' + esc(b.img) + '" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.opacity=0.3"></div>';
        }).join('')
      + '</div>'`;

const newCarousel = `previewHtml = '<div id="b276-slider" style="display:flex;height:100%;transition:transform 0.4s ease">'
      + items.map(function(b){
          var sc = (b.scale != null) ? Number(b.scale) : 1;
          var px = (b.posX != null) ? Number(b.posX) : 50;
          var py = (b.posY != null) ? Number(b.posY) : 50;
          return '<div style="flex:0 0 100%;height:100%;position:relative;background-image:url(' + JSON.stringify(b.img) + ');background-size:' + (sc*100) + '% auto;background-position:' + px + '% ' + py + '%;background-repeat:no-repeat;background-color:#111"></div>';
        }).join('')
      + '</div>'`;

if (d.includes(oldCarousel)) {
  d = d.replace(oldCarousel, newCarousel);
  changes++;
  console.log('✅ E: carousel preview uses crop');
} else {
  console.log('⚠️ E: carousel blob not found');
}

// F) thumbnail in __renderBannerList
const oldThumb = `(b.img ? '<img src="' + esc(b.img) + '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.opacity=0.3">' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:36px">🖼️</div>')`;

const newThumb = `(b.img ? (function(){var sc=(b.scale!=null)?Number(b.scale):1;var px=(b.posX!=null)?Number(b.posX):50;var py=(b.posY!=null)?Number(b.posY):50;return '<div style="position:absolute;inset:0;background-image:url(' + JSON.stringify(b.img) + ');background-size:' + (sc*100) + '% auto;background-position:' + px + '% ' + py + '%;background-repeat:no-repeat;background-color:#111"></div>';})() : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:36px">🖼️</div>')`;

if (d.includes(oldThumb)) {
  d = d.replace(oldThumb, newThumb);
  changes++;
  console.log('✅ F: thumbnail uses crop');
} else {
  console.log('⚠️ F: thumbnail blob not found');
}

fs.writeFileSync('dashboard.html', d);
console.log('━━━━━━━━━━━━━━━━━━');
console.log('dashboard: ' + changes + '/6 تغييرات | ' + dBefore + ' → ' + d.length);
