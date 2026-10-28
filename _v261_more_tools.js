const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');

// 1. استبدال renderMore كاملاً
const oldRenderMoreStart = 'function renderMore(){';
const oldRenderMoreEnd = 'function showModal(title, content){';
const startIdx = h.indexOf(oldRenderMoreStart);
const endIdx = h.indexOf(oldRenderMoreEnd);

if (startIdx === -1 || endIdx === -1) {
  console.log('❌ markers not found');
  process.exit(1);
}

const newBlock = `function renderMore(){
  var tools = [
    {icon:'🛍️', lbl:'المنتجات', tool:'products'},
    {icon:'🚗', lbl:'حراج', tool:'listings'},
    {icon:'📅', lbl:'الحجوزات', tool:'bookings'},
    {icon:'🏷️', lbl:'الماركات', tool:'brands'},
    {icon:'📂', lbl:'الأقسام', tool:'categories'},
    {icon:'🏭', lbl:'الموردين', tool:'suppliers'},
    {icon:'🖼️', lbl:'البانرات', tool:'banners'},
    {icon:'💳', lbl:'الديون', tool:'transactions'},
    {icon:'🔔', lbl:'الإشعارات', tool:'notifications'},
    {icon:'📊', lbl:'تقارير', tool:'reports'},
    {icon:'👤', lbl:'حسابي', tool:'profile'},
    {icon:'⚙️', lbl:'إعدادات', tool:'settings'}
  ];
  
  return '<div class="vst">➕ المزيد — أدوات الإدارة</div>'
    + '<div class="vmore-grid">'
    + tools.map(function(t){
        return '<button class="vmore-btn" data-tool="' + t.tool + '"><span class="vmore-icon">' + t.icon + '</span><div class="vmore-lbl">' + t.lbl + '</div></button>';
      }).join('')
    + '</div>';
}

document.addEventListener('click', async function(e){
  var btn = e.target.closest && e.target.closest('[data-tool]');
  if (!btn) return;
  var tool = btn.dataset.tool;
  e.preventDefault();
  
  if (tool === 'products') return showProductsList();
  if (tool === 'listings') return showListingsList();
  if (tool === 'bookings') return showBookingsList();
  if (tool === 'brands') return showConfigEditor('brands', 'الماركات');
  if (tool === 'categories') return showConfigEditor('categories', 'الأقسام');
  if (tool === 'suppliers') return showConfigEditor('suppliers', 'الموردين');
  if (tool === 'banners') return showConfigEditor('banners', 'البانرات');
  if (tool === 'transactions') return showTransactionsList();
  if (tool === 'notifications') return showNotifications();
  if (tool === 'reports') return showReports();
  if (tool === 'profile') return showProfile();
  if (tool === 'settings') return showSettings();
});

async function showProductsList(){
  try {
    var snap = await db.collection('products').get();
    var products = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    var html = products.length ? products.map(function(p){
      var status = p.status === 'live' ? '🟢 منشور' : (p.status === 'pending_review' ? '🟡 مراجعة' : (p.status === 'rejected' ? '🔴 مرفوض' : '⚪ مسودة'));
      return '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid rgba(155,77,255,0.1)">'
        + '<img src="' + (p.img||'') + '" style="width:48px;height:48px;object-fit:cover;border-radius:8px;background:#333" onerror="this.style.opacity=0.3">'
        + '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.name||'') + '</div>'
        + '<div style="font-size:10px;color:#a78bfa">' + normName(p.brand) + ' · ' + (p.category||'') + ' · ' + (Number(p.price)||0).toFixed(0) + ' ر</div>'
        + '<div style="font-size:10px;color:#a78bfa;margin-top:2px">' + status + '</div></div></div>';
    }).join('') : '<div class="vempty-txt">لا توجد منتجات</div>';
    showModal('🛍️ المنتجات (' + products.length + ')', '<div style="max-height:60vh;overflow-y:auto">' + html + '</div>');
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

async function showListingsList(){
  try {
    var snap = await db.collection('listings').get();
    var list = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    var html = list.length ? list.map(function(l){
      return '<div style="padding:10px 0;border-bottom:1px solid rgba(155,77,255,0.1)">'
        + '<div style="font-size:13px;font-weight:800;color:#fff">' + (l.title||'—') + '</div>'
        + '<div style="font-size:11px;color:#a78bfa">' + (l.type==='car'?'🚗 سيارة':l.type==='phone'?'📱 هاتف':'') + ' · ' + (Number(l.price)||0).toFixed(0) + ' ر · ' + (l.city||'') + '</div>'
        + '</div>';
    }).join('') : '<div class="vempty-txt">لا توجد إعلانات حراج</div>';
    showModal('🚗 حراج (' + list.length + ')', html);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

async function showBookingsList(){
  try {
    var snap = await db.collection('bookings').get();
    var list = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    var html = list.length ? list.map(function(b){
      return '<div style="padding:10px 0;border-bottom:1px solid rgba(155,77,255,0.1)">'
        + '<div style="font-size:13px;font-weight:800;color:#fff">' + (b.type||'') + ' — ' + (b.userName||'') + '</div>'
        + '<div style="font-size:11px;color:#a78bfa">' + (b.userPhone||'') + ' · ' + (b.status||'') + '</div>'
        + '</div>';
    }).join('') : '<div class="vempty-txt">لا توجد حجوزات</div>';
    showModal('📅 الحجوزات (' + list.length + ')', html);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

async function showConfigEditor(docName, title){
  try {
    var doc = await db.collection('config').doc(docName).get();
    var data = doc.exists ? doc.data() : {};
    var list = data.list || data.items || data[docName] || data;
    var items = Array.isArray(list) ? list : Object.keys(list).map(function(k){ var v = list[k]; return {id:k, name: typeof v==='string'?v:(v&&v.name||k)}; });
    var html = items.length ? items.map(function(item, i){
      var nm = normName(item) || (typeof item === 'string' ? item : '—');
      return '<div style="padding:8px 0;border-bottom:1px solid rgba(155,77,255,0.1);font-size:13px;color:#fff"><span style="color:#a78bfa;margin-left:6px">' + (i+1) + '.</span>' + nm + '</div>';
    }).join('') : '<div class="vempty-txt">لا توجد عناصر</div>';
    showModal('🏷️ ' + title + ' (' + items.length + ')', html);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

async function showTransactionsList(){
  try {
    var snap = await db.collection('transactions').get();
    var list = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    var html = list.length ? list.map(function(t){
      return '<div style="padding:10px 0;border-bottom:1px solid rgba(155,77,255,0.1)">'
        + '<div style="font-size:13px;font-weight:800;color:#fff">' + (t.userName||'') + ' — ' + (t.type||'') + '</div>'
        + '<div style="font-size:11px;color:#a78bfa">' + (Number(t.amount)||0).toFixed(0) + ' ر · ' + (t.reason||'') + '</div>'
        + '</div>';
    }).join('') : '<div class="vempty-txt">لا توجد معاملات</div>';
    showModal('💳 الديون والتقدمات (' + list.length + ')', html);
  } catch(e){ toast('❌ ' + e.message, 'error'); }
}

function showProfile(){
  var u = state.user;
  var initial = (u.displayName || u.email || '?').charAt(0).toUpperCase();
  var html = '<div style="text-align:center;padding:20px 0">'
    + '<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#ec4899);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#fff">' + initial + '</div>'
    + '<div style="font-size:18px;font-weight:900;color:#fff">' + (u.displayName || (u.email||'').split('@')[0]) + '</div>'
    + '<div style="font-size:12px;color:#a78bfa;margin-top:4px">' + (u.email||'') + '</div>'
    + '<div style="margin-top:16px;padding:12px;background:rgba(155,77,255,0.1);border-radius:12px"><div style="font-size:11px;color:#a78bfa">UID</div><div style="font-size:10px;color:#fff;font-family:monospace;word-break:break-all">' + u.uid + '</div></div>'
    + '</div>';
  showModal('👤 حسابي', html);
}

function showSettings(){
  var html = '<div style="padding:10px 0">'
    + '<div style="font-size:12px;color:#a78bfa;margin-bottom:16px;line-height:1.6">الإعدادات المتقدمة متاحة في اللوحة الكلاسيكية. اضغط الزر أدناه للوصول إليها.</div>'
    + '<button onclick="window.location.href=\\'index.html?classic=1\\'" style="width:100%;padding:14px;background:rgba(155,77,255,0.15);border:1px solid rgba(155,77,255,0.3);color:#a78bfa;border-radius:12px;font-family:inherit;font-weight:700;font-size:13px;margin-bottom:8px;cursor:pointer">🔧 فتح اللوحة الكلاسيكية (كل الأدوات)</button>'
    + '<div style="font-size:11px;color:#666;margin-top:12px;text-align:center;line-height:1.5">اللوحة الكلاسيكية تحتوي على: ماركات، أقسام، بانرات، إعدادات كاملة، مندوبين، مواقع تسليم، أدوار، ودفع</div>'
    + '</div>';
  showModal('⚙️ إعدادات', html);
}

function showReports(){
  var totalSales = 0, completed = 0, pending = 0;
  state.orders.forEach(function(o){
    if (o.status === 'completed'){ totalSales += Number(o.total)||0; completed++; }
    else if (o.status === 'pending') pending++;
  });
  var html = '<div class="vkg" style="margin-bottom:16px">'
    + '<div class="vk sales"><div class="vk-icon">💰</div><div class="vk-num">' + Math.round(totalSales).toLocaleString('ar-EG') + '</div><div class="vk-lbl">إجمالي المبيعات</div></div>'
    + '<div class="vk orders"><div class="vk-icon">✅</div><div class="vk-num">' + completed + '</div><div class="vk-lbl">مكتملة</div></div>'
    + '</div>'
    + '<div class="vkg">'
    + '<div class="vk products"><div class="vk-icon">🟡</div><div class="vk-num">' + pending + '</div><div class="vk-lbl">معلقة</div></div>'
    + '<div class="vk users"><div class="vk-icon">🛍️</div><div class="vk-num">' + state.products.length + '</div><div class="vk-lbl">منتجات</div></div>'
    + '</div>'
    + '<div style="padding:16px;background:rgba(155,77,255,0.05);border-radius:14px;text-align:center;color:#a78bfa;font-size:12px;margin-top:16px">📊 تقارير مفصلة بالرسوم البيانية قريباً</div>';
  showModal('📊 تقارير', html);
}

`;

h = h.slice(0, startIdx) + newBlock + h.slice(endIdx);

// 2. حذف الـ listener القديم (الذي يعتمد على data-more)
const oldListener = /\ndocument\.addEventListener\('click', function\(e\)\{\n  var btn = e\.target\.closest && e\.target\.closest\('\[data-more\]'\);[\s\S]*?\}\);\n/;
h = h.replace(oldListener, '\n');

fs.writeFileSync('dashboard.html', h);
console.log('✅ v261: 12 أداة جديدة + إزالة الحلقة | الحجم:', h.length);
