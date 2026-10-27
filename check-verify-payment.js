const fs = require('fs');
const h = fs.readFileSync('index.html','utf8').split('\n');
console.log('=== verifyPayment full function (3981-4040) ===');
for (let i=3980;i<4045 && i<h.length;i++){
  console.log((i+1)+': '+h[i]);
}
