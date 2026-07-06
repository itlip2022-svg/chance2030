(function () {
  "use strict";

  var DISCOUNT_CODE = "WILLKOMMEN10";
  var STORAGE_SUBSCRIBED = "funnel_subscribed";
  var STORAGE_MODAL_SEEN = "funnel_modal_seen";
  var MODAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

  /* ---------- Topbar-Schatten beim Scrollen ---------- */
  var topbar = document.getElementById("topbar");
  window.addEventListener("scroll", function () {
    topbar.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });

  /* ---------- Sanftes Einblenden von Sektionen ---------- */
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Anmeldung ---------- */
  function isSubscribed() {
    try { return localStorage.getItem(STORAGE_SUBSCRIBED) === "1"; } catch (e) { return false; }
  }

  function markSubscribed() {
    try { localStorage.setItem(STORAGE_SUBSCRIBED, "1"); } catch (e) { /* egal */ }
  }

  function submitForm(form, source, onSuccess) {
    var email = form.querySelector('input[name="email"]');
    var name = form.querySelector('input[name="name"]');
    var hp = form.querySelector('input[name="website"]');
    var consent = form.querySelector('input[type="checkbox"]');
    var msg = form.querySelector(".form-msg");
    var button = form.querySelector('button[type="submit"]');

    msg.textContent = "";

    if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      msg.textContent = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
      email.focus();
      return;
    }
    if (consent && !consent.checked) {
      msg.textContent = "Bitte bestätigen Sie kurz die Einwilligung.";
      return;
    }

    var originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Einen Moment …";

    fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: email.value.trim(),
        name: name ? name.value.trim() : "",
        source: source,
        website: hp ? hp.value : "",
      }),
    })
      .then(function (res) { return res.json().then(function (b) { return { ok: res.ok, body: b }; }); })
      .then(function (r) {
        if (r.ok && r.body.ok) {
          markSubscribed();
          onSuccess();
        } else {
          msg.textContent = (r.body && r.body.error) || "Das hat leider nicht geklappt. Bitte erneut versuchen.";
        }
      })
      .catch(function () {
        msg.textContent = "Verbindungsfehler — bitte erneut versuchen.";
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = originalLabel;
      });
  }

  /* Haupt-Formular */
  var mainForm = document.getElementById("subscribe-form");
  var successBox = document.getElementById("goody-success");
  mainForm.addEventListener("submit", function (e) {
    e.preventDefault();
    submitForm(mainForm, "funnel-hauptformular", function () {
      mainForm.hidden = true;
      successBox.hidden = false;
      successBox.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  /* ---------- Buchungs-Widget: Wohnungs-Umschalter ---------- */
  var bookingTabs = document.querySelectorAll(".booking-tab");
  bookingTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      bookingTabs.forEach(function (t) {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      document.querySelectorAll(".booking-panel").forEach(function (p) {
        p.classList.toggle("active", p.id === tab.dataset.panel);
      });
    });
  });

  /* ---------- Exit-Intent-Modal ---------- */
  var modal = document.getElementById("exit-modal");
  var modalForm = document.getElementById("modal-form");
  var modalShownThisSession = false;
  var pageLoadedAt = Date.now();
  var MIN_DWELL_MS = 15000; // Modal frühestens nach 15s Verweildauer
  // Test-Schalter: Seite mit ?popup=test aufrufen -> Popup sofort, ohne Sperren
  var FORCE_POPUP = /[?&]popup=test/.test(location.search);

  function modalRecentlySeen() {
    try {
      var ts = parseInt(localStorage.getItem(STORAGE_MODAL_SEEN), 10);
      return !isNaN(ts) && Date.now() - ts < MODAL_COOLDOWN_MS;
    } catch (e) { return false; }
  }

  function showModal() {
    if (!FORCE_POPUP) {
      if (Date.now() - pageLoadedAt < MIN_DWELL_MS) return;
      if (modalShownThisSession || isSubscribed() || modalRecentlySeen()) return;
      // Niemals unterbrechen, wenn gerade ein Formular ausgefüllt wird
      var active = document.activeElement;
      if (active && active.closest && active.closest("form")) return;
    }
    modalShownThisSession = true;
    if (!FORCE_POPUP) {
      try { localStorage.setItem(STORAGE_MODAL_SEEN, String(Date.now())); } catch (e) { /* egal */ }
    }
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function hideModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  document.getElementById("modal-close").addEventListener("click", hideModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) hideModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) hideModal();
  });

  if (FORCE_POPUP) setTimeout(showModal, 500);

  // Desktop: Maus verlässt das Fenster nach oben (Exit-Intent)
  document.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget && e.clientY <= 0) showModal();
  });

  // Mobile/Fallback: nach 60% Scrolltiefe
  var scrollTriggered = false;
  window.addEventListener("scroll", function () {
    if (scrollTriggered) return;
    var depth = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
    if (depth > 0.6) {
      scrollTriggered = true;
      // kleine Verzögerung, damit es nicht mitten im Lesen aufpoppt
      setTimeout(showModal, 12000);
    }
  }, { passive: true });

  modalForm.addEventListener("submit", function (e) {
    e.preventDefault();
    submitForm(modalForm, "funnel-exit-modal", function () {
      modalForm.outerHTML =
        '<div class="goody-success">' +
        '<p class="success-emoji">🎉</p>' +
        "<h3>Ihr Code:</h3>" +
        '<p class="code">' + DISCOUNT_CODE + "</p>" +
        "<p>Gültig für Ihre erste Direktbuchung. Der Insider-Guide kommt per E-Mail.</p>" +
        '<a class="btn btn-primary" target="_blank" rel="noopener" href="https://ferienwohnung-in-worpswede.de/de/alle-objekte?utm_source=funnel&utm_medium=landingpage&utm_campaign=direktbuchung-rabatt">Wohnung aussuchen</a>' +
        "</div>";
    });
  });
})();
