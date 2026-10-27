const fs = require('fs');
const h = fs.readFileSync('index.html','utf8').split('\n');
console.log('=== Panel routing / rendering keywords ===');
const pats = ['showTab','switchTab','openPanel','renderPanel','loadPanel','dashboard','navigateTo','goTo','showScreen','renderView'];
for (let i=0;i<h.length;i++){
  const line = h[i];
  pats.forEach(p=>{
    if (new RegExp('function\\s+'+p+'\\b|'+p+'\\s*[:=]\\s*function|\\b'+p+'\\s*\\(').test(line) && line.trim().startsWith('function') || /\b(showTab|switchTab|openPanel|renderPanel|loadPanel|navigateTo|goTo|showScreen)\s*=/.test(line)){
      console.log((i+1)+': '+line.trim().substring(0,140));
    }
  });
}

console.log('\n=== order.status references (top 20) ===');
let c=0;
for (let i=0;i<h.length;i++){
  if (/order\.status|o\.status|\.workflowStatus/.test(h[i])){
    console.log((i+1)+': '+h[i].trim().substring(0,150));
    c++;
    if (c>=20) break;
  }
}
