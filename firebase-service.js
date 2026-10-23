/* CHIZEN — Firebase Service v4 (Ready immediately) */
window.esc = function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
};

window.FB = {
  app: null, auth: null, db: null, ready: false, currentUser: null,

  init: async function() {
    // ═══ فحص سريع للتبعيات ═══
    if (!window.firebase) {
      console.error('[FB] Firebase SDK غير محمّل');
      this.ready = true;
      return false;
    }
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
      console.error('[FB] Firebase config مفقود');
      this.ready = true;
      return false;
    }

    try {
      this.app = (!firebase.apps.length) ? firebase.initializeApp(window.FIREBASE_CONFIG) : firebase.app();
      this.auth = firebase.auth();
      this.db = firebase.firestore();

      // ═══ الأهم: ready = true فوراً قبل أي await ═══
      this.ready = true;
      console.log('[FB] Ready immediately');

      // ═══ كل ما يلي يعمل في الخلفية بدون تعطيل الواجهة ═══
      try {
        this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function(){
          console.log('[FB] Persistence LOCAL ✓');
        }).catch(function(e){ console.warn('[FB] Persistence:', e); });
      } catch(e) {}

      try {
        this.db.enablePersistence().catch(function(e){ console.warn('[FB] db:', e.code); });
      } catch(e) {}

      var self = this;
      try {
        this.auth.onAuthStateChanged(function(user) {
          self.currentUser = user;
          console.log('[FB] User:', user ? user.email : 'null');
        });
      } catch(e) { console.warn('[FB] onAuth:', e); }

      return true;
    } catch (e) {
      console.error('[FB] Init failed:', e);
      this.ready = true;
      return false;
    }
  },

  onAuthChange: function(cb) {
    if (!this.auth) { cb(null); return; }
    this.auth.onAuthStateChanged(function(user){ FB.currentUser = user; cb(user); });
  },
  loginEmail: async function(email, password) {
    if (!this.auth) throw { code: 'auth/not-ready', message: 'Firebase غير جاهز' };
    return await this.auth.signInWithEmailAndPassword(email, password);
  },
  signupEmail: async function(email, password) {
    if (!this.auth) throw { code: 'auth/not-ready', message: 'Firebase غير جاهز' };
    return await this.auth.createUserWithEmailAndPassword(email, password);
  },
  loginGoogle: async function() {
    if (!this.auth) throw { code: 'auth/not-ready', message: 'Firebase غير جاهز' };
    var provider = new firebase.auth.GoogleAuthProvider();
    return await this.auth.signInWithPopup(provider);
  },
  handleGoogleRedirect: async function() {
    if (!this.auth) return null;
    try { var r = await this.auth.getRedirectResult(); return (r && r.user) ? r.user : null; } catch(e) { return null; }
  },
  logout: async function() { if (!this.auth) return; await this.auth.signOut(); },
  updateDisplayName: async function(name) {
    if (!this.currentUser) return;
    await this.currentUser.updateProfile({ displayName: name });
    this.currentUser = this.auth.currentUser;
  },
  sendPasswordReset: async function(email) {
    if (!this.auth) throw { code: 'auth/not-ready', message: 'Firebase غير جاهز' };
    return await this.auth.sendPasswordResetEmail(email);
  },
  getUserId: function() { return this.currentUser ? this.currentUser.uid : null; },
  getUserEmail: function() { return this.currentUser ? this.currentUser.email : null; },
  getUserName: function() { return this.currentUser ? (this.currentUser.displayName || '') : ''; },

  saveUserProfile: async function(data) {
    if (!this.db || !this.currentUser) return;
    data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    data.email = this.currentUser.email;
    data.uid = this.currentUser.uid;
    await this.db.collection('users').doc(this.currentUser.uid).set(data, { merge: true });
  },
  getUserProfile: async function() {
    if (!this.db || !this.currentUser) return null;
    try { var doc = await this.db.collection('users').doc(this.currentUser.uid).get(); return doc.exists ? doc.data() : null; } catch(e) { return null; }
  },
  getAllUsers: async function() {
    if (!this.db) return [];
    try { var snap = await this.db.collection('users').limit(500).get(); var arr = []; snap.forEach(function(doc){ var d = doc.data(); d.uid = doc.id; arr.push(d); }); return arr; } catch(e) { return []; }
  },
  deleteUser: async function(uid) { if (!this.db) return; await this.db.collection('users').doc(uid).delete(); },

  getProducts: async function() {
    if (!this.db) return [];
    try { var snap = await this.db.collection('products').limit(500).get(); var arr = []; snap.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); }); return arr; } catch(e) { return []; }
  },
  addProduct: async function(p) {
    if (!this.db) throw new Error('Firebase not ready');
    var pl = Object.assign({}, p); delete pl.id;
    pl.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    var ref = await this.db.collection('products').add(pl); return ref.id;
  },
  updateProduct: async function(id, p) {
    if (!this.db) throw new Error('Firebase not ready');
    var pl = Object.assign({}, p); delete pl.id;
    pl.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('products').doc(id).update(pl);
  },
  deleteProduct: async function(id) { if (!this.db) return; await this.db.collection('products').doc(id).delete(); },

  getBanners: async function() {
    if (!this.db) return null;
    try { var doc = await this.db.collection('config').doc('banners').get(); if (!doc.exists) return null; var d = doc.data(); return (d && d.list && d.list.length) ? d.list : null; } catch(e) { return null; }
  },
  setBanners: async function(list) {
    if (!this.db) return;
    await this.db.collection('config').doc('banners').set({ list: list, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  },
  getConfig: async function(key) {
    if (!this.db) return null;
    try { var doc = await this.db.collection('config').doc(key).get(); return doc.exists ? doc.data() : null; } catch(e) { return null; }
  },
  setConfig: async function(key, data) {
    if (!this.db) return;
    var pl = Object.assign({}, data);
    pl.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('config').doc(key).set(pl, { merge: true });
  },
  getDeal: async function() {
    if (!this.db) return null;
    try { var doc = await this.db.collection('config').doc('deal').get(); return doc.exists ? doc.data() : null; } catch(e) { return null; }
  },
  setDeal: async function(deal) {
    if (!this.db) return;
    var pl = Object.assign({}, deal);
    pl.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('config').doc('deal').set(pl, { merge: true });
  },
  deleteDeal: async function() { if (!this.db) return; await this.db.collection('config').doc('deal').delete(); },

  getUserOrders: async function() {
    if (!this.db || !this.currentUser) return [];
    try {
      var snap = await this.db.collection('orders').where('userId','==',this.currentUser.uid).limit(200).get();
      var arr = []; snap.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); });
      arr.sort(function(a,b){ return ((b.createdAt&&b.createdAt.seconds)||0) - ((a.createdAt&&a.createdAt.seconds)||0); });
      return arr;
    } catch(e) { return []; }
  },
  getAllOrders: async function() {
    if (!this.db) return [];
    try { var snap = await this.db.collection('orders').limit(300).get(); var arr = []; snap.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); }); return arr; } catch(e) { return []; }
  },
  addOrder: async function(order) {
    if (!this.db) throw new Error('Firebase not ready');
    order.userId = this.getUserId(); order.userEmail = this.getUserEmail();
    order.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    var ref = await this.db.collection('orders').add(order); return ref.id;
  },
  updateOrderStatus: async function(id, status) {
    if (!this.db) return;
    await this.db.collection('orders').doc(id).update({ status: status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  },
  deleteOrder: async function(id) { if (!this.db) return; await this.db.collection('orders').doc(id).delete(); },

  getNotifications: async function() {
    if (!this.db || !this.currentUser) return [];
    try {
      var a1 = await this.db.collection('notifications').where('userId','==',this.currentUser.uid).limit(50).get();
      var a2 = await this.db.collection('notifications').where('userId','==','ALL').limit(50).get();
      var arr = []; a1.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); }); a2.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); });
      arr.sort(function(a,b){ return ((b.createdAt&&b.createdAt.seconds)||0) - ((a.createdAt&&a.createdAt.seconds)||0); });
      return arr.slice(0, 60);
    } catch(e) { return []; }
  },
  addNotification: async function(notif) {
    if (!this.db) return;
    var pl = Object.assign({ userId: 'ALL' }, notif);
    pl.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('notifications').add(pl);
  },
  addUserNotification: async function(uid, notif) {
    if (!this.db) return;
    var pl = Object.assign({ userId: uid }, notif);
    pl.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('notifications').add(pl);
  },

  updateUserPoints: async function(points) {
    if (!this.db || !this.currentUser) return;
    await this.db.collection('users').doc(this.currentUser.uid).set({ loyaltyPoints: points, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ FB.init(); });
else FB.init();
