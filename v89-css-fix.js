const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');

if (h.includes('chz-acct-v89-css')) { console.log('already'); process.exit(0); }

const css = `<style id="chz-acct-v89-css">
/* Fix: prevent tab overlap in accountant panel */
#accountant-mgr-app [id^="ca-content-"] {
  position: relative !important;
  margin-top: 8px !important;
  z-index: 1 !important;
}

#accountant-mgr-app [id^="ca-content-"] > *:first-child {
  margin-top: 0 !important;
}

/* Hide the time period tabs (اليوم/الأسبوع/الشهر) when on products tab */
#accountant-mgr-app [id^="ca-content-products"] ~ .ca-period-tabs,
#accountant-mgr-app .ca-period-tabs:not(.show-products) {
  /* handled via JS */
}

/* Ensure category filter tabs don't overflow */
#ca-content-products .v88-cat-btn {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 120px !important;
}

/* Fix product row layout on small screens */
@media (max-width: 400px) {
  #ca-content-products .v88-prod-row > div:first-child > div:last-child {
    flex-wrap: wrap !important;
  }
  #ca-content-products .v88-prod-row > div:first-child > div:last-child > div {
    min-width: 45% !important;
  }
}

/* Ensure nav tabs stay in their own bar */
#accountant-mgr-app .ca-nav-bar {
  position: relative !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  white-space: nowrap !important;
  margin-bottom: 8px !important;
}

/* Responsive: tighten tab buttons */
@media (max-width: 400px) {
  #accountant-mgr-app .ca-nav-btn {
    padding: 8px 12px !important;
    font-size: 10px !important;
    min-width: auto !important;
  }
  #accountant-mgr-app .ca-nav-btn .label {
    font-size: 10px !important;
  }
}
</style>

`;
const headEnd = h.indexOf('</head>');
h = h.slice(0, headEnd) + css + h.slice(headEnd);

fs.writeFileSync(p, h);
console.log('✅ v89 CSS fix added');
