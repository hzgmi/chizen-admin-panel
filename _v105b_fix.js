const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 1. إزالة السطر الذي يخفي الواجهة القديمة بالقوة (لأنه قد يعطل اللوحة بعد الدخول)
h = h.replace('#gb { display: none !important; }', '');

// 2. استبدال سكربت الدخول القديم بالجديد (مع إضافة setPersistence)
const oldJsStart = `window.v105_login = function() {`;
const oldJsEnd = `document.getElementById('v105-pass').addEventListener('keypress', function(e) {`;
const startIdx = h.indexOf(oldJsStart);
const endIdx = h.indexOf(oldJsEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const newJs = `
  window.v105_login = function() {
    var email = document.getElementById('v105-email').value.trim();
    var pass = document.getElementById('v105-pass').value;
    var btn = document.getElementById('v105-btn');
    var err = document.getElementById('v105-err');
    
    if(!email || !pass) { err.textContent = 'يرجى إدخال البريد وكلمة المرور'; return; }
    
    btn.disabled = true; btn.textContent = '⏳ جاري الدخول...'; err.textContent = '';
    
    // 🔑 إضافة الحفظ المحلي لحل مشكلة الشبكة
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(function() {
        return firebase.auth().signInWithEmailAndPassword(email, pass);
      })
      .then(function(userCred) {
        document.getElementById('v105-overlay').style.display = 'none';
        window.location.reload(); // إعادة التحميل لتشغيل اللوحة
      })
      .catch(function(error) {
        btn.disabled = false; btn.textContent = '🔓 تسجيل الدخول';
        err.textContent = '❌ خطأ: ' + (error.message || 'تحقق من البيانات');
      });
  };

  `;
  h = h.slice(0, startIdx) + newJs + h.slice(endIdx);
  console.log('✅ تم تحديث سكربت الدخول وإضافة setPersistence');
} else {
  console.log('❌ لم يتم العثور على سكربت الدخول لتعديله');
}

// 3. تعديل سكربت التحقق من الحالة عند التحميل
const oldCheck = `if (firebase.auth().currentUser) {
    document.getElementById('v105-overlay').style.display = 'none';
    document.getElementById('gb').style.display = 'block';
  } else {`;
const newCheck = `if (firebase.auth().currentUser) {
    document.getElementById('v105-overlay').style.display = 'none';
  } else {`;
h = h.replace(oldCheck, newCheck);

fs.writeFileSync('index.html', h);
console.log('✅ تم إصلاح الواجهة');
