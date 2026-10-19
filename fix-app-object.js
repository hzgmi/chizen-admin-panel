const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// التأكد إن المتغير A متعرف صح
if (!html.includes('var A =') && !html.includes('var A=')) {
    // لو مش موجود، نضيفه قبل قفل الـ script
    html = html.replace('window.forceLogin = function()', 'var A = window.A || {};\n\nwindow.forceLogin = function()');
}

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم إصلاح المتغير A');
