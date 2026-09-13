/**
 * Genere le bloc « Communes desservies » de zones-dintervention.html,
 * et la liste de reference tools/communes-desservies.json.
 *
 * Pourquoi ce fichier existe
 * --------------------------
 * Le bloc affiche 344 communes. Ecrites a la main, elles seraient fausses
 * quelque part, et impossibles a corriger en serie. Comme pour le sitemap, le
 * contenu est produit et non saisi : on ne modifie ici que la REPARTITION,
 * jamais un nom.
 *
 * D'ou viennent les noms
 * ----------------------
 * De `tools/communes-source.json`, releve de l'API Decoupage administratif
 * (geo.api.gouv.fr) le 13 septembre 2026 : 124 communes en Corse-du-Sud, 236 en
 * Haute-Corse. Le releve est versionne pour deux raisons : la generation reste
 * reproductible sans reseau, et une evolution du decoupage communal se verra en
 * diff au lieu de passer inapercue.
 *
 * Comment les communes sont reparties
 * -----------------------------------
 * Les microregions corses n'ont aucun perimetre administratif : le decoupage
 * est coutumier. Les intercommunalites l'epousent largement, elles servent donc
 * de squelette. Seules les EPCI a cheval sur deux microregions sont scindees,
 * commune par commune, dans SCINDE ci-dessous.
 *
 * Trois rattachements s'ecartent volontairement de l'intercommunalite, parce
 * que c'est l'usage du visiteur qui doit trancher : voir les commentaires sur
 * le Rostinu et sur Bastelicaccia.
 *
 * Ce qui n'est pas desservi
 * -------------------------
 * Le Valinco et le Sartenais. Leurs communes ne sont rattachees a aucun groupe,
 * et le controle « communes-affichees » refuse qu'elles reapparaissent.
 *
 * Usage
 * -----
 *   node tools/build-communes.js            regenere le bloc et la reference
 *   node tools/build-communes.js --verifie  compare sans rien ecrire
 *
 * Relancer `node tools/controle.js` apres : le controle « communes-affichees »
 * verifie que l'affichage et la reference coincident dans les deux sens.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const { insecable } = require(path.join(__dirname, 'typo.js'));
const SOURCE = path.join(__dirname, 'communes-source.json');
const REFERENCE = path.join(__dirname, 'communes-desservies.json');
const PAGE = path.join(RACINE, 'zones-dintervention.html');

/* ------------------------------------------------------------------ *
 *  Repartition
 * ------------------------------------------------------------------ */

// EPCI reprises en entier dans une microregion.
const ENTIER = {
  "CC Nebbiu - Conca d'Oro": 'nebbio',
  'CC de la Costa Verde': 'costa-verde',
  "CC de l'Oriente": 'plaine-orientale',
  'CC du Centre Corse': 'centre-corse',
  'CC de Calvi Balagne': 'balagne',
  "CC de l'Ile-Rousse - Balagne": 'balagne',
  'CA du Pays Ajaccien': 'grand-ajaccio',
  'CC Celavu-Prunelli': 'gravona',
  'CC du Sud Corse': 'extreme-sud',
  'CA de Bastia': 'bastia-cap',
  'CC du Cap Corse': 'bastia-cap',
  "CC de Fium'Orbu Castellu": 'fiumorbu'
};

// Les EPCI a cheval, scindees commune par commune.
const SCINDE = {
  // La Marana littorale tient a Bastia ; les communes du Golo remontent vers
  // Ponte-Leccia et rejoignent le Centre Corse avec le reste de l'EPCI.
  'bastia-cap': ['Biguglia', 'Borgo', 'Lucciana'],

  // Le Rostinu va a la Castagniccia, pas au Centre Corse. Son intercommunalite
  // regarde Corte, mais l'habitant de Morosaglia cherche son village sous
  // Castagniccia : l'usage du visiteur prime sur le decoupage administratif.
  'castagniccia': ['Bisinchi', 'Canavaggia', 'Castello-di-Rostino', 'Gavignano',
                   'Morosaglia', 'Saliceto', 'Valle-di-Rostino'],

  // Niolu : le bassin de Calacuccia, isole par le Scala di Santa Regina.
  'niolu': ['Albertacce', 'Calacuccia', 'Casamaccioli', 'Corscia', 'Lozzi'],

  // Casinca : la plaine et les villages de balcon au-dessus de Vescovato.
  'casinca': ['Castellare-di-Casinca', 'Loreto-di-Casinca', 'Penta-di-Casinca', 'Porri',
              'Silvareccio', 'Sorbo-Ocagnano', 'Venzolasca', 'Vescovato'],

  // Cruzzini : la haute vallee, versant oppose a la Cinarca.
  'gravona': ['Azzana', 'Lopigna', 'Pastricciola', 'Rezza', 'Rosazia', 'Salice'],

  // Rive sud d'Ajaccio et premiere couronne de l'Ornano. Bastelicaccia y figure
  // bien qu'il soit dans l'EPCI Celavu-Prunelli : c'est une banlieue contigue
  // d'Ajaccio, pas une commune de vallee.
  'grand-ajaccio': ['Albitreccia', 'Bastelicaccia', 'Campo', 'Cardo-Torgia', 'Cauro',
                    'Coti-Chiavari', 'Grosseto-Prugna', 'Guargualé', 'Pietrosella'],

  // Taravo : la vallee, de Petreto-Bicchisano jusqu'a Zicavo.
  'taravo': ['Argiusta-Moriccio', 'Moca-Croce', 'Petreto-Bicchisano'],

  // Solenzara prolonge la cote du Fiumorbu ; Conca regarde Porto-Vecchio.
  // Les deux sont pourtant dans l'EPCI de l'Alta Rocca.
  'fiumorbu': ['Sari-Solenzara'],
  'extreme-sud': ['Conca']
};

// Le reste de chaque EPCI scindee, une fois les communes nommees ci-dessus retirees.
const RESTE = {
  'CC de Marana-Golo': 'centre-corse',
  'CC Pasquale Paoli': 'centre-corse',
  'CC de la Castagniccia-Casinca': 'castagniccia',
  'CC Spelunca-Liamone': 'deux-sorru-sevi',
  "CC de la Pieve de l'Ornano et du Taravo": 'taravo',
  'CC du Sartenais Valinco Taravo': null,   // tout le reste est exclu
  "CC de l'Alta Rocca": 'alta-rocca'
};

// Non desservi. Le Valinco par consigne, le Sartenais par arbitrage.
const EXCLU = {
  valinco: ['Propriano', 'Olmeto', 'Sollacaro', 'Casalabriva', 'Belvédère-Campomoro',
            'Viggianello', 'Fozzano', 'Arbellara', 'Santa-Maria-Figaniella', 'Serra-di-Ferro'],
  sartenais: ['Sartène', 'Giuncheto', 'Granace', 'Bilia', 'Foce', 'Grossa']
};

// Lieux-dits et hameaux, pas des communes INSEE : Folelli releve de
// Penta-di-Casinca, Porticcio de Grosseto-Prugna, Solenzara de Sari-Solenzara.
// Le site a une page pour chacun, ils doivent rester declarables en areaServed
// sans figurer dans la liste des communes.
//
// Liste fixe, jamais deduite par soustraction : la deduire rendait juste au
// premier passage et vidait la cle au second.
const LIEUX_DITS = ['Folelli', 'Moriani-Plage', 'Ponte-Leccia', 'Porticcio', 'Querciolo',
  'Sainte-Lucie-de-Porto-Vecchio', 'Solenzara'];

/* ------------------------------------------------------------------ *
 *  Les microregions, dans l'ordre d'affichage
 * ------------------------------------------------------------------ */

const PAGES_REGIONALES = {
  nord: ['anti-nuisibles-costa-verde', 'Bastia &amp; Costa Verde'],
  centre: ['anti-nuisible-corte', 'Corte, Calvi &amp; Balagne'],
  sud: ['anti-nuisibles-grand-ajaccio-porto-vecchio', 'Ajaccio &amp; Porto-Vecchio']
};

// Une phrase de contexte ouvre chaque accordeon. Elle evite qu'un titre soit
// suivi d'un simple mur de noms propres — c'est le defaut que Bing avait
// signale ailleurs sur le site. Elle ne dit rien du delai d'intervention.
const MICRO = [
  ['bastia-cap', 'Bastia &amp; Cap Corse', 'nord',
   `La ville, sa périphérie de la Marana et les villages du Cap. Deux terrains opposés : un tissu urbain dense où les réseaux d'immeubles font circuler rongeurs et blattes, et des villages de bord de mer où l'accès se fait par des routes étroites.`],
  ['nebbio', 'Nebbio', 'nord',
   `Le bassin de Saint-Florent et la Conca d'Oro. Zone de vignobles et de maquis, avec un habitat dispersé où les nids de guêpes et de frelons en dépendance sont fréquents.`],
  ['casinca', 'Casinca', 'nord',
   `La plaine et les villages de balcon au-dessus de Vescovato. Proximité immédiate de notre secteur de base, entre cultures maraîchères et habitat de village ancien.`],
  ['castagniccia', 'Castagniccia', 'nord',
   `Le pays de la châtaigneraie, en bâti de pierre ancien et charpentes de châtaignier. C'est le terrain type des insectes à larves xylophages et des rongeurs installés dans des combles peu fréquentés.`],
  ['costa-verde', 'Costa Verde', 'nord',
   `Notre secteur de base, de Moriani à Folelli. Littoral touristique à forte pression estivale, où les résidences et les locations saisonnières concentrent les demandes de juin à septembre.`],
  ['plaine-orientale', 'Plaine Orientale', 'nord',
   `La plaine agricole d'Aléria et son arrière-pays. Des exploitations et des stockages qui attirent durablement les rongeurs, et des zones humides propices aux moustiques.`],
  ['fiumorbu', 'Fiumorbu', 'nord',
   `De Ghisonaccia à Solenzara, littoral et vallées. Secteur de campings et de résidences de vacances, avec la même saisonnalité marquée que la Costa Verde.`],
  ['centre-corse', 'Centre Corse / Corte', 'centre',
   `Corte, le Boziu, le Talcini et la vallée du Golo. Altitude et bâti ancien : les nuisibles y arrivent plus tard en saison, et les charpentes anciennes y sont le motif principal d'intervention.`],
  ['balagne', 'Balagne', 'centre',
   `De Calvi à L'Île-Rousse, avec l'Ostriconi et le Ghjunsani. Forte densité touristique sur le littoral, villages perchés à l'intérieur, et une pression estivale comparable à celle de la côte orientale.`],
  ['niolu', 'Niolu', 'centre',
   `Le bassin de Calacuccia, en haute altitude. Secteur isolé par le Scala di Santa Regina, où nous groupons les interventions faute de pouvoir y passer souvent.`],
  ['grand-ajaccio', 'Grand Ajaccio', 'sud',
   `Ajaccio, sa première couronne et la rive sud jusqu'à Porticcio. Agglomération dense, copropriétés et restauration : les traitements y demandent une coordination entre logements voisins.`],
  ['gravona', 'Gravona, Celavu, Prunelli &amp; Cruzzini', 'sud',
   `Les vallées qui remontent depuis Ajaccio vers Bocognano et Bastelica. Habitat de fond de vallée, souvent en lisière de forêt, où les frelons et les rongeurs de combles dominent.`],
  ['deux-sorru-sevi', 'Deux-Sorru / Deux-Sevi', 'sud',
   `De Cargèse et Sagone jusqu'à Évisa, Ota et Piana. Secteur de montagne et de gorges, éloigné de nos deux bases, sur lequel nous regroupons les déplacements.`],
  ['taravo', 'Taravo', 'sud',
   `La vallée, de Petreto-Bicchisano jusqu'à Zicavo. Villages d'altitude et bâti ancien, avec des charpentes qui relèvent souvent du diagnostic avant traitement.`],
  ['alta-rocca', 'Alta Rocca', 'sud',
   `Levie, Zonza, Sainte-Lucie-de-Tallano et les villages alentour. Altitude, forêts de pins laricio et habitat en pierre : les nids de frelons en toiture y sont fréquents.`],
  ['extreme-sud', 'Extrême-Sud', 'sud',
   `Porto-Vecchio, Bonifacio, Figari et Lecci. La plus forte saisonnalité de l'île, avec des résidences et des structures d'accueil qui demandent des passages répétés en été.`]
];

/* ------------------------------------------------------------------ *
 *  Generation
 * ------------------------------------------------------------------ */

/** Repartit les communes, et refuse de rendre une repartition bancale. */
function repartir() {
  const src = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

  const nomme = new Map();
  for (const [g, liste] of Object.entries(SCINDE)) for (const n of liste) nomme.set(n, g);
  const exclus = new Set([...EXCLU.valinco, ...EXCLU.sartenais]);

  const groupes = {};
  const orphelines = [];
  for (const c of src.communes) {
    if (exclus.has(c.nom)) continue;
    const epci = src.epci[c.epci];
    const g = nomme.get(c.nom) || ENTIER[epci] || RESTE[epci];
    if (!g) { orphelines.push(c.nom + ' (' + epci + ')'); continue; }
    (groupes[g] = groupes[g] || []).push(c.nom);
  }

  const tous = Object.values(groupes).flat();
  const doublons = tous.filter((n, i) => tous.indexOf(n) !== i);
  const reels = new Set(src.communes.map(c => c.nom));
  const fantomes = [...nomme.keys(), ...exclus].filter(n => !reels.has(n));

  const erreurs = [];
  if (orphelines.length) erreurs.push('communes non classees : ' + orphelines.join(' | '));
  if (doublons.length) erreurs.push('communes classees deux fois : ' + doublons.join(', '));
  if (fantomes.length) erreurs.push('noms inconnus de la source : ' + fantomes.join(', '));
  if (tous.length + exclus.size !== src.communes.length)
    erreurs.push('somme fausse : ' + tous.length + ' + ' + exclus.size
      + ' != ' + src.communes.length);

  for (const g of Object.keys(groupes)) groupes[g].sort((a, b) => a.localeCompare(b, 'fr'));
  return { groupes, total: tous.length, exclus, source: src, erreurs };
}

/** Le HTML du bloc. */
function bloc(groupes) {
  const svg = '<svg class="commune-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
    + '<path d="m6 9 6 6 6-6"/></svg>';

  let total = 0, corps = '';
  for (const [cle, titre, region, phrase] of MICRO) {
    const liste = groupes[cle];
    if (!liste) throw new Error('microregion vide : ' + cle);
    total += liste.length;
    const [slug, nomPage] = PAGES_REGIONALES[region];
    const sansBalise = titre.replace(/&amp;/g, 'et');
    corps += `
  <details class="commune-groupe">
    <summary class="commune-summary" aria-label="Communes desservies en ${sansBalise} — ${liste.length} communes">
      <span class="commune-nom">${titre}</span>
      <span class="commune-compte">${liste.length} communes</span>
      ${svg}
    </summary>
    <div class="commune-corps">
      <p class="commune-phrase">${insecable(phrase)}</p>
      <p class="commune-liste">${liste.join(', ')}</p>
      <p class="commune-lien"><a class="internal-link" href="${slug}">Voir la page ${nomPage}</a></p>
    </div>
  </details>
`;
  }

  const intro = insecable('Nous intervenons sur toute la Corse sous 24 à 48 heures, y compris dans les '
    + 'secteurs les plus éloignés de nos deux bases. Les nids de guêpes et de frelons sont traités '
    + 'en urgence, sous 24 heures. Les ' + total + ' communes ci-dessous sont regroupées par microrégion : '
    + "ouvrez la vôtre pour vérifier qu'elle y figure.");

  return '\n<section class="communes-block" aria-labelledby="communes-titre">\n'
    + '  <h2 class="zone-heading-md" id="communes-titre">Communes desservies</h2>\n'
    + '  <p class="communes-intro">' + intro + '</p>\n'
    + corps + '</section>\n';
}

/** Remplace le bloc dans la page, ou l'insere avant la fin du main. */
function poser(html) {
  let s = fs.readFileSync(PAGE, 'utf8');
  const debut = s.indexOf('\n<section class="communes-block"');
  if (debut >= 0) {
    const fin = s.indexOf('</section>', s.lastIndexOf('commune-lien')) + '</section>'.length;
    // Les lignes vides qui encadraient le bloc partent avec lui : sans cela,
    // chaque regeneration en laisserait deux de plus que la precedente.
    s = (s.slice(0, debut).replace(/\n+$/, '') + '\n')
      + s.slice(fin).replace(/^\n+/, '\n');
  }
  const ancre = '\n</main>\n';
  if (s.split(ancre).length - 1 !== 1) throw new Error('ancre </main> introuvable ou multiple');
  return s.replace(ancre, '\n' + html + '\n</main>\n');
}

/* ------------------------------------------------------------------ */

/**
 * Construit la page et la reference attendues, sans rien ecrire.
 * Exporte pour que le controle « communes-genere » puisse comparer.
 */
function attendu() {
  const { groupes, total, exclus, source, erreurs } = repartir();
  if (erreurs.length) throw new Error(erreurs.join(' ; '));
  const reference = {
    commentaire: "Communes desservies par Dezinsect Corse. Cette liste vivait dans l'areaServed "
      + "JSON-LD de l'accueil, ou elle pesait 8,2 Ko sans rien apporter au classement. Elle sert "
      + "desormais de reference au controle « entite », qui refuse qu'une page declare une commune "
      + "absente d'ici, et au controle « communes-affichees », qui exige qu'elle soit identique au "
      + "bloc « Communes desservies » de zones-dintervention. Genere par tools/build-communes.js : "
      + "ne pas editer a la main.",
    commentaireLieuxDits: "Lieux-dits et hameaux, pas des communes INSEE : Folelli releve de "
      + "Penta-di-Casinca, Porticcio de Grosseto-Prugna, Solenzara de Sari-Solenzara. Le site a une "
      + "page pour chacun, ils doivent donc rester declarables en areaServed sans figurer dans la "
      + "liste des communes.",
    departements: ['Corse-du-Sud', 'Haute-Corse'],
    communes: [...new Set(Object.values(groupes).flat())].sort((a, b) => a.localeCompare(b, 'fr')),
    lieuxDits: [...LIEUX_DITS].sort((a, b) => a.localeCompare(b, 'fr'))
  };
  return {
    page: poser(bloc(groupes)),
    reference: JSON.stringify(reference, null, 1) + '\n',
    total, exclus, source
  };
}

/** Ce qui diverge entre le depot et le generateur. Vide = conforme. */
function ecarts() {
  const a = attendu();
  const pbs = [];
  if (fs.readFileSync(PAGE, 'utf8') !== a.page)
    pbs.push('zones-dintervention.html differe de ce que produit tools/build-communes.js');
  if (fs.readFileSync(REFERENCE, 'utf8') !== a.reference)
    pbs.push('tools/communes-desservies.json differe de ce que produit tools/build-communes.js');
  return pbs;
}

module.exports = { repartir, attendu, ecarts, EXCLU, LIEUX_DITS };

if (require.main === module) {
  const a = attendu();
  console.log('  source    : ' + a.source.communes.length + ' communes, relevé du ' + a.source.releve);
  console.log('  classées  : ' + a.total + '   exclues : ' + a.exclus.size
    + '   (Valinco ' + EXCLU.valinco.length + ', Sartenais ' + EXCLU.sartenais.length + ')');
  console.log('  groupes   : ' + MICRO.length);

  if (process.argv.includes('--verifie')) {
    const pbs = ecarts();
    if (!pbs.length) console.log('  dépôt     : conforme au générateur');
    else for (const p of pbs) console.log('  ÉCART : ' + p);
    process.exit(pbs.length ? 1 : 0);
  }

  fs.writeFileSync(PAGE, a.page);
  fs.writeFileSync(REFERENCE, a.reference);
  console.log('  écrit     : zones-dintervention.html, tools/communes-desservies.json');
}
