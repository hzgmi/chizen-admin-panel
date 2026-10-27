const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// ابحث عن sc-banners
const scStart = html.indexOf('<div class="sc" id="sc-banners">');
console.log('📍 sc-banners موجودة عند: ' + scStart);

// اطبع 1500 حرف بعدها
console.log('\n📋 محتوى sc-banners والمنطقة بعدها:');
console.log(html.slice(scStart, scStart + 1500));

// ابحث عن أول </div> بعدها
const firstClose = html.indexOf('</div>', scStart);
console.log('\n📍 أول </div> بعدها عند: ' + firstClose);
console.log('📋 بين sc-banners وأول </div>:');
console.log(JSON.stringify(html.slice(scStart + 30, firstClose)));
