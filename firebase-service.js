/* ═══════════════════════════════════════════
   CHIZEN — Firebase Service Layer v2
   ═══════════════════════════════════════════ */

/* Helper: تهريب HTML لمنع XSS */
window.esc = function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
};

window.FB = {
  app: null, auth: null, db: null,
  ready: false, currentUser: null, currentProfile: null,

  init: function() {
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
      console.log('[FB] No config — localStorage mode');
      return false;
    }
    try {
      this.app = (!firebase.apps.length)
        ? firebase.initializeApp(window.FIREBASE_CONFIG)
        : firebase.app();
      this.auth = firebase.auth();
      this.db = firebase.firestore();

      this.db.enablePersistence({ synchronizeTabs: true }).catch(function(err){
        if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
          console.log('[FB] Persistence:', err.code);
        }
      });

      this.ready = true;
      console.log('[FB] Initialized ✓');
      return true;
    } catch (e) {
      console.error('[FB] Init failed:', e);
      return false;
    }
  },

  /* ═══ AUTH ═══ */
  onAuthChange: function(cb) {
    if (!this.ready) { cb(null); return; }
    this.auth.onAuthStateChanged(function(user){
      FB.currentUser = user;
      cb(user);
    });
  },

  loginEmail: async function(email, password) {
    if (!this.ready) throw new Error('Firebase not ready');
    return await this.auth.signInWithEmailAndPassword(email, password);
  },

  signupEmail: async function(email, password) {
    if (!this.ready) throw new Error('Firebase not ready');
    return await this.auth.createUserWithEmailAndPassword(email, password);
  },

  loginGoogle: async function() {
    if (!this.ready) throw new Error('Firebase not ready');
    var provider = new firebase.auth.GoogleAuthProvider();
    return await this.auth.signInWithPopup(provider);
  },

  /* كان ناقصاً — يصلح مشكلة تسجيل الدخول بالجوال */
  handleGoogleRedirect: async function() {
    if (!this.ready) return null;
    try {
      var result = await this.auth.getRedirectResult();
      return (result && result.user) ? result.user : null;
    } catch (e) {
      if (e.code === 'auth/no-auth-event' || e.code === 'auth/argument-error') return null;
      throw e;
    }
  },

  logout: async function() {
    if (!this.ready) return;
    await this.auth.signOut();
  },

  updateDisplayName: async function(name) {
    if (!this.ready || !this.currentUser) return;
    await this.currentUser.updateProfile({ displayName: name });
    this.currentUser = this.auth.currentUser;
  },

  sendPasswordReset: async function(email) {
    if (!this.ready) throw new Error('Firebase not ready');
    return await this.auth.sendPasswordResetEmail(email);
  },

  getUserId: function() { return this.currentUser ? this.currentUser.uid : null; },
  getUserEmail: function() { return this.currentUser ? this.currentUser.email : null; },
  getUserName: function() { return this.currentUser ? (this.currentUser.displayName || '') : ''; },

  isAdmin: async function() {
    if (!this.ready || !this.currentUser) return false;
    try {
      var doc = await this.db.collection('admins').doc(this.currentUser.uid).get();
      return doc.exists;
    } catch(e) { return false; }
  },

  /* ═══ USER PROFILE ═══ */
  saveUserProfile: async function(data) {
    if (!this.ready || !this.currentUser) return;
    data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    data.email = this.currentUser.email;
    data.uid = this.currentUser.uid;
    await this.db.collection('users').doc(this.currentUser.uid).set(data, { merge: true });
    this.currentProfile = data;
  },

  getUserProfile: async function() {
    if (!this.ready || !this.currentUser) return null;
    try {
      var doc = await this.db.collection('users').doc(this.currentUser.uid).get();
      this.currentProfile = doc.exists ? doc.data() : null;
      return this.currentProfile;
    } catch(e) { return null; }
  },

  getAllUsers: async function() {
    if (!this.ready) return [];
    try {
      var snap = await this.db.collection('users').orderBy('createdAt','desc').limit(500).get();
      var arr = [];
      snap.forEach(function(doc){ var d = doc.data(); d.uid = doc.id; arr.push(d); });
      return arr;
    } catch(e) {
      try {
        var snap2 = await this.db.collection('users').limit(500).get();
        var arr2 = [];
        snap2.forEach(function(doc){ var d = doc.data(); d.uid = doc.id; arr2.push(d); });
        return arr2;
      } catch(e2) { return []; }
    }
  },

  deleteUser: async function(uid) {
    if (!this.ready) throw new Error('Firebase not ready');
    await this.db.collection('users').doc(uid).delete();
  },

  /* ═══ PRODUCTS ═══ */
  getProducts: async function() {
    if (!this.ready) return [];
    try {
      var snap = await this.db.collection('products').limit(500).get();
      var arr = [];
      snap.forEach(function(doc){
        var d = doc.data();
        d.id = doc.id;
        arr.push(d);
      });
      arr.sort(function(a,b){
        var ta = a.createdAt ? a.createdAt.seconds : 0;
        var tb = b.createdAt ? b.createdAt.seconds : 0;
        return tb - ta;
      });
      return arr;
    } catch(e) { console.error('[FB] getProducts:', e); return []; }
  },

  addProduct: async function(product) {
    if (!this.ready) throw new Error('Firebase not ready');
    var payload = Object.assign({}, product);
    delete payload.id;
    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    var ref = await this.db.collection('products').add(payload);
    return ref.id;
  },

  updateProduct: async function(id, product) {
    if (!this.ready) throw new Error('Firebase not ready');
    var payload = Object.assign({}, product);
    delete payload.id;
    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('products').doc(id).update(payload);
  },

  deleteProduct: async function(id) {
    if (!this.ready) throw new Error('Firebase not ready');
    await this.db.collection('products').doc(id).delete();
  },

  seedProducts: async function(products) {
    if (!this.ready) throw new Error('Firebase not ready');
    var batch = this.db.batch();
    for (var i = 0; i < products.length; i++) {
      var p = Object.assign({}, products[i]);
      delete p.id;
      p.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      p.seedId = i + 1;
      var ref = this.db.collection('products').doc('seed_' + (i + 1));
      batch.set(ref, p);
    }
    await batch.commit();
    return products.length;
  },

  /* ═══ BANNERS — موحّد على config/banners ═══ */
  getBanners: async function() {
    if (!this.ready) return null;
    try {
      var doc = await this.db.collection('config').doc('banners').get();
      if (!doc.exists) return null;
      var data = doc.data();
      return (data && data.list && data.list.length) ? data.list : null;
    } catch(e) { return null; }
  },

  setBanners: async function(list) {
    if (!this.ready) throw new Error('Firebase not ready');
    await this.db.collection('config').doc('banners').set({
      list: list,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  },

  /* ═══ CONFIG ═══ */
  getConfig: async function(key) {
    if (!this.ready) return null;
    try {
      var doc = await this.db.collection('config').doc(key).get();
      return doc.exists ? doc.data() : null;
    } catch(e) { return null; }
  },

  setConfig: async function(key, data) {
    if (!this.ready) throw new Error('Firebase not ready');
    var payload = Object.assign({}, data);
    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('config').doc(key).set(payload, { merge: true });
  },

  /* ═══ DEALS ═══ */
  getDeal: async function() {
    if (!this.ready) return null;
    try {
      var doc = await this.db.collection('config').doc('deal').get();
      return doc.exists ? doc.data() : null;
    } catch(e) { return null; }
  },

  setDeal: async function(deal) {
    if (!this.ready) throw new Error('Firebase not ready');
    var payload = Object.assign({}, deal);
    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('config').doc('deal').set(payload, { merge: true });
  },

  deleteDeal: async function() {
    if (!this.ready) throw new Error('Firebase not ready');
    await this.db.collection('config').doc('deal').delete();
  },

  /* ═══ ORDERS ═══ */
  getUserOrders: async function() {
    if (!this.ready || !this.currentUser) return [];
    try {
      var snap = await this.db.collection('orders')
        .where('userId','==', this.currentUser.uid).limit(200).get();
      var arr = [];
      snap.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); });
      arr.sort(function(a,b){
        var ta = a.createdAt ? a.createdAt.seconds : 0;
        var tb = b.createdAt ? b.createdAt.seconds : 0;
        return tb - ta;
      });
      return arr;
    } catch(e) { console.error('[FB] getUserOrders:', e); return []; }
  },

  getAllOrders: async function() {
    if (!this.ready) return [];
    try {
      var snap = await this.db.collection('orders').limit(300).get();
      var arr = [];
      snap.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); });
      arr.sort(function(a,b){
        var ta = a.createdAt ? a.createdAt.seconds : 0;
        var tb = b.createdAt ? b.createdAt.seconds : 0;
        return tb - ta;
      });
      return arr;
    } catch(e) { return []; }
  },

  addOrder: async function(order) {
    if (!this.ready) throw new Error('Firebase not ready');
    order.userId = this.getUserId();
    order.userEmail = this.getUserEmail();
    order.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    var ref = await this.db.collection('orders').add(order);
    return ref.id;
  },

  updateOrderStatus: async function(id, status) {
    if (!this.ready) throw new Error('Firebase not ready');
    await this.db.collection('orders').doc(id).update({
      status: status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  deleteOrder: async function(id) {
    if (!this.ready) throw new Error('Firebase not ready');
    await this.db.collection('orders').doc(id).delete();
  },

  /* ═══ NOTIFICATIONS ═══ */
  getNotifications: async function() {
    if (!this.ready || !this.currentUser) return [];
    try {
      var uid = this.currentUser.uid;
      var snap1 = await this.db.collection('notifications')
        .where('userId','==', uid).limit(50).get();
      var snap2 = await this.db.collection('notifications')
        .where('userId','==', 'ALL').limit(50).get();

      var arr = [];
      snap1.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); });
      snap2.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); });

      arr.sort(function(a,b){
        var ta = a.createdAt ? a.createdAt.seconds : 0;
        var tb = b.createdAt ? b.createdAt.seconds : 0;
        return tb - ta;
      });
      return arr.slice(0, 60);
    } catch(e) {
      try {
        var snap = await this.db.collection('notifications').limit(50).get();
        var arr2 = [];
        snap.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr2.push(d); });
        return arr2;
      } catch(e2) { return []; }
    }
  },

  /* إشعار عام (لكل المستخدمين) */
  addNotification: async function(notif) {
    if (!this.ready) throw new Error('Firebase not ready');
    var payload = Object.assign({ userId: 'ALL' }, notif);
    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('notifications').add(payload);
  },

  /* إشعار موجّه لمستخدم واحد */
  addUserNotification: async function(uid, notif) {
    if (!this.ready) throw new Error('Firebase not ready');
    var payload = Object.assign({ userId: uid }, notif);
    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('notifications').add(payload);
  },

  /* ═══ POINTS ═══ */
  updateUserPoints: async function(points) {
    if (!this.ready || !this.currentUser) return;
    await this.db.collection('users').doc(this.currentUser.uid).set({
      loyaltyPoints: points,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  },

  addPointsTransaction: async function(transaction) {
    if (!this.ready || !this.currentUser) return;
    transaction.userId = this.currentUser.uid;
    transaction.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.db.collection('users').doc(this.currentUser.uid)
      .collection('points_tx').add(transaction);
  },

  getPointsTransactions: async function() {
    if (!this.ready || !this.currentUser) return [];
    try {
      var snap = await this.db.collection('users').doc(this.currentUser.uid)
        .collection('points_tx').limit(100).get();
      var arr = [];
      snap.forEach(function(doc){ var d = doc.data(); d.id = doc.id; arr.push(d); });
      arr.sort(function(a,b){
        var ta = a.createdAt ? a.createdAt.seconds : 0;
        var tb = b.createdAt ? b.createdAt.seconds : 0;
        return tb - ta;
      });
      return arr;
    } catch(e) { return []; }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function(){ FB.init(); });
} else {
  FB.init();
}