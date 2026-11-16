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
      html += '<button id="pkm-tab-yemen" onclick="window.__pickupSwitchTab(\'yemen\')" style="flex:1;padding:8px;border-radius:10px;font-weight:800;font-size:11px;cursor:pointer;font-family:inherit;border:1.5px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#a78bfa">🏛️ اليمن (' + yemen.length + ')</button>';
      html += '<button id="pkm-tab-intl" onclick="window.__pickupSwitchTab(\'international\')" style="flex:1;padding:8px;border-radius:10px;font-weight:800;font-size:11px;cursor:pointer;font-family:inherit;border:1.5px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.3);color:#a78bfa">🌍 دولي (' + (Array.isArray(data.international) ? data.international.length : 0) + ')</button>';
      html += '</div>';

      // ★ زر إيقاف/تشغيل الدولي ★
      var intlEnabled = data.internationalEnabled !== false;
      html += '<div style="margin-bottom:14px;display:flex;justify-content:flex-end;">';
      html += '<button onclick="window.__toggleInternational()" style="padding:10px 16px;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;border:1.5px solid ' + (intlEnabled ? '#ef4444' : '#22c55e') + ';background:' + (intlEnabled ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)') + ';color:' + (intlEnabled ? '#f87171' : '#4ade80') + ';">' + (intlEnabled ? '⏸️ إيقاف الدولي مؤقتاً' : '▶️ تشغيل الدولي') + '</button>';
      html += '</div>';

      html += '<div id="pkm-aden-panel" style="display:block">';
      html += __renderTab(aden, 'aden');
      html += '</div>';

      html += '<div id="pkm-yemen-panel" style="display:none">';
      html += __renderTab(yemen, 'yemen');
      html += '</div>';

      html += '<div id="pkm-intl-panel" style="display:none">';
      html += __renderTab(Array.isArray(data.international) ? data.international : [], 'international');
      html += '</div>';

      window.__pickupData = { aden: aden, yemen: yemen, international: Array.isArray(data.international) ? data.international : [] };
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
        var areaLabel = (area.country ? '[' + esc(area.country) + '] ' : '') + esc(area.name||'—');
        h += '<div style="font-size:13px;font-weight:800;color:#fff">' + (area.icon||'📍') + ' ' + areaLabel + '</div>';
        h += '<div style="font-size:11px;color:#a78bfa;margin-top:2px">📍 ' + esc(area.city||'—') + ' · ' + points.length + ' نقطة</div>';
        if (area.shippingFee !== undefined || area.deliveryTime) {
          h += '<div style="font-size:10px;color:#fbbf24;margin-top:2px">🚚 ' + (area.shippingFee ? area.shippingFee + ' ر.س' : 'مجاني') + (area.deliveryTime ? ' · ⏱ ' + esc(area.deliveryTime) : '') + '</div>';
        }
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
    var panels = {
      aden: document.getElementById('pkm-aden-panel'),
      yemen: document.getElementById('pkm-yemen-panel'),
      international: document.getElementById('pkm-intl-panel')
    };
    var tabs = {
      aden: document.getElementById('pkm-tab-aden'),
      yemen: document.getElementById('pkm-tab-yemen'),
      international: document.getElementById('pkm-tab-intl')
    };
    // لا نتوقف إذا كان أحد التبويبات غير موجود (نتعامل مع الموجود فقط)
    Object.keys(panels).forEach(function(k) {
      if (panels[k]) panels[k].style.display = (k === tab) ? 'block' : 'none';
      if (tabs[k]) {
        if (k === tab) {
          tabs[k].style.background = 'linear-gradient(135deg,#a855f7,#7c3aed)';
          tabs[k].style.color = '#fff';
          tabs[k].style.borderColor = '#a855f7';
        } else {
          tabs[k].style.background = 'rgba(0,0,0,0.3)';
          tabs[k].style.color = '#a78bfa';
          tabs[k].style.borderColor = 'rgba(155,77,255,0.3)';
        }
      }
    });
  };

  window.__toggleInternational = async function() {
    if (!confirm('هل تريد تغيير حالة الدولي؟')) return;
    try {
      var doc = await db.collection('config').doc('pickup_areas').get();
      var data = doc.exists ? doc.data() : {};
      var current = data.internationalEnabled !== false;
      data.internationalEnabled = !current;
      await db.collection('config').doc('pickup_areas').set({ internationalEnabled: data.internationalEnabled }, { merge: true });
      toast(data.internationalEnabled ? '✅ تم تشغيل الدولي' : '⏸️ تم إيقاف الدولي', 'success');
      window.showPickupLocationsManager();
    } catch(e) { toast('❌ ' + e.message, 'error'); }
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

  // ★ نافذة إدخال أنيقة (بدلاً من prompt) ★
  window.__showPickupForm = function(opts, onSubmit) {
    // opts: { title, fields: [{id, label, type, value, placeholder, options}], submitLabel }
    var overlay = document.createElement('div');
    overlay.className = 'pkm-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
    
    var fieldsHtml = opts.fields.map(function(f) {
      var inputHtml = '';
      if (f.type === 'select') {
        inputHtml = '<select id="pkm-f-' + f.id + '" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.4);color:#fff;font-family:inherit;font-size:14px;box-sizing:border-box;">' +
          f.options.map(function(o) { return '<option value="' + o.value + '"' + (o.value === f.value ? ' selected' : '') + '>' + o.label + '</option>'; }).join('') +
          '</select>';
      } else if (f.type === 'number') {
        inputHtml = '<input id="pkm-f-' + f.id + '" type="number" value="' + (f.value || '') + '" placeholder="' + (f.placeholder || '') + '" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.4);color:#fff;font-family:inherit;font-size:14px;box-sizing:border-box;">';
      } else {
        inputHtml = '<input id="pkm-f-' + f.id + '" type="text" value="' + (f.value || '') + '" placeholder="' + (f.placeholder || '') + '" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(155,77,255,0.3);background:rgba(0,0,0,0.4);color:#fff;font-family:inherit;font-size:14px;box-sizing:border-box;">';
      }
      return '<div style="margin-bottom:12px;"><label style="display:block;font-size:11px;font-weight:800;color:#a78bfa;margin-bottom:5px;">' + f.label + '</label>' + inputHtml + '</div>';
    }).join('');
    
    overlay.innerHTML = '<div style="background:#1a1535;border-radius:20px;padding:24px;max-width:400px;width:100%;color:#fff;border:1px solid rgba(155,77,255,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.6);direction:rtl;font-family:Tajawal,sans-serif;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<h3 style="margin:0;font-size:16px;font-weight:900;color:#fff;">' + opts.title + '</h3>' +
        '<button onclick="this.closest(\'.pkm-overlay\').remove()" style="background:transparent;border:none;color:#94a3b8;font-size:20px;cursor:pointer;">✕</button>' +
      '</div>' +
      fieldsHtml +
      '<div style="display:flex;gap:10px;margin-top:16px;">' +
        '<button id="pkm-submit" style="flex:1;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;font-weight:900;font-size:14px;cursor:pointer;font-family:inherit;">' + (opts.submitLabel || 'حفظ') + '</button>' +
        '<button onclick="this.closest(\'.pkm-overlay\').remove()" style="flex:1;padding:14px;border:none;border-radius:12px;background:rgba(0,0,0,0.3);color:#a78bfa;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;">إلغاء</button>' +
      '</div>' +
    '</div>';
    
    document.body.appendChild(overlay);
    
    document.getElementById('pkm-submit').onclick = function() {
      var result = {};
      opts.fields.forEach(function(f) {
        var el = document.getElementById('pkm-f-' + f.id);
        if (el) result[f.id] = el.value;
      });
      overlay.remove();
      onSubmit(result);
    };
  };

  window.__pickupAddArea = function(region){
    var isIntl = region === 'international';
    var fields = [
      { id: 'name', label: 'اسم المدينة', type: 'text', placeholder: 'مثال: الرياض' }
    ];
    if (isIntl) {
      fields.push({ id: 'country', label: 'الدولة', type: 'select', value: 'السعودية', options: [
        { value: 'السعودية', label: 'السعودية' }, { value: 'الإمارات', label: 'الإمارات' },
        { value: 'الكويت', label: 'الكويت' }, { value: 'قطر', label: 'قطر' },
        { value: 'البحرين', label: 'البحرين' }, { value: 'عمان', label: 'عمان' },
        { value: 'الأردن', label: 'الأردن' }, { value: 'مصر', label: 'مصر' }
      ]});
    }
    fields.push({ id: 'shippingFee', label: 'سعر الشحن (ر.س) - 0 للمجاني', type: 'number', value: isIntl ? 30 : 0 });
    fields.push({ id: 'deliveryTime', label: 'وقت التوصيل', type: 'text', value: isIntl ? '3-5 أيام' : '2-4 ساعات' });
    
    window.__showPickupForm({
      title: isIntl ? '➕ إضافة مدينة دولية' : '➕ إضافة منطقة',
      fields: fields,
      submitLabel: 'حفظ'
    }, function(data) {
      var area = {
        name: (data.name || '').trim(),
        points: [],
        shippingFee: parseFloat(data.shippingFee) || 0,
        deliveryTime: (data.deliveryTime || '').trim()
      };
      if (!area.name) { toast('❌ اسم المدينة مطلوب', 'error'); return; }
      if (isIntl) {
        area.country = (data.country || '').trim();
        area.city = area.name;
        area.icon = '🌍';
        area.lat = 0; area.lng = 0;
      } else {
        area.city = area.name;
        area.icon = region === 'aden' ? '🌊' : '🏛️';
        area.lat = 0; area.lng = 0;
      }
      var newList = (window.__pickupData[region] || []).slice();
      newList.push(area);
      __pickupSave(region, newList);
    });
  };

  window.__pickupEditArea = function(region, idx){
    var list = (window.__pickupData[region] || []).slice();
    var a = list[idx];
    if (!a) return;
    var isIntl = region === 'international';
    var fields = [
      { id: 'name', label: 'اسم المنطقة', type: 'text', value: a.name || '' },
      { id: 'city', label: 'المدينة', type: 'text', value: a.city || '' }
    ];
    if (isIntl) {
      fields.push({ id: 'country', label: 'الدولة', type: 'select', value: a.country || 'السعودية', options: [
        { value: 'السعودية', label: 'السعودية' }, { value: 'الإمارات', label: 'الإمارات' },
        { value: 'الكويت', label: 'الكويت' }, { value: 'قطر', label: 'قطر' },
        { value: 'البحرين', label: 'البحرين' }, { value: 'عمان', label: 'عمان' },
        { value: 'الأردن', label: 'الأردن' }, { value: 'مصر', label: 'مصر' }
      ]});
    }
    fields.push({ id: 'shippingFee', label: 'سعر الشحن (ر.س)', type: 'number', value: a.shippingFee || 0 });
    fields.push({ id: 'deliveryTime', label: 'وقت التوصيل', type: 'text', value: a.deliveryTime || '' });
    
    window.__showPickupForm({
      title: '✏️ تعديل ' + (isIntl ? 'مدينة دولية' : 'منطقة'),
      fields: fields,
      submitLabel: 'حفظ التعديلات'
    }, function(data) {
      a.name = (data.name || '').trim() || a.name;
      a.city = (data.city || '').trim() || a.city;
      if (isIntl && data.country) a.country = data.country;
      a.shippingFee = parseFloat(data.shippingFee) || 0;
      a.deliveryTime = (data.deliveryTime || '').trim();
      __pickupSave(region, list);
    });
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
    window.__showPickupForm({
      title: '➕ إضافة نقطة في ' + (area.name || ''),
      fields: [
        { id: 'name', label: 'اسم النقطة', type: 'text', placeholder: 'مثال: بقالة الشعب' },
        { id: 'icon', label: 'أيقونة', type: 'text', value: '📦' }
      ],
      submitLabel: 'إضافة النقطة'
    }, function(data) {
      var name = (data.name || '').trim();
      if (!name) { toast('❌ اسم النقطة مطلوب', 'error'); return; }
      var icon = (data.icon || '📦').trim();
      area.points = area.points || [];
      area.points.push({ name: name, icon: icon, lat: area.lat || 0, lng: area.lng || 0 });
      __pickupSave(region, list);
    });
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
