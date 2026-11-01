const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldBtnRegex = /<button class="gbtn" onclick="this\.innerText='جاري الدخول\.\.\.'.*?🔓 تسجيل الدخول للإدارة<\/button>/s;
const newBtn = `<button class="gbtn" onclick="this.innerText='جاري الدخول...'; FB.auth.signInWithEmailAndPassword('hazimchat@gmail.com', 'Chizen@2026').then((res)=>{ this.innerText='✅ تم الدخول'; window.A.access(res.user); }).catch(e=>{ alert('خطأ: '+e.message); this.innerText='🔓 تسجيل الدخول للإدارة'; })">🔓 تسجيل الدخول للإدارة</button>`;

html = html.replace(oldBtnRegex, newBtn);

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم تعديل الزرار ليفتح اللوحة مباشرة بعد الدخول');
