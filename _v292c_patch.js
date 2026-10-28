const fs = require('fs');
let h = fs.readFileSync('accountant.html', 'utf8');
const before = h.length;

if (h.includes('function showEditTransactionForm')) { console.log('already'); process.exit(0); }

// ابحث عن نهاية "document.getElementById('btn-logout')"
const anchor = "document.getElementById('btn-logout').onclick";
const idx = h.indexOf(anchor);
if(idx === -1) throw new Error('anchor not found');

const newFuncs = `// ═══ v292c: edit/delete/receipt ═══

function showEditTransactionForm(id){
  var t = state.transactions.find(function(x){return x.id===id;});
  if(!t) return;
  var employees = state.users.filter(function(u){ return u.role && u.role !== 'customer'; });
  var grouped = {super_admin:[],cat_manager:[],delivery_mgr:[],accountant:[],bookings_mgr:[]};
  employees.forEach(function(u){ if(grouped[u.role]) grouped[u.role].push(u); });
  var roleLabels = {super_admin:'👑 الإدارة',cat_manager:'🏷️ مدراء',delivery_mgr:'🚚 توصيل',accountant:'💼 محاسبة',bookings_mgr:'📅 حجوزات'};
  var userOpts = '<option value="">— اختر —</option>';
  Object.keys(grouped).forEach(function(r){
    if(!grouped[r].length) return;
    userOpts += '<optgroup label="'+roleLabels[r]+'">';
    grouped[r].forEach(function(u){
      userOpts += '<option value="'+u.id+'" '+(u.id===t.userId?'selected':'')+'>'+esc(u.name||u.email)+'</option>';
    });
    userOpts += '</optgroup>';
  });
  var typeOpts = [['advance','📤 تقدمة'],['deduction','➖ خصم'],['paid','✅ دفعة'],['expense','💸 مصروف'],['income','💰 إيراد']].map(function(x){
    return '<option value="'+x[0]+'" '+(x[0]===t.type?'selected':'')+'>'+x[1]+'</option>';
  }).join('');
  var html = '<div>'
    + '<label class="acc-form-lbl">النوع *</label><select id="etx-type" class="acc-form-in">'+typeOpts+'</select>'
    + '<label class="acc-form-lbl">الموظف *</label><select id="etx-user" class="acc-form-in">'+userOpts+'</select>'
    + '<label class="acc-form-lbl">المبلغ *</label><input id="etx-amount" type="number" min="1" class="acc-form-in" value="'+(t.amount||0)+'">'
    + '<label class="acc-form-lbl">السبب</label><textarea id="etx-reason" rows="2" class="acc-form-in">'+esc(t.reason||'')+'</textarea>'
    + '</div>';
  var footer = '<button class="acc-btn-sec" onclick="closeModal()" style="flex:1">إلغاء</button><button class="acc-btn" onclick="saveEditTransaction(\\''+id+'\\')" style="flex:2">💾 تحديث</button>';
  showModal('✏️ تعديل المعاملة', html, footer);
}

async function saveEditTransaction(id){
  var t = state.transactions.find(function(x){return x.id===id;});
  if(!t) return;
  var type = document.getElementById('etx-type').value;
  var userId = document.getElementById('etx-user').value;
  var amount = Number(document.getElementById('etx-amount').value)||0;
  var reason = document.getElementById('etx-reason').value.trim();
  if(amount<=0){ toast('المبلغ مطلوب','error'); return; }
  var user = state.users.find(function(u){return u.id===userId;});
  try {
    await db.collection('transactions').doc(id).update({
      type:type, userId:userId, userName:user?(user.name||user.email):'—', userRole:user?user.role:'',
      amount:amount, reason:reason,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy:state.user.uid
    });
    await logAudit('تعديل معاملة', id, type+' - '+amount+' ر (السابق: '+t.amount+')');
    toast('✅ تم التحديث','success');
    closeModal();
    await loadAll();
    renderTab('transactions');
  } catch(e){ toast('❌ '+e.message,'error'); }
}

function printPaymentReceipt(txId){
  var t = state.transactions.find(function(x){return x.id===txId;});
  if(!t){ toast('غير موجود','error'); return; }
  try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({orientation:'p', unit:'mm', format:'a5'});
    doc.setFillColor(245,158,11);
    doc.rect(0,0,148,20,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(16);
    doc.text('CHIZEN', 74, 12, {align:'center'});
    doc.setFontSize(9);
    doc.text('إيصال معاملة', 74, 17, {align:'center'});
    doc.setTextColor(20,20,40);
    doc.setFontSize(10);
    doc.text('رقم: #'+t.id.slice(-8), 15, 32);
    doc.text('التاريخ: '+fmtDate(t.createdAt), 133, 32, {align:'right'});
    var typeLabels = {advance:'تقدمة',deduction:'خصم',paid:'دفعة',expense:'مصروف',income:'إيراد'};
    var y = 45;
    [['النوع', typeLabels[t.type]||t.type],['الموظف', t.userName||'—'],['الدور', t.userRole||'—'],['المبلغ', (Number(t.amount)||0).toFixed(0)+' ر.ي'],['السبب', t.reason||'—']].forEach(function(r){
      doc.setFillColor(240,240,250); doc.rect(15, y, 118, 8, 'F');
      doc.setTextColor(30,30,50);
      doc.text(r[0], 130, y+5.5, {align:'right'});
      doc.text(String(r[1]).slice(0,40), 18, y+5.5, {align:'left'});
      y += 10;
    });
    doc.setTextColor(120,120,140); doc.setFontSize(7);
    doc.text('CHIZEN © 2026', 74, 200, {align:'center'});
    doc.save('CHIZEN_Receipt_'+t.id.slice(-8)+'.pdf');
    toast('✅ تم توليد الإيصال','success');
  } catch(e){ toast('❌ '+e.message,'error'); }
}

// فلترة chips
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('[data-txf]');
  if(b){ state.txFilter = b.dataset.txf; renderTab('transactions'); }
});

// period custom
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('[data-period]');
  if(b && b.dataset.period === 'custom'){ showCustomPeriodPicker(); }
});

function showCustomPeriodPicker(){
  var from = state.periodCustom.from || '';
  var to = state.periodCustom.to || '';
  var html = '<div>'
    + '<label class="acc-form-lbl">من تاريخ *</label>'
    + '<input type="date" id="cp-from" class="acc-form-in" value="'+from+'">'
    + '<label class="acc-form-lbl">إلى تاريخ</label>'
    + '<input type="date" id="cp-to" class="acc-form-in" value="'+to+'">'
    + '</div>';
  var footer = '<button class="acc-btn-sec" onclick="closeModal()" style="flex:1">إلغاء</button><button class="acc-btn" onclick="applyCustomPeriod()" style="flex:2">تطبيق</button>';
  showModal('📅 فترة مخصصة', html, footer);
}

function applyCustomPeriod(){
  var from = document.getElementById('cp-from').value;
  var to = document.getElementById('cp-to').value;
  if(!from){ toast('التاريخ مطلوب','error'); return; }
  state.periodCustom = {from:from, to:to};
  state.period = 'custom';
  closeModal();
  renderTab(state.activeTab);
}

`;

h = h.slice(0, idx) + newFuncs + h.slice(idx);
fs.writeFileSync('accountant.html', h);
console.log('✅ v292c: 6 دوال جديدة |', before, '->', h.length);
