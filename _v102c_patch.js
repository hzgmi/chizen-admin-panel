const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v102c-main"')) { console.log('⚠️ v102c مطبق مسبقاً'); process.exit(0); }

const startMarker = "if(!storage){ toast('❌ Storage غير محمّل'); return; }";
const endMarker = "$('v102-file').value = '';";
const startIdx = h.indexOf(startMarker);
if (startIdx === -1) { console.log('❌ start marker not found'); process.exit(1); }
const endIdx = h.indexOf(endMarker, startIdx);
if (endIdx === -1) { console.log('❌ end marker not found'); process.exit(1); }
const actualEnd = endIdx + endMarker.length;

const NEW_BLOCK = `if(typeof window.__v102c_uploadBatch !== 'function'){ toast('❌ رافع الصور غير محمّل'); return; }
        uploadState.uploading = true;
        var progress = $('v102-progress'); progress.style.display='block';
        var bar = progress.querySelector('.v102-progress-bar');
        var lbl = progress.querySelector('span');
        bar.style.width='0%'; lbl.textContent='0%';
        try {
          await window.__v102c_uploadBatch(files, state.cat, {
            onProgress: function(pct){ bar.style.width=pct+'%'; lbl.textContent=pct+'%'; },
            onUrl: function(url){ uploadState.urls.push(url); renderImgs(); },
            onError: function(err){ toast('❌ '+(err.message||'خطأ')); }
          });
        } catch(e){ console.error('[V102c] upload:', e); toast('❌ '+(e.message||'')); }
        progress.style.display='none';
        uploadState.uploading = false;
        $('v102-file').value = '';`;

h = h.slice(0, startIdx) + NEW_BLOCK + h.slice(actualEnd);

const js = fs.readFileSync('_v102c_js.js', 'utf8');
const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
const block = '\n<script id="v102c-main">' + safeJs + '<\/script>\n';
const bodyIdx = h.lastIndexOf('</body>');
if (bodyIdx === -1) { console.log('❌ </body> not found'); process.exit(1); }
h = h.slice(0, bodyIdx) + block + h.slice(bodyIdx);

fs.writeFileSync('index.html', h);
console.log('✅ patched:', before, '->', h.length, '(+' + (h.length - before) + ')');
