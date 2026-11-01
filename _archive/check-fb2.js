const fs = require('fs');
function scan(path,label){
  const h = fs.readFileSync(path,'utf8');
  const pats = {
    'settings (any)':       /settings/gi,
    'settingsEngine':       /settingsEngine/gi,
    'applySettings':        /applySettings/gi,
    'chzSettings':          /chzSettings/gi,
    'loadConfig':           /loadConfig/gi,
    'doc(db,' :             /doc\s*\(\s*db/g,
    'getDoc/getDocs':       /getDoc|getDocs/g,
    'setDoc/updateDoc':     /setDoc|updateDoc|addDoc/g,
    'signIn':               /signIn/gi,
    'createUser':           /createUser/gi,
    'currentUser':          /currentUser/g,
    'db.collection':        /\.collection\s*\(/g,
    'collection(db':        /collection\s*\(\s*db/g,
  };
  console.log('\n=== '+label+' ===');
  for (const [k,re] of Object.entries(pats)){
    const c = (h.match(re)||[]).length;
    console.log((c>0?'✅':'❌')+' '+k.padEnd(22)+' -> '+c);
  }
}
scan('client/chizen.html','chizen.html');
scan('client/firebase-service.js','firebase-service.js');
scan('client/firebase-config.js','firebase-config.js');
