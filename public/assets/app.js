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

  var COLLECTIONS = {
    bauzaun:   { title: 'Bauzaun',                   eyebrow: 'Der Ort · 01', images: pics('bauzaun', 6) },
    garten:    { title: 'Garten',                    eyebrow: 'Der Ort · 02', images: pics('garten', 6) },
    haeuschen: { title: 'Altes Häuschen',            eyebrow: 'Der Ort · 03', images: pics('haeuschen', 5) },
    detail:    { title: 'Baustellendetails',         eyebrow: 'Der Ort · 04', images: pics('detail', 7) },
    licht:     { title: 'Licht · Staub · Holz · Erde', eyebrow: 'Der Ort · 05', images: pics('licht', 6) },
    still:     { title: 'Stille Ortsansicht',        eyebrow: 'Der Ort · 06', images: pics('still', 5) },
    schwelle:  { title: 'Schwelle',                  eyebrow: 'Der Ort · 07', images: pics('schwelle', 5) },

    baustelle: { title: 'Baustelle',                 eyebrow: 'Serie 01', images: pics('s-baustelle', 8) },
    lost:      { title: 'Lost Worpswede',            eyebrow: 'Serie 02', images: pics('s-lost', 7) },
    zaun:      { title: 'Zaungespräche',             eyebrow: 'Serie 03', images: pics('s-zaun', 6) },
    traeger:   { title: 'Trägerfiguren',             eyebrow: 'Serie 04', images: pics('s-traeger', 6) },
    pgarten:   { title: 'Paulas Garten',             eyebrow: 'Serie 05', images: pics('s-pgarten', 8) },
    jahr2030:  { title: '2030',                      eyebrow: 'Serie 06', images: pics('s-2030', 6) },
    italia:    { title: 'Preview Italia',            eyebrow: 'Serie 07', images: pics('s-italia', 7) }
  };

  // ---- fill slot thumbnails ------------------------------------------------
  document.querySelectorAll('.slot[data-collection]').forEach(function (slot) {
    var col = COLLECTIONS[slot.getAttribute('data-collection')];
    if (!col) return;
    var img = slot.querySelector('img');
    if (img && !img.getAttribute('src')) img.src = col.images[0];
    var count = slot.querySelector('.slot-count');
    if (count) count.textContent = col.images.length + ' Bilder';
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
    lxImg.alt = current.title + ' — Bild ' + (index + 1);
    lxCap.textContent = current.title;
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
    lxTitle.textContent = current.title;
    lxEyebrow.textContent = current.eyebrow || 'Collection';
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
