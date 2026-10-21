'use strict';
/* ============================================================
   Pokédex — Starters, Wild tables, Bosses
   stat blocks are base values; actual stats scaled by level in game.js
   movepool: array of move keys from MOVES
   ============================================================ */

// Helper: read AnimData.xml from already-downloaded assets at runtime.
// Sprite animator reads the file directly; we only need fw/fh/durations here
// for the default "generic" fallback. Per-Pokémon anim data is loaded lazily.

const GENERIC_ANIM = {
  Idle:   { fw: 24, fh: 24, durations: [16, 6, 6] },
  Walk:   { fw: 24, fh: 24, durations: [6, 6, 6, 6] },
  Attack: { fw: 40, fh: 40, durations: [3, 2, 3, 2, 2, 3, 3, 3, 4] },
  Hurt:   { fw: 24, fh: 24, durations: [2, 8] },
  Charge: { fw: 24, fh: 24, durations: [4, 4, 4] },
  Sleep:  { fw: 24, fh: 24, durations: [12, 12] },
};

// Build animData from downloaded AnimData.xml — done lazily in sprite.js.
// For now each Pokémon entry stores null; sprite.js will parse the XML.
function mkPoke(id, name, types, baseHp, baseAtk, baseDef, movepool, portrait) {
  const pad = String(id).padStart(4, '0');
  return {
    id,
    pad,
    name,
    types,           // array of 1-2 type strings
    baseHp,
    baseAtk,
    baseDef,
    movepool,        // array of MOVES keys (4 max + dash always appended)
    portrait: portrait ?? { normal: [0,0], hurt: [0,1] },
    char: pad,       // asset folder name
    animData: null,  // loaded lazily from AnimData.xml by sprite.js
  };
}

/* ── Starters ────────────────────────────────────────────── */
const STARTERS = {
  // Kanto
  '0001': mkPoke(1,  'Bulbasaur',  ['Grass','Poison'], 45, 49, 49,
    ['vine_whip','sleep_powder','razor_leaf','refresh']),
  '0004': mkPoke(4,  'Charmander', ['Fire'],           39, 52, 43,
    ['ember','rage','slash','meditate']),
  '0007': mkPoke(7,  'Squirtle',   ['Water'],          44, 48, 65,
    ['water_gun','bite','defense_curl','refresh']),
  // Johto
  '0152': mkPoke(152,'Chikorita',  ['Grass'],          45, 49, 65,
    ['vine_whip','reflect','synthesis','refresh']),
  '0155': mkPoke(155,'Cyndaquil',  ['Fire'],           39, 52, 43,
    ['ember','smokescreen','flame_wheel','meditate']),
  '0158': mkPoke(158,'Totodile',   ['Water'],          50, 65, 64,
    ['water_gun','bite','rage','refresh']),
};

/* ── Wild Pokémon tables (per floor tier) ────────────────── */
// Each entry: [pad, weight] — higher weight = more frequent
// Only base forms listed; evolveForLevel() auto-evolves for the encounter level.
const WILD_TABLES = {
  floor1: [  // ~lvl 1-8 — weak base forms
    // w10 — very common
    ['0016',10], // Pidgey
    ['0019',10], // Rattata
    ['0021',10], // Spearow
    ['0161',10], // Sentret
    ['0163',10], // Hoothoot
    ['0165',10], // Ledyba
    ['0167',10], // Spinarak
    ['0187',10], // Hoppip
    // w8 — common
    ['0010',8],  // Caterpie
    ['0013',8],  // Weedle
    ['0023',8],  // Ekans
    ['0027',8],  // Sandshrew
    ['0029',8],  // Nidoran♀
    ['0032',8],  // Nidoran♂
    ['0037',8],  // Vulpix
    ['0041',8],  // Zubat
    ['0043',8],  // Oddish
    ['0046',8],  // Paras
    ['0048',8],  // Venonat
    ['0050',8],  // Diglett
    ['0052',8],  // Meowth
    ['0054',8],  // Psyduck
    ['0060',8],  // Poliwag
    ['0063',8],  // Abra
    ['0066',8],  // Machop
    ['0069',8],  // Bellsprout
    ['0072',8],  // Tentacool
    ['0074',8],  // Geodude
    ['0077',8],  // Ponyta
    ['0079',8],  // Slowpoke
    ['0081',8],  // Magnemite
    ['0084',8],  // Doduo
    ['0086',8],  // Seel
    ['0088',8],  // Grimer
    ['0090',8],  // Shellder
    ['0092',8],  // Gastly
    ['0096',8],  // Drowzee
    ['0098',8],  // Krabby
    ['0100',8],  // Voltorb
    ['0102',8],  // Exeggcute
    ['0104',8],  // Cubone
    ['0109',8],  // Koffing
    ['0111',8],  // Rhyhorn
    ['0116',8],  // Horsea
    ['0118',8],  // Goldeen
    ['0120',8],  // Staryu
    ['0172',8],  // Pichu
    ['0173',8],  // Cleffa
    ['0174',8],  // Igglybuff
    ['0175',8],  // Togepi
    ['0177',8],  // Natu
    ['0179',8],  // Mareep
    ['0183',8],  // Marill
    ['0190',8],  // Aipom
    ['0191',8],  // Sunkern
    ['0193',8],  // Yanma
    ['0194',8],  // Wooper
    ['0198',8],  // Murkrow
    ['0202',8],  // Wobbuffet
    ['0203',8],  // Girafarig
    ['0204',8],  // Pineco
    ['0209',8],  // Snubbull
    ['0211',8],  // Qwilfish
    ['0216',8],  // Teddiursa
    ['0218',8],  // Slugma
    ['0220',8],  // Swinub
    ['0223',8],  // Remoraid
    ['0225',8],  // Delibird
    ['0226',8],  // Mantine
    ['0228',8],  // Houndour
    ['0231',8],  // Phanpy
    ['0234',8],  // Stantler
    ['0238',8],  // Smoochum
    ['0239',8],  // Elekid
    ['0240',8],  // Magby
    // w6 — uncommon/rare base forms
    ['0129',6],  // Magikarp
    ['0138',6],  // Omanyte
    ['0140',6],  // Kabuto
    ['0147',6],  // Dratini
    ['0200',6],  // Misdreavus
    ['0201',6],  // Unown
    ['0206',6],  // Dunsparce
    ['0213',6],  // Shuckle
    ['0236',6],  // Tyrogue
    // w4 — rare standalone / gimmick Pokémon
    ['0025',4],  // Pikachu
    ['0035',4],  // Clefairy
    ['0039',4],  // Jigglypuff
    ['0113',4],  // Chansey
    ['0132',4],  // Ditto
    ['0133',4],  // Eevee
    ['0137',4],  // Porygon
  ],
  floor2: [  // ~lvl 5-14 — moderate base forms & strong standalones
    // w10 — common moderate
    ['0056',10], // Mankey
    ['0058',10], // Growlithe
    ['0083',10], // Farfetch'd
    ['0108',10], // Lickitung
    ['0128',10], // Tauros
    ['0152',10], // Chikorita
    ['0155',10], // Cyndaquil
    ['0158',10], // Totodile
    // w8 — uncommon moderate
    ['0001',8],  // Bulbasaur
    ['0004',8],  // Charmander
    ['0007',8],  // Squirtle
    ['0095',8],  // Onix
    ['0114',8],  // Tangela
    ['0122',8],  // Mr. Mime
    ['0123',8],  // Scyther
    ['0124',8],  // Jynx
    ['0125',8],  // Electabuzz
    ['0126',8],  // Magmar
    ['0127',8],  // Pinsir
    ['0131',8],  // Lapras
    ['0185',8],  // Sudowoodo
    ['0207',8],  // Gligar
    ['0208',8],  // Steelix
    ['0222',8],  // Corsola
    ['0227',8],  // Skarmory
    ['0241',8],  // Miltank
    // w6 — rare mid-tier
    ['0042',6],  // Golbat
    ['0093',6],  // Haunter
    ['0199',6],  // Slowking
    ['0210',6],  // Granbull
    ['0212',6],  // Scizor
    ['0214',6],  // Heracross
    ['0215',6],  // Sneasel
    ['0224',6],  // Octillery
    ['0233',6],  // Porygon2
    // w4 — very rare mid-tier
    ['0196',4],  // Espeon
    ['0197',4],  // Umbreon
    ['0244',4],  // Entei (early appearance)
  ],
  floor3: [  // ~lvl 10-20 — strong Pokémon & evolved forms
    // w8 — common strong
    ['0022',8],  // Fearow
    ['0024',8],  // Arbok
    ['0028',8],  // Sandslash
    ['0055',8],  // Golduck
    ['0057',8],  // Primeape
    ['0064',8],  // Kadabra
    ['0067',8],  // Machoke
    ['0076',8],  // Golem
    ['0094',8],  // Gengar
    ['0106',8],  // Hitmonlee
    ['0107',8],  // Hitmonchan
    ['0110',8],  // Weezing
    ['0115',8],  // Kangaskhan
    ['0196',8],  // Espeon
    ['0197',8],  // Umbreon
    ['0210',8],  // Granbull
    ['0212',8],  // Scizor
    ['0214',8],  // Heracross
    ['0215',8],  // Sneasel
    ['0229',8],  // Houndoom
    // w6 — uncommon strong
    ['0080',6],  // Slowbro
    ['0103',6],  // Exeggutor
    ['0112',6],  // Rhydon
    ['0119',6],  // Seaking
    ['0121',6],  // Starmie
    ['0130',6],  // Gyarados
    ['0141',6],  // Kabutops
    ['0205',6],  // Forretress
    ['0217',6],  // Ursaring
    ['0221',6],  // Piloswine
    ['0230',6],  // Kingdra
    ['0232',6],  // Donphan
    ['0235',6],  // Smeargle
    ['0242',6],  // Blissey
    ['0248',6],  // Tyranitar
    // w4 — rare strong
    ['0144',4],  // Articuno
    ['0145',4],  // Zapdos
    ['0146',4],  // Moltres
  ],
  floor4: [  // ~lvl 15-28 — rare/legendary
    // w6 — strong fully-evolved
    ['0059',6],  // Arcanine
    ['0062',6],  // Poliwrath
    ['0065',6],  // Alakazam
    ['0068',6],  // Machamp
    ['0071',6],  // Victreebel
    ['0149',6],  // Dragonite
    ['0181',6],  // Ampharos
    ['0186',6],  // Politoed
    ['0199',6],  // Slowking
    ['0232',6],  // Donphan
    // w4 — very rare / legendary
    ['0105',4],  // Marowak
    ['0130',4],  // Gyarados
    ['0142',4],  // Aerodactyl
    ['0143',4],  // Snorlax
    ['0150',4],  // Mewtwo
    ['0151',4],  // Mew
    ['0243',4],  // Raikou
    ['0244',4],  // Entei
    ['0245',4],  // Suicune
    ['0248',4],  // Tyranitar
    ['0249',4],  // Lugia
    ['0250',4],  // Ho-Oh
    ['0251',4],  // Celebi
    // w2 — ultra rare legendaries
    ['0150',2],  // Mewtwo (extra weight for drama)
    ['0249',2],  // Lugia
    ['0250',2],  // Ho-Oh
    ['0251',2],  // Celebi
  ],
};

/* ── Wild stat templates (indexed by floor) ──────────────── */
// game.js will scale these with level
const WILD_STAT_TEMPLATES = {
  // [baseHp, baseAtk, baseDef, movepools by type]
  // We resolve movepool from the Pokémon's type(s) at encounter time
};

/* ── Type → default movepool (for wild encounters) ──────── */
const TYPE_MOVEPOOLS = {
  Normal:   ['tackle','scratch','body_slam','slam','hyper_fang','rage','swift','stomp','strength','explosion','fury_swipes','refresh'],
  Fire:     ['ember','flamethrower','flame_wheel','fire_spin','lava_plume','fire_blast','meditate'],
  Water:    ['water_gun','bubble','surf','bubble_beam','water_pulse','refresh'],
  Electric: ['thundershock','thunderbolt','thunder','discharge','zap_cannon','meditate'],
  Grass:    ['vine_whip','razor_leaf','solar_beam','leech_seed','petal_blizzard','refresh'],
  Ice:      ['ice_punch','blizzard','powder_snow','aurora_beam','icy_wind','meditate'],
  Fighting: ['karate_chop','low_kick','close_combat','strength','meditate'],
  Poison:   ['poison_sting','sludge_bomb','acid','poison_powder','refresh'],
  Ground:   ['sand_attack','earthquake','mud_slap','sand_tomb','meditate'],
  Flying:   ['gust','wing_attack','swift','peck','refresh'],
  Psychic:  ['confusion','psybeam','psychic_move','meditate','refresh'],
  Bug:      ['string_shot','leech_life','megahorn','refresh'],
  Rock:     ['rock_throw','rock_blast','rollout','iron_tail','rock_slide','meditate'],
  Ghost:    ['night_shade','shadow_ball','refresh'],
  Dragon:   ['dragon_rage','dragon_breath','hyper_beam','meditate'],
  Dark:     ['bite','crunch','night_shade','refresh'],
  Steel:    ['tackle','body_slam','iron_tail','strength','meditate'],
};

/* ── Wild Pokémon base stats (abbreviated; game.js scales by level) ── */
// key: pad string
const POKEDEX = {
  // Starters are also in POKEDEX for battle reference
  '0001': { types:['Grass','Poison'], baseHp:45,  baseAtk:49,  baseDef:49,  baseSpAtk:65,  baseSpDef:65,  baseSpd:45  },
  '0002': { types:['Grass','Poison'], baseHp:60,  baseAtk:62,  baseDef:63,  baseSpAtk:80,  baseSpDef:80,  baseSpd:60  },
  '0003': { types:['Grass','Poison'], baseHp:80,  baseAtk:82,  baseDef:83,  baseSpAtk:100, baseSpDef:100, baseSpd:80  },
  '0004': { types:['Fire'],           baseHp:39,  baseAtk:52,  baseDef:43,  baseSpAtk:60,  baseSpDef:50,  baseSpd:65  },
  '0005': { types:['Fire'],           baseHp:58,  baseAtk:64,  baseDef:58,  baseSpAtk:80,  baseSpDef:65,  baseSpd:80  },
  '0006': { types:['Fire','Flying'],  baseHp:78,  baseAtk:84,  baseDef:78,  baseSpAtk:109, baseSpDef:85,  baseSpd:100 },
  '0007': { types:['Water'],          baseHp:44,  baseAtk:48,  baseDef:65,  baseSpAtk:50,  baseSpDef:64,  baseSpd:43  },
  '0008': { types:['Water'],          baseHp:59,  baseAtk:63,  baseDef:80,  baseSpAtk:65,  baseSpDef:80,  baseSpd:58  },
  '0009': { types:['Water'],          baseHp:79,  baseAtk:83,  baseDef:100, baseSpAtk:85,  baseSpDef:105, baseSpd:78  },
  '0023': { types:['Poison'],          baseHp:35, baseAtk:60, baseDef:44 },
  '0025': { types:['Electric'],       baseHp:35, baseAtk:55, baseDef:30 },
  '0026': { types:['Electric'],       baseHp:60, baseAtk:90, baseDef:55 },
  '0035': { types:['Normal'],         baseHp:70, baseAtk:45, baseDef:48 },
  '0036': { types:['Normal'],         baseHp:95, baseAtk:70, baseDef:73 },
  '0039': { types:['Normal'],         baseHp:115, baseAtk:45, baseDef:20 },
  '0040': { types:['Normal'],         baseHp:140, baseAtk:70, baseDef:45 },
  '0044': { types:['Grass','Poison'], baseHp:60, baseAtk:65, baseDef:70 },
  '0045': { types:['Grass','Poison'], baseHp:75, baseAtk:80, baseDef:85 },
  '0047': { types:['Bug','Grass'],    baseHp:60, baseAtk:95, baseDef:80 },
  '0049': { types:['Bug','Poison'],   baseHp:70, baseAtk:65, baseDef:60 },
  '0061': { types:['Water'],          baseHp:65, baseAtk:65, baseDef:65 },
  '0070': { types:['Grass','Poison'], baseHp:65, baseAtk:90, baseDef:50 },
  '0075': { types:['Rock','Ground'],  baseHp:55, baseAtk:95, baseDef:115 },
  '0082': { types:['Electric','Steel'],baseHp:50, baseAtk:60, baseDef:95 },
  '0099': { types:['Water'],          baseHp:55, baseAtk:130, baseDef:115 },
  '0101': { types:['Electric'],       baseHp:60, baseAtk:50, baseDef:70 },
  '0119': { types:['Water'],          baseHp:80, baseAtk:92, baseDef:65 },
  '0153': { types:['Grass'],          baseHp:60, baseAtk:62, baseDef:80,  baseSpAtk:80,  baseSpDef:80,  baseSpd:60  },
  '0154': { types:['Grass'],          baseHp:80, baseAtk:82, baseDef:100, baseSpAtk:100, baseSpDef:100, baseSpd:80  },
  '0156': { types:['Fire'],           baseHp:58, baseAtk:64, baseDef:58,  baseSpAtk:80,  baseSpDef:65,  baseSpd:80  },
  '0157': { types:['Fire'],           baseHp:78, baseAtk:84, baseDef:78,  baseSpAtk:109, baseSpDef:85,  baseSpd:100 },
  '0159': { types:['Water'],          baseHp:65, baseAtk:80, baseDef:80,  baseSpAtk:80,  baseSpDef:80,  baseSpd:58  },
  '0160': { types:['Water'],          baseHp:85, baseAtk:105,baseDef:100, baseSpAtk:100, baseSpDef:100, baseSpd:78  },
  '0162': { types:['Normal'],         baseHp:85, baseAtk:76, baseDef:64 },
  '0164': { types:['Normal','Flying'],baseHp:100, baseAtk:50, baseDef:50 },
  '0166': { types:['Bug','Flying'],   baseHp:55, baseAtk:35, baseDef:50 },
  '0168': { types:['Bug','Poison'],   baseHp:70, baseAtk:90, baseDef:70 },
  '0176': { types:['Normal','Flying'],baseHp:55, baseAtk:40, baseDef:85 },
  '0184': { types:['Water'],          baseHp:100, baseAtk:50, baseDef:80 },
  '0188': { types:['Grass','Flying'], baseHp:55, baseAtk:45, baseDef:50 },
  '0189': { types:['Grass','Flying'], baseHp:75, baseAtk:55, baseDef:70 },
  '0192': { types:['Grass'],          baseHp:75, baseAtk:75, baseDef:55 },
  '0195': { types:['Water','Ground'], baseHp:95, baseAtk:85, baseDef:85 },
  '0205': { types:['Bug','Steel'],    baseHp:75, baseAtk:90, baseDef:140 },
  '0217': { types:['Normal'],         baseHp:90, baseAtk:130, baseDef:75 },
  '0221': { types:['Ice','Ground'],   baseHp:100, baseAtk:100, baseDef:80 },
  '0016': { types:['Normal','Flying'], baseHp:40, baseAtk:45, baseDef:40 },
  '0017': { types:['Normal','Flying'], baseHp:63, baseAtk:60, baseDef:55 },
  '0018': { types:['Normal','Flying'], baseHp:83, baseAtk:80, baseDef:75 },
  '0019': { types:['Normal'],          baseHp:30, baseAtk:56, baseDef:35 },
  '0020': { types:['Normal'],          baseHp:55, baseAtk:81, baseDef:60 },
  '0021': { types:['Normal','Flying'], baseHp:40, baseAtk:60, baseDef:30 },
  '0022': { types:['Normal','Flying'], baseHp:65, baseAtk:90, baseDef:65 },
  '0024': { types:['Poison'],          baseHp:58, baseAtk:70, baseDef:42 },
  '0028': { types:['Ground'],          baseHp:75, baseAtk:100, baseDef:110 },
  '0034': { types:['Poison','Ground'], baseHp:81, baseAtk:92, baseDef:77 },
  '0038': { types:['Fire'],            baseHp:73, baseAtk:76, baseDef:70 },
  '0041': { types:['Poison','Flying'], baseHp:40, baseAtk:45, baseDef:35 },
  '0042': { types:['Poison','Flying'], baseHp:75, baseAtk:80, baseDef:70 },
  '0043': { types:['Grass','Poison'],  baseHp:45, baseAtk:50, baseDef:55 },
  '0046': { types:['Bug','Grass'],     baseHp:35, baseAtk:70, baseDef:55 },
  '0048': { types:['Bug','Poison'],    baseHp:60, baseAtk:55, baseDef:50 },
  '0052': { types:['Normal'],          baseHp:40, baseAtk:45, baseDef:35 },
  '0053': { types:['Normal'],          baseHp:65, baseAtk:70, baseDef:60 },
  '0055': { types:['Water'],           baseHp:80, baseAtk:82, baseDef:78 },
  '0056': { types:['Fighting'],        baseHp:40, baseAtk:80, baseDef:35 },
  '0057': { types:['Fighting'],        baseHp:65, baseAtk:105, baseDef:60 },
  '0058': { types:['Fire'],            baseHp:55, baseAtk:70, baseDef:45 },
  '0059': { types:['Fire'],            baseHp:90, baseAtk:110, baseDef:80 },
  '0060': { types:['Water'],           baseHp:40, baseAtk:50, baseDef:40 },
  '0062': { types:['Water','Fighting'],baseHp:90, baseAtk:95, baseDef:95 },
  '0063': { types:['Psychic'],         baseHp:25, baseAtk:20, baseDef:15, baseSpAtk:105, baseSpDef:55,  baseSpd:90  },
  '0064': { types:['Psychic'],         baseHp:40, baseAtk:35, baseDef:30, baseSpAtk:120, baseSpDef:70,  baseSpd:105 },
  '0065': { types:['Psychic'],         baseHp:55, baseAtk:50, baseDef:45, baseSpAtk:135, baseSpDef:95,  baseSpd:120 },
  '0066': { types:['Fighting'],        baseHp:70, baseAtk:80, baseDef:50 },
  '0067': { types:['Fighting'],        baseHp:80, baseAtk:100, baseDef:70 },
  '0068': { types:['Fighting'],        baseHp:90, baseAtk:130, baseDef:80 },
  '0069': { types:['Grass','Poison'],  baseHp:50, baseAtk:75, baseDef:35 },
  '0071': { types:['Grass','Poison'],  baseHp:80, baseAtk:105, baseDef:65 },
  '0074': { types:['Rock','Ground'],   baseHp:40, baseAtk:80, baseDef:100 },
  '0076': { types:['Rock','Ground'],   baseHp:80, baseAtk:110, baseDef:130 },
  '0079': { types:['Water','Psychic'], baseHp:95, baseAtk:75, baseDef:110 },
  '0081': { types:['Electric','Steel'],baseHp:25, baseAtk:35, baseDef:70 },
  '0088': { types:['Poison'],          baseHp:80, baseAtk:80, baseDef:50 },
  '0089': { types:['Poison'],          baseHp:105, baseAtk:105, baseDef:75 },
  '0092': { types:['Ghost','Poison'],  baseHp:30, baseAtk:35, baseDef:30, baseSpAtk:100, baseSpDef:35,  baseSpd:80  },
  '0093': { types:['Ghost','Poison'],  baseHp:45, baseAtk:50, baseDef:45, baseSpAtk:115, baseSpDef:55,  baseSpd:95  },
  '0094': { types:['Ghost','Poison'],  baseHp:60, baseAtk:65, baseDef:60, baseSpAtk:130, baseSpDef:75,  baseSpd:110 },
  '0098': { types:['Water'],           baseHp:30, baseAtk:105, baseDef:90 },
  '0100': { types:['Electric'],        baseHp:40, baseAtk:30, baseDef:50 },
  '0103': { types:['Grass','Psychic'], baseHp:95, baseAtk:95, baseDef:85 },
  '0109': { types:['Poison'],          baseHp:40, baseAtk:65, baseDef:95 },
  '0110': { types:['Poison'],          baseHp:65, baseAtk:90, baseDef:70 },
  '0115': { types:['Normal'],          baseHp:105, baseAtk:95, baseDef:80 },
  '0118': { types:['Water'],           baseHp:45, baseAtk:67, baseDef:60 },
  '0130': { types:['Water','Flying'],  baseHp:95, baseAtk:125, baseDef:79 },
  '0142': { types:['Rock','Flying'],   baseHp:80, baseAtk:105, baseDef:65 },
  '0143': { types:['Normal'],          baseHp:160, baseAtk:110, baseDef:65 },
  '0149': { types:['Dragon','Flying'], baseHp:91, baseAtk:134, baseDef:95 },
  '0152': { types:['Grass'],           baseHp:45, baseAtk:49, baseDef:65, baseSpAtk:65, baseSpDef:65, baseSpd:45 },
  '0155': { types:['Fire'],            baseHp:39, baseAtk:52, baseDef:43, baseSpAtk:60, baseSpDef:50, baseSpd:65 },
  '0158': { types:['Water'],           baseHp:50, baseAtk:65, baseDef:64, baseSpAtk:65, baseSpDef:64, baseSpd:43 },
  '0161': { types:['Normal'],          baseHp:35, baseAtk:46, baseDef:34 },
  '0163': { types:['Normal','Flying'], baseHp:60, baseAtk:30, baseDef:30 },
  '0165': { types:['Bug'],             baseHp:40, baseAtk:20, baseDef:30 },
  '0167': { types:['Bug','Poison'],    baseHp:40, baseAtk:60, baseDef:40 },
  '0172': { types:['Electric'],        baseHp:20, baseAtk:40, baseDef:15 },
  '0173': { types:['Normal'],          baseHp:50, baseAtk:25, baseDef:28 },
  '0174': { types:['Normal'],          baseHp:90, baseAtk:30, baseDef:15 },
  '0175': { types:['Normal'],          baseHp:35, baseAtk:20, baseDef:65 },
  '0183': { types:['Water'],           baseHp:70, baseAtk:20, baseDef:50 },
  '0187': { types:['Grass','Flying'],  baseHp:35, baseAtk:35, baseDef:35 },
  '0191': { types:['Grass'],           baseHp:30, baseAtk:30, baseDef:30 },
  '0193': { types:['Bug','Flying'],    baseHp:65, baseAtk:65, baseDef:45 },
  '0194': { types:['Water','Ground'],  baseHp:55, baseAtk:45, baseDef:45 },
  '0196': { types:['Psychic'],         baseHp:65, baseAtk:65, baseDef:60,  baseSpAtk:130, baseSpDef:95,  baseSpd:110 },
  '0197': { types:['Dark'],            baseHp:95, baseAtk:65, baseDef:110, baseSpAtk:110, baseSpDef:130, baseSpd:65  },
  '0198': { types:['Dark','Flying'],   baseHp:60, baseAtk:85, baseDef:42 },
  '0204': { types:['Bug'],             baseHp:50, baseAtk:65, baseDef:90 },
  '0207': { types:['Ground','Flying'], baseHp:65, baseAtk:75, baseDef:105 },
  '0209': { types:['Normal'],          baseHp:60, baseAtk:80, baseDef:50 },
  '0210': { types:['Normal'],          baseHp:90, baseAtk:120, baseDef:75 },
  '0212': { types:['Bug','Steel'],     baseHp:70, baseAtk:130, baseDef:100 },
  '0214': { types:['Bug','Fighting'],  baseHp:80, baseAtk:125, baseDef:75 },
  '0215': { types:['Dark','Ice'],      baseHp:55, baseAtk:95, baseDef:55 },
  '0216': { types:['Normal'],          baseHp:60, baseAtk:80, baseDef:50 },
  '0220': { types:['Ice','Ground'],    baseHp:50, baseAtk:50, baseDef:40 },
  '0229': { types:['Dark','Fire'],     baseHp:75, baseAtk:90, baseDef:50 },
  '0230': { types:['Water','Dragon'],  baseHp:75, baseAtk:95, baseDef:95 },
  '0232': { types:['Ground'],          baseHp:90, baseAtk:120, baseDef:120 },
  '0235': { types:['Normal'],          baseHp:55, baseAtk:20, baseDef:35 },
  '0243': { types:['Electric'],        baseHp:90, baseAtk:85, baseDef:75 },
  '0244': { types:['Fire'],            baseHp:115, baseAtk:115, baseDef:85 },
  '0245': { types:['Water'],           baseHp:100, baseAtk:75, baseDef:115 },
  '0248': { types:['Rock','Dark'],     baseHp:100, baseAtk:134, baseDef:110 },
  '0249': { types:['Psychic','Flying'],baseHp:106, baseAtk:90, baseDef:130 },
  // ── Missing Gen I entries ──────────────────────────────────
  '0010': { types:['Bug'],                baseHp:45,  baseAtk:30,  baseDef:35  },
  '0011': { types:['Bug'],                baseHp:50,  baseAtk:20,  baseDef:55  },
  '0012': { types:['Bug','Flying'],       baseHp:60,  baseAtk:45,  baseDef:50  },
  '0013': { types:['Bug','Poison'],       baseHp:40,  baseAtk:35,  baseDef:30  },
  '0014': { types:['Bug','Poison'],       baseHp:45,  baseAtk:25,  baseDef:50  },
  '0015': { types:['Bug','Poison'],       baseHp:65,  baseAtk:90,  baseDef:40  },
  '0027': { types:['Ground'],             baseHp:50,  baseAtk:75,  baseDef:85  },
  '0029': { types:['Poison'],             baseHp:55,  baseAtk:47,  baseDef:52  },
  '0030': { types:['Poison'],             baseHp:70,  baseAtk:62,  baseDef:67  },
  '0031': { types:['Poison','Ground'],    baseHp:90,  baseAtk:82,  baseDef:87  },
  '0032': { types:['Poison'],             baseHp:46,  baseAtk:57,  baseDef:40  },
  '0033': { types:['Poison'],             baseHp:61,  baseAtk:72,  baseDef:57  },
  '0037': { types:['Fire'],               baseHp:38,  baseAtk:41,  baseDef:40  },
  '0050': { types:['Ground'],             baseHp:10,  baseAtk:55,  baseDef:25  },
  '0051': { types:['Ground'],             baseHp:35,  baseAtk:100, baseDef:50  },
  '0054': { types:['Water'],              baseHp:50,  baseAtk:52,  baseDef:48  },
  '0072': { types:['Water','Poison'],     baseHp:40,  baseAtk:40,  baseDef:35  },
  '0073': { types:['Water','Poison'],     baseHp:80,  baseAtk:70,  baseDef:65  },
  '0077': { types:['Fire'],               baseHp:50,  baseAtk:85,  baseDef:55  },
  '0078': { types:['Fire'],               baseHp:65,  baseAtk:100, baseDef:70  },
  '0080': { types:['Water','Psychic'],    baseHp:95,  baseAtk:75,  baseDef:110 },
  '0083': { types:['Normal','Flying'],    baseHp:52,  baseAtk:65,  baseDef:55  },
  '0084': { types:['Normal','Flying'],    baseHp:35,  baseAtk:85,  baseDef:45  },
  '0085': { types:['Normal','Flying'],    baseHp:60,  baseAtk:110, baseDef:70  },
  '0086': { types:['Water'],              baseHp:65,  baseAtk:45,  baseDef:55  },
  '0087': { types:['Water','Ice'],        baseHp:90,  baseAtk:70,  baseDef:80  },
  '0090': { types:['Water'],              baseHp:30,  baseAtk:65,  baseDef:100 },
  '0091': { types:['Water','Ice'],        baseHp:50,  baseAtk:95,  baseDef:180 },
  '0095': { types:['Rock','Ground'],      baseHp:35,  baseAtk:45,  baseDef:160 },
  '0096': { types:['Psychic'],            baseHp:60,  baseAtk:48,  baseDef:45  },
  '0097': { types:['Psychic'],            baseHp:85,  baseAtk:73,  baseDef:70  },
  '0102': { types:['Grass','Psychic'],    baseHp:60,  baseAtk:40,  baseDef:80  },
  '0104': { types:['Ground'],             baseHp:50,  baseAtk:50,  baseDef:95  },
  '0105': { types:['Ground'],             baseHp:60,  baseAtk:80,  baseDef:110 },
  '0106': { types:['Fighting'],           baseHp:50,  baseAtk:120, baseDef:53  },
  '0107': { types:['Fighting'],           baseHp:50,  baseAtk:105, baseDef:79  },
  '0108': { types:['Normal'],             baseHp:90,  baseAtk:55,  baseDef:75  },
  '0111': { types:['Ground','Rock'],      baseHp:80,  baseAtk:85,  baseDef:95  },
  '0112': { types:['Ground','Rock'],      baseHp:105, baseAtk:130, baseDef:120 },
  '0113': { types:['Normal'],             baseHp:250, baseAtk:5,   baseDef:5   },
  '0114': { types:['Grass'],              baseHp:65,  baseAtk:55,  baseDef:115 },
  '0116': { types:['Water'],              baseHp:30,  baseAtk:40,  baseDef:70  },
  '0117': { types:['Water'],              baseHp:55,  baseAtk:65,  baseDef:95  },
  '0120': { types:['Water'],              baseHp:30,  baseAtk:45,  baseDef:55  },
  '0121': { types:['Water','Psychic'],    baseHp:60,  baseAtk:75,  baseDef:85  },
  '0122': { types:['Psychic'],            baseHp:40,  baseAtk:45,  baseDef:65  },
  '0123': { types:['Bug','Flying'],       baseHp:70,  baseAtk:110, baseDef:80  },
  '0124': { types:['Ice','Psychic'],      baseHp:65,  baseAtk:50,  baseDef:35,  baseSpAtk:115 },
  '0125': { types:['Electric'],           baseHp:65,  baseAtk:83,  baseDef:57  },
  '0126': { types:['Fire'],               baseHp:65,  baseAtk:95,  baseDef:57  },
  '0127': { types:['Bug'],                baseHp:65,  baseAtk:125, baseDef:100 },
  '0128': { types:['Normal'],             baseHp:75,  baseAtk:100, baseDef:95  },
  '0129': { types:['Water'],              baseHp:20,  baseAtk:10,  baseDef:55  },
  '0131': { types:['Water','Ice'],        baseHp:130, baseAtk:85,  baseDef:80  },
  '0132': { types:['Normal'],             baseHp:48,  baseAtk:48,  baseDef:48  },
  '0133': { types:['Normal'],             baseHp:55,  baseAtk:55,  baseDef:50  },
  '0134': { types:['Water'],              baseHp:130, baseAtk:65,  baseDef:60  },
  '0135': { types:['Electric'],           baseHp:65,  baseAtk:65,  baseDef:60  },
  '0136': { types:['Fire'],               baseHp:65,  baseAtk:130, baseDef:60  },
  '0137': { types:['Normal'],             baseHp:65,  baseAtk:60,  baseDef:70  },
  '0138': { types:['Rock','Water'],       baseHp:35,  baseAtk:40,  baseDef:100 },
  '0139': { types:['Rock','Water'],       baseHp:70,  baseAtk:60,  baseDef:125 },
  '0140': { types:['Rock','Water'],       baseHp:30,  baseAtk:80,  baseDef:90  },
  '0141': { types:['Rock','Water'],       baseHp:60,  baseAtk:115, baseDef:105 },
  '0144': { types:['Ice','Flying'],       baseHp:90,  baseAtk:85,  baseDef:100 },
  '0145': { types:['Electric','Flying'],  baseHp:90,  baseAtk:90,  baseDef:85  },
  '0146': { types:['Fire','Flying'],      baseHp:90,  baseAtk:100, baseDef:90  },
  '0147': { types:['Dragon'],             baseHp:41,  baseAtk:64,  baseDef:45  },
  '0148': { types:['Dragon'],             baseHp:61,  baseAtk:84,  baseDef:65  },
  '0150': { types:['Psychic'],            baseHp:106, baseAtk:110, baseDef:90,  baseSpAtk:154, baseSpDef:90,  baseSpd:130 },
  '0151': { types:['Psychic'],            baseHp:100, baseAtk:100, baseDef:100, baseSpAtk:100, baseSpDef:100, baseSpd:100 },
  // ── Missing Gen II entries ─────────────────────────────────
  // Golbat evo-line completion
  '0169': { types:['Poison','Flying'],    baseHp:85,  baseAtk:90,  baseDef:80  },
  // Chinchou / Lanturn
  '0170': { types:['Water','Electric'],   baseHp:75,  baseAtk:38,  baseDef:38  },
  '0171': { types:['Water','Electric'],   baseHp:125, baseAtk:58,  baseDef:58  },
  '0177': { types:['Psychic','Flying'],   baseHp:40,  baseAtk:50,  baseDef:45  },
  '0178': { types:['Psychic','Flying'],   baseHp:65,  baseAtk:75,  baseDef:70  },
  '0179': { types:['Electric'],           baseHp:55,  baseAtk:40,  baseDef:40  },
  '0180': { types:['Electric'],           baseHp:70,  baseAtk:55,  baseDef:55  },
  '0181': { types:['Electric'],           baseHp:90,  baseAtk:75,  baseDef:85  },
  '0182': { types:['Grass'],              baseHp:75,  baseAtk:80,  baseDef:95  },
  '0185': { types:['Rock'],               baseHp:70,  baseAtk:100, baseDef:115 },
  '0186': { types:['Water'],              baseHp:90,  baseAtk:75,  baseDef:75  },
  '0190': { types:['Normal'],             baseHp:55,  baseAtk:70,  baseDef:55  },
  '0199': { types:['Water','Psychic'],    baseHp:95,  baseAtk:75,  baseDef:80  },
  '0200': { types:['Ghost'],              baseHp:60,  baseAtk:60,  baseDef:60  },
  '0201': { types:['Psychic'],            baseHp:48,  baseAtk:72,  baseDef:48  },
  '0202': { types:['Psychic'],            baseHp:190, baseAtk:33,  baseDef:58  },
  '0203': { types:['Normal','Psychic'],   baseHp:70,  baseAtk:80,  baseDef:65  },
  '0206': { types:['Normal'],             baseHp:100, baseAtk:70,  baseDef:70  },
  '0208': { types:['Steel','Ground'],     baseHp:75,  baseAtk:85,  baseDef:200 },
  '0211': { types:['Water','Poison'],     baseHp:65,  baseAtk:95,  baseDef:75  },
  '0213': { types:['Bug','Rock'],         baseHp:20,  baseAtk:10,  baseDef:230 },
  '0218': { types:['Fire'],               baseHp:40,  baseAtk:40,  baseDef:40  },
  '0219': { types:['Fire','Rock'],        baseHp:50,  baseAtk:50,  baseDef:120 },
  '0222': { types:['Water','Rock'],       baseHp:55,  baseAtk:55,  baseDef:85  },
  '0223': { types:['Water'],              baseHp:35,  baseAtk:65,  baseDef:35  },
  '0224': { types:['Water'],              baseHp:75,  baseAtk:105, baseDef:75  },
  '0225': { types:['Ice','Flying'],       baseHp:45,  baseAtk:55,  baseDef:45  },
  '0226': { types:['Water','Flying'],     baseHp:65,  baseAtk:40,  baseDef:70  },
  '0227': { types:['Steel','Flying'],     baseHp:65,  baseAtk:80,  baseDef:140 },
  '0228': { types:['Dark','Fire'],        baseHp:45,  baseAtk:60,  baseDef:30  },
  '0231': { types:['Ground'],             baseHp:90,  baseAtk:60,  baseDef:60  },
  '0233': { types:['Normal'],             baseHp:85,  baseAtk:80,  baseDef:90  },
  '0234': { types:['Normal'],             baseHp:73,  baseAtk:95,  baseDef:62  },
  '0236': { types:['Fighting'],           baseHp:35,  baseAtk:35,  baseDef:35  },
  '0237': { types:['Fighting'],           baseHp:50,  baseAtk:95,  baseDef:95  },
  '0238': { types:['Ice','Psychic'],      baseHp:45,  baseAtk:30,  baseDef:15  },
  '0239': { types:['Electric'],           baseHp:45,  baseAtk:63,  baseDef:37  },
  '0240': { types:['Fire'],               baseHp:45,  baseAtk:75,  baseDef:37  },
  '0241': { types:['Normal'],             baseHp:95,  baseAtk:80,  baseDef:105 },
  '0242': { types:['Normal'],             baseHp:255, baseAtk:10,  baseDef:10  },
  '0246': { types:['Rock','Ground'],      baseHp:50,  baseAtk:64,  baseDef:50  },
  '0247': { types:['Rock','Ground'],      baseHp:70,  baseAtk:84,  baseDef:70  },
  '0250': { types:['Fire','Flying'],      baseHp:106, baseAtk:130, baseDef:90  },
  '0251': { types:['Psychic','Grass'],    baseHp:100, baseAtk:100, baseDef:100 },
};

/* ── Boss definitions ─────────────────────────────────────── */
const BOSSES = {
  floor1: {
    pad: '0059',   // Arcanine
    name: 'Arcanine',
    level: 10,
    types: ['Fire'],
    baseHp: 90, baseAtk: 110, baseDef: 80,
    movepool: ['ember','flamethrower','bite','meditate'],
    portrait: { normal:[0,0], hurt:[0,1] },
    isBoss: true,
  },
  floor2: {
    pad: '0130',   // Gyarados
    name: 'Gyarados',
    level: 18,
    types: ['Water','Flying'],
    baseHp: 95, baseAtk: 125, baseDef: 79,
    movepool: ['bite','crunch','surf','meditate'],
    portrait: { normal:[0,0], hurt:[0,1] },
    isBoss: true,
  },
  floor3: {
    pad: '0094',   // Gengar
    name: 'Gengar',
    level: 25,
    types: ['Ghost','Poison'],
    baseHp: 60, baseAtk: 65, baseDef: 60,
    movepool: ['shadow_ball','night_shade','sludge_bomb','meditate'],
    portrait: { normal:[0,0], hurt:[0,1] },
    isBoss: true,
  },
  floor4: {
    pad: '0149',   // Dragonite
    name: 'Dragonite',
    level: 32,
    types: ['Dragon','Flying'],
    baseHp: 91, baseAtk: 134, baseDef: 95,
    movepool: ['dragon_breath','dragon_rage','thunder','meditate'],
    portrait: { normal:[0,0], hurt:[0,1] },
    isBoss: true,
  },
};

/* ── Wild encounter builder ───────────────────────────────── */
function pickWild(floor) {
  const table = WILD_TABLES[`floor${floor}`];
  const total = table.reduce((s,[,w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [pad, w] of table) {
    r -= w;
    if (r <= 0) return pad;
  }
  return table[0][0];
}

function buildWildPoke(pad, level) {
  const base = POKEDEX[pad];
  if (!base) return null;
  const types = base.types;
  // Build a 4-move pool from the Pokémon's types
  const pool = [];
  for (const t of types) {
    const moves = TYPE_MOVEPOOLS[t] || [];
    for (const m of moves) if (!pool.includes(m)) pool.push(m);
  }
  // Always have at least tackle
  if (!pool.includes('tackle')) pool.unshift('tackle');
  // Ensure one EN recovery move is always in the final 4
  const enMoves = ['meditate', 'refresh'];
  const hasEnMove = pool.some(m => enMoves.includes(m));
  if (!hasEnMove) pool.push('refresh');
  const enMove = pool.find(m => enMoves.includes(m));
  const rest = pool.filter(m => !enMoves.includes(m));
  const shuffle = [...rest].sort(() => Math.random() - 0.5);
  const movepool = [enMove, ...shuffle].slice(0, 4);

  return {
    pad,
    name: padToName(pad),
    types,
    level,
    baseHp:  base.baseHp,
    baseAtk: base.baseAtk,
    baseDef: base.baseDef,
    movepool,
    portrait: { normal:[0,0], hurt:[0,1] },
    char: pad,
    animData: null,
    isBoss: false,
  };
}

// Minimal name map for wild Pokémon (used for UI display)
const PAD_NAMES = {
  // Gen I
  '0001':'Bulbasaur','0002':'Ivysaur','0003':'Venusaur',
  '0004':'Charmander','0005':'Charmeleon','0006':'Charizard',
  '0007':'Squirtle','0008':'Wartortle','0009':'Blastoise',
  '0010':'Caterpie','0011':'Metapod','0012':'Butterfree',
  '0013':'Weedle','0014':'Kakuna','0015':'Beedrill',
  '0016':'Pidgey','0017':'Pidgeotto','0018':'Pidgeot',
  '0019':'Rattata','0020':'Raticate',
  '0021':'Spearow','0022':'Fearow',
  '0023':'Ekans','0024':'Arbok',
  '0025':'Pikachu','0026':'Raichu',
  '0027':'Sandshrew','0028':'Sandslash',
  '0029':'Nidoran♀','0030':'Nidorina','0031':'Nidoqueen',
  '0032':'Nidoran♂','0033':'Nidorino','0034':'Nidoking',
  '0035':'Clefairy','0036':'Clefable',
  '0037':'Vulpix','0038':'Ninetales',
  '0039':'Jigglypuff','0040':'Wigglytuff',
  '0041':'Zubat','0042':'Golbat',
  '0043':'Oddish','0044':'Gloom','0045':'Vileplume',
  '0046':'Paras','0047':'Parasect',
  '0048':'Venonat','0049':'Venomoth',
  '0050':'Diglett','0051':'Dugtrio',
  '0052':'Meowth','0053':'Persian',
  '0054':'Psyduck','0055':'Golduck',
  '0056':'Mankey','0057':'Primeape',
  '0058':'Growlithe','0059':'Arcanine',
  '0060':'Poliwag','0061':'Poliwhirl','0062':'Poliwrath',
  '0063':'Abra','0064':'Kadabra','0065':'Alakazam',
  '0066':'Machop','0067':'Machoke','0068':'Machamp',
  '0069':'Bellsprout','0070':'Weepinbell','0071':'Victreebel',
  '0072':'Tentacool','0073':'Tentacruel',
  '0074':'Geodude','0075':'Graveler','0076':'Golem',
  '0077':'Ponyta','0078':'Rapidash',
  '0079':'Slowpoke','0080':'Slowbro',
  '0081':'Magnemite','0082':'Magneton',
  '0083':"Farfetch'd",'0084':'Doduo','0085':'Dodrio',
  '0086':'Seel','0087':'Dewgong',
  '0088':'Grimer','0089':'Muk',
  '0090':'Shellder','0091':'Cloyster',
  '0092':'Gastly','0093':'Haunter','0094':'Gengar',
  '0095':'Onix',
  '0096':'Drowzee','0097':'Hypno',
  '0098':'Krabby','0099':'Kingler',
  '0100':'Voltorb','0101':'Electrode',
  '0102':'Exeggcute','0103':'Exeggutor',
  '0104':'Cubone','0105':'Marowak',
  '0106':'Hitmonlee','0107':'Hitmonchan',
  '0108':'Lickitung',
  '0109':'Koffing','0110':'Weezing',
  '0111':'Rhyhorn','0112':'Rhydon',
  '0113':'Chansey',
  '0114':'Tangela',
  '0115':'Kangaskhan',
  '0116':'Horsea','0117':'Seadra',
  '0118':'Goldeen','0119':'Seaking',
  '0120':'Staryu','0121':'Starmie',
  '0122':'Mr. Mime','0123':'Scyther',
  '0124':'Jynx','0125':'Electabuzz','0126':'Magmar',
  '0127':'Pinsir',
  '0128':'Tauros',
  '0129':'Magikarp','0130':'Gyarados',
  '0131':'Lapras',
  '0132':'Ditto',
  '0133':'Eevee','0134':'Vaporeon','0135':'Jolteon','0136':'Flareon',
  '0137':'Porygon',
  '0138':'Omanyte','0139':'Omastar',
  '0140':'Kabuto','0141':'Kabutops',
  '0142':'Aerodactyl',
  '0143':'Snorlax',
  '0144':'Articuno','0145':'Zapdos','0146':'Moltres',
  '0147':'Dratini','0148':'Dragonair','0149':'Dragonite',
  '0150':'Mewtwo','0151':'Mew',
  // Gen II
  '0152':'Chikorita','0153':'Bayleef','0154':'Meganium',
  '0155':'Cyndaquil','0156':'Quilava','0157':'Typhlosion',
  '0158':'Totodile','0159':'Croconaw','0160':'Feraligatr',
  '0161':'Sentret','0162':'Furret',
  '0163':'Hoothoot','0164':'Noctowl',
  '0165':'Ledyba','0166':'Ledian',
  '0167':'Spinarak','0168':'Ariados',
  '0169':'Crobat',
  '0170':'Chinchou','0171':'Lanturn',
  '0172':'Pichu','0173':'Cleffa','0174':'Igglybuff',
  '0175':'Togepi','0176':'Togetic',
  '0177':'Natu','0178':'Xatu',
  '0179':'Mareep','0180':'Flaaffy','0181':'Ampharos',
  '0182':'Bellossom',
  '0183':'Marill','0184':'Azumarill',
  '0185':'Sudowoodo',
  '0186':'Politoed',
  '0187':'Hoppip','0188':'Skiploom','0189':'Jumpluff',
  '0190':'Aipom',
  '0191':'Sunkern','0192':'Sunflora',
  '0193':'Yanma',
  '0194':'Wooper','0195':'Quagsire',
  '0196':'Espeon','0197':'Umbreon',
  '0198':'Murkrow',
  '0199':'Slowking',
  '0200':'Misdreavus',
  '0201':'Unown',
  '0202':'Wobbuffet',
  '0203':'Girafarig',
  '0204':'Pineco','0205':'Forretress',
  '0206':'Dunsparce',
  '0207':'Gligar',
  '0208':'Steelix',
  '0209':'Snubbull','0210':'Granbull',
  '0211':'Qwilfish',
  '0212':'Scizor',
  '0213':'Shuckle',
  '0214':'Heracross',
  '0215':'Sneasel',
  '0216':'Teddiursa','0217':'Ursaring',
  '0218':'Slugma','0219':'Magcargo',
  '0220':'Swinub','0221':'Piloswine',
  '0222':'Corsola',
  '0223':'Remoraid','0224':'Octillery',
  '0225':'Delibird',
  '0226':'Mantine',
  '0227':'Skarmory',
  '0228':'Houndour','0229':'Houndoom',
  '0230':'Kingdra',
  '0231':'Phanpy','0232':'Donphan',
  '0233':'Porygon2',
  '0234':'Stantler',
  '0235':'Smeargle',
  '0236':'Tyrogue','0237':'Hitmontop',
  '0238':'Smoochum','0239':'Elekid','0240':'Magby',
  '0241':'Miltank',
  '0242':'Blissey',
  '0243':'Raikou','0244':'Entei','0245':'Suicune',
  '0246':'Larvitar','0247':'Pupitar','0248':'Tyranitar',
  '0249':'Lugia','0250':'Ho-Oh',
  '0251':'Celebi',
};
function padToName(pad) { return PAD_NAMES[pad] || `#${pad}`; }

/* ── Evolution chains ─────────────────────────────────────────
   level = minimum level for this form to evolve into the next.
   Thresholds are ~1/5 of the original game's evolution levels.
   ──────────────────────────────────────────────────────────── */
const EVOLUTION_CHAINS = {
  // Kanto starters
  '0001':{ to:'0002', level:3 }, '0002':{ to:'0003', level:6 },
  '0004':{ to:'0005', level:3 }, '0005':{ to:'0006', level:7 },
  '0007':{ to:'0008', level:3 }, '0008':{ to:'0009', level:7 },
  // Johto starters
  '0152':{ to:'0153', level:4 }, '0153':{ to:'0154', level:6 },
  '0155':{ to:'0156', level:3 }, '0156':{ to:'0157', level:7 },
  '0158':{ to:'0159', level:4 }, '0159':{ to:'0160', level:6 },
  // Birds / rodents
  '0016':{ to:'0017', level:4 }, '0017':{ to:'0018', level:7 },
  '0019':{ to:'0020', level:4 },
  '0021':{ to:'0022', level:4 },
  // Sandshrew / Sandslash
  '0027':{ to:'0028', level:4 },
  // Ekans / Arbok
  '0023':{ to:'0024', level:4 },
  // Meowth / Persian
  '0052':{ to:'0053', level:6 },
  // Grimer / Muk
  '0088':{ to:'0089', level:6 },
  // Koffing / Weezing
  '0109':{ to:'0110', level:6 },
  // Pichu / Pikachu / Raichu
  '0172':{ to:'0025', level:3 }, '0025':{ to:'0026', level:7 },
  // Cleffa / Clefairy / Clefable
  '0173':{ to:'0035', level:3 }, '0035':{ to:'0036', level:7 },
  // Igglybuff / Jigglypuff / Wigglytuff
  '0174':{ to:'0039', level:3 }, '0039':{ to:'0040', level:7 },
  // Togepi / Togetic
  '0175':{ to:'0176', level:3 },
  // Zubat / Golbat / Crobat
  '0041':{ to:'0042', level:4 }, '0042':{ to:'0169', level:7 },
  // Chinchou / Lanturn
  '0170':{ to:'0171', level:5 },
  // Oddish / Gloom / Vileplume
  '0043':{ to:'0044', level:4 }, '0044':{ to:'0045', level:8 },
  // Paras / Parasect
  '0046':{ to:'0047', level:5 },
  // Venonat / Venomoth
  '0048':{ to:'0049', level:6 },
  // Abra / Kadabra / Alakazam
  '0063':{ to:'0064', level:3 }, '0064':{ to:'0065', level:7 },
  // Machop / Machoke / Machamp
  '0066':{ to:'0067', level:6 }, '0067':{ to:'0068', level:8 },
  // Bellsprout / Weepinbell / Victreebel
  '0069':{ to:'0070', level:4 }, '0070':{ to:'0071', level:7 },
  // Geodude / Graveler / Golem
  '0074':{ to:'0075', level:5 }, '0075':{ to:'0076', level:8 },
  // Poliwag / Poliwhirl / Poliwrath
  '0060':{ to:'0061', level:5 }, '0061':{ to:'0062', level:7 },
  // Slowpoke (stone evo — we use level for simplicity)
  '0079':{ to:'0080', level:7 },
  // Magnemite / Magneton
  '0081':{ to:'0082', level:6 },
  // Gastly / Haunter / Gengar
  '0092':{ to:'0093', level:5 }, '0093':{ to:'0094', level:8 },
  // Krabby / Kingler
  '0098':{ to:'0099', level:6 },
  // Voltorb / Electrode
  '0100':{ to:'0101', level:6 },
  // Goldeen / Seaking
  '0118':{ to:'0119', level:7 },
  // Mankey / Primeape
  '0056':{ to:'0057', level:6 },
  // Growlithe / Arcanine
  '0058':{ to:'0059', level:6 },
  // Sentret / Furret
  '0161':{ to:'0162', level:3 },
  // Hoothoot / Noctowl
  '0163':{ to:'0164', level:4 },
  // Ledyba / Ledian
  '0165':{ to:'0166', level:4 },
  // Spinarak / Ariados
  '0167':{ to:'0168', level:4 },
  // Marill / Azumarill
  '0183':{ to:'0184', level:4 },
  // Hoppip / Skiploom / Jumpluff
  '0187':{ to:'0188', level:4 }, '0188':{ to:'0189', level:5 },
  // Sunkern / Sunflora
  '0191':{ to:'0192', level:5 },
  // Wooper / Quagsire
  '0194':{ to:'0195', level:4 },
  // Pineco / Forretress
  '0204':{ to:'0205', level:5 },
  // Snubbull / Granbull
  '0209':{ to:'0210', level:5 },
  // Teddiursa / Ursaring
  '0216':{ to:'0217', level:6 },
  // Swinub / Piloswine
  '0220':{ to:'0221', level:7 },
  // Bug lines
  '0010':{ to:'0011', level:3 }, '0011':{ to:'0012', level:5 },
  '0013':{ to:'0014', level:3 }, '0014':{ to:'0015', level:5 },
  // Nidoran lines
  '0029':{ to:'0030', level:4 }, '0030':{ to:'0031', level:7 },
  '0032':{ to:'0033', level:4 }, '0033':{ to:'0034', level:7 },
  // Vulpix / Ninetales
  '0037':{ to:'0038', level:6 },
  // Diglett / Dugtrio
  '0050':{ to:'0051', level:5 },
  // Psyduck / Golduck
  '0054':{ to:'0055', level:5 },
  // Tentacool / Tentacruel
  '0072':{ to:'0073', level:6 },
  // Ponyta / Rapidash
  '0077':{ to:'0078', level:6 },
  // Doduo / Dodrio
  '0084':{ to:'0085', level:5 },
  // Seel / Dewgong
  '0086':{ to:'0087', level:6 },
  // Shellder / Cloyster
  '0090':{ to:'0091', level:6 },
  // Onix / Steelix
  '0095':{ to:'0208', level:8 },
  // Drowzee / Hypno
  '0096':{ to:'0097', level:5 },
  // Exeggcute / Exeggutor
  '0102':{ to:'0103', level:6 },
  // Cubone / Marowak
  '0104':{ to:'0105', level:6 },
  // Rhyhorn / Rhydon
  '0111':{ to:'0112', level:6 },
  // Horsea / Seadra / Kingdra
  '0116':{ to:'0117', level:5 }, '0117':{ to:'0230', level:8 },
  // Staryu / Starmie
  '0120':{ to:'0121', level:5 },
  // Magikarp / Gyarados
  '0129':{ to:'0130', level:4 },
  // Eevee / Vaporeon
  '0133':{ to:'0134', level:6 },
  // Omanyte / Omastar
  '0138':{ to:'0139', level:6 },
  // Kabuto / Kabutops
  '0140':{ to:'0141', level:6 },
  // Dratini / Dragonair / Dragonite
  '0147':{ to:'0148', level:5 }, '0148':{ to:'0149', level:8 },
  // Chansey / Blissey
  '0113':{ to:'0242', level:8 },
  // Porygon / Porygon2
  '0137':{ to:'0233', level:7 },
  // Natu / Xatu
  '0177':{ to:'0178', level:5 },
  // Mareep / Flaaffy / Ampharos
  '0179':{ to:'0180', level:4 }, '0180':{ to:'0181', level:7 },
  // Remoraid / Octillery
  '0223':{ to:'0224', level:5 },
  // Houndour / Houndoom
  '0228':{ to:'0229', level:5 },
  // Phanpy / Donphan
  '0231':{ to:'0232', level:6 },
  // Larvitar / Pupitar / Tyranitar
  '0246':{ to:'0247', level:5 }, '0247':{ to:'0248', level:8 },
  // Slugma / Magcargo
  '0218':{ to:'0219', level:6 },
  // Tyrogue / Hitmontop
  '0236':{ to:'0237', level:5 },
  // Elekid / Electabuzz
  '0239':{ to:'0125', level:5 },
  // Magby / Magmar
  '0240':{ to:'0126', level:5 },
  // Smoochum / Jynx
  '0238':{ to:'0124', level:5 },
};

/* Walk the chain: return the highest evolution the given level can reach */
function evolveForLevel(pad, level) {
  let current = pad;
  for (;;) {
    const chain = EVOLUTION_CHAINS[current];
    if (!chain || level < chain.level) return current;
    current = chain.to;
  }
}

/* Reverse-walk the chain: return the base form pad */
function getBasePad(pad) {
  let current = pad;
  for (;;) {
    const parentEntry = Object.entries(EVOLUTION_CHAINS).find(([, v]) => v.to === current);
    if (!parentEntry) return current;  // 더 이상 parent 없음 → base form
    current = parentEntry[0];
  }
}


/* ── Pokémon default learnsets ──────────────────────────────────
   Source: serebii.net Gen II (Gold/Silver) level-up learnsets
   Level scaling: original_level ÷ 5, rounded, minimum 1
   fixedMoves: lowest-level 1-2 moves (always in moveset)
   randomPool: remaining moves (pick randomCount per battle)
   ─────────────────────────────────────────────────────────────── */
const POKEMON_LEARNSETS = {
  '0001': {  // Bulbasaur
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'leech_seed' },
      { level: 2, move: 'vine_whip' },
      { level: 3, move: 'poison_powder' },
      { level: 3, move: 'sleep_powder' },
      { level: 4, move: 'razor_leaf' },
      { level: 5, move: 'sweet_scent' },
      { level: 6, move: 'growth' },
      { level: 8, move: 'synthesis' },
      { level: 9, move: 'solar_beam' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['leech_seed', 'vine_whip', 'poison_powder', 'sleep_powder', 'razor_leaf', 'sweet_scent', 'growth', 'synthesis', 'solar_beam'],
    randomCount: 9,
  },
  '0002': {  // Ivysaur
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'leech_seed' },
      { level: 2, move: 'vine_whip' },
      { level: 3, move: 'poison_powder' },
      { level: 3, move: 'sleep_powder' },
      { level: 4, move: 'razor_leaf' },
      { level: 6, move: 'sweet_scent' },
      { level: 8, move: 'growth' },
      { level: 9, move: 'synthesis' },
      { level: 11, move: 'solar_beam' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['leech_seed', 'vine_whip', 'poison_powder', 'sleep_powder', 'razor_leaf', 'sweet_scent', 'growth', 'synthesis', 'solar_beam'],
    randomCount: 9,
  },
  '0003': {  // Venusaur
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'leech_seed' },
      { level: 1, move: 'vine_whip' },
      { level: 3, move: 'poison_powder' },
      { level: 3, move: 'sleep_powder' },
      { level: 4, move: 'razor_leaf' },
      { level: 6, move: 'sweet_scent' },
      { level: 8, move: 'growth' },
      { level: 11, move: 'synthesis' },
      { level: 13, move: 'solar_beam' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['leech_seed', 'vine_whip', 'poison_powder', 'sleep_powder', 'razor_leaf', 'sweet_scent', 'growth', 'synthesis', 'solar_beam'],
    randomCount: 9,
  },
  '0004': {  // Charmander
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'ember' },
      { level: 3, move: 'smokescreen' },
      { level: 4, move: 'rage' },
      { level: 5, move: 'scary_face' },
      { level: 6, move: 'flamethrower' },
      { level: 7, move: 'slash' },
      { level: 9, move: 'dragon_rage' },
      { level: 10, move: 'fire_spin' },
    ],
    fixedMoves:  ['scratch', 'growl'],
    randomPool:  ['ember', 'smokescreen', 'rage', 'scary_face', 'flamethrower', 'slash', 'dragon_rage', 'fire_spin'],
    randomCount: 8,
  },
  '0005': {  // Charmeleon
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'ember' },
      { level: 3, move: 'smokescreen' },
      { level: 4, move: 'rage' },
      { level: 5, move: 'scary_face' },
      { level: 7, move: 'flamethrower' },
      { level: 8, move: 'slash' },
      { level: 10, move: 'dragon_rage' },
      { level: 11, move: 'fire_spin' },
    ],
    fixedMoves:  ['scratch', 'growl'],
    randomPool:  ['ember', 'smokescreen', 'rage', 'scary_face', 'flamethrower', 'slash', 'dragon_rage', 'fire_spin'],
    randomCount: 8,
  },
  '0006': {  // Charizard
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'ember' },
      { level: 1, move: 'smokescreen' },
      { level: 4, move: 'rage' },
      { level: 5, move: 'scary_face' },
      { level: 7, move: 'flamethrower' },
      { level: 7, move: 'wing_attack' },
      { level: 9, move: 'slash' },
      { level: 11, move: 'dragon_rage' },
      { level: 13, move: 'fire_spin' },
    ],
    fixedMoves:  ['scratch', 'growl'],
    randomPool:  ['ember', 'smokescreen', 'rage', 'scary_face', 'flamethrower', 'wing_attack', 'slash', 'dragon_rage', 'fire_spin'],
    randomCount: 9,
  },
  '0007': {  // Squirtle
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'bubble' },
      { level: 2, move: 'withdraw' },
      { level: 3, move: 'water_gun' },
      { level: 4, move: 'bite' },
      { level: 5, move: 'rapid_spin' },
      { level: 6, move: 'protect' },
      { level: 7, move: 'rain_dance' },
      { level: 8, move: 'skull_bash' },
      { level: 9, move: 'hydro_pump' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['bubble', 'withdraw', 'water_gun', 'bite', 'rapid_spin', 'protect', 'rain_dance', 'skull_bash', 'hydro_pump'],
    randomCount: 9,
  },
  '0008': {  // Wartortle
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'bubble' },
      { level: 2, move: 'withdraw' },
      { level: 3, move: 'water_gun' },
      { level: 4, move: 'bite' },
      { level: 5, move: 'rapid_spin' },
      { level: 6, move: 'protect' },
      { level: 7, move: 'rain_dance' },
      { level: 9, move: 'skull_bash' },
      { level: 11, move: 'hydro_pump' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['bubble', 'withdraw', 'water_gun', 'bite', 'rapid_spin', 'protect', 'rain_dance', 'skull_bash', 'hydro_pump'],
    randomCount: 9,
  },
  '0009': {  // Blastoise
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'bubble' },
      { level: 1, move: 'withdraw' },
      { level: 3, move: 'water_gun' },
      { level: 4, move: 'bite' },
      { level: 5, move: 'rapid_spin' },
      { level: 6, move: 'protect' },
      { level: 8, move: 'rain_dance' },
      { level: 11, move: 'skull_bash' },
      { level: 14, move: 'hydro_pump' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['bubble', 'withdraw', 'water_gun', 'bite', 'rapid_spin', 'protect', 'rain_dance', 'skull_bash', 'hydro_pump'],
    randomCount: 9,
  },
  '0010': {  // Caterpie
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'string_shot' },
    ],
    fixedMoves:  ['tackle', 'string_shot'],
    randomPool:  [],
    randomCount: 0,
  },
  '0011': {  // Metapod
    levelMoves: [
      { level: 1, move: 'harden' },
    ],
    fixedMoves:  ['harden'],
    randomPool:  [],
    randomCount: 0,
  },
  '0012': {  // Butterfree
    levelMoves: [
      { level: 1, move: 'confusion' },
      { level: 3, move: 'poison_powder' },
      { level: 3, move: 'stun_spore' },
      { level: 3, move: 'sleep_powder' },
      { level: 4, move: 'supersonic' },
      { level: 5, move: 'whirlwind' },
      { level: 6, move: 'gust' },
      { level: 7, move: 'psybeam' },
      { level: 8, move: 'safeguard' },
    ],
    fixedMoves:  ['confusion', 'poison_powder'],
    randomPool:  ['stun_spore', 'sleep_powder', 'supersonic', 'whirlwind', 'gust', 'psybeam', 'safeguard'],
    randomCount: 7,
  },
  '0013': {  // Weedle
    levelMoves: [
      { level: 1, move: 'poison_sting' },
      { level: 1, move: 'string_shot' },
    ],
    fixedMoves:  ['poison_sting', 'string_shot'],
    randomPool:  [],
    randomCount: 0,
  },
  '0014': {  // Kakuna
    levelMoves: [
      { level: 1, move: 'harden' },
    ],
    fixedMoves:  ['harden'],
    randomPool:  [],
    randomCount: 0,
  },
  '0015': {  // Beedrill
    levelMoves: [
      { level: 1, move: 'fury_attack' },
      { level: 3, move: 'focus_energy' },
      { level: 4, move: 'twineedle' },
      { level: 5, move: 'rage' },
      { level: 6, move: 'pursuit' },
      { level: 7, move: 'pin_missile' },
      { level: 8, move: 'agility' },
    ],
    fixedMoves:  ['fury_attack', 'focus_energy'],
    randomPool:  ['twineedle', 'rage', 'pursuit', 'pin_missile', 'agility'],
    randomCount: 5,
  },
  '0016': {  // Pidgey
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'sand_attack' },
      { level: 2, move: 'gust' },
      { level: 3, move: 'quick_attack' },
      { level: 4, move: 'whirlwind' },
      { level: 6, move: 'wing_attack' },
      { level: 7, move: 'agility' },
    ],
    fixedMoves:  ['tackle', 'sand_attack'],
    randomPool:  ['gust', 'quick_attack', 'whirlwind', 'wing_attack', 'agility'],
    randomCount: 5,
    // Skipped (not in DB): Mirror Move (not_in_db:mirror_move)
  },
  '0017': {  // Pidgeotto
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'sand_attack' },
      { level: 1, move: 'gust' },
      { level: 3, move: 'quick_attack' },
      { level: 5, move: 'whirlwind' },
      { level: 7, move: 'wing_attack' },
      { level: 9, move: 'agility' },
    ],
    fixedMoves:  ['tackle', 'sand_attack'],
    randomPool:  ['gust', 'quick_attack', 'whirlwind', 'wing_attack', 'agility'],
    randomCount: 5,
    // Skipped (not in DB): Mirror Move (not_in_db:mirror_move)
  },
  '0018': {  // Pidgeot
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'sand_attack' },
      { level: 1, move: 'gust' },
      { level: 1, move: 'quick_attack' },
      { level: 5, move: 'whirlwind' },
      { level: 7, move: 'wing_attack' },
      { level: 9, move: 'agility' },
    ],
    fixedMoves:  ['tackle', 'sand_attack'],
    randomPool:  ['gust', 'quick_attack', 'whirlwind', 'wing_attack', 'agility'],
    randomCount: 5,
    // Skipped (not in DB): Mirror Move (not_in_db:mirror_move)
  },
  '0019': {  // Rattata
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'quick_attack' },
      { level: 3, move: 'hyper_fang' },
      { level: 4, move: 'focus_energy' },
      { level: 5, move: 'pursuit' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['quick_attack', 'hyper_fang', 'focus_energy', 'pursuit'],
    randomCount: 4,
    // Skipped (not in DB): Super Fang (not_in_db:super_fang)
  },
  '0020': {  // Raticate
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'quick_attack' },
      { level: 3, move: 'hyper_fang' },
      { level: 4, move: 'scary_face' },
      { level: 6, move: 'pursuit' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['quick_attack', 'hyper_fang', 'scary_face', 'pursuit'],
    randomCount: 4,
    // Skipped (not in DB): Super Fang (not_in_db:super_fang)
  },
  '0021': {  // Spearow
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'leer' },
      { level: 3, move: 'fury_attack' },
      { level: 5, move: 'pursuit' },
      { level: 7, move: 'drill_peck' },
      { level: 9, move: 'agility' },
    ],
    fixedMoves:  ['peck', 'growl'],
    randomPool:  ['leer', 'fury_attack', 'pursuit', 'drill_peck', 'agility'],
    randomCount: 5,
    // Skipped (not in DB): Mirror Move (not_in_db:mirror_move)
  },
  '0022': {  // Fearow
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'fury_attack' },
      { level: 5, move: 'pursuit' },
      { level: 8, move: 'drill_peck' },
      { level: 9, move: 'agility' },
    ],
    fixedMoves:  ['peck', 'growl'],
    randomPool:  ['leer', 'fury_attack', 'pursuit', 'drill_peck', 'agility'],
    randomCount: 5,
    // Skipped (not in DB): Mirror Move (not_in_db:mirror_move)
  },
  '0023': {  // Ekans
    levelMoves: [
      { level: 1, move: 'wrap' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'poison_sting' },
      { level: 3, move: 'bite' },
      { level: 5, move: 'glare' },
      { level: 6, move: 'screech' },
      { level: 7, move: 'acid' },
      { level: 9, move: 'haze' },
    ],
    fixedMoves:  ['wrap', 'leer'],
    randomPool:  ['poison_sting', 'bite', 'glare', 'screech', 'acid', 'haze'],
    randomCount: 6,
  },
  '0024': {  // Arbok
    levelMoves: [
      { level: 1, move: 'wrap' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'poison_sting' },
      { level: 1, move: 'bite' },
      { level: 5, move: 'glare' },
      { level: 7, move: 'screech' },
      { level: 9, move: 'acid' },
      { level: 10, move: 'haze' },
    ],
    fixedMoves:  ['wrap', 'leer'],
    randomPool:  ['poison_sting', 'bite', 'glare', 'screech', 'acid', 'haze'],
    randomCount: 6,
  },
  '0025': {  // Pikachu
    levelMoves: [
      { level: 1, move: 'thundershock' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'thunder_wave' },
      { level: 2, move: 'quick_attack' },
      { level: 3, move: 'double_team' },
      { level: 4, move: 'slam' },
      { level: 5, move: 'thunderbolt' },
      { level: 7, move: 'agility' },
      { level: 8, move: 'thunder' },
      { level: 10, move: 'light_screen' },
    ],
    fixedMoves:  ['thundershock', 'growl'],
    randomPool:  ['tail_whip', 'thunder_wave', 'quick_attack', 'double_team', 'slam', 'thunderbolt', 'agility', 'thunder', 'light_screen'],
    randomCount: 9,
  },
  '0026': {  // Raichu
    levelMoves: [
      { level: 1, move: 'thundershock' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'quick_attack' },
      { level: 1, move: 'thunderbolt' },
    ],
    fixedMoves:  ['thundershock', 'tail_whip'],
    randomPool:  ['quick_attack', 'thunderbolt'],
    randomCount: 2,
  },
  '0027': {  // Sandshrew
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'defense_curl' },
      { level: 2, move: 'sand_attack' },
      { level: 3, move: 'poison_sting' },
      { level: 5, move: 'slash' },
      { level: 6, move: 'swift' },
      { level: 7, move: 'fury_swipes' },
      { level: 9, move: 'sandstorm' },
    ],
    fixedMoves:  ['scratch', 'defense_curl'],
    randomPool:  ['sand_attack', 'poison_sting', 'slash', 'swift', 'fury_swipes', 'sandstorm'],
    randomCount: 6,
  },
  '0028': {  // Sandslash
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'defense_curl' },
      { level: 1, move: 'sand_attack' },
      { level: 3, move: 'poison_sting' },
      { level: 5, move: 'slash' },
      { level: 7, move: 'swift' },
      { level: 8, move: 'fury_swipes' },
      { level: 10, move: 'sandstorm' },
    ],
    fixedMoves:  ['scratch', 'defense_curl'],
    randomPool:  ['sand_attack', 'poison_sting', 'slash', 'swift', 'fury_swipes', 'sandstorm'],
    randomCount: 6,
  },
  '0029': {  // Nidoran-F
    levelMoves: [
      { level: 1, move: 'growl' },
      { level: 1, move: 'tackle' },
      { level: 2, move: 'scratch' },
      { level: 2, move: 'double_kick' },
      { level: 3, move: 'poison_sting' },
      { level: 5, move: 'tail_whip' },
      { level: 6, move: 'bite' },
      { level: 8, move: 'fury_swipes' },
    ],
    fixedMoves:  ['growl', 'tackle'],
    randomPool:  ['scratch', 'double_kick', 'poison_sting', 'tail_whip', 'bite', 'fury_swipes'],
    randomCount: 6,
  },
  '0030': {  // Nidorina
    levelMoves: [
      { level: 1, move: 'growl' },
      { level: 1, move: 'tackle' },
      { level: 2, move: 'scratch' },
      { level: 2, move: 'double_kick' },
      { level: 4, move: 'poison_sting' },
      { level: 5, move: 'tail_whip' },
      { level: 7, move: 'bite' },
      { level: 9, move: 'fury_swipes' },
    ],
    fixedMoves:  ['growl', 'tackle'],
    randomPool:  ['scratch', 'double_kick', 'poison_sting', 'tail_whip', 'bite', 'fury_swipes'],
    randomCount: 6,
  },
  '0031': {  // Nidoqueen
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'scratch' },
      { level: 1, move: 'double_kick' },
      { level: 1, move: 'tail_whip' },
      { level: 5, move: 'body_slam' },
    ],
    fixedMoves:  ['tackle', 'scratch'],
    randomPool:  ['double_kick', 'tail_whip', 'body_slam'],
    randomCount: 3,
  },
  '0032': {  // Nidoran-M
    levelMoves: [
      { level: 1, move: 'leer' },
      { level: 1, move: 'tackle' },
      { level: 2, move: 'horn_attack' },
      { level: 2, move: 'double_kick' },
      { level: 3, move: 'poison_sting' },
      { level: 5, move: 'focus_energy' },
      { level: 6, move: 'fury_attack' },
    ],
    fixedMoves:  ['leer', 'tackle'],
    randomPool:  ['horn_attack', 'double_kick', 'poison_sting', 'focus_energy', 'fury_attack'],
    randomCount: 5,
    // Skipped (not in DB): Horn Drill (not_in_db:horn_drill)
  },
  '0033': {  // Nidorino
    levelMoves: [
      { level: 1, move: 'leer' },
      { level: 1, move: 'tackle' },
      { level: 2, move: 'horn_attack' },
      { level: 2, move: 'double_kick' },
      { level: 4, move: 'poison_sting' },
      { level: 5, move: 'focus_energy' },
      { level: 7, move: 'fury_attack' },
    ],
    fixedMoves:  ['leer', 'tackle'],
    randomPool:  ['horn_attack', 'double_kick', 'poison_sting', 'focus_energy', 'fury_attack'],
    randomCount: 5,
    // Skipped (not in DB): Horn Drill (not_in_db:horn_drill)
  },
  '0034': {  // Nidoking
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'horn_attack' },
      { level: 1, move: 'double_kick' },
      { level: 1, move: 'poison_sting' },
      { level: 5, move: 'thrash' },
    ],
    fixedMoves:  ['tackle', 'horn_attack'],
    randomPool:  ['double_kick', 'poison_sting', 'thrash'],
    randomCount: 3,
  },
  '0035': {  // Clefairy
    levelMoves: [
      { level: 1, move: 'pound' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'encore' },
      { level: 2, move: 'sing' },
      { level: 3, move: 'doubleslap' },
      { level: 4, move: 'minimize' },
      { level: 5, move: 'defense_curl' },
      { level: 9, move: 'moonlight' },
      { level: 11, move: 'light_screen' },
    ],
    fixedMoves:  ['pound', 'growl'],
    randomPool:  ['encore', 'sing', 'doubleslap', 'minimize', 'defense_curl', 'moonlight', 'light_screen'],
    randomCount: 7,
  },
  '0036': {  // Clefable
    levelMoves: [
      { level: 1, move: 'sing' },
      { level: 1, move: 'doubleslap' },
      { level: 1, move: 'moonlight' },
    ],
    fixedMoves:  ['sing', 'doubleslap'],
    randomPool:  ['moonlight'],
    randomCount: 1,
  },
  '0037': {  // Vulpix
    levelMoves: [
      { level: 1, move: 'ember' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'quick_attack' },
      { level: 3, move: 'roar' },
      { level: 4, move: 'confuse_ray' },
      { level: 5, move: 'safeguard' },
      { level: 6, move: 'flamethrower' },
      { level: 7, move: 'fire_spin' },
    ],
    fixedMoves:  ['ember', 'tail_whip'],
    randomPool:  ['quick_attack', 'roar', 'confuse_ray', 'safeguard', 'flamethrower', 'fire_spin'],
    randomCount: 6,
  },
  '0038': {  // Ninetales
    levelMoves: [
      { level: 1, move: 'ember' },
      { level: 1, move: 'quick_attack' },
      { level: 1, move: 'safeguard' },
      { level: 1, move: 'confuse_ray' },
      { level: 9, move: 'fire_spin' },
    ],
    fixedMoves:  ['ember', 'quick_attack'],
    randomPool:  ['safeguard', 'confuse_ray', 'fire_spin'],
    randomCount: 3,
  },
  '0039': {  // Jigglypuff
    levelMoves: [
      { level: 1, move: 'sing' },
      { level: 1, move: 'defense_curl' },
      { level: 2, move: 'pound' },
      { level: 3, move: 'disable' },
      { level: 4, move: 'rollout' },
      { level: 5, move: 'doubleslap' },
      { level: 6, move: 'rest' },
      { level: 7, move: 'body_slam' },
      { level: 8, move: 'double_edge' },
    ],
    fixedMoves:  ['sing', 'defense_curl'],
    randomPool:  ['pound', 'disable', 'rollout', 'doubleslap', 'rest', 'body_slam', 'double_edge'],
    randomCount: 7,
  },
  '0040': {  // Wigglytuff
    levelMoves: [
      { level: 1, move: 'sing' },
      { level: 1, move: 'disable' },
      { level: 1, move: 'defense_curl' },
      { level: 1, move: 'doubleslap' },
    ],
    fixedMoves:  ['sing', 'disable'],
    randomPool:  ['defense_curl', 'doubleslap'],
    randomCount: 2,
  },
  '0041': {  // Zubat
    levelMoves: [
      { level: 1, move: 'leech_life' },
      { level: 1, move: 'supersonic' },
      { level: 2, move: 'bite' },
      { level: 4, move: 'confuse_ray' },
      { level: 5, move: 'wing_attack' },
      { level: 7, move: 'mean_look' },
      { level: 9, move: 'haze' },
    ],
    fixedMoves:  ['leech_life', 'supersonic'],
    randomPool:  ['bite', 'confuse_ray', 'wing_attack', 'mean_look', 'haze'],
    randomCount: 5,
  },
  '0042': {  // Golbat
    levelMoves: [
      { level: 1, move: 'screech' },
      { level: 1, move: 'leech_life' },
      { level: 1, move: 'supersonic' },
      { level: 2, move: 'bite' },
      { level: 4, move: 'confuse_ray' },
      { level: 6, move: 'wing_attack' },
      { level: 8, move: 'mean_look' },
      { level: 11, move: 'haze' },
    ],
    fixedMoves:  ['screech', 'leech_life'],
    randomPool:  ['supersonic', 'bite', 'confuse_ray', 'wing_attack', 'mean_look', 'haze'],
    randomCount: 6,
  },
  '0043': {  // Oddish
    levelMoves: [
      { level: 1, move: 'absorb' },
      { level: 1, move: 'sweet_scent' },
      { level: 3, move: 'poison_powder' },
      { level: 3, move: 'stun_spore' },
      { level: 4, move: 'sleep_powder' },
      { level: 5, move: 'acid' },
      { level: 6, move: 'moonlight' },
      { level: 8, move: 'petal_dance' },
    ],
    fixedMoves:  ['absorb', 'sweet_scent'],
    randomPool:  ['poison_powder', 'stun_spore', 'sleep_powder', 'acid', 'moonlight', 'petal_dance'],
    randomCount: 6,
  },
  '0044': {  // Gloom
    levelMoves: [
      { level: 1, move: 'absorb' },
      { level: 1, move: 'sweet_scent' },
      { level: 1, move: 'poison_powder' },
      { level: 3, move: 'stun_spore' },
      { level: 4, move: 'sleep_powder' },
      { level: 5, move: 'acid' },
      { level: 7, move: 'moonlight' },
      { level: 9, move: 'petal_dance' },
    ],
    fixedMoves:  ['absorb', 'sweet_scent'],
    randomPool:  ['poison_powder', 'stun_spore', 'sleep_powder', 'acid', 'moonlight', 'petal_dance'],
    randomCount: 6,
  },
  '0045': {  // Vileplume
    levelMoves: [
      { level: 1, move: 'absorb' },
      { level: 1, move: 'sweet_scent' },
      { level: 1, move: 'stun_spore' },
      { level: 1, move: 'petal_dance' },
    ],
    fixedMoves:  ['absorb', 'sweet_scent'],
    randomPool:  ['stun_spore', 'petal_dance'],
    randomCount: 2,
  },
  '0046': {  // Paras
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'stun_spore' },
      { level: 3, move: 'poison_powder' },
      { level: 4, move: 'leech_life' },
      { level: 5, move: 'spore' },
      { level: 6, move: 'slash' },
      { level: 7, move: 'growth' },
      { level: 9, move: 'giga_drain' },
    ],
    fixedMoves:  ['scratch', 'stun_spore'],
    randomPool:  ['poison_powder', 'leech_life', 'spore', 'slash', 'growth', 'giga_drain'],
    randomCount: 6,
  },
  '0047': {  // Parasect
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'stun_spore' },
      { level: 1, move: 'poison_powder' },
      { level: 4, move: 'leech_life' },
      { level: 6, move: 'spore' },
      { level: 7, move: 'slash' },
      { level: 9, move: 'growth' },
      { level: 11, move: 'giga_drain' },
    ],
    fixedMoves:  ['scratch', 'stun_spore'],
    randomPool:  ['poison_powder', 'leech_life', 'spore', 'slash', 'growth', 'giga_drain'],
    randomCount: 6,
  },
  '0048': {  // Venonat
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'disable' },
      { level: 1, move: 'foresight' },
      { level: 2, move: 'supersonic' },
      { level: 3, move: 'confusion' },
      { level: 4, move: 'poison_powder' },
      { level: 5, move: 'leech_life' },
      { level: 6, move: 'stun_spore' },
      { level: 7, move: 'psybeam' },
      { level: 7, move: 'sleep_powder' },
      { level: 8, move: 'psychic_move' },
    ],
    fixedMoves:  ['tackle', 'disable'],
    randomPool:  ['foresight', 'supersonic', 'confusion', 'poison_powder', 'leech_life', 'stun_spore', 'psybeam', 'sleep_powder', 'psychic_move'],
    randomCount: 9,
  },
  '0049': {  // Venomoth
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'disable' },
      { level: 1, move: 'foresight' },
      { level: 1, move: 'supersonic' },
      { level: 3, move: 'confusion' },
      { level: 4, move: 'poison_powder' },
      { level: 5, move: 'leech_life' },
      { level: 6, move: 'stun_spore' },
      { level: 6, move: 'gust' },
      { level: 7, move: 'psybeam' },
      { level: 8, move: 'sleep_powder' },
      { level: 10, move: 'psychic_move' },
    ],
    fixedMoves:  ['tackle', 'disable'],
    randomPool:  ['foresight', 'supersonic', 'confusion', 'poison_powder', 'leech_life', 'stun_spore', 'gust', 'psybeam', 'sleep_powder', 'psychic_move'],
    randomCount: 10,
  },
  '0050': {  // Diglett
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'magnitude' },
      { level: 3, move: 'dig' },
      { level: 5, move: 'sand_attack' },
      { level: 7, move: 'slash' },
      { level: 8, move: 'earthquake' },
    ],
    fixedMoves:  ['scratch', 'growl'],
    randomPool:  ['magnitude', 'dig', 'sand_attack', 'slash', 'earthquake'],
    randomCount: 5,
    // Skipped (not in DB): Fissure (not_in_db:fissure)
  },
  '0051': {  // Dugtrio
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'magnitude' },
      { level: 3, move: 'dig' },
      { level: 5, move: 'sand_attack' },
      { level: 7, move: 'slash' },
      { level: 10, move: 'earthquake' },
    ],
    fixedMoves:  ['scratch', 'growl'],
    randomPool:  ['magnitude', 'dig', 'sand_attack', 'slash', 'earthquake'],
    randomCount: 5,
    // Skipped (not in DB): Fissure (not_in_db:fissure)
  },
  '0052': {  // Meowth
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'bite' },
      { level: 4, move: 'pay_day' },
      { level: 6, move: 'faint_attack' },
      { level: 7, move: 'screech' },
      { level: 8, move: 'fury_swipes' },
      { level: 9, move: 'slash' },
    ],
    fixedMoves:  ['scratch', 'growl'],
    randomPool:  ['bite', 'pay_day', 'faint_attack', 'screech', 'fury_swipes', 'slash'],
    randomCount: 6,
  },
  '0053': {  // Persian
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'bite' },
      { level: 4, move: 'pay_day' },
      { level: 6, move: 'faint_attack' },
      { level: 8, move: 'screech' },
      { level: 9, move: 'fury_swipes' },
      { level: 11, move: 'slash' },
    ],
    fixedMoves:  ['scratch', 'growl'],
    randomPool:  ['bite', 'pay_day', 'faint_attack', 'screech', 'fury_swipes', 'slash'],
    randomCount: 6,
  },
  '0054': {  // Psyduck
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'disable' },
      { level: 3, move: 'confusion' },
      { level: 5, move: 'screech' },
      { level: 8, move: 'fury_swipes' },
      { level: 10, move: 'hydro_pump' },
    ],
    fixedMoves:  ['scratch', 'tail_whip'],
    randomPool:  ['disable', 'confusion', 'screech', 'fury_swipes', 'hydro_pump'],
    randomCount: 5,
    // Skipped (not in DB): Psych Up (not_in_db:psych_up)
  },
  '0055': {  // Golduck
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'disable' },
      { level: 1, move: 'confusion' },
      { level: 5, move: 'screech' },
      { level: 9, move: 'fury_swipes' },
      { level: 12, move: 'hydro_pump' },
    ],
    fixedMoves:  ['scratch', 'tail_whip'],
    randomPool:  ['disable', 'confusion', 'screech', 'fury_swipes', 'hydro_pump'],
    randomCount: 5,
    // Skipped (not in DB): Psych Up (not_in_db:psych_up)
  },
  '0056': {  // Mankey
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'low_kick' },
      { level: 3, move: 'karate_chop' },
      { level: 4, move: 'fury_swipes' },
      { level: 5, move: 'focus_energy' },
      { level: 7, move: 'seismic_toss' },
      { level: 8, move: 'cross_chop' },
      { level: 9, move: 'screech' },
      { level: 10, move: 'thrash' },
    ],
    fixedMoves:  ['scratch', 'leer'],
    randomPool:  ['low_kick', 'karate_chop', 'fury_swipes', 'focus_energy', 'seismic_toss', 'cross_chop', 'screech', 'thrash'],
    randomCount: 8,
  },
  '0057': {  // Primeape
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'low_kick' },
      { level: 1, move: 'rage' },
      { level: 3, move: 'karate_chop' },
      { level: 4, move: 'fury_swipes' },
      { level: 5, move: 'focus_energy' },
      { level: 7, move: 'seismic_toss' },
      { level: 9, move: 'cross_chop' },
      { level: 11, move: 'screech' },
      { level: 13, move: 'thrash' },
    ],
    fixedMoves:  ['scratch', 'leer'],
    randomPool:  ['low_kick', 'rage', 'karate_chop', 'fury_swipes', 'focus_energy', 'seismic_toss', 'cross_chop', 'screech', 'thrash'],
    randomCount: 9,
  },
  '0058': {  // Growlithe
    levelMoves: [
      { level: 1, move: 'bite' },
      { level: 1, move: 'roar' },
      { level: 2, move: 'ember' },
      { level: 4, move: 'leer' },
      { level: 5, move: 'take_down' },
      { level: 7, move: 'flame_wheel' },
      { level: 8, move: 'agility' },
      { level: 10, move: 'flamethrower' },
    ],
    fixedMoves:  ['bite', 'roar'],
    randomPool:  ['ember', 'leer', 'take_down', 'flame_wheel', 'agility', 'flamethrower'],
    randomCount: 6,
  },
  '0059': {  // Arcanine
    levelMoves: [
      { level: 1, move: 'roar' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'take_down' },
      { level: 1, move: 'flame_wheel' },
    ],
    fixedMoves:  ['roar', 'leer'],
    randomPool:  ['take_down', 'flame_wheel'],
    randomCount: 2,
    // Skipped (not in DB): ExtremeSpeed (not_in_db:extreme_speed)
  },
  '0060': {  // Poliwag
    levelMoves: [
      { level: 1, move: 'bubble' },
      { level: 1, move: 'hypnosis' },
      { level: 3, move: 'water_gun' },
      { level: 4, move: 'doubleslap' },
      { level: 5, move: 'rain_dance' },
      { level: 6, move: 'body_slam' },
      { level: 7, move: 'belly_drum' },
      { level: 9, move: 'hydro_pump' },
    ],
    fixedMoves:  ['bubble', 'hypnosis'],
    randomPool:  ['water_gun', 'doubleslap', 'rain_dance', 'body_slam', 'belly_drum', 'hydro_pump'],
    randomCount: 6,
  },
  '0061': {  // Poliwhirl
    levelMoves: [
      { level: 1, move: 'bubble' },
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'water_gun' },
      { level: 4, move: 'doubleslap' },
      { level: 5, move: 'rain_dance' },
      { level: 7, move: 'body_slam' },
      { level: 9, move: 'belly_drum' },
      { level: 10, move: 'hydro_pump' },
    ],
    fixedMoves:  ['bubble', 'hypnosis'],
    randomPool:  ['water_gun', 'doubleslap', 'rain_dance', 'body_slam', 'belly_drum', 'hydro_pump'],
    randomCount: 6,
  },
  '0062': {  // Poliwrath
    levelMoves: [
      { level: 1, move: 'water_gun' },
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'doubleslap' },
      { level: 1, move: 'submission' },
    ],
    fixedMoves:  ['water_gun', 'hypnosis'],
    randomPool:  ['doubleslap', 'submission'],
    randomCount: 2,
    // Skipped (not in DB): Mind Reader (not_in_db:mind_reader)
  },
  '0063': {  // Abra
    levelMoves: [
      { level: 1, move: 'teleport' },
    ],
    fixedMoves:  ['teleport'],
    randomPool:  [],
    randomCount: 0,
  },
  '0064': {  // Kadabra
    levelMoves: [
      { level: 1, move: 'kinesis' },
      { level: 1, move: 'confusion' },
      { level: 4, move: 'disable' },
      { level: 4, move: 'psybeam' },
      { level: 5, move: 'recover' },
      { level: 6, move: 'future_sight' },
      { level: 8, move: 'psychic_move' },
      { level: 9, move: 'reflect' },
    ],
    fixedMoves:  ['kinesis', 'confusion'],
    randomPool:  ['disable', 'psybeam', 'recover', 'future_sight', 'psychic_move', 'reflect'],
    randomCount: 6,
    // Skipped (not in DB): Teleport (not_in_db:teleport)
  },
  '0065': {  // Alakazam
    levelMoves: [
      { level: 1, move: 'kinesis' },
      { level: 1, move: 'confusion' },
      { level: 4, move: 'disable' },
      { level: 4, move: 'psybeam' },
      { level: 5, move: 'recover' },
      { level: 6, move: 'future_sight' },
      { level: 8, move: 'psychic_move' },
      { level: 9, move: 'reflect' },
    ],
    fixedMoves:  ['kinesis', 'confusion'],
    randomPool:  ['disable', 'psybeam', 'recover', 'future_sight', 'psychic_move', 'reflect'],
    randomCount: 6,
    // Skipped (not in DB): Teleport (not_in_db:teleport)
  },
  '0066': {  // Machop
    levelMoves: [
      { level: 1, move: 'low_kick' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'focus_energy' },
      { level: 3, move: 'karate_chop' },
      { level: 4, move: 'seismic_toss' },
      { level: 5, move: 'foresight' },
      { level: 6, move: 'vital_throw' },
      { level: 7, move: 'cross_chop' },
      { level: 9, move: 'scary_face' },
      { level: 10, move: 'submission' },
    ],
    fixedMoves:  ['low_kick', 'leer'],
    randomPool:  ['focus_energy', 'karate_chop', 'seismic_toss', 'foresight', 'vital_throw', 'cross_chop', 'scary_face', 'submission'],
    randomCount: 8,
  },
  '0067': {  // Machoke
    levelMoves: [
      { level: 1, move: 'low_kick' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'focus_energy' },
      { level: 3, move: 'karate_chop' },
      { level: 4, move: 'seismic_toss' },
      { level: 5, move: 'foresight' },
      { level: 7, move: 'vital_throw' },
      { level: 9, move: 'cross_chop' },
      { level: 10, move: 'scary_face' },
      { level: 12, move: 'submission' },
    ],
    fixedMoves:  ['low_kick', 'leer'],
    randomPool:  ['focus_energy', 'karate_chop', 'seismic_toss', 'foresight', 'vital_throw', 'cross_chop', 'scary_face', 'submission'],
    randomCount: 8,
  },
  '0068': {  // Machamp
    levelMoves: [
      { level: 1, move: 'low_kick' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'focus_energy' },
      { level: 3, move: 'karate_chop' },
      { level: 4, move: 'seismic_toss' },
      { level: 5, move: 'foresight' },
      { level: 7, move: 'vital_throw' },
      { level: 9, move: 'cross_chop' },
      { level: 10, move: 'scary_face' },
      { level: 12, move: 'submission' },
    ],
    fixedMoves:  ['low_kick', 'leer'],
    randomPool:  ['focus_energy', 'karate_chop', 'seismic_toss', 'foresight', 'vital_throw', 'cross_chop', 'scary_face', 'submission'],
    randomCount: 8,
  },
  '0069': {  // Bellsprout
    levelMoves: [
      { level: 1, move: 'vine_whip' },
      { level: 1, move: 'growth' },
      { level: 2, move: 'wrap' },
      { level: 3, move: 'sleep_powder' },
      { level: 3, move: 'poison_powder' },
      { level: 4, move: 'stun_spore' },
      { level: 5, move: 'acid' },
      { level: 6, move: 'sweet_scent' },
      { level: 7, move: 'razor_leaf' },
      { level: 9, move: 'slam' },
    ],
    fixedMoves:  ['vine_whip', 'growth'],
    randomPool:  ['wrap', 'sleep_powder', 'poison_powder', 'stun_spore', 'acid', 'sweet_scent', 'razor_leaf', 'slam'],
    randomCount: 8,
  },
  '0070': {  // Weepinbell
    levelMoves: [
      { level: 1, move: 'vine_whip' },
      { level: 1, move: 'growth' },
      { level: 1, move: 'wrap' },
      { level: 3, move: 'sleep_powder' },
      { level: 3, move: 'poison_powder' },
      { level: 4, move: 'stun_spore' },
      { level: 5, move: 'acid' },
      { level: 7, move: 'sweet_scent' },
      { level: 8, move: 'razor_leaf' },
      { level: 11, move: 'slam' },
    ],
    fixedMoves:  ['vine_whip', 'growth'],
    randomPool:  ['wrap', 'sleep_powder', 'poison_powder', 'stun_spore', 'acid', 'sweet_scent', 'razor_leaf', 'slam'],
    randomCount: 8,
  },
  '0071': {  // Victreebel
    levelMoves: [
      { level: 1, move: 'vine_whip' },
      { level: 1, move: 'sleep_powder' },
      { level: 1, move: 'sweet_scent' },
      { level: 1, move: 'razor_leaf' },
    ],
    fixedMoves:  ['vine_whip', 'sleep_powder'],
    randomPool:  ['sweet_scent', 'razor_leaf'],
    randomCount: 2,
  },
  '0072': {  // Tentacool
    levelMoves: [
      { level: 1, move: 'poison_sting' },
      { level: 1, move: 'supersonic' },
      { level: 2, move: 'constrict' },
      { level: 4, move: 'acid' },
      { level: 5, move: 'bubble_beam' },
      { level: 6, move: 'wrap' },
      { level: 7, move: 'barrier' },
      { level: 9, move: 'screech' },
      { level: 10, move: 'hydro_pump' },
    ],
    fixedMoves:  ['poison_sting', 'supersonic'],
    randomPool:  ['constrict', 'acid', 'bubble_beam', 'wrap', 'barrier', 'screech', 'hydro_pump'],
    randomCount: 7,
  },
  '0073': {  // Tentacruel
    levelMoves: [
      { level: 1, move: 'poison_sting' },
      { level: 1, move: 'supersonic' },
      { level: 1, move: 'constrict' },
      { level: 4, move: 'acid' },
      { level: 5, move: 'bubble_beam' },
      { level: 6, move: 'wrap' },
      { level: 8, move: 'barrier' },
      { level: 9, move: 'screech' },
      { level: 11, move: 'hydro_pump' },
    ],
    fixedMoves:  ['poison_sting', 'supersonic'],
    randomPool:  ['constrict', 'acid', 'bubble_beam', 'wrap', 'barrier', 'screech', 'hydro_pump'],
    randomCount: 7,
  },
  '0074': {  // Geodude
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'defense_curl' },
      { level: 2, move: 'rock_throw' },
      { level: 3, move: 'magnitude' },
      { level: 5, move: 'harden' },
      { level: 6, move: 'rollout' },
      { level: 7, move: 'earthquake' },
      { level: 8, move: 'explosion' },
    ],
    fixedMoves:  ['tackle', 'defense_curl'],
    randomPool:  ['rock_throw', 'magnitude', 'harden', 'rollout', 'earthquake', 'explosion'],
    randomCount: 6,
    // Skipped (not in DB): Selfdestruct (not_in_db:selfdestruct)
  },
  '0075': {  // Graveler
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'defense_curl' },
      { level: 1, move: 'rock_throw' },
      { level: 3, move: 'magnitude' },
      { level: 5, move: 'harden' },
      { level: 7, move: 'rollout' },
      { level: 8, move: 'earthquake' },
      { level: 10, move: 'explosion' },
    ],
    fixedMoves:  ['tackle', 'defense_curl'],
    randomPool:  ['rock_throw', 'magnitude', 'harden', 'rollout', 'earthquake', 'explosion'],
    randomCount: 6,
    // Skipped (not in DB): Selfdestruct (not_in_db:selfdestruct)
  },
  '0076': {  // Golem
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'defense_curl' },
      { level: 1, move: 'rock_throw' },
      { level: 1, move: 'magnitude' },
      { level: 5, move: 'harden' },
      { level: 7, move: 'rollout' },
      { level: 8, move: 'earthquake' },
      { level: 10, move: 'explosion' },
    ],
    fixedMoves:  ['tackle', 'defense_curl'],
    randomPool:  ['rock_throw', 'magnitude', 'harden', 'rollout', 'earthquake', 'explosion'],
    randomCount: 6,
    // Skipped (not in DB): Selfdestruct (not_in_db:selfdestruct)
  },
  '0077': {  // Ponyta
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'tail_whip' },
      { level: 3, move: 'ember' },
      { level: 4, move: 'stomp' },
      { level: 5, move: 'fire_spin' },
      { level: 7, move: 'take_down' },
      { level: 9, move: 'agility' },
      { level: 11, move: 'fire_blast' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['tail_whip', 'ember', 'stomp', 'fire_spin', 'take_down', 'agility', 'fire_blast'],
    randomCount: 7,
  },
  '0078': {  // Rapidash
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'ember' },
      { level: 4, move: 'stomp' },
      { level: 5, move: 'fire_spin' },
      { level: 7, move: 'take_down' },
      { level: 8, move: 'fury_attack' },
      { level: 9, move: 'agility' },
      { level: 12, move: 'fire_blast' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['tail_whip', 'ember', 'stomp', 'fire_spin', 'take_down', 'fury_attack', 'agility', 'fire_blast'],
    randomCount: 8,
  },
  '0079': {  // Slowpoke
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 3, move: 'water_gun' },
      { level: 4, move: 'confusion' },
      { level: 6, move: 'disable' },
      { level: 7, move: 'headbutt' },
      { level: 9, move: 'amnesia' },
      { level: 10, move: 'psychic_move' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['water_gun', 'confusion', 'disable', 'headbutt', 'amnesia', 'psychic_move'],
    randomCount: 6,
    // Skipped (not in DB): Curse (not_in_db:curse)
  },
  '0080': {  // Slowbro
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'water_gun' },
      { level: 4, move: 'confusion' },
      { level: 6, move: 'disable' },
      { level: 7, move: 'headbutt' },
      { level: 7, move: 'withdraw' },
      { level: 9, move: 'amnesia' },
      { level: 11, move: 'psychic_move' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['water_gun', 'confusion', 'disable', 'headbutt', 'withdraw', 'amnesia', 'psychic_move'],
    randomCount: 7,
    // Skipped (not in DB): Curse (not_in_db:curse)
  },
  '0081': {  // Magnemite
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'thundershock' },
      { level: 2, move: 'supersonic' },
      { level: 3, move: 'sonicboom' },
      { level: 4, move: 'thunder_wave' },
      { level: 7, move: 'swift' },
      { level: 8, move: 'screech' },
      { level: 9, move: 'zap_cannon' },
    ],
    fixedMoves:  ['tackle', 'thundershock'],
    randomPool:  ['supersonic', 'sonicboom', 'thunder_wave', 'swift', 'screech', 'zap_cannon'],
    randomCount: 6,
    // Skipped (not in DB): Lock-On (not_in_db:lock_on)
  },
  '0082': {  // Magneton
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'thundershock' },
      { level: 1, move: 'supersonic' },
      { level: 1, move: 'sonicboom' },
      { level: 4, move: 'thunder_wave' },
      { level: 7, move: 'swift' },
      { level: 9, move: 'screech' },
      { level: 11, move: 'zap_cannon' },
    ],
    fixedMoves:  ['tackle', 'thundershock'],
    randomPool:  ['supersonic', 'sonicboom', 'thunder_wave', 'swift', 'screech', 'zap_cannon'],
    randomCount: 6,
    // Skipped (not in DB): Lock-On (not_in_db:lock_on)
  },
  '0083': {  // Farfetch'd
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'sand_attack' },
      { level: 3, move: 'leer' },
      { level: 4, move: 'fury_attack' },
      { level: 5, move: 'swords_dance' },
      { level: 6, move: 'agility' },
      { level: 7, move: 'slash' },
      { level: 9, move: 'false_swipe' },
    ],
    fixedMoves:  ['peck', 'sand_attack'],
    randomPool:  ['leer', 'fury_attack', 'swords_dance', 'agility', 'slash', 'false_swipe'],
    randomCount: 6,
  },
  '0084': {  // Doduo
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'pursuit' },
      { level: 3, move: 'fury_attack' },
      { level: 4, move: 'tri_attack' },
      { level: 5, move: 'rage' },
      { level: 7, move: 'drill_peck' },
      { level: 7, move: 'agility' },
    ],
    fixedMoves:  ['peck', 'growl'],
    randomPool:  ['pursuit', 'fury_attack', 'tri_attack', 'rage', 'drill_peck', 'agility'],
    randomCount: 6,
  },
  '0085': {  // Dodrio
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'pursuit' },
      { level: 1, move: 'fury_attack' },
      { level: 4, move: 'tri_attack' },
      { level: 5, move: 'rage' },
      { level: 8, move: 'drill_peck' },
      { level: 9, move: 'agility' },
    ],
    fixedMoves:  ['peck', 'growl'],
    randomPool:  ['pursuit', 'fury_attack', 'tri_attack', 'rage', 'drill_peck', 'agility'],
    randomCount: 6,
  },
  '0086': {  // Seel
    levelMoves: [
      { level: 1, move: 'headbutt' },
      { level: 1, move: 'growl' },
      { level: 3, move: 'aurora_beam' },
      { level: 4, move: 'rest' },
      { level: 6, move: 'take_down' },
      { level: 10, move: 'safeguard' },
    ],
    fixedMoves:  ['headbutt', 'growl'],
    randomPool:  ['aurora_beam', 'rest', 'take_down', 'safeguard'],
    randomCount: 4,
    // Skipped (not in DB): Ice Beam (not_in_db:ice_beam)
  },
  '0087': {  // Dewgong
    levelMoves: [
      { level: 1, move: 'headbutt' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'aurora_beam' },
      { level: 4, move: 'rest' },
      { level: 6, move: 'take_down' },
      { level: 12, move: 'safeguard' },
    ],
    fixedMoves:  ['headbutt', 'growl'],
    randomPool:  ['aurora_beam', 'rest', 'take_down', 'safeguard'],
    randomCount: 4,
    // Skipped (not in DB): Ice Beam (not_in_db:ice_beam)
  },
  '0088': {  // Grimer
    levelMoves: [
      { level: 1, move: 'poison_gas' },
      { level: 1, move: 'pound' },
      { level: 1, move: 'harden' },
      { level: 2, move: 'disable' },
      { level: 3, move: 'sludge' },
      { level: 5, move: 'minimize' },
      { level: 6, move: 'screech' },
      { level: 8, move: 'acid_armor' },
      { level: 10, move: 'sludge_bomb' },
    ],
    fixedMoves:  ['poison_gas', 'pound'],
    randomPool:  ['harden', 'disable', 'sludge', 'minimize', 'screech', 'acid_armor', 'sludge_bomb'],
    randomCount: 7,
  },
  '0089': {  // Muk
    levelMoves: [
      { level: 1, move: 'poison_gas' },
      { level: 1, move: 'pound' },
      { level: 1, move: 'harden' },
      { level: 5, move: 'minimize' },
      { level: 6, move: 'screech' },
      { level: 7, move: 'disable' },
      { level: 9, move: 'sludge' },
      { level: 9, move: 'acid_armor' },
      { level: 12, move: 'sludge_bomb' },
    ],
    fixedMoves:  ['poison_gas', 'pound'],
    randomPool:  ['harden', 'minimize', 'screech', 'disable', 'sludge', 'acid_armor', 'sludge_bomb'],
    randomCount: 7,
  },
  '0090': {  // Shellder
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'withdraw' },
      { level: 2, move: 'supersonic' },
      { level: 3, move: 'aurora_beam' },
      { level: 5, move: 'protect' },
      { level: 7, move: 'leer' },
      { level: 8, move: 'clamp' },
    ],
    fixedMoves:  ['tackle', 'withdraw'],
    randomPool:  ['supersonic', 'aurora_beam', 'protect', 'leer', 'clamp'],
    randomCount: 5,
    // Skipped (not in DB): Ice Beam (not_in_db:ice_beam)
  },
  '0091': {  // Cloyster
    levelMoves: [
      { level: 1, move: 'withdraw' },
      { level: 1, move: 'supersonic' },
      { level: 1, move: 'aurora_beam' },
      { level: 1, move: 'protect' },
      { level: 8, move: 'spike_cannon' },
    ],
    fixedMoves:  ['withdraw', 'supersonic'],
    randomPool:  ['aurora_beam', 'protect', 'spike_cannon'],
    randomCount: 3,
  },
  '0092': {  // Gastly
    levelMoves: [
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'lick' },
      { level: 2, move: 'spite' },
      { level: 3, move: 'mean_look' },
      { level: 4, move: 'night_shade' },
      { level: 6, move: 'confuse_ray' },
      { level: 7, move: 'dream_eater' },
    ],
    fixedMoves:  ['hypnosis', 'lick'],
    randomPool:  ['spite', 'mean_look', 'night_shade', 'confuse_ray', 'dream_eater'],
    randomCount: 5,
    // Skipped (not in DB): Curse (not_in_db:curse), Destiny Bond (not_in_db:destiny_bond)
  },
  '0093': {  // Haunter
    levelMoves: [
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'lick' },
      { level: 1, move: 'spite' },
      { level: 3, move: 'mean_look' },
      { level: 4, move: 'night_shade' },
      { level: 6, move: 'confuse_ray' },
      { level: 8, move: 'dream_eater' },
    ],
    fixedMoves:  ['hypnosis', 'lick'],
    randomPool:  ['spite', 'mean_look', 'night_shade', 'confuse_ray', 'dream_eater'],
    randomCount: 5,
    // Skipped (not in DB): Curse (not_in_db:curse), Destiny Bond (not_in_db:destiny_bond)
  },
  '0094': {  // Gengar
    levelMoves: [
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'lick' },
      { level: 1, move: 'spite' },
      { level: 3, move: 'mean_look' },
      { level: 4, move: 'night_shade' },
      { level: 6, move: 'confuse_ray' },
      { level: 8, move: 'dream_eater' },
    ],
    fixedMoves:  ['hypnosis', 'lick'],
    randomPool:  ['spite', 'mean_look', 'night_shade', 'confuse_ray', 'dream_eater'],
    randomCount: 5,
    // Skipped (not in DB): Curse (not_in_db:curse), Destiny Bond (not_in_db:destiny_bond)
  },
  '0095': {  // Onix
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'screech' },
      { level: 2, move: 'bind' },
      { level: 3, move: 'rock_throw' },
      { level: 5, move: 'harden' },
      { level: 5, move: 'rage' },
      { level: 7, move: 'sandstorm' },
      { level: 8, move: 'slam' },
    ],
    fixedMoves:  ['tackle', 'screech'],
    randomPool:  ['bind', 'rock_throw', 'harden', 'rage', 'sandstorm', 'slam'],
    randomCount: 6,
  },
  '0096': {  // Drowzee
    levelMoves: [
      { level: 1, move: 'pound' },
      { level: 1, move: 'hypnosis' },
      { level: 2, move: 'disable' },
      { level: 4, move: 'confusion' },
      { level: 5, move: 'headbutt' },
      { level: 6, move: 'poison_gas' },
      { level: 7, move: 'meditate' },
      { level: 8, move: 'psychic_move' },
      { level: 9, move: 'future_sight' },
    ],
    fixedMoves:  ['pound', 'hypnosis'],
    randomPool:  ['disable', 'confusion', 'headbutt', 'poison_gas', 'meditate', 'psychic_move', 'future_sight'],
    randomCount: 7,
    // Skipped (not in DB): Psych Up (not_in_db:psych_up)
  },
  '0097': {  // Hypno
    levelMoves: [
      { level: 1, move: 'pound' },
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'disable' },
      { level: 1, move: 'confusion' },
      { level: 5, move: 'headbutt' },
      { level: 7, move: 'poison_gas' },
      { level: 8, move: 'meditate' },
      { level: 10, move: 'psychic_move' },
      { level: 12, move: 'future_sight' },
    ],
    fixedMoves:  ['pound', 'hypnosis'],
    randomPool:  ['disable', 'confusion', 'headbutt', 'poison_gas', 'meditate', 'psychic_move', 'future_sight'],
    randomCount: 7,
    // Skipped (not in DB): Psych Up (not_in_db:psych_up)
  },
  '0098': {  // Krabby
    levelMoves: [
      { level: 1, move: 'bubble' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'vicegrip' },
      { level: 3, move: 'harden' },
      { level: 5, move: 'stomp' },
      { level: 7, move: 'protect' },
      { level: 8, move: 'crabhammer' },
    ],
    fixedMoves:  ['bubble', 'leer'],
    randomPool:  ['vicegrip', 'harden', 'stomp', 'protect', 'crabhammer'],
    randomCount: 5,
    // Skipped (not in DB): Guillotine (not_in_db:guillotine)
  },
  '0099': {  // Kingler
    levelMoves: [
      { level: 1, move: 'bubble' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'vicegrip' },
      { level: 3, move: 'harden' },
      { level: 5, move: 'stomp' },
      { level: 8, move: 'protect' },
      { level: 10, move: 'crabhammer' },
    ],
    fixedMoves:  ['bubble', 'leer'],
    randomPool:  ['vicegrip', 'harden', 'stomp', 'protect', 'crabhammer'],
    randomCount: 5,
    // Skipped (not in DB): Guillotine (not_in_db:guillotine)
  },
  '0100': {  // Voltorb
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 2, move: 'screech' },
      { level: 3, move: 'sonicboom' },
      { level: 6, move: 'rollout' },
      { level: 7, move: 'light_screen' },
      { level: 7, move: 'swift' },
      { level: 8, move: 'explosion' },
    ],
    fixedMoves:  ['tackle', 'screech'],
    randomPool:  ['sonicboom', 'rollout', 'light_screen', 'swift', 'explosion'],
    randomCount: 5,
    // Skipped (not in DB): Selfdestruct (not_in_db:selfdestruct), Mirror Coat (not_in_db:mirror_coat)
  },
  '0101': {  // Electrode
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'screech' },
      { level: 1, move: 'sonicboom' },
      { level: 6, move: 'rollout' },
      { level: 7, move: 'light_screen' },
      { level: 8, move: 'swift' },
      { level: 9, move: 'explosion' },
    ],
    fixedMoves:  ['tackle', 'screech'],
    randomPool:  ['sonicboom', 'rollout', 'light_screen', 'swift', 'explosion'],
    randomCount: 5,
    // Skipped (not in DB): Selfdestruct (not_in_db:selfdestruct), Selfdestruct (not_in_db:selfdestruct), Mirror Coat (not_in_db:mirror_coat)
  },
  '0102': {  // Exeggcute
    levelMoves: [
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'reflect' },
      { level: 3, move: 'leech_seed' },
      { level: 4, move: 'confusion' },
      { level: 5, move: 'stun_spore' },
      { level: 6, move: 'poison_powder' },
      { level: 7, move: 'sleep_powder' },
      { level: 9, move: 'solar_beam' },
    ],
    fixedMoves:  ['hypnosis', 'reflect'],
    randomPool:  ['leech_seed', 'confusion', 'stun_spore', 'poison_powder', 'sleep_powder', 'solar_beam'],
    randomCount: 6,
    // Skipped (not in DB): Barrage (not_in_db:barrage)
  },
  '0103': {  // Exeggutor
    levelMoves: [
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'confusion' },
      { level: 4, move: 'stomp' },
      { level: 6, move: 'egg_bomb' },
    ],
    fixedMoves:  ['hypnosis', 'confusion'],
    randomPool:  ['stomp', 'egg_bomb'],
    randomCount: 2,
    // Skipped (not in DB): Barrage (not_in_db:barrage)
  },
  '0104': {  // Cubone
    levelMoves: [
      { level: 1, move: 'growl' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'bone_club' },
      { level: 3, move: 'headbutt' },
      { level: 3, move: 'leer' },
      { level: 4, move: 'focus_energy' },
      { level: 5, move: 'bonemerang' },
      { level: 6, move: 'rage' },
      { level: 7, move: 'false_swipe' },
      { level: 7, move: 'thrash' },
      { level: 8, move: 'bone_rush' },
    ],
    fixedMoves:  ['growl', 'tail_whip'],
    randomPool:  ['bone_club', 'headbutt', 'leer', 'focus_energy', 'bonemerang', 'rage', 'false_swipe', 'thrash', 'bone_rush'],
    randomCount: 9,
  },
  '0105': {  // Marowak
    levelMoves: [
      { level: 1, move: 'growl' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'bone_club' },
      { level: 1, move: 'headbutt' },
      { level: 3, move: 'leer' },
      { level: 4, move: 'focus_energy' },
      { level: 5, move: 'bonemerang' },
      { level: 6, move: 'rage' },
      { level: 8, move: 'false_swipe' },
      { level: 9, move: 'thrash' },
      { level: 11, move: 'bone_rush' },
    ],
    fixedMoves:  ['growl', 'tail_whip'],
    randomPool:  ['bone_club', 'headbutt', 'leer', 'focus_energy', 'bonemerang', 'rage', 'false_swipe', 'thrash', 'bone_rush'],
    randomCount: 9,
  },
  '0106': {  // Hitmonlee
    levelMoves: [
      { level: 1, move: 'double_kick' },
      { level: 1, move: 'meditate' },
      { level: 2, move: 'rolling_kick' },
      { level: 3, move: 'jump_kick' },
      { level: 4, move: 'focus_energy' },
      { level: 5, move: 'hi_jump_kick' },
      { level: 7, move: 'foresight' },
      { level: 8, move: 'endure' },
      { level: 9, move: 'mega_kick' },
      { level: 10, move: 'reversal' },
    ],
    fixedMoves:  ['double_kick', 'meditate'],
    randomPool:  ['rolling_kick', 'jump_kick', 'focus_energy', 'hi_jump_kick', 'foresight', 'endure', 'mega_kick', 'reversal'],
    randomCount: 8,
    // Skipped (not in DB): Mind Reader (not_in_db:mind_reader)
  },
  '0107': {  // Hitmonchan
    levelMoves: [
      { level: 1, move: 'comet_punch' },
      { level: 1, move: 'agility' },
      { level: 3, move: 'pursuit' },
      { level: 5, move: 'thunderpunch' },
      { level: 5, move: 'ice_punch' },
      { level: 5, move: 'fire_punch' },
      { level: 6, move: 'mach_punch' },
      { level: 8, move: 'mega_punch' },
      { level: 9, move: 'detect' },
    ],
    fixedMoves:  ['comet_punch', 'agility'],
    randomPool:  ['pursuit', 'thunderpunch', 'ice_punch', 'fire_punch', 'mach_punch', 'mega_punch', 'detect'],
    randomCount: 7,
    // Skipped (not in DB): Counter (not_in_db:counter)
  },
  '0108': {  // Lickitung
    levelMoves: [
      { level: 1, move: 'lick' },
      { level: 1, move: 'supersonic' },
      { level: 3, move: 'defense_curl' },
      { level: 4, move: 'stomp' },
      { level: 5, move: 'wrap' },
      { level: 6, move: 'disable' },
      { level: 7, move: 'slam' },
      { level: 9, move: 'screech' },
    ],
    fixedMoves:  ['lick', 'supersonic'],
    randomPool:  ['defense_curl', 'stomp', 'wrap', 'disable', 'slam', 'screech'],
    randomCount: 6,
  },
  '0109': {  // Koffing
    levelMoves: [
      { level: 1, move: 'poison_gas' },
      { level: 1, move: 'tackle' },
      { level: 2, move: 'smog' },
      { level: 4, move: 'sludge' },
      { level: 5, move: 'smokescreen' },
      { level: 7, move: 'haze' },
      { level: 8, move: 'explosion' },
    ],
    fixedMoves:  ['poison_gas', 'tackle'],
    randomPool:  ['smog', 'sludge', 'smokescreen', 'haze', 'explosion'],
    randomCount: 5,
    // Skipped (not in DB): Selfdestruct (not_in_db:selfdestruct), Destiny Bond (not_in_db:destiny_bond)
  },
  '0110': {  // Weezing
    levelMoves: [
      { level: 1, move: 'poison_gas' },
      { level: 1, move: 'tackle' },
      { level: 1, move: 'smog' },
      { level: 4, move: 'sludge' },
      { level: 5, move: 'smokescreen' },
      { level: 7, move: 'haze' },
      { level: 9, move: 'explosion' },
    ],
    fixedMoves:  ['poison_gas', 'tackle'],
    randomPool:  ['smog', 'sludge', 'smokescreen', 'haze', 'explosion'],
    randomCount: 5,
    // Skipped (not in DB): Selfdestruct (not_in_db:selfdestruct), Selfdestruct (not_in_db:selfdestruct), Destiny Bond (not_in_db:destiny_bond)
  },
  '0111': {  // Rhyhorn
    levelMoves: [
      { level: 1, move: 'horn_attack' },
      { level: 1, move: 'tail_whip' },
      { level: 3, move: 'stomp' },
      { level: 4, move: 'fury_attack' },
      { level: 6, move: 'scary_face' },
      { level: 10, move: 'take_down' },
      { level: 11, move: 'earthquake' },
    ],
    fixedMoves:  ['horn_attack', 'tail_whip'],
    randomPool:  ['stomp', 'fury_attack', 'scary_face', 'take_down', 'earthquake'],
    randomCount: 5,
    // Skipped (not in DB): Horn Drill (not_in_db:horn_drill)
  },
  '0112': {  // Rhydon
    levelMoves: [
      { level: 1, move: 'horn_attack' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'stomp' },
      { level: 1, move: 'fury_attack' },
      { level: 6, move: 'scary_face' },
      { level: 11, move: 'take_down' },
      { level: 13, move: 'earthquake' },
    ],
    fixedMoves:  ['horn_attack', 'tail_whip'],
    randomPool:  ['stomp', 'fury_attack', 'scary_face', 'take_down', 'earthquake'],
    randomCount: 5,
    // Skipped (not in DB): Horn Drill (not_in_db:horn_drill)
  },
  '0113': {  // Chansey
    levelMoves: [
      { level: 1, move: 'pound' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'tail_whip' },
      { level: 3, move: 'softboiled' },
      { level: 3, move: 'doubleslap' },
      { level: 5, move: 'minimize' },
      { level: 6, move: 'sing' },
      { level: 7, move: 'egg_bomb' },
      { level: 8, move: 'defense_curl' },
      { level: 10, move: 'light_screen' },
      { level: 11, move: 'double_edge' },
    ],
    fixedMoves:  ['pound', 'growl'],
    randomPool:  ['tail_whip', 'softboiled', 'doubleslap', 'minimize', 'sing', 'egg_bomb', 'defense_curl', 'light_screen', 'double_edge'],
    randomCount: 9,
  },
  '0114': {  // Tangela
    levelMoves: [
      { level: 1, move: 'constrict' },
      { level: 1, move: 'sleep_powder' },
      { level: 2, move: 'absorb' },
      { level: 3, move: 'poison_powder' },
      { level: 4, move: 'vine_whip' },
      { level: 5, move: 'bind' },
      { level: 6, move: 'mega_drain' },
      { level: 7, move: 'stun_spore' },
      { level: 8, move: 'slam' },
      { level: 9, move: 'growth' },
    ],
    fixedMoves:  ['constrict', 'sleep_powder'],
    randomPool:  ['absorb', 'poison_powder', 'vine_whip', 'bind', 'mega_drain', 'stun_spore', 'slam', 'growth'],
    randomCount: 8,
  },
  '0115': {  // Kangaskhan
    levelMoves: [
      { level: 1, move: 'comet_punch' },
      { level: 1, move: 'leer' },
      { level: 3, move: 'bite' },
      { level: 4, move: 'tail_whip' },
      { level: 5, move: 'mega_punch' },
      { level: 6, move: 'rage' },
      { level: 7, move: 'endure' },
      { level: 9, move: 'dizzy_punch' },
      { level: 10, move: 'reversal' },
    ],
    fixedMoves:  ['comet_punch', 'leer'],
    randomPool:  ['bite', 'tail_whip', 'mega_punch', 'rage', 'endure', 'dizzy_punch', 'reversal'],
    randomCount: 7,
  },
  '0116': {  // Horsea
    levelMoves: [
      { level: 1, move: 'bubble' },
      { level: 2, move: 'smokescreen' },
      { level: 3, move: 'leer' },
      { level: 4, move: 'water_gun' },
      { level: 6, move: 'twister' },
      { level: 7, move: 'agility' },
      { level: 9, move: 'hydro_pump' },
    ],
    fixedMoves:  ['bubble', 'smokescreen'],
    randomPool:  ['leer', 'water_gun', 'twister', 'agility', 'hydro_pump'],
    randomCount: 5,
  },
  '0117': {  // Seadra
    levelMoves: [
      { level: 1, move: 'bubble' },
      { level: 1, move: 'smokescreen' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'water_gun' },
      { level: 6, move: 'twister' },
      { level: 8, move: 'agility' },
      { level: 10, move: 'hydro_pump' },
    ],
    fixedMoves:  ['bubble', 'smokescreen'],
    randomPool:  ['leer', 'water_gun', 'twister', 'agility', 'hydro_pump'],
    randomCount: 5,
  },
  '0118': {  // Goldeen
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'supersonic' },
      { level: 3, move: 'horn_attack' },
      { level: 5, move: 'flail' },
      { level: 6, move: 'fury_attack' },
      { level: 8, move: 'waterfall' },
      { level: 10, move: 'agility' },
    ],
    fixedMoves:  ['peck', 'tail_whip'],
    randomPool:  ['supersonic', 'horn_attack', 'flail', 'fury_attack', 'waterfall', 'agility'],
    randomCount: 6,
    // Skipped (not in DB): Horn Drill (not_in_db:horn_drill)
  },
  '0119': {  // Seaking
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'supersonic' },
      { level: 3, move: 'horn_attack' },
      { level: 5, move: 'flail' },
      { level: 6, move: 'fury_attack' },
      { level: 8, move: 'waterfall' },
      { level: 12, move: 'agility' },
    ],
    fixedMoves:  ['peck', 'tail_whip'],
    randomPool:  ['supersonic', 'horn_attack', 'flail', 'fury_attack', 'waterfall', 'agility'],
    randomCount: 6,
    // Skipped (not in DB): Horn Drill (not_in_db:horn_drill)
  },
  '0120': {  // Staryu
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'harden' },
      { level: 1, move: 'water_gun' },
      { level: 3, move: 'rapid_spin' },
      { level: 4, move: 'recover' },
      { level: 5, move: 'swift' },
      { level: 6, move: 'bubble_beam' },
      { level: 7, move: 'minimize' },
      { level: 9, move: 'light_screen' },
      { level: 10, move: 'hydro_pump' },
    ],
    fixedMoves:  ['tackle', 'harden'],
    randomPool:  ['water_gun', 'rapid_spin', 'recover', 'swift', 'bubble_beam', 'minimize', 'light_screen', 'hydro_pump'],
    randomCount: 8,
  },
  '0121': {  // Starmie
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'rapid_spin' },
      { level: 1, move: 'recover' },
      { level: 1, move: 'bubble_beam' },
      { level: 7, move: 'confuse_ray' },
    ],
    fixedMoves:  ['tackle', 'rapid_spin'],
    randomPool:  ['recover', 'bubble_beam', 'confuse_ray'],
    randomCount: 3,
  },
  '0122': {  // Mr. Mime
    levelMoves: [
      { level: 1, move: 'barrier' },
      { level: 1, move: 'confusion' },
      { level: 3, move: 'meditate' },
      { level: 4, move: 'doubleslap' },
      { level: 5, move: 'light_screen' },
      { level: 5, move: 'reflect' },
      { level: 6, move: 'encore' },
      { level: 7, move: 'psybeam' },
      { level: 8, move: 'baton_pass' },
      { level: 9, move: 'safeguard' },
    ],
    fixedMoves:  ['barrier', 'confusion'],
    randomPool:  ['meditate', 'doubleslap', 'light_screen', 'reflect', 'encore', 'psybeam', 'baton_pass', 'safeguard'],
    randomCount: 8,
    // Skipped (not in DB): Substitute (not_in_db:substitute)
  },
  '0123': {  // Scyther
    levelMoves: [
      { level: 1, move: 'quick_attack' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'focus_energy' },
      { level: 2, move: 'pursuit' },
      { level: 4, move: 'false_swipe' },
      { level: 5, move: 'agility' },
      { level: 6, move: 'wing_attack' },
      { level: 7, move: 'slash' },
      { level: 8, move: 'swords_dance' },
      { level: 10, move: 'double_team' },
    ],
    fixedMoves:  ['quick_attack', 'leer'],
    randomPool:  ['focus_energy', 'pursuit', 'false_swipe', 'agility', 'wing_attack', 'slash', 'swords_dance', 'double_team'],
    randomCount: 8,
  },
  '0124': {  // Jynx
    levelMoves: [
      { level: 1, move: 'pound' },
      { level: 1, move: 'lick' },
      { level: 1, move: 'lovely_kiss' },
      { level: 1, move: 'powder_snow' },
      { level: 4, move: 'doubleslap' },
      { level: 5, move: 'ice_punch' },
      { level: 7, move: 'mean_look' },
      { level: 8, move: 'body_slam' },
      { level: 11, move: 'blizzard' },
    ],
    fixedMoves:  ['pound', 'lick'],
    randomPool:  ['lovely_kiss', 'powder_snow', 'doubleslap', 'ice_punch', 'mean_look', 'body_slam', 'blizzard'],
    randomCount: 7,
    // Skipped (not in DB): Perish Song (not_in_db:perish_song)
  },
  '0125': {  // Electabuzz
    levelMoves: [
      { level: 1, move: 'quick_attack' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'thunderpunch' },
      { level: 3, move: 'light_screen' },
      { level: 5, move: 'swift' },
      { level: 7, move: 'screech' },
      { level: 9, move: 'thunderbolt' },
      { level: 12, move: 'thunder' },
    ],
    fixedMoves:  ['quick_attack', 'leer'],
    randomPool:  ['thunderpunch', 'light_screen', 'swift', 'screech', 'thunderbolt', 'thunder'],
    randomCount: 6,
  },
  '0126': {  // Magmar
    levelMoves: [
      { level: 1, move: 'ember' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'smog' },
      { level: 1, move: 'fire_punch' },
      { level: 5, move: 'smokescreen' },
      { level: 7, move: 'sunny_day' },
      { level: 8, move: 'flamethrower' },
      { level: 10, move: 'confuse_ray' },
      { level: 11, move: 'fire_blast' },
    ],
    fixedMoves:  ['ember', 'leer'],
    randomPool:  ['smog', 'fire_punch', 'smokescreen', 'sunny_day', 'flamethrower', 'confuse_ray', 'fire_blast'],
    randomCount: 7,
  },
  '0127': {  // Pinsir
    levelMoves: [
      { level: 1, move: 'vicegrip' },
      { level: 1, move: 'focus_energy' },
      { level: 3, move: 'bind' },
      { level: 4, move: 'seismic_toss' },
      { level: 5, move: 'harden' },
      { level: 7, move: 'submission' },
      { level: 9, move: 'swords_dance' },
    ],
    fixedMoves:  ['vicegrip', 'focus_energy'],
    randomPool:  ['bind', 'seismic_toss', 'harden', 'submission', 'swords_dance'],
    randomCount: 5,
    // Skipped (not in DB): Guillotine (not_in_db:guillotine)
  },
  '0128': {  // Tauros
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'rage' },
      { level: 3, move: 'horn_attack' },
      { level: 4, move: 'scary_face' },
      { level: 5, move: 'pursuit' },
      { level: 7, move: 'rest' },
      { level: 9, move: 'thrash' },
      { level: 11, move: 'take_down' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['rage', 'horn_attack', 'scary_face', 'pursuit', 'rest', 'thrash', 'take_down'],
    randomCount: 7,
  },
  '0129': {  // Magikarp
    levelMoves: [
      { level: 3, move: 'tackle' },
      { level: 6, move: 'flail' },
    ],
    fixedMoves:  ['tackle', 'flail'],
    randomPool:  [],
    randomCount: 0,
  },
  '0130': {  // Gyarados
    levelMoves: [
      { level: 1, move: 'thrash' },
      { level: 4, move: 'bite' },
      { level: 5, move: 'dragon_rage' },
      { level: 6, move: 'leer' },
      { level: 7, move: 'twister' },
      { level: 8, move: 'hydro_pump' },
      { level: 9, move: 'rain_dance' },
      { level: 10, move: 'hyper_beam' },
    ],
    fixedMoves:  ['thrash', 'bite'],
    randomPool:  ['dragon_rage', 'leer', 'twister', 'hydro_pump', 'rain_dance', 'hyper_beam'],
    randomCount: 6,
  },
  '0131': {  // Lapras
    levelMoves: [
      { level: 1, move: 'water_gun' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'sing' },
      { level: 2, move: 'mist' },
      { level: 3, move: 'body_slam' },
      { level: 4, move: 'confuse_ray' },
      { level: 9, move: 'rain_dance' },
      { level: 10, move: 'safeguard' },
      { level: 11, move: 'hydro_pump' },
    ],
    fixedMoves:  ['water_gun', 'growl'],
    randomPool:  ['sing', 'mist', 'body_slam', 'confuse_ray', 'rain_dance', 'safeguard', 'hydro_pump'],
    randomCount: 7,
    // Skipped (not in DB): Perish Song (not_in_db:perish_song), Ice Beam (not_in_db:ice_beam)
  },
  '0132': {  // Ditto
    levelMoves: [
    ],
    fixedMoves:  [],
    randomPool:  [],
    randomCount: 0,
  },
  '0133': {  // Eevee
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'sand_attack' },
      { level: 3, move: 'growl' },
      { level: 5, move: 'quick_attack' },
      { level: 6, move: 'bite' },
      { level: 7, move: 'focus_energy' },
      { level: 8, move: 'take_down' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['sand_attack', 'growl', 'quick_attack', 'bite', 'focus_energy', 'take_down'],
    randomCount: 6,
  },
  '0134': {  // Vaporeon
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'sand_attack' },
      { level: 3, move: 'water_gun' },
      { level: 5, move: 'quick_attack' },
      { level: 6, move: 'bite' },
      { level: 7, move: 'aurora_beam' },
      { level: 8, move: 'haze' },
      { level: 9, move: 'acid_armor' },
      { level: 10, move: 'hydro_pump' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['sand_attack', 'water_gun', 'quick_attack', 'bite', 'aurora_beam', 'haze', 'acid_armor', 'hydro_pump'],
    randomCount: 8,
  },
  '0135': {  // Jolteon
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'sand_attack' },
      { level: 3, move: 'thundershock' },
      { level: 5, move: 'quick_attack' },
      { level: 6, move: 'double_kick' },
      { level: 7, move: 'pin_missile' },
      { level: 8, move: 'thunder_wave' },
      { level: 9, move: 'agility' },
      { level: 10, move: 'thunder' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['sand_attack', 'thundershock', 'quick_attack', 'double_kick', 'pin_missile', 'thunder_wave', 'agility', 'thunder'],
    randomCount: 8,
  },
  '0136': {  // Flareon
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'sand_attack' },
      { level: 3, move: 'ember' },
      { level: 5, move: 'quick_attack' },
      { level: 6, move: 'bite' },
      { level: 7, move: 'fire_spin' },
      { level: 8, move: 'smog' },
      { level: 9, move: 'leer' },
      { level: 10, move: 'flamethrower' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['sand_attack', 'ember', 'quick_attack', 'bite', 'fire_spin', 'smog', 'leer', 'flamethrower'],
    randomCount: 8,
  },
  '0137': {  // Porygon
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 2, move: 'agility' },
      { level: 2, move: 'psybeam' },
      { level: 4, move: 'recover' },
      { level: 5, move: 'sharpen' },
      { level: 7, move: 'tri_attack' },
      { level: 9, move: 'zap_cannon' },
    ],
    fixedMoves:  ['tackle', 'agility'],
    randomPool:  ['psybeam', 'recover', 'sharpen', 'tri_attack', 'zap_cannon'],
    randomCount: 5,
    // Skipped (not in DB): Conversion 2 (not_in_db:conversion_2), Conversion (not_in_db:conversion), Lock-On (not_in_db:lock_on)
  },
  '0138': {  // Omanyte
    levelMoves: [
      { level: 1, move: 'constrict' },
      { level: 1, move: 'withdraw' },
      { level: 3, move: 'bite' },
      { level: 4, move: 'water_gun' },
      { level: 6, move: 'leer' },
      { level: 7, move: 'protect' },
      { level: 10, move: 'ancient_power' },
      { level: 11, move: 'hydro_pump' },
    ],
    fixedMoves:  ['constrict', 'withdraw'],
    randomPool:  ['bite', 'water_gun', 'leer', 'protect', 'ancient_power', 'hydro_pump'],
    randomCount: 6,
  },
  '0139': {  // Omastar
    levelMoves: [
      { level: 1, move: 'constrict' },
      { level: 1, move: 'withdraw' },
      { level: 1, move: 'bite' },
      { level: 4, move: 'water_gun' },
      { level: 6, move: 'leer' },
      { level: 7, move: 'protect' },
      { level: 8, move: 'spike_cannon' },
      { level: 11, move: 'ancient_power' },
      { level: 13, move: 'hydro_pump' },
    ],
    fixedMoves:  ['constrict', 'withdraw'],
    randomPool:  ['bite', 'water_gun', 'leer', 'protect', 'spike_cannon', 'ancient_power', 'hydro_pump'],
    randomCount: 7,
  },
  '0140': {  // Kabuto
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'harden' },
      { level: 2, move: 'absorb' },
      { level: 4, move: 'leer' },
      { level: 6, move: 'sand_attack' },
      { level: 7, move: 'endure' },
      { level: 9, move: 'mega_drain' },
      { level: 11, move: 'ancient_power' },
    ],
    fixedMoves:  ['scratch', 'harden'],
    randomPool:  ['absorb', 'leer', 'sand_attack', 'endure', 'mega_drain', 'ancient_power'],
    randomCount: 6,
  },
  '0141': {  // Kabutops
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'harden' },
      { level: 1, move: 'absorb' },
      { level: 4, move: 'leer' },
      { level: 6, move: 'sand_attack' },
      { level: 7, move: 'endure' },
      { level: 8, move: 'slash' },
      { level: 10, move: 'mega_drain' },
      { level: 13, move: 'ancient_power' },
    ],
    fixedMoves:  ['scratch', 'harden'],
    randomPool:  ['absorb', 'leer', 'sand_attack', 'endure', 'slash', 'mega_drain', 'ancient_power'],
    randomCount: 7,
  },
  '0142': {  // Aerodactyl
    levelMoves: [
      { level: 1, move: 'wing_attack' },
      { level: 2, move: 'agility' },
      { level: 3, move: 'bite' },
      { level: 4, move: 'supersonic' },
      { level: 6, move: 'ancient_power' },
      { level: 7, move: 'scary_face' },
      { level: 9, move: 'take_down' },
      { level: 10, move: 'hyper_beam' },
    ],
    fixedMoves:  ['wing_attack', 'agility'],
    randomPool:  ['bite', 'supersonic', 'ancient_power', 'scary_face', 'take_down', 'hyper_beam'],
    randomCount: 6,
  },
  '0143': {  // Snorlax
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 2, move: 'amnesia' },
      { level: 3, move: 'defense_curl' },
      { level: 4, move: 'belly_drum' },
      { level: 6, move: 'headbutt' },
      { level: 7, move: 'snore' },
      { level: 7, move: 'rest' },
      { level: 9, move: 'body_slam' },
      { level: 10, move: 'rollout' },
      { level: 11, move: 'hyper_beam' },
    ],
    fixedMoves:  ['tackle', 'amnesia'],
    randomPool:  ['defense_curl', 'belly_drum', 'headbutt', 'snore', 'rest', 'body_slam', 'rollout', 'hyper_beam'],
    randomCount: 8,
  },
  '0144': {  // Articuno
    levelMoves: [
      { level: 1, move: 'gust' },
      { level: 1, move: 'powder_snow' },
      { level: 3, move: 'mist' },
      { level: 5, move: 'agility' },
      { level: 12, move: 'reflect' },
      { level: 15, move: 'blizzard' },
    ],
    fixedMoves:  ['gust', 'powder_snow'],
    randomPool:  ['mist', 'agility', 'reflect', 'blizzard'],
    randomCount: 4,
    // Skipped (not in DB): Mind Reader (not_in_db:mind_reader), Ice Beam (not_in_db:ice_beam)
  },
  '0145': {  // Zapdos
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'thundershock' },
      { level: 3, move: 'thunder_wave' },
      { level: 5, move: 'agility' },
      { level: 7, move: 'detect' },
      { level: 10, move: 'drill_peck' },
      { level: 12, move: 'light_screen' },
      { level: 15, move: 'thunder' },
    ],
    fixedMoves:  ['peck', 'thundershock'],
    randomPool:  ['thunder_wave', 'agility', 'detect', 'drill_peck', 'light_screen', 'thunder'],
    randomCount: 6,
  },
  '0146': {  // Moltres
    levelMoves: [
      { level: 1, move: 'wing_attack' },
      { level: 1, move: 'ember' },
      { level: 3, move: 'fire_spin' },
      { level: 5, move: 'agility' },
      { level: 7, move: 'endure' },
      { level: 10, move: 'flamethrower' },
      { level: 12, move: 'safeguard' },
      { level: 15, move: 'sky_attack' },
    ],
    fixedMoves:  ['wing_attack', 'ember'],
    randomPool:  ['fire_spin', 'agility', 'endure', 'flamethrower', 'safeguard', 'sky_attack'],
    randomCount: 6,
  },
  '0147': {  // Dratini
    levelMoves: [
      { level: 1, move: 'wrap' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'thunder_wave' },
      { level: 3, move: 'twister' },
      { level: 4, move: 'dragon_rage' },
      { level: 6, move: 'slam' },
      { level: 7, move: 'agility' },
      { level: 9, move: 'safeguard' },
      { level: 10, move: 'outrage' },
      { level: 11, move: 'hyper_beam' },
    ],
    fixedMoves:  ['wrap', 'leer'],
    randomPool:  ['thunder_wave', 'twister', 'dragon_rage', 'slam', 'agility', 'safeguard', 'outrage', 'hyper_beam'],
    randomCount: 8,
  },
  '0148': {  // Dragonair
    levelMoves: [
      { level: 1, move: 'wrap' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'thunder_wave' },
      { level: 1, move: 'twister' },
      { level: 4, move: 'dragon_rage' },
      { level: 6, move: 'slam' },
      { level: 8, move: 'agility' },
      { level: 9, move: 'safeguard' },
      { level: 11, move: 'outrage' },
      { level: 13, move: 'hyper_beam' },
    ],
    fixedMoves:  ['wrap', 'leer'],
    randomPool:  ['thunder_wave', 'twister', 'dragon_rage', 'slam', 'agility', 'safeguard', 'outrage', 'hyper_beam'],
    randomCount: 8,
  },
  '0149': {  // Dragonite
    levelMoves: [
      { level: 1, move: 'wrap' },
      { level: 1, move: 'thunder_wave' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'twister' },
      { level: 4, move: 'dragon_rage' },
      { level: 6, move: 'slam' },
      { level: 8, move: 'agility' },
      { level: 9, move: 'safeguard' },
      { level: 11, move: 'wing_attack' },
      { level: 12, move: 'outrage' },
      { level: 15, move: 'hyper_beam' },
    ],
    fixedMoves:  ['wrap', 'thunder_wave'],
    randomPool:  ['leer', 'twister', 'dragon_rage', 'slam', 'agility', 'safeguard', 'wing_attack', 'outrage', 'hyper_beam'],
    randomCount: 9,
  },
  '0150': {  // Mewtwo
    levelMoves: [
      { level: 1, move: 'confusion' },
      { level: 1, move: 'disable' },
      { level: 2, move: 'barrier' },
      { level: 4, move: 'swift' },
      { level: 9, move: 'future_sight' },
      { level: 11, move: 'mist' },
      { level: 13, move: 'psychic_move' },
      { level: 15, move: 'amnesia' },
      { level: 18, move: 'recover' },
      { level: 20, move: 'safeguard' },
    ],
    fixedMoves:  ['confusion', 'disable'],
    randomPool:  ['barrier', 'swift', 'future_sight', 'mist', 'psychic_move', 'amnesia', 'recover', 'safeguard'],
    randomCount: 8,
    // Skipped (not in DB): Psych Up (not_in_db:psych_up)
  },
  '0151': {  // Mew
    levelMoves: [
      { level: 1, move: 'pound' },
      { level: 4, move: 'mega_punch' },
      { level: 8, move: 'psychic_move' },
      { level: 10, move: 'ancient_power' },
    ],
    fixedMoves:  ['pound', 'mega_punch'],
    randomPool:  ['psychic_move', 'ancient_power'],
    randomCount: 2,
  },
  '0152': {  // Chikorita
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'razor_leaf' },
      { level: 2, move: 'reflect' },
      { level: 3, move: 'poison_powder' },
      { level: 4, move: 'synthesis' },
      { level: 6, move: 'body_slam' },
      { level: 7, move: 'light_screen' },
      { level: 9, move: 'safeguard' },
      { level: 10, move: 'solar_beam' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['razor_leaf', 'reflect', 'poison_powder', 'synthesis', 'body_slam', 'light_screen', 'safeguard', 'solar_beam'],
    randomCount: 8,
  },
  '0153': {  // Bayleef
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'razor_leaf' },
      { level: 1, move: 'reflect' },
      { level: 3, move: 'poison_powder' },
      { level: 5, move: 'synthesis' },
      { level: 6, move: 'body_slam' },
      { level: 8, move: 'light_screen' },
      { level: 9, move: 'safeguard' },
      { level: 11, move: 'solar_beam' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['razor_leaf', 'reflect', 'poison_powder', 'synthesis', 'body_slam', 'light_screen', 'safeguard', 'solar_beam'],
    randomCount: 8,
  },
  '0154': {  // Meganium
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'razor_leaf' },
      { level: 1, move: 'reflect' },
      { level: 3, move: 'poison_powder' },
      { level: 5, move: 'synthesis' },
      { level: 6, move: 'body_slam' },
      { level: 8, move: 'light_screen' },
      { level: 10, move: 'safeguard' },
      { level: 12, move: 'solar_beam' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['razor_leaf', 'reflect', 'poison_powder', 'synthesis', 'body_slam', 'light_screen', 'safeguard', 'solar_beam'],
    randomCount: 8,
  },
  '0155': {  // Cyndaquil
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'smokescreen' },
      { level: 2, move: 'ember' },
      { level: 4, move: 'quick_attack' },
      { level: 5, move: 'flame_wheel' },
      { level: 7, move: 'swift' },
      { level: 9, move: 'flamethrower' },
    ],
    fixedMoves:  ['tackle', 'leer'],
    randomPool:  ['smokescreen', 'ember', 'quick_attack', 'flame_wheel', 'swift', 'flamethrower'],
    randomCount: 6,
  },
  '0156': {  // Quilava
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'smokescreen' },
      { level: 2, move: 'ember' },
      { level: 4, move: 'quick_attack' },
      { level: 6, move: 'flame_wheel' },
      { level: 8, move: 'swift' },
      { level: 11, move: 'flamethrower' },
    ],
    fixedMoves:  ['tackle', 'leer'],
    randomPool:  ['smokescreen', 'ember', 'quick_attack', 'flame_wheel', 'swift', 'flamethrower'],
    randomCount: 6,
  },
  '0157': {  // Typhlosion
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'smokescreen' },
      { level: 1, move: 'ember' },
      { level: 4, move: 'quick_attack' },
      { level: 6, move: 'flame_wheel' },
      { level: 9, move: 'swift' },
      { level: 12, move: 'flamethrower' },
    ],
    fixedMoves:  ['tackle', 'leer'],
    randomPool:  ['smokescreen', 'ember', 'quick_attack', 'flame_wheel', 'swift', 'flamethrower'],
    randomCount: 6,
  },
  '0158': {  // Totodile
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'rage' },
      { level: 3, move: 'water_gun' },
      { level: 4, move: 'bite' },
      { level: 5, move: 'scary_face' },
      { level: 7, move: 'slash' },
      { level: 9, move: 'screech' },
      { level: 10, move: 'hydro_pump' },
    ],
    fixedMoves:  ['scratch', 'leer'],
    randomPool:  ['rage', 'water_gun', 'bite', 'scary_face', 'slash', 'screech', 'hydro_pump'],
    randomCount: 7,
  },
  '0159': {  // Croconaw
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'rage' },
      { level: 3, move: 'water_gun' },
      { level: 4, move: 'bite' },
      { level: 6, move: 'scary_face' },
      { level: 7, move: 'slash' },
      { level: 9, move: 'screech' },
      { level: 11, move: 'hydro_pump' },
    ],
    fixedMoves:  ['scratch', 'leer'],
    randomPool:  ['rage', 'water_gun', 'bite', 'scary_face', 'slash', 'screech', 'hydro_pump'],
    randomCount: 7,
  },
  '0160': {  // Feraligatr
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'rage' },
      { level: 1, move: 'water_gun' },
      { level: 4, move: 'bite' },
      { level: 6, move: 'scary_face' },
      { level: 8, move: 'slash' },
      { level: 9, move: 'screech' },
      { level: 12, move: 'hydro_pump' },
    ],
    fixedMoves:  ['scratch', 'leer'],
    randomPool:  ['rage', 'water_gun', 'bite', 'scary_face', 'slash', 'screech', 'hydro_pump'],
    randomCount: 7,
  },
  '0161': {  // Sentret
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'defense_curl' },
      { level: 2, move: 'quick_attack' },
      { level: 3, move: 'fury_swipes' },
      { level: 5, move: 'slam' },
      { level: 7, move: 'rest' },
      { level: 8, move: 'amnesia' },
    ],
    fixedMoves:  ['tackle', 'defense_curl'],
    randomPool:  ['quick_attack', 'fury_swipes', 'slam', 'rest', 'amnesia'],
    randomCount: 5,
  },
  '0162': {  // Furret
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'defense_curl' },
      { level: 1, move: 'quick_attack' },
      { level: 4, move: 'fury_swipes' },
      { level: 6, move: 'slam' },
      { level: 8, move: 'rest' },
      { level: 10, move: 'amnesia' },
    ],
    fixedMoves:  ['scratch', 'defense_curl'],
    randomPool:  ['quick_attack', 'fury_swipes', 'slam', 'rest', 'amnesia'],
    randomCount: 5,
  },
  '0163': {  // Hoothoot
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'foresight' },
      { level: 2, move: 'peck' },
      { level: 3, move: 'hypnosis' },
      { level: 4, move: 'reflect' },
      { level: 6, move: 'take_down' },
      { level: 7, move: 'confusion' },
      { level: 10, move: 'dream_eater' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['foresight', 'peck', 'hypnosis', 'reflect', 'take_down', 'confusion', 'dream_eater'],
    randomCount: 7,
  },
  '0164': {  // Noctowl
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'foresight' },
      { level: 1, move: 'peck' },
      { level: 3, move: 'hypnosis' },
      { level: 5, move: 'reflect' },
      { level: 7, move: 'take_down' },
      { level: 8, move: 'confusion' },
      { level: 11, move: 'dream_eater' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['foresight', 'peck', 'hypnosis', 'reflect', 'take_down', 'confusion', 'dream_eater'],
    randomCount: 7,
  },
  '0165': {  // Ledyba
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 2, move: 'supersonic' },
      { level: 3, move: 'comet_punch' },
      { level: 4, move: 'light_screen' },
      { level: 4, move: 'reflect' },
      { level: 4, move: 'safeguard' },
      { level: 6, move: 'baton_pass' },
      { level: 7, move: 'swift' },
      { level: 9, move: 'agility' },
      { level: 10, move: 'double_edge' },
    ],
    fixedMoves:  ['tackle', 'supersonic'],
    randomPool:  ['comet_punch', 'light_screen', 'reflect', 'safeguard', 'baton_pass', 'swift', 'agility', 'double_edge'],
    randomCount: 8,
  },
  '0166': {  // Ledian
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'supersonic' },
      { level: 3, move: 'comet_punch' },
      { level: 5, move: 'light_screen' },
      { level: 5, move: 'reflect' },
      { level: 5, move: 'safeguard' },
      { level: 7, move: 'baton_pass' },
      { level: 8, move: 'swift' },
      { level: 10, move: 'agility' },
      { level: 12, move: 'double_edge' },
    ],
    fixedMoves:  ['tackle', 'supersonic'],
    randomPool:  ['comet_punch', 'light_screen', 'reflect', 'safeguard', 'baton_pass', 'swift', 'agility', 'double_edge'],
    randomCount: 8,
  },
  '0167': {  // Spinarak
    levelMoves: [
      { level: 1, move: 'poison_sting' },
      { level: 1, move: 'string_shot' },
      { level: 1, move: 'scary_face' },
      { level: 2, move: 'constrict' },
      { level: 3, move: 'night_shade' },
      { level: 5, move: 'leech_life' },
      { level: 6, move: 'fury_swipes' },
      { level: 7, move: 'spider_web' },
      { level: 9, move: 'screech' },
      { level: 11, move: 'psychic_move' },
    ],
    fixedMoves:  ['poison_sting', 'string_shot'],
    randomPool:  ['scary_face', 'constrict', 'night_shade', 'leech_life', 'fury_swipes', 'spider_web', 'screech', 'psychic_move'],
    randomCount: 8,
  },
  '0168': {  // Ariados
    levelMoves: [
      { level: 1, move: 'poison_sting' },
      { level: 1, move: 'string_shot' },
      { level: 1, move: 'scary_face' },
      { level: 1, move: 'constrict' },
      { level: 3, move: 'night_shade' },
      { level: 5, move: 'leech_life' },
      { level: 7, move: 'fury_swipes' },
      { level: 9, move: 'spider_web' },
      { level: 11, move: 'screech' },
      { level: 13, move: 'psychic_move' },
    ],
    fixedMoves:  ['poison_sting', 'string_shot'],
    randomPool:  ['scary_face', 'constrict', 'night_shade', 'leech_life', 'fury_swipes', 'spider_web', 'screech', 'psychic_move'],
    randomCount: 8,
  },
  '0169': {  // Crobat
    levelMoves: [
      { level: 1, move: 'screech' },
      { level: 1, move: 'leech_life' },
      { level: 1, move: 'supersonic' },
      { level: 2, move: 'bite' },
      { level: 4, move: 'confuse_ray' },
      { level: 6, move: 'wing_attack' },
      { level: 8, move: 'mean_look' },
      { level: 11, move: 'haze' },
    ],
    fixedMoves:  ['screech', 'leech_life'],
    randomPool:  ['supersonic', 'bite', 'confuse_ray', 'wing_attack', 'mean_look', 'haze'],
    randomCount: 6,
  },
  '0170': {  // Chinchou
    levelMoves: [
      { level: 1, move: 'bubble' },
      { level: 1, move: 'thunder_wave' },
      { level: 1, move: 'supersonic' },
      { level: 3, move: 'flail' },
      { level: 3, move: 'water_gun' },
      { level: 5, move: 'spark' },
      { level: 6, move: 'confuse_ray' },
      { level: 7, move: 'take_down' },
      { level: 8, move: 'hydro_pump' },
    ],
    fixedMoves:  ['bubble', 'thunder_wave'],
    randomPool:  ['supersonic', 'flail', 'water_gun', 'spark', 'confuse_ray', 'take_down', 'hydro_pump'],
    randomCount: 7,
  },
  '0171': {  // Lanturn
    levelMoves: [
      { level: 1, move: 'bubble' },
      { level: 1, move: 'thunder_wave' },
      { level: 1, move: 'supersonic' },
      { level: 3, move: 'flail' },
      { level: 3, move: 'water_gun' },
      { level: 5, move: 'spark' },
      { level: 7, move: 'confuse_ray' },
      { level: 9, move: 'take_down' },
      { level: 11, move: 'hydro_pump' },
    ],
    fixedMoves:  ['bubble', 'thunder_wave'],
    randomPool:  ['supersonic', 'flail', 'water_gun', 'spark', 'confuse_ray', 'take_down', 'hydro_pump'],
    randomCount: 7,
  },
  '0172': {  // Pichu
    levelMoves: [
      { level: 1, move: 'thundershock' },
      { level: 1, move: 'charm' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'thunder_wave' },
      { level: 2, move: 'sweet_kiss' },
    ],
    fixedMoves:  ['thundershock', 'charm'],
    randomPool:  ['tail_whip', 'thunder_wave', 'sweet_kiss'],
    randomCount: 3,
  },
  '0173': {  // Cleffa
    levelMoves: [
      { level: 1, move: 'pound' },
      { level: 1, move: 'charm' },
      { level: 1, move: 'encore' },
      { level: 2, move: 'sing' },
      { level: 3, move: 'sweet_kiss' },
    ],
    fixedMoves:  ['pound', 'charm'],
    randomPool:  ['encore', 'sing', 'sweet_kiss'],
    randomCount: 3,
  },
  '0174': {  // Igglybuff
    levelMoves: [
      { level: 1, move: 'sing' },
      { level: 1, move: 'charm' },
      { level: 1, move: 'defense_curl' },
      { level: 2, move: 'pound' },
      { level: 3, move: 'sweet_kiss' },
    ],
    fixedMoves:  ['sing', 'charm'],
    randomPool:  ['defense_curl', 'pound', 'sweet_kiss'],
    randomCount: 3,
  },
  '0175': {  // Togepi
    levelMoves: [
      { level: 1, move: 'growl' },
      { level: 1, move: 'charm' },
      { level: 4, move: 'sweet_kiss' },
      { level: 5, move: 'encore' },
      { level: 6, move: 'safeguard' },
      { level: 8, move: 'double_edge' },
    ],
    fixedMoves:  ['growl', 'charm'],
    randomPool:  ['sweet_kiss', 'encore', 'safeguard', 'double_edge'],
    randomCount: 4,
  },
  '0176': {  // Togetic
    levelMoves: [
      { level: 1, move: 'growl' },
      { level: 1, move: 'charm' },
      { level: 4, move: 'sweet_kiss' },
      { level: 5, move: 'encore' },
      { level: 6, move: 'safeguard' },
      { level: 8, move: 'double_edge' },
    ],
    fixedMoves:  ['growl', 'charm'],
    randomPool:  ['sweet_kiss', 'encore', 'safeguard', 'double_edge'],
    randomCount: 4,
  },
  '0177': {  // Natu
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'night_shade' },
      { level: 6, move: 'future_sight' },
      { level: 8, move: 'confuse_ray' },
      { level: 10, move: 'psychic_move' },
    ],
    fixedMoves:  ['peck', 'leer'],
    randomPool:  ['night_shade', 'future_sight', 'confuse_ray', 'psychic_move'],
    randomCount: 4,
    // Skipped (not in DB): Teleport (not_in_db:teleport)
  },
  '0178': {  // Xatu
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'night_shade' },
      { level: 7, move: 'future_sight' },
      { level: 10, move: 'confuse_ray' },
      { level: 13, move: 'psychic_move' },
    ],
    fixedMoves:  ['peck', 'leer'],
    randomPool:  ['night_shade', 'future_sight', 'confuse_ray', 'psychic_move'],
    randomCount: 4,
    // Skipped (not in DB): Teleport (not_in_db:teleport)
  },
  '0179': {  // Mareep
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'thundershock' },
      { level: 3, move: 'thunder_wave' },
      { level: 5, move: 'cotton_spore' },
      { level: 6, move: 'light_screen' },
      { level: 7, move: 'thunder' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['thundershock', 'thunder_wave', 'cotton_spore', 'light_screen', 'thunder'],
    randomCount: 5,
  },
  '0180': {  // Flaaffy
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'thundershock' },
      { level: 4, move: 'thunder_wave' },
      { level: 5, move: 'cotton_spore' },
      { level: 7, move: 'light_screen' },
      { level: 9, move: 'thunder' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['thundershock', 'thunder_wave', 'cotton_spore', 'light_screen', 'thunder'],
    randomCount: 5,
  },
  '0181': {  // Ampharos
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'thundershock' },
      { level: 1, move: 'thunder_wave' },
      { level: 5, move: 'cotton_spore' },
      { level: 6, move: 'thunderpunch' },
      { level: 8, move: 'light_screen' },
      { level: 11, move: 'thunder' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['thundershock', 'thunder_wave', 'cotton_spore', 'thunderpunch', 'light_screen', 'thunder'],
    randomCount: 6,
  },
  '0182': {  // Bellossom
    levelMoves: [
      { level: 1, move: 'absorb' },
      { level: 1, move: 'sweet_scent' },
      { level: 1, move: 'stun_spore' },
      { level: 1, move: 'petal_dance' },
      { level: 11, move: 'solar_beam' },
    ],
    fixedMoves:  ['absorb', 'sweet_scent'],
    randomPool:  ['stun_spore', 'petal_dance', 'solar_beam'],
    randomCount: 3,
  },
  '0183': {  // Marill
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'defense_curl' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'water_gun' },
      { level: 3, move: 'rollout' },
      { level: 4, move: 'bubble_beam' },
      { level: 6, move: 'double_edge' },
      { level: 7, move: 'rain_dance' },
    ],
    fixedMoves:  ['tackle', 'defense_curl'],
    randomPool:  ['tail_whip', 'water_gun', 'rollout', 'bubble_beam', 'double_edge', 'rain_dance'],
    randomCount: 6,
  },
  '0184': {  // Azumarill
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'defense_curl' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'water_gun' },
      { level: 3, move: 'rollout' },
      { level: 5, move: 'bubble_beam' },
      { level: 7, move: 'double_edge' },
      { level: 10, move: 'rain_dance' },
    ],
    fixedMoves:  ['tackle', 'defense_curl'],
    randomPool:  ['tail_whip', 'water_gun', 'rollout', 'bubble_beam', 'double_edge', 'rain_dance'],
    randomCount: 6,
  },
  '0185': {  // Sudowoodo
    levelMoves: [
      { level: 1, move: 'rock_throw' },
      { level: 2, move: 'flail' },
      { level: 4, move: 'low_kick' },
      { level: 6, move: 'rock_slide' },
      { level: 7, move: 'faint_attack' },
      { level: 9, move: 'slam' },
    ],
    fixedMoves:  ['rock_throw', 'flail'],
    randomPool:  ['low_kick', 'rock_slide', 'faint_attack', 'slam'],
    randomCount: 4,
  },
  '0186': {  // Politoed
    levelMoves: [
      { level: 1, move: 'water_gun' },
      { level: 1, move: 'hypnosis' },
      { level: 1, move: 'doubleslap' },
      { level: 10, move: 'swagger' },
    ],
    fixedMoves:  ['water_gun', 'hypnosis'],
    randomPool:  ['doubleslap', 'swagger'],
    randomCount: 2,
    // Skipped (not in DB): Perish Song (not_in_db:perish_song), Perish Song (not_in_db:perish_song)
  },
  '0187': {  // Hoppip
    levelMoves: [
      { level: 1, move: 'synthesis' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'tackle' },
      { level: 3, move: 'poison_powder' },
      { level: 3, move: 'stun_spore' },
      { level: 3, move: 'sleep_powder' },
      { level: 4, move: 'leech_seed' },
      { level: 5, move: 'cotton_spore' },
      { level: 6, move: 'mega_drain' },
    ],
    fixedMoves:  ['synthesis', 'tail_whip'],
    randomPool:  ['tackle', 'poison_powder', 'stun_spore', 'sleep_powder', 'leech_seed', 'cotton_spore', 'mega_drain'],
    randomCount: 7,
  },
  '0188': {  // Skiploom
    levelMoves: [
      { level: 1, move: 'synthesis' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'tackle' },
      { level: 3, move: 'poison_powder' },
      { level: 3, move: 'stun_spore' },
      { level: 3, move: 'sleep_powder' },
      { level: 4, move: 'leech_seed' },
      { level: 6, move: 'cotton_spore' },
      { level: 7, move: 'mega_drain' },
    ],
    fixedMoves:  ['synthesis', 'tail_whip'],
    randomPool:  ['tackle', 'poison_powder', 'stun_spore', 'sleep_powder', 'leech_seed', 'cotton_spore', 'mega_drain'],
    randomCount: 7,
  },
  '0189': {  // Jumpluff
    levelMoves: [
      { level: 1, move: 'synthesis' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'tackle' },
      { level: 3, move: 'poison_powder' },
      { level: 3, move: 'stun_spore' },
      { level: 3, move: 'sleep_powder' },
      { level: 4, move: 'leech_seed' },
      { level: 7, move: 'cotton_spore' },
      { level: 9, move: 'mega_drain' },
    ],
    fixedMoves:  ['synthesis', 'tail_whip'],
    randomPool:  ['tackle', 'poison_powder', 'stun_spore', 'sleep_powder', 'leech_seed', 'cotton_spore', 'mega_drain'],
    randomCount: 7,
  },
  '0190': {  // Aipom
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'tail_whip' },
      { level: 1, move: 'sand_attack' },
      { level: 2, move: 'baton_pass' },
      { level: 4, move: 'fury_swipes' },
      { level: 5, move: 'swift' },
      { level: 7, move: 'screech' },
      { level: 9, move: 'agility' },
    ],
    fixedMoves:  ['scratch', 'tail_whip'],
    randomPool:  ['sand_attack', 'baton_pass', 'fury_swipes', 'swift', 'screech', 'agility'],
    randomCount: 6,
  },
  '0191': {  // Sunkern
    levelMoves: [
      { level: 1, move: 'absorb' },
      { level: 1, move: 'growth' },
      { level: 2, move: 'mega_drain' },
      { level: 4, move: 'sunny_day' },
      { level: 6, move: 'synthesis' },
      { level: 9, move: 'giga_drain' },
    ],
    fixedMoves:  ['absorb', 'growth'],
    randomPool:  ['mega_drain', 'sunny_day', 'synthesis', 'giga_drain'],
    randomCount: 4,
  },
  '0192': {  // Sunflora
    levelMoves: [
      { level: 1, move: 'absorb' },
      { level: 1, move: 'pound' },
      { level: 1, move: 'growth' },
      { level: 2, move: 'razor_leaf' },
      { level: 4, move: 'sunny_day' },
      { level: 6, move: 'petal_dance' },
      { level: 9, move: 'solar_beam' },
    ],
    fixedMoves:  ['absorb', 'pound'],
    randomPool:  ['growth', 'razor_leaf', 'sunny_day', 'petal_dance', 'solar_beam'],
    randomCount: 5,
  },
  '0193': {  // Yanma
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'foresight' },
      { level: 1, move: 'quick_attack' },
      { level: 3, move: 'double_team' },
      { level: 4, move: 'sonicboom' },
      { level: 5, move: 'detect' },
      { level: 6, move: 'supersonic' },
      { level: 7, move: 'swift' },
      { level: 9, move: 'screech' },
    ],
    fixedMoves:  ['tackle', 'foresight'],
    randomPool:  ['quick_attack', 'double_team', 'sonicboom', 'detect', 'supersonic', 'swift', 'screech'],
    randomCount: 7,
  },
  '0194': {  // Wooper
    levelMoves: [
      { level: 1, move: 'water_gun' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'slam' },
      { level: 4, move: 'amnesia' },
      { level: 6, move: 'earthquake' },
      { level: 8, move: 'rain_dance' },
      { level: 10, move: 'mist' },
      { level: 10, move: 'haze' },
    ],
    fixedMoves:  ['water_gun', 'tail_whip'],
    randomPool:  ['slam', 'amnesia', 'earthquake', 'rain_dance', 'mist', 'haze'],
    randomCount: 6,
  },
  '0195': {  // Quagsire
    levelMoves: [
      { level: 1, move: 'water_gun' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'slam' },
      { level: 5, move: 'amnesia' },
      { level: 7, move: 'earthquake' },
      { level: 9, move: 'rain_dance' },
      { level: 12, move: 'mist' },
      { level: 12, move: 'haze' },
    ],
    fixedMoves:  ['water_gun', 'tail_whip'],
    randomPool:  ['slam', 'amnesia', 'earthquake', 'rain_dance', 'mist', 'haze'],
    randomCount: 6,
  },
  '0196': {  // Espeon
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'sand_attack' },
      { level: 3, move: 'confusion' },
      { level: 5, move: 'quick_attack' },
      { level: 6, move: 'swift' },
      { level: 7, move: 'psybeam' },
      { level: 9, move: 'psychic_move' },
      { level: 10, move: 'morning_sun' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['sand_attack', 'confusion', 'quick_attack', 'swift', 'psybeam', 'psychic_move', 'morning_sun'],
    randomCount: 7,
    // Skipped (not in DB): Psych Up (not_in_db:psych_up)
  },
  '0197': {  // Umbreon
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'sand_attack' },
      { level: 3, move: 'pursuit' },
      { level: 5, move: 'quick_attack' },
      { level: 6, move: 'confuse_ray' },
      { level: 7, move: 'faint_attack' },
      { level: 8, move: 'mean_look' },
      { level: 9, move: 'screech' },
      { level: 10, move: 'moonlight' },
    ],
    fixedMoves:  ['tackle', 'tail_whip'],
    randomPool:  ['sand_attack', 'pursuit', 'quick_attack', 'confuse_ray', 'faint_attack', 'mean_look', 'screech', 'moonlight'],
    randomCount: 8,
  },
  '0198': {  // Murkrow
    levelMoves: [
      { level: 1, move: 'peck' },
      { level: 2, move: 'pursuit' },
      { level: 3, move: 'haze' },
      { level: 5, move: 'night_shade' },
      { level: 6, move: 'faint_attack' },
      { level: 8, move: 'mean_look' },
    ],
    fixedMoves:  ['peck', 'pursuit'],
    randomPool:  ['haze', 'night_shade', 'faint_attack', 'mean_look'],
    randomCount: 4,
  },
  '0199': {  // Slowking
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 3, move: 'water_gun' },
      { level: 4, move: 'confusion' },
      { level: 6, move: 'disable' },
      { level: 7, move: 'headbutt' },
      { level: 9, move: 'swagger' },
      { level: 10, move: 'psychic_move' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['water_gun', 'confusion', 'disable', 'headbutt', 'swagger', 'psychic_move'],
    randomCount: 6,
    // Skipped (not in DB): Curse (not_in_db:curse)
  },
  '0200': {  // Misdreavus
    levelMoves: [
      { level: 1, move: 'growl' },
      { level: 1, move: 'psywave' },
      { level: 1, move: 'spite' },
      { level: 2, move: 'confuse_ray' },
      { level: 4, move: 'mean_look' },
      { level: 5, move: 'psybeam' },
    ],
    fixedMoves:  ['growl', 'psywave'],
    randomPool:  ['spite', 'confuse_ray', 'mean_look', 'psybeam'],
    randomCount: 4,
    // Skipped (not in DB): Pain Split (not_in_db:pain_split), Perish Song (not_in_db:perish_song)
  },
  '0201': {  // Unown
    levelMoves: [
      { level: 1, move: 'hidden_power' },
    ],
    fixedMoves:  ['hidden_power'],
    randomPool:  [],
    randomCount: 0,
  },
  '0202': {  // Wobbuffet
    levelMoves: [
      { level: 1, move: 'safeguard' },
    ],
    fixedMoves:  ['safeguard'],
    randomPool:  [],
    randomCount: 0,
    // Skipped (not in DB): Counter (not_in_db:counter), Mirror Coat (not_in_db:mirror_coat), Destiny Bond (not_in_db:destiny_bond)
  },
  '0203': {  // Girafarig
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'confusion' },
      { level: 1, move: 'stomp' },
      { level: 4, move: 'agility' },
      { level: 6, move: 'baton_pass' },
      { level: 8, move: 'psybeam' },
      { level: 11, move: 'crunch' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['confusion', 'stomp', 'agility', 'baton_pass', 'psybeam', 'crunch'],
    randomCount: 6,
  },
  '0204': {  // Pineco
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'protect' },
      { level: 3, move: 'take_down' },
      { level: 4, move: 'rapid_spin' },
      { level: 7, move: 'explosion' },
      { level: 10, move: 'double_edge' },
    ],
    fixedMoves:  ['tackle', 'protect'],
    randomPool:  ['take_down', 'rapid_spin', 'explosion', 'double_edge'],
    randomCount: 4,
    // Skipped (not in DB): Selfdestruct (not_in_db:selfdestruct), Bide (not_in_db:bide), Spikes (not_in_db:spikes)
  },
  '0205': {  // Forretress
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'protect' },
      { level: 3, move: 'take_down' },
      { level: 4, move: 'rapid_spin' },
      { level: 8, move: 'explosion' },
      { level: 12, move: 'double_edge' },
    ],
    fixedMoves:  ['tackle', 'protect'],
    randomPool:  ['take_down', 'rapid_spin', 'explosion', 'double_edge'],
    randomCount: 4,
    // Skipped (not in DB): Selfdestruct (not_in_db:selfdestruct), Selfdestruct (not_in_db:selfdestruct), Bide (not_in_db:bide), Spikes (not_in_db:spikes)
  },
  '0206': {  // Dunsparce
    levelMoves: [
      { level: 1, move: 'rage' },
      { level: 1, move: 'defense_curl' },
      { level: 3, move: 'glare' },
      { level: 4, move: 'spite' },
      { level: 5, move: 'pursuit' },
      { level: 6, move: 'screech' },
      { level: 8, move: 'take_down' },
    ],
    fixedMoves:  ['rage', 'defense_curl'],
    randomPool:  ['glare', 'spite', 'pursuit', 'screech', 'take_down'],
    randomCount: 5,
  },
  '0207': {  // Gligar
    levelMoves: [
      { level: 1, move: 'poison_sting' },
      { level: 1, move: 'sand_attack' },
      { level: 3, move: 'harden' },
      { level: 4, move: 'quick_attack' },
      { level: 6, move: 'faint_attack' },
      { level: 7, move: 'slash' },
      { level: 9, move: 'screech' },
    ],
    fixedMoves:  ['poison_sting', 'sand_attack'],
    randomPool:  ['harden', 'quick_attack', 'faint_attack', 'slash', 'screech'],
    randomCount: 5,
    // Skipped (not in DB): Guillotine (not_in_db:guillotine)
  },
  '0208': {  // Steelix
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'screech' },
      { level: 2, move: 'bind' },
      { level: 3, move: 'rock_throw' },
      { level: 5, move: 'harden' },
      { level: 5, move: 'rage' },
      { level: 7, move: 'sandstorm' },
      { level: 8, move: 'slam' },
      { level: 10, move: 'crunch' },
    ],
    fixedMoves:  ['tackle', 'screech'],
    randomPool:  ['bind', 'rock_throw', 'harden', 'rage', 'sandstorm', 'slam', 'crunch'],
    randomCount: 7,
  },
  '0209': {  // Snubbull
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'scary_face' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'charm' },
      { level: 3, move: 'bite' },
      { level: 4, move: 'lick' },
      { level: 5, move: 'roar' },
      { level: 7, move: 'rage' },
      { level: 9, move: 'take_down' },
    ],
    fixedMoves:  ['tackle', 'scary_face'],
    randomPool:  ['tail_whip', 'charm', 'bite', 'lick', 'roar', 'rage', 'take_down'],
    randomCount: 7,
  },
  '0210': {  // Granbull
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'scary_face' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'charm' },
      { level: 3, move: 'bite' },
      { level: 4, move: 'lick' },
      { level: 6, move: 'roar' },
      { level: 8, move: 'rage' },
      { level: 10, move: 'take_down' },
    ],
    fixedMoves:  ['tackle', 'scary_face'],
    randomPool:  ['tail_whip', 'charm', 'bite', 'lick', 'roar', 'rage', 'take_down'],
    randomCount: 7,
  },
  '0211': {  // Qwilfish
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'poison_sting' },
      { level: 2, move: 'harden' },
      { level: 2, move: 'minimize' },
      { level: 4, move: 'water_gun' },
      { level: 6, move: 'pin_missile' },
      { level: 7, move: 'take_down' },
      { level: 9, move: 'hydro_pump' },
    ],
    fixedMoves:  ['tackle', 'poison_sting'],
    randomPool:  ['harden', 'minimize', 'water_gun', 'pin_missile', 'take_down', 'hydro_pump'],
    randomCount: 6,
  },
  '0212': {  // Scizor
    levelMoves: [
      { level: 1, move: 'quick_attack' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'focus_energy' },
      { level: 2, move: 'pursuit' },
      { level: 4, move: 'false_swipe' },
      { level: 5, move: 'agility' },
      { level: 6, move: 'metal_claw' },
      { level: 7, move: 'slash' },
      { level: 8, move: 'swords_dance' },
      { level: 10, move: 'double_team' },
    ],
    fixedMoves:  ['quick_attack', 'leer'],
    randomPool:  ['focus_energy', 'pursuit', 'false_swipe', 'agility', 'metal_claw', 'slash', 'swords_dance', 'double_team'],
    randomCount: 8,
  },
  '0213': {  // Shuckle
    levelMoves: [
      { level: 1, move: 'constrict' },
      { level: 1, move: 'withdraw' },
      { level: 2, move: 'wrap' },
      { level: 3, move: 'encore' },
      { level: 5, move: 'safeguard' },
      { level: 7, move: 'rest' },
    ],
    fixedMoves:  ['constrict', 'withdraw'],
    randomPool:  ['wrap', 'encore', 'safeguard', 'rest'],
    randomCount: 4,
    // Skipped (not in DB): Bide (not_in_db:bide)
  },
  '0214': {  // Heracross
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'horn_attack' },
      { level: 2, move: 'endure' },
      { level: 4, move: 'fury_attack' },
      { level: 7, move: 'take_down' },
      { level: 9, move: 'reversal' },
      { level: 11, move: 'megahorn' },
    ],
    fixedMoves:  ['tackle', 'leer'],
    randomPool:  ['horn_attack', 'endure', 'fury_attack', 'take_down', 'reversal', 'megahorn'],
    randomCount: 6,
    // Skipped (not in DB): Counter (not_in_db:counter)
  },
  '0215': {  // Sneasel
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'quick_attack' },
      { level: 3, move: 'screech' },
      { level: 5, move: 'faint_attack' },
      { level: 7, move: 'fury_swipes' },
      { level: 8, move: 'agility' },
      { level: 10, move: 'slash' },
      { level: 11, move: 'beat_up' },
    ],
    fixedMoves:  ['scratch', 'leer'],
    randomPool:  ['quick_attack', 'screech', 'faint_attack', 'fury_swipes', 'agility', 'slash', 'beat_up'],
    randomCount: 7,
  },
  '0216': {  // Teddiursa
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'lick' },
      { level: 3, move: 'fury_swipes' },
      { level: 4, move: 'faint_attack' },
      { level: 6, move: 'rest' },
      { level: 7, move: 'slash' },
      { level: 9, move: 'snore' },
      { level: 10, move: 'thrash' },
    ],
    fixedMoves:  ['scratch', 'leer'],
    randomPool:  ['lick', 'fury_swipes', 'faint_attack', 'rest', 'slash', 'snore', 'thrash'],
    randomCount: 7,
  },
  '0217': {  // Ursaring
    levelMoves: [
      { level: 1, move: 'scratch' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'lick' },
      { level: 1, move: 'fury_swipes' },
      { level: 4, move: 'faint_attack' },
      { level: 6, move: 'rest' },
      { level: 8, move: 'slash' },
      { level: 10, move: 'snore' },
      { level: 12, move: 'thrash' },
    ],
    fixedMoves:  ['scratch', 'leer'],
    randomPool:  ['lick', 'fury_swipes', 'faint_attack', 'rest', 'slash', 'snore', 'thrash'],
    randomCount: 7,
  },
  '0218': {  // Slugma
    levelMoves: [
      { level: 1, move: 'smog' },
      { level: 2, move: 'ember' },
      { level: 3, move: 'rock_throw' },
      { level: 4, move: 'harden' },
      { level: 6, move: 'amnesia' },
      { level: 7, move: 'flamethrower' },
      { level: 9, move: 'rock_slide' },
      { level: 10, move: 'body_slam' },
    ],
    fixedMoves:  ['smog', 'ember'],
    randomPool:  ['rock_throw', 'harden', 'amnesia', 'flamethrower', 'rock_slide', 'body_slam'],
    randomCount: 6,
  },
  '0219': {  // Magcargo
    levelMoves: [
      { level: 1, move: 'smog' },
      { level: 1, move: 'ember' },
      { level: 1, move: 'rock_throw' },
      { level: 4, move: 'harden' },
      { level: 6, move: 'amnesia' },
      { level: 7, move: 'flamethrower' },
      { level: 10, move: 'rock_slide' },
      { level: 12, move: 'body_slam' },
    ],
    fixedMoves:  ['smog', 'ember'],
    randomPool:  ['rock_throw', 'harden', 'amnesia', 'flamethrower', 'rock_slide', 'body_slam'],
    randomCount: 6,
  },
  '0220': {  // Swinub
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 2, move: 'powder_snow' },
      { level: 4, move: 'endure' },
      { level: 6, move: 'take_down' },
      { level: 7, move: 'mist' },
      { level: 9, move: 'blizzard' },
    ],
    fixedMoves:  ['tackle', 'powder_snow'],
    randomPool:  ['endure', 'take_down', 'mist', 'blizzard'],
    randomCount: 4,
  },
  '0221': {  // Piloswine
    levelMoves: [
      { level: 1, move: 'horn_attack' },
      { level: 1, move: 'powder_snow' },
      { level: 1, move: 'endure' },
      { level: 6, move: 'take_down' },
      { level: 7, move: 'fury_attack' },
      { level: 8, move: 'mist' },
      { level: 11, move: 'blizzard' },
    ],
    fixedMoves:  ['horn_attack', 'powder_snow'],
    randomPool:  ['endure', 'take_down', 'fury_attack', 'mist', 'blizzard'],
    randomCount: 5,
  },
  '0222': {  // Corsola
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'harden' },
      { level: 3, move: 'bubble' },
      { level: 4, move: 'recover' },
      { level: 5, move: 'bubble_beam' },
      { level: 6, move: 'spike_cannon' },
      { level: 9, move: 'ancient_power' },
    ],
    fixedMoves:  ['tackle', 'harden'],
    randomPool:  ['bubble', 'recover', 'bubble_beam', 'spike_cannon', 'ancient_power'],
    randomCount: 5,
    // Skipped (not in DB): Mirror Coat (not_in_db:mirror_coat)
  },
  '0223': {  // Remoraid
    levelMoves: [
      { level: 1, move: 'water_gun' },
      { level: 4, move: 'psybeam' },
      { level: 4, move: 'aurora_beam' },
      { level: 4, move: 'bubble_beam' },
      { level: 7, move: 'focus_energy' },
      { level: 11, move: 'hyper_beam' },
    ],
    fixedMoves:  ['water_gun', 'psybeam'],
    randomPool:  ['aurora_beam', 'bubble_beam', 'focus_energy', 'hyper_beam'],
    randomCount: 4,
    // Skipped (not in DB): Lock-On (not_in_db:lock_on), Ice Beam (not_in_db:ice_beam)
  },
  '0224': {  // Octillery
    levelMoves: [
      { level: 1, move: 'water_gun' },
      { level: 2, move: 'constrict' },
      { level: 4, move: 'psybeam' },
      { level: 4, move: 'aurora_beam' },
      { level: 4, move: 'bubble_beam' },
      { level: 5, move: 'octazooka' },
      { level: 8, move: 'focus_energy' },
      { level: 14, move: 'hyper_beam' },
    ],
    fixedMoves:  ['water_gun', 'constrict'],
    randomPool:  ['psybeam', 'aurora_beam', 'bubble_beam', 'octazooka', 'focus_energy', 'hyper_beam'],
    randomCount: 6,
    // Skipped (not in DB): Ice Beam (not_in_db:ice_beam)
  },
  '0225': {  // Delibird
    levelMoves: [
    ],
    fixedMoves:  [],
    randomPool:  [],
    randomCount: 0,
    // Skipped (not in DB): Present (not_in_db:present)
  },
  '0226': {  // Mantine
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'bubble' },
      { level: 2, move: 'supersonic' },
      { level: 4, move: 'bubble_beam' },
      { level: 5, move: 'take_down' },
      { level: 6, move: 'agility' },
      { level: 8, move: 'wing_attack' },
      { level: 10, move: 'confuse_ray' },
    ],
    fixedMoves:  ['tackle', 'bubble'],
    randomPool:  ['supersonic', 'bubble_beam', 'take_down', 'agility', 'wing_attack', 'confuse_ray'],
    randomCount: 6,
  },
  '0227': {  // Skarmory
    levelMoves: [
      { level: 1, move: 'leer' },
      { level: 1, move: 'peck' },
      { level: 3, move: 'sand_attack' },
      { level: 4, move: 'swift' },
      { level: 5, move: 'agility' },
      { level: 7, move: 'fury_attack' },
      { level: 10, move: 'steel_wing' },
    ],
    fixedMoves:  ['leer', 'peck'],
    randomPool:  ['sand_attack', 'swift', 'agility', 'fury_attack', 'steel_wing'],
    randomCount: 5,
  },
  '0228': {  // Houndour
    levelMoves: [
      { level: 1, move: 'leer' },
      { level: 1, move: 'ember' },
      { level: 1, move: 'roar' },
      { level: 3, move: 'smog' },
      { level: 4, move: 'bite' },
      { level: 5, move: 'faint_attack' },
      { level: 7, move: 'flamethrower' },
      { level: 9, move: 'crunch' },
    ],
    fixedMoves:  ['leer', 'ember'],
    randomPool:  ['roar', 'smog', 'bite', 'faint_attack', 'flamethrower', 'crunch'],
    randomCount: 6,
  },
  '0229': {  // Houndoom
    levelMoves: [
      { level: 1, move: 'leer' },
      { level: 1, move: 'ember' },
      { level: 1, move: 'roar' },
      { level: 3, move: 'smog' },
      { level: 4, move: 'bite' },
      { level: 6, move: 'faint_attack' },
      { level: 8, move: 'flamethrower' },
      { level: 10, move: 'crunch' },
    ],
    fixedMoves:  ['leer', 'ember'],
    randomPool:  ['roar', 'smog', 'bite', 'faint_attack', 'flamethrower', 'crunch'],
    randomCount: 6,
  },
  '0230': {  // Kingdra
    levelMoves: [
      { level: 1, move: 'bubble' },
      { level: 1, move: 'smokescreen' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'water_gun' },
      { level: 6, move: 'twister' },
      { level: 8, move: 'agility' },
      { level: 10, move: 'hydro_pump' },
    ],
    fixedMoves:  ['bubble', 'smokescreen'],
    randomPool:  ['leer', 'water_gun', 'twister', 'agility', 'hydro_pump'],
    randomCount: 5,
  },
  '0231': {  // Phanpy
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'defense_curl' },
      { level: 3, move: 'flail' },
      { level: 5, move: 'take_down' },
      { level: 7, move: 'rollout' },
      { level: 8, move: 'endure' },
      { level: 10, move: 'double_edge' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['defense_curl', 'flail', 'take_down', 'rollout', 'endure', 'double_edge'],
    randomCount: 6,
  },
  '0232': {  // Donphan
    levelMoves: [
      { level: 1, move: 'horn_attack' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'defense_curl' },
      { level: 3, move: 'flail' },
      { level: 5, move: 'fury_attack' },
      { level: 7, move: 'rollout' },
      { level: 8, move: 'rapid_spin' },
      { level: 10, move: 'earthquake' },
    ],
    fixedMoves:  ['horn_attack', 'growl'],
    randomPool:  ['defense_curl', 'flail', 'fury_attack', 'rollout', 'rapid_spin', 'earthquake'],
    randomCount: 6,
  },
  '0233': {  // Porygon2
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 2, move: 'agility' },
      { level: 2, move: 'psybeam' },
      { level: 4, move: 'recover' },
      { level: 5, move: 'defense_curl' },
      { level: 7, move: 'tri_attack' },
      { level: 9, move: 'zap_cannon' },
    ],
    fixedMoves:  ['tackle', 'agility'],
    randomPool:  ['psybeam', 'recover', 'defense_curl', 'tri_attack', 'zap_cannon'],
    randomCount: 5,
    // Skipped (not in DB): Conversion 2 (not_in_db:conversion_2), Conversion (not_in_db:conversion), Lock-On (not_in_db:lock_on)
  },
  '0234': {  // Stantler
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 2, move: 'leer' },
      { level: 3, move: 'hypnosis' },
      { level: 5, move: 'stomp' },
      { level: 6, move: 'sand_attack' },
      { level: 8, move: 'take_down' },
      { level: 10, move: 'confuse_ray' },
    ],
    fixedMoves:  ['tackle', 'leer'],
    randomPool:  ['hypnosis', 'stomp', 'sand_attack', 'take_down', 'confuse_ray'],
    randomCount: 5,
  },
  '0235': {  // Smeargle
    levelMoves: [
    ],
    fixedMoves:  [],
    randomPool:  [],
    randomCount: 0,
  },
  '0236': {  // Tyrogue
    levelMoves: [
      { level: 1, move: 'tackle' },
    ],
    fixedMoves:  ['tackle'],
    randomPool:  [],
    randomCount: 0,
  },
  '0237': {  // Hitmontop
    levelMoves: [
      { level: 1, move: 'rolling_kick' },
      { level: 1, move: 'focus_energy' },
      { level: 3, move: 'pursuit' },
      { level: 4, move: 'quick_attack' },
      { level: 5, move: 'rapid_spin' },
      { level: 7, move: 'agility' },
      { level: 9, move: 'detect' },
      { level: 10, move: 'triple_kick' },
    ],
    fixedMoves:  ['rolling_kick', 'focus_energy'],
    randomPool:  ['pursuit', 'quick_attack', 'rapid_spin', 'agility', 'detect', 'triple_kick'],
    randomCount: 6,
    // Skipped (not in DB): Counter (not_in_db:counter)
  },
  '0238': {  // Smoochum
    levelMoves: [
      { level: 1, move: 'pound' },
      { level: 1, move: 'lick' },
      { level: 2, move: 'sweet_kiss' },
      { level: 3, move: 'powder_snow' },
      { level: 4, move: 'confusion' },
      { level: 5, move: 'sing' },
      { level: 7, move: 'mean_look' },
      { level: 7, move: 'psychic_move' },
      { level: 10, move: 'blizzard' },
    ],
    fixedMoves:  ['pound', 'lick'],
    randomPool:  ['sweet_kiss', 'powder_snow', 'confusion', 'sing', 'mean_look', 'psychic_move', 'blizzard'],
    randomCount: 7,
    // Skipped (not in DB): Perish Song (not_in_db:perish_song)
  },
  '0239': {  // Elekid
    levelMoves: [
      { level: 1, move: 'quick_attack' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'thunderpunch' },
      { level: 3, move: 'light_screen' },
      { level: 5, move: 'swift' },
      { level: 7, move: 'screech' },
      { level: 8, move: 'thunderbolt' },
      { level: 10, move: 'thunder' },
    ],
    fixedMoves:  ['quick_attack', 'leer'],
    randomPool:  ['thunderpunch', 'light_screen', 'swift', 'screech', 'thunderbolt', 'thunder'],
    randomCount: 6,
  },
  '0240': {  // Magby
    levelMoves: [
      { level: 1, move: 'ember' },
      { level: 1, move: 'leer' },
      { level: 3, move: 'smog' },
      { level: 4, move: 'fire_punch' },
      { level: 5, move: 'smokescreen' },
      { level: 6, move: 'sunny_day' },
      { level: 7, move: 'flamethrower' },
      { level: 9, move: 'confuse_ray' },
      { level: 10, move: 'fire_blast' },
    ],
    fixedMoves:  ['ember', 'leer'],
    randomPool:  ['smog', 'fire_punch', 'smokescreen', 'sunny_day', 'flamethrower', 'confuse_ray', 'fire_blast'],
    randomCount: 7,
  },
  '0241': {  // Miltank
    levelMoves: [
      { level: 1, move: 'tackle' },
      { level: 1, move: 'growl' },
      { level: 2, move: 'defense_curl' },
      { level: 3, move: 'stomp' },
      { level: 4, move: 'milk_drink' },
      { level: 7, move: 'rollout' },
      { level: 9, move: 'body_slam' },
      { level: 11, move: 'heal_bell' },
    ],
    fixedMoves:  ['tackle', 'growl'],
    randomPool:  ['defense_curl', 'stomp', 'milk_drink', 'rollout', 'body_slam', 'heal_bell'],
    randomCount: 6,
    // Skipped (not in DB): Bide (not_in_db:bide)
  },
  '0242': {  // Blissey
    levelMoves: [
      { level: 1, move: 'pound' },
      { level: 1, move: 'growl' },
      { level: 1, move: 'tail_whip' },
      { level: 2, move: 'softboiled' },
      { level: 3, move: 'doubleslap' },
      { level: 4, move: 'minimize' },
      { level: 5, move: 'sing' },
      { level: 6, move: 'egg_bomb' },
      { level: 7, move: 'defense_curl' },
      { level: 8, move: 'light_screen' },
      { level: 9, move: 'double_edge' },
    ],
    fixedMoves:  ['pound', 'growl'],
    randomPool:  ['tail_whip', 'softboiled', 'doubleslap', 'minimize', 'sing', 'egg_bomb', 'defense_curl', 'light_screen', 'double_edge'],
    randomCount: 9,
  },
  '0243': {  // Raikou
    levelMoves: [
      { level: 1, move: 'bite' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'thundershock' },
      { level: 4, move: 'roar' },
      { level: 6, move: 'quick_attack' },
      { level: 8, move: 'spark' },
      { level: 10, move: 'reflect' },
      { level: 12, move: 'crunch' },
      { level: 14, move: 'thunder' },
    ],
    fixedMoves:  ['bite', 'leer'],
    randomPool:  ['thundershock', 'roar', 'quick_attack', 'spark', 'reflect', 'crunch', 'thunder'],
    randomCount: 7,
  },
  '0244': {  // Entei
    levelMoves: [
      { level: 1, move: 'bite' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'ember' },
      { level: 4, move: 'roar' },
      { level: 6, move: 'fire_spin' },
      { level: 8, move: 'stomp' },
      { level: 10, move: 'flamethrower' },
      { level: 12, move: 'swagger' },
      { level: 14, move: 'fire_blast' },
    ],
    fixedMoves:  ['bite', 'leer'],
    randomPool:  ['ember', 'roar', 'fire_spin', 'stomp', 'flamethrower', 'swagger', 'fire_blast'],
    randomCount: 7,
  },
  '0245': {  // Suicune
    levelMoves: [
      { level: 1, move: 'bite' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'water_gun' },
      { level: 4, move: 'roar' },
      { level: 6, move: 'gust' },
      { level: 8, move: 'bubble_beam' },
      { level: 10, move: 'mist' },
      { level: 14, move: 'hydro_pump' },
    ],
    fixedMoves:  ['bite', 'leer'],
    randomPool:  ['water_gun', 'roar', 'gust', 'bubble_beam', 'mist', 'hydro_pump'],
    randomCount: 6,
    // Skipped (not in DB): Mirror Coat (not_in_db:mirror_coat)
  },
  '0246': {  // Larvitar
    levelMoves: [
      { level: 1, move: 'bite' },
      { level: 1, move: 'leer' },
      { level: 2, move: 'sandstorm' },
      { level: 3, move: 'screech' },
      { level: 4, move: 'rock_slide' },
      { level: 6, move: 'thrash' },
      { level: 7, move: 'scary_face' },
      { level: 9, move: 'crunch' },
      { level: 10, move: 'earthquake' },
      { level: 11, move: 'hyper_beam' },
    ],
    fixedMoves:  ['bite', 'leer'],
    randomPool:  ['sandstorm', 'screech', 'rock_slide', 'thrash', 'scary_face', 'crunch', 'earthquake', 'hyper_beam'],
    randomCount: 8,
  },
  '0247': {  // Pupitar
    levelMoves: [
      { level: 1, move: 'bite' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'sandstorm' },
      { level: 1, move: 'screech' },
      { level: 4, move: 'rock_slide' },
      { level: 6, move: 'thrash' },
      { level: 8, move: 'scary_face' },
      { level: 9, move: 'crunch' },
      { level: 11, move: 'earthquake' },
      { level: 13, move: 'hyper_beam' },
    ],
    fixedMoves:  ['bite', 'leer'],
    randomPool:  ['sandstorm', 'screech', 'rock_slide', 'thrash', 'scary_face', 'crunch', 'earthquake', 'hyper_beam'],
    randomCount: 8,
  },
  '0248': {  // Tyranitar
    levelMoves: [
      { level: 1, move: 'bite' },
      { level: 1, move: 'leer' },
      { level: 1, move: 'sandstorm' },
      { level: 1, move: 'screech' },
      { level: 4, move: 'rock_slide' },
      { level: 6, move: 'thrash' },
      { level: 8, move: 'scary_face' },
      { level: 9, move: 'crunch' },
      { level: 12, move: 'earthquake' },
      { level: 15, move: 'hyper_beam' },
    ],
    fixedMoves:  ['bite', 'leer'],
    randomPool:  ['sandstorm', 'screech', 'rock_slide', 'thrash', 'scary_face', 'crunch', 'earthquake', 'hyper_beam'],
    randomCount: 8,
  },
  '0249': {  // Lugia
    levelMoves: [
      { level: 1, move: 'aeroblast' },
      { level: 2, move: 'safeguard' },
      { level: 4, move: 'gust' },
      { level: 7, move: 'recover' },
      { level: 9, move: 'hydro_pump' },
      { level: 11, move: 'rain_dance' },
      { level: 13, move: 'swift' },
      { level: 15, move: 'whirlwind' },
      { level: 18, move: 'ancient_power' },
      { level: 20, move: 'future_sight' },
    ],
    fixedMoves:  ['aeroblast', 'safeguard'],
    randomPool:  ['gust', 'recover', 'hydro_pump', 'rain_dance', 'swift', 'whirlwind', 'ancient_power', 'future_sight'],
    randomCount: 8,
  },
  '0250': {  // Ho-Oh
    levelMoves: [
      { level: 1, move: 'sacred_fire' },
      { level: 2, move: 'safeguard' },
      { level: 4, move: 'gust' },
      { level: 7, move: 'recover' },
      { level: 9, move: 'fire_blast' },
      { level: 11, move: 'sunny_day' },
      { level: 13, move: 'swift' },
      { level: 15, move: 'whirlwind' },
      { level: 18, move: 'ancient_power' },
      { level: 20, move: 'future_sight' },
    ],
    fixedMoves:  ['sacred_fire', 'safeguard'],
    randomPool:  ['gust', 'recover', 'fire_blast', 'sunny_day', 'swift', 'whirlwind', 'ancient_power', 'future_sight'],
    randomCount: 8,
  },
  '0251': {  // Celebi
    levelMoves: [
      { level: 1, move: 'leech_seed' },
      { level: 1, move: 'confusion' },
      { level: 1, move: 'recover' },
      { level: 1, move: 'heal_bell' },
      { level: 2, move: 'safeguard' },
      { level: 4, move: 'ancient_power' },
      { level: 6, move: 'future_sight' },
      { level: 8, move: 'baton_pass' },
    ],
    fixedMoves:  ['leech_seed', 'confusion'],
    randomPool:  ['recover', 'heal_bell', 'safeguard', 'ancient_power', 'future_sight', 'baton_pass'],
    randomCount: 6,
    // Skipped (not in DB): Perish Song (not_in_db:perish_song)
  },
};

/* ── Official catch rates (Gen 1-2, 0-255) ──────────────────────── */
const CATCH_RATES = {
  '0001':45,  '0002':45,  '0003':45,  '0004':45,  '0005':45,  '0006':45,
  '0007':45,  '0008':45,  '0009':45,  '0010':255, '0011':120, '0012':45,
  '0013':255, '0014':120, '0015':45,  '0016':255, '0017':120, '0018':45,
  '0019':255, '0020':127, '0021':255, '0022':90,  '0023':200, '0024':90,
  '0025':190, '0026':75,  '0027':255, '0028':90,  '0029':235, '0030':120,
  '0031':45,  '0032':235, '0033':120, '0034':45,  '0035':150, '0036':25,
  '0037':190, '0038':75,  '0039':170, '0040':50,  '0041':255, '0042':90,
  '0043':255, '0044':120, '0045':45,  '0046':190, '0047':75,  '0048':190,
  '0049':75,  '0050':255, '0051':50,  '0052':255, '0053':90,  '0054':190,
  '0055':75,  '0056':190, '0057':75,  '0058':190, '0059':75,  '0060':255,
  '0061':120, '0062':45,  '0063':200, '0064':100, '0065':50,  '0066':180,
  '0067':90,  '0068':45,  '0069':255, '0070':120, '0071':45,  '0072':190,
  '0073':60,  '0074':255, '0075':120, '0076':45,  '0077':190, '0078':60,
  '0079':190, '0080':75,  '0081':190, '0082':60,  '0083':45,  '0084':190,
  '0085':45,  '0086':190, '0087':75,  '0088':190, '0089':75,  '0090':190,
  '0091':60,  '0092':190, '0093':90,  '0094':45,  '0095':45,  '0096':190,
  '0097':75,  '0098':225, '0099':60,  '0100':190, '0101':60,  '0102':90,
  '0103':45,  '0104':190, '0105':75,  '0106':45,  '0107':45,  '0108':45,
  '0109':190, '0110':60,  '0111':120, '0112':60,  '0113':30,  '0114':45,
  '0115':45,  '0116':225, '0117':75,  '0118':225, '0119':60,  '0120':225,
  '0121':60,  '0122':45,  '0123':45,  '0124':45,  '0125':45,  '0126':45,
  '0127':45,  '0128':45,  '0129':255, '0130':45,  '0131':45,  '0132':35,
  '0133':45,  '0134':45,  '0135':45,  '0136':45,  '0137':35,  '0138':45,
  '0139':45,  '0140':45,  '0141':45,  '0142':45,  '0143':25,  '0144':3,
  '0145':3,   '0146':3,   '0147':45,  '0148':45,  '0149':45,  '0150':3,
  '0151':45,
  '0152':45,  '0153':45,  '0154':45,  '0155':45,  '0156':45,  '0157':45,
  '0158':45,  '0159':45,  '0160':45,  '0161':255, '0162':90,  '0163':255,
  '0164':90,  '0165':255, '0166':90,  '0167':255, '0168':90,  '0169':90,
  '0170':190, '0171':75,  '0172':190, '0173':150, '0174':170, '0175':190,
  '0176':75,  '0177':190, '0178':75,  '0179':235, '0180':120, '0181':45,
  '0182':45,  '0183':190, '0184':75,  '0185':65,  '0186':45,  '0187':255,
  '0188':120, '0189':45,  '0190':45,  '0191':235, '0192':120, '0193':75,
  '0194':255, '0195':90,  '0196':45,  '0197':45,  '0198':30,  '0199':70,
  '0200':45,  '0201':225, '0202':45,  '0203':60,  '0204':190, '0205':75,
  '0206':190, '0207':60,  '0208':25,  '0209':190, '0210':75,  '0211':190,
  '0212':25,  '0213':190, '0214':45,  '0215':60,  '0216':100, '0217':60,
  '0218':190, '0219':75,  '0220':225, '0221':75,  '0222':60,  '0223':190,
  '0224':75,  '0225':45,  '0226':25,  '0227':25,  '0228':120, '0229':45,
  '0230':45,  '0231':120, '0232':60,  '0233':35,  '0234':45,  '0235':45,
  '0236':75,  '0237':45,  '0238':45,  '0239':45,  '0240':45,  '0241':45,
  '0242':30,  '0243':3,   '0244':3,   '0245':3,   '0246':45,  '0247':45,
  '0248':45,  '0249':3,   '0250':3,   '0251':45,
};

