const fs = require('fs');
const h = fs.readFileSync('index.html','utf8').split('\n');
console.log('=== login flow (first 40 lines around doLogin/auth) ===');
for (let i=0;i<h.length;i++){
  if (/async.*login|function\s+login|checkAdmin|onAuthStateChanged|signInWithEmailAndPassword/i.test(h[i])){
    for (let j=i;j<Math.min(i+50,h.length);j++){
      console.log((j+1)+': '+h[j].trim().substring(0,160));
      if (/^\s*\}\s*;?\s*$/.test(h[j]) && j>i+5) break;
    }
    break;
  }
}
