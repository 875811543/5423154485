#!/usr/bin/env node
// Hook Claude Code (PreToolUse) : refuse deux gestes qui ont déjà coûté cher.
// - modifier à la main un fichier généré (sitemap.xml, assets/data/communes.json) ;
// - publier en contournant le pre-push (git push --no-verify).
// Sans dépendance.
'use strict';
const path = require('path');

const racine = path.resolve(__dirname, '..', '..');
const GENERES = {
  'sitemap.xml': 'node tools/build-sitemap.js',
  'assets/data/communes.json': 'node tools/build-communes.js'
};

function refuser(raison) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: raison
    }
  }));
}

let entree = '';
process.stdin.on('data', d => (entree += d));
process.stdin.on('end', () => {
  let j;
  try { j = JSON.parse(entree || '{}'); } catch (e) { return; }
  const outil = j.tool_name;
  const ti = j.tool_input || {};

  if (outil === 'Edit' || outil === 'Write') {
    if (!ti.file_path) return;
    const rel = path.relative(racine, path.resolve(ti.file_path)).split(path.sep).join('/');
    if (GENERES[rel]) {
      refuser(`${rel} est généré : ne pas l'éditer à la main, lancer « ${GENERES[rel]} ».`);
    }
    return;
  }

  if (outil === 'Bash' || outil === 'PowerShell') {
    const c = String(ti.command || '');
    // Une vraie commande git push (en début de ligne ou après ; && || |),
    // pas la mention de la formule dans un message de commit.
    if (/(^|[;&|]\s*)\s*git(\s+-\S+(\s+[^\s-]\S*)?)*\s+push\b[^;&|\n]*--no-verify\b/m.test(c)) {
      refuser('git push --no-verify contourne le pre-push qui protège le site en ligne. Corriger le contrôle rouge, ou demander l\'accord explicite du propriétaire.');
    }
  }
});
