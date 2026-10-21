'use strict';
/* ============================================================
   Move Database
   hit: 9-bit integer bitmask for the 3×3 grid
        bit = (dc+1) + (dr+1)*3
        dc positive = forward (toward enemy)
        bit layout:
          [0][-1,-1] [1][0,-1] [2][1,-1]
          [3][-1, 0] [4][0, 0] [5][1, 0]
          [6][-1, 1] [7][0, 1] [8][1, 1]

   Design rule (after ÷3 power scaling, max level 20):
     Weak  (power 5-15)  → many cells  (6-9) = EN 20-30
     Medium(power 15-25) → some cells  (4-6) = EN 40-60
     Strong(power 25-35) → few cells   (2-3) = EN 60-80
     Elite (power 35-40) → 1-3 cells, directional = EN 80-90
   ============================================================ */

// Named hit patterns (bitmask integers)
const HM_ALL8     = 495; // 8 surrounding cells (no center)
const HM_ALL9     = 511; // all 9 cells
const HM_SIDE_COL = 365; // both side columns (6)
const HM_CROSS    = 170; // cardinal 4
const HM_DIAG4    = 325; // diagonal corners
const HM_SIDE2    = 40;  // left + right
const HM_F3       = 292; // forward column (3)
const HM_F1       = 32;  // directly forward (1)
const HM_PLUS5    = 186; // cross + center
const HM_TOP3C    = 23;  // top row + center
const HM_BOT3C    = 464; // center + bottom row
const HM_TOPROWS  = 63;  // top 6 cells
const HM_BOTROWS  = 504; // bottom 6 cells
const HM_VLINE3   = 146; // vertical center line
const HM_CONLY    = 16;  // center only
const HM_XSHAPE5  = 341; // X shape (4 corners + center)
const HM_TOPBOT6  = 455; // top + bottom rows, no middle
const HM_HLINE3   = 56;  // horizontal center line

const MOVES = {
  // ── Wide AOE — 8 surrounding cells (weak, fully symmetric) ───
  tackle:        { name:'Tackle',        type:'Normal',   cat:'ATTACK', power:20, en:20, hit:HM_ALL8 },
  scratch:       { name:'Scratch',       type:'Normal',   cat:'ATTACK', power:20, en:20, hit:HM_ALL8 },
  gust:          { name:'Gust',          type:'Flying',   cat:'ATTACK', power:20, en:30, hit:HM_ALL8 },
  bubble:        { name:'Bubble',        type:'Water',    cat:'ATTACK', power:10, en:20, hit:HM_PLUS5   },
  poison_sting:  { name:'Poison Sting',  type:'Poison',   cat:'ATTACK', power:10, en:20, hit:HM_PLUS5   },
  rollout:       { name:'Rollout',       type:'Rock',     cat:'ATTACK', power:15, en:20, hit:HM_BOT3C   },
  swift:         { name:'Swift',         type:'Normal',   cat:'ATTACK', power:20, en:20, hit:HM_XSHAPE5 },
  powder_snow:   { name:'Powder Snow',   type:'Ice',      cat:'ATTACK', power:20, en:20, hit:HM_TOPROWS },
  mud_slap:      { name:'Mud Slap',      type:'Ground',   cat:'ATTACK', power:10, en:20, hit:HM_PLUS5   },

  // ── All-9 AOE — 9 cells including self cell (burst, symmetric) ─
  rage:          { name:'Rage',          type:'Normal',   cat:'ATTACK', power:25, en:30, hit:HM_ALL9 },
  earthquake:    { name:'Earthquake',    type:'Ground',   cat:'ATTACK', power:50, en:80, hit:HM_ALL9 },
  explosion:     { name:'Explosion',     type:'Normal',   cat:'ATTACK', power:40, en:70, hit:HM_ALL9 },
  lava_plume:    { name:'Lava Plume',    type:'Fire',     cat:'ATTACK', power:35, en:60, hit:HM_ALL9 },
  discharge:     { name:'Discharge',     type:'Electric', cat:'ATTACK', power:35, en:60, hit:HM_ALL9 },
  petal_blizzard:{ name:'Petal Blizzard',type:'Grass',    cat:'ATTACK', power:35, en:60, hit:HM_ALL9 },

  // ── Both side columns — 6 cells, symmetric ────────────────────
  ember:         { name:'Ember',         type:'Fire',     cat:'ATTACK', power:20, en:30, hit:HM_TOP3C    },
  water_gun:     { name:'Water Gun',     type:'Water',    cat:'ATTACK', power:20, en:30, hit:HM_SIDE_COL },
  vine_whip:     { name:'Vine Whip',     type:'Grass',    cat:'ATTACK', power:25, en:30, hit:HM_SIDE_COL },
  thundershock:  { name:'ThunderShock',  type:'Electric', cat:'ATTACK', power:20, en:30, hit:HM_SIDE_COL },
  night_shade:   { name:'Night Shade',   type:'Ghost',    cat:'ATTACK', power:20, en:30, hit:HM_VLINE3   },
  confusion:     { name:'Confusion',     type:'Psychic',  cat:'ATTACK', power:25, en:40, hit:HM_SIDE_COL },
  rock_throw:    { name:'Rock Throw',    type:'Rock',     cat:'ATTACK', power:25, en:40, hit:HM_SIDE_COL },
  dragon_rage:   { name:'Dragon Rage',   type:'Dragon',   cat:'ATTACK', power:30, en:40, hit:HM_SIDE_COL },
  fire_spin:     { name:'Fire Spin',     type:'Fire',     cat:'ATTACK', power:20, en:30, hit:HM_SIDE_COL },
  razor_leaf:    { name:'Razor Leaf',    type:'Grass',    cat:'ATTACK', power:30, en:40, hit:HM_SIDE_COL },
  dragon_breath: { name:'DragonBreath',  type:'Dragon',   cat:'ATTACK', power:30, en:40, hit:HM_SIDE_COL },
  acid:          { name:'Acid',          type:'Poison',   cat:'ATTACK', power:20, en:30, hit:HM_TOPBOT6  },
  bubble_beam:   { name:'Bubble Beam',   type:'Water',    cat:'ATTACK', power:30, en:40, hit:HM_SIDE_COL },

  // ── Cross — 4 cardinal cells, symmetric ───────────────────────
  karate_chop:   { name:'Karate Chop',   type:'Fighting', cat:'ATTACK', power:25, en:40, hit:HM_CROSS },
  low_kick:      { name:'Low Kick',      type:'Fighting', cat:'ATTACK', power:25, en:40, hit:HM_CROSS },
  psybeam:       { name:'Psybeam',       type:'Psychic',  cat:'ATTACK', power:35, en:40, hit:HM_CROSS },
  ice_punch:     { name:'Ice Punch',     type:'Ice',      cat:'ATTACK', power:40, en:60, hit:HM_CROSS },
  surf:          { name:'Surf',          type:'Water',    cat:'ATTACK', power:45, en:70, hit:HM_CROSS },
  stomp:         { name:'Stomp',         type:'Normal',   cat:'ATTACK', power:30, en:40, hit:HM_CROSS },
  strength:      { name:'Strength',      type:'Normal',   cat:'ATTACK', power:35, en:50, hit:HM_CROSS },

  // ── Diagonal corners — 4 cells, symmetric ─────────────────────
  bite:          { name:'Bite',          type:'Dark',     cat:'ATTACK', power:30, en:40, hit:HM_DIAG4 },
  wing_attack:   { name:'Wing Attack',   type:'Flying',   cat:'ATTACK', power:30, en:40, hit:HM_DIAG4 },
  rock_blast:    { name:'Rock Blast',    type:'Rock',     cat:'ATTACK', power:35, en:50, hit:HM_DIAG4 },
  flame_wheel:   { name:'Flame Wheel',   type:'Fire',     cat:'ATTACK', power:30, en:40, hit:HM_DIAG4 },
  sludge_bomb:   { name:'Sludge Bomb',   type:'Poison',   cat:'ATTACK', power:40, en:60, hit:HM_DIAG4 },
  iron_tail:     { name:'Iron Tail',     type:'Steel',    cat:'ATTACK', power:40, en:60, hit:HM_DIAG4 },
  aurora_beam:   { name:'Aurora Beam',   type:'Ice',      cat:'ATTACK', power:30, en:40, hit:HM_DIAG4 },

  // ── Left+Right — 2 cells, symmetric (strong, close contact) ───
  slash:         { name:'Slash',         type:'Normal',   cat:'ATTACK', power:35, en:40, hit:HM_SIDE2 },
  slam:          { name:'Slam',          type:'Normal',   cat:'ATTACK', power:40, en:50, hit:HM_SIDE2 },
  hyper_fang:    { name:'Hyper Fang',    type:'Normal',   cat:'ATTACK', power:40, en:50, hit:HM_SIDE2 },
  body_slam:     { name:'Body Slam',     type:'Normal',   cat:'ATTACK', power:45, en:60, hit:HM_SIDE2 },
  crunch:        { name:'Crunch',        type:'Dark',     cat:'ATTACK', power:40, en:50, hit:HM_SIDE2 },
  close_combat:  { name:'Close Combat',  type:'Fighting', cat:'ATTACK', power:45, en:70, hit:HM_SIDE2 },
  megahorn:      { name:'Megahorn',      type:'Bug',      cat:'ATTACK', power:45, en:60, hit:HM_SIDE2 },

  // ── Forward column — 3 cells (directional, need to face enemy) ─
  flamethrower:  { name:'Flamethrower',  type:'Fire',     cat:'ATTACK', power:45, en:70, hit:HM_F3 },
  thunderbolt:   { name:'Thunderbolt',   type:'Electric', cat:'ATTACK', power:45, en:70, hit:HM_F3 },
  shadow_ball:   { name:'Shadow Ball',   type:'Ghost',    cat:'ATTACK', power:40, en:60, hit:HM_F3 },
  psychic_move:  { name:'Psychic',       type:'Psychic',  cat:'ATTACK', power:45, en:70, hit:HM_F3 },
  blizzard:      { name:'Blizzard',      type:'Ice',      cat:'ATTACK', power:55, en:90, hit:HM_F3 },
  thunder:       { name:'Thunder',       type:'Electric', cat:'ATTACK', power:55, en:90, hit:HM_F3 },
  hyper_beam:    { name:'Hyper Beam',    type:'Normal',   cat:'ATTACK', power:55, en:90, hit:HM_F3 },

  // ── Single forward — 1 cell (max precision required) ──────────
  solar_beam:    { name:'Solar Beam',    type:'Grass',    cat:'ATTACK', power:60, en:90, hit:HM_F1 },
  zap_cannon:    { name:'Zap Cannon',    type:'Electric', cat:'ATTACK', power:60, en:90, hit:HM_F1 },
  fire_blast:    { name:'Fire Blast',    type:'Fire',     cat:'ATTACK', power:55, en:80, hit:HM_F1 },

  // ── Status — GUARD ────────────────────────────────────────────
  growl:         { name:'Growl',         type:'Normal',   cat:'GUARD',  power:0, en:20, guardAmt:15 },
  tail_whip:     { name:'Tail Whip',     type:'Normal',   cat:'GUARD',  power:0, en:20, guardAmt:15 },
  leer:          { name:'Leer',          type:'Normal',   cat:'GUARD',  power:0, en:20, guardAmt:15 },
  sand_attack:   { name:'Sand Attack',   type:'Ground',   cat:'GUARD',  power:0, en:20, guardAmt:20 },
  defense_curl:  { name:'Defense Curl',  type:'Normal',   cat:'GUARD',  power:0, en:10, guardAmt:20 },
  harden:        { name:'Harden',        type:'Normal',   cat:'GUARD',  power:0, en:10, guardAmt:20 },
  smokescreen:   { name:'Smokescreen',   type:'Normal',   cat:'GUARD',  power:0, en:20, guardAmt:20 },
  string_shot:   { name:'String Shot',   type:'Bug',      cat:'GUARD',  power:0, en:20, guardAmt:15 },
  sleep_powder:  { name:'Sleep Powder',  type:'Grass',    cat:'GUARD',  power:0, en:40, guardAmt:30 },
  poison_powder: { name:'PoisonPowder',  type:'Poison',   cat:'GUARD',  power:0, en:40, guardAmt:20 },
  reflect:       { name:'Reflect',       type:'Psychic',  cat:'GUARD',  power:0, en:30, guardAmt:35 },
  light_screen:  { name:'Light Screen',  type:'Psychic',  cat:'GUARD',  power:0, en:30, guardAmt:35 },

  // ── Status — HEAL ─────────────────────────────────────────────
  recover:       { name:'Recover',       type:'Normal',   cat:'HEAL',   power:0, en:40, healAmt:50 },
  leech_seed:    { name:'Leech Seed',    type:'Grass',    cat:'HEAL',   power:0, en:40, healAmt:25 },
  synthesis:     { name:'Synthesis',     type:'Grass',    cat:'HEAL',   power:0, en:40, healAmt:50 },
  leech_life:    { name:'Leech Life',    type:'Bug',      cat:'HEAL',   power:0, en:30, healAmt:20 },
  meditate:      { name:'Meditate',      type:'Psychic',  cat:'HEAL',   power:0, en:0,  enHealPct:35 },
  refresh:       { name:'Refresh',       type:'Normal',   cat:'HEAL',   power:0, en:0,  enHealPct:25 },

  // ── Gyarados / 신규 기술 ─────────────────────────────────────
  thrash:        { name:'Thrash',        type:'Normal',  cat:'ATTACK', power:30, en:50, hit:HM_SIDE2   },  // 90÷3=30, frenzied side sweep
  twister:       { name:'Twister',       type:'Dragon',  cat:'ATTACK', power:15, en:25, hit:HM_ALL8    },  // 40÷3≈13→15, spinning wide blast
  hydro_pump:    { name:'Hydro Pump',    type:'Water',   cat:'ATTACK', power:40, en:80, hit:HM_F3      },  // 120÷3=40, powerful directional blast
  rain_dance:    { name:'Rain Dance',    type:'Water',   cat:'GUARD',  power:0,  en:30, guardAmt:25  },  // defensive water veil

  // ── cycle-015 신규 기술 ────────────────────────────────────────
  peck:          { name:'Peck',          type:'Flying',  cat:'ATTACK', power:30, en:40, hit:HM_CONLY   },
  fury_swipes:   { name:'Fury Swipes',   type:'Normal',  cat:'ATTACK', power:20, en:30, hit:HM_XSHAPE5 },
  water_pulse:   { name:'Water Pulse',   type:'Water',   cat:'ATTACK', power:35, en:50, hit:HM_VLINE3  },
  rock_slide:    { name:'Rock Slide',    type:'Rock',    cat:'ATTACK', power:30, en:40, hit:HM_TOPBOT6 },
  sand_tomb:     { name:'Sand Tomb',     type:'Ground',  cat:'ATTACK', power:20, en:30, hit:HM_BOTROWS },
  icy_wind:      { name:'Icy Wind',      type:'Ice',     cat:'ATTACK', power:25, en:30, hit:HM_TOPROWS },

  // ── Gen II learnset additions ─────────────────────────────────

  // Status → GUARD (lowers incoming damage / debuffs / status)
  sweet_scent:   { name:'Sweet Scent',   type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:20 },
  confuse_ray:   { name:'Confuse Ray',   type:'Ghost',    cat:'GUARD', power:0, en:30, guardAmt:25 },
  supersonic:    { name:'Supersonic',    type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:20 },
  haze:          { name:'Haze',          type:'Ice',      cat:'GUARD', power:0, en:20, guardAmt:15 },
  whirlwind:     { name:'Whirlwind',     type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:15 },
  teleport:      { name:'Teleport',      type:'Psychic',  cat:'MOVE',  power:0, en:0,  steps:2, direction:'TELEPORT', hit:0 },
  agility:       { name:'Agility',       type:'Psychic',  cat:'GUARD', power:0, en:30, guardAmt:30 },
  roar:          { name:'Roar',          type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:15 },
  scary_face:    { name:'Scary Face',    type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:25 },
  disable:       { name:'Disable',       type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:20 },
  encore:        { name:'Encore',        type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:15 },
  safeguard:     { name:'Safeguard',     type:'Normal',   cat:'GUARD', power:0, en:30, guardAmt:35 },
  mean_look:     { name:'Mean Look',     type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:15 },
  screech:       { name:'Screech',       type:'Normal',   cat:'GUARD', power:0, en:25, guardAmt:30 },
  minimize:      { name:'Minimize',      type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:20 },
  withdraw:      { name:'Withdraw',      type:'Water',    cat:'GUARD', power:0, en:20, guardAmt:25 },
  barrier:       { name:'Barrier',       type:'Psychic',  cat:'GUARD', power:0, en:30, guardAmt:35 },
  acid_armor:    { name:'Acid Armor',    type:'Poison',   cat:'GUARD', power:0, en:30, guardAmt:35 },
  amnesia:       { name:'Amnesia',       type:'Psychic',  cat:'GUARD', power:0, en:30, guardAmt:35 },
  growth:        { name:'Growth',        type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:20 },
  mist:          { name:'Mist',          type:'Ice',      cat:'GUARD', power:0, en:20, guardAmt:20 },
  swords_dance:  { name:'Swords Dance',  type:'Normal',   cat:'GUARD', power:0, en:30, guardAmt:30 },
  protect:       { name:'Protect',       type:'Normal',   cat:'GUARD', power:0, en:30, guardAmt:40 },
  endure:        { name:'Endure',        type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:30 },
  swagger:       { name:'Swagger',       type:'Normal',   cat:'GUARD', power:0, en:25, guardAmt:20 },
  thunder_wave:  { name:'Thunder Wave',  type:'Electric', cat:'GUARD', power:0, en:30, guardAmt:30 },
  stun_spore:    { name:'Stun Spore',    type:'Grass',    cat:'GUARD', power:0, en:30, guardAmt:30 },
  cotton_spore:  { name:'Cotton Spore',  type:'Grass',    cat:'GUARD', power:0, en:25, guardAmt:25 },
  poison_gas:    { name:'Poison Gas',    type:'Poison',   cat:'GUARD', power:0, en:20, guardAmt:20 },
  glare:         { name:'Glare',         type:'Normal',   cat:'GUARD', power:0, en:25, guardAmt:30 },
  spore:         { name:'Spore',         type:'Grass',    cat:'GUARD', power:0, en:40, guardAmt:40 },
  hypnosis:      { name:'Hypnosis',      type:'Psychic',  cat:'GUARD', power:0, en:30, guardAmt:30 },
  sing:          { name:'Sing',          type:'Normal',   cat:'GUARD', power:0, en:25, guardAmt:25 },
  charm:         { name:'Charm',         type:'Normal',   cat:'GUARD', power:0, en:25, guardAmt:30 },
  lovely_kiss:   { name:'Lovely Kiss',   type:'Normal',   cat:'GUARD', power:0, en:30, guardAmt:30 },
  sweet_kiss:    { name:'Sweet Kiss',    type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:20 },
  belly_drum:    { name:'Belly Drum',    type:'Normal',   cat:'GUARD', power:0, en:30, guardAmt:20 },
  focus_energy:  { name:'Focus Energy',  type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:20 },
  double_team:   { name:'Double Team',   type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:25 },
  sunny_day:     { name:'Sunny Day',     type:'Fire',     cat:'GUARD', power:0, en:20, guardAmt:20 },
  spider_web:    { name:'Spider Web',    type:'Bug',      cat:'GUARD', power:0, en:20, guardAmt:15 },
  kinesis:       { name:'Kinesis',       type:'Psychic',  cat:'GUARD', power:0, en:20, guardAmt:20 },
  sharpen:       { name:'Sharpen',       type:'Normal',   cat:'GUARD', power:0, en:15, guardAmt:20 },
  sandstorm:     { name:'Sandstorm',     type:'Rock',     cat:'GUARD', power:0, en:20, guardAmt:20 },
  foresight:     { name:'Foresight',     type:'Normal',   cat:'GUARD', power:0, en:15, guardAmt:15 },
  detect:        { name:'Detect',        type:'Fighting', cat:'GUARD', power:0, en:30, guardAmt:40 },
  baton_pass:    { name:'Baton Pass',    type:'Normal',   cat:'GUARD', power:0, en:20, guardAmt:20 },

  // Status → HEAL
  rest:          { name:'Rest',          type:'Psychic',  cat:'HEAL',  power:0, en:50, healAmt:60 },
  moonlight:     { name:'Moonlight',     type:'Normal',   cat:'HEAL',  power:0, en:40, healAmt:50 },
  morning_sun:   { name:'Morning Sun',   type:'Normal',   cat:'HEAL',  power:0, en:40, healAmt:50 },
  milk_drink:    { name:'Milk Drink',    type:'Normal',   cat:'HEAL',  power:0, en:40, healAmt:50 },
  softboiled:    { name:'Softboiled',    type:'Normal',   cat:'HEAL',  power:0, en:40, healAmt:50 },
  heal_bell:     { name:'Heal Bell',     type:'Normal',   cat:'HEAL',  power:0, en:30, healAmt:25 },

  // Offensive — Normal
  pound:         { name:'Pound',         type:'Normal',   cat:'ATTACK', power:15, en:20, hit:HM_ALL8    },
  doubleslap:    { name:'DoubleSlap',    type:'Normal',   cat:'ATTACK', power:10, en:20, hit:HM_ALL8    },
  fury_attack:   { name:'Fury Attack',   type:'Normal',   cat:'ATTACK', power:10, en:20, hit:HM_ALL8    },
  comet_punch:   { name:'Comet Punch',   type:'Normal',   cat:'ATTACK', power:10, en:20, hit:HM_ALL8    },
  mega_punch:    { name:'Mega Punch',    type:'Normal',   cat:'ATTACK', power:30, en:60, hit:HM_F1      },
  mega_kick:     { name:'Mega Kick',     type:'Normal',   cat:'ATTACK', power:40, en:80, hit:HM_F1      },
  vicegrip:      { name:'ViceGrip',      type:'Normal',   cat:'ATTACK', power:20, en:30, hit:HM_SIDE2   },
  skull_bash:    { name:'Skull Bash',    type:'Normal',   cat:'ATTACK', power:40, en:80, hit:HM_F1      },
  take_down:     { name:'Take Down',     type:'Normal',   cat:'ATTACK', power:30, en:50, hit:HM_CROSS   },
  double_edge:   { name:'Double-Edge',   type:'Normal',   cat:'ATTACK', power:40, en:70, hit:HM_ALL8    },
  headbutt:      { name:'Headbutt',      type:'Normal',   cat:'ATTACK', power:25, en:40, hit:HM_F3      },
  horn_attack:   { name:'Horn Attack',   type:'Normal',   cat:'ATTACK', power:20, en:35, hit:HM_F3      },
  pay_day:       { name:'Pay Day',       type:'Normal',   cat:'ATTACK', power:15, en:30, hit:HM_F1      },
  rapid_spin:    { name:'Rapid Spin',    type:'Normal',   cat:'ATTACK', power:10, en:20, hit:HM_ALL8    },
  snore:         { name:'Snore',         type:'Normal',   cat:'ATTACK', power:15, en:20, hit:HM_ALL8    },
  egg_bomb:      { name:'Egg Bomb',      type:'Normal',   cat:'ATTACK', power:35, en:70, hit:HM_F1      },
  tri_attack:    { name:'Tri Attack',    type:'Normal',   cat:'ATTACK', power:30, en:60, hit:HM_F3      },
  flail:         { name:'Flail',         type:'Normal',   cat:'ATTACK', power:20, en:30, hit:HM_ALL8    },
  dizzy_punch:   { name:'Dizzy Punch',   type:'Normal',   cat:'ATTACK', power:25, en:50, hit:HM_F1      },
  false_swipe:   { name:'False Swipe',   type:'Normal',   cat:'ATTACK', power:15, en:20, hit:HM_F1      },
  wrap:          { name:'Wrap',          type:'Normal',   cat:'ATTACK', power:10, en:20, hit:HM_VLINE3  },
  bind:          { name:'Bind',          type:'Normal',   cat:'ATTACK', power:10, en:20, hit:HM_VLINE3  },
  constrict:     { name:'Constrict',     type:'Normal',   cat:'ATTACK', power:10, en:15, hit:HM_VLINE3  },
  sonicboom:     { name:'SonicBoom',     type:'Normal',   cat:'ATTACK', power:20, en:30, hit:HM_SIDE_COL },
  hidden_power:  { name:'Hidden Power',  type:'Normal',   cat:'ATTACK', power:20, en:40, hit:HM_CROSS   },
  spike_cannon:  { name:'Spike Cannon',  type:'Normal',   cat:'ATTACK', power:25, en:40, hit:HM_F3      },

  // Offensive — Fighting
  double_kick:   { name:'Double Kick',   type:'Fighting', cat:'ATTACK', power:10, en:20, hit:HM_CROSS   },
  seismic_toss:  { name:'Seismic Toss',  type:'Fighting', cat:'ATTACK', power:20, en:40, hit:HM_CROSS   },
  cross_chop:    { name:'Cross Chop',    type:'Fighting', cat:'ATTACK', power:35, en:60, hit:HM_SIDE2   },
  vital_throw:   { name:'Vital Throw',   type:'Fighting', cat:'ATTACK', power:25, en:40, hit:HM_CROSS   },
  submission:    { name:'Submission',    type:'Fighting', cat:'ATTACK', power:30, en:50, hit:HM_CROSS   },
  rolling_kick:  { name:'Rolling Kick',  type:'Fighting', cat:'ATTACK', power:20, en:40, hit:HM_CROSS   },
  jump_kick:     { name:'Jump Kick',     type:'Fighting', cat:'ATTACK', power:25, en:50, hit:HM_F3      },
  hi_jump_kick:  { name:'Hi Jump Kick',  type:'Fighting', cat:'ATTACK', power:30, en:60, hit:HM_F3      },
  triple_kick:   { name:'Triple Kick',   type:'Fighting', cat:'ATTACK', power:15, en:30, hit:HM_F3      },
  mach_punch:    { name:'Mach Punch',    type:'Fighting', cat:'ATTACK', power:15, en:30, hit:HM_F1      },
  reversal:      { name:'Reversal',      type:'Fighting', cat:'ATTACK', power:20, en:30, hit:HM_CROSS   },

  // Offensive — Water
  crabhammer:    { name:'Crabhammer',    type:'Water',    cat:'ATTACK', power:35, en:70, hit:HM_F1      },
  waterfall:     { name:'Waterfall',     type:'Water',    cat:'ATTACK', power:30, en:50, hit:HM_F3      },
  octazooka:     { name:'Octazooka',     type:'Water',    cat:'ATTACK', power:20, en:50, hit:HM_F3      },
  clamp:         { name:'Clamp',         type:'Water',    cat:'ATTACK', power:15, en:30, hit:HM_SIDE2   },

  // Offensive — Ground
  bone_club:     { name:'Bone Club',     type:'Ground',   cat:'ATTACK', power:20, en:40, hit:HM_F3      },
  bonemerang:    { name:'Bonemerang',    type:'Ground',   cat:'ATTACK', power:30, en:50, hit:HM_CROSS   },
  bone_rush:     { name:'Bone Rush',     type:'Ground',   cat:'ATTACK', power:30, en:50, hit:HM_F3      },
  magnitude:     { name:'Magnitude',     type:'Ground',   cat:'ATTACK', power:25, en:50, hit:HM_ALL9    },
  dig:           { name:'Dig',           type:'Ground',   cat:'ATTACK', power:20, en:50, hit:HM_CONLY   },

  // Offensive — Rock
  ancient_power: { name:'AncientPower',  type:'Rock',     cat:'ATTACK', power:20, en:50, hit:HM_CONLY   },

  // Offensive — Dark / Ghost
  faint_attack:  { name:'Faint Attack',  type:'Dark',     cat:'ATTACK', power:20, en:40, hit:HM_DIAG4   },
  pursuit:       { name:'Pursuit',       type:'Dark',     cat:'ATTACK', power:15, en:20, hit:HM_F1      },
  beat_up:       { name:'Beat Up',       type:'Dark',     cat:'ATTACK', power:20, en:40, hit:HM_ALL8    },
  lick:          { name:'Lick',          type:'Ghost',    cat:'ATTACK', power:10, en:20, hit:HM_F1      },
  smog:          { name:'Smog',          type:'Poison',   cat:'ATTACK', power:10, en:20, hit:HM_PLUS5   },
  sludge:        { name:'Sludge',        type:'Poison',   cat:'ATTACK', power:20, en:40, hit:HM_SIDE_COL },
  spite:         { name:'Spite',         type:'Ghost',    cat:'ATTACK', power:15, en:25, hit:HM_CONLY   },

  // Offensive — Bug
  twineedle:     { name:'Twineedle',     type:'Bug',      cat:'ATTACK', power:15, en:30, hit:HM_F3      },
  pin_missile:   { name:'Pin Missile',   type:'Bug',      cat:'ATTACK', power:20, en:30, hit:HM_ALL8    },

  // Offensive — Flying
  drill_peck:    { name:'Drill Peck',    type:'Flying',   cat:'ATTACK', power:30, en:60, hit:HM_F1      },
  sky_attack:    { name:'Sky Attack',    type:'Flying',   cat:'ATTACK', power:45, en:90, hit:HM_F1      },
  aeroblast:     { name:'Aeroblast',     type:'Flying',   cat:'ATTACK', power:35, en:80, hit:HM_F1      },

  // Offensive — Dragon
  outrage:       { name:'Outrage',       type:'Dragon',   cat:'ATTACK', power:30, en:60, hit:HM_ALL8    },

  // Offensive — Grass
  petal_dance:   { name:'Petal Dance',   type:'Grass',    cat:'ATTACK', power:25, en:50, hit:HM_ALL8    },
  absorb:        { name:'Absorb',        type:'Grass',    cat:'ATTACK', power:10, en:20, hit:HM_SIDE_COL },
  mega_drain:    { name:'Mega Drain',    type:'Grass',    cat:'ATTACK', power:15, en:30, hit:HM_SIDE_COL },
  giga_drain:    { name:'Giga Drain',    type:'Grass',    cat:'ATTACK', power:20, en:50, hit:HM_SIDE_COL },

  // Offensive — Psychic
  future_sight:  { name:'Future Sight',  type:'Psychic',  cat:'ATTACK', power:40, en:80, hit:HM_F1      },
  psywave:       { name:'Psywave',       type:'Psychic',  cat:'ATTACK', power:20, en:30, hit:HM_VLINE3  },
  dream_eater:   { name:'Dream Eater',   type:'Psychic',  cat:'ATTACK', power:35, en:60, hit:HM_F3      },

  // Offensive — Electric
  thunderpunch:  { name:'ThunderPunch',  type:'Electric', cat:'ATTACK', power:25, en:50, hit:HM_CROSS   },
  spark:         { name:'Spark',         type:'Electric', cat:'ATTACK', power:20, en:40, hit:HM_CROSS   },

  // Offensive — Fire
  fire_punch:    { name:'Fire Punch',    type:'Fire',     cat:'ATTACK', power:25, en:50, hit:HM_CROSS   },
  sacred_fire:   { name:'Sacred Fire',   type:'Fire',     cat:'ATTACK', power:35, en:80, hit:HM_F3      },

  // Offensive — Steel
  metal_claw:    { name:'Metal Claw',    type:'Steel',    cat:'ATTACK', power:20, en:30, hit:HM_CROSS   },
  steel_wing:    { name:'Steel Wing',    type:'Steel',    cat:'ATTACK', power:25, en:50, hit:HM_DIAG4   },

  // ── Move (no EN cost) ─────────────────────────────────────────
  quick_attack:  { name:'Quick Attack',  type:'Normal', cat:'MOVE', power:0, en:0, steps:2, direction:'AUTO'  },
  move_up:       { name:'Move Up',       type:'Normal', cat:'MOVE', power:0, en:0, steps:1, direction:'UP'    },
  move_down:     { name:'Move Down',     type:'Normal', cat:'MOVE', power:0, en:0, steps:1, direction:'DOWN'  },
  move_left:     { name:'Move Left',     type:'Normal', cat:'MOVE', power:0, en:0, steps:1, direction:'LEFT'  },
  move_right:    { name:'Move Right',    type:'Normal', cat:'MOVE', power:0, en:0, steps:1, direction:'RIGHT' },
  dash:          { name:'Dash',          type:'Normal', cat:'MOVE', power:0, en:0, steps:1, direction:'AUTO'  },
};
