const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

h = h.replace(/<script id="v253-zindex">[\s\S]*?<\/script>/g, '');
h = h.replace(/<style id="v253-zcss">[\s\S]*?<\/style>/g, '');

const v253 = `
<style id="v253-zcss">
.v251-ov { z-index: 99999999 !important; }
.v249-ov { z-index: 99999999 !important; }
.v101-modal-overlay { z-index: 99999999 !important; }
</style>
<script id="v253-zindex">
(function(){
  console.log('[V253] modal z-index fixed to 99999999');
})();
</script>
`;

h = h.replace('</body>', v253 + '\n</body>');
fs.writeFileSync('index.html', h);
console.log('✅ v253: z-index للمودال فوق #cat-mgr-app');
