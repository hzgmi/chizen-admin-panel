const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

// استبدال renderTeam بالكامل
const oldTeamStart = 'function renderTeam(){';
const oldTeamEnd = 'function renderReview(){';
const sIdx = h.indexOf(oldTeamStart);
const eIdx = h.indexOf(oldTeamEnd);

if (sIdx === -1 || eIdx === -1) { console.log('❌ markers not found'); process.exit(1); }

const newTeam = `function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

function renderTeam(){
  var groups = {};
  state.users.forEach(function(u){
    var role = u.role || 'customer';
    if (!groups[role]) groups[role] = [];
    groups[role].push(u);
  });
  
  var roleLabels = {
    super_admin: '👑 الإدارة العامة',
    cat_manager: '🏷️ مدراء الأقسام',
    delivery_mgr: '🚚 مندوب التوصيل',
    accountant: '💼 المحاسب',
    bookings_mgr: '📅 مدير الحجوزات',
    customer: '👥 العملاء'
  };
  
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:10px">'
    + '<div class="vst" style="margin:0">👥 الفريق (' + state.users.length + ')</div>'
    + '<button onclick="__addEmployee()" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none;padding:10px 16px;border-radius:12px;font-family:inherit;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap">➕ إضافة موظف</button>'
    + '</div>';
  
  var order = ['super_admin','cat_manager','delivery_mgr','accountant','bookings_mgr','customer'];
  
  order.forEach(function(role){
    var list = groups[role];
    if (!list || !list.length) return;
    
    var members = list.map(function(u){
      var name = u.name || u.email || '—';
      var initial = (name || '?').charAt(0).toUpperCase();
      var cat = u.assignedCategory ? '<span class="vteam-cat">' + esc(u.assignedCategory) + '</span>' : '';
      var isSelf = u.id === state.user.uid;
      var actions = isSelf 
        ? '<span style="font-size:10px;color:#a78bfa;margin-left:6px;padding:4px 8px;background:rgba(168,85,247,0.15);border-radius:6px">أنت</span>'
        : '<button onclick="__editEmployee(\\'' + u.id + '\\')" style="background:rgba(155,77,255,0.15);border:1px solid rgba(155,77,255,0.3);color:#a78bfa;padding:6px 10px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer;margin-left:4px">✏️</button>'
          + '<button onclick="__deleteEmployee(\\'' + u.id + '\\')" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:6px 10px;border-radius:8px;font-family:inherit;font-size:13px;cursor:pointer">🗑️</button>';
      return '<div class="vteam-member">'
        + '<div class="vteam-avatar">' + esc(initial) + '</div>'
        + '<div class="vteam-info"><div class="vteam-name">' + esc(name) + ' ' + cat + '</div><div class="vteam-email">' + esc(u.email||'') + '</div></div>'
        + actions
        + '</div>';
    }).join('');
    
    html += '<div class="vteam-group"><div class="vteam-title">' + (roleLabels[role] || role) + ' (' + list.length + ')</div>' + members + '</div>';
  });
  
  return html;
}

window.__addEmployee = function(){ showEmployeeForm(null); };
window.__editEmployee = function(uid){
  var u = state.users.find(function(x){ return x.id === uid; });
  if (u) showEmployeeForm(u);
};
window.__deleteEmployee = async function(uid){
  var u = state.users.find(function(x){ return x.id === uid; });
  if (!u) return;
  var name = u.name || u.email || 'موظف';
  if (!confirm('حذف "' + name + '" نهائياً؟\\n\\nسيُزال وصوله للوحة فوراً.')) return;
  try {
    await db.collection('users').doc(uid).delete();
    toast('✅ تم الحذف', 'success');
    await loadAll();
    renderTab('team');
  } catch(e){ toast('❌ ' + e.message, 'error'); }
};

function showEmployeeForm(existing){
  var isEdit = !!(existing && existing.id);
  var u = existing || {};
  
  var roleOpts = [
    {v:'super_admin', l:'👑 سوبر أدمن'},
    {v:'cat_manager', l:'🏷️ مدير قسم'},
    {v:'delivery_mgr', l:'🚚 مندوب توصيل'},
    {v:'accountant', l:'💼 محاسب'},
    {v:'bookings_mgr', l:'📅 مدير حجوزات'}
  ];
  var catLabels = {electronics:'إلكترونيات',fashion:'أزياء',clothing:'ملابس',sports:'أدوات رياضية',beauty:'جمال وعطور',kids:'أطفال',tools:'أدوات منزلية',home:'منزل وأثاث'};
  var catOpts = Object.keys(catLabels);
  
  var iS = 'width:100%;padding:12px 14px;background:rgba(10,8,37,0.7);border:1px solid rgba(155,77,255,0.3);border-radius:12px;color:#fff;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box';
  var lS = 'display:block;font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:6px';
  
  var html = '<div style="padding:4px 0">'
    + '<label style="' + lS + '">الاسم *</label>'
    + '<input id="ef-name" type="text" value="' + esc(u.name||'') + '" placeholder="اسم الموظف" style="' + iS + '">'
    + (isEdit 
        ? '<div style="font-size:11px;color:#a78bfa;margin-bottom:12px">📧 ' + esc(u.email||'') + ' <span style="opacity:.6">(البريد ثابت)</span></div>'
        : '<label style="' + lS + '">البريد الإلكتروني *</label>'
          + '<input id="ef-email" type="email" placeholder="employee@chizen.test" style="' + iS + '">'
          + '<label style="' + lS + '">كلمة السر * (6 أحرف+)</label>'
          + '<input id="ef-pass" type="text" placeholder="••••••" style="' + iS + '">')
    + '<label style="' + lS + '">الدور *</label>'
    + '<select id="ef-role" style="' + iS + '">'
    + roleOpts.map(function(r){ return '<option value="' + r.v + '" ' + (u.role === r.v ? 'selected' : '') + '>' + r.l + '</option>'; }).join('')
    + '</select>'
    + '<label style="' + lS + '">القسم (لمدير القسم فقط)</label>'
    + '<select id="ef-cat" style="' + iS + '">'
    + '<option value="">— لا يوجد —</option>'
    + catOpts.map(function(c){ return '<option value="' + c + '" ' + (u.assignedCategory === c ? 'selected' : '') + '>' + catLabels[c] + '</option>'; }).join('')
    + '</select>'
    + '<label style="' + lS + '">الهاتف</label>'
    + '<input id="ef-phone" type="tel" value="' + esc(u.phone||'') + '" placeholder="77xxxxxxx" style="' + iS + 'margin-bottom:16px">'
    + '<button id="ef-save" style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:14px;border-radius:12px;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer;border:none">💾 ' + (isEdit ? 'حفظ التعديلات' : 'إضافة الموظف') + '</button>'
    + '</div>';
  
  showModal(isEdit ? '✏️ تعديل موظف' : '➕ إضافة موظف', html);
  
  document.getElementById('ef-save').onclick = async function(){
    var btn = this;
    var name = document.getElementById('ef-name').value.trim();
    var role = document.getElementById('ef-role').value;
    var cat = document.getElementById('ef-cat').value;
    var phone = document.getElementById('ef-phone').value.trim();
    
    if (!name) { toast('⚠️ الاسم مطلوب', 'error'); return; }
    
    if (isEdit && u.id === state.user.uid && role !== 'super_admin') {
      if (!confirm('⚠️ تغيير دورك من سوبر أدمن سيُخرجك من اللوحة. متابعة؟')) {
        return;
      }
    }
    
    btn.disabled = true;
    btn.textContent = '⏳...';
    
    try {
      if (isEdit) {
        await db.collection('users').doc(u.id).update({
          name: name, role: role, assignedCategory: cat || null, phone: phone,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        toast('✅ تم التحديث', 'success');
      } else {
        var email = document.getElementById('ef-email').value.trim();
        var pass = document.getElementById('ef-pass').value;
        if (!email) { toast('⚠️ البريد مطلوب', 'error'); btn.disabled=false; btn.textContent='إضافة الموظف'; return; }
        if (!pass || pass.length < 6) { toast('⚠️ كلمة السر 6+', 'error'); btn.disabled=false; btn.textContent='إضافة الموظف'; return; }
        
        var apiKey = firebase.app().options.apiKey;
        var r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + apiKey, {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: email, password: pass, returnSecureToken: false})
        });
        var d = await r.json();
        if (d.error) {
          var em = d.error.message;
          if (em === 'EMAIL_EXISTS') throw new Error('البريد مستخدم بالفعل');
          if (em.indexOf('WEAK_PASSWORD') !== -1) throw new Error('كلمة السر قصيرة (6+)');
          if (em === 'INVALID_EMAIL') throw new Error('بريد غير صحيح');
          throw new Error(em);
        }
        var uid = d.localId;
        await db.collection('users').doc(uid).set({
          name: name, email: email, role: role,
          assignedCategory: cat || null, phone: phone,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: state.user.uid,
          isTemporary: false
        });
        toast('✅ تمت إضافة الموظف — يمكنه الدخول الآن', 'success');
      }
      
      var closeBtn = document.querySelector('#modal-close');
      if (closeBtn) closeBtn.click();
      await loadAll();
      renderTab('team');
    } catch(e) {
      btn.disabled = false;
      btn.textContent = isEdit ? '💾 حفظ التعديلات' : 'إضافة الموظف';
      toast('❌ ' + (e.message || 'فشل'), 'error');
    }
  };
}

`;

h = h.slice(0, sIdx) + newTeam + h.slice(eIdx);

fs.writeFileSync('dashboard.html', h);
console.log('✅ v264: إدارة الموظفين | ' + before + ' -> ' + h.length);
