const fs = require('fs');
let h = fs.readFileSync('accountant.html', 'utf8');
const before = h.length;

if (h.includes('/* v291-fixed */')) { console.log('already applied'); process.exit(0); }

// ═══ استبدال دالة showTransactionForm ═══
const oldFnStart = 'window.showTransactionForm = async function(){';
const oldFnEnd = 'window.saveTransaction = async function(){';
const sIdx = h.indexOf(oldFnStart);
const eIdx = h.indexOf(oldFnEnd);

if (sIdx === -1 || eIdx === -1) { console.log('❌ markers not found'); process.exit(1); }

const newFn = `/* v291-fixed */
var ROLE_LABELS = {
  super_admin:   { icon: '👑', label: 'الإدارة العامة' },
  cat_manager:   { icon: '🏷️', label: 'مدراء الأقسام' },
  delivery_mgr:  { icon: '🚚', label: 'التوصيل' },
  accountant:    { icon: '💼', label: 'المحاسبة' },
  bookings_mgr:  { icon: '📅', label: 'الحجوزات' }
};
var ROLE_ORDER = ['super_admin', 'cat_manager', 'delivery_mgr', 'accountant', 'bookings_mgr'];

window.showTransactionForm = async function(){
  // 🎯 جميع الموظفين فقط (بدون العملاء)
  var employees = state.users.filter(function(u){
    return u.role && u.role !== 'customer';
  });
  
  if (employees.length === 0) {
    toast('⚠️ لا يوجد موظفون مسجلون', 'error');
    return;
  }
  
  // تجميع حسب الدور
  var grouped = {};
  ROLE_ORDER.forEach(function(r){ grouped[r] = []; });
  employees.forEach(function(u){
    var r = u.role || 'unknown';
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(u);
  });
  
  // بناء <optgroup>
  var optHtml = '';
  ROLE_ORDER.forEach(function(r){
    var list = grouped[r];
    if (!list || !list.length) return;
    var meta = ROLE_LABELS[r] || { icon: '👤', label: r };
    optHtml += '<optgroup label="' + meta.icon + ' ' + meta.label + ' (' + list.length + ')">';
    list.sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); });
    list.forEach(function(u){
      var display = (u.name || u.email || '—');
      var cat = u.assignedCategory ? ' — ' + u.assignedCategory : '';
      optHtml += '<option value="' + u.id + '">' + esc(display) + cat + '</option>';
    });
    optHtml += '</optgroup>';
  });
  
  // إجمالي
  var totalEmps = employees.length;
  
  var html = '<div>'
    + '<div style="padding:10px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;margin-bottom:12px;font-size:11px;color:#b8c0d8;text-align:center">'
    +   '👥 <b style="color:#f59e0b">' + totalEmps + ' موظف</b> متاح — يشمل جميع الأدوار (مدراء، توصيل، محاسبة، حجوزات)'
    + '</div>'
    + '<label class="acc-form-lbl">النوع *</label>'
    + '<select id="tx-type" class="acc-form-in">'
    +   '<option value="advance">📤 تقدمة / سلفة</option>'
    +   '<option value="deduction">➖ خصم</option>'
    +   '<option value="paid">✅ دفعة / راتب</option>'
    +   '<option value="expense">💸 مصروف عام</option>'
    +   '<option value="income">💰 إيراد إضافي</option>'
    + '</select>'
    + '<label class="acc-form-lbl">الموظف *</label>'
    + '<input type="text" id="tx-user-search" class="acc-form-in" placeholder="🔍 ابحث بالاسم..." style="margin-bottom:6px">'
    + '<select id="tx-user" class="acc-form-in" style="max-height:200px">'
    +   '<option value="">— اختر موظفاً —</option>'
    +   optHtml
    + '</select>'
    + '<label class="acc-form-lbl">المبلغ (ر.ي) *</label>'
    + '<input id="tx-amount" type="number" min="1" class="acc-form-in" placeholder="0">'
    + '<label class="acc-form-lbl">السبب / الملاحظات</label>'
    + '<textarea id="tx-reason" rows="2" class="acc-form-in" placeholder="مثال: سلفة نصف الشهر..."></textarea>'
    + '</div>';
  
  var footer = '<button class="acc-btn-sec" onclick="closeModal()" style="flex:1">إلغاء</button>'
    + '<button class="acc-btn" onclick="saveTransaction()" style="flex:2">💾 حفظ</button>';
  
  showModal('➕ معاملة جديدة', html, footer);
  
  // ربط البحث بالفلترة
  setTimeout(function(){
    var searchInput = document.getElementById('tx-user-search');
    var selectEl = document.getElementById('tx-user');
    if (!searchInput || !selectEl) return;
    
    searchInput.addEventListener('input', function(){
      var q = this.value.toLowerCase().trim();
      var groups = selectEl.querySelectorAll('optgroup');
      groups.forEach(function(og){
        var visible = 0;
        og.querySelectorAll('option').forEach(function(opt){
          var txt = opt.textContent.toLowerCase();
          var match = !q || txt.indexOf(q) !== -1;
          opt.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        og.style.display = visible > 0 ? '' : 'none';
      });
    });
  }, 100);
};

`;

h = h.slice(0, sIdx) + newFn + h.slice(eIdx);

fs.writeFileSync('accountant.html', h);
console.log('✅ v291: employees grouped by role + search |', before, '->', h.length);
