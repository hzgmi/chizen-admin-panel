const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;
let ops = [];

// ═══ 1) في productForm: أضف متغير imgsText قبل بناء HTML ═══
const varMarker = "var feats=Array.isArray(p.features)?p.features.join('\\n'):(p.features||'');";
if (!h.includes(varMarker)) { console.log('❌ feats var not found'); process.exit(1); }
h = h.replace(varMarker, varMarker + "\n    var imgsText=Array.isArray(p.imgs)?p.imgs.join('\\n'):'';");
ops.push('imgsText var added');

// ═══ 2) أضف حقل imgs بعد حقل img ═══
const imgFieldEnd = `'<div class="fl"><label class="fll">الوصف</label><textarea class="fi" id="f-desc">'+esc(p.desc||'')+'</textarea></div>'+`;
if (!h.includes(imgFieldEnd)) { console.log('❌ desc field not found'); process.exit(1); }
const imgsField = `'<div class="fl"><label class="fll">🖼️ صور إضافية (مصغرات)</label><textarea class="fi" id="f-imgs" style="min-height:80px;font-family:monospace;font-size:11px;line-height:1.6;" placeholder="سطر لكل رابط:&#10;https://example.com/img1.jpg&#10;https://example.com/img2.jpg">'+esc(imgsText)+'</textarea><div style="font-size:11px;color:var(--mt2);margin-top:4px;">اتركه فارغاً إن لم ترد مصغرات. الصورة الرئيسية تُضاف تلقائياً.</div></div>'+`;
h = h.replace(imgFieldEnd, imgsField + "\n      " + imgFieldEnd);
ops.push('imgs field UI added');

// ═══ 3) في saveProduct: احفظ imgs ═══
const saveMarker = "var feats=document.getElementById('f-feats').value.split('\\n').map(s=>s.trim()).filter(s=>s);";
if (!h.includes(saveMarker)) { console.log('❌ save feats not found'); process.exit(1); }
const imgsSave = `var imgsRaw=(document.getElementById('f-imgs').value||'').split('\\n').map(s=>s.trim()).filter(s=>s);\n    var mainImg=document.getElementById('f-img').value.trim();\n    if(mainImg&&imgsRaw.indexOf(mainImg)===-1)imgsRaw.unshift(mainImg);\n    `;
h = h.replace(saveMarker, imgsSave + saveMarker);
ops.push('imgs save logic added');

// ═══ 4) أضف imgs للـ data object ═══
const dataMarker = "desc:document.getElementById('f-desc').value.trim(),features:feats";
if (!h.includes(dataMarker)) { console.log('❌ data desc not found'); process.exit(1); }
h = h.replace(dataMarker, "desc:document.getElementById('f-desc').value.trim(),imgs:imgsRaw,features:feats");
ops.push('imgs in data object');

fs.writeFileSync(p, h);
ops.forEach(o => console.log('✅ ' + o));
console.log('size:', before, '->', h.length, '(+', h.length-before, ')');
