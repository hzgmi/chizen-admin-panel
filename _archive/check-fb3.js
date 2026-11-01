const fs = require('fs');
const h = fs.readFileSync('index.html','utf8');
const s = fs.readFileSync('firebase-service.js','utf8');
const pats = {
  'settings (any)':  /settings/gi,
  'settingsEngine':  /settingsEngine/gi,
  'applySettings':   /applySettings/gi,
  'getDoc/getDocs':  /getDoc|getDocs/g,
  'signIn':          /signIn/gi,
  'doc(db,':         /doc\s*\(\s*db/g,
};
for (const [k,re] of Object.entries(pats)){
  const ch = (h.match(re)||[]).length;
  const cs = (s.match(re)||[]).length;
  const mark = (ch>0||cs>0) ? '✅' : '❌';
  console.log(mark+' '+k.padEnd(18)+' | index.html: '+ch+' | fb-service: '+cs);
}
