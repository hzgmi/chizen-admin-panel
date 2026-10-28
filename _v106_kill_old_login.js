const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. العثور على دالة loginScreen القديمة وتدميرها
const oldFnStart = "loginScreen:function(){";
const oldFnEnd = "gateMsg:function(i,t,d){";
const startIdx = h.indexOf(oldFnStart);
const endIdx = h.indexOf(oldFnEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const deadFn = "loginScreen:function(){ console.log('[V106] Old login screen completely destroyed.'); },\n\n  ";
  h = h.slice(0, startIdx) + deadFn + h.slice(endIdx);
  console.log('✅ تم تدمير دالة تسجيل الدخول القديمة بنجاح.');
} else {
  console.log('⚠️ لم يتم العثور على دالة loginScreen القديمة (ربما تم حذفها سابقاً).');
}

// 2. إصلاح مراقب الحالة في v105 لكي يعمل بشكل احترافي بدون تأخير
const oldCheck = `setTimeout(function() {
  if (firebase.auth().currentUser) {
    document.getElementById('v105-overlay').style.display = 'none';
  } else {
    document.getElementById('v105-overlay').style.display = 'flex';
  }
}, 500);`;

const newCheck = `firebase.auth().onAuthStateChanged(function(user) {
  var overlay = document.getElementById('v105-overlay');
  if (user) {
    if(overlay) overlay.style.display = 'none';
  } else {
    if(overlay) overlay.style.display = 'flex';
  }
});`;

h = h.replace(oldCheck, newCheck);

fs.writeFileSync('index.html', h);
console.log('✅ تم التحديث الكلي |', before, '->', h.length);
