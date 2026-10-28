const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// حذف v249 القديم
h = h.replace(/<script id="v249-form">[\s\S]*?<\/script>/g, '');

const v250 = `
<script id="v250-bind">
(function(){
  console.log('[V250] binding installer');
  
  // تأكد من وجود openForm من أي نسخة سابقة
  function ensureForm(){
    if (typeof window.__v102cOpenForm === 'function') return true;
    return false;
  }
  
  // ربط onclick مباشرة
  function bindButtons(){
    if (!ensureForm()) return;
    
    // 1. زر "منتجاتي" (الشريط العلوي)
    var btn1 = document.querySelector('.v101-add-btn');
    if (btn1 && !btn1.__v250) {
      btn1.__v250 = true;
      btn1.onclick = function(e){
        e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
        console.log('[V250] toolbar + clicked');
        window.__v102cOpenForm();
      };
      console.log('[V250] bound .v101-add-btn');
    }
    
    // 2. زر "الرئيسية" الكبير
    var btn2 = document.querySelector('.v100-act[data-go="add"]');
    if (btn2 && !btn2.__v250) {
      btn2.__v250 = true;
      btn2.onclick = function(e){
        e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
        console.log('[V250] home + clicked');
        window.__v102cOpenForm();
      };
      console.log('[V250] bound .v100-act[data-go="add"]');
    }
  }
  
  // 3. راقب DOM للأزرار التي تظهر لاحقاً
  var mo = new MutationObserver(bindButtons);
  mo.observe(document.body, { childList: true, subtree: true });
  
  // 4. فحص دوري (احتياطي)
  setInterval(bindButtons, 800);
  
  // 5. محاولة فورية
  setTimeout(bindButtons, 500);
  setTimeout(bindButtons, 1500);
  
  console.log('[V250] binders active');
})();
</script>
`;

h = h.replace('</body>', v250 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v250: direct onclick binding with MutationObserver');
