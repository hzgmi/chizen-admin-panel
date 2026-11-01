const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

if (h.includes('// ═══ LOGIN v2 — robust with preflight')) { console.log('already'); process.exit(0); }

// Replace entire enhanceDoLogin block (from line 5454 to end of function)
const startMark = '  // ═══ إصلاح doLogin بـ timeout + حالة واضحة ═══';
const startIdx = h.indexOf(startMark);
if (startIdx === -1) { console.log('❌ start not found'); process.exit(1); }

// Find end: next "  }\n\n" or "enhanceDoLogin();" call
// Look for the closing pattern of the whole IIFE/module
const endMark = 'enhanceDoLogin();';
const endIdx = h.indexOf(endMark, startIdx);
if (endIdx === -1) { console.log('❌ end not found'); process.exit(1); }

// Find start of the containing block — walk back to find `<script` or `(function`
// We'll replace from startMark to endIdx + endMark.length
const fullEnd = endIdx + endMark.length;

const newBlock = `  // ═══ LOGIN v2 — robust with preflight ═══
  function enhanceDoLogin() {
    if (!window.doLogin) { setTimeout(enhanceDoLogin, 200); return; }
    if (window.doLogin.__robust) return;

    window.doLogin = async function() {
      var btn = document.getElementById('btn-do-login');
      var errBox = document.getElementById('login-err');
      var email = (document.getElementById('login-email') || {}).value || '';
      var pass = (document.getElementById('login-pass') || {}).value || '';
      email = email.trim();

      function setError(msg, type) {
        if (!errBox) return;
        errBox.textContent = msg;
        errBox.style.color = type === 'error' ? '#ef4444' : (type === 'warn' ? '#f59e0b' : '#9ca3af');
      }
      function setBtn(text, disabled) {
        if (!btn) return;
        btn.disabled = !!disabled;
        var span = btn.querySelector('span');
        if (span) span.textContent = text;
        else btn.textContent = text;
      }

      if (!email || !pass) {
        setError('⚠️ أدخل البريد وكلمة السر', 'warn');
        return;
      }

      // ═══ Stage 1: Preflight (fast connection check) ═══
      setBtn('🌐 فحص الاتصال...', true);
      setError('جاري فحص الاتصال...', 'info');

      var online = navigator.onLine;
      if (!online) {
        setError('❌ لا يوجد إنترنت — تحقق من اتصالك', 'error');
        setBtn('🔓 تسجيل الدخول', false);
        return;
      }

      // Try a quick fetch to Firebase (5s max)
      var preflightOK = false;
      try {
        var ctrl = new AbortController();
        var t = setTimeout(function(){ ctrl.abort(); }, 5000);
        var testResp = await fetch('https://identitytoolkit.googleapis.com/v1/projects?key=' + window.FIREBASE_CONFIG.apiKey, {
          method: 'GET',
          signal: ctrl.signal,
          cache: 'no-store'
        }).catch(function(){ return null; });
        clearTimeout(t);
        preflightOK = !!testResp;
      } catch(e) { preflightOK = false; }

      if (!preflightOK) {
        setError('⚠️ الشبكة بطيئة — سنحاول مجدداً', 'warn');
        // Continue anyway — maybe it was just a hiccup
      }

      // ═══ Stage 2: Auth ═══
      setBtn('🔐 جاري التحقق...', true);
      setError('جاري تسجيل الدخول... قد يستغرق 30 ثانية على الشبكات البطيئة', 'info');

      var authStart = Date.now();

      // Progress updater (updates every 3s)
      var progressTimer = setInterval(function() {
        var elapsed = Math.floor((Date.now() - authStart) / 1000);
        if (elapsed < 10) setError('جاري الاتصال بـ Firebase... (' + elapsed + 's)', 'info');
        else if (elapsed < 20) setError('الشبكة بطيئة — يرجى الانتظار... (' + elapsed + 's)', 'warn');
        else if (elapsed < 40) setError('ما زال يحاول... (' + elapsed + 's) — يمكنك الانتظار', 'warn');
        else setError('يستغرق وقتاً طويلاً — سيتم الإلغاء قريباً', 'warn');
      }, 3000);

      try {
        // Persistence (with shorter timeout)
        try {
          await Promise.race([
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL),
            new Promise(function(_, reject) { setTimeout(function() { reject(new Error('persist timeout')); }, 3000); })
          ]);
        } catch(pe) {
          console.warn('[LOGIN] persistence failed, continuing');
        }

        // ═══ Sign in with 60s timeout (was 20s) ═══
        var loginPromise = firebase.auth().signInWithEmailAndPassword(email, pass);
        var timeoutPromise = new Promise(function(_, reject) {
          setTimeout(function() {
            reject(Object.assign(new Error('TIMEOUT'), { code: 'app/timeout' }));
          }, 60000);
        });

        var cred = await Promise.race([loginPromise, timeoutPromise]);
        clearInterval(progressTimer);

        console.log('[LOGIN-v2] ✓ auth success:', cred.user.email);
        setBtn('✅ تم التحقق — جاري فتح اللوحة...', true);
        setError('✅ تم تسجيل الدخول — جاري تحميل اللوحة...', 'success');

        // Wait for dashboard (8s, was 12s)
        var waited = 0;
        var checkDash = setInterval(function() {
          waited += 500;
          var am = document.getElementById('am');
          var isVisible = am && (am.style.display === 'flex' || am.style.display === 'block');
          var gs = document.getElementById('gs');
          var loginHidden = gs && gs.style.display === 'none';

          if (isVisible || loginHidden) {
            clearInterval(checkDash);
            setBtn('🔓 تسجيل الدخول', false);
            setError('', 'info');
          } else if (waited >= 8000) {
            clearInterval(checkDash);
            console.log('[LOGIN-v2] dashboard wait timed out, but auth OK');
            setBtn('🔓 تسجيل الدخول', false);
            setError('⚠️ تم الدخول لكن اللوحة تأخرت — جرّب إعادة تحميل الصفحة', 'warn');
          }
        }, 500);

        return;

      } catch(e) {
        clearInterval(progressTimer);
        console.error('[LOGIN-v2] fail:', e.code, e.message);

        var msg = 'فشل الدخول';
        var type = 'error';

        if (e.code === 'app/timeout' || e.message === 'TIMEOUT') {
          msg = '⏱️ الشبكة بطيئة جداً — انتهت المهلة (60 ثانية). تحقق من الإنترنت أو استخدم شبكة أخرى';
        } else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
          msg = '🔑 البريد أو كلمة السر غير صحيحة';
        } else if (e.code === 'auth/user-not-found') {
          msg = '📧 لا يوجد حساب بهذا البريد';
        } else if (e.code === 'auth/too-many-requests') {
          msg = '🚫 محاولات كثيرة — انتظر 5 دقائق ثم حاول مجدداً';
        } else if (e.code === 'auth/network-request-failed') {
          msg = '🌐 لا يمكن الوصول لـ Firebase — تحقق من الإنترنت أو جرّب VPN';
        } else if (e.code === 'auth/user-disabled') {
          msg = '🚫 الحساب معطل';
        } else if (e.code === 'auth/invalid-email') {
          msg = '📧 بريد إلكتروني غير صالح';
        } else if (e.message && e.message.indexOf('timeout') > -1) {
          msg = '⏱️ انتهت المهلة — شبكة بطيئة';
        } else {
          msg = '❌ ' + (e.message || 'خطأ غير معروف');
          type = 'warn';
        }

        setError(msg, type);
        setBtn('🔓 إعادة المحاولة', false);
      }
    };

    window.doLogin.__robust = true;
    console.log('[LOGIN-v2] installed');
  }
  enhanceDoLogin();`;

h = h.slice(0, startIdx) + newBlock + h.slice(fullEnd);

fs.writeFileSync(p, h);
console.log('✅ Login v2 installed');
console.log('size:', before, '->', h.length, '(', h.length - before, ')');
