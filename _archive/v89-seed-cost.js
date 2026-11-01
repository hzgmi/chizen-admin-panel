const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const sa = require('/data/data/com.termux/files/home/wa-otp/serviceAccountKey.json');
initializeApp({ credential: cert(sa) });
const db = getFirestore();

(async () => {
  try {
    console.log('🔍 جاري فحص المنتجات...');
    const snap = await db.collection('products').get();
    console.log('إجمالي المنتجات:', snap.size);
    
    let updated = 0, already = 0, suppliersNeeded = {};
    
    // Get suppliers list
    const supDoc = await db.collection('config').doc('suppliers').get();
    const suppliers = supDoc.exists ? (supDoc.data().list || []) : [];
    console.log('عدد الموردين:', suppliers.length);
    
    const batch = db.batch();
    
    snap.forEach(doc => {
      const p = doc.data();
      const hasCost = p.costPrice && p.costPrice > 0;
      
      if (hasCost) {
        already++;
        return;
      }
      
      // Calculate cost = sell * 0.72 (28% margin - realistic retail)
      const sell = Number(p.price) || 0;
      if (sell <= 0) return;
      
      const cost = Math.round(sell * 0.72);
      const profit = sell - cost;
      const margin = Math.round((profit / sell) * 100);
      
      // Try to find matching supplier by category
      let matchedSupplier = null;
      suppliers.forEach(s => {
        if (Array.isArray(s.categories) && s.categories.includes(p.category)) {
          matchedSupplier = s;
        }
      });
      
      const update = {
        costPrice: cost,
        profit: profit,
        profitMargin: margin,
        supplierId: matchedSupplier ? matchedSupplier.id : '',
        supplierName: matchedSupplier ? matchedSupplier.name : '',
        costSeeded: true
      };
      
      batch.update(doc.ref, update);
      updated++;
      
      if (matchedSupplier) {
        suppliersNeeded[matchedSupplier.name] = (suppliersNeeded[matchedSupplier.name] || 0) + 1;
      }
    });
    
    if (updated > 0) {
      await batch.commit();
      console.log('');
      console.log('✅ تم تحديث', updated, 'منتج');
      console.log('   • هامش 28% (cost = sell × 0.72)');
      if (Object.keys(suppliersNeeded).length) {
        console.log('   • موردين مطابقين:');
        Object.keys(suppliersNeeded).forEach(n => console.log('     - ' + n + ': ' + suppliersNeeded[n] + ' منتج'));
      }
    }
    console.log('ℹ️ منتجات بها costPrice مسبقاً:', already);
    
    // Verify
    const verifySnap = await db.collection('products').get();
    let withCost = 0, totalCost = 0, totalSell = 0;
    verifySnap.forEach(d => {
      const p = d.data();
      totalSell += Number(p.price) || 0;
      if (p.costPrice > 0) { withCost++; totalCost += p.costPrice; }
    });
    console.log('');
    console.log('=== التحقق النهائي ===');
    console.log('منتجات بها costPrice:', withCost, '/', verifySnap.size);
    console.log('إجمالي الجملة:', totalCost.toLocaleString());
    console.log('إجمالي البيع:', totalSell.toLocaleString());
    console.log('الربح الكلي:', (totalSell - totalCost).toLocaleString());
    console.log('الهامش:', totalSell > 0 ? Math.round(((totalSell - totalCost) / totalSell) * 100) + '%' : '0%');
    
    process.exit(0);
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
})();
