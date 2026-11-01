// ═══════════════════════════════════════════════════
//  إدارة مواقع التسليم — بنية config/pickup_areas
//  { aden: [...], yemen: [...], updatedAt }
// ═══════════════════════════════════════════════════
(function(){
  'use strict';

  if (typeof window.db === 'undefined' || typeof window.firebase === 'undefined') {
    setTimeout(arguments.callee, 300);
    return;
  }

  var db = window.db;
  var toast = window.toast || function(m){ alert(m); };
  var showModal = window.showModal || function(t,c){ alert(t + '\n' + c); };
  var closeModal = window.closeModal || function(){ var ov=document.querySelector('.vmodal-ov,.acc-modal-ov,.vmodal'); if(ov) ov.remove(); };
  var esc = window.esc || function(s){ return String(s||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];}); };

  var TABS = [
    { key: 'aden',  label: '🌊 عدن' },
    { key: 'yemen', label: '🏛️ اليمن' }
  ];

  window.showPickupLocationsManager = async function(){
    try {
      var doc = await db.collection('config').doc('pickup_areas').get();
      var data = doc.exists ? doc.data() : {};
      var aden = Array.isArray(data.aden) ? data.aden : [];
      var yemen = Array.isArray(data.yemen) ? data.yemen : [];

      var html = '';
      html += '<div style="font-size:12px;color:#a78bfa;margin-bottom:10px;text-align:center;line-height:1.5">إدارة مناطق الاستلام والنقاط التي يراها العميل في تطبيقه</div>';
      
      html += '<div style="display:flex;gap:6px;margin-bottom:14px">';
      html += '<button id="pkm-tab-aden" onclick="window.__pickupSwitchTab(\'aden\')" style="flex:1;padding:10px;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;border:1.5px solid #a855f7;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff">🌊 عدن (' + aden.length + ')</button>';
      html += '<button id="pkm-tab-yemen" onclick="window.__pickupSwitchTab(\'yemen\')" style="flex:1;padding:10px;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;border:1.5px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#a78bfa">🏛️ اليمن (' + yemen.length + ')</button>';
      html += '</div>';

      html += '<div id="pkm-aden-panel" style="display:block">';
      html += __renderTab(aden, 'aden');
      html += '</div>';

      html += '<div id="pkm-yemen-panel" style="display:none">';
      html += __renderTab(yemen, 'yemen');
      html += '</div>';

      window.__pickupData = { aden: aden, yemen: yemen };
      showModal('📍 مواقع التسليم', html);
    } catch(e){ toast('❌ ' + e.message, 'error'); }
  };

  function __renderTab(list, region){
    var h = '';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    h += '<div style="font-size:13px;color:#a78bfa;font-weight:800">' + list.length + ' منطقة</div>';
    h += '<button onclick="window.__pickupAddArea(\'' + region + '\')" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;padding:9px 14px;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">➕ منطقة</button>';
    h += '</div>';
    h += '<div style="max-height:55vh;overflow-y:auto">';
    if (!list.length) {
      h += '<div style="text-align:center;padding:30px 20px;color:#a78bfa;font-size:13px">لا توجد مناطق بعد</div>';
    } else {
      list.forEach(function(area, i){
        var points = area.points || [];
        h += '<div style="background:rgba(155,77,255,0.05);border:1px solid rgba(155,77,255,0.2);border-radius:12px;padding:12px;margin-bottom:10px">';
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">';
        h += '<div style="flex:1;min-width:0">';
        h += '<div style="font-size:13px;font-weight:800;color:#fff">' + (area.icon||'📍') + ' ' + esc(area.name||'—') + '</div>';
        h += '<div style="font-size:11px;color:#a78bfa;margin-top:2px">📍 ' + esc(area.city||'—') + ' · ' + points.length + ' نقطة</div>';
        h += '</div></div>';
        
        if (points.length) {
          h += '<div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:8px;margin-bottom:8px">';
          points.forEach(function(pt, pi){
            h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(155,77,255,0.08);gap:6px">';
            h += '<div style="flex:1;min-width:0;font-size:11px;color:#e5e7eb">' + (pt.icon||'📦') + ' ' + esc(pt.name||'—') + '</div>';
            h += '<button onclick="window.__pickupDelPoint(\'' + region + '\',' + i + ',' + pi + ')" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);padding:3px 8px;border-radius:6px;font-size:10px;cursor:pointer;font-family:inherit">✕</button>';
            h += '</div>';
          });
          h += '</div>';
        }
        
        h += '<div style="display:flex;gap:6px">';
        h += '<button onclick="window.__pickupEditArea(\'' + region + '\',' + i + ')" style="flex:1;background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);padding:8px;border-radius:8px;font-weight:800;font-size:11px;cursor:pointer;font-family:inherit">✏️ تعديل</button>';
        h += '<button onclick="window.__pickupAddPoint(\'' + region + '\',' + i + ')" style="flex:1;background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);padding:8px;border-radius:8px;font-weight:800;font-size:11px;cursor:pointer;font-family:inherit">➕ نقطة</button>';
        h += '<button onclick="window.__pickupDelArea(\'' + region + '\',' + i + ')" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);padding:8px 10px;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit">🗑</button>';
        h += '</div></div>';
      });
    }
    h += '</div>';
    return h;
  }

  window.__pickupSwitchTab = function(tab){
    var aden = document.getElementById('pkm-aden-panel');
    var yemen = document.getElementById('pkm-yemen-panel');
    var btA = document.getElementById('pkm-tab-aden');
    var btY = document.getElementById('pkm-tab-yemen');
    if (!aden || !yemen) return;
    if (tab === 'aden') {
      aden.style.display = 'block';
      yemen.style.display = 'none';
      btA.style.background = 'linear-gradient(135deg,#a855f7,#7c3aed)';
      btA.style.color = '#fff'; btA.style.borderColor = '#a855f7';
      btY.style.background = 'rgba(0,0,0,0.3)';
      btY.style.color = '#a78bfa'; btY.style.borderColor = 'rgba(155,77,255,0.3)';
    } else {
      aden.style.display = 'none';
      yemen.style.display = 'block';
      btY.style.background = 'linear-gradient(135deg,#a855f7,#7c3aed)';
      btY.style.color = '#fff'; btY.style.borderColor = '#a855f7';
      btA.style.background = 'rgba(0,0,0,0.3)';
      btA.style.color = '#a78bfa'; btA.style.borderColor = 'rgba(155,77,255,0.3)';
    }
  };

  async function __pickupSave(region, newList){
    try {
      var updates = {};
      updates[region] = newList;
      updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('config').doc('pickup_areas').set(updates, { merge: true });
      window.__pickupData[region] = newList;
      window.showPickupLocationsManager();
    } catch(e){ toast('❌ ' + e.message, 'error'); }
  }

  window.__pickupAddArea = function(region){
    var name = prompt('اسم المنطقة:');
    if (!name || !name.trim()) return;
    var city = prompt('المدينة:', region === 'aden' ? 'عدن' : 'صنعاء');
    if (!city || !city.trim()) return;
    var icon = prompt('أيقونة (🌊 🏛️ 🏢 🏪 💊 📍):', '📍') || '📍';
    var lat = parseFloat(prompt('Latitude (اختياري):') || '0') || 0;
    var lng = parseFloat(prompt('Longitude (اختياري):') || '0') || 0;
    var area = { name: name.trim(), city: city.trim(), icon: icon.trim(), lat: lat, lng: lng, points: [] };
    var newList = (window.__pickupData[region] || []).slice();
    newList.push(area);
    __pickupSave(region, newList);
  };

  window.__pickupEditArea = function(region, idx){
    var list = (window.__pickupData[region] || []).slice();
    var a = list[idx];
    if (!a) return;
    var name = prompt('اسم المنطقة:', a.name);
    if (name === null) return;
    var city = prompt('المدينة:', a.city);
    if (city === null) return;
    var icon = prompt('أيقونة:', a.icon || '📍') || a.icon || '📍';
    a.name = name.trim() || a.name;
    a.city = city.trim() || a.city;
    a.icon = icon.trim();
    __pickupSave(region, list);
  };

  window.__pickupDelArea = function(region, idx){
    if (!confirm('⚠️ حذف هذه المنطقة وكل نقاطها؟')) return;
    var list = (window.__pickupData[region] || []).slice();
    list.splice(idx, 1);
    __pickupSave(region, list);
  };

  window.__pickupAddPoint = function(region, areaIdx){
    var list = (window.__pickupData[region] || []).slice();
    var area = list[areaIdx];
    if (!area) return;
    var name = prompt('اسم النقطة:');
    if (!name || !name.trim()) return;
    var icon = prompt('أيقونة (🏪 🏢 🏬 📦):', '📦') || '📦';
    var lat = parseFloat(prompt('Latitude (اختياري):') || '0') || (area.lat || 0);
    var lng = parseFloat(prompt('Longitude (اختياري):') || '0') || (area.lng || 0);
    area.points = area.points || [];
    area.points.push({ name: name.trim(), icon: icon.trim(), lat: lat, lng: lng });
    __pickupSave(region, list);
  };

  window.__pickupDelPoint = function(region, areaIdx, pointIdx){
    if (!confirm('⚠️ حذف هذه النقطة؟')) return;
    var list = (window.__pickupData[region] || []).slice();
    var area = list[areaIdx];
    if (!area || !area.points) return;
    area.points.splice(pointIdx, 1);
    __pickupSave(region, list);
  };

  console.log('[PICKUP-MANAGER v2] Loaded — using config/pickup_areas structure');
})();
