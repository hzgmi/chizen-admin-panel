const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// السطر 11416 — داخل v97o
const oldStr = "var catLabels = {electronics:'إلكترونيات',fashion:'أزياء',home:'منزل',beauty:'تجميل',kids:'أطفال',sports:'رياضة',groceries:'بقالة',auto:'سيارات'};";
const newStr = "var catLabels = {electronics:'إلكترونيات',fashion:'أزياء',clothing:'ملابس',sports:'أدوات رياضية',beauty:'جمال وعطور',kids:'مستلزمات أطفال',tools:'أدوات منزلية',home:'منزل وأثاث'};";

const count = h.split(oldStr).length - 1;
if (count !== 1) {
  console.log('❌ expected 1 occurrence, found', count);
  process.exit(1);
}
h = h.replace(oldStr, newStr);
fs.writeFileSync('index.html', h);
console.log('✅ v97o catLabels fixed |', before, '->', h.length);

// تحقق نهائي — هل بقيت نسخة قديمة؟
const oldParts = ["groceries:'بقالة'", "auto:'سيارات'", "beauty:'تجميل'"];
oldParts.forEach(p => {
  const n = h.split(p).length - 1;
  console.log(n === 0 ? '✅' : '❌', p, '=', n);
});
