const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// البلوك المكسور بالكامل (من أول div الماركات لحد نهايته)
const brokenPattern = /'<div class="sc" id="sc-brands">[\s\S]*?<div class="sc" id="sc-settings">'/;

// البلوك الصحيح بصيغة جافاسكريبت سليمة
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
        '<div class="sc" id="sc-settings">'`;

if (html.match(brokenPattern)) {
    html = html.replace(brokenPattern, fixedBlock);
    fs.writeFileSync('index.html', html);
    if (fs.existsSync('www')) fs.writeFileSync('www/index.html', html);
    console.log('✅ تم إصلاح السطر 182 بنجاح.');
} else {
    console.log('⚠️ لم يتم العثور على النمط، جاري محاولة طريقة أخرى...');
    // طريقة احتياطية: استبدال كل النص المكسور
    html = html.replace(/'<div class="sc" id="sc-brands">\s*<div class="cd">\s*<div class="cti"><div class="ctl">🏷️ إدارة الماركات<\/div><\/div>\s*<div style="display:flex;gap:5px;margin-bottom:15px;">\s*<input type="text" id="new-brand-input" class="fi" placeholder="اسم الماركة الجديدة..." style="flex:1;">\s*<button class="btn bp" onclick="A.addBrand()">إضافة<\/button>\s*<\/div>\s*<div id="brands-list"><\/div>\s*<\/div>\s*<\/div>/, fixedBlock);
    fs.writeFileSync('index.html', html);
    if (fs.existsSync('www')) fs.writeFileSync('www/index.html', html);
    console.log('✅ تم تطبيق الطريقة الاحتياطية.');
}
