const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

// استبدال renderAccountant الحالية
const oldStart = 'function renderAccountant(){';
const oldEnd = 'function renderMore(){';
const sIdx = h.indexOf(oldStart);
const eIdx = h.indexOf(oldEnd);

if (sIdx === -1 || eIdx === -1) { console.log('❌ markers not found'); process.exit(1); }

const newCode = `function renderAccountant(){
  var orders = state.orders || [];
  var notifs = state.notifications || [];
  
  var completed = orders.filter(function(o){ return o.status === 'completed'; });
  var pending = orders.filter(function(o){ return o.status === 'pending'; });
  
  var totalRevenue = 0;
  completed.forEach(function(o){ totalRevenue += Number(o.total) || 0; });
  
  var today = new Date(); today.setHours(0,0,0,0);
  var todayRevenue = 0, weekRevenue = 0, monthRevenue = 0;
  var weekAgo = new Date(today.getTime() - 7*24*60*60*1000);
  var monthAgo = new Date(today.getTime() - 30*24*60*60*1000);
  
  completed.forEach(function(o){
    var d = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate() : null;
    if (!d) return;
    var t = Number(o.total) || 0;
    if (d >= today) todayRevenue += t;
    if (d >= weekAgo) weekRevenue += t;
    if (d >= monthAgo) monthRevenue += t;
  });
  
  var pendingValue = 0;
  pending.forEach(function(o){ pendingValue += Number(o.total) || 0; });
  
  return ''
    + '<div class="vst">💼 المحاسب — نظرة مالية</div>'
    + '<div class="vkg" style="grid-template-columns:repeat(2,1fr)">'
    +   '<div class="vk sales"><div class="vk-icon">💰</div><div class="vk-num">' + Math.round(totalRevenue).toLocaleString('ar-EG') + '</div><div class="vk-lbl">إجمالي الإيرادات</div><div class="vk-trend">' + completed.length + ' طلب مكتمل</div></div>'
    +   '<div class="vk orders"><div class="vk-icon">⏳</div><div class="vk-num">' + Math.round(pendingValue).toLocaleString('ar-EG') + '</div><div class="vk-lbl">مبالغ معلّقة</div><div class="vk-trend">' + pending.length + ' طلب</div></div>'
    + '</div>'
    + '<div class="vst">📅 الإيرادات الزمنية</div>'
    + '<div class="vkg" style="grid-template-columns:repeat(3,1fr)">'
    +   '<div class="vk products"><div class="vk-num" style="font-size:16px">' + Math.round(todayRevenue).toLocaleString('ar-EG') + '</div><div class="vk-lbl">اليوم</div></div>'
    +   '<div class="vk products"><div class="vk-num" style="font-size:16px">' + Math.round(weekRevenue).toLocaleString('ar-EG') + '</div><div class="vk-lbl">آخر 7 أيام</div></div>'
    +   '<div class="vk products"><div class="vk-num" style="font-size:16px">' + Math.round(monthRevenue).toLocaleString('ar-EG') + '</div><div class="vk-lbl">آخر 30 يوم</div></div>'
    + '</div>'
    + '<div class="vst">⚡ إجراءات</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">'
    +   '<button onclick="accountantViewTransactions()" style="background:linear-gradient(135deg,#1a1230,#121028);border:1px solid rgba(155,77,255,0.3);border-radius:16px;padding:16px;color:#fff;font-family:inherit;cursor:pointer;text-align:right">'
    +     '<div style="font-size:24px;margin-bottom:6px">💸</div>'
    +     '<div style="font-size:13px;font-weight:800">المعاملات</div>'
    +     '<div style="font-size:11px;color:#a78bfa;margin-top:2px">تقدمات / خصومات / دفعات</div>'
    +   '</button>'
    +   '<button onclick="accountantAddTransaction()" style="background:linear-gradient(135deg,#7c3aed,#ec4899);border:none;border-radius:16px;padding:16px;color:#fff;font-family:inherit;cursor:pointer;text-align:right;box-shadow:0 8px 24px rgba(168,85,247,0.35)">'
    +     '<div style="font-size:24px;margin-bottom:6px">➕</div>'
    +     '<div style="font-size:13px;font-weight:800">معاملة جديدة</div>'
    +     '<div style="font-size:11px;opacity:0.85;margin-top:2px">تسجيل تقدم أو دفعة</div>'
    +   '</button>'
    + '</div>'
    + '<div class="vst">🕐 آخر الطلبات المكتملة</div>'
    + '<div class="vlist">'
    +   (completed.slice(0, 10).map(function(o){
        var date = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString('ar-YE', {month:'short', day:'numeric'}) : '—';
        return '<div class="vcard" onclick="showOrderDetail(\\'' + o.id + '\\')">'
          + '<div class="vrow"><div class="vid">#' + o.id.slice(-6) + '</div><div class="vtitle">' + (o.customerName || 'عميل') + '</div><div class="vtotal" style="color:#22c55e">' + (Number(o.total)||0).toFixed(0) + ' ر</div></div>'
          + '<div class="vmeta"><span>' + date + '</span><span class="vbadge done">مكتمل</span></div>'
          + '</div>';
      }).join('') || '<div class="vempty"><div class="vempty-icon">💰</div><div class="vempty-txt">لا توجد طلبات مكتملة بعد</div></div>')
    + '</div>';
}

// ═══ VIEW: قائمة المعاملات ═══
window.accountantViewTransactions = async function(){
  try {
    var snap = await db.collection('transactions').orderBy('createdAt', 'desc').limit(100).get();
    var items = snap.docs.map(function(d){ return Object.assign({}, d.data(), {id: d.id}); });
    
    var html = '';
    if (items.length === 0) {
      html = '<div class="vempty"><div class="vempty-icon">💸</div><div class="vempty-txt">لا توجد معاملات بعد</div></div>';
    } else {
      html = items.map(function(t){
        var typeLabels = {advance:'تقدمة', deduction:'خصم', paid:'دفعة', expense:'مصروف', income:'إيراد'};
        var typeColors = {advance:'#f59e0b', deduction:'#ef4444', paid:'#22c55e', expense:'#ec4899', income:'#3b82f6'};
        var statusColors = {pending:'#fbbf24', approved:'#22c55e', rejected:'#ef4444'};
        var statusLabels = {pending:'معلق', approved:'معتمد', rejected:'مرفوض'};
        var date = t.createdAt && t.createdAt.toDate ? t.createdAt.toDate().toLocaleDateString('ar-YE', {month:'short', day:'numeric'}) : '—';
        return '<div style="background:linear-gradient(135deg,#1a1230,#121028);border:1px solid rgba(155,77,255,0.2);border-radius:14px;padding:12px;margin-bottom:8px">'
          + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">'
          +   '<div style="flex:1;min-width:0">'
          +     '<div style="font-size:13px;font-weight:800;color:' + (typeColors[t.type]||'#fff') + '">' + (typeLabels[t.type] || t.type || '—') + '</div>'
          +     '<div style="font-size:11px;color:#a78bfa">' + (t.userName || '—') + ' · ' + date + '</div>'
          +   '</div>'
          +   '<div style="text-align:left">'
          +     '<div style="font-size:16px;font-weight:900;color:#fff">' + (Number(t.amount)||0).toFixed(0) + ' ر</div>'
          +     '<div style="font-size:10px;color:' + (statusColors[t.status]||'#fff') + ';font-weight:700">' + (statusLabels[t.status] || t.status || '') + '</div>'
          +   '</div>'
          + '</div>'
          + (t.reason ? '<div style="font-size:11px;color:#a78bfa;padding:6px 8px;background:rgba(155,77,255,0.05);border-radius:8px;margin-top:6px">📝 ' + esc(t.reason) + '</div>' : '')
          + (t.status === 'pending' ? '<div style="display:flex;gap:6px;margin-top:8px"><button onclick="approveTransaction(\\'' + t.id + '\\')" style="flex:1;background:#22c55e;color:#fff;border:none;padding:8px;border-radius:8px;font-family:inherit;font-weight:800;font-size:11px;cursor:pointer">✓ اعتماد</button><button onclick="rejectTransaction(\\'' + t.id + '\\')" style="flex:1;background:#ef4444;color:#fff;border:none;padding:8px;border-radius:8px;font-family:inherit;font-weight:800;font-size:11px;cursor:pointer">✗ رفض</button></div>' : '')
          + '</div>';
      }).join('');
    }
    
    showModal('💸 المعاملات (' + items.length + ')', html);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
};

// ═══ ADD TRANSACTION ═══
window.accountantAddTransaction = function(){
  var users = state.users || [];
  var iS = 'width:100%;padding:12px 14px;background:rgba(10,8,37,0.7);border:1px solid rgba(155,77,255,0.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box';
  var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:6px';
  
  var userOpts = users.map(function(u){
    return '<option value="' + u.id + '">' + (u.name || u.email || '—') + ' (' + (u.role || '') + ')</option>';
  }).join('');
  
  var html = '<div>'
    + '<label style="' + lS + '">نوع المعاملة *</label>'
    + '<select id="at-type" style="' + iS + '">'
    +   '<option value="advance">📤 تقدمة</option>'
    +   '<option value="deduction">➖ خصم</option>'
    +   '<option value="paid">✅ دفعة</option>'
    +   '<option value="expense">💸 مصروف</option>'
    +   '<option value="income">💰 إيراد</option>'
    + '</select>'
    + '<label style="' + lS + '">المستخدم / الموظف *</label>'
    + '<select id="at-user" style="' + iS + '"><option value="">— اختر —</option>' + userOpts + '</select>'
    + '<label style="' + lS + '">المبلغ (ر.ي) *</label>'
    + '<input id="at-amount" type="number" min="1" placeholder="0" style="' + iS + '">'
    + '<label style="' + lS + '">السبب / الملاحظات</label>'
    + '<textarea id="at-reason" rows="2" placeholder="سبب المعاملة..." style="' + iS + 'resize:vertical"></textarea>'
    + '<button id="at-save" style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:14px;border-radius:12px;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer;border:none;margin-top:8px">💾 حفظ</button>'
    + '</div>';
  
  showModal('➕ معاملة جديدة', html);
  
  document.getElementById('at-save').onclick = async function(){
    var type = document.getElementById('at-type').value;
    var userId = document.getElementById('at-user').value;
    var amount = Number(document.getElementById('at-amount').value) || 0;
    var reason = document.getElementById('at-reason').value.trim();
    
    if (!userId) { toast('⚠️ اختر مستخدماً', 'error'); return; }
    if (amount <= 0) { toast('⚠️ المبلغ مطلوب', 'error'); return; }
    
    var user = users.find(function(u){ return u.id === userId; });
    var btn = this; btn.disabled = true; btn.textContent = '⏳...';
    
    try {
      await db.collection('transactions').add({
        type: type,
        userId: userId,
        userName: user ? (user.name || user.email) : '—',
        userRole: user ? user.role : '',
        amount: amount,
        reason: reason,
        status: 'approved',
        approvedBy: state.user.uid,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // إشعار للمستخدم
      if (user) {
        db.collection('notifications').add({
          userId: userId,
          title: '💼 معاملة جديدة',
          body: (type === 'advance' ? 'تقدمة' : type === 'deduction' ? 'خصم' : type === 'paid' ? 'دفعة' : type === 'expense' ? 'مصروف' : 'إيراد') + ': ' + amount.toFixed(0) + ' ر.ي' + (reason ? ' — ' + reason : ''),
          type: 'info',
          icon: '💼',
          read: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function(){});
      }
      
      toast('✅ تم الحفظ', 'success');
      var cb = document.querySelector('#modal-close'); if(cb) cb.click();
      await loadAll();
      renderTab('accountant');
    } catch(e){
      btn.disabled = false; btn.textContent = '💾 حفظ';
      toast('❌ ' + e.message, 'error');
    }
  };
};

// ═══ APPROVE / REJECT ═══
window.approveTransaction = async function(id){
  if (!confirm('اعتماد هذه المعاملة؟')) return;
  try {
    await db.collection('transactions').doc(id).update({
      status: 'approved',
      approvedBy: state.user.uid,
      approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('✅ تم الاعتماد', 'success');
    var cb = document.querySelector('#modal-close'); if(cb) cb.click();
    setTimeout(accountantViewTransactions, 200);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
};

window.rejectTransaction = async function(id){
  if (!confirm('رفض هذه المعاملة؟')) return;
  try {
    await db.collection('transactions').doc(id).update({
      status: 'rejected',
      rejectedBy: state.user.uid,
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast('تم الرفض', 'error');
    var cb = document.querySelector('#modal-close'); if(cb) cb.click();
    setTimeout(accountantViewTransactions, 200);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
};

`;

h = h.slice(0, sIdx) + newCode + h.slice(eIdx);

fs.writeFileSync('dashboard.html', h);
console.log('✅ v282: لوحة محاسب كاملة |', before, '->', h.length);
