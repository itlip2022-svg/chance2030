/* CHANCE2030 — scroll reveal + dummy-image collections + collection lightbox. */
(function () {
  'use strict';

  // ---- scroll reveal -------------------------------------------------------
  (function () {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
    requestAnimationFrame(function () {
      els.forEach(function (e) {
        var r = e.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) e.classList.add('in');
      });
    });
    setTimeout(function () { els.forEach(function (e) { e.classList.add('in'); }); }, 2500);
  })();

  // ---- buzzer siren ---------------------------------------------------------
  (function () {
    var btn = document.querySelector('.buzzer-wrap');
    if (!btn) return;
    var ctx;
    btn.addEventListener('click', function () {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!ctx) ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      var now = ctx.currentTime;
      var duration = 1.4;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Classic two-tone siren sweep.
      osc.frequency.setValueAtTime(500, now);
      for (var i = 0; i < 4; i++) {
        var t = now + i * 0.35;
        osc.frequency.linearRampToValueAtTime(900, t + 0.175);
        osc.frequency.linearRampToValueAtTime(500, t + 0.35);
      }
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.setValueAtTime(0.25, now + duration - 0.15);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    });
  })();

  // ---- dummy collections ---------------------------------------------------
  // Each theme is a collection of placeholder images (picsum.photos, grayscale,
  // stable seeds so they don't reshuffle on reload). Swap these arrays for real
  // photo URLs later — the slot/lightbox logic stays the same.
  function pics(seed, n) {
    var out = [];
    for (var i = 1; i <= n; i++) {
      out.push('https://picsum.photos/seed/c2030-' + seed + '-' + i + '/1000/1250?grayscale');
    }
    return out;
  }

  // Language is taken from <html lang>. EN labels fall back to DE when missing.
  var LANG = (document.documentElement.lang || 'de').toLowerCase().indexOf('en') === 0 ? 'en' : 'de';
  var COUNT_WORD = LANG === 'en' ? 'images' : 'Bilder';

  var COLLECTIONS = {
    bauzaun:   { title: 'Bauzaun',                   en: 'Construction fence',        eyebrow: 'Der Ort · 01', eyebrowEn: 'The Place · 01', images: pics('bauzaun', 6) },
    garten:    { title: 'Garten',                    en: 'Garden',                    eyebrow: 'Der Ort · 02', eyebrowEn: 'The Place · 02', images: pics('garten', 6) },
    haeuschen: { title: 'Altes Häuschen',            en: 'Old cottage',               eyebrow: 'Der Ort · 03', eyebrowEn: 'The Place · 03', images: pics('haeuschen', 5) },
    detail:    { title: 'Baustellendetails',         en: 'Construction details',      eyebrow: 'Der Ort · 04', eyebrowEn: 'The Place · 04', images: pics('detail', 7) },
    licht:     { title: 'Licht · Staub · Holz · Erde', en: 'Light · Dust · Wood · Earth', eyebrow: 'Der Ort · 05', eyebrowEn: 'The Place · 05', images: pics('licht', 6) },
    still:     { title: 'Stille Ortsansicht',        en: 'Quiet view of the place',   eyebrow: 'Der Ort · 06', eyebrowEn: 'The Place · 06', images: pics('still', 5) },
    schwelle:  { title: 'Schwelle',                  en: 'Threshold',                 eyebrow: 'Der Ort · 07', eyebrowEn: 'The Place · 07', images: pics('schwelle', 5) },

    baustelle: { title: 'Baustelle',                 en: 'Construction site',         eyebrow: 'Serie 01', eyebrowEn: 'Series 01', images: pics('s-baustelle', 8) },
    lost:      { title: 'Lost Worpswede',            en: 'Lost Worpswede',            eyebrow: 'Serie 02', eyebrowEn: 'Series 02', images: ['/assets/collections/lost-rettungswege.jpg', '/assets/collections/lost-kneipe.jpg'] },
    zaun:      { title: 'Zaungespräche',             en: 'Fence conversations',       eyebrow: 'Serie 03', eyebrowEn: 'Series 03', images: pics('s-zaun', 6) },
    traeger:   { title: 'Trägerfiguren',             en: 'Supporting figures',        eyebrow: 'Serie 04', eyebrowEn: 'Series 04', images: pics('s-traeger', 6) },
    pgarten:   { title: 'Paulas Garten',             en: "Paula's Garden",            eyebrow: 'Serie 05', eyebrowEn: 'Series 05', images: pics('s-pgarten', 8) },
    jahr2030:  { title: '2030',                      en: '2030',                      eyebrow: 'Serie 06', eyebrowEn: 'Series 06', images: pics('s-2030', 6) },
    italia:    { title: 'Preview Italia',            en: 'Preview Italia',            eyebrow: 'Serie 07', eyebrowEn: 'Series 07', images: pics('s-italia', 7) }
  };

  function colTitle(col) { return (LANG === 'en' && col.en) ? col.en : col.title; }
  function colEyebrow(col) { return (LANG === 'en' && col.eyebrowEn) ? col.eyebrowEn : col.eyebrow; }
  // Real photographs (served from /assets/) keep their colour; picsum
  // placeholders stay grayscale to match the gallery look.
  function isColorImage(src) { return /^\/assets\//.test(src); }

  // ---- fill slot thumbnails ------------------------------------------------
  document.querySelectorAll('.slot[data-collection]').forEach(function (slot) {
    var col = COLLECTIONS[slot.getAttribute('data-collection')];
    if (!col) return;
    var img = slot.querySelector('img');
    if (img && !img.getAttribute('src')) img.src = col.images[0];
    var count = slot.querySelector('.slot-count');
    if (count) count.textContent = col.images.length + ' ' + COUNT_WORD;
  });

  // ---- collection lightbox -------------------------------------------------
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var lxImg = document.getElementById('lxImg');
  var lxTitle = document.getElementById('lxTitle');
  var lxEyebrow = document.getElementById('lxEyebrow');
  var lxCount = document.getElementById('lxCount');
  var lxCap = document.getElementById('lxCap');
  var lxStrip = document.getElementById('lxStrip');
  var lxClose = document.getElementById('lxClose');
  var lxPrev = document.getElementById('lxPrev');
  var lxNext = document.getElementById('lxNext');

  var current = null;
  var index = 0;
  var lastFocus = null;

  function show(i) {
    if (!current) return;
    var imgs = current.images;
    index = (i + imgs.length) % imgs.length;
    lxImg.src = imgs[index];
    lxImg.classList.toggle('color', isColorImage(imgs[index]));
    lxImg.alt = colTitle(current) + ' — ' + (LANG === 'en' ? 'image ' : 'Bild ') + (index + 1);
    lxCap.textContent = colTitle(current);
    lxCount.textContent = (index + 1) + ' / ' + imgs.length;
    Array.prototype.forEach.call(lxStrip.children, function (t, idx) {
      t.classList.toggle('active', idx === index);
      if (idx === index) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
    var active = lxStrip.children[index];
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }

  function buildStrip() {
    lxStrip.innerHTML = '';
    current.images.forEach(function (src, idx) {
      var b = document.createElement('button');
      b.className = 'lx-thumb';
      b.type = 'button';
      b.setAttribute('aria-label', 'Bild ' + (idx + 1));
      var im = document.createElement('img');
      im.loading = 'lazy';
      im.alt = '';
      im.src = src;
      b.appendChild(im);
      b.addEventListener('click', function () { show(idx); });
      lxStrip.appendChild(b);
    });
  }

  function open(key, startIndex) {
    current = COLLECTIONS[key];
    if (!current) return;
    lastFocus = document.activeElement;
    lxTitle.textContent = colTitle(current);
    lxEyebrow.textContent = colEyebrow(current) || 'Collection';
    buildStrip();
    show(startIndex || 0);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lxClose.focus();
  }

  function close() {
    lb.classList.remove('open');
    lxImg.removeAttribute('src');
    document.body.style.overflow = '';
    current = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll('.slot[data-collection]').forEach(function (slot) {
    slot.addEventListener('click', function () {
      open(slot.getAttribute('data-collection'), 0);
    });
  });

  lxClose.addEventListener('click', close);
  lxPrev.addEventListener('click', function () { show(index - 1); });
  lxNext.addEventListener('click', function () { show(index + 1); });
  lb.addEventListener('click', function (e) {
    // click on the dim backdrop (not on the inner panel) closes
    if (e.target === lb) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });
})();
