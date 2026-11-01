const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const MARKER = '<!-- V97C_PRODUCTS -->';
if (h.includes(MARKER)) { console.log('already'); process.exit(0); }
if (!h.includes('</body>')) { console.error('no </body>'); process.exit(1); }

const inject = MARKER + `
<style id="v97c-css">
.v97c-actions{margin:14px 0;display:flex;gap:8px}
.v97c-btn{flex:1;padding:12px;border:none;border-radius:11px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
.v97c-btn-add{background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff}
.v97c-product-actions{display:flex;gap:6px;margin-top:8px;width:100%}
.v97c-product-actions button{flex:1;padding:8px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
.v97c-edit{background:#3b82f6;color:#fff}
.v97c-del{background:#ef4444;color:#fff}
#v97c-form{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:100001;display:none;overflow-y:auto;padding:14px;direction:rtl}
#v97c-form.open{display:block}
#v97c-form-inner{background:linear-gradient(180deg,#151b3a,#0a0825);border:1px solid rgba(168,85,247,0.3);border-radius:16px;padding:16px;max-width:520px;margin:0 auto;color:#fff}
#v97c-form h3{margin:0 0 16px;color:#a855f7;font-size:16px}
.v97c-field{margin-bottom:12px}
.v97c-field label{display:block;font-size:12px;font-weight:700;color:#a855f7;margin-bottom:6px}
.v97c-field input,.v97c-field select,.v97c-field textarea{width:100%;padding:11px;border-radius:10px;border:1.5px solid rgba(168,85,247,0.3);background:#0a0825;color:#fff;font-family:inherit;font-size:13px;box-sizing:border-box}
.v97c-field textarea{min-height:70px;resize:vertical}
.v97c-form-actions{display:flex;gap:8px;margin-top:16px}
.v97c-form-actions button{flex:1;padding:13px;border:none;border-radius:11px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
.v97c-save{background:#22c55e;color:#fff}
.v97c-cancel{background:#6b7280;color:#fff}
</style>
<div id="v97c-form"><div id="v97c-form-inner"></div></div>
<script id="chz-catmgr-products-v97c">
(function(){
  'use strict';
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 100) return;
    if(!window.catMgrApp || !window.catMgrApp.state) return setTimeout(hook, 100);
    if(window.__v97cReady) return;
    window.__v97cReady = true;
    console.log('[V97C] loading...');

    var db = firebase.firestore();
    var brands = [], suppliers = [];
    var lookupsLoaded = false;

    async function loadLookups(){
      if(lookupsLoaded) return;
      try {
        var bDoc = await db.collection('config').doc('brands').get();
        var sDoc = await db.collection('config').doc('suppliers').get();
        if(bDoc.exists) brands = (bDoc.data().list || []).filter(function(b){ return b.active !== false; });
        if(sDoc.exists) suppliers = (sDoc.data().list || []);
        lookupsLoaded = true;
      } catch(e){ console.warn('[V97C] lookups:', e); }
    }

    function esc(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    function $id(i){ return document.getElementById(i); }
    function toast(m){
      var t = document.createElement('div');
      t.textContent = m;
      t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:12px 22px;border-radius:30px;z-index:100005;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.3)';
      document.body.appendChild(t);
      setTimeout(function(){ t.remove(); }, 2600);
    }

    var origSwitch = window.catMgrApp.switchTab;
    window.catMgrApp.switchTab = function(t){
      origSwitch.call(window.catMgrApp, t);
      if(t === 'products') setTimeout(enhance, 60);
    };

    async function enhance(){
      await loadLookups();
      var content = $id('cm-content');
      if(!content) return;
      content.querySelectorAll('.v97c-actions, .v97c-product-actions').forEach(function(el){ el.remove(); });

      var addBtn = document.createElement('div');
      addBtn.className = 'v97c-actions';
      var b = document.createElement('button');
      b.className = 'v97c-btn v97c-btn-add';
      b.textContent = '➕ إضافة منتج جديد';
      b.addEventListener('click', function(){ window.__v97cOpenForm(); });
      addBtn.appendChild(b);
      content.insertBefore(addBtn, content.firstChild);

      var cards = content.querySelectorAll('.cm-product');
      cards.forEach(function(card, idx){
        var prod = window.catMgrApp.state.products[idx];
        if(!prod) return;
        card.style.flexDirection = 'column';
        card.style.alignItems = 'stretch';
        var actions = document.createElement('div');
        actions.className = 'v97c-product-actions';
        var eBtn = document.createElement('button');
        eBtn.className = 'v97c-edit';
        eBtn.textContent = '✏️ تعديل';
        eBtn.addEventListener('click', function(){ window.__v97cOpenForm(prod.id); });
        var dBtn = document.createElement('button');
        dBtn.className = 'v97c-del';
        dBtn.textContent = '🗑️ حذف';
        dBtn.addEventListener('click', function(){ window.__v97cDelete(prod.id, prod.name); });
        actions.appendChild(eBtn);
        actions.appendChild(dBtn);
        card.appendChild(actions);
      });
    }

    window.__v97cOpenForm = async function(productId){
      await loadLookups();
      var prod = null;
      if(productId){
        try {
          var snap = await db.collection('products').doc(productId).get();
          if(snap.exists) prod = Object.assign({id: snap.id}, snap.data());
        } catch(e){ console.warn(e); }
      }
      prod = prod || { name:'', brand:'', price:'', costPrice:'', stock:'', img:'', desc:'', supplierId:'', active:true };
      var cat = window.catMgrApp.state.cat;

      var brandOpts = '<option value="">— اختر ماركة —</option>';
      brands.forEach(function(b){
        var n = b.nameAr || b.nameEn || b.name || '';
        brandOpts += '<option value="' + esc(n) + '"' + (prod.brand === n ? ' selected' : '') + '>' + esc(n) + '</option>';
      });

      var supOpts = '<option value="">— اختر مورد —</option>';
      suppliers.filter(function(s){ return !s.categories || s.categories.indexOf(cat) !== -1; }).forEach(function(s){
        supOpts += '<option value="' + esc(s.id) + '"' + (prod.supplierId === s.id ? ' selected' : '') + '>' + esc(s.name) + (s.phone ? ' (' + esc(s.phone) + ')' : '') + '</option>';
      });

      var inner = $id('v97c-form-inner');
      inner.innerHTML =
        '<h3>' + (productId ? '✏️ تعديل: ' + esc(prod.name) : '➕ منتج جديد — ' + esc(cat)) + '</h3>' +
        '<div class="v97c-field"><label>اسم المنتج *</label><input id="v97c-name" value="' + esc(prod.name) + '"></div>' +
        '<div class="v97c-field"><label>الماركة</label><select id="v97c-brand">' + brandOpts + '</select></div>' +
        '<div class="v97c-field"><label>المورد</label><select id="v97c-supplier">' + supOpts + '</select></div>' +
        '<div class="v97c-field"><label>سعر البيع للعميل (ر.س) *</label><input id="v97c-price" type="number" value="' + esc(prod.price) + '"></div>' +
        '<div class="v97c-field"><label>سعر الجملة (ر.س) 🔒 للمحاسب فقط</label><input id="v97c-cost" type="number" value="' + esc(prod.costPrice) + '"></div>' +
        '<div class="v97c-field"><label>المخزون</label><input id="v97c-stock" type="number" value="' + esc(prod.stock) + '"></div>' +
        '<div class="v97c-field"><label>رابط صورة (URL)</label><input id="v97c-img" value="' + esc(prod.img) + '"></div>' +
        '<div class="v97c-field"><label>الوصف</label><textarea id="v97c-desc">' + esc(prod.desc) + '</textarea></div>' +
        '<div class="v97c-form-actions"><button class="v97c-cancel">إلغاء</button><button class="v97c-save">💾 حفظ</button></div>';

      inner.querySelector('.v97c-cancel').addEventListener('click', window.__v97cCloseForm);
      inner.querySelector('.v97c-save').addEventListener('click', function(){ window.__v97cSave(productId || ''); });
      $id('v97c-form').classList.add('open');
    };

    window.__v97cCloseForm = function(){ $id('v97c-form').classList.remove('open'); };

    window.__v97cSave = async function(productId){
      var name = ($id('v97c-name').value || '').trim();
      var brand = $id('v97c-brand').value;
      var supplierId = $id('v97c-supplier').value;
      var price = parseFloat($id('v97c-price').value) || 0;
      var costPrice = parseFloat($id('v97c-cost').value) || 0;
      var stock = parseInt($id('v97c-stock').value) || 0;
      var img = $id('v97c-img').value.trim();
      var desc = $id('v97c-desc').value.trim();

      if(!name){ toast('⚠️ اسم المنتج مطلوب'); return; }
      if(!price || price <= 0){ toast('⚠️ سعر البيع مطلوب'); return; }
      if(costPrice > price){
        if(!confirm('⚠️ سعر الجملة (' + costPrice + ') أعلى من البيع (' + price + ')! متابعة؟')) return;
      }

      var user = window.catMgrApp.state.user;
      var cat = window.catMgrApp.state.cat;
      var supplierName = '';
      if(supplierId){
        var s = suppliers.find(function(x){ return x.id === supplierId; });
        if(s) supplierName = s.name;
      }

      var isEdit = !!productId;
      var id = productId || 'p_' + Date.now();
      var profit = price - costPrice;
      var profitMargin = price > 0 ? parseFloat(((profit / price) * 100).toFixed(1)) : 0;

      var doc = {
        name: name, brand: brand, category: cat,
        price: price, costPrice: costPrice,
        profit: profit, profitMargin: profitMargin,
        supplierId: supplierId, supplierName: supplierName,
        stock: stock, img: img, desc: desc, active: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: user.uid, updatedByName: user.name || ''
      };
      if(!isEdit){
        doc.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        doc.createdBy = user.uid;
        doc.createdByName = user.name || '';
      }

      try {
        await db.collection('products').doc(id).set(doc, {merge: true});
        toast('✅ ' + (isEdit ? 'تم تحديث المنتج' : 'تم إضافة المنتج'));

        try {
          var accSnap = await db.collection('users').where('role','==','accountant').get();
          var batch = db.batch();
          var title = (isEdit ? '✏️ تعديل منتج' : '🆕 منتج جديد') + ' — ' + (user.name || 'مدير قسم');
          var body = 'المنتج: ' + name + ' | ماركة: ' + (brand || '—') + ' | مورد: ' + (supplierName || '—') + ' | جملة: ' + costPrice + ' | بيع: ' + price + ' | مخزون: ' + stock;
          accSnap.forEach(function(d){
            var ref = db.collection('notifications').doc();
            batch.set(ref, {
              userId: d.id, title: title, body: body,
              type: 'product',
              event: isEdit ? 'product_updated' : 'product_created',
              icon: '📦', important: true,
              productId: id, productName: name, brand: brand,
              supplierId: supplierId, supplierName: supplierName,
              costPrice: costPrice, price: price, stock: stock,
              deepLink: 'product/' + id, read: false,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
        } catch(ne){ console.warn('[V97C] notify:', ne); }

        window.__v97cCloseForm();
        if(window.catMgrApp.state.activeTab === 'products'){
          var snap = await db.collection('products').where('category','==',cat).get();
          window.catMgrApp.state.products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
          $id('cm-kpi-products').textContent = window.catMgrApp.state.products.length;
          origSwitch.call(window.catMgrApp, 'products');
        }
      } catch(e){
        console.error('[V97C] save:', e);
        toast('❌ ' + (e.message || 'فشل الحفظ'));
      }
    };

    window.__v97cDelete = async function(productId, productName){
      if(!confirm('⚠️ حذف نهائي؟ ' + productName)) return;
      try {
        var snap = await db.collection('products').doc(productId).get();
        var oldData = snap.exists ? snap.data() : {};
        await db.collection('products').doc(productId).delete();
        toast('🗑️ تم الحذف');

        try {
          var accSnap = await db.collection('users').where('role','==','accountant').get();
          var batch = db.batch();
          var body = 'حذف: ' + productName + ' | ماركة: ' + (oldData.brand || '—') + ' | جملة سابقة: ' + (oldData.costPrice || 0) + ' | بيع سابق: ' + (oldData.price || 0);
          accSnap.forEach(function(d){
            var ref = db.collection('notifications').doc();
            batch.set(ref, {
              userId: d.id, title: '🗑️ حذف منتج', body: body,
              type: 'product', event: 'product_deleted', icon: '🗑️',
              important: true, productId: productId, productName: productName,
              deepLink: '', read: false,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
        } catch(ne){ console.warn('[V97C] notify-del:', ne); }

        var cat = window.catMgrApp.state.cat;
        var snap2 = await db.collection('products').where('category','==',cat).get();
        window.catMgrApp.state.products = snap2.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
        $id('cm-kpi-products').textContent = window.catMgrApp.state.products.length;
        origSwitch.call(window.catMgrApp, 'products');
      } catch(e){
        console.error('[V97C] delete:', e);
        toast('❌ ' + (e.message || 'فشل الحذف'));
      }
    };

    console.log('[V97C] ready');
  }
  hook();
})();
<\/script>
`;

const idx = h.lastIndexOf('</body>');
h = h.slice(0, idx) + inject + '\n' + h.slice(idx);
fs.writeFileSync(p, h);
console.log('✅ v97c patched. size:', h.length);
