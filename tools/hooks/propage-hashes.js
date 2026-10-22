#!/usr/bin/env node
// Hook Claude Code (PostToolUse sur Edit|Write) : après la modification d'un
// fichier de assets/css/ ou assets/js/, recalcule son empreinte ?v= (8 premiers
// caractères du md5) et la propage sur toutes les pages HTML de la racine.
// C'est la boucle md5sum + sed du §5 d'AGENTS.md, rendue automatique.
// Sans dépendance ; ne fait rien pour un autre fichier.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const racine = path.resolve(__dirname, '..', '..');

let entree = '';
process.stdin.on('data', d => (entree += d));
process.stdin.on('end', () => {
  let fichier;
  try {
    const j = JSON.parse(entree || '{}');
    fichier = (j.tool_input && j.tool_input.file_path) || (j.tool_response && j.tool_response.filePath);
  } catch (e) {
    return;
  }
  if (!fichier) return;
  const rel = path.relative(racine, path.resolve(fichier)).split(path.sep).join('/');
  if (!/^assets\/(css|js)\/.+\.(css|js)$/.test(rel)) return;
  if (!fs.existsSync(path.join(racine, rel))) return;

  const nom = path.basename(rel);
  const h = crypto.createHash('md5').update(fs.readFileSync(path.join(racine, rel))).digest('hex').slice(0, 8);
  const motif = new RegExp(nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?v=[a-zA-Z0-9]*', 'g');
  let pages = 0;
  for (const f of fs.readdirSync(racine)) {
    if (!f.endsWith('.html')) continue;
    const p = path.join(racine, f);
    const s = fs.readFileSync(p, 'utf8');
    const t = s.replace(motif, nom + '?v=' + h);
    if (t !== s) {
      fs.writeFileSync(p, t);
      pages++;
    }
  }
  if (pages) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `Empreinte de ${nom} portée à ?v=${h} sur ${pages} page(s).`
      }
    }));
  }
});
