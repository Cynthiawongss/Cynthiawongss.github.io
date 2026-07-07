/**
 * Cynthia Wong — Personal Website
 * Main JavaScript: animations, navigation, scroll reveal,
 * code preview panels, Dify embed, PPT viewer.
 */

/* ============================================================
   HERO INTRO ANIMATION (GSAP)
   Hero text is hidden via .hero-text-hidden (opacity:0 in CSS).
   After Charmonman font loads, we remove that class and play
   the slide-down animation. No clearProps — elements stay visible.
   ============================================================ */
(function initHeroAnimation() {
  var wrapper = document.getElementById('heroTextWrapper');
  if (!wrapper) return;

  var heroName = document.querySelector('.hero-name');
  var heroTagline = document.querySelector('.hero-tagline');
  var heroBtn = document.querySelector('.hero-name_wrapper .button-group');

  var hasPlayed = false;

  function playOnce() {
    if (hasPlayed) return;
    hasPlayed = true;

    // Reveal — remove the opacity:0 class
    wrapper.classList.remove('hero-text-hidden');

    // Animate slide-down with GSAP if available
    if (typeof gsap !== 'undefined') {
      var tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
      if (heroName)   tl.fromTo(heroName,   { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, clearProps: 'transform' });
      if (heroTagline) tl.fromTo(heroTagline, { y: 40, opacity: 0 },  { y: 0, opacity: 1, duration: 0.9, clearProps: 'transform' }, '-=0.6');
      if (heroBtn)    tl.fromTo(heroBtn,     { y: 20, opacity: 0 },  { y: 0, opacity: 1, duration: 0.7, clearProps: 'transform' }, '-=0.5');
    }
  }

  // Wait for Charmonman font
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('1em Charmonman').then(function () {
      requestAnimationFrame(function () { requestAnimationFrame(playOnce); });
    }).catch(function () {
      playOnce();
    });
    setTimeout(playOnce, 4000); // hard fallback
  } else {
    playOnce();
  }
})();

/* ============================================================
   NAVBAR SCROLL EFFECT (Liquid Glass)
   ============================================================ */
(function initNavbar() {
  var wrapper = document.getElementById('navbar');
  var navOuter = document.getElementById('navOuter');
  if (!wrapper || !navOuter) return;

  function setVisible(v) {
    if (v) {
      wrapper.classList.add('visible');
      wrapper.style.setProperty('top', '0.8rem', 'important');
    } else {
      wrapper.classList.remove('visible');
      wrapper.style.setProperty('top', '-120px', 'important');
    }
  }

  // ── Dark background detection: switch nav to light text on dark sections ──
  var darkSectionIds = ['hero', 'work', 'projects'];
  var navDarkStyle = null;

  function updateNavTheme() {
    var scrollY = window.pageYOffset;
    var onDark = false;
    for (var i = 0; i < darkSectionIds.length; i++) {
      var sec = document.getElementById(darkSectionIds[i]);
      if (!sec) continue;
      var top = sec.offsetTop;
      var bottom = top + sec.offsetHeight;
      if (scrollY >= top - 120 && scrollY < bottom - 120) {
        onDark = true;
        break;
      }
    }
    wrapper.classList.toggle('nav-on-dark', onDark);

    // Force override ALL nav-item colors via inline !important.
    // We loop through items on every scroll so that dynamically
    // added .active classes are covered.
    var items = wrapper.querySelectorAll('.nav-item');
    for (var j = 0; j < items.length; j++) {
      var el = items[j];
      if (onDark) {
        el.style.setProperty('color', 'rgba(255, 255, 255, 0.88)', 'important');
      } else {
        // Remove our inline override to let CSS take over
        el.style.removeProperty('color');
      }
    }
  }

  // ── Scroll spy: auto-update active nav item based on visible section ──
  var sectionNavMap = [
    { nav: 'education',  sec: 'education' },
    { nav: 'background', sec: 'background' },
    { nav: 'work',       sec: 'work' },
    { nav: 'projects',   sec: 'projects' },
    { nav: 'campus',     sec: 'campus' },
  ];
  var navButtons = document.getElementById('navButtons');
  var navItems = navButtons.querySelectorAll('.nav-item');

  var navItemsMap = {};
  navItems.forEach(function(item) {
    navItemsMap[item.getAttribute('data-target')] = item;
  });

  var isManualScroll = false; // prevent click-triggered scroll from fighting scroll-spy

  function updateActiveNav() {
    if (isManualScroll) return;
    var scrollY = window.pageYOffset;
    var viewMiddle = scrollY + window.innerHeight / 3; // use top-third as trigger point

    var activeTarget = null;
    for (var k = sectionNavMap.length - 1; k >= 0; k--) {
      var sec = document.getElementById(sectionNavMap[k].sec);
      if (!sec) continue;
      if (sec.offsetTop <= viewMiddle) {
        activeTarget = sectionNavMap[k].nav;
        break;
      }
    }

    navItems.forEach(function(el) { el.classList.remove('active'); });
    if (activeTarget && navItemsMap[activeTarget]) {
      navItemsMap[activeTarget].classList.add('active');
    }
  }

  function onScroll() {
    var heroH = window.innerHeight;
    var scrollY = window.pageYOffset;
    // Show navbar only after hero has fully scrolled past (just before Education section)
    var showThreshold = heroH - 80;

    setVisible(scrollY > showThreshold);

    if (scrollY > heroH - 60) {
      navOuter.classList.add('scrolled');
    } else {
      navOuter.classList.remove('scrolled');
    }

    updateNavTheme();
    updateActiveNav();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Nav item click: toggle active state + suppress scroll-spy during animation ──
  navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      navItems.forEach(function(el) { el.classList.remove('active'); });
      this.classList.add('active');

      // Suppress scroll-spy for the duration of the smooth scroll
      isManualScroll = true;
      clearTimeout(isManualScroll);
      setTimeout(function() { isManualScroll = false; }, 1000);
    });
  });
})();

/* ============================================================
   SCROLL REVEAL (Intersection Observer)
   ============================================================ */
(function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  document.querySelectorAll('.reveal, .campus-event[data-reveal]').forEach((el) => {
    observer.observe(el);
  });
})();

/* ============================================================
   BACK TO TOP BUTTON
   ============================================================ */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 600) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ============================================================
   SMOOTH NAV SCROLL (offset for fixed nav)
   ============================================================ */
(function initSmoothNav() {
  document.querySelectorAll('.nav-item[data-target]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      const target = document.getElementById(targetId);
      if (!target) return;

      const navHeight = 80;
      const targetPosition =
        target.getBoundingClientRect().top + window.pageYOffset - navHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    });
  });
})();

/* ============================================================
   CODE PREVIEW PANELS (for Face Expression & Spotify)
   ============================================================ */

const codeCache = {};

function renderNotebookHTML(json) {
  /* ---------------------------------------------------
   *  Build VS Code-dark notebook HTML from notebook JSON.
   *  Returns full raw HTML string (code highlighted +
   *  DataFrames as dark tables + embedded images +
   *  markdown cells + stream/error output).
   * --------------------------------------------------- */
  const cells = json.cells || [];
  let html = '';

  // We track the execution count for In[] / Out[] labels.
  // Jupyter stores them per cell; fall back to cell index.
  for (let ci = 0; ci < cells.length; ci++) {
    const cell = cells[ci];
    const src = typeof cell.source === 'string'
      ? cell.source
      : (cell.source || []).join('');

    // ── Execution count for this cell ──
    const execCount = cell.execution_count != null ? cell.execution_count : (ci + 1);
    const inLabel  = `In&nbsp;[${execCount}]:`;
    const outLabel = `Out&nbsp;[${execCount}]:`;

    // ========= MARKDOWN CELL =========
    if (cell.cell_type === 'markdown') {
      html += '<div class="nb-cell nb-md">';
      // Simple markdown → HTML conversion (headings, paragraphs, bold, italic, code)
      const lines = src.split('\n');
      let mdHtml = '';
      for (const line of lines) {
        if (/^###\s/.test(line)) {
          mdHtml += '<h4 class="nb-md-h4">' + escapeHtml(line.replace(/^###\s+/, '')) + '</h4>';
        } else if (/^##\s/.test(line)) {
          mdHtml += '<h3 class="nb-md-h3">' + escapeHtml(line.replace(/^##\s+/, '')) + '</h3>';
        } else if (/^#\s/.test(line)) {
          mdHtml += '<h2 class="nb-md-h2">' + escapeHtml(line.replace(/^#\s+/, '')) + '</h2>';
        } else if (line.trim() === '') {
          mdHtml += '<br>';
        } else {
          let processed = escapeHtml(line);
          // Bold: **text** or __text__
          processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          processed = processed.replace(/__(.+?)__/g, '<strong>$1</strong>');
          // Italic: *text* or _text_
          processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
          processed = processed.replace(/_(.+?)_/g, '<em>$1</em>');
          // Inline code: `text`
          processed = processed.replace(/`(.+?)`/g, '<code class="nb-inline-code">$1</code>');
          mdHtml += '<span class="nb-md-line">' + processed + '</span>';
        }
      }
      html += mdHtml + '</div>';
      continue;
    }

    // ========= CODE CELL =========
    if (cell.cell_type === 'code') {
      html += '<div class="nb-cell nb-code-cell">';

      // ---- Code input ----
      html += '<div class="nb-input">';
      html += '<span class="nb-prompt">' + inLabel + '</span>';
      html += '<div class="nb-code-wrapper"><pre class="nb-code-pre"><code class="nb-code">';
      html += highlightPythonCode(src);
      html += '</code></pre></div>';
      html += '</div>';

      // ---- Outputs ----
      if (cell.outputs && cell.outputs.length > 0) {
        html += '<div class="nb-outputs">';
        for (let oj = 0; oj < cell.outputs.length; oj++) {
          const out = cell.outputs[oj];

          // -- stream (stdout / stderr) --
          if (out.output_type === 'stream' && out.text) {
            const text = Array.isArray(out.text) ? out.text.join('') : out.text;
            html += '<div class="nb-output-stream">';
            html += '<span class="nb-prompt nb-out-prompt">' + outLabel + '</span>';
            html += '<pre class="nb-stream-pre">' + escapeHtml(text) + '</pre>';
            html += '</div>';
          }

          // -- execute_result / display_data --
          else if (out.output_type === 'execute_result' || out.output_type === 'display_data') {
            const data = out.data || {};
            const hasImg = data['image/png'];
            const hasHtml = data['text/html'];
            const hasText = data['text/plain'];

            html += '<div class="nb-output-result">';
            html += '<span class="nb-prompt nb-out-prompt">' + outLabel + '</span>';
            html += '<div class="nb-out-content">';

            // Images — embed as <img> with data URI
            if (hasImg) {
              const imgData = Array.isArray(hasImg) ? hasImg.join('') : hasImg;
              html += '<img class="nb-out-img" src="data:image/png;base64,' + imgData
                   + '" alt="Cell output figure" loading="lazy" onclick="openImageLightbox(this.src)" />';
            }

            // HTML DataFrame — render as dark table
            if (hasHtml) {
              const rawHtml = Array.isArray(hasHtml) ? hasHtml.join('') : hasHtml;
              // Wrap in a container so we can style it
              html += '<div class="nb-df-wrapper">' + adaptDataFrameHTML(rawHtml) + '</div>';
            }

            // Plain text fallback — only if no HTML
            if (hasText && !hasHtml) {
              const plain = Array.isArray(hasText) ? hasText.join('') : hasText;
              html += '<pre class="nb-stream-pre">' + escapeHtml(plain) + '</pre>';
            }

            html += '</div></div>';
          }

          // -- error --
          else if (out.output_type === 'error') {
            html += '<div class="nb-output-error">';
            html += '<span class="nb-prompt nb-out-prompt">' + outLabel + '</span>';
            html += '<pre class="nb-err-pre">';
            const tb = (out.traceback || []).join('\n');
            html += escapeHtml(tb);
            html += '</pre></div>';
          }
        }
        html += '</div>';
      }

      html += '</div>'; // .nb-cell
    }
  }

  return html;
}


/* ── Helpers for notebook renderer ── */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* Lightly adapt pandas DataFrame HTML → VS Code dark table styling */
function adaptDataFrameHTML(rawHtml) {
  // Remove any scoped style block (we handle styling in CSS)
  let h = rawHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Add class to the table
  h = h.replace(/<table /g, '<table class="nb-df-table" ');
  return h;
}

/* Syntax highlight Python — VS Code Dark+ theme colors.
   Tokenizer approach: scan char-by-char for strings/comments/numbers,
   push plain-text segments and styled segments as {text,cls} tokens.
   Keyword highlighting runs on the plain-text segments via regex replace,
   always working on already-escaped HTML. */
function highlightPythonCode(code) {
  var tokens = [];  // {text, cls: string}
  var len = code.length;
  var pos = 0;
  var plain = '';

  function flush() {
    if (!plain) return;
    var frags = applyKeywords(escapeHtml(plain));
    for (var i = 0; i < frags.length; i++) tokens.push(frags[i]);
    plain = '';
  }

  while (pos < len) {
    var ch = code[pos];

    // Triple-quoted string
    if ((code.substr(pos, 3) === '"""' || code.substr(pos, 3) === "'''")) {
      flush();
      var tq = code.substr(pos, 3);
      var end = code.indexOf(tq, pos + 3);
      if (end === -1) end = len; else end += 3;
      tokens.push({text: escapeHtml(code.substring(pos, end)), cls: 'nb-s-string'});
      pos = end;
      continue;
    }

    // Single/double quoted string
    if (ch === '"' || ch === "'") {
      flush();
      var q = ch;
      var ss = pos; pos++;
      while (pos < len && code[pos] !== q) {
        if (code[pos] === '\\' && pos + 1 < len) pos++;
        pos++;
      }
      if (pos < len) pos++;
      tokens.push({text: escapeHtml(code.substring(ss, pos)), cls: 'nb-s-string'});
      continue;
    }

    // Comment
    if (ch === '#') {
      flush();
      var nl = code.indexOf('\n', pos);
      if (nl === -1) nl = len;
      tokens.push({text: escapeHtml(code.substring(pos, nl)), cls: 'nb-s-comment'});
      pos = nl;
      continue;
    }

    // Decorator
    if (ch === '@' && (pos === 0 || code[pos-1] === '\n')) {
      flush();
      var ds = pos; pos++;
      while (pos < len && /[a-zA-Z0-9_]/.test(code[pos])) pos++;
      tokens.push({text: escapeHtml(code.substring(ds, pos)), cls: 'nb-s-decorator'});
      continue;
    }

    // Number (when preceded by non-alpha — avoid matching inside words)
    if (/[0-9]/.test(ch) && (pos === 0 || !/[a-zA-Z_]/.test(code[pos-1]))) {
      flush();
      var ns = pos;
      while (pos < len && /[0-9.]/.test(code[pos])) pos++;
      tokens.push({text: escapeHtml(code.substring(ns, pos)), cls: 'nb-s-number'});
      continue;
    }

    plain += ch;
    pos++;
  }

  flush();

  // Assemble
  var out = '';
  for (var k = 0; k < tokens.length; k++) {
    var tok = tokens[k];
    if (tok.cls === '_html') {
      // pre-formatted HTML from applyKeywords
      out += tok.text;
    } else if (tok.cls) {
      out += '<span class="' + tok.cls + '">' + (tok.text || '') + '</span>';
    } else {
      out += (tok.text || '');
    }
  }
  return out;
}


/* ── Apply keyword syntax classes to already-escaped plain text.
      Returns array of strings (for plain) and {text,cls} objects (for keywords). ── */

function applyKeywords(escapedText) {
  // Patterns ordered most-specific-first.
  var patterns = [
    // class ClassName
    [/(\bclass\s+)(\w+)/g, function(m, kw, name) {
      return '<span class="nb-s-storage">' + kw + '</span><span class="nb-s-classname">' + name + '</span>';
    }],
    [/\b(def|lambda|yield)\b/g, span('nb-s-storage')],
    [/\b(import|from|return|if|elif|else|for|while|try|except|finally|raise|with|break|continue|pass|global|nonlocal|assert|del)\b/g, span('nb-s-control')],
    [/\b(in|not|and|or|is|True|False|None)\b/g, span('nb-s-keyword')],
    [/\b(self)\b/g, span('nb-s-self')],
    [/\b(super|__init__|__name__|__main__|range|len|print|int|float|str|list|dict|set|tuple|type|enumerate|zip|round|max|min|sum|sorted|filter|map|abs|open|format|pd|np|plt|sns|sklearn|torch|nn)\b/g, span('nb-s-builtin')],
  ];

  function span(cls) {
    return function(m) { return '<span class="' + cls + '">' + m + '</span>'; };
  }

  // Replace with placeholders so later patterns don't match inside earlier results.
  var markers = [];
  var id = 0;
  for (var p = 0; p < patterns.length; p++) {
    escapedText = escapedText.replace(patterns[p][0], function() {
      var rep = patterns[p][1].apply(null, arguments);
      markers.push(rep);
      return '\x00' + (markers.length - 1) + '\x00';
    });
  }

  // Split into fragments
  var result = [];
  var re = /\x00(\d+)\x00/g;
  var last = 0, m;
  while ((m = re.exec(escapedText)) !== null) {
    if (m.index > last) result.push(escapedText.substring(last, m.index));
    result.push({text: markers[parseInt(m[1])], cls: '_html'});  // cls:'_html' means raw HTML
    last = m.index + m[0].length;
  }
  if (last < escapedText.length) result.push(escapedText.substring(last));

  // Flatten: convert raw strings to {text,cls:''}, raw HTML to {text,cls:'_html'}
  var final = [];
  for (var i = 0; i < result.length; i++) {
    var item = result[i];
    if (typeof item === 'string') {
      final.push({text: item, cls: ''});
    } else {
      final.push(item);
    }
  }
  return final;
}


async function loadCodeContent(projectKey, tabKey, url) {
  const cacheKey = `${projectKey}_${tabKey}`;
  if (codeCache[cacheKey]) return codeCache[cacheKey];

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    // Parse .ipynb files — build full VS Code-style HTML with code + outputs
    if (url.endsWith('.ipynb')) {
      const json = await resp.json();
      const notebookHtml = renderNotebookHTML(json);
      codeCache[cacheKey] = notebookHtml;
      return notebookHtml;
    }

    // Plain text files
    const text = await resp.text();
    codeCache[cacheKey] = text;
    return text;
  } catch (err) {
    console.warn(`Could not load code from ${url}:`, err.message);
    return null;
  }
}

/**
 * Python syntax highlighter — VS Code Dark+ theme colors
 *
 * Color map:
 *   storage.type   #569CD6  blue    — def, class
 *   keyword.control #C586C0 purple   — import, from, return, if, else, for, while, try...
 *   keyword        #569CD6  blue    — in, not, and, or, is, True, False, None
 *   string         #CE9178  orange  — "...", '...'
 *   comment        #6A9955  green   — # ...
 *   numeric        #B5CEA8  pale green — 123, 3.14
 *   support.func   #DCDCAA  yellow  — print, range, len, super...
 *   entity.name    #4EC9B0  teal    — ClassName (after "class")
 *   variable.lang  #569CD6  blue    — self
 */
function highlightPython(code) {
  var escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1) Multi-line strings
  escaped = escaped.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g,
    '<span class="py-string">$1</span>');

  // 2) Single-line strings — skip already-wrapped matches
  escaped = escaped.replace(/(["'])(?:(?!\1|\\).|\\.)*?\1/g, function(m) {
    if (m.indexOf('<span') !== -1) return m;
    return '<span class="py-string">' + m + '</span>';
  });

  // 3) Comments — protect existing spans, then match #...
  escaped = escaped.replace(/(<span[^>]*>[\s\S]*?<\/span>)|(#.*$)/gm, function(m, span) {
    if (span) return span;
    return '<span class="py-comment">' + m + '</span>';
  });

  // Helper: temporarily hide all existing <span> tags so subsequent
  // regexes don't accidentally match inside HTML attributes (e.g. \bclass\b
  // matching class="py-comment", or \bself\b matching class="py-self").
  function safeReplace(str, pattern, replacement) {
    var placeholders = [];
    str = str.replace(/<span[^>]*>[\s\S]*?<\/span>/g, function(m) {
      placeholders.push(m);
      return '\x00PH' + (placeholders.length - 1) + 'PH\x00';
    });
    str = str.replace(pattern, replacement);
    str = str.replace(/\x00PH(\d+)PH\x00/g, function(_, i) {
      return placeholders[parseInt(i)];
    });
    return str;
  }

  // 4) Decorators
  escaped = safeReplace(escaped, /(@\w+)/g, '<span class="py-decorator">$1</span>');

  // 5) storage.type — def, class, lambda, yield (blue #569CD6)
  escaped = safeReplace(escaped, /\b(def|class|lambda|yield)\b/g,
    '<span class="py-storage">$1</span>');

  // 6) keyword.control — import, from, return, if, elif, else, for, while, try, except,
  //    finally, raise, with, break, continue, pass, global, nonlocal, assert, del (purple #C586C0)
  escaped = safeReplace(escaped, /\b(import|from|return|if|elif|else|for|while|try|except|finally|raise|with|break|continue|pass|global|nonlocal|assert|del)\b/g,
    '<span class="py-control">$1</span>');

  // 7) keyword.other — in, not, and, or, is, True, False, None (blue #569CD6)
  escaped = safeReplace(escaped, /\b(in|not|and|or|is|True|False|None)\b/g,
    '<span class="py-keyword">$1</span>');

  // 8) Class names after "class" keyword (teal #4EC9B0)
  //    Runs without safeReplace because it needs to see the <span class="py-storage"> from step 5.
  //    The pattern is specific enough (requires "</span>" after "class") that it won't
  //    match class="…" HTML attributes.
  escaped = escaped.replace(/<span class="py-storage">class<\/span>\s+(\w+)/g,
    '<span class="py-storage">class</span> <span class="py-classname">$1</span>');

  // 9) self (blue #569CD6)
  escaped = safeReplace(escaped, /\b(self)\b/g, '<span class="py-self">$1</span>');

  // 10) Built-in functions (yellow #DCDCAA)
  escaped = safeReplace(escaped, /\b(super|__init__|__name__|__main__|range|len|print|int|float|str|list|dict|set|tuple|type|enumerate|zip|round|max|min|sum|sorted|filter|map|abs|open|format)\b/g,
    '<span class="py-builtin">$1</span>');

  // 11) Numbers (pale green #B5CEA8)
  escaped = safeReplace(escaped, /\b(\d+\.?\d*)\b/g, '<span class="py-number">$1</span>');

  return escaped;
}

const codeFilesMap = {
  face: {
    model: 'assets/code/model.py',
    train: 'assets/code/train.py',
  },
  spotify: {
    knn: 'assets/code/03_skip_prediction_knn.ipynb',
    abtest: 'assets/code/04_ab_test_platform.ipynb',
  },
};

const placeholderCode = {
  face: {
    model: `import torch
import torch.nn as nn


class EmotionCNN(nn.Module):
    def __init__(self):
        super(EmotionCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2), # -> 24x24

            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2), # -> 12x12

            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.MaxPool2d(2), # -> 6x6

            nn.Conv2d(256, 512, kernel_size=3, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(),
            # Adaptive average pooling to 1x1, greatly reducing FC layer parameters
            nn.AdaptiveAvgPool2d((1, 1))
        )

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.4), # Moderate dropout before final FC
            nn.Linear(512, 256),
            nn.BatchNorm1d(256), # BN to accelerate convergence
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 7)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


# Quick test
if __name__ == "__main__":
    model = EmotionCNN()
    print(model)

    # Dummy input test
    dummy = torch.zeros(4, 1, 48, 48)   # 4 images
    output = model(dummy)
    print(f"\\nInput shape: {dummy.shape}")
    print(f"Output shape: {output.shape}")  # Expected: [4, 7]`,
    train: `import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from dataset import EmotionDataset
from model import EmotionCNN
import numpy as np
from sklearn.metrics import f1_score, precision_score, confusion_matrix
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

# Hyperparameters
BATCH_SIZE = 32
EPOCHS = 60
LEARNING_RATE = 0.001
EMOTION_NAMES = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]


# Train one epoch
def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss = 0
    all_preds = []
    all_labels = []

    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        _, predicted = outputs.max(1)
        all_preds.extend(predicted.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

    avg_loss = total_loss / len(loader)
    acc = 100.0 * np.mean(np.array(all_preds) == np.array(all_labels))
    f1 = f1_score(all_labels, all_preds, average="weighted", zero_division=0)
    precision = precision_score(all_labels, all_preds, average="weighted", zero_division=0)
    rmse = compute_rmse(all_labels, all_preds)

    return avg_loss, acc, f1, precision, rmse

# Compute RMSE
def compute_rmse(labels, preds):
    labels = np.array(labels)
    preds = np.array(preds)
    rmse = np.sqrt(np.mean((preds - labels) ** 2))
    return rmse

# Validate
def validate(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()

            _, predicted = outputs.max(1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    avg_loss = total_loss / len(loader)
    acc = 100.0 * np.mean(np.array(all_preds) == np.array(all_labels))
    f1 = f1_score(all_labels, all_preds, average="weighted", zero_division=0)
    precision = precision_score(all_labels, all_preds, average="weighted", zero_division=0)
    rmse = compute_rmse(all_labels, all_preds)

    # Per-class F1 and precision
    f1_each = f1_score(all_labels, all_preds, average=None, zero_division=0)
    precision_each = precision_score(all_labels, all_preds, average=None, zero_division=0)
    cm = confusion_matrix(all_labels, all_preds)

    return avg_loss, acc, f1, precision, rmse, f1_each, precision_each, cm


# Save results to Excel
def save_results_to_excel(history, best_f1_each, best_precision_each, best_cm, best_acc):
    os.makedirs("models", exist_ok=True)
    save_path = "models/training_results.xlsx"

    wb = openpyxl.Workbook()

    # Styles
    center = Alignment(horizontal="center", vertical="center")
    left = Alignment(horizontal="left", vertical="center")

    def make_border():
        thin = Side(style="thin")
        return Border(left=thin, right=thin, top=thin, bottom=thin)

    # Colors
    COLOR_BLUE = "4472C4"
    COLOR_GRAY = "F2F2F2"
    COLOR_GREEN = "E2EFDA"
    COLOR_YELLOW = "FFF2CC"

    # Header style
    def set_header(ws, row, col, text, bg=None):
        if bg is None:
            bg = COLOR_BLUE
        cell = ws.cell(row=row, column=col, value=text)
        cell.font = Font(bold=True, color="FFFFFF", name="Calibri", size=11)
        cell.fill = PatternFill("solid", fgColor=bg)
        cell.alignment = center
        cell.border = make_border()
        return cell

    # Data cell style
    def set_cell(ws, row, col, value, align=None, bold=False, bg=None, num_format=None):
        if align is None:
            align = center
        cell = ws.cell(row=row, column=col, value=value)
        cell.font = Font(bold=bold, name="Calibri", size=10)
        cell.alignment = align
        cell.border = make_border()
        if bg is not None:
            cell.fill = PatternFill("solid", fgColor=bg)
        if num_format is not None:
            cell.number_format = num_format
        return cell

    # Set layout
    def set_layout(ws, freeze, col_widths):
        ws.freeze_panes = freeze
        for col_letter, width in col_widths.items():
            ws.column_dimensions[col_letter].width = width
        ws.row_dimensions[1].height = 22

    # Sheet 1: Training history
    ws1 = wb.active
    ws1.title = "Training History"

    headers = [
        "Epoch",
        "Train Loss", "Train ACC (%)", "Train F1", "Train Precision", "Train RMSE",
        "Val Loss", "Val ACC (%)", "Val F1", "Val Precision", "Val RMSE",
        "Best Model"
    ]
    for col, h in enumerate(headers, 1):
        set_header(ws1, 1, col, h)

    for row_idx, record in enumerate(history, 2):
        is_best = record["is_best"]
        if is_best:
            bg = COLOR_GREEN
        elif row_idx % 2 == 0:
            bg = COLOR_GRAY
        else:
            bg = None

        values = [
            record["epoch"],
            record["train_loss"], record["train_acc"],
            record["train_f1"], record["train_prec"], record["train_rmse"],
            record["val_loss"], record["val_acc"],
            record["val_f1"], record["val_prec"], record["val_rmse"],
            "\\u2713" if is_best else ""
        ]
        formats = [
            None,
            "0.0000", "0.00", "0.0000", "0.0000", "0.0000",
            "0.0000", "0.00", "0.0000", "0.0000", "0.0000",
            None
        ]
        for col, (val, fmt) in enumerate(zip(values, formats), 1):
            set_cell(ws1, row_idx, col, val, bg=bg, num_format=fmt, bold=is_best)

    set_layout(ws1, "B2", {
        "A": 8, "B": 12, "C": 14, "D": 12, "E": 16, "F": 12,
        "G": 12, "H": 12, "I": 10, "J": 16, "K": 12, "L": 10
    })

    # Sheet 2: Per-class metrics
    ws2 = wb.create_sheet("Per-Class Metrics (Best Model)")

    for col, h in enumerate(["Emotion", "F1 Score", "Precision"], 1):
        set_header(ws2, 1, col, h)

    for i, name in enumerate(EMOTION_NAMES):
        row_idx = i + 2
        bg = COLOR_GRAY if row_idx % 2 == 0 else None
        set_cell(ws2, row_idx, 1, name, align=left, bg=bg)
        set_cell(ws2, row_idx, 2, round(float(best_f1_each[i]), 4), bg=bg, num_format="0.0000")
        set_cell(ws2, row_idx, 3, round(float(best_precision_each[i]), 4), bg=bg, num_format="0.0000")

    total_row = len(EMOTION_NAMES) + 3
    set_cell(ws2, total_row, 1, "Overall (weighted)", align=left, bold=True, bg=COLOR_YELLOW)
    set_cell(ws2, total_row, 2, round(float(best_f1_each.mean()), 4), bold=True, bg=COLOR_YELLOW, num_format="0.0000")
    set_cell(ws2, total_row, 3, round(float(best_precision_each.mean()), 4), bold=True, bg=COLOR_YELLOW, num_format="0.0000")

    set_layout(ws2, "B2", {"A": 20, "B": 12, "C": 12})

    # Sheet 3: Confusion matrix
    ws3 = wb.create_sheet("Confusion Matrix (Best Model)")

    corner = ws3.cell(row=1, column=1, value="True \\\\ Predicted")
    corner.font = Font(bold=True, name="Calibri", size=10, italic=True)
    corner.alignment = center
    corner.border = make_border()
    corner.fill = PatternFill("solid", fgColor="D9D9D9")

    for col, name in enumerate(EMOTION_NAMES, 2):
        set_header(ws3, 1, col, name)

    row_totals = best_cm.sum(axis=1)
    for row_idx, name in enumerate(EMOTION_NAMES, 2):
        set_header(ws3, row_idx, 1, name)
        for col, val in enumerate(best_cm[row_idx - 2], 2):
            is_diagonal = (col - 2 == row_idx - 2)
            percent = val / row_totals[row_idx - 2] * 100 if row_totals[row_idx - 2] > 0 else 0
            if is_diagonal:
                bg = "C6EFCE"
            elif percent > 20:
                bg = "FFC7CE"
            elif percent > 10:
                bg = "FFEB9C"
            else:
                bg = None

            cell = ws3.cell(row=row_idx, column=col, value=int(val))
            cell.font = Font(
                bold=is_diagonal,
                name="Calibri",
                size=10,
                color="375623" if is_diagonal else "000000"
            )
            cell.alignment = center
            cell.border = make_border()
            if bg is not None:
                cell.fill = PatternFill("solid", fgColor=bg)

    set_layout(ws3, "B2", {
        "A": 14, "B": 10, "C": 10, "D": 10,
        "E": 10, "F": 10, "G": 10, "H": 10
    })
    for i in range(1, len(EMOTION_NAMES) + 2):
        ws3.row_dimensions[i].height = 20

    # Sheet 4: Summary
    ws4 = wb.create_sheet("Summary")
    set_header(ws4, 1, 1, "Item")
    set_header(ws4, 1, 2, "Value")

    summary_data = [
        ("Best Validation Accuracy", f"{best_acc:.2f}%"),
        ("Total Epochs", EPOCHS),
        ("Batch Size", BATCH_SIZE),
        ("Learning Rate", LEARNING_RATE),
        ("Model Save Path", "models/best_model.pth"),
        ("Results Save Path", "models/training_results.xlsx"),
    ]
    for row_idx, (key, value) in enumerate(summary_data, 2):
        bg = COLOR_GRAY if row_idx % 2 == 0 else None
        set_cell(ws4, row_idx, 1, key, align=left, bg=bg)
        set_cell(ws4, row_idx, 2, value, align=left, bg=bg)

    set_layout(ws4, "A2", {"A": 22, "B": 30})

    wb.save(save_path)
    print(f"\\nResults saved to: {save_path}")


# Main function
def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load datasets
    train_dataset = EmotionDataset("data/processed/train", is_train=True)
    val_dataset = EmotionDataset("data/processed/val", is_train=False)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # Create model
    model = EmotionCNN().to(device)

    # Compute class weights from training set
    labels = [sample[1] for sample in train_dataset.samples]
    class_counts = np.bincount(labels)
    total_samples = len(labels)

    weights = total_samples / (len(EMOTION_NAMES) * class_counts)
    class_weights = torch.tensor(weights, dtype=torch.float).to(device)

    print(f"Computed class weights: {class_weights}")
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # Scheduler: ReduceLROnPlateau
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=5)

    val_loss, val_acc, val_f1, val_prec, val_rmse, f1_each, precision_each, cm = validate(model, val_loader, criterion, device)
    scheduler.step(val_acc)

    # Training loop
    best_acc = 0
    history = []
    best_f1_each = None
    best_precision_each = None
    best_cm = None

    for epoch in range(EPOCHS):
        # Train
        train_loss, train_acc, train_f1, train_prec, train_rmse = train_epoch(
            model, train_loader, criterion, optimizer, device
        )

        # Validate
        val_loss, val_acc, val_f1, val_prec, val_rmse, f1_each, precision_each, cm = validate(
            model, val_loader, criterion, device
        )

        # Update LR via ReduceLROnPlateau
        scheduler.step(val_acc)
        current_lr = optimizer.param_groups[0]['lr']

        # Save best model
        is_best = val_acc > best_acc
        if is_best:
            best_acc = val_acc
            best_f1_each = f1_each.copy()
            best_precision_each = precision_each.copy()
            best_cm = cm.copy()
            os.makedirs("models", exist_ok=True)
            torch.save(model.state_dict(), "models/best_model.pth")

        # Record
        history.append({
            "epoch": epoch + 1,
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 2),
            "train_f1": round(train_f1, 4),
            "train_prec": round(train_prec, 4),
            "train_rmse": round(train_rmse, 4),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 2),
            "val_f1": round(val_f1, 4),
            "val_prec": round(val_prec, 4),
            "val_rmse": round(val_rmse, 4),
            "is_best": is_best,
        })

        # Print
        print(f"\\nEpoch {epoch + 1}/{EPOCHS}  (LR: {current_lr:.6f})")
        print(f"  Train -> Loss: {train_loss:.4f} | ACC: {train_acc:.2f}% | F1: {train_f1:.4f} | Precision: {train_prec:.4f}")
        print(f"  Val   -> Loss: {val_loss:.4f} | ACC: {val_acc:.2f}% | F1: {val_f1:.4f} | Precision: {val_prec:.4f}")
        print("  Per-class validation results:")
        for i, name in enumerate(EMOTION_NAMES):
            print(f"    {name:10s} F1: {f1_each[i]:.4f}  Precision: {precision_each[i]:.4f}")
        if is_best:
            print(f"  *** Saved best model, current best accuracy: {val_acc:.2f}% ***")

    # Final summary
    print(f"\\nTraining complete! Best validation accuracy: {best_acc:.2f}%")
    print("\\nConfusion Matrix (best model):")
    header = "True\\\\Pred   " + "  ".join(f"{n:>8}" for n in EMOTION_NAMES)
    print(header)
    print("-" * len(header))
    for i, row in enumerate(best_cm):
        print(f"{EMOTION_NAMES[i]:10s}" + "  ".join(f"{v:8d}" for v in row))

    # Export to Excel
    save_results_to_excel(history, best_f1_each, best_precision_each, best_cm, best_acc)


if __name__ == "__main__":
    main()`,
  },
  spotify: {
    knn: ``,    // loaded from .ipynb files
    abtest: ``,
  },
};

function toggleCodePreview(projectKey) {
  const panel = document.getElementById('codePreview' + capitalize(projectKey));
  if (!panel) return;

  const isOpen = panel.classList.contains('open');

  // Close all other panels first
  document.querySelectorAll('.code-preview-panel.open').forEach((p) => {
    p.classList.remove('open');
  });

  if (!isOpen) {
    panel.classList.add('open');
    const firstTab = panel.querySelector('.code-preview-tab');
    if (firstTab) {
      // Extract tab key from onclick attribute: switchCodeTab('projectKey', 'tabKey', this)
      const onclick = firstTab.getAttribute('onclick') || '';
      const match = onclick.match(/switchCodeTab\('[^']*',\s*'([^']*)'/);
      const tabKey = match ? match[1] : 'model';
      switchCodeTab(projectKey, tabKey, firstTab);
    }
    // Scroll panel into view
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

async function switchCodeTab(projectKey, tabKey, tabEl) {
  const panel = tabEl.closest('.code-preview-panel');
  panel.querySelectorAll('.code-preview-tab').forEach((t) => t.classList.remove('active'));
  tabEl.classList.add('active');

  const contentEl = document.getElementById('codeContent' + capitalize(projectKey));
  if (!contentEl) return;

  contentEl.innerHTML = '<em class="code-loading">Loading...</em>';

  const fileUrl = codeFilesMap[projectKey] && codeFilesMap[projectKey][tabKey];
  let code = null;

  if (fileUrl) {
    code = await loadCodeContent(projectKey, tabKey, fileUrl);
  }

  if (!code && placeholderCode[projectKey] && placeholderCode[projectKey][tabKey]) {
    code = placeholderCode[projectKey][tabKey];
  }

  if (code) {
    // Auto-detect file type & apply syntax highlighting
    // .ipynb files already return full HTML from renderNotebookHTML()
    if (fileUrl && fileUrl.endsWith('.py')) {
      code = highlightPython(code);
    }
    // Notebook: add class so CSS applies notebook-specific styles,
    // keeping .py file rendering unchanged.
    if (fileUrl && fileUrl.endsWith('.ipynb')) {
      contentEl.classList.add('notebook-mode');
    } else {
      contentEl.classList.remove('notebook-mode');
    }
    contentEl.innerHTML = code;
  } else {
    contentEl.innerHTML =
      '<em style="color:#8B8B8B;">Place your source files in assets/code/ folder.<br>' +
      'Expected: ' + (fileUrl || 'N/A') + '</em>';
  }
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ============================================================
   PPT PREVIEW PANEL (Slide Viewer)
   ============================================================ */

const TOTAL_SLIDES = 13;
let currentSlide = 1;

function initSlideViewer() {
  const slideImage = document.getElementById('slideImage');
  const slideCounter = document.getElementById('slideCounter');
  const slideDots = document.getElementById('slideDots');
  const prevBtn = document.getElementById('slidePrev');
  const nextBtn = document.getElementById('slideNext');

  if (!slideImage || !slideDots) return;

  // Build dots
  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    const dot = document.createElement('button');
    dot.className = 'slide-dot' + (i === 1 ? ' active' : '');
    dot.title = 'Slide ' + i;
    dot.addEventListener('click', () => goToSlide(i));
    slideDots.appendChild(dot);
  }

  function updateSlide() {
    slideImage.src = 'assets/images/slides/slide_' + currentSlide + '.png';
    slideImage.alt = 'Slide ' + currentSlide;
    if (slideCounter) slideCounter.textContent = currentSlide + ' / ' + TOTAL_SLIDES;
    const dots = slideDots.querySelectorAll('.slide-dot');
    dots.forEach((d, idx) => d.classList.toggle('active', idx + 1 === currentSlide));
  }

  window.goToSlide = function(n) {
    currentSlide = Math.max(1, Math.min(TOTAL_SLIDES, n));
    updateSlide();
  };

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

  // Keyboard navigation for slides
  document.addEventListener('keydown', (e) => {
    const panel = document.getElementById('pptEmbedPanel');
    if (!panel || !panel.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); goToSlide(currentSlide - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goToSlide(currentSlide + 1); }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSlideViewer);
} else {
  initSlideViewer();
}

function togglePptPreview() {
  const panel = document.getElementById('pptEmbedPanel');
  if (!panel) return;

  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    const body = document.getElementById('pptEmbedBody');
    if (body) body.classList.remove('fullscreen');
  } else {
    panel.classList.add('open');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function togglePptFullscreen() {
  const body = document.getElementById('pptEmbedBody');
  if (!body) return;
  body.classList.toggle('fullscreen');
}

/* ============================================================
   DIFY DASHBOARD EMBED — TOGGLE / ZOOM / FULLSCREEN
   ============================================================ */
function togglePerformancePanel() {
  const panel = document.getElementById('performancePanel');
  if (!panel) return;
  panel.classList.toggle('open');
}

function toggleDifyPreview() {
  const panel = document.getElementById('difyEmbedPanel');
  if (!panel) return;
  panel.classList.toggle('open');
}

function zoomDifyEmbed() {
  const body = document.getElementById('difyEmbedBody');
  if (!body) return;
  body.classList.toggle('fullscreen');

  const btn = document.querySelector('.dify-embed-panel .dify-zoom-btn');
  if (btn) {
    btn.textContent = body.classList.contains('fullscreen') ? '⛶ Exit' : '⛶';
  }
}

// ESC key exits fullscreen for everything
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Dify
    const difyBody = document.getElementById('difyEmbedBody');
    if (difyBody && difyBody.classList.contains('fullscreen')) {
      difyBody.classList.remove('fullscreen');
      const btn = document.querySelector('.dify-embed-panel .dify-zoom-btn');
      if (btn) btn.textContent = '⛶';
    }

    // PPT
    const pptBody = document.getElementById('pptEmbedBody');
    if (pptBody && pptBody.classList.contains('fullscreen')) {
      pptBody.classList.remove('fullscreen');
    }

    // Code panels
    document.querySelectorAll('.code-preview-panel.open').forEach((p) => {
      p.classList.remove('open');
    });

    // PPT panel
    const pptPanel = document.getElementById('pptEmbedPanel');
    if (pptPanel && pptPanel.classList.contains('open')) {
      pptPanel.classList.remove('open');
    }

    // Performance Report panel
    const perfPanel = document.getElementById('performancePanel');
    if (perfPanel && perfPanel.classList.contains('open')) {
      perfPanel.classList.remove('open');
    }
  }
});

/* ============================================================
   GSAP SCROLLTRIGGER — Parallax & Staggered Reveal
   ============================================================ */
(function initGsapScrollAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // Background image parallax on hero
  const bgImage = document.querySelector('.hero-video_background-image');
  if (bgImage) {
    gsap.to(bgImage, {
      y: 80,
      scale: 1.05,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // Staggered reveal for section labels
  document.querySelectorAll('.section-label').forEach((label) => {
    gsap.fromTo(
      label,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: label,
          start: 'top bottom-=100',
          toggleActions: 'play none none none',
        },
      }
    );
  });
})();

/* ============================================================
   IMAGE LIGHTBOX — click to zoom, scroll to scale, ESC/btn close
   ============================================================ */
(function initLightbox() {
  const overlay = document.getElementById('lightboxOverlay');
  const img = document.getElementById('lightboxImage');
  const closeBtn = document.getElementById('lightboxClose');
  if (!overlay || !img) return;

  let scale = 1;
  let panX = 0, panY = 0;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let panStartX = 0, panStartY = 0;

  function updateTransform() {
    img.style.transform = `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`;
  }

  function resetView() {
    scale = 1;
    panX = 0;
    panY = 0;
    updateTransform();
  }

  function open(src) {
    img.src = src;
    resetView();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    resetView();
  }

  window.openImageLightbox = open;
  window.closeImageLightbox = close;

  // Close on overlay click (background, not image)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
  }

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      close();
    }
  });

  // Scroll to zoom
  overlay.addEventListener('wheel', (e) => {
    if (!overlay.classList.contains('open')) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const newScale = Math.min(8, Math.max(0.5, scale + delta));

    // Zoom toward cursor position
    const rect = img.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;

    const ratio = newScale / scale;
    panX = ratio * panX + (ratio - 1) * cx;
    panY = ratio * panY + (ratio - 1) * cy;
    scale = newScale;
    updateTransform();
  }, { passive: false });

  // Pan with mouse drag
  img.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
    img.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = panStartX + (e.clientX - dragStartX);
    panY = panStartY + (e.clientY - dragStartY);
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      img.style.cursor = scale > 1 ? 'grab' : 'default';
    }
  });

  // Double-click to reset
  img.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    resetView();
  });
})();

/* ============================================================
   AUTO-LOAD OPEN CODE PANELS ON PAGE LOAD
   ============================================================ */
(function initOpenPanels() {
  // Wait for DOM ready, then auto-load content for any panel that starts open
  function loadOpenPanels() {
    document.querySelectorAll('.code-preview-panel.open').forEach(function(panel) {
      var firstTab = panel.querySelector('.code-preview-tab');
      if (!firstTab) return;
      // Extract project key from panel id: "codePreviewFace" → "face"
      var id = panel.id;
      var projectKey = id.replace('codePreview', '').toLowerCase();
      // Extract tab key from first tab's onclick
      var onclick = firstTab.getAttribute('onclick') || '';
      var match = onclick.match(/switchCodeTab\('[^']*',\s*'([^']*)'/);
      var tabKey = match ? match[1] : 'model';
      switchCodeTab(projectKey, tabKey, firstTab);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOpenPanels);
  } else {
    loadOpenPanels();
  }
})();
console.log('✨ Cynthia Wong — Portfolio website ready.');
console.log('📂 Place your code files in: assets/code/');
console.log('🖼️  Place your hero image (hero-pg.png) in: assets/images/');
console.log('📊 For Dify embed: update iframe src in HTML with your Dify shared dashboard URL.');
console.log('📊 For PPT embed: update iframe src in HTML with your Google Slides / Canva link.');
