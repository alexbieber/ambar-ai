/**
 * Inline script injected into every preview so buttons, tabs, and nav work
 * even when the AI returns minimal or non-interactive HTML.
 */
function getPreviewEnhancerScript(): string {
  return `
<script>
(function() {
  // Remove stray "html" or code-fence text at start of body (AI sometimes outputs this)
  var first = document.body.firstChild;
  if (first && first.nodeType === 3) {
    var t = (first.textContent || '').trim().toLowerCase();
    if (t === 'html' || t === '') { first.remove(); }
  }
  var toast = function(msg) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;z-index:9999;animation:fadeIn 0.2s ease';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 1800);
  };
  document.head.insertAdjacentHTML('beforeend', '<style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>');

  function addRipple(el) {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('click', function(e) {
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      var circle = document.createElement('span');
      circle.style.cssText = 'position:absolute;left:'+x+'px;top:'+y+'px;width:0;height:0;border-radius:50%;background:rgba(255,255,255,0.4);transform:translate(-50%,-50%);animation:ripple 0.5s ease-out';
      el.appendChild(circle);
      setTimeout(function(){ circle.remove(); }, 500);
    });
  }
  document.head.insertAdjacentHTML('beforeend', '<style>@keyframes ripple{to{width:200px;height:200px;opacity:0}}</style>');

  function makeClickable(el, label) {
    if (el._enhanced) return;
    el._enhanced = true;
    el.style.cursor = 'pointer';
    addRipple(el);
    el.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toast(label || 'Tapped');
    });
  }

  // 1) Real buttons and explicit clickables
  [].forEach.call(document.querySelectorAll('button, [data-action], [role="button"], a[href="#"]'), function(btn) {
    var label = (btn.textContent || btn.getAttribute('aria-label') || 'Done').trim().slice(0, 30);
    makeClickable(btn, label);
  });

  // 2) Common class names AI uses for buttons/cards/list items (finance app: cards, tiles, FABs, chips)
  var clickableSelectors = '.btn, .button, .fab, .FAB, .card, .list-tile, .list-item, .listItem, .nav-item, .tab, .chip, .action-button, .menu-item, [class*="button"], [class*="Button"], [class*="card"], [class*="Card"], [class*="tile"], [class*="Tile"], [class*="tab"], [class*="Tab"], [class*="nav-item"], [class*="NavItem"]';
  [].forEach.call(document.querySelectorAll(clickableSelectors), function(el) {
    if (el.closest('button') || el.closest('a[href]')) return;
    var label = (el.textContent || '').trim().slice(0, 30) || el.getAttribute('aria-label') || 'Tapped';
    makeClickable(el, label);
  });

  // 3) Delegate: click on anything that looks tappable but wasn't caught (walk up from target)
  document.body.addEventListener('click', function(e) {
    var t = e.target;
    while (t && t !== document.body) {
      if (t._enhanced) break;
      var tag = (t.tagName || '').toLowerCase();
      var role = (t.getAttribute && t.getAttribute('role')) || '';
      var cn = (t.className && typeof t.className === 'string') ? t.className : '';
      var looksClickable = tag === 'button' || tag === 'a' || role === 'button' || role === 'tab' ||
        cn.indexOf('btn') >= 0 || cn.indexOf('button') >= 0 || cn.indexOf('card') >= 0 || cn.indexOf('tab') >= 0 ||
        cn.indexOf('nav') >= 0 || cn.indexOf('fab') >= 0 || cn.indexOf('tile') >= 0 || cn.indexOf('chip') >= 0 ||
        cn.indexOf('item') >= 0 || cn.indexOf('list') >= 0;
      if (looksClickable) {
        e.preventDefault();
        e.stopPropagation();
        t._enhanced = true;
        t.style.cursor = 'pointer';
        var label = (t.textContent || '').trim().slice(0, 30) || 'Tapped';
        toast(label);
        addRipple(t);
        return;
      }
      t = t.parentElement;
    }
  }, true);

  // Tabs: [data-tab] clicks show corresponding [data-panel] (id matches data-tab)
  [].forEach.call(document.querySelectorAll('[data-tab]'), function(tab) {
    if (tab._enhanced) return;
    tab._enhanced = true;
    var targetId = tab.getAttribute('data-tab');
    tab.addEventListener('click', function() {
      [].forEach.call(document.querySelectorAll('[data-tab]'), function(t){ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      [].forEach.call(document.querySelectorAll('[data-panel]'), function(p){ p.hidden = true; });
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      var panel = targetId ? document.getElementById(targetId) : document.querySelector('[data-panel]');
      if (panel) panel.hidden = false;
    });
  });
  var firstTab = document.querySelector('[data-tab]');
  if (firstTab) firstTab.click();
  else {
    var firstPanel = document.querySelector('[data-panel]');
    if (firstPanel) firstPanel.hidden = false;
  }

  // Bottom nav / data-nav: show one [data-screen] at a time
  [].forEach.call(document.querySelectorAll('[data-nav], [data-screen-id]'), function(nav) {
    if (nav._enhanced) return;
    nav._enhanced = true;
    var screenId = nav.getAttribute('data-nav') || nav.getAttribute('data-screen-id');
    nav.addEventListener('click', function(e) {
      e.preventDefault();
      [].forEach.call(document.querySelectorAll('[data-nav], [data-screen-id]'), function(n){ n.classList.remove('active'); });
      [].forEach.call(document.querySelectorAll('[data-screen]'), function(s){ s.style.display = 'none'; });
      nav.classList.add('active');
      var screen = screenId ? document.getElementById(screenId) : document.querySelector('[data-screen]');
      if (screen) screen.style.display = 'block';
    });
  });
  var firstNav = document.querySelector('[data-nav], [data-screen-id]');
  if (firstNav) firstNav.click();

  // Checkboxes and switches
  [].forEach.call(document.querySelectorAll('input[type="checkbox"]'), function(cb) {
    if (cb._enhanced) return;
    cb._enhanced = true;
    cb.addEventListener('change', function(){ toast(cb.checked ? 'On' : 'Off'); });
  });
})();
</script>`;
}

/** Strip leading junk (e.g. "html", "```html") that AI sometimes outputs before the document. */
function sanitizePreviewHtml(inner: string): string {
  let s = inner.trim();
  // Remove leading ```html or ``` and newline
  s = s.replace(/^```(?:html)?\s*\n?/i, '');
  // Remove leading bare "html" word (common AI slip)
  s = s.replace(/^\s*html\s*\n?/i, '');
  s = s.trim();
  return s;
}

/** Base styles so preview stays on-screen and doesn't enlarge (viewport + overflow). */
const PREVIEW_BASE_STYLES =
  'html,body{margin:0;padding:0;overflow:hidden;width:390px;height:760px;max-width:390px;max-height:760px;box-sizing:border-box}*{box-sizing:border-box}';

/**
 * Returns full preview document with shared head (fonts) and enhancer script.
 * Sanitizes leading "html" junk and enforces viewport so UI doesn't go offscreen.
 */
export function wrapPreviewHtml(inner: string): string {
  const sanitized = sanitizePreviewHtml(inner);
  const script = getPreviewEnhancerScript();
  const bodyClose = /<\/body\s*>/i;
  const hasBody = bodyClose.test(sanitized);
  const viewportMeta = '<meta name="viewport" content="width=390,height=760,initial-scale=1,maximum-scale=1,user-scalable=no">';
  if (hasBody) {
    let out = sanitized;
    // Inject viewport and base styles into head if missing
    if (!/viewport/i.test(out)) {
      out = out.replace(/<head(\s[^>]*)?>/i, `$&${viewportMeta}`);
    }
    if (!out.includes('overflow:hidden') && !out.includes('overflow: hidden')) {
      out = out.replace(/<head(\s[^>]*)?>/i, `$&<style>${PREVIEW_BASE_STYLES}</style>`);
    }
    return out.replace(bodyClose, script + '\n$&');
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${viewportMeta}<style>${PREVIEW_BASE_STYLES}</style><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"></head><body style="margin:0;overflow:hidden;width:390px;height:760px;font-family:Roboto,sans-serif;background:#121212;color:#e0e0e0;">${sanitized}${script}</body></html>`;
}

/**
 * Creates a blob URL from HTML string for use in iframe src.
 * Call URL.revokeObjectURL when done to avoid leaks.
 */
export function createPreviewBlobUrl(html: string): string {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return URL.createObjectURL(blob);
}
