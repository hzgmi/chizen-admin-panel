const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
h = h.replace(/<script id="v252-products-fix">[\s\S]*?<\/script>/g, '');

const v252 = `
<script id="v252-products-fix">
(function(){
  function normName(v){
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.name || v.title || v.label || '';
    return String(v);
  }
  function normId(v){
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.id || v.key || '';
    return String(v);
  }

  function enhance(){
    var content = document.getElementById('v100-content');
    if (!content) return;

    // 1. شريط بحث + زر + (إن لم يكونا موجودين)
    if (!content.querySelector('.v252-toolbar')) {
      var grid = content.querySelector('.v100-products-grid');
      if (grid) {
        var tb = document.createElement('div');
        tb.className = 'v252-toolbar';
        tb.style.cssText = 'display:flex;gap:8px;margin-bottom:12px';
        tb.innerHTML =
          '<input class="v252-search" type="text" placeholder="🔍 ابحث بالاسم أو الماركة" style="flex:1;min-width:0;padding:12px 14px;background:rgba(10,8,37,.7);border:1px solid rgba(155,77,255,.3);border-radius:12px;color:#fff;font-family:inherit;font-size:13px;box-sizing:border-box">'
          + '<button class="v252-add" type="button" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none;width:48px;height:48px;border-radius:12px;font-size:22px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0">+</button>';
        content.insertBefore(tb, content.firstChild);

        tb.querySelector('.v252-add').onclick = function(e){
          e.preventDefault();
          if (window.__v102cOpenForm) window.__v102cOpenForm(null);
        };

        var st0 = window.catMgrApp && window.catMgrApp.state;
        tb.querySelector('.v252-search').oninput = function(){
          var q = this.value.toLowerCase().trim();
          content.querySelectorAll('.v100-prod').forEach(function(card, i){
            var p = st0 && st0.products && st0.products[i];
            if (!p) return;
            var nm = (p.name || '').toLowerCase();
            var bn = normName(p.brand).toLowerCase();
            card.style.display = (!q || nm.indexOf(q) !== -1 || bn.indexOf(q) !== -1) ? '' : 'none';
          });
        };
      }
    }

    // 2. إصلاح الماركة + ربط النقر للتعديل
    var st = window.catMgrApp && window.catMgrApp.state;
    if (!st || !st.products) return;

    content.querySelectorAll('.v100-prod').forEach(function(card, i){
      var p = st.products[i];
      if (!p) return;

      var spans = card.querySelectorAll('.v100-prod-info > span');
      if (spans.length > 0) {
        var bn = normName(p.brand);
        var pr = Number(p.price) || 0;
        spans[0].textContent = (bn ? bn + ' · ' : '') + pr.toFixed(0) + ' ر.ي';
      }

      if (!card.__v252) {
        card.__v252 = true;
        card.style.cursor = 'pointer';
        card.onclick = function(e){
          e.preventDefault();
          var pp = st.products[i];
          if (!pp) return;
          var np = Object.assign({}, pp);
          np.brand = normName(pp.brand);
          np.brandId = normId(pp.brandId) || normId(pp.brand);
          np.supplier = normName(pp.supplier || pp.supplierName);
          np.supplierId = normId(pp.supplierId) || normId(pp.supplier);
          if (window.__v102cOpenForm) window.__v102cOpenForm(np);
        };
      }
    });
  }

  var mo = new MutationObserver(function(){ setTimeout(enhance, 30); });
  var init = setInterval(function(){
    var c = document.getElementById('v100-content');
    if (c) { clearInterval(init); mo.observe(c, { childList: true, subtree: true }); enhance(); }
  }, 200);
  setInterval(enhance, 800);

  console.log('[V252] ready');
})();
</script>
`;

h = h.replace('</body>', v252 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v252 added');
