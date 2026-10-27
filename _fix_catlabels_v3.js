const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

const oldStr = "const CAT_LABELS = {electronics:'إلكترونيات',fashion:'أزياء',home:'منزل',beauty:'تجميل',kids:'أطفال',sports:'رياضة',groceries:'بقالة',auto:'سيارات',cars:'سيارات',phones:'هواتف',books:'كتب',health:'صحة'};";
const newStr = "const CAT_LABELS = {electronics:'إلكترونيات',fashion:'أزياء',clothing:'ملابس',sports:'أدوات رياضية',beauty:'جمال وعطور',kids:'مستلزمات أطفال',tools:'أدوات منزلية',home:'منزل وأثاث',cars:'سيارات',phones:'هواتف',books:'كتب',health:'صحة'};";

const count = h.split(oldStr).length - 1;
if (count !== 1) {
  console.log('❌ expected 1 occurrence, found', count);
  process.exit(1);
}
h = h.replace(oldStr, newStr);
fs.writeFileSync('index.html', h);
console.log('✅ CAT_LABELS fixed |', before, '->', h.length);

// تحقق نهائي على كل index.html
const oldParts = ["groceries:'بقالة'", "auto:'سيارات'", "beauty:'تجميل'"];
oldParts.forEach(p => {
  const n = h.split(p).length - 1;
  console.log(n === 0 ? '✅' : '❌', p, '=', n);
});
