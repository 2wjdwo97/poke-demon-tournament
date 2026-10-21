'use strict';
/* ============================================================
   Gen 2 Type Effectiveness Chart
   CHART[attackerType][defenderType] = multiplier
   undefined = 1× (normal)
   ============================================================ */
const TYPE_CHART = {
  Normal:   { Rock:.5, Steel:.5, Ghost:.25 },
  Fire:     { Fire:.5, Water:.5, Rock:.5, Dragon:.5, Grass:2, Ice:2, Bug:2, Steel:2 },
  Water:    { Water:.5, Grass:.5, Dragon:.5, Fire:2, Ground:2, Rock:2 },
  Electric: { Grass:.5, Electric:.5, Dragon:.5, Ground:0.25, Flying:2, Water:2 },
  Grass:    { Fire:.5, Grass:.5, Poison:.5, Flying:.5, Bug:.5, Dragon:.5, Steel:.5, Water:2, Ground:2, Rock:2 },
  Ice:      { Water:.5, Ice:.5, Fire:.5, Steel:.5, Grass:2, Ground:2, Flying:2, Dragon:2 },
  Fighting: { Normal:2, Ice:2, Rock:2, Dark:2, Steel:2, Poison:.5, Bug:.5, Psychic:.5, Flying:.5, Ghost:.25 },
  Poison:   { Grass:2, Poison:.5, Ground:.5, Rock:.5, Ghost:.5, Steel:.25 },
  Ground:   { Fire:2, Electric:2, Poison:2, Rock:2, Steel:2, Grass:.5, Bug:.5, Flying:.25 },
  Flying:   { Grass:2, Fighting:2, Bug:2, Electric:.5, Rock:.5, Steel:.5 },
  Psychic:  { Fighting:2, Poison:2, Psychic:.5, Dark:0, Steel:.5 },
  Bug:      { Grass:2, Psychic:2, Dark:2, Fire:.5, Fighting:.5, Flying:.5, Ghost:.5, Steel:.5 },
  Rock:     { Fire:2, Ice:2, Flying:2, Bug:2, Fighting:.5, Ground:.5, Steel:.5 },
  Ghost:    { Ghost:2, Psychic:2, Normal:.25, Dark:.5, Steel:.5 },
  Dragon:   { Dragon:2, Steel:.5 },
  Dark:     { Ghost:2, Psychic:2, Dark:.5, Fighting:.5, Steel:.5 },
  Steel:    { Ice:2, Rock:2, Steel:.5, Fire:.5, Water:.5, Electric:.5 },
};

function getTypeEff(attackType, defenderTypes) {
  let eff = 1;
  for (const t of defenderTypes) eff *= (TYPE_CHART[attackType]?.[t] ?? 1);
  return eff;
}

const TYPE_COLORS = {
  Normal:'#9a9a7a', Fire:'#f08030', Water:'#6890f0', Electric:'#f8d030',
  Grass:'#78c850', Ice:'#98d8d8', Fighting:'#c03028', Poison:'#a040a0',
  Ground:'#e0c068', Flying:'#a890f0', Psychic:'#f85888', Bug:'#a8b820',
  Rock:'#b8a038', Ghost:'#705898', Dragon:'#7038f8', Dark:'#705848', Steel:'#b8b8d0',
};
