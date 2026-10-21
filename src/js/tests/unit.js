// src/js/tests/unit.js
// Node.js 실행: node src/js/tests/unit.js
// 브라우저 API 없이 순수 함수만 테스트

'use strict';

// ── 게임 로직 인라인 (types.js 없이 단순화) ───────────────────

// 타입 상성: 단위 테스트용 — Normal vs Normal = 1.0
function getTypeEffTest(moveType, defTypes) {
  // 실제 타입 상성표 없이 1.0 반환 (Normal 기준 테스트)
  return 1.0;
}

function calcDamage(card, attackerPoke, defenderPoke) {
  if (!card.power) return 0;
  const rawEff  = getTypeEffTest(card.moveType, defenderPoke.types);
  const typeEff = rawEff === 0   ? 0
                : rawEff <= 0.25 ? 0.66
                : rawEff <= 0.5  ? 0.75
                : rawEff <= 1    ? 1
                : rawEff <= 2    ? 1.5
                : 2;
  return Math.min(100, Math.max(1, Math.round(card.power * typeEff)));
}

function isHit(attackerPos, defenderPos, card, isPlayerAttacking = true) {
  const rawDCol = defenderPos.col - attackerPos.col;
  const rawDRow = defenderPos.row - attackerPos.row;
  const fwd = isPlayerAttacking ? 1 : -1;
  const relDCol = rawDCol * fwd;
  return (card.hit || []).some(([dc, dr]) => dc === relDCol && dr === rawDRow);
}

// resolveCard ATTACK 시뮬레이션 (HP 단위 수정 적용)
function simulateAttackDamage(card, ownerPoke, targetPoke, targetDmBefore) {
  const dmgHp  = calcDamage(card, ownerPoke, targetPoke);
  const dmgPct = (dmgHp / (targetPoke.maxHp || 1)) * 100;
  const dmAfter = Math.max(0, targetDmBefore - dmgPct);
  return { dmgHp, dmgPct, dmAfter };
}

// ── 테스트 유틸 ────────────────────────────────────────────────
let passed = 0, failed = 0;

function assert(desc, condition) {
  if (condition) {
    console.log(`  PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  FAIL: ${desc}`);
    failed++;
  }
}

function assertClose(desc, actual, expected, tolerance = 0.001) {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    console.log(`  PASS: ${desc} (got ${actual})`);
    passed++;
  } else {
    console.error(`  FAIL: ${desc} — expected ${expected}, got ${actual}`);
    failed++;
  }
}

// ── Test 1: calcDamage — HP 단위 반환 확인 ────────────────────
console.log('\n[Test 1] calcDamage — power=20, typeEff=1.0');
const card20 = { power: 20, moveType: 'Normal', hit: [] };
const attacker = { types: ['Normal'] };
const defender40 = { types: ['Normal'], maxHp: 40 };

const dmgHp = calcDamage(card20, attacker, defender40);
assert('calcDamage(power=20, typeEff=1.0) === 20 (HP 단위)', dmgHp === 20);

// ── Test 2: 데미지 적용 — dm% 변환 확인 ───────────────────────
console.log('\n[Test 2] 데미지 적용 — maxHp=40에서 power=20 공격');
const result = simulateAttackDamage(card20, attacker, defender40, 100);
assertClose('dmgHp === 20', result.dmgHp, 20);
assertClose('dmgPct === 50% (20/40*100)', result.dmgPct, 50);
assertClose('dm 100% → 50% (100 - 50)', result.dmAfter, 50);

// 검증: 이전 버그(dm에서 20 직접 빼기)와 비교
const buggyDmAfter = Math.max(0, 100 - 20); // 이전 방식: 80%
assert('수정 후(50%)가 이전 버그(80%)와 다름', result.dmAfter !== buggyDmAfter);

// ── Test 3: power=0 카드는 dmg=0 ──────────────────────────────
console.log('\n[Test 3] power=0 카드 (MOVE/HEAL)');
const moveCard = { power: 0, moveType: 'Normal', hit: [] };
assert('calcDamage(power=0) === 0', calcDamage(moveCard, attacker, defender40) === 0);

// ── Test 4: isHit — 명중/빗나감 ───────────────────────────────
console.log('\n[Test 4] isHit — 명중/빗나감');
// _F1 패턴: [[1, 0]] — 전방 1칸
const hitCardF1 = { hit: [[1, 0]] };
// 플레이어(col=0, row=1) → AI(col=1, row=1): rawDCol=1, fwd=1, relDCol=1 → 명중
assert('플레이어 정면 1칸 명중', isHit({ col: 0, row: 1 }, { col: 1, row: 1 }, hitCardF1, true));
// 플레이어(col=0, row=1) → AI(col=3, row=1): rawDCol=3, relDCol=3 → [[1,0]] 없음 → 빗나감
assert('플레이어 3칸 거리 빗나감', !isHit({ col: 0, row: 1 }, { col: 3, row: 1 }, hitCardF1, true));
// AI(col=4, row=1) → 플레이어(col=3, row=1): rawDCol=-1, fwd=-1, relDCol=1 → 명중
assert('AI 정면 1칸 명중', isHit({ col: 4, row: 1 }, { col: 3, row: 1 }, hitCardF1, false));
// AI(col=4, row=1) → 플레이어(col=0, row=1): rawDCol=-4, relDCol=4 → 빗나감
assert('AI 4칸 거리 빗나감', !isHit({ col: 4, row: 1 }, { col: 0, row: 1 }, hitCardF1, false));

// _ALL8 패턴 유사: 주변 8칸
const hitCardAll8 = { hit: [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] };
assert('전방 우측 하단(1,1) 명중', isHit({ col: 0, row: 0 }, { col: 1, row: 1 }, hitCardAll8, true));
assert('빈 hit 배열 → 빗나감', !isHit({ col: 0, row: 1 }, { col: 1, row: 1 }, { hit: [] }, true));

// ── Test 5: calcDamage 경계값 ──────────────────────────────────
console.log('\n[Test 5] calcDamage 경계값');
const card100 = { power: 100, moveType: 'Normal', hit: [] };
assert('power=100 → 100 (최대 100)', calcDamage(card100, attacker, defender40) === 100);
const card1 = { power: 1, moveType: 'Normal', hit: [] };
assert('power=1 → 1 (최소 1)', calcDamage(card1, attacker, defender40) === 1);

// ── Test 6: maxHp 다른 포켓몬 ─────────────────────────────────
console.log('\n[Test 6] maxHp=100 포켓몬에 power=20 공격');
const defender100 = { types: ['Normal'], maxHp: 100 };
const result100 = simulateAttackDamage(card20, attacker, defender100, 100);
assertClose('dmgHp === 20 (HP 단위 동일)', result100.dmgHp, 20);
assertClose('dmgPct === 20% (20/100*100)', result100.dmgPct, 20);
assertClose('dm 100% → 80%', result100.dmAfter, 80);

// ── Test 7: 맵 생성 100회 — 연결성 검증 ──────────────────────
console.log('\n[Test 7] 맵 생성 100회 연결성 검증');
{
  const MAP_W2 = 7, MAP_H2 = 5;
  function key2(x, y) { return `${x},${y}`; }
  function neighbors2(x, y) {
    return [[x,y-1],[x,y+1],[x-1,y],[x+1,y]].filter(
      ([nx,ny]) => nx>=0 && nx<MAP_W2 && ny>=0 && ny<MAP_H2
    );
  }
  const dirDelta2 = {n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]};

  let generateFloor2 = null;
  try {
    const fs = require('fs');
    const path = require('path');
    const mapSrc = fs.readFileSync(
      path.join(__dirname, '../map.js'), 'utf8'
    );
    // map.js는 'use strict' + global function 선언이므로 eval로 generateFloor 추출
    const mod = { exports: {} };
    // eslint-disable-next-line no-eval
    eval(`(function(module, exports) { ${mapSrc}\n module.exports = { generateFloor }; })(mod, mod.exports)`);
    generateFloor2 = mod.exports.generateFloor;
  } catch(e) {
    console.error('  map.js 로드 실패:', e.message);
    failed++;
  }

  if (generateFloor2) {
    let allOk = true;
    for (let i = 0; i < 100; i++) {
      const floor = generateFloor2(1);
      const { rooms } = floor;
      const startKey = key2(3, 1); // entry는 항상 (3, 1)
      // BFS로 도달 가능한 방 탐색
      const reached = new Set([startKey]);
      const bq = [startKey];
      while (bq.length) {
        const cur = bq.shift();
        const r = rooms[cur];
        if (!r) continue;
        for (const [dir, [ddx, ddy]] of Object.entries(dirDelta2)) {
          if (!r.doors[dir]) continue;
          const nk = key2(r.x + ddx, r.y + ddy);
          if (rooms[nk] && !reached.has(nk)) { reached.add(nk); bq.push(nk); }
        }
      }
      const isolated = Object.keys(rooms).filter(k => !reached.has(k));
      if (isolated.length > 0) {
        console.error(`  FAIL: 생성 ${i+1}회차에서 고립 방 발생: ${isolated.join(', ')}`);
        allOk = false;
        failed++;
        break;
      }
    }
    if (allOk) {
      console.log('  PASS: 100회 생성 모두 연결성 OK (고립 방 없음)');
      passed++;
    }
  }
}

// ── 결과 ────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`결과: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\nSOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\nALL TESTS PASSED');
}
