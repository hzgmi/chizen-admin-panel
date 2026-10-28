const fs = require('fs');
let h = fs.readFileSync('accountant.html', 'utf8');
const before = h.length;

// دالة مساعدة: إيجاد نهاية دالة بعد counting braces
function findEnd(str, startIdx){
  let depth = 0, i = startIdx, inStr = null, inLine = false, inBlock = false;
  for(; i < str.length; i++){
    const c = str[i], n = str[i+1], p = str[i-1];
    if(inLine){ if(c === '\n') inLine = false; continue; }
    if(inBlock){ if(c === '*' && n === '/'){ inBlock = false; i++; } continue; }
    if(inStr){ 
      if(c === '\\'){ i++; continue; }
      if(c === inStr) inStr = null; 
      continue; 
    }
    if(c === '/' && n === '/'){ inLine = true; i++; continue; }
    if(c === '/' && n === '*'){ inBlock = true; i++; continue; }
    if(c === '"' || c === "'" || c === '`'){ inStr = c; continue; }
    if(c === '{') depth++;
    else if(c === '}'){ depth--; if(depth === 0) return i + 1; }
  }
  return -1;
}

function replaceFn(fnSignature, newContent){
  const start = h.indexOf(fnSignature);
  if(start === -1) throw new Error('start not found: ' + fnSignature);
  const end = findEnd(h, start);
  if(end === -1) throw new Error('end not found: ' + fnSignature);
  h = h.slice(0, start) + newContent + h.slice(end);
}

// ═══ 1. renderTransactions ═══
const newTx = `function renderTransactions(){
  var s = calcStats();
  var f = state.txFilter || 'all';
  var q = (state.txSearch || '').toLowerCase();
  var filtered = s.filteredTx.filter(function(t){
    if(f !== 'all' && t.type !== f) return false;
    if(q && (t.userName||'').toLowerCase().indexOf(q)===-1 && (t.reason||'').toLowerCase().indexOf(q)===-1) return false;
    return true;
  });
  var totalIn = 0, totalOut = 0;
  filtered.forEach(function(t){
    if(t.type==='income' || t.type==='paid') totalIn += Number(t.amount)||0;
    else totalOut += Number(t.amount)||0;
  });
  var chips = [['all','الكل'],['advance','تقدمة'],['deduction','خصم'],['paid','دفعة'],['expense','مصروف'],['income','إيراد']].map(function(c){
    var active = f===c[0];
    return '<button data-txf="'+c[0]+'" style="flex-shrink:0;background:'+(active?'linear-gradient(135deg,#f59e0b,#d97706)':'rgba(245,158,11,0.08)')+';border:1px solid '+(active?'transparent':'rgba(245,158,11,0.2)')+';color:'+(active?'#fff':'#b8c0d8')+';padding:8px 14px;border-radius:10px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer">'+c[1]+'</button>';
  }).join('');
  var list = filtered.length ? filtered.map(function(t){
    var tl = {advance:'تقدمة',deduction:'خصم',paid:'دفعة',expense:'مصروف',income:'إيراد'};
    var colors = {advance:'#f59e0b',deduction:'#ef4444',paid:'#22c55e',expense:'#ec4899',income:'#3b82f6'};
    return '<div class="acc-tx"><div class="acc-tx-l"><div class="acc-tx-t" style="color:'+(colors[t.type]||'#fff')+'">'+(tl[t.type]||t.type)+' — '+esc(t.userName||'—')+'</div><div class="acc-tx-s">'+(t.reason ? '📝 '+esc(t.reason) : '')+' · '+fmtDate(t.createdAt)+'</div></div><div class="acc-tx-r"><div class="acc-tx-amt">'+(Number(t.amount)||0).toFixed(0)+' ر</div><div style="margin-top:4px;display:flex;gap:3px;justify-content:flex-end"><button class="acc-btn-sec" style="background:rgba(59,130,246,0.15);color:#60a5fa;border-color:rgba(59,130,246,0.3);padding:3px 6px;font-size:10px;margin:0" onclick="event.stopPropagation();printPaymentReceipt(\\''+t.id+'\\')">🧾</button><button class="acc-btn-sec" style="background:rgba(59,130,246,0.15);color:#60a5fa;border-color:rgba(59,130,246,0.3);padding:3px 6px;font-size:10px;margin:0" onclick="event.stopPropagation();showEditTransactionForm(\\''+t.id+'\\')">✏️</button><button class="acc-btn-sec" style="background:rgba(239,68,68,0.15);color:#f87171;border-color:rgba(239,68,68,0.3);padding:3px 6px;font-size:10px;margin:0" onclick="event.stopPropagation();deleteTransaction(\\''+t.id+'\\')">🗑️</button></div></div></div>';
  }).join('') : '<div class="acc-empty"><div class="acc-empty-icon">💸</div><div class="acc-empty-txt">لا توجد معاملات</div></div>';
  return '<div style="display:flex;gap:8px;margin-bottom:12px">'
    + '<input class="acc-search" style="margin:0;flex:1" placeholder="🔍 بحث..." value="'+esc(state.txSearch||'')+'" oninput="state.txSearch=this.value;renderTab(\\'transactions\\')">'
    + '<button class="acc-btn" onclick="showTransactionForm()" style="flex-shrink:0">➕</button>'
    + '</div>'
    + '<div style="display:flex;gap:4px;margin-bottom:12px;overflow-x:auto;scrollbar-width:none">'+chips+'</div>'
    + '<div class="acc-kpis" style="grid-template-columns:1fr 1fr;margin-bottom:14px">'
    + '<div class="acc-kpi rev"><div class="acc-kpi-num">'+fmt(totalIn)+'</div><div class="acc-kpi-lbl">داخل</div></div>'
    + '<div class="acc-kpi exp"><div class="acc-kpi-num">'+fmt(totalOut)+'</div><div class="acc-kpi-lbl">خارج</div></div>'
    + '</div>'
    + '<div class="acc-card">'+list+'</div>';
}`;

replaceFn('function renderTransactions()', newTx);

// ═══ 2. renderDebts ═══
const newDebts = `function renderDebts(){
  var oweSuppliers = state.suppliers.filter(function(s){ return Number(s.balance) > 0; });
  var advances = state.transactions.filter(function(t){ return t.type==='advance' && t.status==='approved'; });
  var byCust = {};
  state.orders.forEach(function(o){
    if(o.status==='cancelled' || o.status==='completed') return;
    var paid = (o.payment && o.payment.status === 'verified') || o.workflowStatus !== 'awaiting_verification';
    if(paid) return;
    var ts = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().getTime() : 0;
    var cid = o.customerId || o.id;
    if(!byCust[cid]) byCust[cid] = {name:o.customerName||'عميل', phone:o.phone||'', total:0, count:0, oldest:ts};
    byCust[cid].total += Number(o.total)||0;
    byCust[cid].count++;
    if(ts && ts < byCust[cid].oldest) byCust[cid].oldest = ts;
  });
  var customerDebts = Object.keys(byCust).map(function(k){
    var c = byCust[k];
    c.days = c.oldest ? Math.floor((Date.now()-c.oldest)/86400000) : 0;
    return c;
  }).sort(function(a,b){ return b.days - a.days; });
  var totalOwe = oweSuppliers.reduce(function(s,x){ return s + (Number(x.balance)||0); }, 0);
  var totalAdv = advances.reduce(function(s,x){ return s + (Number(x.amount)||0); }, 0);
  var totalCust = customerDebts.reduce(function(s,x){ return s + x.total; }, 0);
  return '<div class="acc-kpis" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:14px">'
    + '<div class="acc-kpi exp"><div class="acc-kpi-num">'+fmt(totalOwe)+'</div><div class="acc-kpi-lbl">للموردين</div></div>'
    + '<div class="acc-kpi cogs"><div class="acc-kpi-num">'+fmt(totalAdv)+'</div><div class="acc-kpi-lbl">سلف موظفين</div></div>'
    + '<div class="acc-kpi profit"><div class="acc-kpi-num">'+fmt(totalCust)+'</div><div class="acc-kpi-lbl">ديون عملاء</div></div>'
    + '</div>'
    + '<div class="acc-card"><div class="acc-card-h"><div class="acc-card-title">💳 ديون العملاء ('+customerDebts.length+')</div></div>'
    + (customerDebts.length ? customerDebts.map(function(c){
        var color = c.days > 14 ? '#ef4444' : (c.days > 7 ? '#f59e0b' : '#22c55e');
        return '<div class="acc-tx"><div class="acc-tx-l"><div class="acc-tx-t">'+esc(c.name)+'</div><div class="acc-tx-s">📞 '+esc(c.phone||'—')+' · '+c.count+' طلب · <span style="color:'+color+'">منذ '+c.days+' يوم</span></div></div><div class="acc-tx-r"><div class="acc-tx-amt" style="color:'+color+'">'+fmt(c.total)+' ر</div></div></div>';
      }).join('') : '<div class="acc-empty-txt" style="padding:8px">لا ديون</div>')
    + '</div>'
    + '<div class="acc-card"><div class="acc-card-h"><div class="acc-card-title">🏢 مستحقات الموردين</div></div>'
    + (oweSuppliers.length ? oweSuppliers.map(function(s){
        return '<div class="acc-tx"><div class="acc-tx-l"><div class="acc-tx-t">'+esc(s.name||'—')+'</div><div class="acc-tx-s">📞 '+esc(s.phone||'—')+'</div></div><div class="acc-tx-r"><div class="acc-tx-amt" style="color:#ef4444">'+fmt(s.balance)+' ر</div></div></div>';
      }).join('') : '<div class="acc-empty-txt" style="padding:8px">لا توجد</div>')
    + '</div>'
    + '<div class="acc-card"><div class="acc-card-h"><div class="acc-card-title">👥 سلف الموظفين</div></div>'
    + (advances.length ? advances.slice(0,15).map(function(t){
        return '<div class="acc-tx"><div class="acc-tx-l"><div class="acc-tx-t">'+esc(t.userName||'—')+'</div><div class="acc-tx-s">'+fmtDate(t.createdAt)+(t.reason?' · '+esc(t.reason):'')+'</div></div><div class="acc-tx-r"><div class="acc-tx-amt" style="color:#f59e0b">'+fmt(t.amount)+' ر</div></div></div>';
      }).join('') : '<div class="acc-empty-txt" style="padding:8px">لا سلف</div>')
    + '</div>';
}`;

replaceFn('function renderDebts()', newDebts);

fs.writeFileSync('accountant.html', h);
console.log('✅ v292b: 3 دوال |', before, '->', h.length);
