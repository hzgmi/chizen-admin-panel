const fs = require('fs');
let h = fs.readFileSync('accountant.html', 'utf8');
const before = h.length;

if (h.includes('/* v293-clean */')) { console.log('already applied'); process.exit(0); }

// ═══ 1. Load SheetJS ═══
if (!h.includes('sheetjs')) {
  h = h.replace(
    'jspdf.umd.min.js"></script>',
    'jspdf.umd.min.js"></script>\n<script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>'
  );
  console.log('✅ 1: SheetJS loaded');
}

// ═══ 2. Add salary option ═══
const salSearch1 = String.raw`<option value="paid">✅ دفعة / راتب</option>`;
const salSearch2 = String.raw`<option value="paid">✅ دفعة</option>`;
if (h.includes(salSearch1)) {
  h = h.replace(salSearch1, String.raw`<option value="salary">💵 راتب شهري</option><option value="paid">✅ دفعة</option>`);
  console.log('✅ 2: salary (from /راتب)');
} else if (h.includes(salSearch2) && !h.includes('value="salary"')) {
  h = h.replace(salSearch2, String.raw`<option value="salary">💵 راتب شهري</option><option value="paid">✅ دفعة</option>`);
  console.log('✅ 2: salary added');
} else {
  console.log('⚠️ 2: salary - anchor not found (ok)');
}

// ═══ 3. Replace exportCSV ═══
function findFnEnd(str, startIdx) {
  let depth = 0, i = startIdx, inStr = null, inLine = false, inBlock = false;
  for(; i < str.length; i++) {
    const c = str[i], n = str[i+1];
    if(inLine){ if(c === '\n') inLine = false; continue; }
    if(inBlock){ if(c === '*' && n === '/'){ inBlock = false; i++; } continue; }
    if(inStr){
      if(c === '\\'){ i++; continue; }
      if(c === inStr) inStr = null;
      continue;
    }
    if(c === '/' && n === '/'){ inLine = true; i++; continue; }
    if(c === '/' && n === '*'){ inBlock = true; i++; continue; }
    if(c === '"' || c === "'" || c === '`'){ inStr = c; continue; }
    if(c === '{') depth++;
    else if(c === '}'){ depth--; if(depth === 0) return i + 1; }
  }
  return -1;
}

const expStart = h.indexOf('window.exportCSV = function(type){');
if (expStart === -1) throw new Error('exportCSV not found');
let expEnd = findFnEnd(h, expStart);
if (h[expEnd] === ';') expEnd++;

const newExport = `/* v293-clean */
window.exportCSV = function(type){
  if (!window.XLSX) { toast('مكتبة Excel لم تُحمّل','error'); return; }
  try {
    var wb = XLSX.utils.book_new();
    var ws;
    var filename = 'CHIZEN_' + type + '_' + new Date().toISOString().slice(0,10);
    var s = calcStats();
    var typeLabels = {advance:'تقدمة',deduction:'خصم',paid:'دفعة',expense:'مصروف',income:'إيراد',salary:'راتب'};
    
    if (type === 'orders') {
      var rows = [['رقم الطلب','العميل','الهاتف','المبلغ','الحالة','التاريخ','العنوان']];
      s.filtered.forEach(function(o){
        rows.push(['#' + o.id.slice(-6), o.customerName || '—', o.phone || '—', Number(o.total) || 0, o.status || '—', fmtDate(o.createdAt), o.address || o.pickup || '—']);
      });
      ws = XLSX.utils.aoa_to_sheet(rows);
    } else if (type === 'transactions') {
      var rows = [['النوع','الموظف','الدور','المبلغ','السبب','الحالة','التاريخ']];
      s.filteredTx.forEach(function(t){
        rows.push([typeLabels[t.type] || t.type || '—', t.userName || '—', t.userRole || '—', Number(t.amount) || 0, t.reason || '—', t.status === 'approved' ? 'معتمد' : (t.status === 'pending' ? 'معلق' : 'مرفوض'), fmtDate(t.createdAt)]);
      });
      ws = XLSX.utils.aoa_to_sheet(rows);
    } else if (type === 'suppliers') {
      var rows = [['الاسم','الهاتف','الأقسام','طريقة الدفع','الرصيد','عدد المنتجات']];
      state.suppliers.forEach(function(sup){
        rows.push([sup.name || '—', sup.phone || '—', (sup.categories||[]).join(' | '), sup.paymentType === 'cash' ? 'نقدي' : (sup.paymentType === 'credit' ? 'آجل' : sup.paymentType || '—'), Number(sup.balance) || 0, (sup.products||[]).length]);
      });
      ws = XLSX.utils.aoa_to_sheet(rows);
    } else if (type === 'financial_summary') {
      var rows = [
        ['ملخص مالي — ' + new Date().toLocaleDateString('ar-YE')],
        [],
        ['البند', 'المبلغ'],
        ['الإيرادات', Math.round(s.revenue)],
        ['تكلفة المنتجات', Math.round(s.cogs)],
        ['المصروفات', Math.round(s.expenses)],
        ['صافي الربح', Math.round(s.profit)],
        [],
        ['عدد الطلبات', s.filtered.length],
        ['المعلقة', s.pending]
      ];
      ws = XLSX.utils.aoa_to_sheet(rows);
    }
    
    XLSX.utils.book_append_sheet(wb, ws, type);
    XLSX.writeFile(wb, filename + '.xlsx');
    toast('✅ تم التصدير','success');
  } catch(e){ toast('❌ ' + e.message,'error'); }
};`;

h = h.slice(0, expStart) + newExport + h.slice(expEnd);
console.log('✅ 3: exportCSV replaced');

// ═══ 4. Add payment functions ═══
const logoutIdx = h.indexOf("document.getElementById('btn-logout').onclick");
if (logoutIdx === -1) throw new Error('logout anchor');

const newFuncs = `// ═══ v293 functions ═══

function showSupplierPaymentPicker(){
  var withBalance = state.suppliers.filter(function(s){ return Number(s.balance) > 0; });
  if (withBalance.length === 0) {
    if (state.suppliers.length === 0) { toast('لا يوجد موردون','error'); return; }
    if (!confirm('كل الموردين بدون رصيد. المتابعة على أي حال؟')) return;
    withBalance = state.suppliers;
  }
  var opts = withBalance.map(function(s){
    return '<option value="' + s.id + '">' + esc(s.name||'—') + ' — رصيد: ' + fmt(s.balance||0) + ' ر.ي</option>';
  }).join('');
  var html = '<div>'
    + '<label class="acc-form-lbl">المورد *</label>'
    + '<select id="sp-sup" class="acc-form-in">' + opts + '</select>'
    + '<label class="acc-form-lbl">المبلغ المدفوع (ر.ي) *</label>'
    + '<input id="sp-amt" type="number" min="1" class="acc-form-in" placeholder="0">'
    + '<label class="acc-form-lbl">ملاحظات</label>'
    + '<textarea id="sp-note" rows="2" class="acc-form-in" placeholder="رقم الحوالة..."></textarea>'
    + '</div>';
  var footer = '<button class="acc-btn-sec" onclick="closeModal()" style="flex:1">إلغاء</button><button class="acc-btn" onclick="saveSupplierPayment()" style="flex:2">💾 تسجيل</button>';
  showModal('💵 دفع لمورد', html, footer);
}

async function saveSupplierPayment(){
  var supId = document.getElementById('sp-sup').value;
  var amount = Number(document.getElementById('sp-amt').value) || 0;
  var note = (document.getElementById('sp-note').value || '').trim();
  if (!supId) { toast('اختر مورداً','error'); return; }
  if (amount <= 0) { toast('المبلغ مطلوب','error'); return; }
  var idx = state.suppliers.findIndex(function(s){ return s.id === supId; });
  if (idx === -1) { toast('المورد غير موجود','error'); return; }
  var sup = state.suppliers[idx];
  try {
    await db.collection('transactions').add({
      type: 'paid', userId: '', userName: 'مورد: ' + (sup.name || '—'),
      userRole: 'supplier', supplierId: sup.id, supplierName: sup.name,
      amount: amount, reason: 'دفعة لمورد' + (note ? ' — ' + note : ''),
      status: 'approved', approvedBy: state.user.uid,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    var newBalance = Math.max(0, (Number(sup.balance) || 0) - amount);
    var list = state.suppliers.slice();
    list[idx] = Object.assign({}, sup, {balance: newBalance});
    await db.collection('config').doc('suppliers').set({list: list}, {merge:true});
    await logAudit('دفعة لمورد', sup.id, (sup.name||'') + ' — ' + amount + ' ر.ي');
    toast('✅ تم الدفع — متبقي: ' + fmt(newBalance) + ' ر.ي','success');
    closeModal();
    await loadAll();
    renderTab('suppliers');
  } catch(e){ toast('❌ ' + e.message,'error'); }
}

`;

h = h.slice(0, logoutIdx) + newFuncs + h.slice(logoutIdx);
console.log('✅ 4: payment functions inserted');

// ═══ 5. Add payment button in suppliers tab ═══
const supBtnSearch = `'<button class="acc-btn" onclick="showSupplierForm()" style="flex:1">➕ مورد جديد</button>'`;
if (h.includes(supBtnSearch)) {
  const supBtnReplace = supBtnSearch + ` + '<button class="acc-btn" style="background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.4);color:#4ade80;flex:1" onclick="showSupplierPaymentPicker()">💵 دفع</button>'`;
  h = h.replace(supBtnSearch, supBtnReplace);
  console.log('✅ 5: payment button in suppliers tab');
} else {
  console.log('⚠️ 5: payment button - anchor not found');
}

fs.writeFileSync('accountant.html', h);
console.log('━━━━━━━━━━━━━━━━━━');
console.log('✅ v293 complete |', before, '->', h.length);
