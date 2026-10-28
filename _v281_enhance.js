const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

// استبدال showNotificationComposer بالكامل
const oldStart = 'function showNotificationComposer(){';
const oldEnd = 'const lastEnd'; // anchor
const sIdx = h.indexOf(oldStart);
if (sIdx === -1) { console.log('❌ composer not found'); process.exit(1); }
const eIdx = h.indexOf('}\n\n', sIdx);
// نبحث عن نهاية الدالة (آخر } قبل ; أو نهاية الملف)
// بدلاً من ذلك: نستبدل حتى نهاية تعريف showNotificationComposer
// استخدام marker آخر: آخر "}" قبل "</script>"
const endMarker = h.indexOf('</script>', sIdx);
if (endMarker === -1) { console.log('❌ script end not found'); process.exit(1); }
// لكن هذا سيستبدل كل شيء بعده
// أفضل: نستبدل حتى آخر "}\n" قبل next function

// البحث عن كل تعريفات showNotificationManager + Composer
const composerStart = sIdx;
const composerEnd = h.indexOf('\n}', sIdx) + 2;

// هذا غير موثوق — سنستخدم أسلوباً مختلفاً: استبدال block محدد
const fullComposer = h.slice(composerStart, composerEnd);
console.log('Composer block length:', fullComposer.length);

// نهج أفضل: نضيف دوال جديدة بأسماء v281 ونعدل onclick
const v281Code = `

// ═══ v281: Enhanced Notifications ═══

window.__v281Filter = 'all';

function __renderNotifsList(){
  var notifs = window.__v280Notifs || [];
  var usersMap = window.__v280UsersMap || {};
  var f = window.__v281Filter;
  
  var filtered = notifs.filter(function(n){
    if (f === 'unread') return !n.read;
    if (f === 'read') return n.read;
    return true;
  });
  
  if (filtered.length === 0) {
    return '<div class="vempty"><div class="vempty-icon">🔔</div><div class="vempty-txt">لا توجد إشعارات</div></div>';
  }
  
  return filtered.slice(0, 60).map(function(n){
    var idx = notifs.indexOf(n);
    var recipient = usersMap[n.userId] || (n.broadcast ? '📢 عام' : '—');
    var date = n.createdAt ? new Date(n.createdAt.toDate()).toLocaleDateString('ar-YE', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '—';
    var typeColor = n.type === 'warning' ? '#f87171' : (n.type === 'order' ? '#60a5fa' : (n.type === 'promo' ? '#ec4899' : '#a78bfa'));
    var sourceIcon = n.pushSent ? '🔔' : '📱';
    return '<div style="padding:10px 0;border-bottom:1px solid rgba(155,77,255,0.1)">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">'
      +   '<div style="flex:1;min-width:0">'
      +     '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">'
      +       '<span style="font-size:12px">' + sourceIcon + '</span>'
      +       '<span style="font-size:13px;color:#fff;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.title || 'بدون عنوان') + '</span>'
      +     '</div>'
      +     '<div style="font-size:11px;color:#a78bfa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.body || '') + '</div>'
      +     '<div style="display:flex;gap:8px;margin-top:4px;font-size:10px;color:#6b5a8a;flex-wrap:wrap">'
      +       '<span>👤 ' + esc(recipient) + '</span>'
      +       '<span>📅 ' + date + '</span>'
      +       '<span style="color:' + (n.read ? '#22c55e' : typeColor) + '">' + (n.read ? '✓ مقروء' : '● جديد') + '</span>'
      +     '</div>'
      +   '</div>'
      +   '<button data-ndel2="' + idx + '" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:5px 8px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;flex-shrink:0">🗑️</button>'
      + '</div></div>';
  }).join('');
}

function __rebindNotifsList(){
  document.querySelectorAll('[data-ndel2]').forEach(function(b){
    b.onclick = function(){
      var n = window.__v280Notifs[parseInt(this.dataset.ndel2,10)];
      if (!n) return;
      if (confirm('حذف "' + (n.title||'') + '"؟')) {
        db.collection('notifications').doc(n.id).delete().then(function(){
          toast('✅ تم الحذف', 'success');
          var cb = document.querySelector('#modal-close'); if(cb) cb.click();
          setTimeout(showNotificationManager, 200);
        }).catch(function(e){ toast('❌ ' + e.message, 'error'); });
      }
    };
  });
}

window.__v281Refresh = function(){
  var list = document.getElementById('nm-list');
  if (list) { list.innerHTML = __renderNotifsList(); __rebindNotifsList(); }
  var chips = document.querySelectorAll('[data-nfilter]');
  var notifs = window.__v280Notifs || [];
  var counts = {all: notifs.length, unread: 0, read: 0};
  notifs.forEach(function(n){ if (n.read) counts.read++; else counts.unread++; });
  chips.forEach(function(c){
    var f = c.dataset.nfilter;
    var isActive = f === window.__v281Filter;
    c.style.background = isActive ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : 'rgba(155,77,255,0.1)';
    c.style.color = isActive ? '#fff' : '#a78bfa';
    c.style.borderColor = isActive ? 'transparent' : 'rgba(155,77,255,0.3)';
    var cnt = counts[f] || 0;
    if (!c.dataset.orig) c.dataset.orig = c.textContent;
    c.textContent = c.dataset.orig.replace(/\\s*\\(\\d+\\)$/, '') + ' (' + cnt + ')';
  });
};

// استبدال showNotificationManager
async function showNotificationManager(){
  try {
    var [notifsSnap, usersSnap] = await Promise.all([
      db.collection('notifications').orderBy('createdAt', 'desc').limit(100).get(),
      db.collection('users').get()
    ]);
    
    var notifs = notifsSnap.docs.map(function(d){ return Object.assign({}, d.data(), {id: d.id}); });
    var users = usersSnap.docs.map(function(d){ return Object.assign({}, d.data(), {id: d.id}); });
    var usersMap = {};
    users.forEach(function(u){ usersMap[u.id] = u.name || u.email || 'مستخدم'; });
    
    window.__v280Notifs = notifs;
    window.__v280Users = users;
    window.__v280UsersMap = usersMap;
    window.__v281Filter = 'all';
    
    var unread = notifs.filter(function(n){ return !n.read; }).length;
    var read = notifs.length - unread;
    
    // Stats
    var stats = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">'
      + '<div style="background:rgba(155,77,255,0.1);border:1px solid rgba(155,77,255,0.25);border-radius:12px;padding:10px;text-align:center">'
      +   '<div style="font-size:20px;font-weight:900;color:#fff">' + notifs.length + '</div>'
      +   '<div style="font-size:10px;color:#a78bfa;font-weight:700">الإجمالي</div>'
      + '</div>'
      + '<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:10px;text-align:center">'
      +   '<div style="font-size:20px;font-weight:900;color:#f87171">' + unread + '</div>'
      +   '<div style="font-size:10px;color:#f87171;font-weight:700">غير مقروء</div>'
      + '</div>'
      + '<div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:12px;padding:10px;text-align:center">'
      +   '<div style="font-size:20px;font-weight:900;color:#4ade80">' + read + '</div>'
      +   '<div style="font-size:10px;color:#4ade80;font-weight:700">مقروء</div>'
      + '</div>'
      + '</div>';
    
    // Filter chips
    var chips = '<div style="display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;padding-bottom:4px">'
      + '<button data-nfilter="all" style="flex-shrink:0;padding:8px 14px;border-radius:10px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;border:1px solid transparent">الكل (' + notifs.length + ')</button>'
      + '<button data-nfilter="unread" style="flex-shrink:0;padding:8px 14px;border-radius:10px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;border:1px solid rgba(155,77,255,0.3);background:rgba(155,77,255,0.1);color:#a78bfa">غير مقروء (' + unread + ')</button>'
      + '<button data-nfilter="read" style="flex-shrink:0;padding:8px 14px;border-radius:10px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;border:1px solid rgba(155,77,255,0.3);background:rgba(155,77,255,0.1);color:#a78bfa">مقروء (' + read + ')</button>'
      + '</div>';
    
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px">'
      + '<div style="font-size:14px;font-weight:900;color:#fff">🔔 الإشعارات</div>'
      + '<button id="nm-compose" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none;padding:10px 16px;border-radius:12px;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap">➕ إرسال إشعار</button>'
      + '</div>'
      + stats + chips
      + '<div id="nm-list" style="max-height:50vh;overflow-y:auto">' + __renderNotifsList() + '</div>';
    
    showModal('🔔 الإدارة', html);
    window.__v281Refresh();
    __rebindNotifsList();
    
    document.getElementById('nm-compose').onclick = function(){ showNotificationComposer(); };
    document.querySelectorAll('[data-nfilter]').forEach(function(c){
      c.onclick = function(){ window.__v281Filter = this.dataset.nfilter; window.__v281Refresh(); };
    });
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

// Composer محسّن مع خيار push
function showNotificationComposer(){
  var users = window.__v280Users || [];
  var roles = {super_admin:'👑 سوبر أدمن', cat_manager:'🏷️ مدراء الأقسام', delivery_mgr:'🚚 مندوب توصيل', accountant:'💼 محاسب', bookings_mgr:'📅 مدير حجوزات', customer:'👥 العملاء'};
  var cats = [
    {k:'electronics',n:'إلكترونيات والهواتف'},{k:'fashion',n:'الأزياء والموضة'},{k:'clothing',n:'الملابس والإكسسوارات'},
    {k:'shoes_bags',n:'أحذية والشنط'},{k:'beauty',n:'جمال وعطور'},{k:'kids_sports',n:'أطفال ورياضية'},
    {k:'home',n:'منزل وأثاث'},{k:'supermarket',n:'السوبر ماركت'}
  ];
  
  var iS = 'width:100%;padding:12px 14px;background:rgba(10,8,37,0.7);border:1px solid rgba(155,77,255,0.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box';
  var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:6px';
  
  var html = '<div>'
    + '<label style="' + lS + '">🎯 المستهدفون *</label>'
    + '<select id="nc2-target" style="' + iS + '">'
    +   '<option value="all">📢 جميع المستخدمين (' + users.length + ')</option>'
    +   '<option value="role">👥 حسب الدور</option>'
    +   '<option value="category">🏷️ عملاء قسم معين</option>'
    +   '<option value="specific">👤 مستخدم محدد</option>'
    + '</select>'
    + '<div id="nc2-role-wrap" style="display:none"><label style="' + lS + '">الدور</label><select id="nc2-role" style="' + iS + '">' + Object.keys(roles).map(function(k){return '<option value="'+k+'">'+roles[k]+'</option>';}).join('') + '</select></div>'
    + '<div id="nc2-cat-wrap" style="display:none"><label style="' + lS + '">القسم</label><select id="nc2-cat" style="' + iS + '">' + cats.map(function(c){return '<option value="'+c.k+'">'+c.n+'</option>';}).join('') + '</select></div>'
    + '<div id="nc2-user-wrap" style="display:none">'
    +   '<label style="' + lS + '">بحث</label>'
    +   '<input id="nc2-search" type="text" placeholder="اسم أو بريد" style="' + iS + '">'
    +   '<select id="nc2-user" style="' + iS + '">' + users.map(function(u){return '<option value="'+u.id+'">'+(u.name||'')+' — '+(u.email||'')+'</option>';}).join('') + '</select>'
    + '</div>'
    + '<label style="' + lS + '">📤 طريقة الإرسال *</label>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">'
    +   '<label data-sendmode="internal" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;background:rgba(155,77,255,0.1);border:2px solid rgba(155,77,255,0.3);border-radius:10px;cursor:pointer;text-align:center">'
    +     '<input type="radio" name="nc2-mode" value="internal" style="margin:0;accent-color:#7c3aed">'
    +     '<span style="font-size:16px">📱</span>'
    +     '<span style="font-size:10px;color:#a78bfa;font-weight:800">داخلي فقط</span>'
    +   '</label>'
    +   '<label data-sendmode="external" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;background:rgba(155,77,255,0.1);border:2px solid rgba(155,77,255,0.3);border-radius:10px;cursor:pointer;text-align:center">'
    +     '<input type="radio" name="nc2-mode" value="external" style="margin:0;accent-color:#7c3aed">'
    +     '<span style="font-size:16px">🔔</span>'
    +     '<span style="font-size:10px;color:#a78bfa;font-weight:800">Push خارجي</span>'
    +   '</label>'
    +   '<label data-sendmode="both" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;background:rgba(34,197,94,0.15);border:2px solid rgba(34,197,94,0.5);border-radius:10px;cursor:pointer;text-align:center">'
    +     '<input type="radio" name="nc2-mode" value="both" checked style="margin:0;accent-color:#22c55e">'
    +     '<span style="font-size:16px">🌐</span>'
    +     '<span style="font-size:10px;color:#4ade80;font-weight:800">كلاهما</span>'
    +   '</label>'
    + '</div>'
    + '<div style="font-size:10px;color:#a78bfa;opacity:0.7;margin-bottom:12px;padding:8px;background:rgba(155,77,255,0.05);border-radius:8px;line-height:1.5">💡 <b>داخلي:</b> يظهر عند فتح التطبيق فقط<br>🔔 <b>Push:</b> يظهر كإشعار على الهاتف (يحتاج push-listener)<br>🌐 <b>كلاهما:</b> يظهر في كل مكان</div>'
    + '<label style="' + lS + '">نوع الإشعار</label>'
    + '<select id="nc2-type" style="' + iS + '">'
    +   '<option value="info">ℹ️ معلومات</option><option value="success">✅ نجاح</option><option value="warning">⚠️ تحذير</option><option value="order">📦 طلب</option><option value="promo">🎉 عرض</option>'
    + '</select>'
    + '<label style="' + lS + '">العنوان *</label>'
    + '<input id="nc2-title" type="text" placeholder="..." style="' + iS + '">'
    + '<label style="' + lS + '">النص *</label>'
    + '<textarea id="nc2-body" rows="3" placeholder="..." style="' + iS + 'resize:vertical"></textarea>'
    + '<label style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(155,77,255,0.1);border-radius:10px;margin-bottom:12px;cursor:pointer">'
    +   '<input id="nc2-important" type="checkbox" style="width:20px;height:20px;accent-color:#ec4899">'
    +   '<span style="color:#fff;font-weight:700;font-size:12px">🔔 إشعار مهم (popup)</span>'
    + '</label>'
    + '<label style="' + lS + '">رابط اختياري</label>'
    + '<input id="nc2-link" type="text" placeholder="product/123 أو #offers" style="' + iS + '">'
    + '<button id="nc2-send" style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:14px;border-radius:12px;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer;border:none;margin-top:8px">📤 إرسال</button>'
    + '</div>';
  
  showModal('➕ إرسال إشعار', html);
  
  // Update send mode styling
  document.querySelectorAll('[data-sendmode]').forEach(function(lbl){
    lbl.querySelector('input').onchange = function(){
      document.querySelectorAll('[data-sendmode]').forEach(function(l){
        l.style.background = 'rgba(155,77,255,0.1)';
        l.style.borderColor = 'rgba(155,77,255,0.3)';
      });
      if (this.checked) {
        lbl.style.background = this.value === 'both' ? 'rgba(34,197,94,0.15)' : 'rgba(155,77,255,0.2)';
        lbl.style.borderColor = this.value === 'both' ? 'rgba(34,197,94,0.5)' : 'rgba(155,77,255,0.5)';
      }
    };
  });
  
  document.getElementById('nc2-target').onchange = function(){
    document.getElementById('nc2-role-wrap').style.display = this.value === 'role' ? 'block' : 'none';
    document.getElementById('nc2-cat-wrap').style.display = this.value === 'category' ? 'block' : 'none';
    document.getElementById('nc2-user-wrap').style.display = this.value === 'specific' ? 'block' : 'none';
  };
  
  var searchInp = document.getElementById('nc2-search');
  var userSel = document.getElementById('nc2-user');
  searchInp.oninput = function(){
    var q = this.value.toLowerCase().trim();
    userSel.innerHTML = window.__v280Users.filter(function(u){
      return !q || (u.name||'').toLowerCase().indexOf(q) !== -1 || (u.email||'').toLowerCase().indexOf(q) !== -1;
    }).map(function(u){ return '<option value="' + u.id + '">' + (u.name||'') + ' — ' + (u.email||'') + '</option>'; }).join('');
  };
  
  document.getElementById('nc2-send').onclick = async function(){
    var tType = document.getElementById('nc2-target').value;
    var title = document.getElementById('nc2-title').value.trim();
    var body = document.getElementById('nc2-body').value.trim();
    var type = document.getElementById('nc2-type').value;
    var important = document.getElementById('nc2-important').checked;
    var link = document.getElementById('nc2-link').value.trim();
    var sendMode = (document.querySelector('input[name="nc2-mode"]:checked') || {}).value || 'both';
    
    if (!title || !body) { toast('⚠️ العنوان والنص مطلوبان', 'error'); return; }
    
    var recipients = [];
    if (tType === 'all') recipients = window.__v280Users.filter(function(u){ return u.role !== 'super_admin'; });
    else if (tType === 'role') { var r = document.getElementById('nc2-role').value; recipients = window.__v280Users.filter(function(u){ return u.role === r; }); }
    else if (tType === 'category') {
      var cat = document.getElementById('nc2-cat').value;
      try {
        var os = await db.collection('orders').get();
        var ids = {};
        os.forEach(function(d){ var o = d.data(); if (o.categories && o.categories[cat] && o.customerId) ids[o.customerId] = true; });
        recipients = window.__v280Users.filter(function(u){ return ids[u.id]; });
      } catch(e){ toast('❌ فشل', 'error'); return; }
    } else if (tType === 'specific') {
      var uid = userSel.value;
      if (uid) { var uu = window.__v280Users.find(function(x){ return x.id === uid; }); if (uu) recipients = [uu]; }
    }
    
    if (recipients.length === 0) { toast('⚠️ لا يوجد مستقبلون', 'error'); return; }
    
    var btn = this; btn.disabled = true; btn.textContent = '⏳ إرسال...';
    
    var pushEnabled = (sendMode === 'external' || sendMode === 'both');
    var internalEnabled = (sendMode === 'internal' || sendMode === 'both');
    var icon = type === 'warning' ? '⚠️' : (type === 'success' ? '✅' : (type === 'promo' ? '🎉' : (type === 'order' ? '📦' : 'ℹ️')));
    
    try {
      var opsPerUser = 1 + (pushEnabled ? 1 : 0);
      var batchSize = Math.floor(450 / opsPerUser);
      var sent = 0;
      var sentPush = 0;
      
      for (var i = 0; i < recipients.length; i += batchSize) {
        var batch = db.batch();
        var chunk = recipients.slice(i, i + batchSize);
        chunk.forEach(function(u){
          if (internalEnabled) {
            var nRef = db.collection('notifications').doc();
            batch.set(nRef, {
              userId: u.id, title: title, body: body, type: type,
              event: 'admin_broadcast', icon: icon, important: important,
              deepLink: link || null, read: false,
              broadcast: tType === 'all', broadcastType: tType,
              pushSent: pushEnabled,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
          if (pushEnabled) {
            var pRef = db.collection('push_queue').doc();
            batch.set(pRef, {
              userId: u.id,
              title: title, body: body, type: type, icon: icon,
              deepLink: link || null, important: important,
              status: 'pending',
              sentAt: null,
              error: null,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            sentPush++;
          }
        });
        await batch.commit();
        sent += chunk.length;
      }
      
      var msg = '✅ أُرسل إلى ' + sent;
      if (pushEnabled) msg += ' (push: ' + sentPush + ')';
      toast(msg, 'success');
      
      var cb = document.querySelector('#modal-close'); if(cb) cb.click();
      setTimeout(showNotificationManager, 300);
    } catch(e){
      btn.disabled = false; btn.textContent = '📤 إرسال';
      toast('❌ ' + e.message, 'error');
    }
  };
}

`;

// حقن في نهاية الـ script
const lastEnd = h.lastIndexOf('</script>');
if (lastEnd === -1) { console.log('❌ no script'); process.exit(1); }
h = h.slice(0, lastEnd) + v281Code + h.slice(lastEnd);

fs.writeFileSync('dashboard.html', h);
console.log('✅ v281: filters + stats + push option |', before, '->', h.length);
