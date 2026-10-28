const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

if (h.includes('function showSupplierManager()')) { console.log('already applied'); process.exit(0); }

// استبدال handler
const oldHandler = "if (tool === 'suppliers') return showConfigEditor('suppliers', 'الموردين');";
if (!h.includes(oldHandler)) { console.log('❌ handler not found'); process.exit(1); }
h = h.replace(oldHandler, "if (tool === 'suppliers') return showSupplierManager();");

const code = `
// ═══ v279: Supplier Management (per-category) ═══

const SUPPLIER_CATS = [
  {key:'electronics', name:'إلكترونيات والهواتف', icon:'📱'},
  {key:'fashion',     name:'الأزياء والموضة',     icon:'👗'},
  {key:'clothing',    name:'الملابس والإكسسوارات', icon:'👕'},
  {key:'shoes_bags',  name:'أحذية والشنط',        icon:'👟'},
  {key:'beauty',      name:'جمال وعطور',          icon:'💄'},
  {key:'kids_sports', name:'أطفال ورياضية',       icon:'⚽'},
  {key:'home',        name:'منزل وأثاث',          icon:'🛋️'},
  {key:'supermarket', name:'السوبر ماركت',        icon:'🛒'}
];

async function __loadSuppliers(){
  var doc = await db.collection('config').doc('suppliers').get();
  if (!doc.exists) return [];
  var d = doc.data();
  return d.list || [];
}

async function __saveSuppliers(list){
  await db.collection('config').doc('suppliers').set({list: list, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}, {merge: true});
}

window.__v279State = { suppliers: [] };

async function showSupplierManager(){
  window.__v279State.suppliers = await __loadSuppliers();
  var list = window.__v279State.suppliers;
  
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:10px">'
    + '<div style="font-size:14px;font-weight:900;color:#fff">🏭 الموردين (' + list.length + ')</div>'
    + '<button data-sadd="1" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none;padding:10px 16px;border-radius:12px;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer">➕ إضافة مورد</button>'
    + '</div>';
  
  SUPPLIER_CATS.forEach(function(cat){
    var inCat = list.filter(function(s){
      var cats = Array.isArray(s.categories) ? s.categories : [];
      return cats.indexOf(cat.key) !== -1;
    });
    
    html += '<div style="margin-bottom:14px">'
      +   '<div style="font-size:12px;font-weight:800;color:#a78bfa;margin-bottom:6px">' + cat.icon + ' ' + cat.name + ' (' + inCat.length + ')</div>';
    
    if (inCat.length === 0) {
      html += '<div style="padding:10px;background:rgba(155,77,255,0.05);border-radius:8px;font-size:11px;color:#a78bfa;text-align:center;opacity:0.6">لا يوجد موردون</div>';
    } else {
      inCat.forEach(function(s){
        var idx = list.indexOf(s);
        html += '<div style="background:linear-gradient(135deg,#1a1230,#121028);border:1px solid rgba(155,77,255,0.2);border-radius:12px;padding:12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:8px">'
          +   '<div style="flex:1;min-width:0">'
          +     '<div style="font-size:13px;font-weight:800;color:#fff">' + esc(s.name||'—') + '</div>'
          +     '<div style="font-size:11px;color:#a78bfa">📞 ' + esc(s.phone||'—') + ' · ' + (Array.isArray(s.products) ? s.products.length : 0) + ' منتج</div>'
          +   '</div>'
          +   '<div style="display:flex;gap:4px;flex-shrink:0">'
          +     '<button data-sedit="' + idx + '" style="background:rgba(155,77,255,0.15);border:1px solid rgba(155,77,255,0.3);color:#a78bfa;padding:6px 9px;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer">✏️</button>'
          +     '<button data-sdel="' + idx + '" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:6px 9px;border-radius:8px;font-family:inherit;font-size:12px;cursor:pointer">🗑️</button>'
          +   '</div>'
          + '</div>';
      });
    }
    html += '</div>';
  });
  
  showModal('🏭 إدارة الموردين', html);
  
  document.querySelectorAll('[data-sadd]').forEach(function(b){
    b.onclick = function(e){ e.stopPropagation(); showSupplierForm(null); };
  });
  document.querySelectorAll('[data-sedit]').forEach(function(b){
    b.onclick = function(e){ e.stopPropagation(); showSupplierForm(window.__v279State.suppliers[parseInt(this.dataset.sedit,10)]); };
  });
  document.querySelectorAll('[data-sdel]').forEach(function(b){
    b.onclick = function(e){ e.stopPropagation(); deleteSupplier(parseInt(this.dataset.sdel,10)); };
  });
}

async function deleteSupplier(idx){
  var s = window.__v279State.suppliers[idx];
  if (!s) return;
  var prodCount = Array.isArray(s.products) ? s.products.length : 0;
  var msg = 'حذف مورد "' + (s.name||'—') + '"؟';
  if (prodCount > 0) msg += '\\n\\n⚠️ له ' + prodCount + ' منتج مرتبط';
  if (!confirm(msg)) return;
  var list = window.__v279State.suppliers.slice();
  list.splice(idx, 1);
  try {
    await __saveSuppliers(list);
    toast('✅ تم الحذف', 'success');
    var cb = document.querySelector('#modal-close'); if(cb) cb.click();
    setTimeout(showSupplierManager, 200);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

function showSupplierForm(existing){
  var isEdit = !!existing;
  var s = existing || {id:'sup_' + Date.now(), name:'', phone:'', categories:[], products:[], paymentType:'cash', creditDays:30, notes:'', balance:0, history:[]};
  var cb = document.querySelector('#modal-close'); if(cb) cb.click();
  
  var iS = 'width:100%;padding:12px 14px;background:rgba(10,8,37,0.7);border:1px solid rgba(155,77,255,0.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box';
  var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:6px';
  
  var catCheckboxes = SUPPLIER_CATS.map(function(c){
    var checked = Array.isArray(s.categories) && s.categories.indexOf(c.key) !== -1;
    return '<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(155,77,255,' + (checked?'0.15':'0.05') + ');border:1px solid rgba(155,77,255,' + (checked?'0.4':'0.15') + ');border-radius:10px;cursor:pointer;margin-bottom:6px" data-sform-cat="' + c.key + '">'
      + '<input type="checkbox" ' + (checked?'checked':'') + ' data-cat="' + c.key + '" style="width:18px;height:18px;accent-color:#7c3aed;cursor:pointer">'
      + '<span style="color:#fff;font-weight:700;font-size:12px">' + c.icon + ' ' + c.name + '</span>'
      + '</label>';
  }).join('');
  
  var html = '<div style="padding:4px 0">'
    + '<label style="' + lS + '">اسم المورد *</label>'
    + '<input id="sf-name" type="text" value="' + esc(s.name||'') + '" placeholder="اسم المورد" style="' + iS + '">'
    + '<label style="' + lS + '">الهاتف</label>'
    + '<input id="sf-phone" type="tel" value="' + esc(s.phone||'') + '" placeholder="77xxxxxxx" style="' + iS + '">'
    + '<label style="' + lS + '">الأقسام (اختر واحد أو أكثر) *</label>'
    + '<div id="sf-cats">' + catCheckboxes + '</div>'
    + '<label style="' + lS + '">طريقة الدفع</label>'
    + '<select id="sf-payment" style="' + iS + '">'
    +   '<option value="cash" ' + (s.paymentType==='cash'?'selected':'') + '>نقداً</option>'
    +   '<option value="credit" ' + (s.paymentType==='credit'?'selected':'') + '>آجل</option>'
    + '</select>'
    + '<label style="' + lS + '">ملاحظات</label>'
    + '<input id="sf-notes" type="text" value="' + esc(s.notes||'') + '" placeholder="ملاحظات..." style="' + iS + '">'
    + '<button id="sf-save" style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:14px;border-radius:12px;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer;border:none;margin-top:8px">💾 ' + (isEdit?'حفظ':'إضافة') + '</button>'
    + '</div>';
  
  showModal(isEdit ? '✏️ تعديل مورد' : '➕ إضافة مورد', html);
  
  // Update checkbox background on change
  document.querySelectorAll('[data-sform-cat] input').forEach(function(inp){
    inp.onchange = function(){
      var label = this.closest('[data-sform-cat]');
      if (this.checked) {
        label.style.background = 'rgba(155,77,255,0.15)';
        label.style.borderColor = 'rgba(155,77,255,0.4)';
      } else {
        label.style.background = 'rgba(155,77,255,0.05)';
        label.style.borderColor = 'rgba(155,77,255,0.15)';
      }
    };
  });
  
  document.getElementById('sf-save').onclick = async function(){
    var name = document.getElementById('sf-name').value.trim();
    var phone = document.getElementById('sf-phone').value.trim();
    var notes = document.getElementById('sf-notes').value.trim();
    var paymentType = document.getElementById('sf-payment').value;
    var cats = [];
    document.querySelectorAll('[data-sform-cat] input:checked').forEach(function(inp){
      cats.push(inp.dataset.cat);
    });
    if (!name) { toast('⚠️ الاسم مطلوب', 'error'); return; }
    if (cats.length === 0) { toast('⚠️ اختر قسماً واحداً على الأقل', 'error'); return; }
    
    var btn = this; btn.disabled = true; btn.textContent = '⏳...';
    
    try {
      var list = window.__v279State.suppliers.slice();
      var newS = Object.assign({}, s, {name:name, phone:phone, notes:notes, categories:cats, paymentType:paymentType});
      if (isEdit) {
        var idx = list.findIndex(function(x){ return x.id === s.id; });
        if (idx >= 0) list[idx] = newS; else list.push(newS);
      } else {
        list.push(newS);
      }
      await __saveSuppliers(list);
      toast('✅ تم الحفظ', 'success');
      var cb2 = document.querySelector('#modal-close'); if(cb2) cb2.click();
      setTimeout(showSupplierManager, 200);
    } catch(e){
      btn.disabled = false; btn.textContent = '💾 حفظ';
      toast('❌ ' + e.message, 'error');
    }
  };
}

`;

const lastEnd = h.lastIndexOf('</script>');
if (lastEnd === -1) { console.log('❌ no script tag'); process.exit(1); }
h = h.slice(0, lastEnd) + code + h.slice(lastEnd);

fs.writeFileSync('dashboard.html', h);
console.log('✅ v279b: supplier manager |', before, '->', h.length);
