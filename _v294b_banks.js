const fs = require('fs');
let h = fs.readFileSync('accountant.html', 'utf8');
const before = h.length;

if (h.includes('function renderBanks()')) { console.log('already'); process.exit(0); }

// ═══ 1. أضف tab في المتبويبات ═══
const tabAnchor = '<button class="acc-tab" data-tab="suppliers">🏢 موردين</button>';
if (!h.includes(tabAnchor)) throw new Error('tab anchor');
h = h.replace(
  tabAnchor,
  '<button class="acc-tab" data-tab="banks">🏦 الصناديق</button>\n    ' + tabAnchor
);

// ═══ 2. أضف route في renderTab ═══
const routeAnchor = "else if(tab==='suppliers') c.innerHTML = renderSuppliers();";
if (!h.includes(routeAnchor)) throw new Error('route anchor');
h = h.replace(
  routeAnchor,
  "else if(tab==='banks') c.innerHTML = renderBanks();\n  " + routeAnchor
);

// ═══ 3. أضف state.banks ═══
h = h.replace(
  "suppliers:[], auditLog:[],",
  "suppliers:[], banks:[], auditLog:[],"
);

// ═══ 4. حدّث loadAll ═══
const loadAnchor = "if(r[4] && r[4].exists) state.suppliers = (r[4].data().list || []);";
if (!h.includes(loadAnchor)) throw new Error('load anchor');
h = h.replace(
  loadAnchor,
  loadAnchor + `\n  try { var bd = await db.collection('config').doc('banks').get(); if(bd.exists) state.banks = bd.data().list || []; } catch(e){}`
);

// ═══ 5. أضف دوال renderBanks + showBankAction ═══
const logoutAnchor = "document.getElementById('btn-logout').onclick";
if (!h.includes(logoutAnchor)) throw new Error('logout anchor');

const code = `
// ═══ v294b: Bank/Cash box management in accountant panel ═══

var BANK_TYPE_LABELS = {
  cash:   {icon:'💰', label:'نقدي',  color:'#22c55e'},
  bank:   {icon:'🏦', label:'بنك',   color:'#3b82f6'},
  wallet: {icon:'📱', label:'محفظة', color:'#a855f7'},
  other:  {icon:'📦', label:'أخرى',  color:'#f59e0b'}
};

function renderBanks(){
  var activeBanks = state.banks.filter(function(b){ return b.active !== false; });
  var totalBalance = activeBanks.reduce(function(s, b){ return s + (Number(b.balance)||0); }, 0);
  
  // معاملات بنكية (bankId موجود)
  var bankTxs = state.transactions.filter(function(t){ return t.bankId && t.type && t.type.indexOf('bank_') === 0; });
  
  var html = '<div class="acc-kpis" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:14px">'
    + '<div class="acc-kpi rev"><div class="acc-kpi-num">' + fmt(totalBalance) + '</div><div class="acc-kpi-lbl">إجمالي الصناديق</div></div>'
    + '<div class="acc-kpi cogs"><div class="acc-kpi-num">' + activeBanks.length + '</div><div class="acc-kpi-lbl">صناديق نشطة</div></div>'
    + '<div class="acc-kpi profit"><div class="acc-kpi-num">' + bankTxs.length + '</div><div class="acc-kpi-lbl">حركات مسجلة</div></div>'
    + '</div>';
  
  if (state.banks.length === 0) {
    html += '<div class="acc-empty"><div class="acc-empty-icon">🏦</div><div class="acc-empty-txt">لا توجد صناديق بعد — اطلب من الأدمن إنشاء صندوق</div></div>';
    return html;
  }
  
  html += state.banks.map(function(b, i){
    var t = BANK_TYPE_LABELS[b.type] || BANK_TYPE_LABELS.other;
    var isActive = b.active !== false;
    var lastTx = bankTxs.filter(function(tx){ return tx.bankId === b.id; }).slice(0, 1)[0];
    
    return '<div class="acc-card" style="' + (!isActive ? 'opacity:0.5' : '') + '">'
      + '<div class="acc-card-h" style="margin-bottom:8px">'
      +   '<div style="display:flex;align-items:center;gap:8px">'
      +     '<div style="width:38px;height:38px;border-radius:10px;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;font-size:20px">' + t.icon + '</div>'
      +     '<div>'
      +       '<div style="font-size:13px;font-weight:900;color:#fff">' + esc(b.name || '—') + '</div>'
      +       '<div style="font-size:10px;color:#b8c0d8">' + t.label + (b.accountNumber ? ' · ' + esc(b.accountNumber) : '') + '</div>'
      +     '</div>'
      +   '</div>'
      +   '<div style="text-align:left">'
      +     '<div style="font-size:16px;font-weight:900;color:' + t.color + '">' + fmt(b.balance) + '</div>'
      +     '<div style="font-size:9px;color:#b8c0d8">رصيد</div>'
      +   '</div>'
      + '</div>'
      + (lastTx ? '<div style="font-size:10px;color:#b8c0d8;padding:6px;background:rgba(0,0,0,0.2);border-radius:6px;margin-bottom:8px">🕐 آخر حركة: ' + (lastTx.type === 'bank_deposit' ? 'إيداع' : lastTx.type === 'bank_withdraw' ? 'سحب' : 'تحويل') + ' — ' + fmt(lastTx.amount) + ' ر · ' + fmtDate(lastTx.createdAt) + '</div>' : '')
      + '<div style="display:flex;gap:6px">'
      +   '<button onclick="showBankAction(\\'' + b.id + '\\', \\'deposit\\')" style="flex:1;background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);padding:8px;border-radius:8px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer">⬇️ إيداع</button>'
      +   '<button onclick="showBankAction(\\'' + b.id + '\\', \\'withdraw\\')" style="flex:1;background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);padding:8px;border-radius:8px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer">⬆️ سحب</button>'
      +   '<button onclick="showBankAction(\\'' + b.id + '\\', \\'transfer\\')" style="flex:1;background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);padding:8px;border-radius:8px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer">🔄 تحويل</button>'
      + '</div>'
      + '</div>';
  }).join('');
  
  // سجل الحركات البنكية
  if (bankTxs.length > 0) {
    html += '<div class="acc-card"><div class="acc-card-h"><div class="acc-card-title">📋 آخر الحركات البنكية</div></div>'
      + bankTxs.slice(0, 20).map(function(t){
          var amt = Number(t.amount) || 0;
          var isIn = t.type === 'bank_deposit' || (t.type === 'bank_transfer' && t.toBankId);
          var isOut = t.type === 'bank_withdraw' || (t.type === 'bank_transfer' && t.bankId);
          var color = t.type === 'bank_deposit' ? '#22c55e' : (t.type === 'bank_withdraw' ? '#ef4444' : '#3b82f6');
          var label = t.type === 'bank_deposit' ? '⬇️ إيداع' : (t.type === 'bank_withdraw' ? '⬆️ سحب' : '🔄 تحويل');
          return '<div class="acc-tx"><div class="acc-tx-l"><div class="acc-tx-t" style="color:' + color + '">' + label + ' — ' + esc(t.bankName || t.supplierName || '—') + (t.type === 'bank_transfer' && t.toBankName ? ' ← ' + esc(t.toBankName) : '') + '</div><div class="acc-tx-s">' + (t.reason ? '📝 ' + esc(t.reason) + ' · ' : '') + fmtDate(t.createdAt) + '</div></div><div class="acc-tx-r"><div class="acc-tx-amt" style="color:' + color + '">' + fmt(amt) + ' ر</div></div></div>';
        }).join('')
      + '</div>';
  }
  
  return html;
}

window.showBankAction = function(bankId, action){
  var bank = state.banks.find(function(b){ return b.id === bankId; });
  if (!bank) { toast('الصندوق غير موجود','error'); return; }
  
  var labels = {
    deposit: {title:'⬇️ إيداع في ' + (bank.name || 'الصندوق'), color:'#22c55e', btn:'تأكيد الإيداع'},
    withdraw: {title:'⬆️ سحب من ' + (bank.name || 'الصندوق'), color:'#ef4444', btn:'تأكيد السحب'},
    transfer: {title:'🔄 تحويل من ' + (bank.name || 'الصندوق'), color:'#3b82f6', btn:'تأكيد التحويل'}
  };
  var lbl = labels[action];
  
  var html = '<div>'
    + '<div style="padding:12px;background:rgba(245,158,11,0.1);border-radius:10px;margin-bottom:14px;text-align:center">'
    +   '<div style="font-size:11px;color:#b8c0d8">' + esc(bank.name) + '</div>'
    +   '<div style="font-size:18px;font-weight:900;color:' + lbl.color + '">' + fmt(bank.balance) + ' ر.ي</div>'
    +   '<div style="font-size:10px;color:#b8c0d8">الرصيد الحالي</div>'
    + '</div>';
  
  if (action === 'transfer') {
    var others = state.banks.filter(function(b){ return b.id !== bankId && b.active !== false; });
    if (others.length === 0) { toast('لا يوجد صندوق آخر للتحويل','error'); return; }
    html += '<label class="acc-form-lbl">إلى صندوق *</label>'
      + '<select id="ba-to" class="acc-form-in">'
      + others.map(function(b){ return '<option value="' + b.id + '">' + esc(b.name) + ' (' + fmt(b.balance) + ' ر)</option>'; }).join('')
      + '</select>';
  }
  
  html += '<label class="acc-form-lbl">المبلغ (ر.ي) *</label>'
    + '<input id="ba-amount" type="number" min="1" class="acc-form-in" placeholder="0" ' + (action !== 'deposit' ? 'max="' + (Number(bank.balance) || 0) + '"' : '') + '>'
    + '<label class="acc-form-lbl">السبب / الملاحظات</label>'
    + '<textarea id="ba-reason" rows="2" class="acc-form-in" placeholder="مثال: توريد نقدي، تحويل بنكي، سحب مصروف..."></textarea>'
    + '</div>';
  
  var footer = '<button class="acc-btn-sec" onclick="closeModal()" style="flex:1">إلغاء</button>'
    + '<button class="acc-btn" onclick="saveBankAction(\\'' + bankId + '\\', \\'' + action + '\\')" style="flex:2;background:' + lbl.color + '">' + lbl.btn + '</button>';
  
  showModal(lbl.title, html, footer);
};

window.saveBankAction = async function(bankId, action){
  var bank = state.banks.find(function(b){ return b.id === bankId; });
  if (!bank) return;
  var amount = Number(document.getElementById('ba-amount').value) || 0;
  var reason = (document.getElementById('ba-reason').value || '').trim();
  
  if (amount <= 0) { toast('المبلغ مطلوب','error'); return; }
  
  var currentBalance = Number(bank.balance) || 0;
  var newBalance = currentBalance;
  var txData = {
    amount: amount,
    reason: reason,
    status: 'approved',
    bankId: bank.id,
    bankName: bank.name,
    approvedBy: state.user.uid,
    approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    var list = state.banks.slice();
    var bankIdx = list.findIndex(function(b){ return b.id === bankId; });
    
    if (action === 'deposit') {
      txData.type = 'bank_deposit';
      newBalance = currentBalance + amount;
      list[bankIdx] = Object.assign({}, bank, {balance: newBalance});
    } else if (action === 'withdraw') {
      if (amount > currentBalance) { toast('المبلغ أكبر من الرصيد (' + fmt(currentBalance) + ')','error'); return; }
      txData.type = 'bank_withdraw';
      newBalance = currentBalance - amount;
      list[bankIdx] = Object.assign({}, bank, {balance: newBalance});
    } else if (action === 'transfer') {
      var toId = document.getElementById('ba-to').value;
      var toIdx = list.findIndex(function(b){ return b.id === toId; });
      if (toIdx === -1) { toast('الصندوق المستلم غير موجود','error'); return; }
      if (amount > currentBalance) { toast('المبلغ أكبر من الرصيد (' + fmt(currentBalance) + ')','error'); return; }
      
      txData.type = 'bank_transfer';
      txData.toBankId = toId;
      txData.toBankName = list[toIdx].name;
      newBalance = currentBalance - amount;
      list[bankIdx] = Object.assign({}, bank, {balance: newBalance});
      list[toIdx] = Object.assign({}, list[toIdx], {balance: (Number(list[toIdx].balance)||0) + amount});
    }
    
    // 1. أضف المعاملة
    await db.collection('transactions').add(txData);
    
    // 2. حدّث config/banks
    await db.collection('config').doc('banks').set({
      list: list,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge: true});
    
    // 3. Audit
    var actionLabels = {deposit:'إيداع في صندوق', withdraw:'سحب من صندوق', transfer:'تحويل بين صناديق'};
    await logAudit(actionLabels[action], bankId, (bank.name||'') + ' — ' + amount + ' ر.ي');
    
    toast('✅ تم الحفظ — رصيد جديد: ' + fmt(newBalance) + ' ر.ي','success');
    closeModal();
    await loadAll();
    renderTab('banks');
  } catch(e){ toast('❌ ' + e.message,'error'); }
};

`;

h = h.slice(0, h.indexOf(logoutAnchor)) + code + h.slice(h.indexOf(logoutAnchor));

fs.writeFileSync('accountant.html', h);
console.log('✅ v294b: banks tab |', before, '->', h.length);
