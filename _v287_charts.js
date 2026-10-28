const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const before = h.length;

if (h.includes('id="v287-charts"')) { console.log('already applied'); process.exit(0); }

const v287 = `
<script id="v287-charts">
(function(){
  if (!window.CA) { setTimeout(arguments.callee, 500); return; }
  console.log('[V287] Charts module loading...');

  // ═══ 1. تحميل Chart.js ═══
  if (!window.Chart) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = function(){ console.log('[V287] Chart.js loaded ✓'); tryInject(); };
    s.onerror = function(){ console.warn('[V287] Chart.js load failed'); };
    document.head.appendChild(s);
  }

  // ═══ 2. اعتراض __caSwitchTab لإضافة الرسوم ═══
  setTimeout(function(){
    var origSwitch = window.__caSwitchTab;
    if (!origSwitch || origSwitch.__v287) return;
    
    var wrapped = function(tab, btn){
      var result = origSwitch.apply(this, arguments);
      if (tab === 'overview' || tab === 'reports') {
        setTimeout(tryInject, 600);
      }
      return result;
    };
    wrapped.__v287 = true;
    window.__caSwitchTab = wrapped;
    console.log('[V287] Switch hook installed');
  }, 2500);

  function tryInject(){
    if (!window.Chart) return;
    var main = document.querySelector('#accountant-mgr-app .ca-main');
    if (!main) return;
    if (main.querySelector('#v287-charts')) return;
    
    var orders = (window.CA && window.CA.orders) ? window.CA.orders : [];
    if (!orders.length) { console.log('[V287] no orders yet'); return; }
    
    var container = document.createElement('div');
    container.id = 'v287-charts';
    container.style.cssText = 'margin: 16px 0; padding: 0 4px;';
    container.innerHTML = 
      '<div style="font-size: 15px; font-weight: 900; color: #f59e0b; margin-bottom: 12px">📊 الرسوم البيانية</div>'
      + '<div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 16px; padding: 14px; margin-bottom: 12px">'
      +   '<div style="font-size: 12px; color: #b8c0d8; font-weight: 700; margin-bottom: 10px">📈 مبيعات آخر 7 أيام</div>'
      +   '<div style="height: 180px; position: relative"><canvas id="v287-line"></canvas></div>'
      + '</div>'
      + '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px">'
      +   '<div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 16px; padding: 12px">'
      +     '<div style="font-size: 11px; color: #b8c0d8; font-weight: 700; margin-bottom: 8px">🥧 الطلبات</div>'
      +     '<div style="height: 140px; position: relative"><canvas id="v287-pie"></canvas></div>'
      +   '</div>'
      +   '<div style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: 16px; padding: 12px">'
      +     '<div style="font-size: 11px; color: #b8c0d8; font-weight: 700; margin-bottom: 8px">📊 حسب القسم</div>'
      +     '<div style="height: 140px; position: relative"><canvas id="v287-bar"></canvas></div>'
      +   '</div>'
      + '</div>';
    
    main.insertBefore(container, main.firstChild);
    drawAll(orders);
    console.log('[V287] ✅ Charts injected for', orders.length, 'orders');
  }

  function drawAll(orders){
    var isDark = document.body.getAttribute('data-theme') !== 'light';
    var textColor = isDark ? '#b8c0d8' : '#4b5563';
    var gridColor = isDark ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.08)';
    
    Chart.defaults.color = textColor;
    Chart.defaults.font.family = 'Tajawal, system-ui, sans-serif';
    Chart.defaults.font.size = 10;
    
    // ══════ 1. مبيعات آخر 7 أيام (Line) ══════
    var days = [];
    var salesByDay = [];
    var today = new Date();
    today.setHours(23,59,59,999);
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today.getTime() - i*24*60*60*1000);
      days.push(d.toLocaleDateString('ar-YE', {weekday:'short'}));
      salesByDay.push(0);
    }
    
    orders.forEach(function(o){
      if (o.status !== 'completed') return;
      var ts = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().getTime() : 0;
      if (!ts) return;
      var diff = Math.floor((today.getTime() - ts) / (24*60*60*1000));
      if (diff >= 0 && diff <= 6) {
        salesByDay[6 - diff] += Number(o.total) || 0;
      }
    });
    
    new Chart(document.getElementById('v287-line'), {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'المبيعات (ر.ي)',
          data: salesByDay,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.15)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#f59e0b',
          pointRadius: 4,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: { size: 9 } } },
          x: { grid: { display: false }, ticks: { font: { size: 9 } } }
        }
      }
    });
    
    // ══════ 2. الطلبات حسب الحالة (Doughnut) ══════
    var pending = 0, completed = 0, cancelled = 0, shipped = 0;
    orders.forEach(function(o){
      if (o.status === 'completed') completed++;
      else if (o.status === 'cancelled') cancelled++;
      else if (o.status === 'shipped') shipped++;
      else pending++;
    });
    
    new Chart(document.getElementById('v287-pie'), {
      type: 'doughnut',
      data: {
        labels: ['معلق', 'مشحون', 'مكتمل', 'ملغى'],
        datasets: [{
          data: [pending, shipped, completed, cancelled],
          backgroundColor: ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, padding: 6, boxWidth: 10 } } }
      }
    });
    
    // ══════ 3. المبيعات حسب القسم (Bar) ══════
    var CATS = {
      electronics: 'إلكترونيات', fashion: 'أزياء', clothing: 'ملابس',
      shoes_bags: 'أحذية', beauty: 'جمال', kids_sports: 'أطفال',
      home: 'منزل', supermarket: 'سوبرماركت'
    };
    var catSales = {};
    Object.keys(CATS).forEach(function(k){ catSales[k] = 0; });
    
    orders.forEach(function(o){
      if (o.status !== 'completed') return;
      if (o.categories) {
        Object.keys(o.categories).forEach(function(cat){
          var c = o.categories[cat];
          if (c && c.subtotal) catSales[cat] = (catSales[cat] || 0) + Number(c.subtotal);
        });
      }
    });
    
    var cats = Object.keys(catSales).filter(function(k){ return catSales[k] > 0; });
    if (!cats.length) cats = Object.keys(CATS).slice(0, 4);
    
    new Chart(document.getElementById('v287-bar'), {
      type: 'bar',
      data: {
        labels: cats.map(function(k){ return CATS[k] || k; }),
        datasets: [{
          data: cats.map(function(k){ return catSales[k]; }),
          backgroundColor: ['#7c3aed', '#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#06b6d4', '#f43f5e'],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor }, ticks: { font: { size: 9 } } },
          x: { grid: { display: false }, ticks: { font: { size: 8 } } }
        }
      }
    });
  }

  // محاولة أولى بعد التحميل
  setTimeout(tryInject, 4000);
  setTimeout(tryInject, 6000);
})();
</script>
`;

const bodyEnd = h.lastIndexOf('</body>');
h = h.slice(0, bodyEnd) + v287 + h.slice(bodyEnd);

fs.writeFileSync('index.html', h);
console.log('✅ v287: Charts |', before, '->', h.length);
