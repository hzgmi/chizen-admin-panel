const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97N_CATMGR_INIT -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<script id="chz-catmgr-init-v97n">
(function(){
  'use strict';
  console.log('[V97N] replacing catMgrApp.init');

  function hook(){
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 200);
    if(window.__v97nReady) return;
    window.__v97nReady = true;

    var tabBtns = [
      {label:'➕<br>إضافة منتج', action:'add'},
      {label:'📦<br>الطلبات', action:'pending'},
      {label:'🛍️<br>منتجاتي', action:'products'},
      {label:'🚪<br>خروج', action:'logout'}
    ];

    function fallbackHTML(name){
      var html = '<div style="padding:30px 20px;text-align:center;color:#fff;">';
      html += '<h2 style="font-size:20px;margin-bottom:20px;">👋 أهلاً ' + (name || 'مدير القسم') + '</h2>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:400px;margin:auto;">';
      tabBtns.forEach(function(b, i){
        var bg = i === 0 ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'rgba(168,85,247,0.2)';
        var border = i === 0 ? 'none' : '1px solid rgba(168,85,247,0.4)';
        html += '<button data-go="' + b.action + '" style="padding:20px;background:' + bg + ';color:#fff;border:' + border + ';border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;">' + b.label + '</button>';
      });
      html += '</div></div>';
      return html;
    }

    window.catMgrApp.init = async function(ud){
      console.log('[V97N] init:', ud);
      if(!ud || ud.role !== 'cat_manager') return false;

      var st = window.catMgrApp.state;
      st.user = ud;
      st.cat = ud.assignedCategory;
      if(!st.cat){ alert('⚠️ لم يُعيَّن قسم'); return false; }
      st.initialized = true;

      var app = document.getElementById('cat-mgr-app');
      if(app) app.style.display = 'block';
      var cn = document.getElementById('cm-cat-name');
      if(cn) cn.textContent = ud.assignedCategory;

      try { await window.catMgrApp.loadProducts(); } catch(e){ console.warn(e); }
      try { window.catMgrApp.subscribeOrders(); } catch(e){ console.warn(e); }

      var tabs = document.querySelector('.cm-tabs');
      if(tabs && !tabs.querySelector('[data-cm-tab="home"]')){
        var hb = document.createElement('button');
        hb.setAttribute('data-cm-tab','home');
        hb.textContent = '🏠 الرئيسية';
        hb.onclick = function(){ window.catMgrApp.switchTab('home'); };
        tabs.insertBefore(hb, tabs.firstChild);
      }

      setTimeout(function(){
        try { window.catMgrApp.switchTab('home'); } catch(e){ console.warn(e); }
        setTimeout(function(){
          var content = document.getElementById('cm-content');
          if(!content) return;
          if(content.innerHTML.indexOf('أهلاً') === -1 && content.innerHTML.indexOf('إجراءات') === -1){
            content.innerHTML = fallbackHTML(ud.name);
            content.querySelectorAll('button[data-go]').forEach(function(b){
              b.onclick = function(){
                var go = b.getAttribute('data-go');
                if(go === 'add'){ window.__v97cOpenForm && window.__v97cOpenForm(); }
                else if(go === 'logout'){ window.catMgrApp.back(); }
                else { window.catMgrApp.switchTab(go); }
              };
            });
            console.log('[V97N] fallback rendered');
          } else {
            console.log('[V97N] home rendered by v97f');
          }
        }, 600);
      }, 300);

      return true;
    };

    console.log('[V97N] init replaced');
  }
  hook();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97n patched. size:', h.length);
