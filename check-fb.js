const fs = require('fs');
const h = fs.readFileSync('index.html', 'utf8');
const patterns = {
  'loadSettings() call':      /loadSettings\s*\(/g,
  'config/settings read':     /config['"]?\s*,\s*['"]settings|doc\(\s*db\s*,\s*['"]config['"]\s*,\s*['"]settings/g,
  'onSnapshot calls':         /onSnapshot\s*\(/g,
  'getDoc calls':             /getDoc\s*\(/g,
  'signInWithEmail':          /signInWithEmailAndPassword|signInWithPopup/g,
  'onAuthStateChanged':       /onAuthStateChanged/g,
  'fcmToken set':             /fcmToken/g,
  'pickup_areas read':        /pickup_areas/g,
  'currency formatting':      /formatCurrency|currencySymbol|currency\s*[:=]/g,
  'workflowStatus refs':      /workflowStatus/g,
  'maintenance mode':         /maintenance/gi,
};
for (const [k, re] of Object.entries(patterns)) {
  const c = (h.match(re) || []).length;
  console.log((c>0?'✅':'❌') + ' ' + k.padEnd(28) + ' -> ' + c);
}
