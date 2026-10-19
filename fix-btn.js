const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// استبدال الزرار القديم بالكامل (اللي فيه window.A.access) بالزرار الجديد
const oldButtonRegex = /<button class="gbtn"[^>]*onclick="this\.innerText='جاري الدخول\.\.\.'[^>]*>🔓 تسجيل الدخول للإدارة<\/button>/;
const newButton = '<button class="gbtn" onclick="forceLogin()">🔓 تسجيل الدخول للإدارة</button>';

html = html.replace(oldButtonRegex, newButton);

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم استبدال الزرار القديم');
