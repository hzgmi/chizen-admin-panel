const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
if (h.includes('id="chz-dbg-v2"')) { console.log('exists'); process.exit(0); }

const diag = `
<div id="chz-dbg-v2" style="position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#000;color:#0f0;padding:8px;font-size:9px;font-family:monospace;direction:ltr;line-height:1.3;max-height:45vh;overflow-y:auto;display:none;border-top:2px solid #0f0">
<button onclick="document.getElementById('chz-dbg-v2').style.display='none'" style="float:right;background:#f00;color:#fff;border:none;padding:2px 6px;border-radius:4px;cursor:pointer;font-size:10px">X</button>
<div id="chz-dbg-log">loading...</div>
</div>
<button onclick="document.getElementById('chz-dbg-v2').style.display='block'" style="position:fixed;bottom:8px;left:8px;z-index:2147483646;background:#0f0;color:#000;border:none;padding:8px 12px;border-radius:6px;font-size:11px;font-weight:900;font-family:monospace">DBG</button>
<script id="chz-dbg-v2-js">
setTimeout(async function(){
  var L=[];
  function add(s){L.push(s); document.getElementById('chz-dbg-log').innerHTML=L.join('<br>');}
  try {
    add('URL: '+location.search);
    add('fb: '+(typeof firebase));
    var u = firebase && firebase.auth && firebase.auth().currentUser;
    add('user: '+(u?u.email:'NONE'));
    add('A.exists: '+(!!window.A));
    add('A.access: '+(typeof (window.A&&A.access)));
    add('A.buildSections: '+(typeof (window.A&&A.buildSections)));
    add('A.renderAll: '+(typeof (window.A&&A.renderAll)));
    add('#gs display: '+(document.getElementById('gs')?getComputedStyle(document.getElementById('gs')).display:'N/A'));
    add('#am display: '+(document.getElementById('am')?getComputedStyle(document.getElementById('am')).display:'N/A'));
    add('#ct len: '+(document.getElementById('ct')?document.getElementById('ct').innerHTML.length:'N/A'));
    add('#ct children: '+(document.getElementById('ct')?document.getElementById('ct').children.length:'N/A'));
    add('#sc-dash: '+(!!document.getElementById('sc-dash')));
    add('#dash-v2 len: '+(document.getElementById('dash-v2')?document.getElementById('dash-v2').innerHTML.length:'N/A'));
    add('#v211-overlay display: '+(document.getElementById('v211-overlay')?getComputedStyle(document.getElementById('v211-overlay')).display:'N/A'));
    add('#v211-fab display: '+(document.getElementById('v211-fab')?getComputedStyle(document.getElementById('v211-fab')).display:'N/A'));
    if(u){
      try {
        var ad = await firebase.firestore().collection('admins').doc(u.uid).get();
        add('admins doc exists: '+ad.exists);
        var us = await firebase.firestore().collection('users').doc(u.uid).get();
        add('users doc exists: '+us.exists);
        if(us.exists) add('role: '+us.data().role);
      }catch(e){add('DB ERR: '+e.message);}
    }
  } catch(e){add('FATAL: '+e.message);}
}, 5000);
</script>
`;
h = h.replace('</body>', diag + '</body>');
fs.writeFileSync('index.html', h);
console.log('✅ DBG panel added');
