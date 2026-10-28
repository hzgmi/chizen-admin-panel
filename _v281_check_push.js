const {initializeApp,cert}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const sa=require('/data/data/com.termux/files/home/wa-otp/serviceAccountKey.json');
initializeApp({credential:cert(sa)});
const db=getFirestore();
(async()=>{
  const q = await db.collection('push_queue').limit(5).get();
  console.log('push_queue entries:', q.size);
  q.docs.forEach(d=>console.log('  ', d.id, ':', JSON.stringify(d.data()).slice(0,120)));
  const users = await db.collection('users').limit(20).get();
  let withToken = 0;
  users.forEach(d=>{ if(d.data().fcmToken || d.data().webPushSubscription) withToken++; });
  console.log('users with push token:', withToken, '/', users.size);
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
