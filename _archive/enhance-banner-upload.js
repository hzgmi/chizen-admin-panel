const fs = require('fs');
const os = require('os');
const path = require('path');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

// ═══ 1) إصلاح block 11 المكسور (إن وجد) ═══
const endPtrMarker = '<!-- ═══ End PTR ═══ -->';
const endPtrIdx = html.indexOf(endPtrMarker);
if (endPtrIdx !== -1) {
  const lastOpen = html.lastIndexOf('<script', endPtrIdx);
  const lastClose = html.lastIndexOf('</script>', endPtrIdx);
  if (lastOpen > lastClose) {
    html = html.slice(0, endPtrIdx) + '</script>\n' + html.slice(endPtrIdx);
    console.log('✅ تم إصلاح <script> المكسور قبل End PTR');
  }
}

// ═══ 2) حذف enhanceBannersUI القديمة ═══
const oldEnhanceRegex = /<script>[\s\S]*?enhanceBannersUI[\s\S]*?<\/script>/;
if (oldEnhanceRegex.test(html)) {
  html = html.replace(oldEnhanceRegex, '<!-- [enhance replaced] -->');
  console.log('✅ تم حذف enhanceBannersUI القديمة');
}

// ═══ 3) تحديث saveBanner لحفظ كل الحقول ═══
const oldSaveRegex = /saveBanner\s*:\s*(?:async\s+)?function\s*\([^)]*\)\s*\{[\s\S]*?\n\s{4}\},/;
const newSave = `saveBanner: async function() {
      var img = document.getElementById("bn-img").value.trim();
      var title = document.getElementById("bn-title").value.trim();
      var sub = document.getElementById("bn-sub").value.trim();
      var btn = document.getElementById("bn-btn").value.trim() || "تسوق الآن";
      var link = (document.getElementById("bn-link") || {}).value || "";
      var fit = (document.getElementById("bn-fit") || {}).value || "cover";
      var position = (document.getElementById("bn-position") || {}).value || "center";
      var height = parseInt((document.getElementById("bn-height") || {}).value) || 200;
      var align = (document.getElementById("bn-align") || {}).value || "right";
      var overlay = parseInt((document.getElementById("bn-overlay") || {}).value) || 50;
      
      if (!img || !title) { alert("يرجى رفع صورة وإدخال عنوان"); return; }
      
      try {
        var doc = await FB.db.collection("config").doc("banners").get();
        var arr = (doc.exists && doc.data().list) ? doc.data().list : [];
        arr.push({ img: img, title: title, sub: sub, btn: btn, link: link.trim(), fit: fit, position: position, height: height, align: align, overlay: overlay });
        await FB.db.collection("config").doc("banners").set({ list: arr }, { merge: true });
        alert("✅ تم إضافة البانر");
        ["bn-title", "bn-sub", "bn-btn", "bn-link"].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ""; });
        var imgField = document.getElementById("bn-img"); if (imgField) imgField.value = "";
        var pImg = document.getElementById("bn-preview-img"); if (pImg) { pImg.src = ""; pImg.style.display = "none"; }
        var pLbl = document.getElementById("bn-preview-label"); if (pLbl) pLbl.style.display = "flex";
        this.loadBanners();
      } catch(e) { alert("خطأ: " + e.message); }
    },`;

if (oldSaveRegex.test(html)) {
  html = html.replace(oldSaveRegex, newSave);
  console.log('✅ تم تحديث saveBanner (يحفظ height/align/overlay)');
}

// ═══ 4) إضافة سكربت الرفع والمعاينة الجديد ═══
const uploadScript = `
<script>
// ═══ BANNER UPLOAD & PREVIEW ═══
function getImgBBKey() {
  var k = localStorage.getItem('chizen_imgbb_key');
  if (!k) {
    k = prompt('🔑 مفتاح ImgBB API (مرة واحدة فقط):\\n\\n1. افتح api.imgbb.com\\n2. سجل بالجوجل\\n3. انسخ API Key');
    if (k && k.trim()) { localStorage.setItem('chizen_imgbb_key', k.trim()); return k.trim(); }
    return null;
  }
  return k;
}

window.enhanceBannersUI = function() {
  var sc = document.getElementById('sc-banners');
  if (!sc) return;
  var old = sc.querySelector('.bn-upload-ctrl');
  if (old) return;
  
  var imgField = sc.querySelector('#bn-img');
  if (!imgField) return;
  var urlWrapper = imgField.closest('.fl');
  if (urlWrapper) urlWrapper.style.display = 'none';
  
  var addBtn = sc.querySelector('button[onclick*="saveBanner"]');
  var card = addBtn ? addBtn.parentElement : sc.querySelector('.cd');
  if (!card) return;
  
  var ui = document.createElement('div');
  ui.className = 'bn-upload-ctrl';
  ui.style.cssText = 'margin-bottom:15px;';
  ui.innerHTML = '<input type="file" id="bn-file" accept="image/*" style="display:none;">' +
    '<button type="button" id="bn-upload-btn" style="width:100%;padding:14px;background:linear-gradient(135deg,#ff27c9,#8d24ff);color:#fff;border:none;border-radius:12px;font-weight:900;font-size:14px;cursor:pointer;box-shadow:0 4px 15px rgba(255,39,201,0.3);margin-bottom:10px;">📷 اختر صورة من جهازك</button>' +
    '<div id="bn-status" style="text-align:center;min-height:18px;font-size:12px;margin-bottom:10px;"></div>' +
    '<div id="bn-preview" style="position:relative;width:100%;height:200px;border-radius:14px;overflow:hidden;margin-bottom:12px;background:linear-gradient(135deg,#0a0a15,#1a1a2e);border:1px solid #333;">' +
      '<img id="bn-preview-img" src="" style="width:100%;height:100%;object-fit:cover;object-position:center;display:none;">' +
      '<div id="bn-preview-overlay" style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 25px;text-align:right;align-items:flex-end;background:linear-gradient(90deg,rgba(0,0,0,0.5) 0%,transparent 80%);pointer-events:none;">' +
        '<div id="bn-preview-title" style="color:#fff;font-weight:900;font-size:22px;margin-bottom:6px;text-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>' +
        '<div id="bn-preview-sub" style="color:#fff;font-size:13px;margin-bottom:12px;text-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>' +
        '<div id="bn-preview-btn" style="background:linear-gradient(135deg,#ff27c9,#8d24ff);color:#fff;border-radius:10px;padding:9px 20px;font-weight:900;font-size:13px;box-shadow:0 4px 12px rgba(255,39,201,0.4);"></div>' +
      '</div>' +
      '<div id="bn-preview-label" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#666;font-size:13px;font-weight:700;flex-direction:column;gap:8px;">' +
        '<div style="font-size:40px;opacity:0.5;">🖼️</div><div>لم يتم رفع صورة بعد</div>' +
      '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
      '<div><label style="font-size:10px;color:#b8c5ee;display:block;margin-bottom:5px;font-weight:700;">طريقة العرض</label>' +
      '<select id="bn-fit" style="width:100%;padding:10px;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:8px;font-family:inherit;font-size:12px;">' +
      '<option value="cover">ملء (قص)</option><option value="contain">احتواء</option><option value="fill">تمدد</option></select></div>' +
      '<div><label style="font-size:10px;color:#b8c5ee;display:block;margin-bottom:5px;font-weight:700;">الموضع</label>' +
      '<select id="bn-position" style="width:100%;padding:10px;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:8px;font-family:inherit;font-size:12px;">' +
      '<option value="center">وسط</option><option value="top">أعلى</option><option value="bottom">أسفل</option><option value="left">يسار</option><option value="right">يمين</option><option value="top left">أعلى يسار</option><option value="top right">أعلى يمين</option><option value="bottom left">أسفل يسار</option><option value="bottom right">أسفل يمين</option></select></div>' +
    '</div>' +
    '<div style="margin-bottom:12px;"><label style="font-size:10px;color:#b8c5ee;display:block;margin-bottom:5px;font-weight:700;">الارتفاع: <span id="bn-height-val" style="color:#ff27c9;">200</span>px</label>' +
    '<input type="range" id="bn-height" min="150" max="350" value="200" step="10" style="width:100%;accent-color:#ff27c9;"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
      '<div><label style="font-size:10px;color:#b8c5ee;display:block;margin-bottom:5px;font-weight:700;">محاذاة النص</label>' +
      '<select id="bn-align" style="width:100%;padding:10px;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:8px;font-family:inherit;font-size:12px;">' +
      '<option value="right">يمين</option><option value="center">وسط</option><option value="left">يسار</option></select></div>' +
      '<div><label style="font-size:10px;color:#b8c5ee;display:block;margin-bottom:5px;font-weight:700;">تعتيم: <span id="bn-overlay-val" style="color:#ff27c9;">50</span>%</label>' +
      '<input type="range" id="bn-overlay" min="0" max="100" value="50" step="5" style="width:100%;accent-color:#ff27c9;"></div>' +
    '</div>';
  
  card.insertBefore(ui, addBtn);
  
  var $ = function(id) { return document.getElementById(id); };
  var fitSel = $('bn-fit'), posSel = $('bn-position'), alignSel = $('bn-align');
  var hInput = $('bn-height'), oInput = $('bn-overlay');
  var preview = $('bn-preview'), previewImg = $('bn-preview-img');
  var previewOverlay = $('bn-preview-overlay'), previewLabel = $('bn-preview-label');
  var previewTitle = $('bn-preview-title'), previewSub = $('bn-preview-sub'), previewBtn = $('bn-preview-btn');
  var titleInput = document.getElementById('bn-title');
  var subInput = document.getElementById('bn-sub');
  var btnInput = document.getElementById('bn-btn');
  
  function updatePreview() {
    var fit = fitSel.value, pos = posSel.value;
    var h = parseInt(hInput.value), ov = parseInt(oInput.value), al = alignSel.value;
    preview.style.height = h + 'px';
    previewImg.style.objectFit = fit;
    previewImg.style.objectPosition = pos;
    var ta = al === 'center' ? 'center' : (al === 'left' ? 'left' : 'right');
    var ai = al === 'center' ? 'center' : (al === 'left' ? 'flex-start' : 'flex-end');
    var dir = al === 'left' ? '270deg' : (al === 'center' ? '180deg' : '90deg');
    previewOverlay.style.textAlign = ta;
    previewOverlay.style.alignItems = ai;
    previewOverlay.style.background = 'linear-gradient(' + dir + ', rgba(0,0,0,' + (ov/100) + ') 0%, transparent 80%)';
    previewTitle.textContent = titleInput.value; previewTitle.style.display = titleInput.value ? 'block' : 'none';
    previewSub.textContent = subInput.value; previewSub.style.display = subInput.value ? 'block' : 'none';
    previewBtn.textContent = btnInput.value; previewBtn.style.display = btnInput.value ? 'block' : 'none';
  }
  
  $('bn-upload-btn').onclick = function() { $('bn-file').click(); };
  
  $('bn-file').onchange = async function() {
    var f = this.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { $('bn-status').textContent = '❌ ليس صورة'; $('bn-status').style.color = '#ff4d6d'; return; }
    if (f.size > 15 * 1024 * 1024) { $('bn-status').textContent = '❌ الصورة كبيرة (15MB)'; $('bn-status').style.color = '#ff4d6d'; return; }
    var key = getImgBBKey();
    if (!key) { $('bn-status').textContent = '❌ مفتاح ImgBB مطلوب'; $('bn-status').style.color = '#ff4d6d'; return; }
    
    $('bn-status').textContent = '⏳ جاري الرفع...';
    $('bn-status').style.color = '#ff27c9';
    $('bn-upload-btn').disabled = true;
    $('bn-upload-btn').textContent = '⏳ جاري الرفع...';
    
    try {
      var fd = new FormData(); fd.append('image', f);
      var res = await fetch('https://api.imgbb.com/1/upload?key=' + key, { method: 'POST', body: fd });
      var json = await res.json();
      if (!json.success) throw new Error('فشل الرفع');
      document.getElementById('bn-img').value = json.data.url;
      previewImg.src = json.data.url;
      previewImg.style.display = 'block';
      previewLabel.style.display = 'none';
      updatePreview();
      $('bn-status').textContent = '✅ تم الرفع';
      $('bn-status').style.color = '#22c55e';
      $('bn-upload-btn').textContent = '🔄 استبدال الصورة';
    } catch(e) {
      $('bn-status').textContent = '❌ ' + e.message;
      $('bn-status').style.color = '#ff4d6d';
      $('bn-upload-btn').textContent = '📷 اختر صورة من جهازك';
    } finally { $('bn-upload-btn').disabled = false; }
  };
  
  hInput.oninput = function() { $('bn-height-val').textContent = this.value; updatePreview(); };
  oInput.oninput = function() { $('bn-overlay-val').textContent = this.value; updatePreview(); };
  fitSel.onchange = updatePreview; posSel.onchange = updatePreview; alignSel.onchange = updatePreview;
  if (titleInput) titleInput.oninput = updatePreview;
  if (subInput) subInput.oninput = updatePreview;
  if (btnInput) btnInput.oninput = updatePreview;
  
  updatePreview();
};

// Auto-run
var bt = document.querySelector('button[onclick*="tab(\\'banners\\'"]');
if (bt) bt.addEventListener('click', function() { setTimeout(window.enhanceBannersUI, 150); });
setTimeout(window.enhanceBannersUI, 1500);
</script>
`;

html = html.replace('</body>', uploadScript + '\n</body>');

// 5) حفظ + فحص
fs.writeFileSync(file + '.bak_upload_' + Date.now(), original);
fs.writeFileSync(file, html);

const scRe2 = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc2, i = 0, errs = 0;
while ((sc2 = scRe2.exec(html)) !== null) {
  i++;
  if (/src\s*=/.test(sc2[1])) continue;
  if (!sc2[2].trim()) continue;
  const tmp = path.join(os.tmpdir(), 'up_' + i + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc2[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
  } catch (e) {
    errs++;
    const errLine = (e.stderr || '').toString().match(/:(\d+)/);
    console.log('❌ block #' + i + (errLine ? ' (سطر ' + errLine[1] + ')' : ''));
  }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}
console.log('\n════════ SYNTAX ════════');
console.log(errs === 0 ? '✅ SAFE TO COMMIT (' + i + ' blocks)' : '❌ ' + errs + ' errors');
