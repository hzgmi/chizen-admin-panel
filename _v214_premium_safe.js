const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

// 1. حذف لوحة التشخيص DBG
h = h.replace(/<div id="chz-dbg-v2"[\s\S]*?<\/script>/g, '');

// 2. إضافة CSS فخم (آمن - يلمس الألوان والظلال فقط، لا يلمس الـ display)
const css = `
<style id="v214-css">
/* خلفية متدرجة فخمة */
body, #am { background: #0a0825 !important; }
#am { background: radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, #0a0825 70%) !important; }

/* الشعار */
.gl { background: linear-gradient(135deg, #7c3aed, #ec4899) !important; -webkit-background-clip: text !important; background-clip: text !important; -webkit-text-fill-color: transparent !important; }
.gt { color: #a78bfa !important; }

/* التبويبات */
.tb { background: rgba(155,77,255,0.08) !important; border: 1px solid rgba(155,77,255,0.2) !important; color: #a78bfa !important; border-radius: 14px !important; transition: all 0.2s !important; }
.tb.active, .tb.on { background: linear-gradient(135deg, #7c3aed, #ec4899) !important; color: #fff !important; border-color: transparent !important; box-shadow: 0 6px 20px rgba(168,85,247,0.4) !important; }

/* بطاقات الإحصائيات */
.scd { background: linear-gradient(135deg, #1a1230 0%, #121028 100%) !important; border: 1px solid rgba(155,77,255,0.25) !important; border-radius: 18px !important; padding: 16px 12px !important; position: relative !important; overflow: hidden !important; transition: transform 0.2s, box-shadow 0.2s !important; }
.scd::before { content: '' !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; height: 3px !important; background: linear-gradient(90deg, #7c3aed, #ec4899) !important; }
.scd:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 30px rgba(168,85,247,0.2) !important; border-color: rgba(168,85,247,0.5) !important; }
.sv { color: #fff !important; font-size: 24px !important; font-weight: 900 !important; margin: 6px 0 !important; }
.sl { color: #a78bfa !important; font-size: 12px !important; font-weight: 700 !important; }
.ss { color: #6b5a8a !important; font-size: 10px !important; }

/* البطاقات العامة */
.cd { background: linear-gradient(135deg, #1a1230 0%, #121028 100%) !important; border: 1px solid rgba(155,77,255,0.2) !important; border-radius: 18px !important; padding: 18px !important; }
.ctl { color: #fff !important; }
.ib { color: #fff !important; font-size: 16px !important; font-weight: 900 !important; border-bottom: 1px solid rgba(155,77,255,0.2) !important; padding-bottom: 10px !important; margin-bottom: 14px !important; }

/* شبكة الأدوات */
.more-grid > * { background: linear-gradient(135deg, #1a1230 0%, #121028 100%) !important; border: 1px solid rgba(155,77,255,0.2) !important; border-radius: 16px !important; color: #fff !important; transition: transform 0.15s !important; }
.more-grid > *:active { transform: scale(0.95) !important; border-color: #a78bfa !important; }

/* بطاقة الترحيب */
#v214-welcome { background: linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(236,72,153,0.15) 100%) !important; border: 1px solid rgba(168,85,247,0.4) !important; border-radius: 20px !important; padding: 20px !important; margin-bottom: 20px !important; text-align: center !important; box-shadow: 0 8px 24px rgba(168,85,247,0.2) !important; }
#v214-welcome h2 { color: #fff !important; font-size: 20px !important; margin: 0 0 6px 0 !important; font-weight: 900 !important; }
#v214-welcome p { color: #a78bfa !important; font-size: 13px !important; margin: 0 !important; }
</style>
`;

// 3. إضافة JS لبطاقة الترحيب والأيقونات
const js = `
<script id="v214-js">
(function(){
  var tries = 0;
  function hook(){
    tries++;
    if(tries > 100) return setTimeout(hook, 200);
    if(!document.getElementById('sc-dash')) return setTimeout(hook, 200);
    if(window.__v214Ready) return;
    window.__v214Ready = true;

    // 1. إضافة بطاقة الترحيب
    var dashV2 = document.getElementById('dash-v2');
    if(dashV2 && !document.getElementById('v214-welcome')) {
      var name = (window.A && A.currentUser && A.currentUser.displayName) ? A.currentUser.displayName : 'هزيم';
      if(firebase && firebase.auth && firebase.auth().currentUser) {
          name = firebase.auth().currentUser.displayName || firebase.auth().currentUser.email.split('@')[0];
      }
      var hour = new Date().getHours();
      var greet = hour < 12 ? 'صباح الخير' : (hour < 18 ? 'مساء النور' : 'مساء الخير');
      
      dashV2.innerHTML = '<div id="v214-welcome"><h2>👋 ' + greet + ' ' + name + '</h2><p>لوحة الإدارة العامة جاهزة — نظرة سريعة على اليوم</p></div>' + dashV2.innerHTML;
    }

    // 2. إضافة أيقونات للبطاقات
    var cards = document.querySelectorAll('.sg .scd');
    if(cards.length >= 4) {
      var icons = ['💰', '📦', '🛍️', '👥'];
      for(var i=0; i<4; i++) {
        if(cards[i] && !cards[i].querySelector('.v214-icon')) {
          var ic = document.createElement('div');
          ic.className = 'v214-icon';
          ic.style.cssText = 'position:absolute;top:12px;left:12px;font-size:20px;opacity:0.8;';
          ic.textContent = icons[i];
          cards[i].appendChild(ic);
        }
      }
    }
    console.log('[V214] Premium styling + Welcome card injected.');
  }
  hook();
})();
</script>
`;

if (!h.includes('id="v214-css"')) {
  h = h.replace('</head>', css + '\n</head>');
}
if (!h.includes('id="v214-js"')) {
  const idx = h.lastIndexOf('</body>');
  h = h.slice(0, idx) + js + h.slice(idx);
}

fs.writeFileSync('index.html', h);
console.log('✅ v214: التصميم الفخم + الترحيب + الأيقونات |', before, '->', h.length);
