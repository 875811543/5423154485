/* Dezinsect Corse — comportements globaux partagés (menu mobile, retour en haut) */
(function () {
  "use strict";
  var communeBloquante = null;

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
  // La CSS force scroll-behavior a auto sous prefers-reduced-motion, mais un
  // behavior passe a scrollTo court-circuite la propriete : il faut relire la
  // preference ici. Lue au clic, pour suivre un changement de reglage en cours
  // de visite.
  backToTop.addEventListener("click", function () {
    var mouvementReduit = window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: mouvementReduit ? "auto" : "smooth" });
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

      // Commune non confirmee : on n'envoie pas. La fonction est posee par le
      // bloc « recherche de commune » plus bas ; elle vaut true tant que le
      // visiteur n'a pas clique sur « Confirmer cette commune ». Si le fichier
      // des communes n'a pas pu etre charge, elle rend false et laisse passer :
      // un incident reseau ne doit pas empecher une demande d'arriver.
      if (typeof communeBloquante === "function" && communeBloquante()) return;

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

  // --- Onglets du lexique ---
  // Le HTML livre les quatre familles les unes sous les autres. Sans ce bloc,
  // la page reste exactement celle-la : rien n'est masque en CSS, donc un
  // visiteur sans JavaScript — et un moteur qui n'execute rien — voit tout le
  // contenu. Les onglets sont un enrichissement, jamais une condition d'acces.
  //
  // Chaque panneau est bati a partir d'un couple h2.section-heading + .lex-grid
  // deja present. L'etiquette courte vient de data-onglet : « Insectes
  // xylophages & champignons du bois » ne tient pas sur un onglet.
  var titresLex = document.querySelectorAll(".lex-grid");
  if (titresLex.length > 1) {
    var familles = [];
    Array.prototype.forEach.call(document.querySelectorAll("h2.section-heading"), function (h2) {
      var grille = h2.nextElementSibling;
      while (grille && grille.className.indexOf("lex-grid") === -1) grille = grille.nextElementSibling;
      if (grille) familles.push({ titre: h2, grille: grille });
    });

    if (familles.length > 1) {
      var liste = document.createElement("div");
      liste.className = "lex-tabs";
      liste.setAttribute("role", "tablist");
      liste.setAttribute("aria-label", "Familles de nuisibles");
      familles[0].titre.parentNode.insertBefore(liste, familles[0].titre);

      var onglets = [];

      var activer = function (index, donnerLeFocus) {
        familles.forEach(function (f, i) {
          var actif = i === index;
          // Le titre reste dans le document : il porte le nom complet de la
          // famille, que l'onglet abrege.
          f.titre.hidden = !actif;
          f.grille.hidden = !actif;
          onglets[i].setAttribute("aria-selected", actif ? "true" : "false");
          onglets[i].setAttribute("tabindex", actif ? "0" : "-1");
          onglets[i].className = actif ? "lex-tabs__btn is-active" : "lex-tabs__btn";
        });
        if (donnerLeFocus) onglets[index].focus();
      };

      familles.forEach(function (f, i) {
        var id = "lex-panneau-" + (i + 1);
        f.grille.id = id;
        f.grille.setAttribute("role", "tabpanel");

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lex-tabs__btn";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-controls", id);
        btn.id = "lex-onglet-" + (i + 1);
        btn.textContent = f.titre.getAttribute("data-onglet") || f.titre.textContent;
        f.grille.setAttribute("aria-labelledby", btn.id);

        btn.addEventListener("click", function () { activer(i, false); });
        btn.addEventListener("keydown", function (e) {
          var k = e.key;
          var suivant = k === "ArrowRight" ? i + 1
            : k === "ArrowLeft" ? i - 1
            : k === "Home" ? 0
            : k === "End" ? familles.length - 1 : null;
          if (suivant === null) return;
          e.preventDefault();
          activer((suivant + familles.length) % familles.length, true);
        });

        onglets.push(btn);
        liste.appendChild(btn);
      });

      activer(0, false);
    }
  }
  // --- Recherche de commune dans le formulaire de devis ---
  //
  // Deux temps, demandes par le proprietaire :
  //   1. CONSULTATION — le visiteur tape, voit sa commune, son secteur et si
  //      elle est desservie. Rien n'est enregistre a ce stade, pas meme s'il
  //      clique sur une suggestion.
  //   2. VALIDATION  — il clique sur « Confirmer cette commune ». Alors
  //      seulement les quatre champs caches sont remplis.
  //
  // « Modifier » efface la validation et remet le champ en consultation.
  //
  // Le fichier des communes est charge a la premiere frappe, pas au chargement
  // de la page : 22 Ko que ne telecharge jamais un visiteur qui ne remplit pas
  // le formulaire. S'il echoue, le champ le dit et cesse de bloquer l'envoi.
  var widgetCommune = document.getElementById("commune-widget");
  if (widgetCommune) {
    var champCommune = document.getElementById("commune-recherche");
    var listeCommune = document.getElementById("commune-suggestions");
    var ficheCommune = document.getElementById("commune-fiche");
    var cacheCommune = null;
    var demandeCommune = null;
    var degradeCommune = false;
    var consultee = null;
    var surligne = -1;

    var champCache = function (nom) {
      return widgetCommune.querySelector('input[name="' + nom + '"]');
    };

    // Minuscules, sans accents, apostrophes et tirets ramenes a l'espace :
    // « L'Île-Rousse », « l ile rousse » et « ILE ROUSSE » se rejoignent.
    var normaliser = function (t) {
      return String(t).toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/['\u2019`]/g, " ")
        .replace(/[-\u2013\u2014]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    // « L'Île-Rousse » doit aussi repondre a « ile rousse » : on essaie le nom
    // entier, puis le nom prive de son article initial.
    var variantes = function (n) {
      var sans = n.replace(/^(l|la|le|les|d|de|du|des) /, "");
      return sans === n ? [n] : [n, sans];
    };

    var charger = function () {
      if (demandeCommune) return demandeCommune;
      demandeCommune = fetch(widgetCommune.getAttribute("data-source"))
        .then(function (r) { return r.json(); })
        .then(function (d) { cacheCommune = d.communes; return cacheCommune; })
        .catch(function () {
          degradeCommune = true;
          message("La recherche de commune est momentanement indisponible. Indiquez-la dans le champ adresse ci-dessous.");
          return [];
        });
      return demandeCommune;
    };

    var message = function (texte) {
      var p = widgetCommune.querySelector(".commune-erreur");
      if (!texte) { if (p) p.parentNode.removeChild(p); return; }
      if (!p) {
        p = document.createElement("p");
        p.className = "commune-erreur";
        widgetCommune.appendChild(p);
      }
      p.textContent = texte;
    };

    var chercher = function (q) {
      if (!cacheCommune) return [];
      var n = normaliser(q);
      if (n.length < 2) return [];
      var chiffres = /^[0-9]+$/.test(n);
      var debuts = [], dedans = [];
      for (var i = 0; i < cacheCommune.length; i++) {
        var c = cacheCommune[i];
        if (chiffres) {
          for (var j = 0; j < c.cp.length; j++) {
            if (c.cp[j].indexOf(n) === 0) { debuts.push(c); break; }
          }
          continue;
        }
        var v = variantes(normaliser(c.n)), place = -1;
        for (var k = 0; k < v.length; k++) {
          var p = v[k].indexOf(n);
          if (p === 0) { place = 0; break; }
          if (p > 0 && place !== 0) place = 1;
        }
        if (place === 0) debuts.push(c);
        else if (place === 1) dedans.push(c);
      }
      return debuts.concat(dedans).slice(0, 8);
    };

    var fermerListe = function () {
      listeCommune.hidden = true;
      listeCommune.innerHTML = "";
      champCommune.setAttribute("aria-expanded", "false");
      champCommune.removeAttribute("aria-activedescendant");
      surligne = -1;
    };

    var surlignerOption = function (i) {
      var options = listeCommune.children;
      for (var k = 0; k < options.length; k++)
        options[k].setAttribute("aria-selected", k === i ? "true" : "false");
      surligne = i;
      if (i >= 0) champCommune.setAttribute("aria-activedescendant", options[i].id);
      else champCommune.removeAttribute("aria-activedescendant");
    };

    var afficherListe = function (resultats) {
      listeCommune.innerHTML = "";
      if (!resultats.length) { fermerListe(); return; }
      resultats.forEach(function (c, i) {
        var li = document.createElement("li");
        li.id = "commune-option-" + i;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", "false");
        var nom = document.createElement("span");
        nom.textContent = c.n + (c.r ? " (" + c.r + ")" : "");
        var sect = document.createElement("span");
        sect.className = "commune-secteur";
        sect.textContent = c.d ? c.s : "hors zone";
        li.appendChild(nom);
        li.appendChild(sect);
        li.addEventListener("mousedown", function (e) {
          e.preventDefault();   // garde le focus dans le champ
          consulter(c);
        });
        listeCommune.appendChild(li);
      });
      listeCommune.hidden = false;
      champCommune.setAttribute("aria-expanded", "true");
      surlignerOption(-1);
    };

    var coche = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    var alerte = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';

    // Etape 1 : on montre, on n'enregistre pas.
    var consulter = function (c) {
      consultee = c;
      champCommune.value = c.n;
      fermerListe();
      message("");
      ficheCommune.className = "commune-fiche " + (c.d ? "commune-fiche--desservie" : "commune-fiche--hors-zone");
      ficheCommune.innerHTML =
        '<p class="commune-statut">' + (c.d ? coche + "Commune desservie" : alerte + "Commune hors de notre zone") + "</p>"
        + '<p class="commune-nom"></p>'
        + '<p class="commune-detail"></p>'
        + '<div class="commune-actions"><button type="button" class="commune-btn btn-devis" data-action="confirmer">Confirmer cette commune</button></div>';
      ficheCommune.querySelector(".commune-nom").textContent = c.n;
      ficheCommune.querySelector(".commune-detail").textContent = c.r
        ? "Secteur : " + c.s + " — rattaché à " + c.r
        : (c.d ? "Secteur : " + c.s : "Secteur : " + c.s + " — nous n'intervenons pas sur ce secteur.");
      ficheCommune.hidden = false;
    };

    // Etape 2 : le visiteur a confirme. C'est ici, et seulement ici, que les
    // champs caches sont remplis.
    var confirmer = function () {
      if (!consultee) return;
      var c = consultee;
      champCache("commune_selectionnee").value = c.r ? c.r : c.n;
      champCache("secteur").value = c.s;
      champCache("commune_desservie").value = c.d ? "oui" : "non";
      champCache("commune_validee").value = "oui";
      champCommune.readOnly = true;
      champCommune.setAttribute("aria-expanded", "false");
      ficheCommune.className = "commune-fiche commune-fiche--validee";
      ficheCommune.innerHTML =
        '<p class="commune-statut">' + coche + "Commune confirmée</p>"
        + '<p class="commune-nom"></p>'
        + '<p class="commune-detail"></p>'
        + '<p class="commune-detail">Votre commune est bien enregistrée pour votre demande.</p>'
        + '<div class="commune-actions"><button type="button" class="commune-btn commune-btn--secondaire" data-action="modifier">Modifier</button></div>';
      ficheCommune.querySelector(".commune-nom").textContent = c.n;
      ficheCommune.querySelectorAll(".commune-detail")[0].textContent = c.d
        ? c.s : c.s + " — hors de notre zone d'intervention";
      message("");
    };

    var modifier = function () {
      champCache("commune_selectionnee").value = "";
      champCache("secteur").value = "";
      champCache("commune_desservie").value = "";
      champCache("commune_validee").value = "non";
      consultee = null;
      champCommune.readOnly = false;
      champCommune.value = "";
      ficheCommune.hidden = true;
      ficheCommune.innerHTML = "";
      message("");
      champCommune.focus();
    };

    ficheCommune.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-action]") : null;
      if (!btn) return;
      if (btn.getAttribute("data-action") === "confirmer") confirmer();
      else if (btn.getAttribute("data-action") === "modifier") modifier();
    });

    champCommune.addEventListener("input", function () {
      if (champCommune.readOnly) return;
      var q = champCommune.value;
      charger().then(function () { afficherListe(chercher(q)); });
    });

    champCommune.addEventListener("keydown", function (e) {
      if (listeCommune.hidden) return;
      var n = listeCommune.children.length;
      if (e.key === "ArrowDown") { e.preventDefault(); surlignerOption((surligne + 1) % n); }
      else if (e.key === "ArrowUp") { e.preventDefault(); surlignerOption((surligne - 1 + n) % n); }
      else if (e.key === "Enter" && surligne >= 0) {
        e.preventDefault();
        consulter(chercher(champCommune.value)[surligne]);
      } else if (e.key === "Escape") fermerListe();
    });

    champCommune.addEventListener("blur", function () {
      window.setTimeout(fermerListe, 120);
    });

    // Lue par le gestionnaire d'envoi, plus haut dans ce fichier.
    communeBloquante = function () {
      if (degradeCommune) return false;
      if (champCache("commune_validee").value === "oui") return false;
      message(consultee
        ? "Veuillez confirmer votre commune d'intervention en cliquant sur « Confirmer cette commune »."
        : "Veuillez indiquer puis confirmer votre commune d'intervention.");
      champCommune.focus();
      return true;
    };
  }

})();
