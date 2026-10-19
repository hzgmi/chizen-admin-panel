const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// دالة طباعة الـ PDF
html = html.replace(/exportOrdersPDF:function\(\)\{this\.toast\('PDF — قيد التطوير','err'\);\},/, `exportOrdersPDF:function(){
    if(!this.orders || this.orders.length===0) return this.toast('لا توجد طلبات لطباعتها','err');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("CHIZEN - Orders Report", 10, 10);
    let y = 20;
    this.orders.forEach((o) => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.text('ID: ' + o.id + ' | ' + o.name + ' | ' + o.total + ' YER | ' + o.status, 10, y);
        y += 10;
    });
    doc.save('orders.pdf');
    this.toast('تم تحميل الـ PDF بنجاح', 'suc');
},`);

// دالة السند
html = html.replace(/exportReceipt:function\(\)\{this\.toast\('السند — قيد التطوير','err'\);\},/, `exportReceipt:function(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("CHIZEN - Receipt", 10, 10);
    doc.setFontSize(12);
    doc.text("Thank you for your order!", 10, 20);
    doc.save('receipt.pdf');
    this.toast('تم تحميل السند بنجاح', 'suc');
},`);

// دالة إرسال السند بالواتساب
html = html.replace(/sendReceipt:function\(\)\{this\.toast\('السند — قيد التطوير','err'\);\},/, `sendReceipt:function(){
    if(!this.orders || this.orders.length===0) return this.toast('لا توجد طلبات','err');
    const order = this.orders[0];
    if(window.FB && FB.sendWhatsAppMessage){
        FB.sendWhatsAppMessage(order.phone, 'مرحباً ' + order.name + '، تم إرفاق سند طلبك رقم ' + order.id + '.');
        this.toast('تم إرسال السند للعميل عبر واتساب', 'suc');
    } else {
        this.toast('الواتساب غير جاهز','err');
    }
},`);

fs.writeFileSync('index.html', html);
fs.writeFileSync('www/index.html', html);
console.log('✅ تم تفعيل أزرار الـ PDF والسند');
