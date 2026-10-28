const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// حذف v246 القديم
h = h.replace(/<script id="v246-form">[\s\S]*?<\/script>/g, '');

const v249 = `
<script id="v249-form">
(function(){
  console.log('[V249] installing...');
  
  // CSS إذا لم يكن موجوداً
  if(!document.getElementById('v249-css')){
    var st = document.createElement('style');
    st.id = 'v249-css';
    st.textContent = '.v249-ov{position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;overflow-y:auto}.v249-m{width:100%;max-width:560px;background:linear-gradient(180deg,#1e1533,#0a0825);border-radius:24px 24px 0 0;max-height:92vh;overflow-y:auto;border:1px solid rgba(155,77,255,.3);border-bottom:none;color:#fff;font-family:inherit}.v249-h{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid rgba(155,77,255,.2);position:sticky;top:0;background:#1e1533;z-index:1}.v249-h h3{margin:0;font-size:17px;font-weight:800;color:#fff}.v249-x{background:rgba(155,77,255,.15);color:#a78bfa;border:1px solid rgba(155,77,255,.3);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:15px;font-family:inherit}.v249-b{padding:16px 20px}.v249-f{display:flex;gap:10px;padding:16px 20px;border-top:1px solid rgba(155,77,255,.2);position:sticky;bottom:0;background:#1e1533}.v249-f button{flex:1;padding:14px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;border:none}.v249-save{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}.v249-cancel{background:rgba(155,77,255,.15);color:#a78bfa;border:1px solid rgba(155,77,255,.3)!important}';
    document.head.appendChild(st);
  }
  
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  
  async function fetchList(docName){
    try {
      var db = firebase.firestore();
      var doc = await db.collection('config').doc(docName).get();
      if(!doc.exists) return [];
      var d = doc.data();
      var list = d.list || d.items || d[docName] || d;
      if(Array.isArray(list)){
        return list.map(function(item, i){
          if(typeof item === 'string') return {id:item, name:item};
          return {id:item.id || ('i'+i), name:item.name || String(item)};
        });
      }
      return Object.keys(list).map(function(k){
        var v = list[k];
        return {id:k, name:(typeof v==='string')?v:(v.name||k)};
      });
    } catch(e){ console.warn('[V249] fetch '+docName+':', e); return []; }
  }
  
  async function openForm(){
    console.log('[V249] openForm called');
    
    if(!window.catMgrApp || !window.catMgrApp.state || !window.catMgrApp.state.user){
      alert('⚠️ لم يتم التعرف على حسابك — أعد تحميل الصفحة');
      return;
    }
    
    var state = window.catMgrApp.state;
    var db = firebase.firestore();
    
    // 1. عرض المودال فوراً (بدون قوائم)
    var iS = 'width:100%;padding:12px 14px;box-sizing:border-box;background:rgba(10,8,37,.7);border:1px solid rgba(155,77,255,.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px';
    var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin:12px 0 6px';
    
    var html = ''
      + '<div class="v249-h"><h3>➕ منتج جديد</h3><button class="v249-x" type="button" id="v249-close">✕</button></div>'
      + '<div class="v249-b">'
      +   '<label style="'+lS+'">اسم المنتج *</label><input id="v249-name" type="text" placeholder="عطر شانيل N°5" style="'+iS+'">'
      +   '<label style="'+lS+'">الوصف</label><textarea id="v249-desc" rows="2" style="'+iS+'"></textarea>'
      +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +     '<div><label style="'+lS+'">الماركة *</label><select id="v249-brand" style="'+iS+'"><option value="">⏳ تحميل...</option></select></div>'
      +     '<div><label style="'+lS+'">المورد *</label><select id="v249-supplier" style="'+iS+'"><option value="">⏳ تحميل...</option></select></div>'
      +   '</div>'
      +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +     '<div><label style="'+lS+'">سعر الجملة *</label><input id="v249-cost" type="number" min="0" style="'+iS+'"></div>'
      +     '<div><label style="'+lS+'">سعر البيع *</label><input id="v249-price" type="number" min="0" style="'+iS+'"></div>'
      +   '</div>'
      +   '<label style="'+lS+'">المخزون</label><input id="v249-stock" type="number" min="0" value="0" style="'+iS+'">'
      +   '<label style="'+lS+'">الصور (حد أقصى 5)</label>'
      +   '<div id="v249-imgs" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:8px"></div>'
      +   '<input type="file" id="v249-file" accept="image/*" multiple style="display:none">'
      +   '<button type="button" id="v249-upload" style="width:100%;padding:12px;background:rgba(155,77,255,.15);border:1px dashed rgba(155,77,255,.5);border-radius:12px;color:#a78bfa;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">📷 رفع صور</button>'
      +   '<div id="v249-prog" style="display:none;height:26px;background:rgba(10,8,37,.7);border-radius:8px;overflow:hidden;margin-bottom:10px;border:1px solid rgba(155,77,255,.3);position:relative"><div id="v249-bar" style="height:100%;background:linear-gradient(90deg,#7c3aed,#ec4899);width:0%"></div><span id="v249-pct" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:700;color:#fff">0%</span></div>'
      + '</div>'
      + '<div class="v249-f"><button class="v249-cancel" id="v249-cancel">إلغاء</button><button class="v249-save" id="v249-save">💾 إرسال للمراجعة</button></div>';
    
    var overlay = document.createElement('div');
    overlay.className = 'v249-ov';
    overlay.innerHTML = '<div class="v249-m">' + html + '</div>';
    document.body.appendChild(overlay);
    
    function $(id){ return overlay.querySelector('#'+id); }
    var imgs = [], uploading = false;
    
    $('v249-close').onclick = $('v249-cancel').onclick = function(){ overlay.remove(); };
    
    // 2. تحميل القوائم غير المتزامن (لا يعطل النموذج)
    fetchList('brands').then(function(brands){
      var sel = $('v249-brand');
      if(!sel) return;
      sel.innerHTML = '<option value="">— اختر —</option>' + brands.map(function(b){
        return '<option value="'+esc(b.id)+'" data-name="'+esc(b.name)+'">'+esc(b.name)+'</option>';
      }).join('');
    });
    fetchList('suppliers').then(function(suppliers){
      var sel = $('v249-supplier');
      if(!sel) return;
      sel.innerHTML = '<option value="">— اختر —</option>' + suppliers.map(function(s){
        return '<option value="'+esc(s.id)+'" data-name="'+esc(s.name)+'">'+esc(s.name)+'</option>';
      }).join('');
    });
    
    function renderImgs(){
      $('v249-imgs').innerHTML = imgs.map(function(url, i){
        return '<div style="position:relative;aspect-ratio:1;background:#111;border:1px solid rgba(155,77,255,.3);border-radius:10px;overflow:hidden"><img src="'+esc(url)+'" style="width:100%;height:100%;object-fit:cover"><button type="button" data-i="'+i+'" style="position:absolute;top:2px;right:2px;background:rgba(239,68,68,.9);color:#fff;border:none;width:22px;height:22px;border-radius:50%;font-size:12px;cursor:pointer;line-height:1">×</button></div>';
      }).join('');
      overlay.querySelectorAll('#v249-imgs button[data-i]').forEach(function(b){
        b.onclick = function(){ imgs.splice(parseInt(this.getAttribute('data-i'),10),1); renderImgs(); };
      });
    }
    
    $('v249-upload').onclick = function(){ $('v249-file').click(); };
    $('v249-file').onchange = async function(e){
      var files = Array.prototype.slice.call(e.target.files);
      if(!files.length) return;
      var rem = 5 - imgs.length;
      if(rem <= 0){ alert('حد أقصى 5'); return; }
      if(files.length > rem) files = files.slice(0, rem);
      if(typeof window.__v102c_uploadBatch !== 'function'){ alert('رافع الصور غير جاهز'); return; }
      uploading = true;
      $('v249-prog').style.display = 'block';
      try {
        await window.__v102c_uploadBatch(files, state.cat, {
          onProgress: function(p){ $('v249-bar').style.width = p+'%'; $('v249-pct').textContent = p+'%'; },
          onUrl: function(url){ imgs.push(url); renderImgs(); },
          onError: function(err){ alert('فشل: '+(err.message||'')); }
        });
      } catch(err){ alert('فشل الرفع: '+(err.message||'')); }
      $('v249-prog').style.display = 'none';
      uploading = false;
      e.target.value = '';
    };
    
    $('v249-save').onclick = async function(){
      if(uploading){ alert('انتظر رفع الصور'); return; }
      var name = $('v249-name').value.trim();
      var brandSel = $('v249-brand');
      var supSel = $('v249-supplier');
      var brandId = brandSel.value;
      var supplierId = supSel.value;
      var brandName = brandId ? brandSel.options[brandSel.selectedIndex].getAttribute('data-name') : '';
      var supplierName = supplierId ? supSel.options[supSel.selectedIndex].getAttribute('data-name') : '';
      var costPrice = Number($('v249-cost').value) || 0;
      var price = Number($('v249-price').value) || 0;
      var stock = Number($('v249-stock').value) || 0;
      var desc = $('v249-desc').value.trim();
      
      if(!name){ alert('الاسم مطلوب'); return; }
      if(!brandId){ alert('اختر الماركة'); return; }
      if(!supplierId){ alert('اختر المورد'); return; }
      if(costPrice <= 0){ alert('سعر الجملة مطلوب'); return; }
      if(price <= 0){ alert('سعر البيع مطلوب'); return; }
      if(imgs.length === 0){ alert('صورة واحدة على الأقل'); return; }
      
      var btn = this; btn.disabled = true; btn.textContent = '⏳...';
      
      try {
        await db.collection('products').add({
          name: name, desc: desc,
          brand: brandName, brandId: brandId,
          supplier: supplierName, supplierName: supplierName, supplierId: supplierId,
          costPrice: costPrice, price: price, stock: stock,
          img: imgs[0], imgs: imgs.slice(),
          category: state.cat,
          status: 'pending_review', active: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: state.user.uid, createdByName: state.user.name || '',
          submittedBy: { uid: state.user.uid, name: state.user.name || '', at: firebase.firestore.FieldValue.serverTimestamp() }
        });
        overlay.remove();
        if(window.__chizenToast) window.__chizenToast('تم الإرسال للمراجعة', 'success', 'سيظهر بعد اعتماد السوبر أدمن');
        else alert('✅ تم الإرسال للمراجعة');
        
        // إشعار للسوبر أدمن
        try {
          var admins = await db.collection('users').where('role','==','super_admin').get();
          admins.forEach(function(a){
            db.collection('notifications').add({
              userId: a.id, title: '📦 منتج جديد بانتظار المراجعة',
              body: name + ' — ' + state.cat, type: 'product', icon: '📦',
              read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function(){});
          });
        } catch(e){}
      } catch(err){
        console.error('[V249] save:', err);
        btn.disabled = false; btn.textContent = '💾 إرسال للمراجعة';
        alert('فشل: '+(err.message||err.code||''));
      }
    };
    
    console.log('[V249] Form opened for category:', state.cat);
  }
  
  // معرّض عالمي
  window.__v102cOpenForm = openForm;
  window.__v102OpenForm = openForm;
  
  // اعتراض النقر (capture)
  document.addEventListener('click', function(e){
    if(!e.target || !e.target.closest) return;
    var btn = e.target.closest('.v100-act[data-go="add"], .v101-add-btn');
    if(btn){
      e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
      try { openForm(); } catch(err){ console.error('[V249] click:', err); alert('خطأ: '+err.message); }
    }
  }, true);
  
  console.log('[V249] ready');
})();
</script>
`;

h = h.replace('</body>', v249 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v249: form يعمل فوراً بدون انتظار قوائم');
