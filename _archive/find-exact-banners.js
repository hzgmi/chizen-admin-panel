const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// البحث عن sc-banners بأي طريقة
const positions = [];
let idx = 0;
while ((idx = html.indexOf('sc-banners', idx)) !== -1) {
  positions.push(idx);
  idx += 10;
}

console.log('📍 sc-banners موجود في ' + positions.length + ' مكان:');
positions.forEach((pos, i) => {
  console.log('\n═══ موقع #' + (i + 1) + ' (سطر ' + (html.slice(0, pos).split('\n').length) + ') ═══');
  // اطبع 300 حرف حول الموقع
  const start = Math.max(0, pos - 100);
  const end = Math.min(html.length, pos + 300);
  console.log(JSON.stringify(html.slice(start, end)));
});

// ابحث عن sc-settings
const settingsIdx = html.indexOf('sc-settings');
if (settingsIdx !== -1) {
  console.log('\n═══ sc-settings (سطر ' + (html.slice(0, settingsIdx).split('\n').length) + ') ═══');
  const start = Math.max(0, settingsIdx - 200);
  const end = Math.min(html.length, settingsIdx + 100);
  console.log(JSON.stringify(html.slice(start, end)));
}
