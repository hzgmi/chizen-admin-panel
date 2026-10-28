const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v102e-css"')) { console.log('⚠️ مطبق مسبقاً'); process.exit(0); }

// 1. استبدال دالة renderImgs القديمة بالجديدة
const oldFn = `function renderImgs(){
        var w = $('v102-imgs');
        w.innerHTML = uploadState.urls.map(function(url,i){
          return '<div class="v102-img-thumb"><img src="'+esc(url)+'">'+(i===0?'<span class="v102-badge-primary">رئيسية</span>':'')+'<button type="button" data-i="'+i+'">×</button></div>';
        }).join('');
        w.querySelectorAll('button[data-i]').forEach(function(btn){
          btn.onclick = function(){ uploadState.urls.splice(parseInt(this.getAttribute('data-i'),10),1); renderImgs(); };
        });
      }`;

const newFn = `function renderImgs(){
        var w = $('v102-imgs');
        w.innerHTML = uploadState.urls.map(function(url,i){
          return '<div class="v102-img-thumb" data-idx="'+i+'"><img src="'+esc(url)+'">'+(i===0?'<span class="v102-badge-primary">رئيسية</span>':'')+'<button type="button" data-i="'+i+'">×</button></div>';
        }).join('');
        
        // ميزة النقر على الصورة لجعلها رئيسية
        w.querySelectorAll('.v102-img-thumb').forEach(function(thumb){
          thumb.onclick = function(e){
            if(e.target.tagName === 'BUTTON') return; // تجاهل زر الحذف
            var idx = parseInt(this.getAttribute('data-idx'),10);
            if(idx === 0) return; // هي رئيسية بالفعل
            var selected = uploadState.urls.splice(idx, 1)[0];
            uploadState.urls.unshift(selected); // نقلها للمقدمة
            renderImgs();
          };
        });

        w.querySelectorAll('button[data-i]').forEach(function(btn){
          btn.onclick = function(e){
            e.stopPropagation(); // منع تفعيل النقر على الصورة
            uploadState.urls.splice(parseInt(this.getAttribute('data-i'),10),1); renderImgs(); 
          };
        });
      }`;

if (h.includes(oldFn)) {
  h = h.replace(oldFn, newFn);
  console.log('✅ تم تعديل دالة عرض الصور بنجاح');
} else {
  console.log('❌ لم يتم العثور على دالة renderImgs. قد يكون الكود قديماً أو مختلفاً.');
  process.exit(1);
}

// 2. إضافة CSS لتحسين المظهر
const css = `
<style id="v102e-css">
.v102-img-thumb { cursor: pointer; position: relative; border: 2px solid transparent; transition: border 0.2s; }
.v102-img-thumb:hover { border-color: #a78bfa; }
.v102-img-thumb:not(:has(.v102-badge-primary))::after {
  content: 'اضغط كرئيسية'; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
  background: rgba(10,8,37,0.85); color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 4px;
  pointer-events: none; opacity: 0; transition: opacity 0.2s; white-space: nowrap;
}
.v102-img-thumb:hover::after { opacity: 1; }
</style>
`;
const bodyIdx = h.lastIndexOf('</body>');
h = h.slice(0, bodyIdx) + css + h.slice(bodyIdx);

fs.writeFileSync('index.html', h);
console.log('✅ patched:', before, '->', h.length);
