const fs = require('fs');
const p = 'index.html';
let h = fs.readFileSync(p, 'utf8');
const before = h.length;

// استبدال عرض الماركة في admin
const oldDisplay = `            h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #333;">';
            h += '<span style="color:#fff;font-weight:bold;">' + esc(b) + '</span>';
            h += '<button class="btn bd bsm" onclick="A.deleteBrand(' + i + ')">حذف 🗑️</button>';
            h += '</div>';`;

const newDisplay = `            var bName = (typeof b === 'string') ? b : (b.nameAr || b.nameEn || '');
            var bLogo = (typeof b === 'object' && b.logo) ? b.logo : '';
            var bInit = bName.charAt(0) || '?';
            h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #333;gap:10px;">';
            h += '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">';
            if (bLogo) {
                h += '<img src="' + esc(bLogo) + '" alt="" style="width:32px;height:32px;border-radius:8px;background:#fff;padding:3px;object-fit:contain;flex-shrink:0;" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'flex\\';"><div style="display:none;width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#ff4d94,#a855f7);color:#fff;align-items:center;justify-content:center;font-weight:900;">' + esc(bInit) + '</div>';
            } else {
                h += '<div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#ff4d94,#a855f7);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;">' + esc(bInit) + '</div>';
            }
            h += '<span style="color:#fff;font-weight:bold;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(bName) + '</span>';
            h += '</div>';
            h += '<button class="btn bd bsm" onclick="A.deleteBrand(' + i + ')">حذف 🗑️</button>';
            h += '</div>';`;

if (!h.includes(oldDisplay)) { console.log('❌ display code not found'); process.exit(1); }
h = h.replace(oldDisplay, newDisplay);
console.log('✅ admin display updated (logo + name)');

fs.writeFileSync(p, h);
console.log('size:', before, '->', h.length, '(+', h.length-before, ')');
