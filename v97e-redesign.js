const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97E_REDESIGN -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const css = `
<style id="v97e-pro">
#cat-mgr-app { background: linear-gradient(180deg, #0f0a24 0%, #0a0825 100%) !important; padding: 0 !important; color: #fff !important; }
.cm-header { background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%) !important; padding: 18px 16px !important; margin: 0 0 16px !important; border: none !important; border-radius: 0 0 20px 20px !important; box-shadow: 0 4px 20px rgba(168,85,247,0.3) !important; }
.cm-header h2 { color: #fff !important; font-size: 17px !important; text-shadow: 0 1px 3px rgba(0,0,0,0.3) !important; }
.cm-back { background: rgba(255,255,255,0.15) !important; border: 1px solid rgba(255,255,255,0.35) !important; color: #fff !important; font-weight: 700 !important; }
.cm-badge { background: #fff !important; color: #7c3aed !important; font-weight: 900 !important; box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important; }
.cm-kpis { padding: 0 16px !important; margin: 16px 0 !important; gap: 10px !important; }
.cm-kpi { background: linear-gradient(135deg, #1e1533 0%, #151b3a 100%) !important; border: 1px solid rgba(168,85,247,0.25) !important; padding: 18px 12px !important; border-radius: 16px !important; position: relative !important; overflow: hidden !important; }
.cm-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #7c3aed, #ec4899); }
.cm-kpi b { color: #fff !important; font-size: 26px !important; }
.cm-kpi small { color: #a78bfa !important; font-weight: 700 !important; font-size: 11px !important; }
.cm-tabs { padding: 0 16px !important; margin: 16px 0 !important; gap: 8px !important; background: transparent !important; flex-wrap: wrap !important; }
.cm-tabs button { padding: 12px 10px !important; border-radius: 30px !important; background: rgba(168,85,247,0.1) !important; border: 1px solid rgba(168,85,247,0.3) !important; color: #c4b5fd !important; font-weight: 700 !important; font-size: 13px !important; transition: all 0.2s !important; min-width: 90px !important; }
.cm-tabs button.active { background: linear-gradient(135deg, #7c3aed, #ec4899) !important; color: #fff !important; border-color: transparent !important; box-shadow: 0 4px 12px rgba(168,85,247,0.4) !important; transform: translateY(-1px) !important; }
#cm-content { padding: 0 16px 100px !important; }
.cm-empty { color: #a78bfa !important; padding: 60px 20px !important; font-size: 15px !important; }
.cm-order { background: linear-gradient(135deg, #1e1533 0%, #151b3a 100%) !important; border: 1px solid rgba(168,85,247,0.25) !important; border-radius: 16px !important; padding: 16px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important; margin-bottom: 12px !important; }
.cm-order-head { border-bottom: 1px solid rgba(168,85,247,0.15) !important; padding-bottom: 12px !important; margin-bottom: 12px !important; }
.cm-order-head b { color: #a78bfa !important; font-size: 16px !important; }
.cm-order-head div b { color: #ec4899 !important; font-size: 18px !important; }
.cm-order-meta { color: #9ca3af !important; }
.cm-item { padding: 10px 0 !important; border-bottom: 1px solid rgba(168,85,247,0.1) !important; }
.cm-item-info b { color: #fff !important; font-size: 14px !important; }
.cm-item-info span { color: #a78bfa !important; }
.cm-item-price { color: #fbbf24 !important; font-size: 14px !important; }
.cm-reason { background: rgba(15,10,36,0.8) !important; border: 1.5px solid rgba(168,85,247,0.3) !important; color: #fff !important; border-radius: 12px !important; }
.cm-reason:focus { border-color: #a855f7 !important; outline: none !important; box-shadow: 0 0 0 3px rgba(168,85,247,0.15) !important; }
.cm-order-foot button { border-radius: 12px !important; padding: 14px !important; font-size: 14px !important; }
.cm-btn-ok { background: linear-gradient(135deg, #10b981, #059669) !important; box-shadow: 0 4px 12px rgba(16,185,129,0.3) !important; }
.cm-btn-warn { background: linear-gradient(135deg, #ef4444, #dc2626) !important; box-shadow: 0 4px 12px rgba(239,68,68,0.3) !important; }
.cm-product { background: linear-gradient(135deg, #1e1533 0%, #151b3a 100%) !important; border: 1px solid rgba(168,85,247,0.2) !important; border-radius: 16px !important; padding: 14px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important; margin-bottom: 12px !important; }
.cm-product-info b { color: #fff !important; font-size: 15px !important; }
.cm-product-info span { color: #a78bfa !important; }
.v97e-fab { position: fixed; bottom: 24px; left: 24px; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #ec4899); color: #fff; border: none; font-size: 30px; font-weight: 900; box-shadow: 0 8px 24px rgba(168,85,247,0.5); cursor: pointer; z-index: 99998; display: none; align-items: center; justify-content: center; line-height: 1; }
.v97e-welcome { background: linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(236,72,153,0.25) 100%); border: 1px solid rgba(168,85,247,0.3); border-radius: 20px; padding: 20px; margin-bottom: 16px; color: #fff; }
.v97e-welcome h3 { margin: 0 0 8px; font-size: 19px; color: #fff; }
.v97e-welcome p { margin: 0; color: #c4b5fd; font-size: 13px; }
.v97e-section-title { color: #a78bfa; font-size: 14px; font-weight: 800; margin: 20px 0 10px; padding-right: 4px; }
.v97e-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
.v97e-action { background: rgba(30,21,51,0.8); border: 1px solid rgba(168,85,247,0.25); border-radius: 14px; padding: 16px 12px; text-align: center; cursor: pointer; color: #fff; transition: all 0.2s; }
.v97e-action:active { background: rgba(168,85,247,0.3); transform: scale(0.97); }
.v97e-action .icon { font-size: 28px; display: block; margin-bottom: 6px; }
.v97e-action .label { font-size: 12px; font-weight: 700; color: #c4b5fd; }
.v97e-summary { background: linear-gradient(135deg, #1e1533, #151b3a); border: 1px solid rgba(168,85,247,0.2); border-radius: 16px; padding: 16px; color: #c4b5fd; font-size: 13px; }
.v97e-summary .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(168,85,247,0.1); }
.v97e-summary .row:last-child { border-bottom: none; }
</style>
`;

const js = `
<script id="v97e-redesign-js">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 150) return;
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 100);
    if(window.__v97eReady) return;
    window.__v97eReady = true;
    var db = firebase.firestore();

    window.catMgrApp.loadProducts = async function(){
      var st = window.catMgrApp.state;
      var cat = st.cat;
      try {
        var snap = await db.collection('products').where('category','==',cat).get();
        if(snap.empty){
          try { snap = await db.collection('products').where('categories','array-contains',cat).get(); } catch(e){}
        }
        if(snap.empty){
          var allSnap = await db.collection('products').limit(500).get();
          st.products = allSnap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); }).filter(function(pr){
            return pr.category === cat || (Array.isArray(pr.categories) && pr.categories.indexOf(cat) !== -1);
          });
        } else {
          st.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
        }
        var kp = document.getElementById('cm-kpi-products');
        if(kp) kp.textContent = st.products.length;
      } catch(e){ console.warn('[V97E]', e); }
    };

    window.catMgrApp.loadProducts();

    var origSwitch = window.catMgrApp.switchTab;
    window.catMgrApp.switchTab = function(t){
      if(t === 'home'){
        window.catMgrApp.state.activeTab = 'home';
        document.querySelectorAll('.cm-tabs button').forEach(function(b){
          b.classList.toggle('active', b.getAttribute('data-cm-tab') === 'home');
        });
        renderHome();
        hideFab();
        return;
      }
      origSwitch.call(window.catMgrApp, t);
      if(t === 'products'){ showFab(); }
      else { hideFab(); }
    };

    function showFab(){
      var fab = document.getElementById('v97e-fab');
      if(!fab){
        fab = document.createElement('button');
        fab.id = 'v97e-fab';
        fab.className = 'v97e-fab';
        fab.textContent = '+';
        fab.onclick = function(){ if(window.__v97cOpenForm) window.__v97cOpenForm(); };
        document.body.appendChild(fab);
      }
      fab.style.display = 'flex';
    }
    function hideFab(){
      var fab = document.getElementById('v97e-fab');
      if(fab) fab.style.display = 'none';
    }

    function esc(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

    function renderHome(){
      var content = document.getElementById('cm-content');
      if(!content) return;
      var st = window.catMgrApp.state;
      var hour = new Date().getHours();
      var greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء النور' : 'مساء الخير';
      var emoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
      var catLabels = {electronics:'إلكترونيات',fashion:'أزياء',home:'منزل',beauty:'تجميل',kids:'أطفال',sports:'رياضة',groceries:'بقالة',auto:'سيارات'};
      var catName = catLabels[st.cat] || st.cat;
      var pendingCount = st.pending.length;
      var prodCount = st.products.length;
      var lowStock = st.products.filter(function(pr){ return Number(pr.stock) > 0 && Number(pr.stock) <= 3; }).length;
      var html = '';
      html += '<div class="v97e-welcome"><h3>' + emoji + ' ' + greeting + ' ' + esc(st.user.name || 'مدير القسم') + '</h3>';
      html += '<p>لوحة إدارة قسم <b style="color:#ec4899;">' + esc(catName) + '</b></p></div>';
      html += '<div class="v97e-section-title">⚡ إجراءات سريعة</div>';
      html += '<div class="v97e-actions">';
      html += '<div class="v97e-action" data-go="add"><span class="icon">➕</span><div class="label">إضافة منتج</div></div>';
      html += '<div class="v97e-action" data-go="pending"><span class="icon">📦</span><div class="label">مراجعة الطلبات</div></div>';
      html += '<div class="v97e-action" data-go="products"><span class="icon">🛍️</span><div class="label">منتجاتي</div></div>';
      html += '<div class="v97e-action" data-go="logout"><span class="icon">🚪</span><div class="label">تسجيل خروج</div></div>';
      html += '</div>';
      html += '<div class="v97e-section-title">📊 ملخص اليوم</div>';
      html += '<div class="v97e-summary">';
      html += '<div class="row"><span>📦 طلبات بانتظارك</span><b style="color:#fbbf24;">' + pendingCount + '</b></div>';
      html += '<div class="row"><span>🛍️ إجمالي منتجاتك</span><b style="color:#ec4899;">' + prodCount + '</b></div>';
      html += '<div class="row"><span>⚠️ مخزون منخفض</span><b style="color:#ef4444;">' + lowStock + '</b></div>';
      html += '</div>';
      content.innerHTML = html;
      content.querySelectorAll('.v97e-action').forEach(function(el){
        el.onclick = function(){
          var go = el.getAttribute('data-go');
          if(go === 'logout'){ window.catMgrApp.back(); }
          else if(go === 'add'){ if(window.__v97cOpenForm) window.__v97cOpenForm(); }
          else { window.catMgrApp.switchTab(go); }
        };
      });
    }

    setTimeout(function(){
      var tabs = document.querySelector('.cm-tabs');
      if(tabs && !tabs.querySelector('[data-cm-tab="home"]')){
        var homeBtn = document.createElement('button');
        homeBtn.setAttribute('data-cm-tab','home');
        homeBtn.textContent = '🏠 الرئيسية';
        homeBtn.onclick = function(){ window.catMgrApp.switchTab('home'); };
        tabs.insertBefore(homeBtn, tabs.firstChild);
        setTimeout(function(){ window.catMgrApp.switchTab('home'); }, 300);
      }
    }, 700);

    console.log('[V97E] ready');
  }
  hook();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + MARKER + '\n' + css + '\n' + js + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97e patched. size:', h.length);
