/* ═══ CHIZEN Admin Runtime Fixes ═══ */
(function() {
  var fixed = false;
  function apply() {
    if (!window.A) { setTimeout(apply, 200); return; }
    if (fixed) return;
    fixed = true;
    var A = window.A;
    
    /* ═══ 1. حفظ السند QR في Firestore ═══ */
    A._saveVerification = async function(order) {
      try {
        var safeId = String(order.id).replace(/[^a-zA-Z0-9_-]/g, '_');
        var itemCount = (order.items || []).reduce(function(s, i){ return s + (i.qty || 0); }, 0);
        await window.FB.db.collection('verifications').doc(safeId).set({
          orderId: order.id, customerName: order.name || '',
          customerPhone: order.phone || '', pickup: order.pickup || '',
          pickupLabel: order.pickup || '', total: order.total || 0,
          status: order.status || 'pending', itemCount: itemCount,
          savedAt: firebase.firestore.FieldValue.serverTimestamp(),
          savedBy: window.FB.currentUser ? window.FB.currentUser.email : ''
        }, { merge: true });
      } catch(e) { console.warn('verify save:', e); }
    };
    
    /* ═══ 2. تقرير PDF للطلبات ═══ */
    A.exportOrdersPDF = function() {
      if (!this.orders.length) { this.toast('لا طلبات', 'err'); return; }
      var esc2 = function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
      var html = '<html dir="rtl"><head><meta charset="UTF-8"><title>الطلبات</title><style>body{font-family:Cairo,sans-serif;padding:20px;background:#f5f5f5;}table{width:100%;border-collapse:collapse;font-size:12px;background:white;}th,td{border:1px solid #ddd;padding:6px;text-align:right;}th{background:#EC4899;color:white;}@media print{button{display:none;}}</style></head><body><h2>تقرير الطلبات — CHIZEN</h2><p>التاريخ: ' + new Date().toLocaleString('ar-EG') + ' | العدد: ' + this.orders.length + '</p><table><thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>التسليم</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>';
      this.orders.forEach(function(o) {
        var st = {pending:'قيد المعالجة',shipped:'في الطريق',completed:'مكتمل',cancelled:'ملغي'}[o.status] || o.status;
        html += '<tr><td>' + (o.id||'').slice(0,12) + '</td><td>' + esc2(o.name) + '</td><td style="direction:ltr;">' + esc2(o.phone) + '</td><td>' + esc2(o.pickup) + '</td><td>' + (o.total||0) + '</td><td>' + st + '</td></tr>';
      });
      html += '</tbody></table><div style="text-align:center;margin-top:20px;"><button onclick="window.print()" style="padding:10px 30px;background:#EC4899;color:white;border:none;border-radius:10px;font-weight:900;cursor:pointer;">🖨️ طباعة</button></div></body></html>';
      var w = window.open('', '_blank'); w.document.write(html); w.document.close();
    };
    
    /* ═══ 3. إرسال سند الطلب عبر واتساب ═══ */
    A.sendReceipt = async function(orderId) {
      var o = null;
      this.orders.forEach(function(x){ if (String(x.id) === String(orderId)) o = x; });
      if (!o) return;
      if (!o.phone) { this.toast('لا يوجد هاتف', 'err'); return; }
      var phone = String(o.phone).replace(/\D/g, '');
      if (phone.length === 9 && !phone.startsWith('967')) phone = '967' + phone;
      var msg = 'مرحباً ' + (o.name||'') + ' 👋\n\n🎫 سند استلام طلبك من CHIZEN\n━━━━━━━━━━━━━━━\n📋 رقم الطلب: #' + o.id + '\n💰 الإجمالي: ' + o.total + ' ر.س\n📍 نقطة التسليم: ' + (o.pickup||'') + '\n━━━━━━━━━━━━━━━\n\nشكراً لتسوقك ❤️';
      window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
    };
    
    /* ═══ 4. طباعة/تحميل سند الطلب ═══ */
    A.exportReceipt = function(orderId) {
      var o = null;
      this.orders.forEach(function(x){ if (String(x.id) === String(orderId)) o = x; });
      if (!o) return;
      var esc2 = function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
      var html = '<html dir="rtl"><head><meta charset="UTF-8"><title>سند ' + o.id + '</title><style>body{font-family:Cairo,sans-serif;padding:20px;background:#f5f5f5;}.card{max-width:500px;margin:20px auto;background:white;padding:30px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1);}.logo{text-align:center;font-size:32px;font-weight:900;background:linear-gradient(135deg,#FB923C,#EC4899,#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px;}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed #ddd;}.label{color:#666;}.value{font-weight:900;}@media print{button{display:none;}}</style></head><body><div class="card"><div class="logo">CHIZEN</div><div style="text-align:center;color:#666;margin-bottom:20px;">سند استلام الطلب</div>';
      html += '<div class="row"><span class="label">رقم الطلب</span><span class="value" style="color:#EC4899;">#' + o.id + '</span></div>';
      html += '<div class="row"><span class="label">العميل</span><span class="value">' + esc2(o.name) + '</span></div>';
      html += '<div class="row"><span class="label">الهاتف</span><span class="value" style="direction:ltr;">' + esc2(o.phone) + '</span></div>';
      html += '<div class="row"><span class="label">نقطة التسليم</span><span class="value" style="color:#10B981;">' + esc2(o.pickup) + '</span></div>';
      html += '<div class="row"><span class="label">الإجمالي</span><span class="value" style="color:#EC4899;font-size:20px;">' + o.total + ' ر.س</span></div>';
      html += '<div style="text-align:center;margin-top:20px;color:#999;font-size:12px;">© 2025 CHIZEN</div>';
      html += '<div style="text-align:center;margin-top:20px;"><button onclick="window.print()" style="padding:10px 30px;background:#EC4899;color:white;border:none;border-radius:10px;font-weight:900;cursor:pointer;">🖨️ طباعة</button></div></div></body></html>';
      var w = window.open('', '_blank'); w.document.write(html); w.document.close();
    };
    
    /* ═══ 5. تقرير PDF للموردين ═══ */
    A.exportAllSuppliersPDF = function() {
      if (!this.sups.length) { this.toast('لا موردين', 'err'); return; }
      var esc2 = function(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
      var html = '<html dir="rtl"><head><meta charset="UTF-8"><title>الموردين</title><style>body{font-family:Cairo,sans-serif;padding:20px;background:#f5f5f5;}table{width:100%;border-collapse:collapse;background:white;}th,td{border:1px solid #ddd;padding:8px;text-align:right;}th{background:#EC4899;color:white;}@media print{button{display:none;}}</style></head><body><h2>تقرير الموردين — CHIZEN</h2><p>' + new Date().toLocaleString('ar-EG') + '</p><table><thead><tr><th>#</th><th>المورد</th><th>الهاتف</th><th>الرصيد</th><th>المنتجات</th></tr></thead><tbody>';
      this.sups.forEach(function(s, i) {
        html += '<tr><td>' + (i+1) + '</td><td>' + esc2(s.name) + '</td><td style="direction:ltr;">' + esc2(s.phone) + '</td><td>' + (s.balance||0).toLocaleString() + ' ر.س</td><td>' + (s.products||[]).length + '</td></tr>';
      });
      html += '</tbody></table><div style="text-align:center;margin-top:20px;"><button onclick="window.print()" style="padding:10px 30px;background:#EC4899;color:white;border:none;border-radius:10px;font-weight:900;cursor:pointer;">🖨️ طباعة</button></div></body></html>';
      var w = window.open('', '_blank'); w.document.write(w.document); w.document.write(html); w.document.close();
    };
    
    /* ═══ 6. تقرير شهري للديون ═══ */
    A.openMonthlyReport = function(supIdx) {
      if (supIdx === null || supIdx === undefined) {
        var totalDebt = this.sups.reduce(function(s, x){ return s + Math.max(0, x.balance || 0); }, 0);
        var body = '<div class="sg"><div class="scd"><div class="sl">إجمالي المستحق</div><div class="sv" style="color:var(--rd);">' + totalDebt.toLocaleString() + ' ر.س</div></div><div class="scd"><div class="sl">عدد الموردين</div><div class="sv">' + this.sups.length + '</div></div></div>';
        this.sups.forEach(function(s) {
          if ((s.balance||0) > 0) body += '<div class="rw"><div class="ri"><div class="rti">' + (s.name||'') + '</div><div class="rs" style="color:var(--rd);font-weight:900;">' + s.balance.toLocaleString() + ' ر.س</div></div></div>';
        });
        this.modal('📊 تقرير شهري', body, '<button class="btn bg2" onclick="A.cm()">إغلاق</button>');
      } else {
        var s = this.sups[supIdx];
        if (!s) return;
        var now = new Date();
        var hist = (s.history || []).filter(function(h) {
          var d = new Date(h.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        var ordT = hist.filter(function(h){ return h.type === 'order'; }).reduce(function(a,b){ return a + b.amount; }, 0);
        var payT = hist.filter(function(h){ return h.type === 'payment'; }).reduce(function(a,b){ return a + b.amount; }, 0);
        var body2 = '<div class="dr"><span class="dl">توريدات الشهر</span><span class="dv" style="color:var(--rd);">+' + ordT.toLocaleString() + ' ر.س</span></div><div class="dr"><span class="dl">دفعات الشهر</span><span class="dv" style="color:var(--gn);">-' + payT.toLocaleString() + ' ر.س</span></div><div class="dr"><span class="dl">الصافي</span><span class="dv" style="color:var(--pk);font-size:16px;">' + (ordT - payT).toLocaleString() + ' ر.س</span></div>';
        this.modal('📊 ' + (s.name||''), body2, '<button class="btn bg2" onclick="A.cm()">إغلاق</button>');
      }
    };
    
    /* ═══ 7. سند توريد المورد (صورة) ═══ */
    A.genSupplyBlob = async function(sup, items, orderId, oldBal, newBal) {
      try {
        if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise(function(r){ setTimeout(r, 2000); })]);
        var W = 900, H = 800 + items.length * 60;
        var canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
        var ctx = canvas.getContext('2d'); ctx.textBaseline = 'top';
        var bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#0A0515'); bgGrad.addColorStop(1, '#1F0D35');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);
        var topBar = ctx.createLinearGradient(50, 0, W-50, 0);
        topBar.addColorStop(0, '#ff9a4e'); topBar.addColorStop(0.5, '#ff20c6'); topBar.addColorStop(1, '#00cfff');
        ctx.fillStyle = topBar; ctx.fillRect(60, 60, W-120, 8);
        ctx.textAlign = 'center'; ctx.font = 'bold 60px "Playfair Display",Georgia,serif'; ctx.fillStyle = '#EC4899'; ctx.fillText('CHIZEN', W/2, 100);
        ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#8B7AA8'; ctx.fillText('سند توريد — ' + orderId, W/2, 180);
        var y = 250;
        ctx.textAlign = 'right'; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#8B7AA8'; ctx.fillText('المورد:', W-80, y);
        ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#F5E6FF'; ctx.fillText(sup.name, W-80, y+25);
        ctx.textAlign = 'left'; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#8B7AA8'; ctx.fillText('التاريخ:', 80, y);
        ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#F5E6FF'; ctx.fillText(new Date().toLocaleDateString('ar-EG'), 80, y+25);
        y += 90; ctx.textAlign = 'right'; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#EC4899'; ctx.fillText('المنتجات:', W-80, y); y += 40;
        items.forEach(function(item) {
          ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(80, y-5, W-160, 50);
          ctx.textAlign = 'right'; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#F5E6FF'; ctx.fillText(item.name.slice(0, 30), W-110, y+5);
          ctx.font = '14px sans-serif'; ctx.fillStyle = '#8B7AA8'; ctx.fillText(item.qty + ' × ' + item.pp + ' ر.س', W-110, y+28);
          ctx.textAlign = 'left'; ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#EC4899'; ctx.fillText((item.qty * item.pp) + ' ر.س', 110, y+15);
          y += 60;
        });
        y += 20; ctx.fillStyle = 'rgba(236,72,153,0.2)'; ctx.fillRect(80, y, W-160, 60);
        ctx.textAlign = 'right'; ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#F5E6FF'; ctx.fillText('الإجمالي:', W-130, y+18);
        ctx.textAlign = 'left'; ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#EC4899';
        ctx.fillText(items.reduce(function(s,i){ return s + i.qty*i.pp; }, 0) + ' ر.س', 130, y+15);
        y += 90; ctx.textAlign = 'center'; ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#00d4a0'; ctx.fillText('الرصيد بعد التوريد: ' + newBal.toLocaleString() + ' ر.س', W/2, y);
        return new Promise(function(resolve){ canvas.toBlob(function(b){ resolve(b); }, 'image/png', 0.95); });
      } catch(e) { console.error(e); return null; }
    };
    
    /* ═══ 8. ربط _saveVerification تلقائياً عند عرض الطلب ═══ */
    var origOrderDetails = A.orderDetails;
    A.orderDetails = function(id) {
      var o = null; this.orders.forEach(function(x){ if (String(x.id) === String(id)) o = x; });
      if (o) try { this._saveVerification(o); } catch(e) {}
      return origOrderDetails.call(this, id);
    };
    
    console.log('✅ CHIZEN Admin Fixes Applied (7 functions)');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(apply, 500); });
  } else {
    setTimeout(apply, 500);
  }
})();
