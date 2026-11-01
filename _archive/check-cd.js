const fs = require('fs');
const h = fs.readFileSync('index.html','utf8').split('\n');

console.log('═══════ C) BOOKINGS ═══════');
const bookingKeys = ['flight','hotel','bus','hajj','confirmedBy','cancelReason','confirmedAt','bookings'];
bookingKeys.forEach(k=>{
  const c = (fs.readFileSync('index.html','utf8').match(new RegExp("['\"]"+k+"['\"]",'g'))||[]).length;
  console.log((c>0?'✅':'❌')+' '+k.padEnd(16)+' -> '+c);
});

console.log('\n=== bookings status transitions ===');
let c = 0;
for (let i=0;i<h.length;i++){
  if (/\.doc\(.*\)\.update\s*\(\s*\{[^}]*status|bookings.*status\s*:|bookingStatus/i.test(h[i])){
    console.log((i+1)+': '+h[i].trim().substring(0,150));
    c++;
    if (c>=15) break;
  }
}

console.log('\n═══════ D) RBAC HARD CHECK ═══════');
console.log('=== login role check (does it reject non-admin?) ===');
for (let i=0;i<h.length;i++){
  if (/role\s*[=!]==|role\s*===|!role|role\s*!==|unauthorized|غير مصرح|access\s*denied|signOut.*role/i.test(h[i])){
    console.log((i+1)+': '+h[i].trim().substring(0,150));
  }
}

console.log('\n=== do panels check role before render? ===');
let checks = 0;
for (let i=0;i<h.length;i++){
  if (/(if|when).*(role|currentRole).*['"]super_admin|['"]cat_manager|['"]delivery_mgr|['"]accountant|['"]bookings_mgr/i.test(h[i])){
    checks++;
    if (checks<=8) console.log((i+1)+': '+h[i].trim().substring(0,140));
  }
}
console.log('→ total role-gated renders:', checks);
