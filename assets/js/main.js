/* Dezinsect Corse — comportements globaux partagés (menu mobile, retour en haut) */
(function () {
  "use strict";

  // --- Menu mobile ---
  var burger = document.getElementById("burgerBtn");
  var mobileMenu = document.getElementById("mobileMenu");

  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Ferme le menu mobile si on repasse en desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && mobileMenu.classList.contains("is-open")) {
        mobileMenu.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });

    // Ferme le menu au clic sur un lien
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  // --- Bouton retour en haut ---
  var backToTop = document.createElement("button");
  backToTop.className = "back-to-top";
  backToTop.setAttribute("aria-label", "Retour en haut de page");
  backToTop.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(backToTop);

  window.addEventListener("scroll", function () {
    backToTop.classList.toggle("is-visible", window.scrollY > 500);
  });
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // --- Barre d'appel flottante (mobile) ---
  var callBar = document.createElement("div");
  callBar.className = "mobile-call-bar";
  callBar.innerHTML =
    '<a href="tel:+33685753040">' +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" fill="white"/></svg>' +
    '<span>Appeler le 06 85 75 30 40</span></a>';
  document.body.appendChild(callBar);

  // --- Apparition douce des cartes au scroll ---
  var revealSelectors = [
    ".service-card", ".feature-card", ".method-card", ".faq-card",
    ".zone-card", ".species-card", ".derat-card", ".photo-gallery figure"
  ];
  var revealTargets = document.querySelectorAll(revealSelectors.join(","));

  if (revealTargets.length && "IntersectionObserver" in window) {
    revealTargets.forEach(function (el) { el.classList.add("reveal-on-scroll"); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealTargets.forEach(function (el) { io.observe(el); });
  }
})();
