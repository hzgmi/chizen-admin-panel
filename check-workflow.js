const fs = require('fs');
const h = fs.readFileSync('index.html','utf8');
const workflow = [
  'awaiting_verification',
  'awaiting_categories',
  'ready_to_send',
  'sent_to_customer',
  'delivered',
  'payment_rejected',
  'pending','confirmed','shipped','completed','cancelled'
];
console.log('=== workflowStatus values ===');
workflow.forEach(w=>{
  const c = (h.match(new RegExp("['\"]"+w+"['\"]",'g'))||[]).length;
  console.log((c>0?'✅':'❌')+' '+w.padEnd(24)+' -> '+c);
});

console.log('\n=== RBAC roles ===');
const roles = ['super_admin','cat_manager','delivery_mgr','accountant','bookings_mgr','customer'];
roles.forEach(r=>{
  const c = (h.match(new RegExp(r,'g'))||[]).length;
  console.log((c>0?'✅':'❌')+' '+r.padEnd(16)+' -> '+c);
});

console.log('\n=== Security patterns ===');
const sec = {
  'Rules use request.auth':   /request\.auth/g,
  'showPanel / navigate':     /showPanel|navigate\(|renderPanel/g,
  'role check gate':          /role\s*[=!]==|role\s*===|\.role\s*[=!]==/g,
  'onSnapshot':               /onSnapshot/g,
  'unsubscribe/listeners[]':  /unsubscribe|listeners\s*=\s*\[|\.forEach\(.*unsub/g,
};
for (const [k,re] of Object.entries(sec)){
  const c = (h.match(re)||[]).length;
  console.log((c>0?'✅':'❌')+' '+k.padEnd(26)+' -> '+c);
}
