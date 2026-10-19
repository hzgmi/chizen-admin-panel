const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// كود هيتحط في آخر الصفحة عشان يكسر التعليق
const fixScript = `
<script>
// كود طوارئ: لو التطبيق علق في شاشة "جاري التحقق"، هيجبره يفتح الدخول
setTimeout(function() {
    var gb = document.getElementById('gb');
    if (gb && gb.innerHTML.includes('جاري التحقق')) {
        if (window.A && typeof window.A.loginScreen === 'function') {
            window.A.loginScreen();
        }
    }
}, 1500);
</script>
</body>
`;

if (html.includes('</body>')) {
    html = html.replace('</body>', fixScript);
} else {
    html += fixScript;
}

fs.writeFileSync('index.html', html);
console.log('✅ تم حقن كود الطوارئ بنجاح.');
