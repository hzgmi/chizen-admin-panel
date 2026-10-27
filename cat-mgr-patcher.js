const fs = require('fs');
const TARGET = 'index.html';
const MARKER = '<!-- CAT_MGR_V1_PATCH -->';
let html = fs.readFileSync(TARGET, 'utf8');
if (html.includes(MARKER)) { console.log('✅ Already patched.'); process.exit(0); }
if (!html.includes('</body>')) { console.error('❌ No </body>'); process.exit(1); }

const injection = MARKER + String.raw`
<style>
#cat-mgr-app{position:fixed;inset:0;z-index:99999;background:var(--bg,#fff);overflow-y:auto;padding:14px;display:none;font-family:inherit}
#cat-mgr-app *{box-sizing:border-box}
.cm-header{display:flex;align-items:center;gap:10px;padding:12px 0;margin-bottom:8px;border-bottom:1px solid var(--border,#e5e5e5);position:sticky;top:0;background:var(--bg,#fff);z-index:2}
.cm-header h2{flex:1;margin:0;font-size:16px}
.cm-back{background:transparent;border:1px solid var(--border,#e5e5e5);padding:6px 12px;border-radius:10px;cursor:pointer;font-size:16px}
.cm-badge{background:#ef4444;color:#fff;border-radius:20px;padding:2px 9px;font-size:12px;font-weight:700;min-width:22px;text-align:center}
.cm-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
.cm-kpi{background:var(--card,#f7f7f7);padding:14px 10px;border-radius:12px;text-align:center}
.cm-kpi b{display:block;font-size:22px;margin-bottom:4px}
.cm-kpi small{font-size:11px;color:var(--muted,#888);display:block}
.cm-tabs{display:flex;gap:6px;margin:14px 0}
.cm-tabs button{flex:1;padding:11px 6px;border:1px solid var(--border,#e5e5e5);border-radius:10px;background:transparent;cursor:pointer;font-family:inherit;font-size:13px}
.cm-tabs button.active{background:#9B4DFF;color:#fff;border-color:#9B4DFF;font-weight:700}
.cm-empty{text-align:center;padding:50px 20px;color:var(--muted,#888);font-size:14px}
.cm-order{background:var(--card,#f7f7f7);border:1px solid var(--border,#e5e5e5);border-radius:14px;padding:14px;margin-bottom:12px}
.cm-order-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:13px;padding-bottom:10px;border-bottom:1px dashed var(--border,#e5e5e5)}
.cm-order-head b{color:#9B4DFF;font-size:15px}
.cm-order-meta{font-size:12px;color:var(--muted,#888);margin-top:2px}
.cm-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border,#eee);cursor:pointer}
.cm-item:last-child{border-bottom:none}
.cm-item input[type=checkbox]{width:22px;height:22px;accent-color:#22c55e;flex-shrink:0;cursor:pointer}
.cm-item img{width:42px;height:42px;object-fit:cover;border-radius:8px;background:#eee;flex-shrink:0}
.cm-item-info{flex:1;min-width:0}
.cm-item-info b{display:block;font-size:13px;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-item-info span{font-size:11px;color:var(--muted,#888)}
.cm-item-price{font-size:13px;font-weight:700;color:#9B4DFF}
.cm-reason{width:100%;padding:11px;margin:10px 0;border:1px solid var(--border,#e5e5e5);border-radius:10px;background:transparent;font-family:inherit;font-size:13px;color:inherit}
.cm-order-foot{display:flex;gap:8px;margin-top:4px}
.cm-order-foot button{flex:1;padding:13px;border:none;border-radius:11px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}
.cm-btn-ok{background:#22c55e;color:#fff}
.cm-btn-ok:disabled{opacity:.35;cursor:not-allowed}
.cm-btn-warn{background:#ef4444;color:#fff}
.cm-product{background:var(--card,#f7f7f7);border-radius:12px;padding:12px;margin-bottom:10px;display:flex;gap:10px;align-items:center}
.cm-product img{width:56px;height:56px;object-fit:cover;border-radius:10px;background:#eee;flex-shrink:0}
.cm-product-info{flex:1;min-width:0}
.cm-product-info b{font-size:14px;display:block;margin-bottom:3px}
.cm-product-info span{font-size:12px;color:var(--muted,#888)}
.cm-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:12px 22px;border-radius:30px;z-index:100000;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.3)}
</style>

<div id="cat-mgr-app" dir="rtl">
  <div class="cm-header">
    <button class="cm-back" onclick="catMgrApp.back()">←</button>
    <h2>مدير القسم — <span id="cm-cat-name">...</span></h2>
    <span id="cm-badge" class="cm-badge" style="display:none">0</span>
  </div>
  <div class="cm-kpis">
    <div class="cm-kpi"><b id="cm-kpi-orders">0</b><small>طلبات جديدة</small></div>
    <div class="cm-kpi"><b id="cm-kpi-products">0</b><small>منتجاتي</small></div>
    <div class="cm-kpi"><b id="cm-kpi-value">0</b><small>قيمة معلّقة</small></div>
  </div>
  <div class="cm-tabs">
    <button class="active" data-cm-tab="pending" onclick="catMgrApp.switchTab('pending')">قيد المراجعة</button>
    <button data-cm-tab="products" onclick="catMgrApp.switchTab('products')">منتجاتي</button>
  </div>
  <main id="cm-content"></main>
</div>

<script>
window.catMgrApp = (function(){
  const CAT_LABELS = {electronics:'إلكترونيات',fashion:'أزياء',home:'منزل',beauty:'تجميل',kids:'أطفال',sports:'رياضة',groceries:'بقالة',auto:'سيارات',cars:'سيارات',phones:'هواتف',books:'كتب',health:'صحة'};
  const state = {user:null,cat:null,activeTab:'pending',pending:[],products:[],unsub:null,initialized:false};
  const $ = id => document.getElementById(id);
  const label = c => CAT_LABELS[c] || c || '—';
  const esc = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function fmtDate(ts){if(!ts)return '—';try{const d=ts.toDate?ts.toDate():new Date(ts);return d.toLocaleDateString('ar-YE');}catch(e){return '—';}}
  function toast(m){const t=document.createElement('div');t.className='cm-toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}

  async function init(userDoc){
    if(!userDoc||userDoc.role!=='cat_manager')return false;
    if(state.initialized)return true;
    state.user=userDoc;state.cat=userDoc.assignedCategory;
    if(!state.cat){toast('⚠️ لم يُعيَّن قسم');return false;}
    $('cm-cat-name').textContent=label(state.cat);
    $('cat-mgr-app').style.display='block';
    state.initialized=true;
    await loadProducts();subscribeOrders();return true;
  }

  function back(){toast('هذه لوحتك المخصصة');}
  function switchTab(t){state.activeTab=t;document.querySelectorAll('.cm-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.cmTab===t));render();}

  async function loadProducts(){
    try{const snap=await db.collection('products').where('category','==',state.cat).get();state.products=snap.docs.map(d=>({id:d.id,...d.data()}));$('cm-kpi-products').textContent=state.products.length;}
    catch(e){console.error('loadProducts:',e);state.products=[];}
  }

  function subscribeOrders(){
    if(state.unsub)state.unsub();
    state.unsub=db.collection('orders').where('workflowStatus','==','awaiting_categories').onSnapshot(snap=>{
      const pending=[];
      snap.forEach(d=>{const data=d.data();const c=data.categories&&data.categories[state.cat];if(c&&c.status==='pending')pending.push({id:d.id,...data});});
      state.pending=pending;updateKpis();if(state.activeTab==='pending')render();
    },err=>{console.error('subscribeOrders:',err);toast('⚠️ '+ (err.code||err.message));});
  }

  function updateKpis(){
    $('cm-kpi-orders').textContent=state.pending.length;
    const b=$('cm-badge');
    if(state.pending.length>0){b.textContent=state.pending.length;b.style.display='inline-block';}else b.style.display='none';
    let total=0;state.pending.forEach(o=>{const c=o.categories&&o.categories[state.cat];if(c&&c.subtotal)total+=Number(c.subtotal)||0;});
    $('cm-kpi-value').textContent=total.toFixed(0);
  }

  function render(){if(state.activeTab==='pending')return renderPending();if(state.activeTab==='products')return renderProducts();}

  function renderPending(){
    const w=$('cm-content');
    if(!state.pending.length){w.innerHTML='<div class="cm-empty">✨ لا توجد طلبات بانتظار المراجعة</div>';return;}
    w.innerHTML=state.pending.map(o=>{
      const catData=(o.categories&&o.categories[state.cat])||{items:[]};
      const items=catData.items||[];
      const total=items.reduce((s,i)=>s+(Number(i.price)||0)*(Number(i.qty)||1),0);
      const allChecked=items.every(i=>i._catStatus!==false);
      return '<div class="cm-order" data-order="'+esc(o.id)+'"><div class="cm-order-head"><div><b>#'+esc(String(o.id).slice(-6))+'</b><div class="cm-order-meta">'+esc(o.customerName||'عميل')+' • '+fmtDate(o.createdAt)+'</div></div><div><b>'+total.toFixed(0)+'</b> <small>ريال</small></div></div>'+
        items.map((it,idx)=>'<label class="cm-item"><input type="checkbox" data-idx="'+idx+'" '+(it._catStatus===false?'':'checked')+' onchange="catMgrApp.toggleItem(\''+esc(o.id)+'\','+idx+',this.checked)"><img src="'+esc(it.img||'')+'" alt=""><div class="cm-item-info"><b>'+esc(it.name||'—')+'</b><span>الكمية: '+(it.qty||1)+'</span></div><div class="cm-item-price">'+((Number(it.price)||0)*(Number(it.qty)||1)).toFixed(0)+'</div></label>').join('')+
        '<input class="cm-reason" type="text" id="cm-reason-'+esc(o.id)+'" placeholder="سبب الرفض (مطلوب عند الرفض فقط)">'+
        '<div class="cm-order-foot"><button class="cm-btn-ok" '+(allChecked?'':'disabled')+' onclick="catMgrApp.confirm(\''+esc(o.id)+'\')">✓ تأكيد التوفر</button><button class="cm-btn-warn" onclick="catMgrApp.reject(\''+esc(o.id)+'\')">✗ رفض</button></div></div>';
    }).join('');
  }

  function renderProducts(){
    const w=$('cm-content');
    if(!state.products.length){w.innerHTML='<div class="cm-empty">لا توجد منتجات في قسمك</div>';return;}
    w.innerHTML=state.products.map(p=>'<div class="cm-product"><img src="'+esc(p.img||'')+'" alt=""><div class="cm-product-info"><b>'+esc(p.name)+'</b><span>'+esc(p.brand||'')+' • '+(Number(p.price)||0).toFixed(0)+' ريال • مخزون: '+(p.stock||0)+'</span></div></div>').join('');
  }

  function toggleItem(orderId,idx,checked){
    const o=state.pending.find(x=>x.id===orderId);if(!o)return;
    const items=o.categories[state.cat].items;items[idx]._catStatus=checked;
    const card=document.querySelector('[data-order="'+orderId+'"]');
    if(card){const all=items.every(i=>i._catStatus!==false);const btn=card.querySelector('.cm-btn-ok');if(btn)btn.disabled=!all;}
  }

  async function confirm(orderId){
    const o=state.pending.find(x=>x.id===orderId);if(!o)return;
    try{
      await db.runTransaction(async tx=>{
        const ref=db.collection('orders').doc(orderId);const doc=await tx.get(ref);if(!doc.exists)throw new Error('اختفى');
        const data=doc.data();const categories=data.categories||{};const catObj=Object.assign({},categories[state.cat]||{});
        catObj.items=(catObj.items||[]).map(i=>({...i,_catStatus:i._catStatus!==false}));
        catObj.status='confirmed';catObj.confirmedBy=state.user.uid;catObj.confirmedByName=state.user.name||'';
        catObj.confirmedAt=firebase.firestore.FieldValue.serverTimestamp();
        const updates={};updates['categories.'+state.cat]=catObj;
        const merged=Object.assign({},categories,{[state.cat]:catObj});
        const allResolved=Object.keys(merged).every(k=>{const s=merged[k]&&merged[k].status;return s==='confirmed'||s==='rejected';});
        const anyRejected=Object.keys(merged).some(k=>merged[k]&&merged[k].status==='rejected');
        if(allResolved)updates.workflowStatus=anyRejected?'payment_rejected':'ready_to_send';
        tx.update(ref,updates);
      });
      await notifyCustomer(o.customerId,{title:'✅ تم تأكيد توفر منتجاتك',body:'طلبك #'+String(orderId).slice(-6)+' من قسم '+label(state.cat)+' جاهز',type:'order',event:'cat_confirmed',icon:'✅',deepLink:'order/'+orderId});
      await notifyRole('delivery_mgr',{title:'📦 طلب بحاجة لجدولة توصيل',body:'#'+String(orderId).slice(-6)+' — قسم '+label(state.cat)+' أكّد',type:'order',event:'cat_confirmed',icon:'📦',deepLink:'order/'+orderId});
      toast('✅ تم التأكيد');
    }catch(e){console.error('confirm:',e);toast('❌ '+(e.message||e.code||'خطأ'));}
  }

  async function reject(orderId){
    const o=state.pending.find(x=>x.id===orderId);if(!o)return;
    const el=$('cm-reason-'+orderId);const reason=el?el.value.trim():'';
    if(!reason){toast('⚠️ أدخل سبب الرفض');if(el)el.focus();return;}
    try{
      await db.runTransaction(async tx=>{
        const ref=db.collection('orders').doc(orderId);const doc=await tx.get(ref);if(!doc.exists)throw new Error('اختفى');
        const data=doc.data();const catObj=Object.assign({},(data.categories||{})[state.cat]||{});
        catObj.status='rejected';catObj.rejectReason=reason;catObj.rejectedBy=state.user.uid;catObj.rejectedByName=state.user.name||'';
        catObj.rejectedAt=firebase.firestore.FieldValue.serverTimestamp();
        const updates={};updates['categories.'+state.cat]=catObj;updates.workflowStatus='payment_rejected';
        tx.update(ref,updates);
      });
      await notifyCustomer(o.customerId,{title:'⚠️ تحديث بخصوص طلبك',body:'قسم '+label(state.cat)+': '+reason,type:'warning',event:'cat_rejected',icon:'⚠️',important:true,deepLink:'order/'+orderId});
      await notifyRole('delivery_mgr',{title:'🚫 طلب مرفوض',body:'#'+String(orderId).slice(-6)+' — '+label(state.cat)+': '+reason,type:'warning',event:'cat_rejected',icon:'🚫',important:true,deepLink:'order/'+orderId});
      toast('تم الرفض');
    }catch(e){console.error('reject:',e);toast('❌ '+(e.message||e.code||'خطأ'));}
  }

  async function notifyCustomer(userId,payload){
    if(!userId)return;
    try{await db.collection('notifications').add({userId,...payload,read:false,createdAt:firebase.firestore.FieldValue.serverTimestamp()});}catch(e){console.warn(e);}
  }
  async function notifyRole(role,payload){
    try{const snap=await db.collection('users').where('role','==',role).get();await Promise.all(snap.docs.map(u=>notifyCustomer(u.id,payload)));}catch(e){console.warn(e);}
  }

  function hookAuth(){
    if(typeof firebase==='undefined'||!firebase.auth){return setTimeout(hookAuth,800);}
    firebase.auth().onAuthStateChanged(async user=>{
      if(!user)return;
      try{const doc=await db.collection('users').doc(user.uid).get();if(!doc.exists)return;const data=doc.data();if(data.role==='cat_manager')setTimeout(()=>init({uid:user.uid,...data}),800);}catch(e){console.warn(e);}
    });
  }
  if(document.readyState==='complete')hookAuth();else window.addEventListener('load',hookAuth);
  return {init,back,switchTab,toggleItem,confirm,reject,state};
})();
</script>
`;

const idx = html.lastIndexOf('</body>');
html = html.slice(0, idx) + injection + '\n' + html.slice(idx);
fs.writeFileSync(TARGET, html);
console.log('✅ Patched. New size:', html.length);
