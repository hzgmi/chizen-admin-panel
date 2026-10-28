const fs = require('fs');
let h = fs.readFileSync('dashboard.html', 'utf8');
const before = h.length;

function findFnEnd(str, startIdx) {
  var openIdx = str.indexOf('{', startIdx);
  if (openIdx === -1) return -1;
  let depth = 0, i = openIdx, inStr = null, inLine = false, inBlock = false;
  for(; i < str.length; i++){
    const c = str[i], n = str[i+1];
    if(inLine){ if(c === '\n') inLine = false; continue; }
    if(inBlock){ if(c === '*' && n === '/'){ inBlock = false; i++; } continue; }
    if(inStr){ if(c === '\\'){ i++; continue; } if(c === inStr) inStr = null; continue; }
    if(c === '/' && n === '/'){ inLine = true; i++; continue; }
    if(c === '/' && n === '*'){ inBlock = true; i++; continue; }
    if(c === '"' || c === "'" || c === '`'){ inStr = c; continue; }
    if(c === '{') depth++;
    else if(c === '}'){ depth--; if(depth === 0) return i + 1; }
  }
  return -1;
}

var startIdx = h.indexOf('async function verifyPayment(orderId){');
if (startIdx === -1) { console.log('❌ verifyPayment not found'); process.exit(1); }

var endIdx = findFnEnd(h, startIdx);
if (endIdx === -1) { console.log('❌ end not found'); process.exit(1); }

const newFn = [
'async function verifyPayment(orderId){',
'  var order = state.orders.find(function(o){ return o.id === orderId; });',
'  if (!order) return;',
'  ',
'  // 🚨 Layer 2: منع تأكيد الدفع بدون سند',
'  if (!order.payment || !order.payment.receiptUrl) {',
'    if (window.__chizenToast) window.__chizenToast("❌ لا يمكن تأكيد الدفع", "error", "لا يوجد سند حوالة — يجب رفضه");',
'    else alert("لا يمكن تأكيد الدفع: لا يوجد سند حوالة");',
'    return;',
'  }',
'  ',
'  if (!order.payment.bankId && !order.payment.method) {',
'    if (window.__chizenToast) window.__chizenToast("❌ طريقة الدفع غير محددة", "error", "العميل لم يحدد البنك");',
'    else alert("طريقة الدفع غير محددة");',
'    return;',
'  }',
'  ',
'  if (!confirm("تأكيد الدفع لهذا الطلب؟\\n\\nالسند: موجود ✅")) return;',
'  ',
'  try {',
'    var updates = {',
'      workflowStatus: "awaiting_categories",',
'      "payment.status": "verified",',
'      "payment.verifiedBy": state.user.uid,',
'      "payment.verifiedAt": firebase.firestore.FieldValue.serverTimestamp()',
'    };',
'    if (order.categories) {',
'      Object.keys(order.categories).forEach(function(cat){',
'        updates["categories." + cat + ".status"] = "pending";',
'      });',
'    }',
'    await db.collection("orders").doc(orderId).update(updates);',
'    var custId = order.customerId || order.userId;',
'    if (custId) {',
'      db.collection("notifications").add({',
'        userId: custId, title: "✅ تم تأكيد دفعتك",',
'        body: "طلبك #" + orderId.slice(-6) + " قيد المعالجة",',
'        type: "order", event: "payment_verified", icon: "✅",',
'        read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()',
'      }).catch(function(){});',
'    }',
'    if (order.categories) {',
'      var cats = Object.keys(order.categories);',
'      for (var i = 0; i < cats.length; i++) {',
'        try {',
'          var mgrs = await db.collection("users").where("role", "==", "cat_manager").where("assignedCategory", "==", cats[i]).get();',
'          mgrs.forEach(function(mgr){',
'            db.collection("notifications").add({',
'              userId: mgr.id, title: "📦 طلب جديد في قسمك",',
'              body: "طلب #" + orderId.slice(-6) + " — تحقق من التوفر",',
'              type: "order", event: "cat_order_pending", icon: "📦",',
'              read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()',
'            }).catch(function(){});',
'          });',
'        } catch(e){}',
'      }',
'    }',
'    if (window.__chizenToast) window.__chizenToast("✅ تم تأكيد الدفع", "success");',
'    else alert("✅ تم تأكيد الدفع");',
'    await reloadData();',
'  } catch(e){ ',
'    if (window.__chizenToast) window.__chizenToast("❌ " + e.message, "error");',
'    else alert("❌ " + e.message);',
'  }',
'}'
].join('\n');

h = h.slice(0, startIdx) + newFn + h.slice(endIdx);

fs.writeFileSync('dashboard.html', h);
console.log('✅ v296b: verifyPayment strict |', before, '->', h.length);
