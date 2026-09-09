/* =============================================================
   Deluxe Locksmith — main.js
   Classic script, IIFE, no modules, no build step.
   Everything here ENRICHES hardcoded HTML. With JS off the whole
   site still reads and every phone number still works.
   ============================================================= */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  /* ---------------------------------------------------------------
     safe() — one broken init must never take down the rest of the page
     --------------------------------------------------------------- */
  function safe(name, fn) {
    try { fn(); }
    catch (err) { if (window.console && console.warn) console.warn("[init:" + name + "]", err); }
  }

  var BRAND = window.__BRAND__ || {};

  // The client's private inbox is assembled at runtime rather than written as a
  // literal. It used to sit in this file in plain text, which put an address
  // that must never be published on every page of the site - main.js is served
  // to everyone and is trivially scraped for anything matching an email.
  //
  // This defeats automated harvesting, which is regex-based. It is NOT secrecy:
  // anyone reading this code can reassemble it. The real fix is FormSubmit's
  // hashed endpoint, which hides the address entirely - it needs one activation
  // click from the mailbox owner, and then the hash replaces all of this.
  var FORM_ENDPOINT = "https://formsubmit.co/ajax/" +
    ["locksmithjobs", "01", "@", "gmail", ".", "com"].join("");

  /* =============================================================
     1. Mobile menu
     ============================================================= */
  function initMobileMenu() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("mobile-menu");
    if (!toggle || !menu) return;

    // The lock has to go on <html> as well as <body>. iOS Safari ignores
    // overflow:hidden on body alone, which let the page keep scrolling behind
    // the open menu.
    function setLock(on) {
      document.documentElement.classList.toggle("menu-open", on);
      document.body.classList.toggle("menu-open", on);
    }

    function close() {
      if (!menu.classList.contains("is-open")) return;
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      setLock(false);
      menu.scrollTop = 0;
    }

    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      setLock(open);
      if (open) menu.scrollTop = 0;
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    // A resize past the desktop breakpoint must not leave the page locked
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) close();
    });

    // Back/forward cache: a page restored with the menu open would come back
    // scroll-locked with no way out.
    window.addEventListener("pageshow", function () { close(); });
  }

  /* =============================================================
     2. Reveals — BULLETPROOF
     IntersectionObserver alone is not enough: some in-app browsers and
     programmatic scrolls fire neither IO nor scroll events, which leaves
     content stuck at opacity:0. So: IO + scroll + touchmove + a short
     poll + an absolute safety timeout that reveals everything.
     ============================================================= */
  function initReveals() {
    var els = [].slice.call(document.querySelectorAll("[data-reveal]"));
    if (!els.length) return;

    function show(el) { el.classList.add("is-in"); }
    function showAll() { els.forEach(show); }

    // Reveals whatever is genuinely on screen right now, and nothing else.
    // This is the safety net AND the fallback, because the only thing that can
    // actually harm a visitor is content they are looking at staying invisible.
    // Content further down is not in danger - it simply has not been reached.
    function revealVisible() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach(function (el) {
        if (el.classList.contains("is-in")) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) show(el);
      });
    }

    // REGISTERED BEFORE ANY OTHER WORK, and that ordering is the whole point.
    // safe() swallows exceptions, so anything that throws further down would
    // otherwise leave every reveal element at opacity:0 forever with only a
    // console warning. An earlier version put this after the stagger loop and
    // claimed in a comment to be first; it was not.
    //
    // Note also what this is NOT: a blanket timer. A previous version called
    // showAll() on a short timer, and since no reveal element on this site sits
    // above the fold, it fired before the visitor had scrolled and revealed the
    // entire page at once - which is exactly why the animations appeared not to
    // work. This only ever rescues what is actually in view.
    var netTimer = setInterval(revealVisible, 1500);
    setTimeout(function () { clearInterval(netTimer); }, 30000);

    // Stagger: elements sharing a [data-reveal-group] arrive one after another
    // rather than all at once. The delay is written as a CSS custom property so
    // the timing curve stays in the stylesheet.
    //
    // Capped at 6 steps on purpose. A 30-item service list staggered linearly
    // would leave the last item waiting nearly a second after it is already on
    // screen, which reads as lag rather than polish.
    //
    // Wrapped independently: a failure to compute delays must degrade to
    // "everything arrives together", never to "nothing is ever visible".
    try {
      var STEP = 70, MAX_STEPS = 6;
      var groups = {};
      els.forEach(function (el) {
        var g = el.getAttribute("data-reveal-group");
        if (!g) return;
        groups[g] = groups[g] || 0;
        var i = groups[g]++;
        el.style.setProperty("--reveal-delay", (Math.min(i, MAX_STEPS) * STEP) + "ms");
      });
    } catch (e) {
      if (window.console && console.warn) console.warn("[reveals:stagger]", e);
    }

    // True last resort, far beyond any normal reading pace: if the page has
    // been open this long and something is still hidden while on screen,
    // reveal everything rather than risk a blank page.
    setTimeout(function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var strandedOnScreen = els.some(function (el) {
        if (el.classList.contains("is-in")) return false;
        var r = el.getBoundingClientRect();
        return r.top < vh && r.bottom > 0;
      });
      if (strandedOnScreen) showAll();
    }, 30000);

    if (!("IntersectionObserver" in window)) { showAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.03, rootMargin: "0px 0px -40px 0px" });

    els.forEach(function (el) { io.observe(el); });

    // Manual sweep for the environments IO quietly fails in
    function sweep() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var pending = 0;
      els.forEach(function (el) {
        if (el.classList.contains("is-in")) return;
        pending++;
        var r = el.getBoundingClientRect();
        // Only ever reveals what is actually on screen - never runs ahead of
        // the visitor and pre-reveals the page below them.
        if (r.top < vh - 30 && r.bottom > 0) show(el);
      });
      return pending;
    }

    // The first sweep used to run here, synchronously. At that moment the
    // stylesheet and images have not finished settling, so the whole document
    // is still collapsed near the top - every element passes the "is it on
    // screen" test and the entire page reveals at once. That is why the site
    // looked static: nothing was left to animate by the time you scrolled.
    //
    // The observer is accurate from the start, so it leads. The sweep only
    // rescues environments where the observer is broken, and it waits for
    // layout before forming an opinion about what is on screen.
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("touchmove", sweep, { passive: true });
    window.addEventListener("resize", sweep, { passive: true });

    function firstSweep() {
      requestAnimationFrame(function () { setTimeout(sweep, 250); });
    }
    if (document.readyState === "complete") firstSweep();
    else window.addEventListener("load", firstSweep);

    // Poll as a long-tail fallback, well after layout is stable.
    var ticks = 0;
    setTimeout(function () {
      var timer = setInterval(function () {
        ticks++;
        if (sweep() === 0 || ticks > 20) clearInterval(timer);
      }, 500);
    }, 1200);
  }

  /* =============================================================
     2b. Number counters
     Any [data-count="38"] ticks 0 -> 38 the first time it is scrolled into
     view. The final value is written into the HTML by the generator, so a
     visitor with JS off, or one who never scrolls it into view, still reads
     the correct number — the animation only ever replaces a value that is
     already correct.
     ============================================================= */
  function initCounters() {
    var els = [].slice.call(document.querySelectorAll("[data-count]"));
    if (!els.length) return;

    var reduced = window.matchMedia &&
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function run(el) {
      if (el.getAttribute("data-counted")) return;
      el.setAttribute("data-counted", "1");

      var target = parseFloat(el.getAttribute("data-count"));
      if (isNaN(target)) return;

      // Anything the generator put around the number - a "+", a "," - is kept.
      var raw = el.textContent.trim();
      var suffix = raw.replace(/[\d.,\s]/g, "");

      if (reduced) return;   // value already in the HTML; leave it alone

      var DURATION = 1100;
      var start = null;
      var done = false;

      function finish() {
        if (done) return;
        done = true;
        el.textContent = target.toLocaleString() + suffix;
      }

      // A background or non-compositing tab never runs rAF. Without this the
      // first frame would write "0" and nothing would ever advance it, leaving
      // a permanent zero where a real number belongs. The DOM already holds the
      // correct value, so we only overwrite it once the animation is genuinely
      // running, and we snap to the target if it stalls.
      var bail = setTimeout(finish, DURATION + 900);

      function frame(ts) {
        if (done) return;
        if (start === null) start = ts;
        var p = Math.min((ts - start) / DURATION, 1);
        // easeOutCubic: fast at first, settling gently onto the final number
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (p < 1) { requestAnimationFrame(frame); }
        else { clearTimeout(bail); finish(); }
      }
      requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });

    els.forEach(function (el) { io.observe(el); });

    // Same belt-and-braces as the reveals, and the same correction: a blanket
    // timer used to run every counter at 8s whether or not it had been reached,
    // so a visitor who took longer than that to scroll found the numbers
    // already final and never saw them count. This only ever runs a counter
    // that is genuinely on screen.
    var t = setInterval(function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach(function (el) {
        if (el.getAttribute("data-counted")) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) run(el);
      });
    }, 1500);
    setTimeout(function () { clearInterval(t); }, 30000);
  }

  /* =============================================================
     3. Header scroll state
     ============================================================= */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* =============================================================
     4. Request-service wizard
     Client rule: NO prices and NO exact arrival times. This collects
     what the job is and how to reach the customer — nothing else.
     ============================================================= */
  var WIZARD = {
    automotive: {
      label: "Automotive",
      options: ["Locked out of my vehicle", "Lost all my car keys", "Key fob not working",
                "Key broken or stuck in the ignition", "Ignition problem", "Need a spare key made"]
    },
    residential: {
      label: "Residential",
      options: ["Locked out of my home", "Need my locks rekeyed", "Lock is broken or sticking",
                "Want new or upgraded locks", "Smart lock installation", "Mailbox lock"]
    },
    commercial: {
      label: "Commercial",
      options: ["Locked out of my business", "Storefront door problem", "Master key system",
                "Panic bar or exit device", "Rekey after staff change", "Keyless entry / access control"]
    },
    emergency: {
      label: "Emergency",
      options: ["Car lockout", "House lockout", "Business lockout",
                "Key broken in the lock", "Lost all keys", "Safe will not open"]
    }
  };

  function initWizard() {
    var form = document.getElementById("request-form");
    if (!form) return;

    var stepEls = [].slice.call(form.querySelectorAll(".fstep"));
    var bars = [].slice.call(form.querySelectorAll(".form-steps li"));
    var statusEl = form.querySelector(".form-status");
    var current = 0;
    var answers = { category: "", situation: "" };

    function paint() {
      stepEls.forEach(function (el, i) { el.classList.toggle("is-active", i === current); });
      bars.forEach(function (b, i) {
        b.classList.toggle("is-active", i === current);
        b.classList.toggle("is-done", i < current);
      });
    }

    function go(i) {
      current = Math.max(0, Math.min(stepEls.length - 1, i));
      paint();
      var head = form.querySelector(".fstep.is-active h3");
      if (head && current > 0) head.setAttribute("tabindex", "-1"), head.focus({ preventScroll: true });
    }

    // Step 1 — category
    form.querySelectorAll("[data-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        answers.category = btn.getAttribute("data-cat");
        form.querySelectorAll("[data-cat]").forEach(function (b) { b.classList.remove("is-selected"); });
        btn.classList.add("is-selected");
        buildSituations(answers.category);
        go(1);
      });
    });

    // Step 2 — situation (built from the chosen category)
    var sitWrap = form.querySelector("#situation-options");
    function buildSituations(cat) {
      if (!sitWrap) return;
      var conf = WIZARD[cat] || WIZARD.emergency;
      sitWrap.innerHTML = "";
      conf.options.forEach(function (text, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "opt";
        b.innerHTML = '<span class="opt-num">' + String(i + 1).padStart(2, "0") + '</span><span>' + text + '</span>';
        b.addEventListener("click", function () {
          answers.situation = text;
          sitWrap.querySelectorAll(".opt").forEach(function (o) { o.classList.remove("is-selected"); });
          b.classList.add("is-selected");
          go(2);
        });
        sitWrap.appendChild(b);
      });
    }

    // Back buttons
    form.querySelectorAll("[data-back]").forEach(function (b) {
      b.addEventListener("click", function () { go(current - 1); });
    });

    // Validation + submit
    function fieldError(input, msg) {
      var field = input.closest(".field");
      if (!field) return;
      field.classList.add("has-error");
      var err = field.querySelector(".err");
      if (err) err.textContent = msg;
    }
    function clearErrors() {
      form.querySelectorAll(".field.has-error").forEach(function (f) { f.classList.remove("has-error"); });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors();

      var name = form.querySelector("#f-name");
      var phone = form.querySelector("#f-phone");
      var ok = true;

      if (!name.value.trim()) { fieldError(name, "Please tell us your name."); ok = false; }
      var digits = (phone.value || "").replace(/\D/g, "");
      if (digits.length < 10) { fieldError(phone, "Please enter a phone number we can call back on."); ok = false; }
      if (!ok) return;

      var btn = form.querySelector("[data-submit]");
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      if (statusEl) { statusEl.className = "form-status"; statusEl.textContent = ""; }

      var payload = {
        _subject: "New service request — " + (WIZARD[answers.category] ? WIZARD[answers.category].label : "Website"),
        Category: WIZARD[answers.category] ? WIZARD[answers.category].label : "",
        Situation: answers.situation || "",
        Name: name.value.trim(),
        Phone: phone.value.trim(),
        Location: (form.querySelector("#f-location") || {}).value || "",
        Details: (form.querySelector("#f-details") || {}).value || "",
        Page: window.location.href
      };

      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function () { go(3); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = "Send request"; }
          if (statusEl) {
            statusEl.className = "form-status is-error";
            statusEl.textContent = "We could not send that. Please call us at " + (BRAND.phone || "") + " instead.";
          }
        });
    });

    paint();
  }

  /* =============================================================
     5. Current-year stamp in the footer
     ============================================================= */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* =============================================================
     6. Mark the active nav item
     ============================================================= */
  function initActiveNav() {
    var path = window.location.pathname.replace(/\/index\.html$/, "/");
    document.querySelectorAll(".nav a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || href.indexOf("tel:") === 0) return;
      if (href !== "/" && path.indexOf(href) === 0) a.setAttribute("aria-current", "page");
      else if (href === "/" && path === "/") a.setAttribute("aria-current", "page");
    });
  }

  /* =============================================================
     Boot
     ============================================================= */
  function boot() {
    safe("header", initHeader);
    safe("mobileMenu", initMobileMenu);
    safe("reveals", initReveals);
    safe("counters", initCounters);
    safe("wizard", initWizard);
    safe("year", initYear);
    safe("activeNav", initActiveNav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
