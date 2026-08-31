/* Dezinsect Corse — comportements globaux partagés (menu mobile, retour en haut) */
(function () {
  "use strict";

  // --- Sous-menus de la nav de bureau : refleter l'etat reel ---
  // L'ouverture est faite en CSS (:hover et :focus-within). Le bouton
  // declare aria-haspopup et aria-expanded ; sans ce qui suit, l'attribut
  // resterait a "false" en permanence et annoncerait un menu replie alors
  // qu'il est ouvert.
  var parents = document.querySelectorAll(".site-nav__has-submenu");
  Array.prototype.forEach.call(parents, function (li) {
    var bouton = li.querySelector(".site-nav__toplink");
    if (!bouton) return;
    var dire = function (ouvert) {
      bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
    };
    li.addEventListener("mouseenter", function () { dire(true); });
    li.addEventListener("mouseleave", function () {
      if (!li.contains(document.activeElement)) dire(false);
    });
    li.addEventListener("focusin", function () { dire(true); });
    li.addEventListener("focusout", function () {
      // focusout part avant que le focus n'arrive : on laisse le navigateur
      // le poser, puis on regarde ou il est reellement.
      window.setTimeout(function () {
        if (!li.contains(document.activeElement) && !li.matches(":hover")) dire(false);
      }, 0);
    });
  });

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
      if (window.innerWidth >= 1200 && mobileMenu.classList.contains("is-open")) {
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

  // --- Carte Google chargee au clic (contact, zones-dintervention) ---
  // L iframe n est creee qu apres action de l utilisateur : pas de requete
  // vers Google tant qu il ne l a pas demandee. Le forEach ne fait rien sur
  // les pages sans bouton, aucune garde n est necessaire.
  document.querySelectorAll("[data-map-load]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.google.com/maps?q=Dezinsect+Corse,+20221+Santa-Maria-Poggio&output=embed";
      f.loading = "lazy";
      f.title = "Localisation de Dezinsect Corse";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.allowFullscreen = true;
      btn.parentNode.replaceChild(f, btn);
    });
  });

  // --- Formulaire de devis (contact, index) ---
  // Envoi en arriere-plan vers Web3Forms, puis redirection vers la page de
  // remerciement. Le chemin est relatif : un chemin absolu casserait sous le
  // sous-chemin de la preversion. Voir regle 7 d AGENTS.md.
  var form = document.getElementById("dezinsectContactForm");
  if (form) {
    var errorBox = document.getElementById("formError");
    var submitBtn = document.getElementById("submitBtn");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi en cours...";
      if (errorBox) errorBox.style.display = "none";

      var payload = {};
      new FormData(form).forEach(function (v, k) { payload[k] = v; });

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (result) {
          if (!result.success) throw new Error(result.message || "Erreur inconnue");
          window.location.href = "merci";
        })
        .catch(function () {
          if (errorBox) errorBox.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Envoyer ma demande";
        });
    });
  }
})();
