const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

if (h.includes('function showNotificationManager')) { console.log('exists'); process.exit(0); }

const oldHandler = "  if (tool === 'notifications') return showNotifications();";
if (!h.includes(oldHandler)) { console.log('❌ handler not found'); process.exit(1); }
h = h.replace(oldHandler, "  if (tool === 'notifications') return showNotificationManager();");

const code = `
// ═══ v280: Notification Management ═══

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
    
    var unread = notifs.filter(function(n){ return !n.read; }).length;
    
    var listHtml = notifs.length ? notifs.slice(0, 50).map(function(n, i){
      var recipient = usersMap[n.userId] || (n.broadcast ? '📢 عام' : '—');
      var date = n.createdAt ? new Date(n.createdAt.toDate()).toLocaleDateString('ar-YE', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : '—';
      var typeColor = n.type === 'warning' ? '#f87171' : (n.type === 'order' ? '#60a5fa' : '#a78bfa');
      var readColor = n.read ? '#22c55e' : typeColor;
      return '<div style="padding:10px 0;border-bottom:1px solid rgba(155,77,255,0.1)">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">'
        +   '<div style="flex:1;min-width:0">'
        +     '<div style="font-size:13px;color:#fff;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.title || 'بدون عنوان') + '</div>'
        +     '<div style="font-size:11px;color:#a78bfa;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(n.body || '') + '</div>'
        +     '<div style="display:flex;gap:8px;margin-top:4px;font-size:10px;color:#6b5a8a;flex-wrap:wrap">'
        +       '<span>👤 ' + esc(recipient) + '</span>'
        +       '<span>📅 ' + date + '</span>'
        +       '<span style="color:' + readColor + '">' + (n.read ? '✓ مقروء' : '● جديد') + '</span>'
        +     '</div>'
        +   '</div>'
        +   '<button data-ndel="' + i + '" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:5px 8px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;flex-shrink:0">🗑️</button>'
        + '</div></div>';
    }).join('') : '<div class="vempty"><div class="vempty-icon">🔔</div><div class="vempty-txt">لا توجد إشعارات</div></div>';
    
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px">'
      + '<div>'
      +   '<div style="font-size:14px;font-weight:900;color:#fff">🔔 الإشعارات</div>'
      +   '<div style="font-size:11px;color:#a78bfa;margin-top:2px">' + notifs.length + ' إجمالي · ' + unread + ' غير مقروء</div>'
      + '</div>'
      + '<button id="n280-compose" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none;padding:10px 16px;border-radius:12px;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap">➕ إرسال إشعار</button>'
      + '</div>'
      + '<div style="max-height:60vh;overflow-y:auto">' + listHtml + '</div>';
    
    showModal('🔔 إدارة الإشعارات', html);
    
    document.getElementById('n280-compose').onclick = function(){ showNotificationComposer(); };
    
    document.querySelectorAll('[data-ndel]').forEach(function(b){
      b.onclick = function(){
        var n = window.__v280Notifs[parseInt(this.dataset.ndel,10)];
        if (!n) return;
        if (confirm('حذف الإشعار "' + (n.title||'') + '"؟')) {
          db.collection('notifications').doc(n.id).delete().then(function(){
            toast('✅ تم الحذف', 'success');
            var cb = document.querySelector('#modal-close'); if(cb) cb.click();
            setTimeout(showNotificationManager, 200);
          }).catch(function(e){ toast('❌ ' + e.message, 'error'); });
        }
      };
    });
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

function showNotificationComposer(){
  var users = window.__v280Users || [];
  var roles = {super_admin:'👑 سوبر أدمن', cat_manager:'🏷️ مدراء الأقسام', delivery_mgr:'🚚 مندوب توصيل', accountant:'💼 محاسب', bookings_mgr:'📅 مدير حجوزات', customer:'👥 العملاء'};
  var cats = [
    {k:'electronics', n:'إلكترونيات والهواتف'},
    {k:'fashion', n:'الأزياء والموضة'},
    {k:'clothing', n:'الملابس والإكسسوارات'},
    {k:'shoes_bags', n:'أحذية والشنط'},
    {k:'beauty', n:'جمال وعطور'},
    {k:'kids_sports', n:'أطفال ورياضية'},
    {k:'home', n:'منزل وأثاث'},
    {k:'supermarket', n:'السوبر ماركت'}
  ];
  
  var iS = 'width:100%;padding:12px 14px;background:rgba(10,8,37,0.7);border:1px solid rgba(155,77,255,0.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box';
  var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:6px';
  
  var html = '<div>'
    + '<label style="' + lS + '">🎯 المستهدفون *</label>'
    + '<select id="nc-target-type" style="' + iS + '">'
    +   '<option value="all">📢 جميع المستخدمين (' + users.length + ')</option>'
    +   '<option value="role">👥 حسب الدور</option>'
    +   '<option value="category">🏷️ عملاء قسم معين</option>'
    +   '<option value="specific">👤 مستخدم محدد</option>'
    + '</select>'
    + '<div id="nc-role-wrap" style="display:none">'
    +   '<label style="' + lS + '">اختر الدور</label>'
    +   '<select id="nc-role" style="' + iS + '">'
    +     Object.keys(roles).map(function(k){ return '<option value="' + k + '">' + roles[k] + '</option>'; }).join('')
    +   '</select>'
    + '</div>'
    + '<div id="nc-cat-wrap" style="display:none">'
    +   '<label style="' + lS + '">اختر القسم</label>'
    +   '<select id="nc-cat" style="' + iS + '">'
    +     cats.map(function(c){ return '<option value="' + c.k + '">' + c.n + '</option>'; }).join('')
    +   '</select>'
    + '</div>'
    + '<div id="nc-user-wrap" style="display:none">'
    +   '<label style="' + lS + '">ابحث بالاسم أو البريد</label>'
    +   '<input id="nc-user-search" type="text" placeholder="..." style="' + iS + '">'
    +   '<select id="nc-user" style="' + iS + '">'
    +     users.map(function(u){ return '<option value="' + u.id + '">' + (u.name||'') + ' — ' + (u.email||'') + '</option>'; }).join('')
    +   '</select>'
    + '</div>'
    + '<label style="' + lS + '">نوع الإشعار</label>'
    + '<select id="nc-type" style="' + iS + '">'
    +   '<option value="info">ℹ️ معلومات</option>'
    +   '<option value="success">✅ نجاح</option>'
    +   '<option value="warning">⚠️ تحذير</option>'
    +   '<option value="order">📦 طلب</option>'
    +   '<option value="promo">🎉 عرض ترويجي</option>'
    + '</select>'
    + '<label style="' + lS + '">العنوان *</label>'
    + '<input id="nc-title" type="text" placeholder="مثال: خصم 20% على كل شيء!" style="' + iS + '">'
    + '<label style="' + lS + '">النص *</label>'
    + '<textarea id="nc-body" rows="3" placeholder="تفاصيل الإشعار..." style="' + iS + 'resize:vertical"></textarea>'
    + '<label style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(155,77,255,0.1);border-radius:10px;margin-bottom:12px;cursor:pointer">'
    +   '<input id="nc-important" type="checkbox" style="width:20px;height:20px;accent-color:#ec4899">'
    +   '<span style="color:#fff;font-weight:700;font-size:12px">🔔 إشعار مهم (popup فوري)</span>'
    + '</label>'
    + '<label style="' + lS + '">رابط اختياري (deepLink)</label>'
    + '<input id="nc-link" type="text" placeholder="product/123 أو #offers" style="' + iS + '">'
    + '<button id="nc-send" style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:14px;border-radius:12px;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer;border:none;margin-top:8px">📤 إرسال</button>'
    + '</div>';
  
  showModal('➕ إرسال إشعار', html);
  
  var targetType = document.getElementById('nc-target-type');
  targetType.onchange = function(){
    document.getElementById('nc-role-wrap').style.display = this.value === 'role' ? 'block' : 'none';
    document.getElementById('nc-cat-wrap').style.display = this.value === 'category' ? 'block' : 'none';
    document.getElementById('nc-user-wrap').style.display = this.value === 'specific' ? 'block' : 'none';
  };
  
  var searchInp = document.getElementById('nc-user-search');
  var userSel = document.getElementById('nc-user');
  searchInp.oninput = function(){
    var q = this.value.toLowerCase().trim();
    userSel.innerHTML = window.__v280Users
      .filter(function(u){
        return !q || (u.name||'').toLowerCase().indexOf(q) !== -1 || (u.email||'').toLowerCase().indexOf(q) !== -1;
      })
      .map(function(u){ return '<option value="' + u.id + '">' + (u.name||'') + ' — ' + (u.email||'') + '</option>'; })
      .join('');
  };
  
  document.getElementById('nc-send').onclick = async function(){
    var tType = targetType.value;
    var title = document.getElementById('nc-title').value.trim();
    var body = document.getElementById('nc-body').value.trim();
    var type = document.getElementById('nc-type').value;
    var important = document.getElementById('nc-important').checked;
    var link = document.getElementById('nc-link').value.trim();
    
    if (!title || !body) { toast('⚠️ العنوان والنص مطلوبان', 'error'); return; }
    
    var recipients = [];
    if (tType === 'all') {
      recipients = window.__v280Users.filter(function(u){ return u.role !== 'super_admin'; });
    } else if (tType === 'role') {
      var r = document.getElementById('nc-role').value;
      recipients = window.__v280Users.filter(function(u){ return u.role === r; });
    } else if (tType === 'category') {
      var cat = document.getElementById('nc-cat').value;
      try {
        var ordersSnap = await db.collection('orders').get();
        var custIds = {};
        ordersSnap.forEach(function(d){
          var o = d.data();
          if (o.categories && o.categories[cat] && o.customerId) custIds[o.customerId] = true;
        });
        recipients = window.__v280Users.filter(function(u){ return custIds[u.id]; });
      } catch(e){ toast('❌ فشل جلب العملاء', 'error'); return; }
    } else if (tType === 'specific') {
      var uid = userSel.value;
      if (uid) {
        var u = window.__v280Users.find(function(x){ return x.id === uid; });
        if (u) recipients = [u];
      }
    }
    
    if (recipients.length === 0) { toast('⚠️ لا يوجد مستقبلون', 'error'); return; }
    
    var btn = this; btn.disabled = true; btn.textContent = '⏳ إرسال...';
    
    try {
      var batchSize = 400;
      var sent = 0;
      for (var i = 0; i < recipients.length; i += batchSize) {
        var batch = db.batch();
        var chunk = recipients.slice(i, i + batchSize);
        chunk.forEach(function(u){
          var ref = db.collection('notifications').doc();
          batch.set(ref, {
            userId: u.id,
            title: title,
            body: body,
            type: type,
            event: 'admin_broadcast',
            icon: type === 'warning' ? '⚠️' : (type === 'success' ? '✅' : (type === 'promo' ? '🎉' : (type === 'order' ? '📦' : 'ℹ️'))),
            important: important,
            deepLink: link || null,
            read: false,
            broadcast: tType === 'all',
            broadcastType: tType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
        sent += chunk.length;
      }
      
      toast('✅ تم إرسال ' + sent + ' إشعار', 'success');
      var cb = document.querySelector('#modal-close'); if(cb) cb.click();
      setTimeout(showNotificationManager, 300);
    } catch(e){
      btn.disabled = false; btn.textContent = '📤 إرسال';
      toast('❌ ' + e.message, 'error');
    }
  };
}

`;

const lastEnd = h.lastIndexOf('</script>');
if (lastEnd === -1) { console.log('❌ no script tag'); process.exit(1); }
h = h.slice(0, lastEnd) + code + h.slice(lastEnd);

fs.writeFileSync('dashboard.html', h);
console.log('✅ v280: notifications manager |', before, '->', h.length);
