const fs = require('fs');
const h = fs.readFileSync('index.html','utf8').split('\n');
console.log('=== Payment verification: what triggers it? ===');
// ابحث عن كلمات مفتاحية للتحقق من الدفع
for (let i=0;i<h.length;i++){
  if (/verifyPayment|payment.*verif|confirmPayment|receipt|إيصال|تحقق.*دفع|مراجعة.*دفع/i.test(h[i])){
    console.log((i+1)+': '+h[i].trim().substring(0,150));
  }
}
