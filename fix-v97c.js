const fs = require('fs');
let s = fs.readFileSync('v97c-products.js', 'utf8');
const before = s.length;
s = s.replace(/\\n\\n/g, ' ');
fs.writeFileSync('v97c-products.js', s);
console.log('fixed: before', before, 'after', s.length);
