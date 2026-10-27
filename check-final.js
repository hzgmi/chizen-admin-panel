const fs = require('fs');
const h = fs.readFileSync('index.html','utf8').split('\n');

console.log('=== 1. Bookings update patterns (search wider) ===');
let c=0;
for (let i=0;i<h.length;i++){
  if (/bookings|حجز/i.test(h[i]) && /update|set\(|delete|confirm|cancel|complete|تأكيد|إلغاء|إكمال/i.test(h[i])){
    console.log((i+1)+': '+h[i].trim().substring(0,160));
    c++;
    if (c>=20) break;
  }
}

console.log('\n=== 2. checkAdmin full function ===');
for (let i=0;i<h.length;i++){
  if (/checkAdmin\s*[:=]|function\s+checkAdmin/.test(h[i])){
    for (let j=i;j<Math.min(i+45,h.length);j++){
      console.log((j+1)+': '+h[j]);
      if (/^\s*\}\s*;?\s*$/.test(h[j]) && j>i+5) break;
    }
    break;
  }
}
