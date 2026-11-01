const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const original = html;

// ═══ 1) تعديل saveBanner لإضافة الحقول الجديدة ═══
const oldSave = /saveBanner\s*:\s*(?:async\s+)?function\s*\([^)]*\)\s*\{[\s\S]*?\n\s{4}\},/;
const newSave = `saveBanner: async function() {
      var img = document.getElementById("bn-img").value.trim();
      var title = document.getElementById("bn-title").value.trim();
      var sub = document.getElementById("bn-sub").value.trim();
      var btn = document.getElementById("bn-btn").value.trim() || "تسوق الآن";
      var link = document.getElementById("bn-link") ? document.getElementById("bn-link").value.trim() : "";
      var fit = document.getElementById("bn-fit") ? document.getElementById("bn-fit").value : "cover";
      var position = document.getElementById("bn-position") ? document.getElementById("bn-position").value : "center";
      
      if (!img || !title) { alert("الصورة والعنوان مطلوبان"); return; }
      
      try {
        var doc = await FB.db.collection("config").doc("banners").get();
        var arr = (doc.exists && doc.data().list) ? doc.data().list : [];
        arr.push({ img: img, title: title, sub: sub, btn: btn, link: link, fit: fit, position: position });
        await FB.db.collection("config").doc("banners").set({ list: arr }, { merge: true });
        alert("✅ تم الإضافة");
        ["bn-img", "bn-title", "bn-sub", "bn-btn", "bn-link"].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) el.value = "";
        });
        var preview = document.getElementById("bn-preview-img");
        var label = document.getElementById("bn-preview-label");
        if (preview) preview.src = "";
        if (label) { label.style.display = "flex"; label.textContent = "معاينة الصورة"; }
        this.loadBanners();
      } catch(e) { alert("خطأ: " + e.message); }
    },`;

if (oldSave.test(html)) {
  html = html.replace(oldSave, newSave);
  console.log('✅ تم تحديث saveBanner لحفظ fit و position.');
}

// ═══ 2) إضافة دالة تحسين UI بعد buildSections ═══
if (!html.includes('enhanceBannersUI')) {
  const enhanceJS = `
<script>
// ═══ إضافة معاينة + تحكم للبانرات ═══
window.enhanceBannersUI = function() {
  var sc = document.getElementById('sc-banners');
  if (!sc) return;
  if (sc.querySelector('.bn-preview-controls')) return;
  
  var imgInput = sc.querySelector('#bn-img');
  if (!imgInput) return;
  
  var wrapper = document.createElement('div');
  wrapper.className = 'bn-preview-controls';
  wrapper.style.cssText = 'margin: 12px 0; padding: 12px; background: rgba(255,39,201,0.05); border: 1px solid rgba(255,39,201,0.2); border-radius: 12px;';
  wrapper.innerHTML = '<div style="margin-bottom: 8px; font-size: 11px; color: #ff27c9; font-weight: 800;">🖼️ معاينة الصورة والتحكم</div>' +
    '<div style="position: relative; width: 100%; height: 180px; background: linear-gradient(135deg,#1a1a2e,#000); border-radius: 10px; overflow: hidden; border: 1px solid #333;">' +
      '<img id="bn-preview-img" src="" style="width:100%;height:100%;object-fit:cover;object-position:center;display:none;">' +
      '<div id="bn-preview-label" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#666;font-size:13px;font-weight:700;">📷 ضع رابط الصورة للمعاينة</div>' +
    '</div>' +
    '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">' +
      '<div>' +
        '<label style="font-size:10px;color:#b8c5ee;display:block;margin-bottom:4px;font-weight:700;">طريقة العرض</label>' +
        '<select id="bn-fit" style="width:100%;padding:8px;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:6px;font-family:inherit;font-size:12px;">' +
          '<option value="cover">🖼️ ملء (يُقص الزائد)</option>' +
          '<option value="contain">📦 احتواء (الصورة كاملة)</option>' +
          '<option value="fill">↔️ تمدد</option>' +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:10px;color:#b8c5ee;display:block;margin-bottom:4px;font-weight:700;">الموضع</label>' +
        '<select id="bn-position" style="width:100%;padding:8px;background:#1a1a2e;color:#fff;border:1px solid #444;border-radius:6px;font-family:inherit;font-size:12px;">' +
          '<option value="center">وسط</option>' +
          '<option value="top">أعلى</option>' +
          '<option value="bottom">أسفل</option>' +
          '<option value="left">يسار</option>' +
          '<option value="right">يمين</option>' +
          '<option value="top left">أعلى يسار</option>' +
          '<option value="top right">أعلى يمين</option>' +
          '<option value="bottom left">أسفل يسار</option>' +
          '<option value="bottom right">أسفل يمين</option>' +
        '</select>' +
      '</div>' +
    '</div>';
  
  // إدراج بعد حقل الصورة
  imgInput.parentNode.insertBefore(wrapper, imgInput.nextSibling);
  
  // ═══ ربط الأحداث ═══
  var previewImg = document.getElementById('bn-preview-img');
  var label = document.getElementById('bn-preview-label');
  var fitSelect = document.getElementById('bn-fit');
  var posSelect = document.getElementById('bn-position');
  
  // معاينة عند إدخال رابط الصورة
  imgInput.addEventListener('input', function() {
    var url = this.value.trim();
    if (url) {
      previewImg.src = url;
      previewImg.style.display = 'block';
      label.style.display = 'none';
      previewImg.onerror = function() {
        previewImg.style.display = 'none';
        label.style.display = 'flex';
        label.textContent = '❌ فشل تحميل الصورة';
        label.style.color = '#ff4d6d';
      };
      previewImg.onload = function() {
        previewImg.style.display = 'block';
        label.style.display = 'none';
      };
    } else {
      previewImg.style.display = 'none';
      label.style.display = 'flex';
      label.textContent = '📷 ضع رابط الصورة للمعاينة';
      label.style.color = '#666';
    }
  });
  
  // تغيير طريقة العرض
  fitSelect.addEventListener('change', function() {
    previewImg.style.objectFit = this.value;
  });
  
  // تغيير الموضع
  posSelect.addEventListener('change', function() {
    previewImg.style.objectPosition = this.value;
  });
  
  console.log('✅ تم إضافة أدوات التحكم بالبانر');
};

// تشغيل عند فتح تبويب البانرات (إذا كان tab مُعرّف)
var origTab = window.tab || (window.A && A.tab);
setTimeout(function() {
  // انتظر حتى يُبنى الـ DOM
  setTimeout(window.enhanceBannersUI, 500);
}, 1500);

// تشغيل عند الضغط على زر البانرات
document.addEventListener('click', function(e) {
  if (e.target && e.target.getAttribute('onclick') && e.target.getAttribute('onclick').indexOf("tab('banners'") !== -1) {
    setTimeout(window.enhanceBannersUI, 100);
  }
});
</script>
`;
  html = html.replace('</body>', enhanceJS + '\n</body>');
  console.log('✅ تم إضافة سكربت تحسين UI للبانرات.');
}

// ═══ 3) حفظ وفحص ═══
fs.writeFileSync(file + '.bak_bannerctrl_' + Date.now(), original);
fs.writeFileSync(file, html);

console.log('\n═══ التحقق ═══');
console.log('  saveBanner محدّثة: ' + (html.includes('fit: fit') ? '✅' : '❌'));
console.log('  enhanceBannersUI: ' + (html.includes('window.enhanceBannersUI') ? '✅' : '❌'));
console.log('  bn-fit: ' + (html.includes('id="bn-fit"') ? '✅' : '❌'));
console.log('  bn-position: ' + (html.includes('id="bn-position"') ? '✅' : '❌'));

// فحص Syntax
const os = require('os');
const path = require('path');
const scRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let sc, i = 0, errs = 0;
while ((sc = scRe.exec(html)) !== null) {
  i++;
  if (/src\s*=/.test(sc[1])) continue;
  if (!sc[2].trim()) continue;
  const tmp = path.join(os.tmpdir(), 'bctrl_' + i + '_' + Date.now() + '.js');
  try {
    fs.writeFileSync(tmp, sc[2]);
    require('child_process').execSync('node --check "' + tmp + '"', { stdio: 'pipe', timeout: 10000 });
  } catch (e) {
    errs++;
    const errLine = (e.stderr || '').toString().match(/:(\d+)/);
    console.log('  ❌ block #' + i + (errLine ? ' (سطر ' + errLine[1] + ')' : ''));
  }
  finally { try { fs.unlinkSync(tmp); } catch(_){} }
}
console.log('\n════════ SYNTAX ════════');
console.log(errs === 0 ? '✅ SAFE TO COMMIT (' + i + ' blocks)' : '❌ ' + errs + ' errors');
