const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

// إصلاح ترتيب Object.assign (id الحقيقي يأتي أخيراً فيطغى)
h = h.replace(
  "state.orders = results[0].docs.map(function(d){ return Object.assign({id: d.id}, d.data()); });",
  "state.orders = results[0].docs.map(function(d){ return Object.assign({}, d.data(), {id: d.id}); });"
);
h = h.replace(
  "state.products = results[1].docs.map(function(d){ return Object.assign({id: d.id}, d.data()); });",
  "state.products = results[1].docs.map(function(d){ return Object.assign({}, d.data(), {id: d.id}); });"
);
h = h.replace(
  "state.users = results[2].docs.map(function(d){ return Object.assign({id: d.id}, d.data()); });",
  "state.users = results[2].docs.map(function(d){ return Object.assign({}, d.data(), {id: d.id}); });"
);
h = h.replace(
  "state.notifications = results[3].docs.map(function(d){ return Object.assign({id: d.id}, d.data()); });",
  "state.notifications = results[3].docs.map(function(d){ return Object.assign({}, d.data(), {id: d.id}); });"
);

fs.writeFileSync('dashboard.html', h);
console.log('✅ v263: اصلاح Object.assign |', before, '->', h.length);
