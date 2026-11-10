(function(){
  'use strict';
  if (typeof window.db === 'undefined' || typeof window.firebase === 'undefined') {
    setTimeout(arguments.callee, 300);
    return;
  }
  var db = window.db;
  var toast = window.toast || function(m){ alert(m); };
  var showModal = window.showModal || function(t,c){ alert(t + '\n' + c); };
  var closeModal = window.closeModal || function(){ var ov=document.querySelector('.vmodal-ov,.acc-modal-ov'); if(ov) ov.remove(); };
  var esc = window.esc || function(s){ return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];}); };

  function field(id, label, value, type){
    return '<div style="margin-bottom:10px"><label style="display:block;font-size:11px;font-weight:700;color:#a78bfa;margin-bottom:4px">' + label + '</label><input id="' + id + '" type="' + (type||'text') + '" value="' + esc(String(value==null?'':value)) + '" style="width:100%;padding:10px;border-radius:9px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#fff;font-family:inherit;font-size:13px;box-sizing:border-box"></div>';
  }
  function textarea(id, label, value){
    return '<div style="margin-bottom:10px"><label style="display:block;font-size:11px;font-weight:700;color:#a78bfa;margin-bottom:4px">' + label + '</label><textarea id="' + id + '" style="width:100%;min-height:60px;padding:10px;border-radius:9px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#fff;font-family:inherit;font-size:13px;box-sizing:border-box;resize:vertical">' + esc(value||'') + '</textarea></div>';
  }

  window.__showSettingsFull = async function(){
    try {
      var doc = await db.collection('config').doc('settings').get();
      var s = doc.exists ? doc.data() : {};
      var cr = s.commission_rates || {};
      
      var html = '<div style="text-align:right;max-height:70vh;overflow-y:auto;padding:2px;font-size:13px">';
      
      html += '<div style="font-weight:900;color:#a78bfa;margin-bottom:8px">🏪 معلومات المتجر</div>';
      html += field('s-store-name', 'اسم المتجر', s.storeName || 'CHIZEN');

      // ═══ العملة الأساسية ═══
      var cur = s.currency || 'SAR';
      html += '<label style="display:block;font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:6px">💱 العملة الأساسية للعرض</label>';
      html += '<select id="s-currency" style="width:100%;padding:12px 14px;background:rgba(10,8,37,0.7);border:1px solid rgba(155,77,255,0.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box">';
      html += '<option value="SAR"' + (cur === 'SAR' ? ' selected' : '') + '>🇸🇦 ريال سعودي (SAR)</option>';
      html += '<option value="YER"' + (cur === 'YER' ? ' selected' : '') + '>🇾🇪 ريال يمني (YER)</option>';
      html += '<option value="USD"' + (cur === 'USD' ? ' selected' : '') + '>🇺🇸 دولار أمريكي (USD)</option>';
      html += '</select>';
      html += field('s-slogan', 'الشعار (Tagline)', s.slogan || 'متجرك الموثوق');
      html += field('s-contact-phone', 'هاتف التواصل', s.contactPhone || '');
      html += field('s-contact-wa', 'واتساب التواصل', s.contactWhatsapp || '');
      html += field('s-contact-email', 'البريد الإلكتروني', s.contactEmail || '');
      html += field('s-hours', 'ساعات العمل', s.storeHours || '9:00 - 22:00');
      
      html += '<div style="font-weight:900;color:#a78bfa;margin:14px 0 8px">🎉 رسالة الترحيب</div>';
      html += field('s-welcome-title', 'عنوان الترحيب', s.welcomeTitle || '🎉 أهلاً بك في CHIZEN!');
      html += textarea('s-welcome-body', 'نص الترحيب', s.welcomeBody || 'شكراً لانضمامك. استمتع بتجربة تسوق ذكية!');
      html += field('s-welcome-coupon', 'قيمة كوبون الترحيب (%)', s.welcomeCoupon || 15, 'number');
      
      html += '<div style="font-weight:900;color:#a78bfa;margin:14px 0 8px">💰 نسب العمولات</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
      html += field('s-cr-delivery', 'المندوب (ر.ي/طلب)', cr.delivery_mgr || 10, 'number');
      html += field('s-cr-catmgr', 'مدير القسم (%)', cr.cat_manager || 5, 'number');
      html += field('s-cr-bookings', 'مدير الحجوزات (%)', cr.bookings_mgr || 2, 'number');
      html += field('s-cr-accountant', 'المحاسب (%)', cr.accountant || 0, 'number');
      html += '</div>';
      
      html += '<div style="font-weight:900;color:#a78bfa;margin:14px 0 8px">📦 المخزون</div>';
      html += field('s-low-stock', 'حد التنبيه الافتراضي', s.lowStockThreshold || 5, 'number');
      
      html += '<div style="font-weight:900;color:#a78bfa;margin:14px 0 8px">💳 طرق الدفع المتاحة</div>';
      var pms = s.paymentMethods || ['cod', 'cash'];
      var allPms = [
        {id:'cod', label:'💰 الدفع عند الاستلام'},
        {id:'cash', label:'💵 نقدي'},
        {id:'wallet', label:'📱 محفظة إلكترونية'},
        {id:'bank', label:'🏦 تحويل بنكي'}
      ];
      allPms.forEach(function(pm){
        var checked = pms.indexOf(pm.id) !== -1;
        html += '<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(0,0,0,0.2);border-radius:10px;margin-bottom:6px;cursor:pointer"><input type="checkbox" data-pm="' + pm.id + '" ' + (checked?'checked':'') + ' style="width:18px;height:18px;accent-color:#22c55e;cursor:pointer"><span style="font-size:13px;color:#fff;font-weight:700">' + pm.label + '</span></label>';
      });
      
      html += '<button onclick="window.__saveSettingsFull()" style="width:100%;padding:14px;border-radius:10px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit;margin-top:16px">💾 حفظ كل الإعدادات</button>';
      html += '</div>';
      

      // ═══ قسم الصرف (جديد) ═══
      html += '<div style="font-weight:900;color:#3b82f6;margin:16px 0 8px">💱 إعدادات سعر الصرف (شمال/جنوب)</div>';
      var rates = s.rates || {};
      html += '<div style="background:rgba(59,130,246,0.08);padding:12px;border-radius:10px;margin-bottom:10px;border:1px solid rgba(59,130,246,0.2)">';
      html += '<div style="font-size:12px;font-weight:800;color:#10b981;margin-bottom:6px">🌍 صرف الجنوب (عدن - حضرموت)</div>';
      html += field('s-rate-sar-south', 'سعر السعودي (جنوب)', rates.sarSouth || 350, 'number');
      html += field('s-rate-usd-south', 'سعر الدولار (جنوب)', rates.usdSouth || 1300, 'number');
      html += '</div>';
      html += '<div style="background:rgba(245,158,11,0.08);padding:12px;border-radius:10px;margin-bottom:10px;border:1px solid rgba(245,158,11,0.2)">';
      html += '<div style="font-size:12px;font-weight:800;color:#f59e0b;margin-bottom:6px">🌍 صرف الشمال (صنعاء - تعز)</div>';
      html += field('s-rate-sar-north', 'سعر السعودي (شمال)', rates.sarNorth || 500, 'number');
      html += field('s-rate-usd-north', 'سعر الدولار (شمال)', rates.usdNorth || 2000, 'number');
      html += '</div>';
      html += '<button onclick="window.__saveRates()" style="width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-weight:900;font-size:14px;cursor:pointer;margin-bottom:10px">💾 حفظ أسعار الصرف</button>';
      
      showModal('⚙️ الإعدادات الكاملة', html);
    } catch(e){ toast('❌ ' + e.message, 'error'); }
  };
  
  window.__saveRates = async function(){
    try {
      var sarSouth = Number(document.getElementById('s-rate-sar-south').value) || 350;
      var usdSouth = Number(document.getElementById('s-rate-usd-south').value) || 1300;
      var sarNorth = Number(document.getElementById('s-rate-sar-north').value) || 500;
      var usdNorth = Number(document.getElementById('s-rate-usd-north').value) || 2000;

      await db.collection('config').doc('settings').set({
        rates: {
          sarSouth: sarSouth,
          usdSouth: usdSouth,
          sarNorth: sarNorth,
          usdNorth: usdNorth
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      toast('✅ تم حفظ أسعار الصرف', 'success');
      console.log('[RATES] saved:', { sarSouth, usdSouth, sarNorth, usdNorth });
    } catch(e) {
      toast('❌ فشل الحفظ: ' + e.message, 'error');
      console.error('[__saveRates] error:', e);
    }
  };

  window.__saveSettingsFull = async function(){
    try {
      var pms = [];
      document.querySelectorAll('[data-pm]').forEach(function(cb){ if(cb.checked) pms.push(cb.getAttribute('data-pm')); });
      
      var data = {
        storeName: document.getElementById('s-store-name').value.trim(),
        currency: (document.getElementById('s-currency') ? document.getElementById('s-currency').value : 'SAR'),
        slogan: document.getElementById('s-slogan').value.trim(),
        contactPhone: document.getElementById('s-contact-phone').value.trim(),
        contactWhatsapp: document.getElementById('s-contact-wa').value.trim(),
        contactEmail: document.getElementById('s-contact-email').value.trim(),
        storeHours: document.getElementById('s-hours').value.trim(),
        welcomeTitle: document.getElementById('s-welcome-title').value.trim(),
        welcomeBody: document.getElementById('s-welcome-body').value.trim(),
        welcomeCoupon: Number(document.getElementById('s-welcome-coupon').value) || 0,
        commission_rates: {
          delivery_mgr: Number(document.getElementById('s-cr-delivery').value) || 0,
          cat_manager: Number(document.getElementById('s-cr-catmgr').value) || 0,
          bookings_mgr: Number(document.getElementById('s-cr-bookings').value) || 0,
          accountant: Number(document.getElementById('s-cr-accountant').value) || 0
        },
        lowStockThreshold: Number(document.getElementById('s-low-stock').value) || 5,
        paymentMethods: pms,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('config').doc('settings').set(data, { merge: true });
      toast('✅ تم حفظ الإعدادات بنجاح', 'success');
      closeModal();
    } catch(e){ toast('❌ ' + e.message, 'error'); }
  };
  
  console.log('[SETTINGS-MANAGER] Loaded');
})();
