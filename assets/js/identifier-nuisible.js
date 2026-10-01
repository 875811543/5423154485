/* ==========================================================================
   Outil d'identification des nuisibles — assets/js/identifier-nuisible.js

   SECOND fichier JS du depot, et la seule exception a la regle « main.js est
   le seul fichier JS ». Raison : l'arbre de decision ne sert qu'a cette page,
   et le charger sur les 66 autres serait payer un poids inutile a chaque
   visite. L'exception est inscrite dans AGENTS.md.

   Il ne porte QUE l'arbre de decision. Les 41 fiches vivent dans le HTML,
   en <details>, pour trois raisons :
     - sans JavaScript, tout le contenu reste lisible et indexable ;
     - le contenu n'existe qu'une fois, donc rien a resynchroniser ;
     - le controle « doublons » compare les pages entre elles : dupliquer les
       fiches ici et la l'exposerait sans raison.

   Style impose par le depot : IIFE, "use strict", ES5 (var, function), aucune
   dependance, garde d'existence avant chaque addEventListener.
   ========================================================================== */
(function () {
  "use strict";

  var racine = document.getElementById("outil-ident");
  if (!racine) { return; }

  /* ------------------------------------------------------------------
     1. L'arbre de decision
     Chaque noeud : { q: question, aide: precision facultative,
                      opts: [ { t: libelle, d: detail, n: noeud suivant }
                            | { t: libelle, d: detail, f: id de fiche } ] }
     « f » termine le parcours, « n » l'enchaine.
     ------------------------------------------------------------------ */
  var ARBRE = {

    /* ---------- CA VOLE ---------- */
    vole: {
      q: "Comment se présente l’insecte volant ?",
      opts: [
        { t: "Rayé, ou il pique", d: "guêpe, frelon, abeille", n: "vole-raye" },
        { t: "Petit, fin, pattes longues", d: "il pique et bourdonne", n: "vole-moustique" },
        { t: "Une mouche", d: "corps trapu, vol rapide", f: "mouche-domestique" },
        { t: "Beaucoup de petits insectes ailés, sortis d’un coup", d: "souvent au printemps, près d’une fenêtre", n: "vole-essaimage" },
        { t: "Un petit papillon dans les placards", d: "ou dans une penderie", f: "mites" },
        { t: "Petit coléoptère rond de 2 à 3,5 mm, marbré blanc, brun et jaune", d: "sur les rebords de fenêtre ou les fleurs au printemps", f: "anthrene" }
      ]
    },
    "vole-raye": {
      q: "Quelle est sa couleur ?",
      aide: "Regardez le corps et les pattes, à distance.",
      opts: [
        { t: "Corps noir velouté, bande orange, pattes jaunes", d: "", f: "frelon-asiatique" },
        { t: "Brun-roux, bande jaune vif sur l’abdomen, pattes non jaunes", d: "", f: "frelon-oriental" },
        { t: "Gros, 2,5 à 3,5 cm, brun-roux et jaune, tête jaune", d: "", f: "frelon-europeen" },
        { t: "Jaune vif et noir, taille fine, 1 à 2 cm", d: "", f: "guepe" },
        { t: "Brun doré, poilu", d: "", f: "abeille-domestique" },
        { t: "Gros, noir à reflets bleus, bourdonne fort", d: "", f: "xylocope" }
      ]
    },
    "vole-moustique": {
      q: "Quand pique-t-il, et de quelle couleur est-il ?",
      opts: [
        { t: "Noir rayé de blanc, il pique le jour", d: "", f: "moustique-tigre" },
        { t: "Brun, il pique la nuit", d: "", f: "moustique-commun" }
      ]
    },
    "vole-essaimage": {
      q: "Regardez les ailes et les antennes",
      aide: "Un insecte posé, ou une aile tombée sur le rebord, suffit.",
      opts: [
        { t: "4 ailes identiques, antennes droites, corps sans étranglement", d: "", f: "termite-aile" },
        { t: "Ailes inégales, antennes coudées, taille fine", d: "", f: "fourmi-ailee" }
      ]
    },

    /* ---------- CA RAMPE ---------- */
    rampe: {
      q: "À quoi ressemble-t-il ?",
      opts: [
        { t: "Brun luisant, plat, rapide, il fuit la lumière", d: "", n: "rampe-blatte" },
        { t: "Des fourmis en colonnes", d: "", n: "rampe-fourmi" },
        { t: "Petit, blanc-crème, mou, dans le bois ou des galeries de terre", d: "", f: "termite-ouvrier" },
        { t: "4 à 7 mm, plat, brun-rouge, dans le lit", d: "avec de petites taches noires sur le matelas", f: "punaise-de-lit" },
        { t: "Minuscule, il saute, un chien ou un chat à la maison", d: "", f: "puce" },
        { t: "Argenté, fuselé, dans la salle de bain", d: "", f: "poisson-d-argent" },
        { t: "Des chenilles en file indienne", d: "nids de soie blanche dans les pins", f: "processionnaire" },
        { t: "Beaucoup de pattes", d: "", n: "rampe-pattes" },
        { t: "Une araignée", d: "", n: "rampe-araignee" },
        { t: "Petite larve brune très poilue, en bandes, 4 à 5 mm", d: "sous les tapis, dans les placards ou les penderies, petites peaux de mue vides", f: "anthrene" }
      ]
    },
    "rampe-blatte": {
      q: "Quelle taille et quelle couleur ?",
      opts: [
        { t: "1 à 1,5 cm, brun clair, deux bandes sur le thorax", d: "", f: "blatte-germanique" },
        { t: "2 à 3 cm, noire", d: "", f: "blatte-orientale" },
        { t: "3 à 4 cm, rousse", d: "", f: "blatte-americaine" }
      ]
    },
    "rampe-fourmi": {
      q: "Comment se présentent les colonnes ?",
      opts: [
        { t: "Petites, brun clair, colonnes immenses", d: "très répandue sur la côte", f: "fourmi-argentine" },
        { t: "Autres fourmis", d: "", f: "autres-fourmis" }
      ]
    },
    "rampe-pattes": {
      q: "Quelle allure ?",
      opts: [
        { t: "Longues pattes fines, très rapide", d: "", f: "scutigere" },
        { t: "Corps plat segmenté, 5 à 15 cm", d: "", f: "scolopendre" }
      ]
    },
    "rampe-araignee": {
      q: "Présente-t-elle des marques rouges ?",
      opts: [
        { t: "Non, araignée ordinaire", d: "", f: "araignee" },
        { t: "Noire, avec 13 taches rouges", d: "", f: "malmignatte" }
      ]
    },

    /* ---------- RONGEUR OU TRACES ---------- */
    rongeur: {
      q: "Qu’avez-vous trouvé ?",
      aide: "La forme et la taille des crottes sont le critère le plus sûr.",
      opts: [
        { t: "Crottes de 1 à 2 cm, en fuseau pointu", d: "combles et greniers, traces en hauteur", f: "rat-noir" },
        { t: "Crottes d’environ 2 cm, à bout arrondi", d: "sous-sol, caves, égouts", f: "surmulot" },
        { t: "Crottes de 3 à 6 mm, en grain de riz", d: "", f: "souris" },
        { t: "Des bruits la nuit dans les combles, une queue touffue grise", d: "", f: "loir" }
      ]
    },

    /* ---------- DEGATS SUR LE BOIS ---------- */
    bois: {
      q: "Voyez-vous des trous à la surface du bois ?",
      opts: [
        { t: "Oui, il y a des trous", d: "", n: "bois-trous" },
        { t: "Non, aucun trou visible", d: "", n: "bois-sans-trou" }
      ]
    },
    "bois-trous": {
      q: "Quelle forme et quelle taille ont les trous ?",
      aide: "Les gabarits ci-dessous sont à l’échelle réelle.",
      gabarits: true,
      opts: [
        { t: "Ovales, 6 à 10 mm", d: "", n: "bois-ovales" },
        { t: "Ronds, 1 à 2 mm", d: "", n: "bois-ronds-petits" },
        { t: "Ronds, 3 à 4 mm", d: "vieux chêne, souvent humide", f: "grosse-vrillette" },
        { t: "Parfaitement ronds, 4 à 7 mm", d: "bois posé récemment", f: "sirex" },
        { t: "Rond d’environ 1 cm, net", d: "dans une poutre ou un bois exposé, grosse abeille noire à reflets bleus", f: "xylocope" }
      ]
    },
    "bois-ovales": {
      q: "Quelle est l’essence du bois ?",
      opts: [
        { t: "Résineux", d: "sapin, pin, épicéa, charpente, fermettes", f: "capricorne" },
        { t: "Feuillus", d: "chêne, châtaignier", f: "hesperophane" }
      ]
    },
    "bois-ronds-petits": {
      q: "À quoi ressemble la vermoulure ?",
      opts: [
        { t: "De petites boulettes granuleuses", d: "", f: "petite-vrillette" },
        { t: "Une poudre très fine, comme de la farine", d: "", f: "lyctus" }
      ]
    },
    "bois-sans-trou": {
      q: "Qu’observez-vous ?",
      opts: [
        { t: "Le bois s’effrite en suivant les fibres, galeries remplies de terre", d: "cordonnets de terre sur les murs, le bois sonne creux", f: "termites-souterrains" },
        { t: "De petits granulés durs à 6 faces qui tombent du bois", d: "bois mort, souches, vieux ceps", f: "termite-bois-sec" },
        { t: "Sciure fibreuse rejetée, galeries propres et lisses dans un bois humide", d: "grosses fourmis noires", f: "fourmi-charpentiere" },
        { t: "Le bois casse en cubes, filaments ou coussinets blancs", d: "poussière rousse, odeur de champignon", f: "merule" }
      ]
    },

    /* ---------- PIQURES SANS VOIR L'INSECTE ---------- */
    piqures: {
      q: "Où et quand les piqûres apparaissent-elles ?",
      opts: [
        { t: "Alignées par 2 ou 3, au réveil", d: "", f: "punaise-de-lit" },
        { t: "Sur les chevilles et les mollets, un animal à la maison", d: "", f: "puce" },
        { t: "Le soir ou la nuit, avec un bourdonnement", d: "", f: "moustique-commun" },
        { t: "Des plaques qui démangent après une promenade sous les pins", d: "", f: "processionnaire" }
      ]
    },

    /* ---------- NID OU ESSAIM ---------- */
    nid: {
      q: "À quoi ressemble le nid ?",
      aide: "Ne vous approchez pas pour regarder : observez de loin.",
      opts: [
        { t: "Grosse boule de papier en hauteur dans un arbre, entrée latérale", d: "", f: "frelon-asiatique" },
        { t: "Nid en carton sous le toit, dans un cabanon ou un volet", d: "", n: "nid-carton" },
        { t: "Grappe d’insectes sur une branche", d: "", f: "abeille-domestique" },
        { t: "Nids de soie blanche au bout des branches de pin", d: "", f: "processionnaire" },
        { t: "Cordonnets de terre sur les murs ou les fondations", d: "", f: "termites-souterrains" }
      ]
    },
    "nid-carton": {
      q: "Quels insectes en sortent ?",
      opts: [
        { t: "Jaune vif et noir, taille fine", d: "", f: "guepe" },
        { t: "Gros, brun-roux et jaune, tête jaune", d: "vole aussi de nuit", f: "frelon-europeen" }
      ]
    }
  };

  /* ------------------------------------------------------------------
     2. Etat, et memoire du profil
     localStorage peut lever (navigation privee, donnees bloquees) et peut
     revenir vide : chaque lecture et chaque ecriture est gardee, et l'absence
     de valeur vaut « particulier ».
     ------------------------------------------------------------------ */
  var CLE_PROFIL = "dz-ident-profil";

  function lireProfil() {
    try {
      return localStorage.getItem(CLE_PROFIL) === "pro" ? "pro" : "particulier";
    } catch (e) { return "particulier"; }
  }
  function ecrireProfil(v) {
    try { localStorage.setItem(CLE_PROFIL, v); } catch (e) { /* sans effet */ }
  }

  var profil = lireProfil();
  var pile = [];        // noeuds traverses, pour le bouton Retour
  var parcours = [];    // libelles choisis, pour le pre-remplissage

  /* ------------------------------------------------------------------
     3. Reperes dans le DOM
     ------------------------------------------------------------------ */
  var zoneEtape = document.getElementById("ident-etape");
  var zoneFiche = document.getElementById("ident-resultat");
  var zoneAZ = document.getElementById("ident-az");
  var champRech = document.getElementById("ident-recherche");
  var blocRech = document.getElementById("ident-recherche-bloc");
  var fil = document.getElementById("ident-fil");
  var statut = document.getElementById("ident-statut");
  var depart = document.getElementById("ident-depart");
  var btnRetour = document.getElementById("ident-retour");
  var btnRecommencer = document.getElementById("ident-recommencer");
  var radios = racine.querySelectorAll("[data-profil]");
  var noteHorsLigne = document.getElementById("ident-hors-ligne");
  var formulaire = document.getElementById("dezinsectContactForm");
  var blocFormulaire = document.getElementById("ident-formulaire");

  /* ------------------------------------------------------------------
     4. Profil : le JS ne fait que masquer, tout le contenu est dans le HTML
     ------------------------------------------------------------------ */
  function appliquerProfil() {
    racine.setAttribute("data-mode", profil);
    for (var i = 0; i < radios.length; i++) {
      var actif = radios[i].getAttribute("data-profil") === profil;
      radios[i].setAttribute("aria-checked", actif ? "true" : "false");
      radios[i].setAttribute("tabindex", actif ? "0" : "-1");
    }
    if (blocRech) { blocRech.hidden = (profil !== "pro"); }
    if (noteHorsLigne) { noteHorsLigne.hidden = (profil !== "pro"); }
    if (profil !== "pro" && zoneAZ) { zoneAZ.hidden = true; }
  }

  for (var r = 0; r < radios.length; r++) {
    (function (bouton) {
      bouton.addEventListener("click", function () {
        profil = bouton.getAttribute("data-profil");
        ecrireProfil(profil);
        appliquerProfil();
        annoncer(profil === "pro" ? "Mode professionnel actif." : "Mode particulier actif.");
      });
      bouton.addEventListener("keydown", function (ev) {
        if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft" &&
            ev.key !== "ArrowUp" && ev.key !== "ArrowDown") { return; }
        ev.preventDefault();
        profil = (profil === "pro") ? "particulier" : "pro";
        ecrireProfil(profil);
        appliquerProfil();
        var cible = racine.querySelector('[data-profil="' + profil + '"]');
        if (cible) { cible.focus(); }
      });
    })(radios[r]);
  }

  /* ------------------------------------------------------------------
     5. Annonces en aria-live
     ------------------------------------------------------------------ */
  function annoncer(texte) {
    if (statut) { statut.textContent = texte; }
  }

  /* ------------------------------------------------------------------
     6. Recherche A-Z du mode Professionnel
     Insensible a la casse, aux accents, aux apostrophes typographiques et
     aux tirets : « ile rousse » doit trouver L'Ile-Rousse, meme logique que
     la recherche de commune de main.js.
     ------------------------------------------------------------------ */
  function pliable(s) {
    s = String(s).toLowerCase();
    if (s.normalize) { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    return s.replace(/[’'\-\s.]/g, "");
  }

  if (champRech && zoneAZ) {
    champRech.addEventListener("input", function () {
      var q = pliable(champRech.value);
      var lignes = zoneAZ.querySelectorAll("[data-recherche]");
      var vus = 0;
      for (var i = 0; i < lignes.length; i++) {
        var ok = !q || pliable(lignes[i].getAttribute("data-recherche")).indexOf(q) !== -1;
        lignes[i].hidden = !ok;
        if (ok) { vus++; }
      }
      zoneAZ.hidden = false;
      annoncer(q ? (vus + (vus > 1 ? " fiches correspondent." : " fiche correspond.")) : "");
    });
  }

  /* ------------------------------------------------------------------
     7. Rendu d'une etape
     ------------------------------------------------------------------ */
  function afficherEtape(cle) {
    var noeud = ARBRE[cle];
    if (!noeud) { return; }

    zoneEtape.innerHTML = "";
    if (zoneFiche) { zoneFiche.hidden = true; }
    if (depart) { depart.hidden = true; }

    var titre = document.createElement("h3");
    titre.className = "ident-etape__q";
    titre.id = "ident-question";
    titre.setAttribute("tabindex", "-1");
    titre.textContent = noeud.q;
    zoneEtape.appendChild(titre);

    if (noeud.aide) {
      var aide = document.createElement("p");
      aide.className = "ident-etape__aide";
      aide.textContent = noeud.aide;
      zoneEtape.appendChild(aide);
    }

    if (noeud.gabarits) {
      var g = document.getElementById("ident-gabarits");
      if (g) {
        var copie = g.cloneNode(true);
        copie.removeAttribute("id");
        copie.hidden = false;
        zoneEtape.appendChild(copie);
      }
    }

    var liste = document.createElement("ul");
    liste.className = "ident-choix";
    for (var i = 0; i < noeud.opts.length; i++) {
      (function (opt) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.className = "ident-choix__btn";
        var fort = document.createElement("span");
        fort.className = "ident-choix__t";
        fort.textContent = opt.t;
        b.appendChild(fort);
        if (opt.d) {
          var d = document.createElement("span");
          d.className = "ident-choix__d";
          d.textContent = opt.d;
          b.appendChild(d);
        }
        b.addEventListener("click", function () {
          parcours.push(opt.t);
          if (opt.f) { afficherFiche(opt.f); }
          else if (opt.n) { pile.push(cle); afficherEtape(opt.n); }
        });
        li.appendChild(b);
        liste.appendChild(li);
      })(noeud.opts[i]);
    }
    zoneEtape.appendChild(liste);
    zoneEtape.hidden = false;

    majFil();
    if (btnRetour) { btnRetour.hidden = false; }
    titre.focus();
    annoncer("Étape " + (pile.length + 1) + " : " + noeud.q);
  }

  /* ------------------------------------------------------------------
     8. Rendu d'une fiche : on revele celle du HTML, on n'en fabrique pas
     ------------------------------------------------------------------ */
  var ficheCourante = null;

  function afficherFiche(id) {
    var source = document.getElementById("fiche-" + id);
    if (!source) { return; }

    ficheCourante = source;
    zoneEtape.hidden = true;
    if (depart) { depart.hidden = true; }

    zoneFiche.innerHTML = "";
    var copie = source.cloneNode(true);
    copie.removeAttribute("id");
    copie.open = true;                 // la fiche est ouverte dans le resultat
    copie.classList.add("ident-fiche--resultat");
    zoneFiche.appendChild(copie);
    zoneFiche.hidden = false;

    var titre = copie.querySelector(".ident-fiche__nom");
    if (titre) {
      titre.setAttribute("tabindex", "-1");
      titre.focus();                   // le focus va au titre, pas a l'encart
    }
    majFil();
    if (btnRetour) { btnRetour.hidden = false; }
    annoncer("Résultat : " + (titre ? titre.textContent : ""));
    preparerEncart(copie);
  }

  /* ------------------------------------------------------------------
     9. Fil d'etapes
     ------------------------------------------------------------------ */
  function majFil() {
    if (!fil) { return; }
    fil.innerHTML = "";
    if (!parcours.length) { fil.hidden = true; return; }
    for (var i = 0; i < parcours.length; i++) {
      var li = document.createElement("li");
      li.className = "ident-fil__item";
      li.textContent = parcours[i];
      fil.appendChild(li);
    }
    fil.hidden = false;
  }

  /* ------------------------------------------------------------------
     10. Retour et remise a zero
     ------------------------------------------------------------------ */
  if (btnRetour) {
    btnRetour.addEventListener("click", function () {
      parcours.pop();
      if (zoneFiche && !zoneFiche.hidden && pile.length) {
        // on revenait d'une fiche : reafficher le dernier noeud
        afficherEtape(pile[pile.length - 1]);
        return;
      }
      var precedent = pile.pop();
      if (precedent) { afficherEtape(precedent); }
      else { remiseAZero(); }
    });
  }

  function remiseAZero() {
    pile = [];
    parcours = [];
    ficheCourante = null;
    zoneEtape.innerHTML = "";
    zoneEtape.hidden = true;
    if (zoneFiche) { zoneFiche.hidden = true; }
    if (depart) { depart.hidden = false; }
    if (btnRetour) { btnRetour.hidden = true; }
    majFil();
    annoncer("Retour au début.");
    if (depart) {
      var h = depart.querySelector("h2, h3");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    }
  }

  if (btnRecommencer) {
    btnRecommencer.addEventListener("click", remiseAZero);
  }

  /* ------------------------------------------------------------------
     11. Cartes de depart
     ------------------------------------------------------------------ */
  var cartes = racine.querySelectorAll("[data-branche]");
  for (var c = 0; c < cartes.length; c++) {
    (function (carte) {
      carte.addEventListener("click", function () {
        var b = carte.getAttribute("data-branche");
        parcours = [carte.getAttribute("data-libelle") || b];
        pile = [];
        afficherEtape(b);
      });
    })(cartes[c]);
  }

  /* ------------------------------------------------------------------
     12. Encart d'action : titre selon le statut, et le bouton « Remplir la
         fiche » qui pre-remplit le formulaire existant.
         main.js n'est pas modifie : il accroche le formulaire par son id,
         derriere une garde d'existence.
     ------------------------------------------------------------------ */
  function preparerEncart(fiche) {
    var bouton = fiche.querySelector("[data-remplir]");
    if (!bouton || !formulaire) { return; }
    bouton.addEventListener("click", function (ev) {
      ev.preventDefault();
      remplirFormulaire(fiche);
    });
  }

  function valeurCachee(nom, valeur) {
    if (!formulaire) { return; }
    var champ = formulaire.querySelector('[name="' + nom + '"]');
    if (!champ) {
      champ = document.createElement("input");
      champ.type = "hidden";
      champ.name = nom;
      formulaire.appendChild(champ);
    }
    champ.value = valeur;
  }

  function remplirFormulaire(fiche) {
    var nom = (fiche.querySelector(".ident-fiche__nom") || {}).textContent || "";
    var sci = (fiche.querySelector(".ident-fiche__sci") || {}).textContent || "";
    var st = (fiche.querySelector(".ident-statut") || {}).getAttribute
      ? (fiche.querySelector(".ident-statut").getAttribute("data-statut") || "") : "";
    nom = nom.replace(/\s+/g, " ").trim();
    sci = sci.replace(/\s+/g, " ").trim();

    valeurCachee("subject", "Demande via l'outil d'identification : " + nom);
    valeurCachee("nuisible_identifie", nom + (sci ? " (" + sci + ")" : "") + " : " + st);
    valeurCachee("parcours", parcours.join(" > ") + " | profil : " +
      (profil === "pro" ? "Pro" : "Particulier"));

    // service : l'option existante si elle correspond, sinon « Autre »
    var service = formulaire.querySelector('[name="service"]');
    var vise = fiche.getAttribute("data-service") || "";
    if (service) {
      var trouve = false;
      for (var i = 0; i < service.options.length; i++) {
        if (service.options[i].value === vise) { service.selectedIndex = i; trouve = true; break; }
      }
      if (!trouve) {
        for (var j = 0; j < service.options.length; j++) {
          if (/^Autre/.test(service.options[j].value)) { service.selectedIndex = j; break; }
        }
      }
    }

    // message : on n'ecrase pas ce que le client a deja ecrit
    var msg = formulaire.querySelector('[name="message"]');
    if (msg) {
      var entete = "Identification : " + nom + ".\n\n";
      if (!msg.value || /^Identification : .*\.\n\n?$/.test(msg.value)) {
        msg.value = entete;
      } else if (msg.value.indexOf("Identification : ") !== 0) {
        msg.value = entete + msg.value;
      } else {
        msg.value = msg.value.replace(/^Identification : [^\n]*\.\n\n?/, entete);
      }
    }

    if (blocFormulaire) { blocFormulaire.hidden = false; }
    var premier = formulaire.querySelector("input:not([type=hidden]):not([name=botcheck]), select, textarea");
    if (blocFormulaire && blocFormulaire.scrollIntoView) {
      blocFormulaire.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (premier) { premier.focus(); }
    if (msg) { msg.selectionStart = msg.selectionEnd = msg.value.length; }
    annoncer("Formulaire pré-rempli pour " + nom + ".");
  }

  /* ------------------------------------------------------------------
     13. Partage : Web Share API si elle existe, sinon copie du lien
     ------------------------------------------------------------------ */
  var URL_OUTIL = "https://dezinsect-corse.fr/identifier-nuisible";
  var partages = racine.querySelectorAll("[data-partager]");

  function retourPartage(bouton, texte) {
    var zone = bouton.parentNode.querySelector("[data-partage-etat]");
    if (zone) { zone.textContent = texte; }
    annoncer(texte);
  }

  for (var p = 0; p < partages.length; p++) {
    (function (bouton) {
      bouton.hidden = false;
      bouton.addEventListener("click", function () {
        var charge = {
          title: document.title,
          text: "Identifiez un insecte ou un nuisible en Corse, gratuitement :",
          url: URL_OUTIL
        };
        if (navigator.share) {
          navigator.share(charge)["catch"](function () { /* annule par l'utilisateur */ });
          return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(URL_OUTIL).then(function () {
            retourPartage(bouton, "Lien copié");
          })["catch"](function () {
            retourPartage(bouton, URL_OUTIL);
          });
          return;
        }
        retourPartage(bouton, URL_OUTIL);
      });
    })(partages[p]);
  }

  /* ------------------------------------------------------------------
     14. Hors connexion : service worker propre a cette page
     Il ne repond que pour cette page et ses ressources. Enregistre ici et
     nulle part ailleurs, donc aucune autre page du site n'est interceptee.
     ------------------------------------------------------------------ */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw-identifier.js")["catch"](function () {
        /* sans effet : l'outil fonctionne en ligne */
      });
    });
  }

  /* ------------------------------------------------------------------
     15. Mise en route
     Le formulaire est visible dans le HTML (donc sans JS) ; c'est le script
     qui le masque. Un bref clignotement est possible au chargement, comme
     pour le bouton du menu mobile : le remede coute plus que le defaut.
     ------------------------------------------------------------------ */
  appliquerProfil();
  if (blocFormulaire) { blocFormulaire.hidden = true; }
  if (zoneEtape) { zoneEtape.hidden = true; }
  if (zoneFiche) { zoneFiche.hidden = true; }
  if (btnRetour) { btnRetour.hidden = true; }
  if (fil) { fil.hidden = true; }

  // Les fiches en <details> servent de contenu indexable sans JS ; avec JS,
  // on les replie et la liste A-Z ne s'ouvre qu'en mode Pro.
  var toutesFiches = document.querySelectorAll(".ident-fiche");
  for (var t = 0; t < toutesFiches.length; t++) { toutesFiches[t].open = false; }
  racine.setAttribute("data-js", "on");
})();
