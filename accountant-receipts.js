(function(){
  'use strict';
  console.log('[ACC-RECEIPTS] Injecting...');
  
  var myState = { receipts: [], filter: 'pending' };
  
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];}); }
  function fmtDate(ts){
    if(!ts) return '—';
    var d = ts.seconds ? new Date(ts.seconds*1000) : new Date(ts);
    return d.toLocaleString('ar-YE', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
  }
  
  // 1. حقن زر التبويب
  setInterval(function(){
    var nav = document.getElementById('tabs');
    if(nav && !document.querySelector('[data-tab="receipts"]')){
      var btn = document.createElement('button');
      btn.className = 'acc-tab';
      btn.setAttribute('data-tab', 'receipts');
      btn.innerHTML = '📄 السندات';
      nav.appendChild(btn);
      console.log('[ACC-RECEIPTS] Tab Injected');
    }
  }, 500);
  
  // 2. اعتراض دالة renderTab
  setInterval(function(){
    if(typeof window.renderTab === 'function' && !window.renderTab.__hook_receipts){
      var orig = window.renderTab;
      window.renderTab = function(tab){
        if(tab === 'receipts'){
          document.querySelectorAll('.acc-tab').forEach(function(b){ b.classList.toggle('active', b.dataset.tab === tab); });
          var c = document.getElementById('content');
          if(c) c.innerHTML = '<div class="acc-empty"><div class="acc-empty-icon">⏳</div><div class="acc-empty-txt">جاري تحميل السندات...</div></div>';
          loadReceipts().then(function(){
            if(c) c.innerHTML = renderMyReceipts();
          });
          return;
        }
        return orig.apply(this, arguments);
      };
      window.renderTab.__hook_receipts = true;
      console.log('[ACC-RECEIPTS] renderTab Hooked');
    }
  }, 500);
  
  async function loadReceipts(){
    try {
      var snap = await firebase.firestore().collection('receipts').orderBy('sentAt','desc').limit(200).get();
      myState.receipts = [];
      snap.forEach(function(d){ myState.receipts.push(Object.assign({}, d.data(), {id:d.id})); });
    } catch(e){ console.warn('[ACC-RECEIPTS] load failed', e); }
  }
  
  window.__accSetFilter = function(f){
    myState.filter = f;
    var c = document.getElementById('content');
    if(c) c.innerHTML = renderMyReceipts();
  };
  
  function renderMyReceipts(){
    var pending = myState.receipts.filter(function(r){ return r.status === 'pending_review'; });
    var confirmed = myState.receipts.filter(function(r){ return r.status === 'confirmed'; });
    var disputed = myState.receipts.filter(function(r){ return r.status === 'disputed'; });
    var f = myState.filter || 'pending';
    var list = f === 'pending' ? pending : f === 'confirmed' ? confirmed : f === 'disputed' ? disputed : myState.receipts;
    
    var chipsHtml = [
      ['pending', '📄 للمراجعة (' + pending.length + ')'],
      ['confirmed', '✅ مؤكدة (' + confirmed.length + ')'],
      ['disputed', '❌ معترض عليها (' + disputed.length + ')']
    ].map(function(c){
      var active = f === c[0];
      return '<button onclick="window.__accSetFilter(\''+c[0]+'\')" style="flex-shrink:0;background:'+(active?'linear-gradient(135deg,#f59e0b,#d97706)':'rgba(245,158,11,0.08)')+';border:1px solid '+(active?'transparent':'rgba(245,158,11,0.2)')+';color:'+(active?'#fff':'#b8c0d8')+';padding:8px 14px;border-radius:10px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;margin-left:6px">'+c[1]+'</button>';
    }).join('');
    
    var listHtml = list.map(function(r){
      var isCOD = r.paymentMethod === 'cod';
      var statusBadge = r.status === 'pending_review' ? '<span class="acc-badge pending" style="background:rgba(245,158,11,0.15);color:#f59e0b">📄 للمراجعة</span>'
        : r.status === 'confirmed' ? '<span class="acc-badge completed" style="background:rgba(34,197,94,0.15);color:#22c55e">✅ مؤكد</span>'
        : '<span class="acc-badge" style="background:rgba(239,68,68,0.15);color:#f87171">❌ معترض</span>';
        
      var payBadge = isCOD ? '<span class="acc-badge" style="background:rgba(245,158,11,0.15);color:#fbbf24;margin-right:4px">💰 COD ' + (Number(r.total)||0).toFixed(0) + ' ر</span>'
        : '<span class="acc-badge" style="background:rgba(34,197,94,0.15);color:#22c55e;margin-right:4px">✅ مدفوع</span>';
        
      var actionsHtml = '';
      if(r.status === 'pending_review'){
        actionsHtml = '<div style="display:flex;gap:6px;margin-top:10px">' +
          '<button class="acc-btn" style="flex:1;padding:9px;font-size:12px;background:linear-gradient(135deg,#22c55e,#16a34a)" onclick="event.stopPropagation();window.__accConfirmReceipt(\''+r.id+'\')">✅ تأكيد واستلام</button>' +
          '<button class="acc-btn-sec" style="flex:0 0 auto;padding:9px 12px;font-size:12px;background:rgba(239,68,68,0.15);color:#f87171;border-color:rgba(239,68,68,0.3)" onclick="event.stopPropagation();window.__accDisputeReceipt(\''+r.id+'\')">❌</button>' +
          '<button class="acc-btn-sec" style="flex:0 0 auto;padding:9px 12px;font-size:12px" onclick="event.stopPropagation();window.__accDownloadReceiptPDF(\''+r.id+'\')">📄</button>' +
          '</div>';
      } else {
        actionsHtml = '<div style="display:flex;gap:6px;margin-top:10px">' +
          '<button class="acc-btn-sec" style="flex:1;padding:9px;font-size:12px" onclick="event.stopPropagation();window.__accDownloadReceiptPDF(\''+r.id+'\')">📄 عرض السند PDF</button>' +
          '</div>';
      }
      
      var timeStr = r.sentAt ? fmtDate(r.sentAt) : '—';
      
      return '<div class="acc-card" style="border-color:'+(r.status==='pending_review'?'rgba(245,158,11,0.4)':r.status==='confirmed'?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)')+';margin-bottom:12px">' +
        '<div class="acc-tx">' +
          '<div class="acc-tx-l">' +
            '<div class="acc-tx-t">#' + esc(r.orderNumber || (r.orderId||'').slice(-6).toUpperCase()) + ' — ' + esc(r.deliveryMgrName || 'مندوب') + '</div>' +
            '<div class="acc-tx-s">👤 ' + esc(r.customerName || 'عميل') + ' · 🕐 ' + timeStr + '</div>' +
            '<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">' + payBadge + statusBadge + '</div>' +
          '</div>' +
          '<div class="acc-tx-r">' +
            '<div class="acc-tx-amt" style="color:'+(isCOD?'#fbbf24':'#22c55e')+'">' + (Number(r.total)||0).toFixed(0) + ' ر</div>' +
          '</div>' +
        '</div>' +
        actionsHtml +
      '</div>';
    }).join('');
    
    return '<div style="display:flex;gap:6px;padding:0 0 10px;overflow-x:auto;scrollbar-width:none">' + chipsHtml + '</div>' +
      (list.length === 0 
        ? '<div class="acc-empty"><div class="acc-empty-icon">📭</div><div class="acc-empty-txt">لا توجد سندات في هذه القائمة</div></div>' 
        : listHtml);
  }
  
  window.__accConfirmReceipt = async function(id){
    var r = myState.receipts.find(function(x){ return x.id === id; });
    if(!r){ alert('❌ السند غير موجود'); return; }
    var isCOD = r.paymentMethod === 'cod';
    var msg = isCOD 
      ? 'تأكيد استلام ' + (Number(r.total)||0).toFixed(0) + ' ر.ي من المندوب؟\n\nسيتم:\n✅ إكمال الطلب\n💰 عمولة 10 ر للمندوب'
      : 'تأكيد السند؟\n\nسيتم:\n✅ إكمال الطلب\n💰 عمولة 10 ر للمندوب';
    if(!confirm(msg)) return;
    
    try {
      var commissionAmount = 10;
      var user = firebase.auth().currentUser;
      var udata = await firebase.firestore().collection('users').doc(user.uid).get();
      var uname = udata.exists ? (udata.data().name || user.email) : user.email;
      
      await firebase.firestore().collection('receipts').doc(id).update({
        status: 'confirmed',
        confirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
        confirmedBy: user.uid,
        confirmedByName: uname,
        commissionAmount: commissionAmount
      });
      await firebase.firestore().collection('orders').doc(r.orderId).update({
        fulfillmentStage: 'completed',
        workflowStatus: 'completed',
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        completedBy: user.uid,
        accountantReviewStatus: 'confirmed'
      });
      await firebase.firestore().collection('commissions').add({
        employeeId: r.deliveryMgrId || '',
        employeeName: r.deliveryMgrName || '',
        employeeRole: 'delivery_mgr',
        orderId: r.orderId,
        orderNumber: r.orderNumber || '',
        amount: commissionAmount,
        currency: 'YER',
        type: 'delivery',
        status: 'earned',
        receiptId: id,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        confirmedBy: user.uid
      });
      
      if(r.deliveryMgrId){
        await firebase.firestore().collection('notifications').add({
          userId: r.deliveryMgrId,
          title: '💰 تم تأكيد عمولتك',
          body: 'طلب #' + (r.orderNumber || '') + ' — عمولة ' + commissionAmount + ' ر.ي',
          type: 'commission', event: 'commission_earned', icon: '💰',
          read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function(){});
      }
      alert('✅ تم التأكيد + عمولة ' + commissionAmount + ' ر للمندوب');
      await loadReceipts();
      window.__accSetFilter('pending');
    } catch(e){
      alert('❌ ' + e.message);
    }
  };
  
  window.__accDisputeReceipt = async function(id){
    var reason = prompt('اذكر سبب الاعتراض على السند:');
    if(!reason || !reason.trim()) return;
    var r = myState.receipts.find(function(x){ return x.id === id; });
    if(!r) return;
    try {
      var user = firebase.auth().currentUser;
      await firebase.firestore().collection('receipts').doc(id).update({
        status: 'disputed',
        disputeReason: reason.trim(),
        disputedAt: firebase.firestore.FieldValue.serverTimestamp(),
        disputedBy: user.uid
      });
      await firebase.firestore().collection('orders').doc(r.orderId).update({
        accountantReviewStatus: 'disputed',
        disputeReason: reason.trim()
      });
      if(r.deliveryMgrId){
        await firebase.firestore().collection('notifications').add({
          userId: r.deliveryMgrId,
          title: '⚠️ اعتراض على السند',
          body: 'طلب #' + (r.orderNumber || '') + ': ' + reason.trim(),
          type: 'warning', event: 'receipt_disputed', icon: '⚠️',
          read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function(){});
      }
      alert('❌ تم إرسال الاعتراض للمندوب');
      await loadReceipts();
      window.__accSetFilter('pending');
    } catch(e){ alert('❌ ' + e.message); }
  };
  
  window.__accDownloadReceiptPDF = async function(id){
    var r = myState.receipts.find(function(x){ return x.id === id; });
    if(!r){ alert('❌ السند غير موجود'); return; }
    
    if(typeof html2pdf === 'undefined'){
      alert('جاري تحميل مكتبة PDF...');
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      s.onload = function(){ window.__accDownloadReceiptPDF(id); };
      document.head.appendChild(s);
      return;
    }
    
    var items = r.items || [];
    var isCOD = r.paymentMethod === 'cod';
    var dateStr = r.sentAt ? (r.sentAt.seconds ? new Date(r.sentAt.seconds*1000).toLocaleString('ar') : new Date(r.sentAt).toLocaleString('ar')) : '—';
    
    var htmlStr = '<div style="padding:20px;font-family:Arial,Tahoma,sans-serif;direction:rtl;max-width:800px;color:#333;background:#fff">' +
      '<div style="text-align:center;border-bottom:3px solid #f59e0b;padding-bottom:15px;margin-bottom:20px">' +
        '<h1 style="color:#f59e0b;margin:0;font-size:36px;letter-spacing:2px">CHIZEN</h1>' +
        '<h2 style="margin:10px 0;color:#333;font-size:20px">سند محاسبي</h2>' +
        '<p style="color:#666;font-size:14px">رقم: #' + (r.orderNumber || '') + '</p>' +
      '</div>' +
      (isCOD ? '<div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:10px;padding:15px;text-align:center;margin-bottom:20px"><div style="color:#92400e;font-size:13px;font-weight:600">المبلغ المطلوب تحصيله</div><div style="color:#d97706;font-size:28px;font-weight:900;margin-top:5px">' + (Number(r.total)||0).toFixed(0) + ' ر.ي</div></div>' : '') +
      '<table style="width:100%;margin-bottom:20px;border-collapse:collapse;font-size:14px">' +
        '<tr><td style="padding:8px;color:#666;width:35%;background:#f9fafb;font-weight:600">👤 العميل:</td><td style="padding:8px;font-weight:bold">' + esc(r.customerName || '—') + '</td></tr>' +
        '<tr><td style="padding:8px;color:#666;background:#f9fafb;font-weight:600">📱 الهاتف:</td><td style="padding:8px">' + esc(r.customerPhone || '—') + '</td></tr>' +
        '<tr><td style="padding:8px;color:#666;background:#f9fafb;font-weight:600">🚚 المندوب:</td><td style="padding:8px">' + esc(r.deliveryMgrName || '—') + '</td></tr>' +
        '<tr><td style="padding:8px;color:#666;background:#f9fafb;font-weight:600">📅 الإرسال:</td><td style="padding:8px">' + dateStr + '</td></tr>' +
        '<tr><td style="padding:8px;color:#666;background:#f9fafb;font-weight:600">💳 الدفع:</td><td style="padding:8px">' + (isCOD ? '💰 دفع عند الاستلام' : '✅ مدفوع مسبقاً') + '</td></tr>' +
      '</table>' +
      '<h3 style="color:#f59e0b;border-top:2px solid #e5e7eb;padding-top:15px">🛒 المنتجات (' + items.length + ')</h3>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="background:#f59e0b;color:#fff">' +
          '<th style="padding:10px;text-align:right;border:1px solid #d97706">المنتج</th>' +
          '<th style="padding:10px;text-align:center;border:1px solid #d97706">الكمية</th>' +
          '<th style="padding:10px;text-align:center;border:1px solid #d97706">السعر</th>' +
          '<th style="padding:10px;text-align:center;border:1px solid #d97706">المجموع</th>' +
        '</tr></thead><tbody>' +
        items.map(function(it){ return '<tr>' +
          '<td style="padding:8px;border:1px solid #ddd">' + esc(it.name || '—') + '</td>' +
          '<td style="padding:8px;border:1px solid #ddd;text-align:center">' + (it.qty || 1) + '</td>' +
          '<td style="padding:8px;border:1px solid #ddd;text-align:center">' + (it.price || 0) + '</td>' +
          '<td style="padding:8px;border:1px solid #ddd;text-align:center">' + ((it.price||0)*(it.qty||1)) + '</td>' +
        '</tr>'; }).join('') +
      '</tbody></table>' +
      '<div style="margin-top:20px;padding:15px;background:#fef3c7;border-radius:10px;text-align:left;font-size:20px;font-weight:bold;border:2px solid #f59e0b">' +
        'الإجمالي: ' + (Number(r.total)||0).toFixed(0) + ' ر.ي' +
      '</div>' +
      '<div style="text-align:center;margin-top:40px;color:#999;font-size:12px;border-top:1px solid #eee;padding-top:20px">' +
        '<p>CHIZEN — نظام محاسبي</p>' +
        '<p style="font-size:10px">تم الإنشاء: ' + new Date().toLocaleString('ar') + '</p>' +
      '</div></div>';
      
    var el = document.createElement('div');
    el.innerHTML = htmlStr;
    html2pdf().from(el).set({
      margin: 10,
      filename: 'CHIZEN-RECEIPT-' + (r.orderNumber || '') + '.pdf',
      image: {type:'jpeg', quality:0.98},
      html2canvas: {scale:2, useCORS:true},
      jsPDF: {unit:'mm', format:'a4', orientation:'p'}
    }).save().then(function(){ console.log('PDF saved'); }).catch(function(e){ alert('❌ ' + e.message); });
  };
  
  console.log('[ACC-RECEIPTS] Ready');
})();
