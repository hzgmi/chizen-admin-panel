// ═══════════════════════════════════════════════════
//  إدارة مواقع التسليم — ملف مستقل لضمان global scope
// ═══════════════════════════════════════════════════
(function(){
  'use strict';
  
  if (typeof window.db === 'undefined' || typeof window.firebase === 'undefined') {
    // ننتظر حتى تجهز Firebase
    setTimeout(arguments.callee, 300);
    return;
  }
  
  var db = window.db;
  var toast = window.toast || function(m){ alert(m); };
  var showModal = window.showModal || function(t,c){ alert(t + '\n' + c); };
  var closeModal = window.closeModal || function(){ var ov=document.querySelector('.vmodal-ov,.acc-modal-ov'); if(ov) ov.remove(); };
  var esc = window.esc || function(s){ return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];}); };
  
  window.showPickupLocationsManager = async function(){
    try {
      var doc = await db.collection('config').doc('pickup_locations').get();
      var data = doc.exists ? doc.data() : {};
      var list = data.list || [];
  
      var html = '';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px">';
      html += '<div style="font-size:13px;color:#a78bfa;font-weight:800">' + list.length + ' نقطة استلام</div>';
      html += '<button onclick="window.__addPickupLocation()" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;padding:10px 16px;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">➕ إضافة</button>';
      html += '</div>';
      html += '<div style="max-height:65vh;overflow-y:auto">';
  
      if (!list.length) {
        html += '<div style="text-align:center;padding:40px 20px;color:#a78bfa">';
        html += '<div style="font-size:48px;margin-bottom:12px;opacity:.5">📍</div>';
        html += '<div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:6px">لا توجد مواقع بعد</div>';
        html += '<div style="font-size:12px;opacity:.7">أضف أول نقطة استلام</div>';
        html += '</div>';
      } else {
        list.forEach(function(loc, i){
          var isActive = loc.active !== false;
          var activeLabel = isActive ? '<span style="color:#22c55e;font-size:10px;font-weight:800">● نشط</span>' : '<span style="color:#6b7280;font-size:10px;font-weight:800">○ معطل</span>';
          html += '<div style="padding:12px;background:rgba(155,77,255,0.05);border:1px solid rgba(155,77,255,0.2);border-radius:12px;margin-bottom:10px">';
          html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px">';
          html += '<div style="flex:1;min-width:0">';
          html += '<div style="font-size:13px;font-weight:800;color:#fff;margin-bottom:3px">' + esc(loc.name||'—') + '</div>';
          html += '<div style="font-size:11px;color:#a78bfa">' + esc(loc.city||'—') + (loc.address ? ' · ' + esc(loc.address) : '') + '</div>';
          if (loc.phone) html += '<div style="font-size:11px;color:#a78bfa;margin-top:2px">📱 ' + esc(loc.phone) + '</div>';
          html += '</div>';
          html += '<div style="text-align:left;flex-shrink:0">' + activeLabel + '</div>';
          html += '</div>';
          html += '<div style="display:flex;gap:6px">';
          html += '<button onclick="window.__editPickupLocation(' + i + ')" style="flex:1;background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);padding:8px;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">✏️</button>';
          html += '<button onclick="window.__togglePickupLocation(' + i + ')" style="flex:1;background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);padding:8px;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">' + (isActive ? '👁' : '👁') + '</button>';
          html += '<button onclick="window.__deletePickupLocation(' + i + ')" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);padding:8px 10px;border-radius:8px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit">🗑</button>';
          html += '</div></div>';
        });
      }
      html += '</div>';
      showModal('📍 مواقع التسليم (' + list.length + ')', html);
    } catch(e){ toast('❌ ' + e.message, 'error'); }
  };
  
  window.__addPickupLocation = function(){ window.__openPickupForm(null, -1); };
  
  window.__editPickupLocation = async function(index){
    try {
      var doc = await db.collection('config').doc('pickup_locations').get();
      var data = doc.exists ? doc.data() : {};
      var list = data.list || [];
      if (!list[index]) { toast('❌ غير موجود', 'error'); return; }
      window.__openPickupForm(list[index], index);
    } catch(e){ toast('❌ ' + e.message, 'error'); }
  };
  
  window.__openPickupForm = function(loc, index){
    var isEdit = loc !== null && index >= 0;
    var l = loc || {};
    var html = '<div style="text-align:right;max-height:70vh;overflow-y:auto;padding:2px;font-size:13px">';
    html += '<input id="pupf-name" placeholder="اسم النقطة *" value="' + esc(l.name||'') + '" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#fff;font-family:inherit;font-size:14px;margin-bottom:10px;box-sizing:border-box">';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">';
    html += '<input id="pupf-city" placeholder="المدينة *" value="' + esc(l.city||'') + '" style="padding:12px;border-radius:10px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#fff;font-family:inherit;font-size:14px;box-sizing:border-box">';
    html += '<input id="pupf-phone" placeholder="هاتف النقطة" value="' + esc(l.phone||'') + '" style="padding:12px;border-radius:10px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#fff;font-family:inherit;font-size:14px;box-sizing:border-box">';
    html += '</div>';
    html += '<textarea id="pupf-address" placeholder="العنوان" style="width:100%;min-height:60px;padding:12px;border-radius:10px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#fff;font-family:inherit;font-size:14px;margin-bottom:10px;box-sizing:border-box;resize:vertical">' + esc(l.address||'') + '</textarea>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">';
    html += '<input id="pupf-lat" type="number" step="0.0001" placeholder="Latitude" value="' + (l.lat||'') + '" style="padding:12px;border-radius:10px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#fff;font-family:inherit;font-size:13px;box-sizing:border-box">';
    html += '<input id="pupf-lng" type="number" step="0.0001" placeholder="Longitude" value="' + (l.lng||'') + '" style="padding:12px;border-radius:10px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#fff;font-family:inherit;font-size:13px;box-sizing:border-box">';
    html += '</div>';
    html += '<button onclick="window.__savePickupLocation(' + index + ')" style="width:100%;padding:14px;border-radius:10px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit">💾 ' + (isEdit ? 'حفظ التعديلات' : 'إضافة') + '</button>';
    html += '<div style="font-size:11px;color:#a78bfa;margin-top:10px;text-align:center;opacity:.7">💡 الإحداثيات اختيارية</div>';
    html += '</div>';
    showModal(isEdit ? '✏️ تعديل نقطة' : '➕ إضافة نقطة', html);
  };
  
  window.__savePickupLocation = async function(index){
    var name = document.getElementById('pupf-name').value.trim();
    var city = document.getElementById('pupf-city').value.trim();
    if (!name || !city) { toast('❌ الاسم والمدينة مطلوبان', 'error'); return; }
    var loc = {
      name: name, city: city,
      phone: document.getElementById('pupf-phone').value.trim(),
      address: document.getElementById('pupf-address').value.trim(),
      lat: parseFloat(document.getElementById('pupf-lat').value) || null,
      lng: parseFloat(document.getElementById('pupf-lng').value) || null,
      active: true
    };
    try {
      var doc = await db.collection('config').doc('pickup_locations').get();
      var data = doc.exists ? doc.data() : {};
      var list = data.list || [];
      if (index >= 0 && list[index]) {
        loc.active = list[index].active !== false;
        list[index] = Object.assign({}, list[index], loc);
      } else {
        list.push(loc);
      }
      await db.collection('config').doc('pickup_locations').set({ list: list }, { merge: true });
      toast(index >= 0 ? '✅ تم التحديث' : '✅ تمت الإضافة', 'success');
      closeModal();
      window.showPickupLocationsManager();
    } catch(e){ toast('❌ ' + e.message, 'error'); }
  };
  
  window.__togglePickupLocation = async function(index){
    try {
      var doc = await db.collection('config').doc('pickup_locations').get();
      var data = doc.exists ? doc.data() : {};
      var list = data.list || [];
      if (!list[index]) return;
      list[index].active = !(list[index].active !== false);
      await db.collection('config').doc('pickup_locations').set({ list: list }, { merge: true });
      toast(list[index].active ? '✅ نشطة' : '👁 معطلة', list[index].active ? 'success' : 'error');
      closeModal();
      window.showPickupLocationsManager();
    } catch(e){ toast('❌ ' + e.message, 'error'); }
  };
  
  window.__deletePickupLocation = async function(index){
    if (!confirm('⚠️ حذف هذه النقطة نهائياً؟')) return;
    try {
      var doc = await db.collection('config').doc('pickup_locations').get();
      var data = doc.exists ? doc.data() : {};
      var list = data.list || [];
      list.splice(index, 1);
      await db.collection('config').doc('pickup_locations').set({ list: list }, { merge: true });
      toast('✅ تم الحذف', 'success');
      closeModal();
      window.showPickupLocationsManager();
    } catch(e){ toast('❌ ' + e.message, 'error'); }
  };
  
  console.log('[PICKUP-MANAGER] Loaded successfully');
})();
