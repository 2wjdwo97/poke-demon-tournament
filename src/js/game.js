'use strict';
/* ============================================================
   Pokemon Tournament — game.js
   ============================================================ */

// ── Grid constants ────────────────────────────────────────────
const GRID_COLS = 5;
const GRID_ROWS = 3;
const CARD_PRIORITY = { MOVE: 1, GUARD: 2, HEAL: 3, ATTACK: 4 };

// ── Team Rocket pool ──────────────────────────────────────────
const ROCKET_POOL = [
  { pad:'0052' }, // 나옹 Meowth
  { pad:'0024' }, // 마자용 Arbok
  { pad:'0109' }, // 또가스 Koffing
  { pad:'0023' }, // 아보 Ekans
  { pad:'0041' }, // 주뱃 Zubat
  { pad:'0088' }, // 질뻐기 Grimer
  { pad:'0019' }, // 꼬랫 Rattata
  { pad:'0020' }, // Raticate
];

// ── Roguelike global state ────────────────────────────────────
const G = {
  floor: 1,
  map: null,
  team: [],
  teamIdx: 0,
  money: 150,
  isBoss: false,
  isRocketBattle: false,
  currentEnemy: null,
  items: { monsterball: 3, greatball: 0, ultraball: 0 },
  passives: [],
  caughtThisRun: [],
};

// ── Persistent Pokédex ────────────────────────────────────────
const DEX_KEY  = 'pokeDex_caught';
const SAVE_KEY = 'pokeDex_runSave';
const STARTER_PADS = ['0001','0004','0007','0152','0155','0158'];

function dexLoad() {
  try { return new Set(JSON.parse(localStorage.getItem(DEX_KEY) || '[]')); }
  catch(e) { return new Set(STARTER_PADS); }
}
function dexSave(set) {
  localStorage.setItem(DEX_KEY, JSON.stringify([...set]));
}
function dexInit() {
  const s = dexLoad();
  STARTER_PADS.forEach(p => s.add(p));
  dexSave(s);
  return s;
}
function dexAdd(pad) {
  const s = dexLoad(); s.add(pad); dexSave(s);
}
function dexRelease(pads) {
  const s = dexLoad();
  pads.forEach(pad => { if (!STARTER_PADS.includes(pad)) s.delete(pad); });
  dexSave(s);
}

function runSave() {
  const save = {
    v: 2,
    G: {
      floor: G.floor,
      teamIdx: G.teamIdx,
      money: G.money,
      items: { ...G.items },
      passives: [...(G.passives || [])],
      caughtThisRun: [...G.caughtThisRun],
      team: G.team.map(p => ({ ...p, animData: null })),
      map: G.map,
    },
    battle: G.currentEnemy ? {
      enemy: { ...G.currentEnemy, animData: null },
      isBoss: G.isBoss || false,
      isRocketBattle: G.isRocketBattle || false,
      state: {
        round:  state.round,
        player: { dm: state.player.dm, en: state.player.en, pos: { ...state.player.pos } },
        ai:     { dm: state.ai.dm,     en: state.ai.en,     pos: { ...state.ai.pos     } },
      },
    } : null,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
function runLoad() {
  try { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; }
  catch(e) { return null; }
}
function runClear() { localStorage.removeItem(SAVE_KEY); }
function runExists() { return !!localStorage.getItem(SAVE_KEY); }

// ── Battle state ──────────────────────────────────────────────
const state = {
  round: 1,
  player: { dm: 100, en: 100, shield: 0, pos: { col: 0, row: 1 }, selectedCards: [] },
  ai:     { dm: 100, en: 100, shield: 0, pos: { col: 4, row: 1 }, selectedCards: [] },
};

// ── Stat helpers ──────────────────────────────────────────────
const DEFAULT_FLOOR_LEVEL_RANGES = { 1:[1,8], 2:[5,14], 3:[10,20], 4:[15,28] };
function rnd(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
const MAX_LEVEL = 20;
const SPECIAL_TYPES = new Set(['Fire','Water','Grass','Electric','Ice','Psychic','Dragon','Ghost']);
function calcMaxHp(baseHp, level)    { return baseHp + (level - 1) * 10; }
function calcAtk(baseAtk, level)     { return Math.round(baseAtk * level / 25 + 5); }
function calcDef(baseDef, level)     { return Math.round(baseDef * level / 25 + 5); }
function calcSpAtk(baseSpAtk, level) { return Math.round(baseSpAtk * level / 25 + 5); }
function calcSpDef(baseSpDef, level) { return Math.round(baseSpDef * level / 25 + 5); }
function calcSpd(baseSpd, level)     { return Math.round(baseSpd   * level / 25 + 5); }
function expForNext(level, gr) {
  const n = level * level;
  switch (gr) {
    case 'F':  return n * 4;
    case 'MS': return n * 8;
    case 'S':  return n * 10;
    default:   return n * 6;   // MF (Medium Fast)
  }
}

const GROWTH_RATE_MAP = {
  F:  new Set(['0010','0011','0012','0013','0014','0015','0019','0020','0021','0022','0025','0026','0041','0042','0052','0053','0161','0162','0163','0164','0165','0166','0167','0168']),
  MS: new Set(['0001','0002','0003','0004','0005','0006','0007','0008','0009','0056','0057','0063','0064','0065','0066','0067','0068','0152','0153','0154','0155','0156','0157','0158','0159','0160']),
  S:  new Set(['0095','0113','0131','0143','0147','0148','0149','0150','0151','0202','0243','0244','0245','0246','0247','0248','0249','0250','0251']),
};
function getGrowthRate(pad) {
  if (GROWTH_RATE_MAP.F.has(pad))  return 'F';
  if (GROWTH_RATE_MAP.MS.has(pad)) return 'MS';
  if (GROWTH_RATE_MAP.S.has(pad))  return 'S';
  return 'MF';
}

// ── Hitmap bitmask helpers ────────────────────────────────────
// bit = (dc+1) + (dr+1)*3;  9 bits for 3×3 grid
const HM_OFFSETS = [[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]];

function hitMaskToArray(hit) {
  if (typeof hit === 'number') return HM_OFFSETS.filter((_, i) => hit & (1 << i));
  if (Array.isArray(hit)) return hit; // backward compat
  return [];
}

function hitToMask(hit) {
  if (typeof hit === 'number') return hit;
  if (!hit || !hit.length) return 0;
  return hit.reduce((m, [dc, dr]) => m | (1 << ((dc + 1) + (dr + 1) * 3)), 0);
}

// ── Pokémon instance factory ──────────────────────────────────
function createPokeInstance(pad, level, movepool) {
  const base  = POKEDEX[pad] || { types: ['Normal'], baseHp: 50, baseAtk: 50, baseDef: 50 };
  const gr    = getGrowthRate(pad);
  const maxHp = calcMaxHp(base.baseHp, level);
  return {
    pad, name: padToName(pad), types: base.types, level,
    hp: maxHp, maxHp,
    atk:   calcAtk(base.baseAtk,   level),
    def:   calcDef(base.baseDef,   level),
    spAtk: calcSpAtk(base.baseSpAtk ?? base.baseAtk, level),
    spDef: calcSpDef(base.baseSpDef ?? base.baseDef, level),
    spd:   calcSpd(base.baseSpd   ?? 65,             level),
    growthRate: gr,
    exp: 0, nextExp: expForNext(level, gr),
    movepool: movepool || [],
    cards: buildCards(movepool || []),
    portrait: { normal: [0, 0], hurt: [0, 1] },
    char: pad, animData: null,
  };
}

// ── Admin config helpers ───────────────────────────────────────
function getAdminConfig() {
  return (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG) ? GAME_CONFIG : null;
}

function pickWildFromConfig(pokemonList) {
  const total = pokemonList.reduce((s, p) => s + (p.weight || 6), 0);
  let r = Math.random() * total;
  for (const p of pokemonList) {
    r -= (p.weight || 6);
    if (r <= 0) return p.pad;
  }
  return pokemonList[0].pad;
}

function getActiveMoves() {
  const cfg = getAdminConfig();
  return (cfg && cfg.moves) ? cfg.moves : MOVES;
}

// ── Card builder ──────────────────────────────────────────────
function buildCards(movepool) {
  const activeMoves = getActiveMoves();
  const cards = movepool.slice(0, 8).map(key => {
    const m = activeMoves[key] || MOVES[key];
    if (!m) return null;
    return {
      id: key, name: m.name, moveType: m.type, type: m.cat,
      power: m.power || 0, en: m.en || 0,
      hit: hitToMask(m.hit),
      steps: m.steps || 0, direction: m.direction || null,
      healAmt: m.healAmt || MOVES[key]?.healAmt || 0,
      guardAmt: m.guardAmt || MOVES[key]?.guardAmt || 0,
      enHealPct: m.enHealPct || MOVES[key]?.enHealPct || 0,
    };
  }).filter(Boolean);
  // Every Pokémon gets 4 directional moves (1 step each)
  ['UP','DOWN','LEFT','RIGHT'].forEach(dir => {
    cards.push({
      id: 'move_'+dir.toLowerCase(), name: 'Move '+dir[0]+dir.slice(1).toLowerCase(),
      moveType:'Normal', type:'MOVE', power:0, en:5,
      steps:1, direction:dir, healAmt:0, guardAmt:0,
    });
  });
  return cards;
}

// ── Damage formula ────────────────────────────────────────────
function calcDamage(card, attackerPoke, defenderPoke) {
  if (!card.power) return 0;
  const rawEff  = getTypeEff(card.moveType, defenderPoke.types);
  const typeEff = rawEff === 0    ? 0
                : rawEff <= 0.25  ? 0.66
                : rawEff <= 0.5   ? 0.75
                : rawEff <= 1     ? 1
                : rawEff <= 2     ? 1.5
                : 2;
  const isSpecial = SPECIAL_TYPES.has(card.moveType);
  const atkStat   = isSpecial ? (attackerPoke.spAtk ?? attackerPoke.atk) : attackerPoke.atk;
  const statBonus = Math.max(0, atkStat - defenderPoke.def);
  return Math.min(100, Math.max(1, Math.round((card.power + statBonus) * typeEff)));
}

// ── AUTO direction resolver ───────────────────────────────────
function resolveAutoDir(ownerPos, targetPos) {
  const dCol = targetPos.col - ownerPos.col;
  const dRow = targetPos.row - ownerPos.row;
  if (Math.abs(dCol) >= Math.abs(dRow)) return dCol >= 0 ? 'RIGHT' : 'LEFT';
  return dRow >= 0 ? 'DOWN' : 'UP';
}

// ── Position helpers ──────────────────────────────────────────
function movePos(pos, direction, steps) {
  let { col, row } = pos;
  switch (direction) {
    case 'UP':    row -= steps; break;
    case 'DOWN':  row += steps; break;
    case 'LEFT':  col -= steps; break;
    case 'RIGHT': col += steps; break;
    case 'UP_LEFT':    col -= steps; row -= steps; break;
    case 'UP_RIGHT':   col += steps; row -= steps; break;
    case 'DOWN_LEFT':  col -= steps; row += steps; break;
    case 'DOWN_RIGHT': col += steps; row += steps; break;
  }
  return { col: Math.max(0, Math.min(GRID_COLS-1, col)),
           row: Math.max(0, Math.min(GRID_ROWS-1, row)) };
}

// ── Hit detection ─────────────────────────────────────────────
// isPlayerAttacking: true = player attacks AI, false = AI attacks player
function isHit(attackerPos, defenderPos, card, isPlayerAttacking = true) {
  const rawDCol = defenderPos.col - attackerPos.col;
  const rawDRow = defenderPos.row - attackerPos.row;
  const fwd = isPlayerAttacking ? 1 : -1;
  const relDCol = rawDCol * fwd;
  if (relDCol < -1 || relDCol > 1 || rawDRow < -1 || rawDRow > 1) return false;
  const mask = hitToMask(card.hit);
  return !!(mask & (1 << ((relDCol + 1) + (rawDRow + 1) * 3)));
}

// ── Card resolve ──────────────────────────────────────────────
function resolveCard(card, owner, target) {
  const ownerPoke  = owner  === state.player ? G.team[G.teamIdx] : G.currentEnemy;
  const targetPoke = target === state.player ? G.team[G.teamIdx] : G.currentEnemy;

  if (card.type === 'MOVE') {
    // MOVE cards cost no EN
    let dir = card.direction;
    if (dir === 'TELEPORT') {
      const radius = card.steps || 2;
      const candidates = [];
      for (let c = 0; c < GRID_COLS; c++)
        for (let r = 0; r < GRID_ROWS; r++) {
          const dist = Math.abs(c - owner.pos.col) + Math.abs(r - owner.pos.row);
          if (dist > 0 && dist <= radius) candidates.push({ col: c, row: r });
        }
      if (candidates.length) owner.pos = candidates[Math.floor(Math.random() * candidates.length)];
      return;
    }
    if (dir === 'AUTO') dir = resolveAutoDir(owner.pos, target.pos);
    owner.pos = movePos(owner.pos, dir, card.steps);
    return;
  }
  if (card.type === 'ATTACK') {
    if (owner.en < card.en) return;
    owner.en = Math.max(0, owner.en - card.en);
    const isPlayer = (owner === state.player);
    if (owner !== target && isHit(owner.pos, target.pos, card, isPlayer)) {
      const dmgHp      = calcDamage(card, ownerPoke, targetPoke);
      const shielded   = Math.min(dmgHp, target.shield);
      target.shield    = Math.max(0, target.shield - dmgHp);
      const netDmgHp   = dmgHp - shielded;
      const dmgPct     = (netDmgHp / (targetPoke.maxHp || 1)) * 100;
      target.dm        = Math.max(0, target.dm - dmgPct);
      target.lastDmgHp = (target.lastDmgHp || 0) + netDmgHp;
    }
    return;
  }
  if (card.type === 'GUARD') {
    if (owner.en < card.en) return;
    owner.en     = Math.max(0, owner.en - card.en);
    owner.shield = (owner.shield || 0) + (card.guardAmt || 15);
    return;
  }
  if (card.type === 'HEAL') {
    if (owner.en < card.en) return;
    owner.en = Math.max(0, owner.en - card.en);
    if (card.healAmt) {
      const healHp  = card.healAmt;
      const healPct = (healHp / (ownerPoke?.maxHp || 1)) * 100;
      owner.dm = Math.min(100, owner.dm + healPct);
    }
    if (card.enHealPct) owner.en = Math.min(100, owner.en + card.enHealPct);
    return;
  }
  if (card.type === 'SWAP') {
    const idx = card.swapTo;
    if (idx === undefined || idx === G.teamIdx || !G.team[idx] || G.team[idx].hp <= 0) return;
    const cur = G.team[G.teamIdx];
    cur.hp = Math.round(owner.dm / 100 * cur.maxHp);
    G.teamIdx = idx;
    const next = G.team[idx];
    owner.dm = Math.round(next.hp / next.maxHp * 100);
    owner.en = 100;
    return;
  }
}

function resolveSimultaneous(playerCard, aiCard) {
  if (playerCard.type === 'ATTACK' && aiCard.type === 'ATTACK') {
    const pPos = { ...state.player.pos };
    const aPos = { ...state.ai.pos };
    const pCan = state.player.en >= playerCard.en;
    const aCan = state.ai.en     >= aiCard.en;
    let pDmg = 0, aDmg = 0;
    if (pCan && isHit(pPos, aPos, playerCard, true)) {
      const pHp = calcDamage(playerCard, G.team[G.teamIdx], G.currentEnemy);
      pDmg = Math.max(0, pHp - state.ai.shield);
      state.ai.shield = Math.max(0, state.ai.shield - pHp);
      state.ai.lastDmgHp = (state.ai.lastDmgHp || 0) + pDmg;
      pDmg = (pDmg / (G.currentEnemy.maxHp || 1)) * 100;
    }
    if (aCan && isHit(aPos, pPos, aiCard, false)) {
      const aHp = calcDamage(aiCard, G.currentEnemy, G.team[G.teamIdx]);
      aDmg = Math.max(0, aHp - state.player.shield);
      state.player.shield = Math.max(0, state.player.shield - aHp);
      state.player.lastDmgHp = (state.player.lastDmgHp || 0) + aDmg;
      aDmg = (aDmg / (G.team[G.teamIdx].maxHp || 1)) * 100;
    }
    if (pCan) state.player.en = Math.max(0, state.player.en - playerCard.en);
    if (aCan) state.ai.en     = Math.max(0, state.ai.en     - aiCard.en);
    state.ai.dm     = Math.max(0, state.ai.dm     - pDmg);
    state.player.dm = Math.max(0, state.player.dm - aDmg);
    return;
  }
  // Fallback: resolve sequentially
  resolveCard(playerCard, state.player, state.ai);
  resolveCard(aiCard,    state.ai,    state.player);
}

function resolveTurn(playerCard, aiCard) {
  state.player.shield    = 0;
  state.ai.shield        = 0;
  state.player.lastDmgHp = 0;
  state.ai.lastDmgHp     = 0;
  const pPrio = CARD_PRIORITY[playerCard.type] || 9;
  const aPrio = CARD_PRIORITY[aiCard.type]     || 9;
  if (pPrio < aPrio) {
    resolveCard(playerCard, state.player, state.ai);
    resolveCard(aiCard,    state.ai,    state.player);
  } else if (aPrio < pPrio) {
    resolveCard(aiCard,    state.ai,    state.player);
    resolveCard(playerCard, state.player, state.ai);
  } else {
    resolveSimultaneous(playerCard, aiCard);
  }
}

// ── Win check ─────────────────────────────────────────────────
function checkWin() {
  if (state.player.dm < 0.5 && state.ai.dm < 0.5) return 'draw';
  if (state.player.dm < 0.5) return 'lose';
  if (state.ai.dm     < 0.5) return 'win';
  return null;
}

// ── Screen management ─────────────────────────────────────────
const HUD_SCREENS = new Set(['screen-card-select', 'screen-battle']);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'flex';
  const hud = document.getElementById('shared-hud');
  if (!hud) return;
  hud.style.display = HUD_SCREENS.has(id) ? 'flex' : 'none';
  if (HUD_SCREENS.has(id)) {
    requestAnimationFrame(() =>
      document.documentElement.style.setProperty('--hud-h', hud.offsetHeight + 'px')
    );
  }
}

// ── HUD update ────────────────────────────────────────────────
function hpBarColor(pct) {
  if (pct > 50) return '#44cc44';
  if (pct > 25) return '#cccc00';
  return '#cc2222';
}

function updateHUD() {
  const poke  = G.team[G.teamIdx];
  const enemy = G.currentEnemy;
  document.querySelectorAll('.js-player-name').forEach(el =>
    el.textContent = poke  ? `${poke.name} Lv.${poke.level}` : '-');
  document.querySelectorAll('.js-ai-name').forEach(el =>
    el.textContent = enemy ? `${enemy.isRocket ? '로켓단 ' : ''}${enemy.name} Lv.${enemy.level}` : '-');

  const playerMaxHp = poke?.maxHp || 100;
  const enemyMaxHp  = enemy?.maxHp || 100;
  const playerHp    = Math.max(0, Math.round(state.player.dm / 100 * playerMaxHp));
  const enemyHp     = Math.max(0, Math.round(state.ai.dm    / 100 * enemyMaxHp));
  const playerDmPct = Math.max(0, state.player.dm);
  const aiDmPct     = Math.max(0, state.ai.dm);

  document.querySelectorAll('.js-dm-player').forEach(el => {
    el.style.width      = playerDmPct + '%';
    el.style.background = hpBarColor(playerDmPct);
  });
  document.querySelectorAll('.js-dm-player-val').forEach(el => el.textContent = `${playerHp}/${playerMaxHp}`);
  document.querySelectorAll('.js-dm-ai').forEach(el => {
    el.style.width      = aiDmPct + '%';
    el.style.background = hpBarColor(aiDmPct);
  });
  document.querySelectorAll('.js-dm-ai-val').forEach(el => el.textContent = `${enemyHp}/${enemyMaxHp}`);

  const setEnBar = (bc, vc, val) => {
    document.querySelectorAll(bc).forEach(el => el.style.width = Math.max(0,val)+'%');
    document.querySelectorAll(vc).forEach(el => el.textContent = Math.max(0,Math.round(val)));
  };
  setEnBar('.js-en-player', '.js-en-player-val', state.player.en);
  setEnBar('.js-en-ai', '.js-en-ai-val', state.ai.en);
  document.querySelectorAll('.js-round').forEach(el => el.textContent = state.round);

  // EXP bar — player only
  const expPct = poke ? Math.min(100, Math.round((poke.exp / (poke.nextExp || 1)) * 100)) : 0;
  document.querySelectorAll('.js-exp-player').forEach(el => el.style.width = expPct + '%');
  document.querySelectorAll('.js-exp-player-val').forEach(el =>
    el.textContent = poke ? `${poke.exp}/${poke.nextExp}` : '0/0'
  );
}

// ── Grid rendering ────────────────────────────────────────────
function renderGrid(skipChars = false) {
  const field = document.getElementById('grid-field');
  if (!field) return;
  field.innerHTML = '';
  for (let r = 0; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.col = c; cell.dataset.row = r;
      field.appendChild(cell);
    }
  if (!skipChars) renderCharacters();
}

function highlightAttackRange(attackerPos, defenderPos, card, isPlayerAttacking = true) {
  const fwd = isPlayerAttacking ? 1 : -1;
  for (const [dc, dr] of hitMaskToArray(hitToMask(card.hit))) {
    const col = attackerPos.col + dc * fwd;
    const row = attackerPos.row + dr;
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) continue;
    const cell = document.querySelector(`.grid-cell[data-col="${col}"][data-row="${row}"]`);
    if (cell) { cell.classList.add('cell-hit'); setTimeout(() => cell.classList.remove('cell-hit'), 1000); }
  }
}

function renderMiniGrid() {
  const mg = document.getElementById('mini-grid');
  if (!mg) return;
  mg.innerHTML = '';
  for (let r = 0; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'mini-cell';
      if (state.player.pos.col===c && state.player.pos.row===r) cell.classList.add('cell-player');
      if (state.ai.pos.col   ===c && state.ai.pos.row   ===r) cell.classList.add('cell-ai');
      mg.appendChild(cell);
    }
}

// Always 3×3 grid; hitArray = [[dc,dr],...] in forward reference frame
// dc positive = right (toward enemy for player), dr positive = down
// Center cell = attacker (dc=0, dr=0), never shown as hit
function buildHitmap(hitArray) {
  const wrap = document.createElement('div');
  wrap.className = 'card-hitmap-grid';
  wrap.style.gridTemplateColumns = 'repeat(3, 9px)';
  wrap.style.gridTemplateRows    = 'repeat(3, 9px)';
  const mask = hitToMask(hitArray); const hitSet = new Set(hitMaskToArray(mask).map(([dc,dr]) => `${dc},${dr}`));
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const cell = document.createElement('div');
      const isCenter = dc === 0 && dr === 0;
      cell.className = !isCenter && hitSet.has(`${dc},${dr}`)
        ? 'card-hitmap-cell hitmap-hit'
        : 'card-hitmap-cell';
      wrap.appendChild(cell);
    }
  }
  return wrap;
}

// ── cycle-015: 새 카드 hitmap (12px 셀) ───────────────────────
function buildHitmapEl(card) {
  const wrap = document.createElement('div');
  wrap.className = 'card-hitmap';
  const OFFSETS = [
    [-1,-1],[0,-1],[1,-1],
    [-1, 0],[0, 0],[1, 0],
    [-1, 1],[0, 1],[1, 1],
  ];
  const mask = hitToMask(card.hit); const hitSet = new Set(hitMaskToArray(mask).map(([dc,dr]) => `${dc},${dr}`));
  OFFSETS.forEach(([dc,dr]) => {
    const cell = document.createElement('div');
    cell.className = 'hm-cell';
    const key = `${dc},${dr}`;
    if (dc === 0 && dr === 0) {
      cell.classList.add(hitSet.has(key) ? 'hit' : 'self');
    } else if (hitSet.has(key)) {
      cell.classList.add('hit');
    }
    wrap.appendChild(cell);
  });
  return wrap;
}

// ── cycle-015: portrait를 div에 background로 적용 ─────────────
function _applyPortraitToDiv(divEl, poke) {
  if (!poke || !poke.char) return;
  try {
    const [pCol, pRow] = (poke.portrait && poke.portrait.normal) ? poke.portrait.normal : [0, 0];
    divEl.style.backgroundImage    = `url('assets/chars/${poke.char}/portrait.png')`;
    divEl.style.backgroundPosition = `${-pCol * 80}px ${-pRow * 80}px`;
    divEl.style.backgroundSize     = '400px auto';
    divEl.style.backgroundRepeat   = 'no-repeat';
  } catch(e) { /* portrait 없으면 빈 영역 */ }
}

// ── cycle-015: 새 카드 엘리먼트 빌더 ─────────────────────────
function buildCardEl(card, idx, shortcutLabel, context = 'player') {
  const el = document.createElement('div');
  const isMoveCard = card.cat === 'MOVE' || card.type === 'MOVE';
  const isSwapCard = card.cat === 'SWAP' || card.type === 'SWAP';
  el.className = 'card-item' + (isMoveCard ? ' card-move' : '') + (isSwapCard ? ' card-swap' : '');
  el.dataset.cardId = card.id || card.name;

  // 단축키 뱃지
  if (shortcutLabel) {
    const badge = document.createElement('span');
    badge.className = 'card-shortcut-badge';
    badge.textContent = shortcutLabel;
    el.appendChild(badge);
  }

  if (isMoveCard) {
    // MOVE 카드: 방향 아이콘을 중간 박스 내부에 표시
    const MOVE_DIR_ICONS = { UP:'↑', DOWN:'↓', LEFT:'←', RIGHT:'→', up:'↑', down:'↓', left:'←', right:'→', AUTO:'⊕', TELEPORT:'✦' };
    const middleBox = document.createElement('div');
    middleBox.className = 'card-middle-box';
    const iconEl = document.createElement('div');
    iconEl.className = 'card-move-direction-icon';
    iconEl.textContent = MOVE_DIR_ICONS[card.direction] || '↕';
    middleBox.appendChild(iconEl);
    el.appendChild(middleBox);
    const label = document.createElement('div');
    label.textContent = 'MOVE';
    label.style.fontSize = '11px';
    label.style.position = 'absolute';
    label.style.bottom = '6px';
    label.style.left = '50%';
    label.style.transform = 'translateX(-50%)';
    el.appendChild(label);
  } else if (isSwapCard) {
    const target = G.team[card.swapTo !== undefined ? card.swapTo : card.swapToIdx];
    // 포켓몬 이름 — 기술명 자리
    const swapNameEl = document.createElement('span');
    swapNameEl.className = 'card-move-name';
    swapNameEl.textContent = target ? (target.name || '') : '';
    el.appendChild(swapNameEl);
    // 중간 박스: portrait 꽉 채움
    const middleBox = document.createElement('div');
    middleBox.className = 'card-middle-box';
    if (target) {
      const portraitEl = document.createElement('div');
      portraitEl.className = 'card-swap-portrait';
      _applyPortraitToDiv(portraitEl, target);
      middleBox.appendChild(portraitEl);
    }
    el.appendChild(middleBox);
    // 하단: SWAP 텍스트
    const cardBottom = document.createElement('div');
    cardBottom.className = 'card-bottom';
    const swapLabel = document.createElement('div');
    swapLabel.className = 'card-stats-block';
    swapLabel.style.cssText = 'text-align:center;color:#aaf;font-weight:bold;font-size:0.7rem;letter-spacing:2px;';
    swapLabel.textContent = 'SWAP';
    cardBottom.appendChild(swapLabel);
    el.appendChild(cardBottom);
  } else {
    // ATTACK/GUARD/HEAL 카드
    // 기술명
    const nameEl = document.createElement('span');
    nameEl.className = 'card-move-name';
    nameEl.textContent = card.name;
    el.appendChild(nameEl);

    // 타입 뱃지
    const typeBadge = document.createElement('span');
    typeBadge.className = 'card-type-badge';
    typeBadge.textContent = card.moveType || card.type || '';
    typeBadge.style.background = typeColor(card.moveType || card.type || '');
    el.appendChild(typeBadge);

    // 중간 박스 구역 (ATTACK/GUARD/HEAL — 비어 있음)
    const middleBox = document.createElement('div');
    middleBox.className = 'card-middle-box';
    el.appendChild(middleBox);

    // 하단 좌측: PW/EN/DM 또는 효과 요약
    const cardBottom = document.createElement('div');
    cardBottom.className = 'card-bottom';

    const statsEl = document.createElement('div');
    statsEl.className = 'card-stats-block';
    const cardCat = card.cat || card.type;
    if (cardCat === 'ATTACK') {
      const pwRow = document.createElement('div');
      pwRow.textContent = `PW${card.power ?? 0}`;
      statsEl.appendChild(pwRow);
      const dmRow = document.createElement('div');
      dmRow.className = 'dm-row';
      try {
        let dmVal;
        if (context === 'ai') {
          dmVal = (G.currentEnemy && G.team[G.teamIdx])
            ? Math.round(calcDamage(card, G.currentEnemy, G.team[G.teamIdx]))
            : '?';
        } else {
          dmVal = G.currentEnemy
            ? Math.round(calcDamage(card, G.team[G.teamIdx], G.currentEnemy))
            : '?';
        }
        dmRow.textContent = `└ DM${dmVal}`;
      } catch(e) { dmRow.textContent = '└ DM?'; }
      statsEl.appendChild(dmRow);
      const enRow = document.createElement('div');
      enRow.textContent = `EN${card.en ?? 0}`;
      statsEl.appendChild(enRow);
    } else if (cardCat === 'GUARD') {
      const enRow = document.createElement('div');
      enRow.textContent = `EN${card.en ?? 0}`;
      statsEl.appendChild(enRow);
      const row = document.createElement('div');
      row.textContent = `SHIELD ${card.guardAmt ?? 15}`;
      statsEl.appendChild(row);
    } else if (cardCat === 'HEAL') {
      const enRow = document.createElement('div');
      enRow.textContent = `EN${card.en ?? 0}`;
      statsEl.appendChild(enRow);
      const row = document.createElement('div');
      if (card.healAmt)        row.textContent = `HEAL +${card.healAmt}`;
      else if (card.enHealPct) row.textContent = `EN +${card.enHealPct}`;
      else                     row.textContent = 'HEAL';
      statsEl.appendChild(row);
    }
    cardBottom.appendChild(statsEl);

    // 하단 우측: hitmap
    if (hitToMask(card.hit)) {
      const hitmapEl = buildHitmapEl(card);
      cardBottom.appendChild(hitmapEl);
    }
    
    el.appendChild(cardBottom);
  }

  return el;
}

// ── Character overlay ─────────────────────────────────────────
const SPRITE_PIXEL_SCALE = 3;

// Sprite row visual directions (no CSS): row2=RIGHT, row6=LEFT, row0=DOWN, row4=UP
// Player has CSS scaleX(-1), so horizontal is visually mirrored → pass flipH=true
// flipH negates dCol so the same row-lookup table works for both sides
function calcFacing(fromPos, toPos, flipH = false) {
  let dCol = toPos.col - fromPos.col;
  const dRow = toPos.row - fromPos.row;
  if (flipH) dCol = -dCol;
  if (dCol === 0 && dRow === 0) return null;
  if (dCol === 0) return dRow > 0 ? 0 : 4;
  const ratio = Math.abs(dRow / dCol);
  if (ratio < 0.5)  return dCol > 0 ? 2 : 6;
  if (ratio > 1.5)  return dRow > 0 ? 0 : 4;
  if (dCol > 0) return dRow > 0 ? 1 : 3;
  return dRow > 0 ? 7 : 5;
}

function updateFacing() {
  if (!state?.player?.pos || !state?.ai?.pos) return;
  setSpriteFacing('char-player', calcFacing(state.player.pos, state.ai.pos, true)  ?? 6);
  setSpriteFacing('char-ai',     calcFacing(state.ai.pos,    state.player.pos, false) ?? 6);
}

// xOffset: fraction of cellW from center (-0.25 = left quarter, +0.25 = right quarter)
function positionCharBlock(id, pos, instant = false, xOffset = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  const overlay = document.getElementById('char-overlay');
  const rect = overlay.getBoundingClientRect();
  if (!rect.width) return;
  const cellW = rect.width  / GRID_COLS;
  const cellH = rect.height / GRID_ROWS;
  const cx = (pos.col + 0.5 + xOffset) * cellW;
  const cy = (pos.row + 0.5) * cellH;
  const dispW = (el.width  || 32) * SPRITE_PIXEL_SCALE;
  const dispH = (el.height || 40) * SPRITE_PIXEL_SCALE;
  el.style.width  = dispW + 'px';
  el.style.height = dispH + 'px';
  if (instant) el.classList.add('no-transition');
  el.style.left = cx + 'px';
  el.style.top  = cy + 'px';
  if (instant) void el.offsetLeft;
  if (instant) el.classList.remove('no-transition');
}

function renderCharacters() {
  const sameCell = state.player.pos.col === state.ai.pos.col && state.player.pos.row === state.ai.pos.row;
  positionCharBlock('char-player', state.player.pos, false, sameCell ? -0.25 : 0);
  positionCharBlock('char-ai',    state.ai.pos,    false, sameCell ?  0.25 : 0);
  updateFacing();
}

// ── Sprite animation dispatch ─────────────────────────────────
function _playSpriteForCards(playerCard, aiCard, pPos, aPos) {
  const idle = id => idleSprite(id);
  if (playerCard.type === 'MOVE') {
    playSprite('char-player', 'Walk', { loop:false, onComplete:() => idle('char-player') });
  } else if (playerCard.type === 'ATTACK') {
    playSprite('char-player', 'Attack', { loop:false, onComplete:() => idle('char-player') });
    if (isHit(pPos, aPos, playerCard, true)) {
      setTimeout(() => { playSprite('char-ai','Hurt',{loop:false,onComplete:()=>idle('char-ai')}); flashHurtPortrait('ai'); }, 350);
    }
  } else if (playerCard.type === 'GUARD' || playerCard.type === 'HEAL') {
    playSprite('char-player', 'Charge', { loop:false, onComplete:() => idle('char-player') });
  } else if (playerCard.type === 'SWAP') {
    // Re-init sprite for new team member after swap
    initSprite('char-player', 6, G.team[G.teamIdx]).then(() => idleSprite('char-player'));
    initPortraits();
  }
  if (aiCard.type === 'MOVE') {
    playSprite('char-ai', 'Walk', { loop:false, onComplete:() => idle('char-ai') });
  } else if (aiCard.type === 'ATTACK') {
    playSprite('char-ai', 'Attack', { loop:false, onComplete:() => idle('char-ai') });
    if (isHit(aPos, pPos, aiCard, false)) {
      setTimeout(() => { playSprite('char-player','Hurt',{loop:false,onComplete:()=>idle('char-player')}); flashHurtPortrait('player'); }, 350);
    }
  } else if (aiCard.type === 'GUARD' || aiCard.type === 'HEAL') {
    playSprite('char-ai', 'Charge', { loop:false, onComplete:() => idle('char-ai') });
  } else if (aiCard.type === 'SWAP') {
    idleSprite('char-ai');
  }
}

// ── Card reveal ───────────────────────────────────────────────
function showCardReveal(playerCard, aiCard) {
  return new Promise(resolve => {
    const overlay = document.getElementById('card-reveal-overlay');
    const pWrap   = document.getElementById('reveal-player-wrap');
    const aWrap   = document.getElementById('reveal-ai-wrap');

    const pInner  = pWrap?.querySelector('.flip-card-inner');
    const aInner  = aWrap?.querySelector('.flip-card-inner');
    const pFrontEl = pWrap?.querySelector('.flip-card-front');
    const aFrontEl = aWrap?.querySelector('.flip-card-front');

    if (pFrontEl) { pFrontEl.innerHTML = ''; pFrontEl.appendChild(buildCardEl(playerCard, -1, null)); }
    if (aFrontEl) { aFrontEl.innerHTML = ''; aFrontEl.appendChild(buildCardEl(aiCard, -1, null, 'ai')); }

    // 뒷면으로 리셋
    if (pInner) pInner.classList.remove('flipped');
    if (aInner) aInner.classList.remove('flipped');

    overlay.classList.add('active');
    setTimeout(() => {
      // 3D flip
      if (pInner) pInner.classList.add('flipped');
      if (aInner) aInner.classList.add('flipped');
      setTimeout(() => { overlay.classList.remove('active'); resolve(); }, 1200);
    }, 800);
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── SFX ──────────────────────────────────────────────────────
const SFX_ATTACK_MAP = {
  Normal:   'atk_normal',
  Fire:     'atk_fire',
  Water:    'atk_water',
  Grass:    'atk_grass',
  Electric: 'atk_electric',
  Ice:      'atk_ice',
  Fighting: 'atk_fighting',
  Poison:   'atk_poison',
  Ground:   'atk_ground',
  Flying:   'atk_flying',
  Psychic:  'atk_physic',   // 주의: physic (파일명 오기 그대로)
  Bug:      'atk_bug',
  Rock:     'atk_rock',
  Ghost:    'atk_ghost',
  Dragon:   'atk_dragon',
  Dark:     'atk_dark',
  Steel:    'atk_steel',
};

function playSfx(filename) {
  try {
    const a = new Audio('assets/sound/bgm/' + filename + '.mp3');
    a.volume = (typeof window._gameVolume === 'number') ? window._gameVolume : 1.0;
    a.play().catch(() => {});
  } catch(e) {}
}

function sfxAttack(card) {
  const fname = SFX_ATTACK_MAP[card.moveType];
  if (fname) playSfx(fname);
}

function sfxHit(card, defenderPoke) {
  const rawEff  = getTypeEff(card.moveType, defenderPoke.types);
  const typeEff = rawEff === 0    ? 0
                : rawEff <= 0.25  ? 0.66
                : rawEff <= 0.5   ? 0.75
                : rawEff <= 1     ? 1
                : rawEff <= 2     ? 1.5
                : 2;
  if (typeEff >= 1.5) playSfx('atk_mega_hit');
  else                playSfx('atk_hit');
}

function sfxHeal() {
  playSfx('atk_heal');
}

// ── EN dim state ──────────────────────────────────────────────
function updateCardDimState() {
  const baseCards = G.team[G.teamIdx]?.cards || [];
  // 슬롯 순서 기반 EN 시뮬레이션 (HEAL enHealPct 반영, MOVE는 EN 비용 없음)
  let simEN = state.player.en;
  for (const c of state.player.selectedCards) {
    if (c.type === 'MOVE') {
      // MOVE: EN 비용 없음, EN 변화 없음
    } else {
      simEN = Math.max(0, simEN - (c.en || 0));
      if (c.type === 'HEAL' && c.enHealPct > 0) {
        simEN = Math.min(100, simEN + c.enHealPct);
      }
    }
  }

  document.querySelectorAll('.card-item, .card').forEach(cardEl => {
    if (cardEl.closest('#selected-slots')) return; // 선택 슬롯 내 카드는 dimmed 제외
    const cid  = cardEl.dataset.cardId;
    const card = baseCards.find(c => c.id === cid) ||
                 (cid?.startsWith('swap_') ? { id: cid, en: 0, type: 'SWAP' } : null);
    if (!card) return;

    // MOVE 카드: 중복 허용, EN 부족해도 항상 선택 가능
    if (card.type === 'MOVE' || card.cat === 'MOVE') {
      cardEl.classList.remove('dimmed');
      return;
    }

    // 비-MOVE 카드: 이미 선택됨 → dimmed
    const selected = state.player.selectedCards.some(s => s.id === card.id);
    if (selected) { cardEl.classList.add('dimmed'); return; }

    // EN 부족 → dimmed
    const tooBig = card.en > 0 && simEN < card.en;
    cardEl.classList.toggle('dimmed', tooBig);
  });
}

// ── Type color helper ─────────────────────────────────────────
function typeColor(t) { return TYPE_COLORS[t] || '#888'; }

// ── Card keyboard shortcut keys ────────────────────────────────
const CARD_SHORTCUT_KEYS = ['1','2','3','4','5','6','7','8','9','q','w','e','r','t','y','u','i','o','p'];

// ── Card grid rendering (cycle-015: MOVE/SWAP 분리) ───────────
function renderCardGrid() {
  const grid = document.getElementById('card-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const baseCards = G.team[G.teamIdx]?.cards || [];

  // ATTACK/GUARD/HEAL 카드만 card-grid에 렌더링 (1~8 단축키)
  const regularCards = baseCards.filter(c => c.type !== 'MOVE' && c.type !== 'SWAP' && c.cat !== 'MOVE' && c.cat !== 'SWAP');

  regularCards.forEach((card, idx) => {
    const shortcutLabel = ['1','2','3','4','q','w','e','r'][idx] ?? null;
    const cardEl = buildCardEl(card, idx, shortcutLabel);
    cardEl.addEventListener('click', () => onCardClick(card, cardEl));
    grid.appendChild(cardEl);
  });

  // MOVE 구역 / SWAP 구역 렌더링
  renderMoveZone();
  renderSwapZone();

  updateCardDimState();
}

// ── MOVE 구역 렌더링 ──────────────────────────────────────────
const MOVE_ICONS_MAP = { UP:'↑', DOWN:'↓', LEFT:'←', RIGHT:'→', up:'↑', down:'↓', left:'←', right:'→' };

function renderMoveZone() {
  const zone = document.getElementById('move-card-zone');
  if (!zone) return;
  const DIRS = ['UP','DOWN','LEFT','RIGHT'];
  DIRS.forEach(dir => {
    const slot = zone.querySelector(`[data-dir="${dir}"]`);
    if (!slot) return;
    slot.innerHTML = '';
    slot.classList.remove('empty-slot');
    const moveCard = (G.team[G.teamIdx]?.cards || []).find(c =>
      (c.type === 'MOVE' || c.cat === 'MOVE') && c.direction === dir
    );
    if (moveCard) {
      const label = MOVE_ICONS_MAP[dir] || dir;
      const el = buildCardEl(moveCard, -1, label);
      slot.appendChild(el);
      el.addEventListener('click', () => onMoveCardClick(moveCard));
    } else {
      slot.classList.add('empty-slot');
      slot.textContent = MOVE_ICONS_MAP[dir] || dir;
    }
  });
}

// ── SWAP 구역 렌더링 ──────────────────────────────────────────
function renderSwapZone() {
  const zone = document.getElementById('swap-card-zone');
  if (!zone) return;
  zone.innerHTML = '';
  const swapTargets = G.team
    .map((p, i) => ({ poke: p, idx: i }))
    .filter(({ poke, idx }) => idx !== G.teamIdx && poke.hp > 0)
    .slice(0, 2);

  ['9', '0'].forEach((key, i) => {
    const slot = document.createElement('div');
    slot.className = 'swap-slot';
    const target = swapTargets[i];
    if (target) {
      const swapCard = {
        id: `swap_${target.idx}`,
        name: target.poke.name,
        type: 'SWAP', cat: 'SWAP',
        moveType: 'Normal',
        swapTo: target.idx, swapToIdx: target.idx,
        power: 0, en: 0, hit: 0,
        steps: 0, direction: null,
        healAmt: 0, guardAmt: 0, enHealPct: 0,
      };
      const el = buildCardEl(swapCard, -1, key);
      slot.appendChild(el);
      el.addEventListener('click', () => onCardClick(swapCard, el));
    } else {
      slot.classList.add('empty-slot');
      slot.textContent = key;
    }
    zone.appendChild(slot);
  });
}

// ── 선택 슬롯 렌더링 (cycle-015: 실제 카드 스타일) ───────────
function renderSelectedSlots() {
  const isSwapSelected = state.player.selectedCards.length > 0 && state.player.selectedCards[0]?.type === 'SWAP';
  for (let i = 0; i < 3; i++) {
    const slotEl = document.getElementById(`slot-${i}`);
    if (!slotEl) continue;
    slotEl.innerHTML = '';
    slotEl.classList.remove('slot-swap-locked');
    const card = state.player.selectedCards[i];
    if (card) {
      const el = buildCardEl(card, i, null);
      slotEl.appendChild(el);
      slotEl.classList.remove('empty-slot');
      // SWAP 카드 슬롯은 클릭으로 제거 불가 (CLEAR 버튼으로만 취소)
      if (!isSwapSelected) {
        slotEl.addEventListener('click', () => removeSlot(i), { once: true });
      }
    } else if (isSwapSelected && i > 0) {
      // SWAP 선택됨 — 추가 선택 불가 슬롯
      slotEl.classList.remove('empty-slot');
      slotEl.classList.add('slot-swap-locked');
      const xMark = document.createElement('span');
      xMark.textContent = '×';
      xMark.style.cssText = 'color:#c44;font-size:32px;font-weight:bold;line-height:1;';
      slotEl.appendChild(xMark);
    } else {
      slotEl.classList.add('empty-slot');
      const numLabel = document.createElement('span');
      numLabel.textContent = ['01','02','03'][i];
      numLabel.style.cssText = 'color:#555;font-size:16px;';
      slotEl.appendChild(numLabel);
    }
  }
}

// ── MOVE 카드 토글 ────────────────────────────────────────────
function onMoveCardClick(moveCard) {
  // MOVE 카드는 중복 배치 가능, 3장 슬롯에 배치
  const grid = document.getElementById('card-grid');
  if (grid && grid.dataset.swapLocked === '1') return;
  if (state.player.selectedCards.length >= 3) return;
  state.player.selectedCards.push(moveCard);
  renderSelectedSlots();
  updateCardDimState();
  if (state.player.selectedCards.length === 3) {
    const btn = document.getElementById('btn-continue');
    if (btn) btn.disabled = false;
  }
}

function onCardClick(card, cardEl) {
  if (cardEl && cardEl.classList.contains('dimmed')) return;

  // SWAP 카드: 카드 선택 화면에서 즉시 팀 교체 + 선택 잠금
  if (card.type === 'SWAP') {
    const idx = card.swapTo;
    if (idx === undefined || !G.team[idx] || G.team[idx].hp <= 0) return;
    const grid = document.getElementById('card-grid');
    // 이미 교체된 상태면 무시 (다른 SWAP 카드 클릭 방지)
    if (grid && grid.dataset.swapLocked === '1') return;
    // 원래 상태 저장 (CLEAR로 되돌릴 수 있도록)
    if (grid) {
      grid.dataset.preSwapIdx = G.teamIdx;
      grid.dataset.preSwapDm  = state.player.dm;
      grid.dataset.preSwapEn  = state.player.en;
    }
    // 현재 포켓몬 HP 동기화
    G.team[G.teamIdx].hp = Math.round(state.player.dm / 100 * G.team[G.teamIdx].maxHp);
    G.teamIdx = idx;
    const next = G.team[idx];
    state.player.dm = Math.round(next.hp / next.maxHp * 100);
    state.player.en = 100;
    // SWAP 카드를 슬롯 0에 배치 (슬롯 1·2는 X 표시)
    state.player.selectedCards = [card];
    redrawSlots();
    // HUD, 카드 그리드 갱신
    updateHUD();
    initPortraits();
    renderCardGrid();
    // 카드 그리드 잠금 (모든 카드 dim — 추가 선택 불가)
    if (grid) {
      grid.dataset.swapLocked = '1';
      document.querySelectorAll('#card-grid .card').forEach(el => el.classList.add('dimmed'));
    }
    // btn-continue 즉시 활성화
    document.getElementById('btn-continue').disabled = false;
    return;
  }

  // 스왑 잠금 상태면 일반 카드 클릭 무시
  const grid = document.getElementById('card-grid');
  if (grid && grid.dataset.swapLocked === '1') return;

  if (state.player.selectedCards.length >= 3) return;
  state.player.selectedCards.push(card);
  renderSelectedSlots();
  updateCardDimState();
  if (state.player.selectedCards.length === 3) document.getElementById('btn-continue').disabled = false;
}

function fillSlot(index, cardName) {
  // cycle-015: renderSelectedSlots가 전체 슬롯을 재렌더링하므로 이 함수는 위임
  redrawSlots();
}

// 슬롯 UI를 selectedCards 기준으로 전체 재렌더링
function redrawSlots() {
  // cycle-015: 새 카드 스타일로 렌더링
  if (document.getElementById('slot-0')?.querySelector) {
    renderSelectedSlots();
    return;
  }
  // fallback (legacy)
  const slotLabels = [
    '<span class="slot-num">01</span><div class="slot-label">PLACE CARD HERE</div>',
    '<span class="slot-num">02</span>',
    '<span class="slot-num">03</span>',
  ];
  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById('slot-' + i);
    if (!slot) continue;
    if (i < state.player.selectedCards.length) {
      slot.classList.add('filled');
      const card = state.player.selectedCards[i];
      slot.innerHTML = `<span class="slot-num">${['01','02','03'][i]}</span><div class="slot-card-name">${card.name}</div>`;
    } else {
      slot.classList.remove('filled');
      slot.innerHTML = slotLabels[i];
    }
  }
}

// 슬롯 클릭 시 해당 카드 제거
function removeSlot(index) {
  if (index >= state.player.selectedCards.length) return; // 빈 슬롯 — 아무것도 안 함
  const card = state.player.selectedCards[index];
  // SWAP 카드 제거 → 팀 교체 전체 되돌리기
  if (card && card.type === 'SWAP') { clearCardSelection(); return; }
  state.player.selectedCards.splice(index, 1);
  renderSelectedSlots();
  updateCardDimState();
  document.getElementById('btn-continue').disabled = state.player.selectedCards.length < 3;
}

// ── Card select keyboard shortcuts ────────────────────────────
let _cardKeydownHandler = null;
let _cardKeyupHandler = null;

function attachCardKeyboard() {
  detachCardKeyboard(); // 중복 방지
  _cardKeyupHandler = (e) => {
    if (e.key === 'd' || e.key === 'D' || e.key === 'ㅇ') hideEnemyDeckOverlay();
  };
  document.addEventListener('keyup', _cardKeyupHandler);
  _cardKeydownHandler = (e) => {
    const screen = document.getElementById('screen-card-select');
    if (!screen || screen.style.display === 'none') return;

    // Enter → CONTINUE
    if (e.key === 'Enter') {
      const btn = document.getElementById('btn-continue');
      if (btn && !btn.disabled) btn.click();
      return;
    }
    // d → 상대 덱 오버레이 (누르는 동안만 표시)
    if (e.key === 'd' || e.key === 'D' || e.key === 'ㅇ') {
      e.preventDefault();
      showEnemyDeckOverlay();
      return;
    }
    // d → 마지막 슬롯 제거
    if (e.key === 'Backspace') {
      const len = state.player.selectedCards.length;
      if (len > 0) removeSlot(len - 1);
      return;
    }
    // 방향키 → MOVE 카드 토글 (card-select 화면에서만)
    const dirMap = { ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT' };
    if (dirMap[e.key]) {
      e.preventDefault(); // 스크롤 방지
      const dir = dirMap[e.key];
      const moveCard = (G.team[G.teamIdx]?.cards || []).find(c =>
        (c.type === 'MOVE' || c.cat === 'MOVE') && c.direction === dir
      );
      if (moveCard) onMoveCardClick(moveCard);
      return;
    }
    // 9 → 첫 번째 SWAP, 0 → 두 번째 SWAP
    if (e.key === '9' || e.key === '0') {
      e.preventDefault();
      const swapTargets = G.team
        .map((p, i) => ({ poke: p, idx: i }))
        .filter(({ poke, idx }) => idx !== G.teamIdx && poke.hp > 0);
      const swapIdx = e.key === '9' ? 0 : 1;
      const target = swapTargets[swapIdx];
      if (target) {
        const swapCard = {
          id: `swap_${target.idx}`,
          name: target.poke.name,
          type: 'SWAP', cat: 'SWAP',
          moveType: 'Normal',
          swapTo: target.idx, swapToIdx: target.idx,
          power: 0, en: 0, hit: 0,
          steps: 0, direction: null,
          healAmt: 0, guardAmt: 0, enHealPct: 0,
        };
        const grid = document.getElementById('card-grid');
        if (grid && grid.dataset.swapLocked !== '1') {
          onCardClick(swapCard, document.createElement('div'));
        }
      }
      return;
    }
    // 1~4 q,w,e,r → ATTACK/GUARD/HEAL 카드 선택
    const numMap = {'1':0,'2':1,'3':2,'4':3,'q':4,'w':5,'e':6,'r':7,'ㅂ':4,'ㅈ':5,'ㄷ':6,'ㄱ':7};
    if (numMap[e.key] !== undefined) {
      e.preventDefault();
      const baseCards = G.team[G.teamIdx]?.cards || [];
      const regularCards = baseCards.filter(c => c.type !== 'MOVE' && c.type !== 'SWAP' && c.cat !== 'MOVE' && c.cat !== 'SWAP');
      const card = regularCards[numMap[e.key]];
      if (!card) return;
      const grid = document.getElementById('card-grid');
      const cardEl = grid ? grid.querySelector(`[data-card-id="${card.id}"]`) : null;
      if (cardEl && cardEl.classList.contains('dimmed')) return;
      onCardClick(card, cardEl);
      return;
    }
  };
  document.addEventListener('keydown', _cardKeydownHandler);
}

function detachCardKeyboard() {
  if (_cardKeydownHandler) {
    document.removeEventListener('keydown', _cardKeydownHandler);
    _cardKeydownHandler = null;
  }
  if (_cardKeyupHandler) {
    document.removeEventListener('keyup', _cardKeyupHandler);
    _cardKeyupHandler = null;
  }
  hideEnemyDeckOverlay();
}

function hideEnemyDeckOverlay() {
  document.getElementById('enemy-deck-overlay')?.remove();
}

function showEnemyDeckOverlay() {
  if (document.getElementById('enemy-deck-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'enemy-deck-overlay';
  overlay.addEventListener('click', hideEnemyDeckOverlay);

  const title = document.createElement('div');
  title.className = 'overlay-title';
  title.textContent = 'OPPONENT DECK';
  overlay.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'enemy-deck-grid';
  const enemyCards = (G.currentEnemy?.cards || []).filter(c => c.type !== 'SWAP' && c.cat !== 'SWAP');
  if (enemyCards.length === 0) {
    grid.textContent = 'No cards';
    grid.style.color = '#888';
  } else {
    enemyCards.forEach(card => grid.appendChild(buildCardEl(card, -1, null, 'ai')));
  }
  overlay.appendChild(grid);
  document.body.appendChild(overlay);
}

function clearCardSelection() {
  const grid = document.getElementById('card-grid');
  // SWAP 잠금 상태면 교체 전 상태로 되돌림
  if (grid && grid.dataset.swapLocked === '1') {
    const origIdx = parseInt(grid.dataset.preSwapIdx ?? G.teamIdx, 10);
    const origDm  = parseFloat(grid.dataset.preSwapDm  ?? state.player.dm);
    const origEn  = parseFloat(grid.dataset.preSwapEn  ?? state.player.en);
    // 현재 포켓몬 HP 되돌리기
    G.team[G.teamIdx].hp = Math.round(state.player.dm / 100 * G.team[G.teamIdx].maxHp);
    G.teamIdx       = origIdx;
    state.player.dm = origDm;
    state.player.en = origEn;
    delete grid.dataset.preSwapIdx;
    delete grid.dataset.preSwapDm;
    delete grid.dataset.preSwapEn;
    delete grid.dataset.swapLocked;
    updateHUD();
    initPortraits();
    renderCardGrid();
  } else if (grid) {
    delete grid.dataset.swapLocked;
  }
  state.player.selectedCards = [];
  renderSelectedSlots();
  updateCardDimState();
  document.getElementById('btn-continue').disabled = true;
}

// ── Sprite float-up popup (damage / heal) ─────────────────────
function showSpritePopup(charId, text, type) {
  const charEl  = document.getElementById(charId);
  const overlay = document.getElementById('char-overlay');
  if (!charEl || !overlay) return;
  const popup = document.createElement('div');
  popup.className = `sprite-popup ${type}`;
  popup.textContent = text;
  const left = parseFloat(charEl.style.left) || 50;
  const top  = parseFloat(charEl.style.top)  || 50;
  popup.style.left = left + 'px';
  popup.style.top  = (top - 40) + 'px';
  overlay.appendChild(popup);
  popup.addEventListener('animationend', () => popup.remove());
}

// ── Damage popup ──────────────────────────────────────────────
function showDamagePopup(text) {
  const popup = document.getElementById('damage-popup');
  popup.textContent = text;
  popup.classList.add('visible');
  setTimeout(() => popup.classList.remove('visible'), 1000);
}

// ── Battle card display ───────────────────────────────────────
function buildCardStatsText(card) {
  if (card.type === 'MOVE') return (card.direction||'') + ' ×' + card.steps;
  if (card.type === 'SWAP') return 'Switch: ' + (G.team[card.swapTo]?.name || '?');
  const parts = [];
  if (card.power)      parts.push('PWR '  + card.power);
  if (card.en)         parts.push('EN '   + card.en);
  if (card.healAmt)    parts.push('+' + card.healAmt);
  if (card.enHealPct)  parts.push('EN+' + card.enHealPct);
  if (card.guardAmt)   parts.push('SHIELD ' + card.guardAmt);
  return parts.join('  ');
}

function updateBattleCardDisplay(playerCard, aiCard) {
  // cycle-016: card-item 스타일로 전투 카드 표시
  const pSlot = document.getElementById('battle-player-card');
  if (pSlot) {
    pSlot.innerHTML = '';
    pSlot.appendChild(buildCardEl(playerCard, -1, null));
    pSlot.classList.add('active');
  }
  const aSlot = document.getElementById('battle-ai-card');
  if (aSlot) {
    aSlot.innerHTML = '';
    aSlot.appendChild(buildCardEl(aiCard, -1, null, 'ai'));
    aSlot.classList.add('active');
  }
}

// ── Turn execution ────────────────────────────────────────────

// executeAction: 한 액터(player/ai)의 카드 한 장에 대한 시각 표시 + SFX (순차)
async function executeAction(side, card, myPosBefore, opPosBefore, ownActual, oppActual) {
  const isPlayer  = (side === 'player');
  const charId    = isPlayer ? 'char-player' : 'char-ai';
  const oppCharId = isPlayer ? 'char-ai'     : 'char-player';
  const stateOwner = isPlayer ? state.player : state.ai;

  if (card.type === 'MOVE') {
    renderGrid(true); updateHUD();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const sameCellMove = state.player.pos.col === state.ai.pos.col && state.player.pos.row === state.ai.pos.row;
    positionCharBlock(charId, stateOwner.pos, false, isPlayer ? (sameCellMove ? -0.25 : 0) : (sameCellMove ? 0.25 : 0));
    // Walk: 이동 방향으로 facing
    const walkFacing = calcFacing(myPosBefore, stateOwner.pos, isPlayer) ?? SPRITES?.[charId]?.facing ?? 6;
    setSpriteFacing(charId, walkFacing);
    playSprite(charId, 'Walk', {
      loop: false,
      onComplete: () => {
        updateFacing();        // facing 먼저 — idleSprite가 s.facing을 읽으므로
        idleSprite(charId);
        idleSprite(oppCharId);
      }
    });
    await delay(400);
    showDamagePopup('MOVE!');
    await delay(400);
  }
  else if (card.type === 'GUARD') {
    sfxHeal();
    renderGrid(); updateHUD();
    playSprite(charId, 'Charge', { loop: false, onComplete: () => idleSprite(charId) });
    showSpritePopup(charId, `SHIELD ${card.guardAmt || 15}`, 'heal');
    showDamagePopup('GUARD!');
    await delay(1000);
  }
  else if (card.type === 'HEAL') {
    sfxHeal();
    renderGrid(); updateHUD();
    playSprite(charId, 'Charge', { loop: false, onComplete: () => idleSprite(charId) });
    const ownerPoke = isPlayer ? G.team[G.teamIdx] : G.currentEnemy;
    if (card.healAmt) {
      const healPct       = card.healAmt / (ownerPoke.maxHp || 1) * 100;
      const priorDm       = ownActual?.dmBefore ?? 100;
      const actualHealPct = Math.max(0, Math.min(100, priorDm + healPct) - priorDm);
      const actualHp      = Math.round(actualHealPct * ownerPoke.maxHp / 100);
      showSpritePopup(charId, `+${actualHp}`, 'heal');
    } else if (card.enHealPct) {
      const actualEn = Math.round(Math.max(0, ownActual?.enDelta || 0));
      showSpritePopup(charId, `EN +${actualEn}`, 'heal');
    }
    showDamagePopup(card.enHealPct ? 'EN UP!' : 'HEAL!');
    await delay(1000);
  }
  else if (card.type === 'ATTACK') {
    sfxAttack(card);
    renderGrid(); updateHUD();
    playSprite(charId, 'Attack', { loop: false, onComplete: () => idleSprite(charId) });
    highlightAttackRange(myPosBefore, opPosBefore, card, isPlayer);
    const hit = isHit(myPosBefore, opPosBefore, card, isPlayer);
    showDamagePopup(hit ? 'HIT!' : 'MISS!');
    if (hit) {
      const defenderPoke = isPlayer ? G.currentEnemy : G.team[G.teamIdx];
      const oppState     = isPlayer ? state.ai : state.player;
      const netDmg       = Math.round(oppState.lastDmgHp || 0);
      setTimeout(() => {
        showSpritePopup(oppCharId, `-${netDmg}`, 'dmg');
        playSprite(oppCharId, 'Hurt', { loop: false, onComplete: () => idleSprite(oppCharId) });
        flashHurtPortrait(isPlayer ? 'ai' : 'player');
        sfxHit(card, defenderPoke);
      }, 350);
    }
    await delay(1200);
  }
  else if (card.type === 'SWAP') {
    renderGrid(); updateHUD();
    showDamagePopup('SWAP!');
    // Re-init sprite for new team member after swap
    initSprite(charId, 6, G.team[G.teamIdx]).then(() => idleSprite(charId));
    initPortraits();  // portrait 즉시 갱신
    await delay(800);
  }
}

async function executeTurn(slotIdx) {
  if (slotIdx >= 3) {
    const outcome = checkWin();
    if (outcome) { onBattleOutcome(outcome); return; }
    nextRound(); return;
  }
  // 빈 슬롯(교체 후 pass)은 PASS 카드로 대체
  const _passCard = { id:'pass', name:'PASS', moveType:'Normal', type:'MOVE', power:0, en:0, steps:0, direction:null, healAmt:0, guardAmt:0, enHealPct:0, hit:0 };
  const playerCard = state.player.selectedCards[slotIdx] || _passCard;
  const aiCard     = state.ai.selectedCards[slotIdx]     || _passCard;
  await showCardReveal(playerCard, aiCard);
  updateBattleCardDisplay(playerCard, aiCard);

  // 포지션 스냅샷 (resolveCard 전에 저장)
  const pPosBefore = { ...state.player.pos };
  const aPosBefore = { ...state.ai.pos };

  // 실제 적용값 계산을 위해 상태 스냅샷
  const pDmBefore = state.player.dm;
  const pEnBefore = state.player.en;
  const aDmBefore = state.ai.dm;
  const aEnBefore = state.ai.en;

  // 게임 상태(dm, en, pos) 업데이트는 한번에 처리
  resolveTurn(playerCard, aiCard);

  // resolveTurn 직후 델타 캡처 (auto-swap 이전)
  const pDmAfter = state.player.dm;
  const pEnAfter = state.player.en;
  const aDmAfter = state.ai.dm;
  const aEnAfter = state.ai.en;

  // 포켓몬 사망 자동 교체 (resolveCard 후 dm 확인)
  if (state.player.dm <= 0) {
    const nextAlive = G.team.findIndex((p, i) => i !== G.teamIdx && p.hp > 0);
    if (nextAlive >= 0) {
      G.team[G.teamIdx].hp = 0;
      G.teamIdx = nextAlive;
      const next = G.team[nextAlive];
      state.player.dm = Math.round(next.hp / next.maxHp * 100);
      state.player.en = 100;
      // 스프라이트 및 HUD 갱신
      updateFacing();
      await initSprite('char-player', SPRITES?.['char-player']?.facing ?? 6, next);
      idleSprite('char-player');
      const sameCellSwap = state.player.pos.col === state.ai.pos.col && state.player.pos.row === state.ai.pos.row;
      positionCharBlock('char-player', state.player.pos, true, sameCellSwap ? -0.25 : 0);
      initPortraits();
      updateHUD();
      showDamagePopup(`${next.name} GO!`);
      await delay(800);
    }
    // else: 전원 기절 → checkWin에서 'lose' 처리
  }

  // 이동 후 위치 캡처 (ATTACK executeAction의 명중 판정에 사용)
  const pPosAfter = { ...state.player.pos };
  const aPosAfter = { ...state.ai.pos };

  // 플레이어/AI의 실제 적용값 (팝업용) — dmBefore는 HEAL 표시 시 사용 (net delta는 상대 공격 포함)
  const pActual = { dmDelta: pDmAfter - pDmBefore, enDelta: pEnAfter - pEnBefore, dmBefore: pDmBefore };
  const aActual = { dmDelta: aDmAfter - aDmBefore, enDelta: aEnAfter - aEnBefore, dmBefore: aDmBefore };

  // 시각적 순차 실행: 우선순위에 따라 한 번에 하나씩
  const pPrio = CARD_PRIORITY[playerCard.type] || 9;
  const aPrio = CARD_PRIORITY[aiCard.type]     || 9;

  if (pPrio < aPrio) {
    await executeAction('player', playerCard, pPosBefore, aPosBefore, pActual, aActual);
    if (checkWin()) { updateFacing(); await delay(300); onBattleOutcome(checkWin()); return; }
    await executeAction('ai',     aiCard,     aPosBefore, pPosAfter,  aActual, pActual);
  } else if (aPrio < pPrio) {
    await executeAction('ai',     aiCard,     aPosBefore, pPosBefore, aActual, pActual);
    if (checkWin()) { updateFacing(); await delay(300); onBattleOutcome(checkWin()); return; }
    await executeAction('player', playerCard, pPosBefore, aPosAfter,  pActual, aActual);
  } else {
    await executeAction('player', playerCard, pPosBefore, aPosBefore, pActual, aActual);
    if (checkWin()) { updateFacing(); await delay(300); onBattleOutcome(checkWin()); return; }
    await executeAction('ai',     aiCard,     aPosBefore, pPosAfter,  aActual, pActual);
  }
  // 모든 액션 완료 후 양쪽 모두 상대 방향으로 최종 정렬
  updateFacing();

  const outcome = checkWin();
  if (outcome) { await delay(500); onBattleOutcome(outcome); return; }
  executeTurn(slotIdx + 1);
}

// ── AI card selection (greedy per-slot heuristic) ─────────────
// 매 슬롯마다: 각 카드를 시뮬레이션 → 상태 점수 계산 → softmax 샘플링
//
// 점수 기준:
//   1순위: HP 차이 (내 dm - 상대 dm)
//   2순위: 내 EN (소폭 가중치)
//   포지셔닝: 공격 사거리 내이면 보너스, 멀수록 패널티 → 이동 유도
//   쉴드: 소폭 보너스 (가드 가치 반영)
// 결과: 범위 밖 공격 안 함, EN 부족 시 공격 안 함, 거리 멀면 이동
function aiSelectCardsMinMax() {
  const aiPoke     = G.currentEnemy;
  const playerPoke = G.team[G.teamIdx];
  if (!aiPoke || !playerPoke) return aiSelectCards();

  const pool = (G.currentEnemy?.cards || []).filter(c => c.type !== 'SWAP');
  const TEMP = 5;  // softmax 온도 — 낮을수록 deterministic, 높을수록 random

  const fallback = {
    id:'dash', name:'Dash', type:'MOVE', direction:'AUTO', steps:1,
    en:0, power:0, healAmt:0, guardAmt:0, enHealPct:0,
  };

  // 상태 점수: HP 차이 우선, EN 보조, 포지셔닝(사거리/거리) 보정
  function evalState(s) {
    if (s.ai.dm <= 0)     return -1000;
    if (s.player.dm <= 0) return  1000;
    const dist = Math.abs(s.ai.pos.col - s.player.pos.col)
               + Math.abs(s.ai.pos.row - s.player.pos.row);
    const canAttack = pool.some(c =>
      c.type === 'ATTACK' && (c.en || 0) <= s.ai.en && isHit(s.ai.pos, s.player.pos, c, false)
    );
    return (s.ai.dm - s.player.dm)         // 1순위: HP 차이
         + s.ai.en * 0.1                   // 2순위: EN (소폭)
         + (s.ai.shield || 0) * 0.3        // 쉴드 가치
         + (canAttack ? 8 : -dist * 3);    // 사거리 내: 보너스 / 밖: 거리 패널티
  }

  // 카드 한 장을 시뮬레이션한 다음 상태 반환 (원본 s 불변)
  function simCard(card, s) {
    const ns = {
      ai:     { dm: s.ai.dm,     en: s.ai.en,     shield: s.ai.shield || 0,     pos: { ...s.ai.pos     } },
      player: { dm: s.player.dm, en: s.player.en, shield: s.player.shield || 0, pos: { ...s.player.pos } },
    };
    if (card.type === 'MOVE') {
      let dir = card.direction;
      if (dir === 'TELEPORT' || dir === 'AUTO') dir = resolveAutoDir(ns.ai.pos, ns.player.pos);
      if (dir) ns.ai.pos = movePos(ns.ai.pos, dir, card.steps || 0);
    } else if ((card.en || 0) <= ns.ai.en) {
      ns.ai.en = Math.max(0, ns.ai.en - (card.en || 0));
      if (card.type === 'ATTACK') {
        if (isHit(ns.ai.pos, ns.player.pos, card, false)) {
          const dmg      = calcDamage(card, aiPoke, playerPoke);
          const shielded = Math.min(dmg, ns.player.shield);
          ns.player.shield = Math.max(0, ns.player.shield - dmg);
          ns.player.dm     = Math.max(0, ns.player.dm - ((dmg - shielded) / (playerPoke.maxHp || 1)) * 100);
        }
      } else if (card.type === 'HEAL') {
        if (card.healAmt)   ns.ai.dm = Math.min(100, ns.ai.dm + (card.healAmt / (aiPoke.maxHp || 1)) * 100);
        if (card.enHealPct) ns.ai.en = Math.min(100, ns.ai.en + card.enHealPct);
      } else if (card.type === 'GUARD') {
        ns.ai.shield += (card.guardAmt || 15);
      }
    }
    return ns;
  }

  // softmax 샘플링
  function softmaxPick(scored) {
    if (!scored.length) return null;
    const maxS = Math.max(...scored.map(x => x.score));
    const ws   = scored.map(x => Math.exp((x.score - maxS) / TEMP));
    const tot  = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < ws.length; i++) {
      r -= ws[i];
      if (r <= 0) return scored[i].card;
    }
    return scored[scored.length - 1].card;
  }

  const combo = [];
  let s = {
    ai:     { dm: state.ai.dm,     en: state.ai.en,     shield: 0, pos: { ...state.ai.pos     } },
    player: { dm: state.player.dm, en: state.player.en, shield: 0, pos: { ...state.player.pos } },
  };

  for (let slot = 0; slot < 3; slot++) {
    // EN 부족한 비-MOVE 카드는 제외
    const affordable = pool.filter(c => c.type === 'MOVE' || (c.en || 0) <= s.ai.en);
    if (!affordable.length) { combo.push({ ...fallback }); continue; }

    // 각 카드를 시뮬레이션해서 점수 비교
    const scored = affordable.map(card => ({ card, score: evalState(simCard(card, s)) }));
    const chosen = softmaxPick(scored) ?? { ...fallback };
    combo.push(chosen);

    // 다음 슬롯을 위해 시뮬레이션 상태 갱신
    s = simCard(chosen, s);
  }

  return combo;
}

// ── AI card selection (heuristic fallback) ────────────────────
function aiSelectCards() {
  const deck     = (G.currentEnemy?.cards || []).filter(c => c.type !== 'SWAP').slice();
  const selected = [];
  let simAiEN    = state.ai.en;  // EN 시뮬레이션

  // MOVE 카드는 EN 비용 없음 (항상 선택 가능)
  function canAfford(card) {
    if (card.type === 'MOVE') return true;
    return simAiEN >= (card.en || 0);
  }

  function pick(card) {
    selected.push(card);
    deck.splice(deck.indexOf(card), 1);
    if (card.type !== 'MOVE') simAiEN = Math.max(0, simAiEN - (card.en || 0));
    if (card.type === 'HEAL' && card.enHealPct) simAiEN = Math.min(100, simAiEN + card.enHealPct);
  }

  // 1. EN 회복 우선 (EN < 20)
  if (selected.length < 3 && state.ai.en < 20) {
    const healEn = deck.find(c => c.enHealPct > 0 && canAfford(c));
    if (healEn) pick(healEn);
  }
  // 2. GUARD/HEAL 우선 (HP 낮을 때)
  if (selected.length < 3 && state.ai.dm < 35) {
    const def = deck.find(c => (c.type === 'GUARD' || c.type === 'HEAL') && canAfford(c));
    if (def) pick(def);
  }
  // 3. ATTACK 우선 (범위 내)
  if (selected.length < 3) {
    const atks = deck.filter(c => c.type === 'ATTACK' && canAfford(c)
      && isHit(state.ai.pos, state.player.pos, c, false)).sort((a,b) => b.power - a.power);
    if (atks.length) pick(atks[0]);
  }
  // 4. MOVE (거리 멀 때)
  if (selected.length < 3) {
    const dist = Math.abs(state.player.pos.col - state.ai.pos.col) + Math.abs(state.player.pos.row - state.ai.pos.row);
    if (dist >= 2) { const mv = deck.find(c => c.type === 'MOVE'); if (mv) pick(mv); }
  }
  // 5. 나머지 — EN 가능한 카드 중 power 높은 순
  while (selected.length < 3 && deck.length) {
    const affordable = deck.filter(c => canAfford(c));
    if (affordable.length) {
      const sorted = affordable.slice().sort((a,b) => (b.power||0) - (a.power||0));
      pick(sorted[0]);
    } else {
      // EN 부족 — MOVE 카드로 대체
      const mv = deck.find(c => c.type === 'MOVE');
      if (mv) pick(mv); else break;
    }
  }

  const fallback = { id:'dash', name:'Dash', moveType:'Normal', type:'MOVE',
    power:0, en:0, steps:1, direction:'AUTO', healAmt:0, guardAmt:0, enHealPct:0 };
  while (selected.length < 3) selected.push({ ...fallback });
  return selected;
}

// ── Portrait system ───────────────────────────────────────────
const PORTRAIT_CELL  = 40;
const PORTRAIT_SCALE = 2;

function initPortraits() { _applyPortrait('player','normal'); _applyPortrait('ai','normal'); }
function setPortrait(side, expr) { _applyPortrait(side, expr); }

function _applyPortrait(side, expr) {
  const poke = side === 'player' ? G.team[G.teamIdx] : G.currentEnemy;
  const el   = document.getElementById(side==='player' ? 'js-portrait-player' : 'js-portrait-ai');
  if (!el) return;
  if (!poke || !poke.portrait) { el.style.backgroundImage='none'; return; }
  const [col, row] = poke.portrait[expr] || poke.portrait.normal || [0,0];
  el.style.backgroundImage    = `url('assets/chars/${poke.char}/portrait.png')`;
  el.style.backgroundPosition = `${-col*PORTRAIT_CELL*PORTRAIT_SCALE}px ${-row*PORTRAIT_CELL*PORTRAIT_SCALE}px`;
  el.style.backgroundRepeat   = 'no-repeat';
  el.style.backgroundSize     = '400px auto';
}

function flashHurtPortrait(side) {
  setPortrait(side,'hurt');
  setTimeout(() => setPortrait(side,'normal'), 600);
}

// ── Next round ────────────────────────────────────────────────
function nextRound() {
  state.round += 1;
  state.player.en = Math.min(100, state.player.en + 20);
  state.ai.en     = Math.min(100, state.ai.en     + 20);
  state.player.selectedCards = [];
  state.ai.selectedCards     = [];
  runSave();  // 라운드 전환마다 저장
  const grid = document.getElementById('card-grid');
  if (grid) delete grid.dataset.swapLocked;
  updateHUD();
  showScreen('screen-card-select');
  renderCardGrid(); clearCardSelection(); renderMiniGrid();
  attachCardKeyboard();
}

// ── EXP / Level ───────────────────────────────────────────────
function getNextEvo(pad, level) {
  const cfg   = getAdminConfig();
  const chain = cfg?.evolution?.[pad] || EVOLUTION_CHAINS[pad];
  if (!chain || level < chain.level) return null;
  return chain;
}

function applyEvolution(poke, toPad) {
  poke.pad      = toPad;
  poke.name     = padToName(toPad);
  poke.types    = POKEDEX[toPad]?.types || poke.types;
  poke.char     = toPad;
  poke.animData = null;
  const prev    = poke.maxHp;
  poke.maxHp    = calcMaxHp(POKEDEX[toPad]?.baseHp || 50, poke.level);
  poke.atk      = calcAtk(POKEDEX[toPad]?.baseAtk  || 50, poke.level);
  poke.def      = calcDef(POKEDEX[toPad]?.baseDef   || 50, poke.level);
  poke.spAtk    = calcSpAtk(POKEDEX[toPad]?.baseSpAtk ?? POKEDEX[toPad]?.baseAtk ?? 50, poke.level);
  poke.spDef    = calcSpDef(POKEDEX[toPad]?.baseSpDef ?? POKEDEX[toPad]?.baseDef ?? 50, poke.level);
  poke.spd      = calcSpd  (POKEDEX[toPad]?.baseSpd   ?? 65,                            poke.level);
  poke.growthRate = getGrowthRate(toPad);
  poke.hp       = Math.min(poke.maxHp, Math.round(poke.hp / prev * poke.maxHp));
  dexAdd(toPad);
}

function showEvoScreen(poke, onDone) {
  const fromPad = poke.pad;
  const toPad   = poke.pendingEvo;
  document.getElementById('evo-from-name').textContent = `${poke.name} Lv.${poke.level}`;
  document.getElementById('evo-to-name').textContent   = padToName(toPad);
  document.getElementById('evo-msg').textContent       = `${poke.name} wants to evolve!`;
  _drawDexSprite(document.getElementById('evo-from-sprite'), fromPad, true);
  _drawDexSprite(document.getElementById('evo-to-sprite'),   toPad,   true);

  document.getElementById('btn-evo-yes').onclick = () => {
    applyEvolution(poke, toPad);
    poke.pendingEvo = null;
    onDone();
  };
  document.getElementById('btn-evo-no').onclick = () => {
    poke.pendingEvo = null;
    onDone();
  };
  showScreen('screen-evo');
}

function afterBattleEvoCheck(onDone) {
  const poke = G.team.find(p => p.pendingEvo);
  if (poke) showEvoScreen(poke, () => afterBattleEvoCheck(onDone));
  else onDone();
}

// ── Level-up move learning ────────────────────────────────────
function getLevelMovesForPad(pad) {
  const cfg = getAdminConfig();
  if (cfg?.pokemon?.[pad]?.levelMoves) return cfg.pokemon[pad].levelMoves;
  if (typeof POKEMON_LEARNSETS !== 'undefined' && POKEMON_LEARNSETS[pad]?.levelMoves)
    return POKEMON_LEARNSETS[pad].levelMoves;
  return [];
}

function afterLearnMoveCheck(onDone) {
  for (const poke of G.team) {
    if (poke.pendingLearnMoves && poke.pendingLearnMoves.length > 0) {
      const moveKey = poke.pendingLearnMoves.shift();
      showLearnMoveScreen(poke, moveKey, () => afterLearnMoveCheck(onDone));
      return;
    }
  }
  onDone();
}

function showLearnMoveScreen(poke, moveKey, onDone) {
  const activeMoves = getActiveMoves();
  const moveDef = activeMoves[moveKey] || MOVES[moveKey];
  if (!moveDef) { onDone(); return; }

  const newCard = {
    id: moveKey, name: moveDef.name, moveType: moveDef.type, type: moveDef.cat,
    power: moveDef.power || 0, en: moveDef.en || 0,
    hit: hitToMask(moveDef.hit), steps: moveDef.steps || 0,
    direction: moveDef.direction || null,
    healAmt: moveDef.healAmt || 0, guardAmt: moveDef.guardAmt || 0,
    enHealPct: moveDef.enHealPct || 0,
  };

  if (poke.movepool.length < 8) {
    // Auto-learn
    poke.movepool.push(moveKey);
    poke.cards = buildCards(poke.movepool);
    showEventScreen('★', 'NEW MOVE!',
      `${poke.name} learned <strong>${moveDef.name}</strong>!`,
      [{ label:'CONTINUE', action: onDone }]);
    return;
  }

  // Need to replace: show replacement screen
  const titleEl = document.getElementById('learn-move-pokemon');
  const newCardEl = document.getElementById('learn-move-new-card');
  const currentListEl = document.getElementById('learn-move-current-list');
  const skipBtn = document.getElementById('btn-learn-move-skip');

  titleEl.textContent = `${poke.name} wants to learn ${moveDef.name}!`;

  newCardEl.innerHTML = '';
  newCardEl.appendChild(buildCardEl(newCard, -1, null));

  currentListEl.innerHTML = '';
  const regularLearnCards = poke.cards.filter(c => c.type !== 'MOVE' && c.type !== 'SWAP');
  regularLearnCards.forEach((card, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'learn-card-choice';
    wrapper.appendChild(buildCardEl(card, -1, null));
    wrapper.addEventListener('click', () => {
      poke.movepool[i] = moveKey;
      poke.cards = buildCards(poke.movepool);
      onDone();
    });
    currentListEl.appendChild(wrapper);
  });

  skipBtn.onclick = onDone;

  showScreen('screen-learn-move');
}

function gainExp(poke, amount) {
  poke.exp += amount;
  while (poke.exp >= poke.nextExp && poke.level < MAX_LEVEL) {
    poke.exp  -= poke.nextExp;
    poke.level++;
    poke.nextExp = expForNext(poke.level, poke.growthRate);
    // Queue level-up moves
    const levelMoves = getLevelMovesForPad(poke.pad);
    for (const { level, move } of levelMoves) {
      if (level === poke.level && !poke.movepool.includes(move)) {
        poke.pendingLearnMoves = poke.pendingLearnMoves || [];
        poke.pendingLearnMoves.push(move);
      }
    }
    // Set pending evolution (only first threshold crossed; player will be prompted)
    if (!poke.pendingEvo) {
      const evo = getNextEvo(poke.pad, poke.level);
      if (evo) poke.pendingEvo = evo.to;
    }
    const prev = poke.maxHp;
    poke.maxHp = calcMaxHp(POKEDEX[poke.pad]?.baseHp || 50, poke.level);
    poke.atk   = calcAtk(POKEDEX[poke.pad]?.baseAtk  || 50, poke.level);
    poke.def   = calcDef(POKEDEX[poke.pad]?.baseDef   || 50, poke.level);
    poke.spAtk = calcSpAtk(POKEDEX[poke.pad]?.baseSpAtk ?? POKEDEX[poke.pad]?.baseAtk ?? 50, poke.level);
    poke.spDef = calcSpDef(POKEDEX[poke.pad]?.baseSpDef ?? POKEDEX[poke.pad]?.baseDef ?? 50, poke.level);
    poke.spd   = calcSpd  (POKEDEX[poke.pad]?.baseSpd   ?? 65,                               poke.level);
    poke.hp    = Math.round(poke.hp / prev * poke.maxHp);
  }
}

// ── Battle outcome ────────────────────────────────────────────
function onBattleOutcome(outcome) {
  if (outcome === 'draw') outcome = 'win';

  const activePoke = G.team[G.teamIdx];
  if (activePoke) activePoke.hp = Math.round(state.player.dm / 100 * activePoke.maxHp);

  if (outcome === 'win') {
    playSprite('char-ai', 'Faint', { loop: false });
    const expGain   = (G.currentEnemy?.level||1) * 10;
    const moneyGain = (G.currentEnemy?.level||1) * 5 + rnd(5, 20);
    G.money += moneyGain;
    if (activePoke) gainExp(activePoke, expGain);
    const curRoom = G.map?.rooms[G.map?.current];
    if (curRoom && !curRoom.cleared) curRoom.cleared = true;
    G.isRocketBattle = false;

    setTimeout(() => {
      afterLearnMoveCheck(() => afterBattleEvoCheck(() => {
        if (G.isBoss) {
          if (G.floor >= 4) { showScreen('screen-victory'); }
          else {
            showEventScreen('⬆', 'FLOOR CLEAR!',
              `${G.currentEnemy.name} defeated!<br>Earned &#x20A8;${moneyGain} &amp; ${expGain} EXP!<br><em>Team fully healed!</em>`,
              [{ label:'NEXT FLOOR', action:() => {
                G.floor++;
                G.team.forEach(p => { if (p.hp > 0) p.hp = p.maxHp; });
                startFloor(G.floor);
                showMapScreen();
              }}]
            );
          }
        } else {
          showCatchScreen(expGain, moneyGain);
        }
      }));
    }, 800);
    return;
  }

  // lose
  G.isRocketBattle = false;
  playSprite('char-player', 'Faint', { loop: false });
  if (activePoke) activePoke.hp = 0;
  setTimeout(() => {
    const nextIdx = G.team.findIndex((p,i) => i!==G.teamIdx && p.hp>0);
    if (nextIdx >= 0) {
      const fainted = G.team[G.teamIdx].name;
      G.teamIdx = nextIdx;
      showEventScreen('💀', 'POKEMON FAINTED!',
        `${fainted} fainted!<br>${G.team[nextIdx].name} takes over!`,
        [{ label:'CONTINUE', action:showMapScreen }]
      );
    } else {
      showScreen('screen-gameover');
    }
  }, 800);
}

// ── Battle start ──────────────────────────────────────────────
function startBattle(enemy, isBoss) {
  G.currentEnemy = enemy;
  G.isBoss       = isBoss || false;
  const active   = G.team[G.teamIdx];
  state.round      = 1;
  state.player.dm  = Math.round(active.hp / active.maxHp * 100);
  state.player.en  = 100;
  state.player.pos = { col:0, row:1 };
  state.player.selectedCards = [];
  state.ai.dm  = 100;
  state.ai.en  = 100;
  state.ai.pos = { col:4, row:1 };
  state.ai.selectedCards = [];
  runSave();  // 배틀 시작 즉시 저장 (새로고침 후 복원 대상)
  BGM.play(isBoss ? 'boss' : 'battle');
  updateHUD(); renderCardGrid(); clearCardSelection(); renderMiniGrid();
  showScreen('screen-card-select');
  initPortraits();
  attachCardKeyboard();
}

async function startBattleScreen() {
  detachCardKeyboard();
  showScreen('screen-battle');
  updateHUD();
  window._onSpriteResize = id => {
    if (id !== 'char-player' && id !== 'char-ai') return;
    const el = document.getElementById(id);
    if (el) { el.style.width = (el.width||32)*SPRITE_PIXEL_SCALE+'px'; el.style.height = (el.height||40)*SPRITE_PIXEL_SCALE+'px'; }
  };
  await Promise.all([
    initSprite('char-player', 6, G.team[G.teamIdx]),
    initSprite('char-ai',     6, G.currentEnemy),
  ]);
  initPortraits();
  renderCharacters();
  idleSprite('char-player');
  idleSprite('char-ai');
  state.ai.selectedCards = aiSelectCardsMinMax();
  renderGrid(); executeTurn(0);
}

// ── Catch screen ──────────────────────────────────────────────
function showCatchScreen(expGain, moneyGain) {
  if (G.isRocketBattle) {
    // Cannot catch Team Rocket's Pokémon
    showEventScreen('✗', '로켓단!', '로켓단의 포켓몬은\n잡을 수 없어요!',
      [{ label:'OK', action:showMapScreen }]);
    return;
  }
  const enemy = G.currentEnemy;
  const el    = document.getElementById('catch-portrait');
  el.style.backgroundImage    = `url('assets/chars/${enemy.char}/portrait.png')`;
  el.style.backgroundPosition = '0 0';
  el.style.backgroundSize     = '400px auto';
  el.style.backgroundRepeat   = 'no-repeat';
  document.getElementById('catch-name').textContent  = enemy.name + ' Lv.' + enemy.level;
  document.getElementById('catch-types').innerHTML   = enemy.types
    .map(t=>`<span class="type-badge" style="background:${typeColor(t)}">${t}</span>`).join(' ');
  const displayPct = Math.round(calcCatchRate(enemy, 'monsterball') * 100);
  document.getElementById('catch-rewards').innerHTML =
    `Earned <strong>&#x20A8;${moneyGain}</strong> and <strong>${expGain} EXP</strong>! &nbsp;<span style="color:#c8a227;font-size:0.85em;">Catch ${displayPct}%</span>`;
  const balls    = G.items.monsterball || 0;
  const canCatch = balls > 0;
  const btn = document.getElementById('btn-catch');
  btn.textContent = `CATCH! (${balls} Ball${balls!==1?'s':''})`;
  btn.disabled    = !canCatch;
  btn.style.opacity = canCatch ? '' : '0.4';
  showScreen('screen-catch');
}

// ── Passive item definitions ──────────────────────────────────
// Each passive has an id and stat bonuses. Add new passives here.
const PASSIVE_DEFS = {
  catch_booster: { name: 'Sneak Net',   desc: '+10% catch rate',                  catchBonus: 0.10 },
  dex_saver:     { name: 'Travel Log',  desc: '포기 시에도 이번 런 포획 덱스 등록' },
};

// Returns the sum of a stat across all active passives.
function getPassiveBonus(stat) {
  return (G.passives || []).reduce((sum, id) => sum + (PASSIVE_DEFS[id]?.[stat] ?? 0), 0);
}

const BALL_MULTIPLIERS = { monsterball: 1, greatball: 1.5, ultraball: 2 };

function calcCatchRate(enemy, ballType = 'monsterball') {
  const cfg      = getAdminConfig();
  const basePad  = typeof getBasePad === 'function' ? getBasePad(enemy.pad) : enemy.pad;
  const adminOverride = cfg?.pokemon?.[enemy.pad]?.catchRate ?? cfg?.pokemon?.[basePad]?.catchRate;
  const rawRate  = (typeof CATCH_RATES !== 'undefined') ? (CATCH_RATES[enemy.pad] ?? CATCH_RATES[basePad]) : undefined;
  const baseRate = adminOverride ?? (rawRate != null ? rawRate / 255 : 0.3);
  const ballMult = BALL_MULTIPLIERS[ballType] ?? 1;
  const roundFactor = state.round <= 5 ? 1.0 : Math.max(0.1, 1.0 - (state.round - 5) * 0.15);
  const passiveBonus = getPassiveBonus('catchBonus');
  return Math.min(1, baseRate * ballMult * roundFactor + passiveBonus);
}

function attemptCatch(ballType = 'monsterball') {
  const enemy = G.currentEnemy;
  if ((G.items[ballType] || 0) <= 0) return;
  G.items[ballType]--;
  const catchRate = calcCatchRate(enemy, ballType);
  if (Math.random() < catchRate) {
    enemy.hp = enemy.maxHp; enemy.exp = 0; enemy.nextExp = expForNext(enemy.level, enemy.growthRate);
    if (!G.caughtThisRun.includes(enemy.pad)) G.caughtThisRun.push(enemy.pad);
    if (G.team.length >= 3) {
      G.team.push(enemy);
      showReleaseScreen(enemy);
    } else {
      G.team.push(enemy);
      showEventScreen('✓', 'CAUGHT!', `${enemy.name} joined your team!`,
        [{ label:'CONTINUE', action:() => afterLearnMoveCheck(() => afterBattleEvoCheck(showMapScreen)) }]);
    }
  } else {
    showEventScreen('✗', 'ESCAPED!', `${enemy.name} broke free!`,
      [{ label:'CONTINUE', action:showMapScreen }]);
  }
}

function showReleaseScreen(newPoke) {
  const list = document.getElementById('release-list');
  list.innerHTML = '';

  G.team.forEach((poke, idx) => {
    const isNew   = poke === newPoke;
    const hpPct   = Math.round((poke.hp / poke.maxHp) * 100);
    const hpColor = hpPct > 50 ? '#3a9a3a' : hpPct > 20 ? '#b8a020' : '#c03030';

    const card = document.createElement('div');
    card.className = 'release-card';
    card.innerHTML = `
      <canvas width="48" height="48"></canvas>
      <div class="release-card-info">
        <div class="release-card-name">${poke.name}</div>
        <div class="release-card-sub">Lv.${poke.level} · ${poke.types.join('/')}
          ${poke.hp > 0 ? `· HP ${poke.hp}/${poke.maxHp}` : '· FAINTED'}</div>
        <div class="release-card-hp">
          <div class="release-card-hp-bar" style="width:${hpPct}%;background:${hpColor};"></div>
        </div>
      </div>
      ${isNew ? '<span class="release-new-badge">NEW</span>' : ''}
    `;

    _drawDexSprite(card.querySelector('canvas'), poke.pad, true);

    card.addEventListener('click', () => {
      if (!confirm(`Release ${poke.name}?`)) return;
      const wasActive = G.teamIdx === idx;
      G.team.splice(idx, 1);
      // Keep active index valid
      if (G.teamIdx >= G.team.length) G.teamIdx = G.team.length - 1;
      if (wasActive && G.team.length > 0) G.teamIdx = 0;
      showEventScreen('✓', 'CAUGHT!', `${newPoke.name} joined your team!`,
        [{ label:'CONTINUE', action:() => afterLearnMoveCheck(() => afterBattleEvoCheck(showMapScreen)) }]);
    });

    list.appendChild(card);
  });

  showScreen('screen-release');
}

// ── Event screen ──────────────────────────────────────────────
function showEventScreen(icon, title, bodyHtml, buttons) {
  document.getElementById('event-icon').textContent  = icon;
  document.getElementById('event-title').textContent = title;
  document.getElementById('event-body').innerHTML    = bodyHtml;
  const buttonsEl = document.getElementById('event-buttons');
  buttonsEl.innerHTML = '';
  (buttons||[{ label:'OK', action:showMapScreen }]).forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn-gold'; btn.textContent = b.label;
    btn.addEventListener('click', b.action);
    buttonsEl.appendChild(btn);
  });
  showScreen('screen-event');
}

// ── Treasure / Shop / Center ──────────────────────────────────
function showTreasureRoom() {
  if (G.map) { const r=G.map.rooms[G.map.current]; if(r) r.cleared=true; }
  const items = [
    { name:'Potion',        apply:p=>{ p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.3)); } },
    { name:'Super Potion',  apply:p=>{ p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.6)); } },
    { name:'Full Restore',  apply:p=>{ p.hp=p.maxHp; } },
    { name:'Gold (₨50)',    apply:()=>{ G.money+=50; } },
    { name:'Monster Ball',  apply:()=>{ G.items.monsterball=(G.items.monsterball||0)+1; } },
  ];
  const item = items[Math.floor(Math.random()*items.length)];
  item.apply(G.team[G.teamIdx]);
  showEventScreen('◆','TREASURE!',`You found a <strong>${item.name}</strong>!`,
    [{ label:'TAKE IT', action:showMapScreen }]);
}

function showShopRoom() {
  if (G.map) { const r=G.map.rooms[G.map.current]; if(r) r.cleared=true; }
  const shopItems = [
    { name:'Potion',        cost:30,  apply:p=>{ p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.3)); } },
    { name:'Super Potion',  cost:60,  apply:p=>{ p.hp=Math.min(p.maxHp,p.hp+Math.round(p.maxHp*.6)); } },
    { name:'Full Restore',  cost:120, apply:p=>{ p.hp=p.maxHp; } },
    { name:'Revive',        cost:80,  apply:p=>{ if(p.hp===0) p.hp=Math.round(p.maxHp*.5); } },
    { name:'Monster Ball',  cost:50,  apply:()=>{ G.items.monsterball = (G.items.monsterball||0)+1; } },
  ];

  document.getElementById('event-icon').textContent  = '$';
  document.getElementById('event-title').textContent = 'SHOP';
  const body = document.getElementById('event-body');
  body.innerHTML = `<div class="shop-money">₨<span id="shop-money-val">${G.money}</span></div>`;
  const list = document.createElement('div');
  list.className = 'shop-list';
  shopItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'shop-item';
    const btn = document.createElement('button');
    btn.className = 'btn-gray'; btn.textContent = 'BUY';
    btn.disabled = G.money < item.cost;
    btn.addEventListener('click', () => {
      if (G.money < item.cost) return;
      G.money -= item.cost; item.apply(G.team[G.teamIdx]);
      btn.textContent = 'BOUGHT!'; btn.disabled = true;
      const mv = document.getElementById('shop-money-val');
      if (mv) mv.textContent = G.money;
      document.querySelectorAll('.shop-item button').forEach(b2 => {
        const costEl = b2.closest('.shop-item')?.querySelector('.shop-item-cost');
        const c = parseInt(costEl?.textContent?.replace('₨',''))||0;
        if (!b2.disabled && G.money < c) b2.disabled = true;
      });
    });
    row.innerHTML = `<span class="shop-item-name">${item.name}</span><span class="shop-item-cost">₨${item.cost}</span>`;
    row.appendChild(btn);
    list.appendChild(row);
  });
  body.appendChild(list);
  const buttonsEl = document.getElementById('event-buttons');
  buttonsEl.innerHTML = '';
  const leaveBtn = document.createElement('button');
  leaveBtn.className = 'btn-gold'; leaveBtn.textContent = 'LEAVE';
  leaveBtn.addEventListener('click', showMapScreen);
  buttonsEl.appendChild(leaveBtn);
  showScreen('screen-event');
}

function showCenterRoom() {
  if (G.map) { const r=G.map.rooms[G.map.current]; if(r) r.cleared=true; }
  G.team.forEach(p => { p.hp = p.maxHp; });
  showEventScreen('+','POKEMON CENTER','All your Pokemon have been healed to full health!',
    [{ label:'THANK YOU!', action:showMapScreen }]);
}

// ── Explore View ──────────────────────────────────────────────
// map-explore-area에 7×5 격자 탐색 뷰를 렌더링한다.
// 현재 방에만 포켓몬 Idle 스프라이트를 표시하며, 인접 방 클릭 시 스프라이트 이동 애니메이션 후 onRoomClick 호출.
function renderExploreView(floor, containerEl, onRoomClick) {
  // 방향키 리스너 등록 (이전 것 제거 후 재등록)
  if (typeof document !== 'undefined') {
    if (window._onMapKeydown) {
      document.removeEventListener('keydown', window._onMapKeydown);
      window._onMapKeydown = null;
    }
    window._onMapKeydown = function onMapKeydown(e) {
      const dirMap = { ArrowLeft:'w', ArrowRight:'e', ArrowUp:'n', ArrowDown:'s' };
      const facingMap = { w:6, e:2, n:4, s:0 };
      const dir = dirMap[e.key];
      if (!dir) return;
      e.preventDefault();
      const curFloor = G.map;
      if (!curFloor) return;
      const cur = curFloor.rooms[curFloor.current];
      if (!cur || !cur.doors[dir]) return;
      const deltas = { n:[0,-1], s:[0,1], e:[1,0], w:[-1,0] };
      const [ddx, ddy] = deltas[dir];
      const targetKey = key(cur.x + ddx, cur.y + ddy);
      const canvasId = 'explore-sprite-canvas';
      if (typeof setSpriteFacing === 'function') setSpriteFacing(canvasId, facingMap[dir]);
      const fallbackWalk = () => { if (typeof idleSprite === 'function') idleSprite(canvasId); };
      if (typeof playSprite === 'function') playSprite(canvasId, 'Walk', { loop: false, onComplete: fallbackWalk });
      const spriteWrap = document.getElementById('explore-sprite-wrap');
      if (spriteWrap) {
        const CELL_W = 190 + 10;
        const CELL_H = 115 + 10;
        spriteWrap.style.transform = `translateX(calc(-50% + ${ddx * CELL_W}px)) translateY(${ddy * CELL_H}px)`;
      }
      const targetRoom = curFloor.rooms[targetKey];
      setTimeout(() => handleRoomEntry(targetKey, targetRoom), 400);
    };
    document.addEventListener('keydown', window._onMapKeydown);
  }

  containerEl.innerHTML = '';

  const { rooms, current } = floor;
  const curRoom = rooms[current];

  // 현재 방에서 문 연결된 인접 방
  const adjToCurrent = new Set();
  if (curRoom) {
    const dxMap = { n:[0,-1], s:[0,1], e:[1,0], w:[-1,0] };
    for (const [dir, [dx, dy]] of Object.entries(dxMap)) {
      if (!curRoom.doors[dir]) continue;
      const k = `${curRoom.x + dx},${curRoom.y + dy}`;
      if (rooms[k]) adjToCurrent.add(k);
    }
  }

  // fog-of-war: 방문한 방의 인접 미방문 방
  const visibleAdj = new Set();
  for (const r of Object.values(rooms)) {
    if (!r.visited) continue;
    const dxMap = { n:[0,-1], s:[0,1], e:[1,0], w:[-1,0] };
    for (const [dir, [dx, dy]] of Object.entries(dxMap)) {
      if (!r.doors[dir]) continue;
      const k = `${r.x + dx},${r.y + dy}`;
      if (rooms[k] && !rooms[k].visited) visibleAdj.add(k);
    }
  }

  // 7×5 격자 순서로 셀 생성 (grid-template-columns: repeat(7, 140px))
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      const rKey = `${col},${row}`;
      const r    = rooms[rKey];

      if (!r) {
        // 빈 격자 칸 — invisible placeholder
        const empty = document.createElement('div');
        empty.className = 'explore-cell-empty';
        containerEl.appendChild(empty);
        continue;
      }

      const isVisited  = r.visited;
      const isAdj      = visibleAdj.has(rKey);
      const isCurrent  = rKey === current;
      const canEnter   = adjToCurrent.has(rKey) && !isCurrent;

      // fog-of-war: 미방문 & 비인접 방은 빈 칸으로 숨김
      if (!isVisited && !isAdj) {
        const empty = document.createElement('div');
        empty.className = 'explore-cell-empty';
        containerEl.appendChild(empty);
        continue;
      }

      const cell = document.createElement('div');
      cell.className = 'explore-cell';
      const baseColor = ROOM_COLORS[r.type] || '#3a5a3a';
      cell.style.background = isVisited ? baseColor : baseColor + '55';

      if (isCurrent)      cell.classList.add('explore-current');
      else if (canEnter)  cell.classList.add('explore-can-enter');
      else if (isVisited) cell.classList.add('explore-visited');
      else                cell.classList.add('explore-adj-unvisited');

      // 방 아이콘
      const iconText = ROOM_ICONS[r.type] || '';
      if (iconText) {
        const icon = document.createElement('div');
        icon.className = 'explore-icon';
        icon.textContent = iconText;
        cell.appendChild(icon);
      }

      // 문 연결선 (방문한 방에만)
      if (isVisited) {
        const doorDirs = { n:'door-n', s:'door-s', e:'door-e', w:'door-w' };
        for (const [dir, cls] of Object.entries(doorDirs)) {
          if (!r.doors[dir]) continue;
          const d = document.createElement('div');
          d.className = `explore-door ${cls}`;
          cell.appendChild(d);
        }
      }

      // 현재 방: 포켓몬 Idle 스프라이트
      if (isCurrent) {
        const poke = G.team?.[G.teamIdx];
        const spriteWrap = document.createElement('div');
        spriteWrap.className  = 'explore-sprite-wrap';
        spriteWrap.id         = 'explore-sprite-wrap';

        if (poke) {
          const canvas = document.createElement('canvas');
          canvas.id = 'explore-sprite-canvas';
          canvas.style.cssText = 'image-rendering:pixelated;image-rendering:crisp-edges;height:64px;width:auto;';
          spriteWrap.appendChild(canvas);
          cell.appendChild(spriteWrap);
          // 비동기 스프라이트 초기화 (animData 유무 무관 — initSprite가 ANIM_DATA_BUNDLE 처리)
          requestAnimationFrame(() => {
            if (typeof initSprite === 'function') {
              initSprite('explore-sprite-canvas', 0, poke)
                .then(() => {
                  const anim = typeof SPRITES !== 'undefined' ? SPRITES['explore-sprite-canvas']?.animator : null;
                  if (anim) {
                    anim.onFrameResize = () => {
                      const c = document.getElementById('explore-sprite-canvas');
                      if (c) { c.style.height = '64px'; c.style.width = 'auto'; }
                    };
                  }
                  if (typeof idleSprite === 'function') idleSprite('explore-sprite-canvas');
                })
                .catch(() => {});
            }
          });
        } else {
          cell.appendChild(spriteWrap);
        }
      }

      // 이동 가능 방 클릭 이벤트
      if (canEnter && onRoomClick) {
        cell.addEventListener('click', () => {
          const spriteWrap = document.getElementById('explore-sprite-wrap');
          if (spriteWrap && curRoom) {
            // Walk 애니메이션 재생 — 방향(facing) 계산 후 setSpriteFacing 호출
            const canvasId = 'explore-sprite-canvas';
            const canvasEl = document.getElementById(canvasId);
            if (canvasEl && typeof playSprite === 'function') {
              // facing: dCol>0→2(W sprite=right), dCol<0→6(E sprite=left), dRow>0→0(S), dRow<0→4(N)
              const dColFace = r.x - curRoom.x;
              const dRowFace = r.y - curRoom.y;
              let facing = 2;
              if (Math.abs(dColFace) >= Math.abs(dRowFace)) {
                facing = dColFace > 0 ? 2 : 6;
              } else {
                facing = dRowFace > 0 ? 0 : 4;
              }
              if (typeof setSpriteFacing === 'function') setSpriteFacing(canvasId, facing);
              const fallback = () => { if (typeof idleSprite === 'function') idleSprite(canvasId); };
              playSprite(canvasId, 'Walk', { loop: false, onComplete: fallback });
            }
            // 스프라이트 위치 이동 CSS transition
            const dCol = r.x - curRoom.x;
            const dRow = r.y - curRoom.y;
            const CELL_W = 190 + 10;
            const CELL_H = 115 + 10;
            const dx = dCol * CELL_W;
            const dy = dRow * CELL_H;
            spriteWrap.style.transform = `translateX(calc(-50% + ${dx}px)) translateY(${dy}px)`;
          }
          setTimeout(() => onRoomClick(rKey, r), 420);
        });
      }

      containerEl.appendChild(cell);
    }
  }
}

// ── Map screen ────────────────────────────────────────────────
function showMapScreen() {
  G.currentEnemy = null;  // 배틀 완료 후 맵 복귀 시 battle 세이브 초기화
  if (!G.map) startFloor(G.floor);
  runSave(); // 맵 복귀마다 런 자동 세이브
  document.getElementById('map-floor-num').textContent = G.floor;
  document.getElementById('map-money').textContent     = G.money;
  const ballEl = document.getElementById('map-balls');
  if (ballEl) ballEl.textContent = G.items.monsterball || 0;

  BGM.play('map');

  // ── 탐색 뷰 렌더링 ──────────────────────────────────────────
  const exploreEl = document.getElementById('map-explore-area');
  if (exploreEl) {
    renderExploreView(G.map, exploreEl, (rKey, room) => {
      handleRoomEntry(rKey, room);
    });
  }

  const strip = document.getElementById('map-team-strip');
  if (strip) {
    strip.innerHTML = '';
    G.team.forEach((p, i) => {
      const hpPct = Math.round(p.hp / p.maxHp * 100);
      const div = document.createElement('div');
      div.className = 'map-strip-poke' + (i===G.teamIdx?' active':'') + (p.hp===0?' fainted':'');
      div.innerHTML =
        `<span class="map-strip-name">${p.name} Lv.${p.level}</span>` +
        `<span class="map-strip-hp">${p.hp}/${p.maxHp}</span>` +
        `<div class="map-strip-bar"><div style="width:${hpPct}%;background:${hpPct>50?'#33cc33':hpPct>25?'#cccc33':'#cc3333'};height:100%"></div></div>`;
      if (p.hp > 0 && i !== G.teamIdx) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => { G.teamIdx = i; showMapScreen(); });
      }
      strip.appendChild(div);
    });
  }
  showScreen('screen-map');
}

// ── Room entry ────────────────────────────────────────────────
function handleRoomEntry(rKey, room) {
  // 방향키 리스너 제거
  if (typeof document !== 'undefined' && window._onMapKeydown) {
    document.removeEventListener('keydown', window._onMapKeydown);
    window._onMapKeydown = null;
  }
  enterRoom(G.map, rKey);

  // Repeatable rooms (no cleared check)
  if (room.type === 'shop')   { showShopRoom();   return; }
  if (room.type === 'center') { showCenterRoom(); return; }

  // Already cleared rooms
  if (room.cleared) {
    if (room.type === 'grass' && Math.random() < 0.15) {
      startRocketBattle();
    } else {
      showMapScreen();
    }
    return;
  }

  // First-visit events
  switch (room.type) {
    case 'grass': {
      try {
        const adminCfg  = getAdminConfig();
        const floorCfg  = adminCfg?.floors?.[G.floor];
        const pokelist  = floorCfg?.pokemon;
        // Fallback to WILD_TABLES if admin config has no floor pokemon
        let activePokelist = pokelist;
        if (!activePokelist || !activePokelist.length) {
          const tbl = (typeof WILD_TABLES !== 'undefined') ? WILD_TABLES[`floor${G.floor}`] : null;
          if (!tbl || !tbl.length) { showMapScreen(); return; }
          activePokelist = tbl.map(([pad, weight]) => ({ pad, weight }));
        }
        const rawPad = pickWildFromConfig(activePokelist);
        const mn = floorCfg?.levelMin ?? DEFAULT_FLOOR_LEVEL_RANGES[G.floor]?.[0] ?? 1;
        const mx = floorCfg?.levelMax ?? DEFAULT_FLOOR_LEVEL_RANGES[G.floor]?.[1] ?? 8;
        const level   = rnd(mn, mx);
        const basePad = typeof getBasePad === 'function' ? getBasePad(rawPad) : rawPad;
        const pad     = evolveForLevelWithAdmin(basePad, level);
        const enemy   = createPokeInstance(pad, level, buildWildMovepool(pad, G.floor, level));
        startBattle(enemy, false);
      } catch(err) {
        console.error('[grass] wild spawn error:', err);
        showMapScreen();
      }
      break;
    }
    case 'boss': {
      const cfg      = getAdminConfig();
      const cfgBoss  = cfg?.floors?.[G.floor]?.boss;
      const fallback = BOSSES['floor'+G.floor];
      const pad      = cfgBoss?.pad   || fallback?.pad;
      const level    = cfgBoss?.level || fallback?.level || 10;
      let movepool;
      if (cfgBoss?.pad && (cfgBoss.fixedMoves?.length || cfgBoss.randomPool?.length)) {
        const fixed  = cfgBoss.fixedMoves || [];
        const pool   = cfgBoss.randomPool || [];
        const count  = cfgBoss.randomCount ?? 0;
        const random = [...pool].sort(() => Math.random() - .5).slice(0, count);
        movepool = [...new Set([...fixed, ...random])].slice(0, 8);
      } else {
        movepool = fallback?.movepool || [];
      }
      const enemy = createPokeInstance(pad, level, movepool);
      enemy.isBoss = true;
      startBattle(enemy, true);
      break;
    }
    case 'treasure': showTreasureRoom(); break;
    default:         showMapScreen();
  }
}

function startRocketBattle() {
  const floorLevels = { 1:[3,8], 2:[7,14], 3:[12,18], 4:[15,20] };
  const [mn,mx] = floorLevels[G.floor] || [3,8];
  const level = rnd(mn, mx);
  const entry = ROCKET_POOL[Math.floor(Math.random() * ROCKET_POOL.length)];
  const basePad = typeof getBasePad === 'function' ? getBasePad(entry.pad) : entry.pad;
  const pad   = evolveForLevelWithAdmin(basePad, level);
  const enemy = createPokeInstance(pad, level, buildWildMovepool(pad, G.floor, level));
  enemy.isRocket = true;
  G.isRocketBattle = true;
  startBattle(enemy, false);
}

function buildWildMovepool(pad, floor, level) {
  const cfg      = getAdminConfig();
  const floorCfg = cfg?.floors?.[floor];
  const basePad  = typeof getBasePad === 'function' ? getBasePad(pad) : pad;

  // Level moves: all moves this Pokémon knows up to its current level
  const allLevelMoves = getLevelMovesForPad(pad);
  const levelBase = allLevelMoves
    .filter(e => !level || e.level <= level)
    .sort((a, b) => b.level - a.level)  // highest level first (most recent moves)
    .map(e => e.move);

  // Per-Pokémon floor config adds on top of level base
  const pkEntry = floorCfg?.pokemon?.find(p => p.pad === pad || p.pad === basePad);
  if (pkEntry && (pkEntry.fixedMoves?.length || pkEntry.randomPool?.length)) {
    const fixed  = pkEntry.fixedMoves || [];
    const pool   = pkEntry.randomPool || [];
    const count  = pkEntry.randomCount ?? 0;
    const random = [...pool].sort(() => Math.random() - .5).slice(0, count);
    const combined = dedupe([...levelBase, ...fixed, ...random]);
    if (combined.length) return ensureEnChargeMove(combined.slice(0, 8));
  }

  // If we have level moves, use them as-is
  if (levelBase.length) return ensureEnChargeMove(levelBase.slice(0, 8));

  // Pokémon-level default config fallback (fixed + random)
  const pkDefault = cfg?.pokemon?.[pad] || cfg?.pokemon?.[basePad];
  if (pkDefault && (pkDefault.fixedMoves?.length || pkDefault.randomPool?.length)) {
    const fixed  = pkDefault.fixedMoves || [];
    const pool   = pkDefault.randomPool || [];
    const count  = pkDefault.randomCount ?? 3;
    const need   = Math.max(0, count - fixed.length);
    const random = [...pool].sort(() => Math.random() - .5).slice(0, need);
    const result = dedupe([...fixed, ...random]).slice(0, 8);
    if (result.length) return ensureEnChargeMove(result);
  }

  // Type-based fallback
  const base  = POKEDEX[pad];
  const types = base?.types || ['Normal'];
  const pool  = [];
  for (const t of types)
    for (const m of (TYPE_MOVEPOOLS[t]||[])) if (!pool.includes(m)) pool.push(m);
  if (!pool.includes('tackle')) pool.unshift('tackle');
  return ensureEnChargeMove([...pool].sort(() => Math.random() - .5).slice(0, 8));
}

// Guarantees at least one EN-charge move (enHealPct > 0) in the first 4 slots.
// Places it at slot 3 (index 3) if not already present.
function ensureEnChargeMove(pool) {
  const mvDb = getAdminConfig()?.moves || (typeof MOVES !== 'undefined' ? MOVES : {});
  if (pool.some(k => (mvDb[k]?.enHealPct ?? 0) > 0)) return pool;
  const candidate = ['meditate', 'refresh'].find(k => mvDb[k] && !pool.includes(k));
  if (!candidate) return pool;
  const result = pool.slice(0, 8);
  if (result.length < 8) result.push(candidate);
  else result[result.length - 1] = candidate;
  return result;
}

function dedupe(arr) {
  return arr.filter((v, i, a) => a.indexOf(v) === i);
}

function evolveForLevelWithAdmin(pad, level) {
  const cfg = getAdminConfig();
  let current = pad;
  for (;;) {
    const adminEvo = cfg?.evolution?.[current];
    const chain    = adminEvo || EVOLUTION_CHAINS[current];
    if (!chain || level < chain.level) return current;
    current = chain.to;
  }
}

// ── Floor init ────────────────────────────────────────────────
function startFloor(floorNum) {
  G.map = generateFloor(floorNum);
  enterRoom(G.map, key(G.map.entry.x, G.map.entry.y));
}

// ── Pokédex Select Screen ─────────────────────────────────────
let _dexCurrentGen = 1;

function showPokedexSelect() {
  dexInit();
  _dexCurrentGen = 1;
  _renderDexGrid();
  document.getElementById('dex-tab-1').classList.add('active');
  document.getElementById('dex-tab-2').classList.remove('active');
  showScreen('screen-starter');
}

function _evoLineCaught(pad, caught) {
  let cur = pad;
  while (cur) {
    if (caught.has(cur)) return true;
    cur = EVOLUTION_CHAINS[cur]?.to;
  }
  return false;
}

function _renderDexGrid() {
  const grid   = document.getElementById('dex-grid');
  const caught = dexLoad();
  grid.innerHTML = '';

  const [start, end] = _dexCurrentGen === 1 ? [1, 151] : [152, 251];

  for (let id = start; id <= end; id++) {
    const pad        = String(id).padStart(4, '0');
    const name       = padToName(pad);
    const isCaught   = caught.has(pad);
    const isStarter  = STARTER_PADS.includes(pad);
    const isBase     = (typeof getBasePad === 'function') ? getBasePad(pad) === pad : true;
    if (!isBase) continue;  // 진화체는 선택 화면에 표시하지 않음

    // base form unlocked via catching an evolved form in the same line
    const evoUnlocked  = !isCaught && _evoLineCaught(pad, caught);
    const isSelectable = isStarter || isCaught || evoUnlocked;

    const stateClass = isCaught ? 'caught' : evoUnlocked ? 'evo-unlocked' : 'uncaught';
    const cell = document.createElement('div');
    cell.className = 'dex-cell ' + stateClass + (isStarter ? ' starter' : '');
    cell.title = (isCaught || evoUnlocked) ? name : '???';

    const wrap = document.createElement('div');
    wrap.className = 'dex-portrait';

    const canvas = document.createElement('canvas');
    canvas.className = 'dex-sprite';
    canvas.width  = 52;
    canvas.height = 52;
    wrap.appendChild(canvas);

    const num = document.createElement('div');
    num.className = 'dex-num';
    num.textContent = `#${String(id).padStart(3,'0')}`;

    cell.appendChild(wrap);
    cell.appendChild(num);

    cell._pad = pad;
    if (isSelectable) cell.addEventListener('click', () => pickFromDex(pad));
    grid.appendChild(cell);

    _drawDexSprite(canvas, pad, isCaught || evoUnlocked);
  }
}

async function _drawDexSprite(canvas, pad, isCaught) {
  const basePath = `assets/chars/${pad}/`;
  try {
    const animData = await loadAnimDataFromXml(basePath);
    if (!animData) return;
    const animName = animData['Walk'] ? 'Walk' : (animData['Idle'] ? 'Idle' : null);
    if (!animName) return;

    const { fw, fh } = animData[animName];
    const img = await new Promise((res, rej) => {
      const el = new Image();
      el.onload  = () => res(el);
      el.onerror = () => rej();
      el.src = `${basePath}${animName}-Anim.png`;
    });

    const DIR_SW = 1; // SW = 왼쪽 대각선
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const srcX = 0;
    const srcY = DIR_SW * fh;
    const scale = Math.min(canvas.width / fw, canvas.height / fh);
    const dw = Math.floor(fw * scale);
    const dh = Math.floor(fh * scale);
    const dx = Math.floor((canvas.width - dw) / 2);
    const dy = Math.floor((canvas.height - dh) / 2);

    ctx.drawImage(img, srcX, srcY, fw, fh, dx, dy, dw, dh);

    // 미해금: 검은 실루엣으로 변환
    if (!isCaught) {
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  } catch(e) {}
}

function pickFromDex(pad) {
  // Highlight selected cell
  document.querySelectorAll('#dex-grid .dex-cell').forEach(c => c.classList.remove('dex-selected'));
  const cells = document.querySelectorAll('#dex-grid .dex-cell');
  cells.forEach(c => { if (c._pad === pad) c.classList.add('dex-selected'); });
  _showDexInfo(pad);
}

function _getDexMoveData(key) {
  const cfg = getAdminConfig();
  return cfg?.moves?.[key] || (typeof MOVES !== 'undefined' ? MOVES[key] : null);
}

function _buildDexHitmap(hitArray) {
  const grid = document.createElement('div');
  grid.className = 'dex-move-hitmap-grid';
  const mask = hitToMask(hitArray); const hitSet = new Set(hitMaskToArray(mask).map(([dc,dr]) => `${dc},${dr}`));
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const cell = document.createElement('div');
      cell.className = 'dex-hm-cell' + (hitSet.has(`${dc},${dr}`) ? ' hit' : '');
      grid.appendChild(cell);
    }
  }
  return grid;
}

function _showDexInfo(pad) {
  const panel = document.getElementById('dex-info-panel');
  panel.innerHTML = '';

  const base = POKEDEX[pad];
  if (!base) return;

  // Header: sprite + name + types
  const header = document.createElement('div');
  header.className = 'dex-info-header';
  const spriteWrap = document.createElement('div');
  spriteWrap.className = 'dex-info-sprite-wrap';
  const canvas = document.createElement('canvas');
  canvas.className = 'dex-info-sprite';
  canvas.width = 72; canvas.height = 72;
  spriteWrap.appendChild(canvas);
  const meta = document.createElement('div');
  meta.className = 'dex-info-meta';
  meta.innerHTML = `
    <div class="dex-info-name">${padToName(pad)}</div>
    <div class="dex-info-id">#${pad}</div>
    <div class="dex-info-types">${(base.types||[]).map(t => `<span class="type-badge" style="background:${typeColor(t)}">${t}</span>`).join('')}</div>
  `;
  header.appendChild(spriteWrap);
  header.appendChild(meta);
  panel.appendChild(header);
  _drawDexSprite(canvas, pad, true);

  // Evolution chain
  const chainPads = [];
  let cur = pad;
  while (cur) { chainPads.push(cur); cur = EVOLUTION_CHAINS[cur]?.to; }

  const evoTitle = document.createElement('div');
  evoTitle.className = 'dex-info-section-title';
  evoTitle.textContent = 'EVOLUTION';
  panel.appendChild(evoTitle);

  const evoChain = document.createElement('div');
  evoChain.className = 'dex-evo-chain';
  chainPads.forEach((p, i) => {
    if (i > 0) {
      const lvl = EVOLUTION_CHAINS[chainPads[i-1]]?.level ?? '?';
      const arrow = document.createElement('span');
      arrow.innerHTML = `<span class="dex-evo-level">Lv.${lvl}</span> <span class="dex-evo-arrow">→</span>`;
      evoChain.appendChild(arrow);
    }
    const badge = document.createElement('span');
    badge.className = 'dex-evo-badge' + (p === pad ? ' selected' : '');
    badge.textContent = padToName(p);
    evoChain.appendChild(badge);
  });
  panel.appendChild(evoChain);

  // Level moves per evolution stage
  const movesTitle = document.createElement('div');
  movesTitle.className = 'dex-info-section-title';
  movesTitle.textContent = 'LEVEL MOVES';
  panel.appendChild(movesTitle);

  chainPads.forEach(stagePad => {
    const stageBlock = document.createElement('div');
    stageBlock.className = 'dex-stage-block';
    const stageName = document.createElement('div');
    stageName.className = 'dex-stage-name';
    stageName.textContent = padToName(stagePad);
    stageBlock.appendChild(stageName);

    const levelMoves = getLevelMovesForPad(stagePad);
    const activeMvs  = getActiveMoves();

    function appendMoveRow(container, level, mv) {
      const row = document.createElement('div');
      row.className = 'dex-move-row';

      const lv = document.createElement('div');
      lv.className = 'dex-move-lv';
      lv.textContent = `${level}`;

      const name = document.createElement('div');
      name.className = 'dex-move-name';
      name.textContent = mv.name || mv._key || '';

      const typeEl = document.createElement('div');
      typeEl.className = 'dex-move-type';
      typeEl.textContent = mv.type || '';
      typeEl.style.background = typeColor(mv.type) || '#333';

      const pw = document.createElement('div');
      pw.className = 'dex-move-stat';
      if (mv.cat === 'GUARD')     pw.textContent = `shd ${mv.guardAmt ?? 0}`;
      else if (mv.cat === 'HEAL') pw.textContent = mv.healAmt ? `hp +${mv.healAmt}` : mv.enHealPct ? `en +${mv.enHealPct}` : 'heal';
      else                        pw.textContent = `pw ${mv.power ?? 0}`;

      const en = document.createElement('div');
      en.className = 'dex-move-stat';
      en.textContent = `en ${mv.en ?? 0}`;

      const hm = document.createElement('div');
      hm.className = 'dex-move-hitmap';
      hm.appendChild(_buildDexHitmap(mv.hit));

      row.appendChild(lv); row.appendChild(name); row.appendChild(typeEl);
      row.appendChild(pw); row.appendChild(en);   row.appendChild(hm);
      container.appendChild(row);
    }

    // Mandatory EN charge move (always at Lv.1)
    const hasEnHeal = levelMoves.some(({ move }) => (activeMvs[move]?.enHealPct ?? 0) > 0);
    if (!hasEnHeal) {
      const enKey = ['meditate', 'refresh'].find(k => activeMvs[k]);
      if (enKey) appendMoveRow(stageBlock, 1, { ...activeMvs[enKey], _key: enKey });
    }

    if (!levelMoves.length && hasEnHeal) {
      const empty = document.createElement('div');
      empty.className = 'dex-no-moves';
      empty.textContent = '기술 없음';
      stageBlock.appendChild(empty);
    } else {
      levelMoves.slice().sort((a, b) => a.level - b.level)
        .forEach(({ level, move: moveKey }) => {
          const mv = _getDexMoveData(moveKey);
          if (!mv) return;
          appendMoveRow(stageBlock, level, mv);
        });
    }
    panel.appendChild(stageBlock);
  });

  // GO button
  const goBtn = document.createElement('button');
  goBtn.className = 'btn-go';
  goBtn.textContent = 'GO! →';
  goBtn.addEventListener('click', () => _startWithPad(pad));
  panel.appendChild(goBtn);
}

function _startWithPad(pad) {
  const cfg    = getAdminConfig();
  const pkCfg  = cfg?.pokemon?.[pad];
  // 어드민 설정이 있으면 우선 적용; 없으면 STARTERS 하드코딩 → 타입 기반 fallback
  const hasCfg = pkCfg && (pkCfg.fixedMoves?.length || pkCfg.randomPool?.length || pkCfg.levelMoves?.length);
  const movepool = hasCfg ? buildWildMovepool(pad, undefined, 1)
                          : (STARTERS[pad]?.movepool || buildWildMovepool(pad, undefined, 1));
  G.team           = [createPokeInstance(pad, 1, movepool)];
  G.teamIdx        = 0;
  G.money          = 150;
  G.floor          = 1;
  G.items          = { monsterball: 3, greatball: 0, ultraball: 0 };
  G.passives       = [];
  G.caughtThisRun  = [];
  runClear();
  startFloor(1);
  showMapScreen();
}

// legacy alias
function showStarterSelect() { showPokedexSelect(); }

// ── BGM ───────────────────────────────────────────────────────
const BGM_FILES = {
  title:   'assets/sound/bgm/Pokémon MD-BRT - 1-2. Title Screen.mp3',
  starter: 'assets/sound/bgm/Pokémon MD-BRT - 1-4. Personality Test.mp3',
  map:     'assets/sound/bgm/Pokémon MD-BRT - 1-10. Rescue Team Base.mp3',
  battle:  'assets/sound/bgm/Pokémon MD-BRT - 1-21. Mt. Steel.mp3',
  boss:    'assets/sound/bgm/Pokémon MD-BRT - 1-22. Versus Boss.mp3',
};

const BGM = {
  audio: null,
  currentKey: null,
  _fadeTimer: null,

  play(key) {
    if (this.currentKey === key) return; // 동일 BGM — 유지
    const src = BGM_FILES[key];
    if (!src) return;
    if (this.audio && !this.audio.paused) {
      this._fadeOut(() => this._startNew(key, src));
    } else {
      this._startNew(key, src);
    }
  },

  _fadeOut(cb) {
    clearInterval(this._fadeTimer);
    const audio = this.audio;
    if (!audio) { cb(); return; }
    const step = Math.max(0.05, audio.volume / 20);
    this._fadeTimer = setInterval(() => {
      if (audio.volume > step) {
        audio.volume = Math.max(0, audio.volume - step);
      } else {
        audio.volume = 0;
        audio.pause();
        clearInterval(this._fadeTimer);
        cb();
      }
    }, 40);
  },

  _startNew(key, src) {
    this.currentKey = key;
    if (!this.audio) this.audio = new Audio();
    this.audio.pause();
    this.audio.src = src;
    this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.play().catch(() => {});
    clearInterval(this._fadeTimer);
    this._fadeTimer = setInterval(() => {
      const target = (typeof window._gameVolume === 'number') ? window._gameVolume : 1.0;
      if (this.audio.volume < target - 0.04) {
        this.audio.volume = Math.min(target, this.audio.volume + 0.05);
      } else {
        this.audio.volume = target;
        clearInterval(this._fadeTimer);
      }
    }, 40);
  },
};

function _endRun({ commitDex = true } = {}) {
  if (commitDex) G.caughtThisRun.forEach(pad => dexAdd(pad));
  runClear();
  G.team=[]; G.teamIdx=0; G.money=150; G.floor=1; G.map=null;
  G.items={ monsterball:3, greatball:0, ultraball:0 }; G.passives=[]; G.isRocketBattle=false; G.caughtThisRun=[];
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 저장된 게임 있으면 CONTINUE 노출
  const resumeBtn = document.getElementById('btn-resume');
  if (resumeBtn && runExists()) resumeBtn.style.display = '';

  showScreen('screen-title');
  BGM.play('title');

  document.getElementById('btn-play').addEventListener('click', () => {
    BGM.play('starter');
    showPokedexSelect();
  });

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      const save = runLoad();
      if (!save) { resumeBtn.style.display = 'none'; return; }
      const d = save.G;
      G.floor          = d.floor;
      G.teamIdx        = d.teamIdx;
      G.money          = d.money;
      G.items          = d.items;
      G.passives       = d.passives || [];
      G.caughtThisRun  = d.caughtThisRun || [];
      G.team           = d.team || [];
      G.map            = d.map || null;
      G.isBoss         = false;
      G.isRocketBattle = false;
      G.currentEnemy   = null;

      if (save.battle) {
        // 배틀 중 저장된 경우: 카드 선택 화면으로 복원
        const b = save.battle;
        G.currentEnemy   = b.enemy;
        G.isBoss         = b.isBoss || false;
        G.isRocketBattle = b.isRocketBattle || false;
        state.round           = b.state.round;
        state.player.dm       = b.state.player.dm;
        state.player.en       = b.state.player.en;
        state.player.pos      = { ...b.state.player.pos };
        state.player.selectedCards = [];
        state.ai.dm           = b.state.ai.dm;
        state.ai.en           = b.state.ai.en;
        state.ai.pos          = { ...b.state.ai.pos };
        state.ai.selectedCards = [];
        state.player.shield   = 0;
        state.ai.shield       = 0;
        BGM.play(G.isBoss ? 'boss' : 'battle');
        updateHUD(); renderCardGrid(); clearCardSelection(); renderMiniGrid();
        showScreen('screen-card-select');
        initPortraits();
        attachCardKeyboard();
      } else {
        if (!G.map) startFloor(G.floor);
        BGM.play('map');
        showMapScreen();
      }
    });
  }

  document.getElementById('btn-continue').addEventListener('click', startBattleScreen);
  document.getElementById('btn-catch').addEventListener('click', () => attemptCatch());
  document.getElementById('btn-skip-catch').addEventListener('click', () => afterLearnMoveCheck(() => afterBattleEvoCheck(showMapScreen)));

  document.getElementById('btn-forfeit').addEventListener('click', () => {
    const hasDexSaver = (G.passives || []).includes('dex_saver');
    const dexMsg = hasDexSaver
      ? '도구 효과: 이번 런에 잡은 포켓몬이 포켓덱스에 등록됩니다.'
      : '이번 런에 잡은 포켓몬은 포켓덱스에 등록되지 않습니다.';
    if (!confirm(`포기하면 현재 진행이 사라집니다.\n${dexMsg}\n\n정말 포기할까요?`)) return;
    _endRun({ commitDex: hasDexSaver });
    BGM.play('title');
    const rb = document.getElementById('btn-resume');
    if (rb) rb.style.display = 'none';
    showScreen('screen-title');
  });

  document.getElementById('btn-gameover-restart').addEventListener('click', () => {
    _endRun();
    const rb = document.getElementById('btn-resume');
    if (rb) rb.style.display = 'none';
    BGM.play('title');
    showScreen('screen-title');
  });
  document.getElementById('btn-victory-restart').addEventListener('click', () => {
    _endRun();
    const rb = document.getElementById('btn-resume');
    if (rb) rb.style.display = 'none';
    BGM.play('title');
    showScreen('screen-title');
  });
  // ── 덱스 탭 ─────────────────────────────────────────────────
  document.getElementById('dex-tab-1').addEventListener('click', () => {
    _dexCurrentGen = 1;
    document.getElementById('dex-tab-1').classList.add('active');
    document.getElementById('dex-tab-2').classList.remove('active');
    _renderDexGrid();
  });
  document.getElementById('dex-tab-2').addEventListener('click', () => {
    _dexCurrentGen = 2;
    document.getElementById('dex-tab-2').classList.add('active');
    document.getElementById('dex-tab-1').classList.remove('active');
    _renderDexGrid();
  });

  // 슬롯 클릭 리스너는 renderSelectedSlots()에서 동적으로 등록됨 (cycle-015)

  // ── Settings (volume) ───────────────────────────────────────
  (function initSettings() {
    const VOLUME_KEY = 'pokeTournamentVolume';
    let savedVolume = parseFloat(localStorage.getItem(VOLUME_KEY) ?? '0.8');
    if (isNaN(savedVolume) || savedVolume < 0 || savedVolume > 1) savedVolume = 0.8;
    let isMuted = false;
    let prevVolume = savedVolume;

    function applyVolume(v) {
      if (typeof BGM !== 'undefined' && BGM.audio) BGM.audio.volume = v;
      window._gameVolume = v;
      if (!isMuted || v === 0) localStorage.setItem(VOLUME_KEY, v > 0 ? v : prevVolume);
      const slider = document.getElementById('settings-volume-slider');
      const valEl  = document.getElementById('settings-volume-val');
      if (slider) slider.value = Math.round(v * 100);
      if (valEl)  valEl.textContent = `${Math.round(v * 100)}%`;
    }

    const btnSettings = document.getElementById('btn-settings');
    const panel       = document.getElementById('settings-panel');
    const slider      = document.getElementById('settings-volume-slider');
    const muteBtn     = document.getElementById('settings-mute-btn');

    if (btnSettings && panel) {
      btnSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== btnSettings) {
          panel.style.display = 'none';
        }
      });
    }
    if (slider) {
      slider.value = Math.round(savedVolume * 100);
      slider.addEventListener('input', () => {
        const v = slider.value / 100;
        isMuted = false;
        prevVolume = v;
        if (muteBtn) muteBtn.textContent = 'Mute';
        applyVolume(v);
      });
    }
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (isMuted) {
          isMuted = false;
          applyVolume(prevVolume);
          muteBtn.textContent = 'Mute';
        } else {
          isMuted = true;
          prevVolume = window._gameVolume ?? savedVolume;
          applyVolume(0);
          muteBtn.textContent = 'Unmute';
        }
      });
    }

    // 초기 볼륨 적용
    applyVolume(savedVolume);
  })();
});
