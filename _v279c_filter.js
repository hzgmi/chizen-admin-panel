const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// ابحث عن كتلة fetchList('suppliers') في v254's openForm
const old = `fetchList('suppliers').then(function(list){
      suppliers = list;
      var sel = $('v254-supplier'); if(!sel) return;
      var curId = extractId(p.supplierId) || extractId(p.supplier);
      sel.innerHTML = '<option value="">— اختر —</option>' + list.map(function(s){
        return '<option value="'+esc(s.id)+'" data-name="'+esc(s.name)+'" '+(curId===s.id?'selected':'')+'>'+esc(s.name)+'</option>';
      }).join('');
      console.log('[V254] suppliers loaded:', list.length);
    });`;

const filtered = `fetchList('suppliers').then(function(list){
      // 🎯 v279: تصفية الموردين حسب قسم مدير القسم
      var myCat = state.cat;
      var filtered = list.filter(function(s){
        var cats = Array.isArray(s.categories) ? s.categories : [];
        return cats.indexOf(myCat) !== -1;
      });
      suppliers = filtered;
      var sel = $('v254-supplier'); if(!sel) return;
      var curId = extractId(p.supplierId) || extractId(p.supplier);
      if (filtered.length === 0) {
        sel.innerHTML = '<option value="">⚠️ لا يوجد موردون لقسمك — أضف مورداً من الإدارة</option>';
        console.log('[V279] no suppliers for category:', myCat);
        return;
      }
      sel.innerHTML = '<option value="">— اختر —</option>' + filtered.map(function(s){
        return '<option value="'+esc(s.id)+'" data-name="'+esc(s.name)+'" '+(curId===s.id?'selected':'')+'>'+esc(s.name)+' (' + (Array.isArray(s.categories)?s.categories.length:0) + ' قسم)</option>';
      }).join('');
      console.log('[V279] suppliers filtered for ' + myCat + ':', filtered.length, 'of', list.length);
    });`;

if (!h.includes(old)) {
  console.log('❌ v254 suppliers block not found — maybe different structure');
  // محاولة البحث بمرونة أكثر
  const flexible = /fetchList\('suppliers'\)\.then\(function\(list\)\{[\s\S]*?\}\);/;
  const match = h.match(flexible);
  if (match) {
    console.log('Found similar block of length:', match[0].length);
    console.log('First 100 chars:', match[0].slice(0, 100));
  }
  process.exit(1);
}

h = h.replace(old, filtered);
fs.writeFileSync('index.html', h);
console.log('✅ v279c: supplier filter in product form |', before, '->', h.length);
