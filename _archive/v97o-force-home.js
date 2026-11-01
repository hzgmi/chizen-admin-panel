const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97O_FORCE_HOME -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<script id="chz-force-home-v97o">
(function(){
  'use strict';
  console.log('[V97O] force home as default');

  function hook(){
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 200);
    if(window.__v97oReady) return;
    window.__v97oReady = true;

    var db = firebase.firestore();

    // ═══ 1. استبدال loadProducts (نسخة موثوقة) ═══
    window.catMgrApp.loadProducts = async function(){
      var st = window.catMgrApp.state;
      try {
        var snap = await db.collection('products').get();
        st.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); })
          .filter(function(p){
            return p.category === st.cat ||
                   (Array.isArray(p.categories) && p.categories.indexOf(st.cat) !== -1);
          });
        var kp = document.getElementById('cm-kpi-products');
        if(kp) kp.textContent = st.products.length;
      } catch(e){ console.warn('[V97O] products:', e); st.products = []; }
    };

    // ═══ 2. استبدال subscribeOrders — لا يلمس التبويب أبداً ═══
    window.catMgrApp.subscribeOrders = function(){
      var st = window.catMgrApp.state;
      if(st.unsub) st.unsub();
      st.unsub = db.collection('orders')
        .where('workflowStatus','==','awaiting_categories')
        .onSnapshot(function(snap){
          var pending = [];
          snap.forEach(function(d){
            var data = d.data();
            var c = data.categories && data.categories[st.cat];
            if(c && c.status === 'pending') pending.push(Object.assign({id:d.id}, data));
          });
          st.pending = pending;
          var ko = document.getElementById('cm-kpi-orders');
          if(ko) ko.textContent = pending.length;
          // ⚠️ لا نلمس activeTab هنا — فقط نحدّث KPIs وربما الرئيسية
          if(st.activeTab === 'home') {
            try { renderHome(); } catch(e){ console.warn('[V97O] renderHome:', e); }
          }
        }, function(err){ console.warn('[V97O] orders:', err); });
    };

    // ═══ 3. renderHome آمن (fallback داخلي) ═══
    function renderHome(){
      var st = window.catMgrApp.state;
      var content = document.getElementById('cm-content');
      if(!content) return;
      var hour = new Date().getHours();
      var greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء النور' : 'مساء الخير';
      var emoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
      var catLabels = {electronics:'إلكترونيات',fashion:'أزياء',home:'منزل',beauty:'تجميل',kids:'أطفال',sports:'رياضة',groceries:'بقالة',auto:'سيارات'};
      var catName = catLabels[st.cat] || st.cat;
      var lowStock = (st.products || []).filter(function(p){ return Number(p.stock) > 0 && Number(p.stock) <= 3; }).length;

      var html = '';
      html += '<div style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);padding:20px;border-radius:20px;margin:0 16px 16px;color:#fff;box-shadow:0 8px 24px rgba(168,85,247,0.3);">';
      html += '<h2 style="margin:0 0 6px;font-size:19px;color:#fff;">' + emoji + ' ' + greeting + ' ' + ((st.user && st.user.name) || 'مدير القسم') + '</h2>';
      html += '<p style="margin:0;opacity:0.9;font-size:13px;color:#fff;">لوحة إدارة قسم <b>' + catName + '</b></p>';
      html += '</div>';

      html += '<div style="padding:0 16px;"><div style="color:#a78bfa;font-size:14px;font-weight:800;margin:16px 0 10px;">⚡ إجراءات سريعة</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
      var actions = [
        {icon:'➕', label:'إضافة منتج', color:'linear-gradient(135deg,#7c3aed,#ec4899)', action:'add'},
        {icon:'📦', label:'طلباتي (' + (st.pending||[]).length + ')', color:'linear-gradient(135deg,#1e1533,#151b3a)', action:'pending'},
        {icon:'🛍️', label:'منتجاتي (' + (st.products||[]).length + ')', color:'linear-gradient(135deg,#1e1533,#151b3a)', action:'products'},
        {icon:'🚪', label:'تسجيل خروج', color:'linear-gradient(135deg,#1e1533,#151b3a)', action:'logout'}
      ];
      actions.forEach(function(a){
        html += '<div data-go="' + a.action + '" style="background:' + a.color + ';border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:22px 14px;text-align:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);">';
        html += '<div style="font-size:34px;margin-bottom:8px;">' + a.icon + '</div>';
        html += '<div style="font-size:13px;font-weight:700;color:#fff;">' + a.label + '</div>';
        html += '</div>';
      });
      html += '</div>';

      html += '<div style="color:#a78bfa;font-size:14px;font-weight:800;margin:20px 0 10px;">📊 ملخص اليوم</div>';
      html += '<div style="background:linear-gradient(135deg,#1e1533,#151b3a);border:1px solid rgba(168,85,247,0.2);border-radius:16px;padding:16px;color:#c4b5fd;font-size:13px;">';
      html += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(168,85,247,0.1);"><span>📦 طلبات بانتظارك</span><b style="color:#fbbf24;">' + (st.pending||[]).length + '</b></div>';
      html += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(168,85,247,0.1);"><span>🛍️ إجمالي منتجاتك</span><b style="color:#ec4899;">' + (st.products||[]).length + '</b></div>';
      html += '<div style="display:flex;justify-content:space-between;padding:10px 0;"><span>⚠️ مخزون منخفض</span><b style="color:#ef4444;">' + lowStock + '</b></div>';
      html += '</div></div>';

      content.innerHTML = html;

      content.querySelectorAll('[data-go]').forEach(function(el){
        el.onclick = function(){
          var go = el.getAttribute('data-go');
          if(go === 'add'){ window.__v97cOpenForm && window.__v97cOpenForm(); }
          else if(go === 'logout'){ window.catMgrApp.back(); }
          else { window.catMgrApp.switchTab(go); }
        };
      });
    }

    // ═══ 4. switchTab — home فوري، pending يمر عبر v97f ═══
    var origSwitch = window.catMgrApp.switchTab;
    window.catMgrApp.switchTab = function(t){
      var st = window.catMgrApp.state;
      st.activeTab = t;
      document.querySelectorAll('.cm-tabs button').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-cm-tab') === t);
      });
      if(t === 'home'){
        renderHome();
        return;
      }
      origSwitch.call(window.catMgrApp, t);
    };

    // ═══ 5. استبدال init — home قبل subscribeOrders ═══
    window.catMgrApp.init = async function(ud){
      console.log('[V97O] init:', ud);
      if(!ud || ud.role !== 'cat_manager') return false;

      var st = window.catMgrApp.state;
      st.user = ud;
      st.cat = ud.assignedCategory;
      if(!st.cat){ alert('⚠️ لم يُعيَّن قسم'); return false; }
      st.initialized = true;
      st.activeTab = 'home';  // ← قبل subscribeOrders

      var app = document.getElementById('cat-mgr-app');
      if(app) app.style.display = 'block';
      var cn = document.getElementById('cm-cat-name');
      if(cn) cn.textContent = ud.assignedCategory;

      // تحميل أولي
      try { await window.catMgrApp.loadProducts(); } catch(e){}

      // حقن تبويب الرئيسية إذا غير موجود
      var tabs = document.querySelector('.cm-tabs');
      if(tabs && !tabs.querySelector('[data-cm-tab="home"]')){
        var hb = document.createElement('button');
        hb.setAttribute('data-cm-tab','home');
        hb.textContent = '🏠 الرئيسية';
        hb.onclick = function(){ window.catMgrApp.switchTab('home'); };
        tabs.insertBefore(hb, tabs.firstChild);
      }

      // ارسم الرئيسية فوراً
      window.catMgrApp.switchTab('home');

      // اشترك في الطلبات — بعد ما activeTab='home' بالفعل
      try { window.catMgrApp.subscribeOrders(); } catch(e){ console.warn(e); }

      console.log('[V97O] init complete, activeTab=', st.activeTab);
      return true;
    };

    console.log('[V97O] ready');
  }
  hook();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97o patched. size:', h.length);
