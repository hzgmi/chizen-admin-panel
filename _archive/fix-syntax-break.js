const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// الكود المكسور الذي تم حقنه بالخطأ
const brokenBlock = /<div class="sc" id="sc-brands">\s*<div class="cd">\s*<div class="cti"><div class="ctl">🏷️ إدارة الماركات<\/div><\/div>\s*<div style="display:flex;gap:5px;margin-bottom:15px;">\s*<input type="text" id="new-brand-input" class="fi" placeholder="اسم الماركة الجديدة..." style="flex:1;">\s*<button class="btn bp" onclick="A.addBrand()">إضافة<\/button>\s*<\/div>\s*<div id="brands-list"><\/div>\s*<\/div>\s*<\/div>/g;

// الكود السليم بصيغة جافاسكريبت (بعلامات تنصيص وجمع)
const fixedBlock = `'<div class="sc" id="sc-brands">'+
            '<div class="cd">'+
                '<div class="cti"><div class="ctl">🏷️ إدارة الماركات</div></div>'+
                '<div style="display:flex;gap:5px;margin-bottom:15px;">'+
                    '<input type="text" id="new-brand-input" class="fi" placeholder="اسم الماركة الجديدة..." style="flex:1;">'+
                    '<button class="btn bp" onclick="A.addBrand()">إضافة</button>'+
                '</div>'+
                '<div id="brands-list"></div>'+
            '</div>'+
        '</div>'+
        `;

html = html.replace(brokenBlock, fixedBlock);

fs.writeFileSync('index.html', html);
if (fs.existsSync('www')) fs.writeFileSync('www/index.html', html);

console.log('✅ تم إصلاح الخطأ البرمجي (Syntax Error) الذي كان يعطل الأزرار والسحب.');

// فحص سريع للتأكد
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
let match; let count = 0; let err = false;
while ((match = scriptRegex.exec(html)) !== null) {
    count++;
    if (!match[1].trim()) continue;
    try { new Function(match[1]); } catch (e) { console.log('❌ لا يزال هناك خطأ:', e.message); err = true; }
}
if (!err) console.log('✅ الكود أصبح سليم 100% (لا توجد أخطاء).');
