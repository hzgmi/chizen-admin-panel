const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v288-charts"')) { console.log('already'); process.exit(0); }

const v288c = `
<script id="v288-charts">
(function(){
  // تحميل Chart.js
  if (!window.Chart) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    document.head.appendChild(s);
  }

  // MutationObserver واحد فقط — لا setInterval
  var injected = false;
  var observer = new MutationObserver(function(mutations){
    if (injected || !window.Chart) return;
    var main = document.querySelector('#accountant-mgr-app .ca-main');
    if (!main) return;
    if (main.querySelector('#v288-charts')) { injected = true; return; }
    
    // تأكد أننا في تبويب overview
    var overviewBtn = document.querySelector('#accountant-mgr-app .ca-nav-btn[data-tab="overview"]');
    if (!overviewBtn || !overviewBtn.classList.contains('active')) return;
    
    var orders = (window.CA && window.CA.orders) ? window.CA.orders : [];
    if (orders.length === 0) return;
    
    injectCharts(main, orders);
    injected = true;
  });
  
  function injectCharts(main, orders){
    var container = document.createElement('div');
    container.id = 'v288-charts';
    container.style.cssText = 'margin: 16px 4px;';
    container.innerHTML = 
      '<div style="font-size:15px;font-weight:900;color:#f59e0b;margin-bottom:12px">📊 الرسوم البيانية</div>'
      + '<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:14px;margin-bottom:12px">'
      +   '<div style="font-size:12px;color:#b8c0d8;font-weight:700;margin-bottom:10px">📈 مبيعات آخر 7 أيام</div>'
      +   '<div style="height:180px;position:relative"><canvas id="v288-line"></canvas></div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +   '<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:12px">'
      +     '<div style="font-size:11px;color:#b8c0d8;font-weight:700;margin-bottom:8px">🥧 الطلبات</div>'
      +     '<div style="height:140px;position:relative"><canvas id="v288-pie"></canvas></div>'
      +   '</div>'
      +   '<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:12px">'
      +     '<div style="font-size:11px;color:#b8c0d8;font-weight:700;margin-bottom:8px">📊 حسب القسم</div>'
      +     '<div style="height:140px;position:relative"><canvas id="v288-bar"></canvas></div>'
      +   '</div>'
      + '</div>';
    
    main.insertBefore(container, main.firstChild);
    drawCharts(orders);
  }
  
  function drawCharts(orders){
    var isDark = document.body.getAttribute('data-theme') !== 'light';
    var textColor = isDark ? '#b8c0d8' : '#4b5563';
    var gridColor = isDark ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.08)';
    
    Chart.defaults.color = textColor;
    Chart.defaults.font.family = 'Tajawal, system-ui';
    Chart.defaults.font.size = 10;
    
    // Line
    var days = [], sales = [];
    var today = new Date(); today.setHours(23,59,59,999);
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today.getTime() - i*86400000);
      days.push(d.toLocaleDateString('ar-YE', {weekday:'short'}));
      sales.push(0);
    }
    orders.forEach(function(o){
      if (o.status !== 'completed') return;
      var ts = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().getTime() : 0;
      if (!ts) return;
      var diff = Math.floor((today.getTime() - ts) / 86400000);
      if (diff >= 0 && diff <= 6) sales[6 - diff] += Number(o.total) || 0;
    });
    
    new Chart(document.getElementById('v288-line'), {
      type: 'line',
      data: { labels: days, datasets: [{ data: sales, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.15)', tension: 0.4, fill: true, pointBackgroundColor: '#f59e0b', pointRadius: 4, borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: { size: 9 } } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } } }
    });
    
    // Pie
    var p=0, c=0, ca=0, sh=0;
    orders.forEach(function(o){
      if (o.status === 'completed') c++;
      else if (o.status === 'cancelled') ca++;
      else if (o.status === 'shipped') sh++;
      else p++;
    });
    
    new Chart(document.getElementById('v288-pie'), {
      type: 'doughnut',
      data: { labels: ['معلق', 'مشحون', 'مكتمل', 'ملغى'], datasets: [{ data: [p, sh, c, ca], backgroundColor: ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, padding: 6, boxWidth: 10 } } } }
    });
    
    // Bar
    var CATS = {electronics:'إلكترونيات',fashion:'أزياء',clothing:'ملابس',shoes_bags:'أحذية',beauty:'جمال',kids_sports:'أطفال',home:'منزل',supermarket:'سوبرماركت'};
    var catSales = {};
    Object.keys(CATS).forEach(function(k){ catSales[k] = 0; });
    orders.forEach(function(o){
      if (o.status !== 'completed') return;
      if (o.categories) Object.keys(o.categories).forEach(function(cat){
        var cc = o.categories[cat];
        if (cc && cc.subtotal) catSales[cat] = (catSales[cat] || 0) + Number(cc.subtotal);
      });
    });
    var cats = Object.keys(catSales).filter(function(k){ return catSales[k] > 0; });
    if (!cats.length) cats = Object.keys(CATS).slice(0, 4);
    
    new Chart(document.getElementById('v288-bar'), {
      type: 'bar',
      data: { labels: cats.map(function(k){ return CATS[k]; }), datasets: [{ data: cats.map(function(k){ return catSales[k]; }), backgroundColor: ['#7c3aed','#ec4899','#a855f7','#3b82f6','#22c55e','#f59e0b','#06b6d4','#f43f5e'], borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: { size: 9 } } }, x: { grid: { display: false }, ticks: { font: { size: 8 } } } } }
    });
  }
  
  // ابدأ المراقبة
  setTimeout(function(){
    var app = document.getElementById('accountant-mgr-app');
    if (app) {
      observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      console.log('[V288] Chart observer watching');
    }
  }, 3000);
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + v288c + h.slice(bodyEnd);

fs.writeFileSync('index.html', h);
console.log('✅ v288c: clean charts |', before, '->', h.length);
