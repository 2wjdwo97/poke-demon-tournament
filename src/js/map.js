'use strict';
/* ============================================================
   Map Generator — Isaac-style minimap
   Generates a floor as a 2D grid of rooms connected by doors.

   Room types:
     entry    — starting room (1 per floor)
     grass    — wild encounter (4-6 per floor)
     treasure — free item (1 per floor)
     shop     — buy items (1 per floor)
     center   — heal all Pokémon (1 per floor)
     boss     — floor boss (1 per floor, farthest from entry)

   Grid: 7×5 cells. Rooms placed by random walk then branch.
   ============================================================ */

const MAP_W = 7;
const MAP_H = 5;

const ROOM_COUNTS = {
  grass:    { min: 4, max: 6 },
  treasure: { exact: 1 },
  shop:     { exact: 1 },
  center:   { exact: 1 },
  boss:     { exact: 1 },
};

function rnd(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function key(x, y) { return `${x},${y}`; }
function neighbors(x, y) {
  return [[x,y-1],[x,y+1],[x-1,y],[x+1,y]].filter(
    ([nx,ny]) => nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H
  );
}

function generateFloor(floorNum) {
  const rooms = {};    // key → { x, y, type, visited, cleared, doors:{n,s,e,w} }
  const grid = Array.from({length:MAP_H}, () => new Array(MAP_W).fill(null));

  function placeRoom(x, y, type) {
    const r = { x, y, type,
      visited: false,
      cleared: (type === 'entry'),   // entry is already "cleared"
      doors: { n:false, s:false, e:false, w:false }
    };
    rooms[key(x,y)] = r;
    grid[y][x] = r;
    return r;
  }

  function connectRooms(ax, ay, bx, by) {
    const a = rooms[key(ax,ay)];
    const b = rooms[key(bx,by)];
    if (!a || !b) return;
    if (bx === ax && by === ay - 1) { a.doors.n = true; b.doors.s = true; }
    if (bx === ax && by === ay + 1) { a.doors.s = true; b.doors.n = true; }
    if (bx === ax - 1 && by === ay)  { a.doors.w = true; b.doors.e = true; }
    if (bx === ax + 1 && by === ay)  { a.doors.e = true; b.doors.w = true; }
  }

  // 1. Entry room near top-center
  const ex = Math.floor(MAP_W / 2);
  const ey = 1;
  placeRoom(ex, ey, 'entry');

  // 2. Random-walk to build a main path (~8-10 rooms)
  const grassCount = rnd(ROOM_COUNTS.grass.min, ROOM_COUNTS.grass.max);
  const totalRooms = 1 + grassCount + 3 + 1; // entry + grass + treasure+shop+center + boss
  const positions = [{ x: ex, y: ey }];
  let cx = ex, cy = ey;

  const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
  const placed = new Set([key(cx,cy)]);

  // Walk to fill grassCount+3 extra rooms (boss placed separately)
  let attempts = 0;
  while (placed.size < totalRooms - 1 && attempts < 500) {
    attempts++;
    const [dx,dy] = dirs[Math.floor(Math.random() * 4)];
    const nx = cx + dx, ny = cy + dy;
    if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) continue;
    const k = key(nx,ny);
    if (!placed.has(k)) {
      placeRoom(nx, ny, 'grass'); // type filled later
      connectRooms(cx, cy, nx, ny);
      placed.add(k);
      positions.push({ x:nx, y:ny });
      cx = nx; cy = ny;
    } else {
      // With 30% chance, backtrack to a random placed room
      if (Math.random() < 0.3) {
        const p = positions[Math.floor(Math.random() * positions.length)];
        cx = p.x; cy = p.y;
      }
    }
  }

  // 3. Place boss as far from entry as possible (BFS distance)
  const dist = {};
  const q = [{ x:ex, y:ey, d:0 }];
  dist[key(ex,ey)] = 0;
  while (q.length) {
    const { x, y, d } = q.shift();
    for (const [nx,ny] of neighbors(x,y)) {
      const k = key(nx,ny);
      if (rooms[k] && dist[k] === undefined) {
        dist[k] = d + 1;
        q.push({ x:nx, y:ny, d:d+1 });
      }
    }
  }
  let bossKey = null, maxD = -1;
  for (const k of placed) {
    if (k === key(ex,ey)) continue;
    if ((dist[k] ?? 0) > maxD) { maxD = dist[k] ?? 0; bossKey = k; }
  }
  if (bossKey) rooms[bossKey].type = 'boss';

  // 4. Assign special room types — prefer rooms with exactly 1 connection (natural leaf nodes)
  //    so Step 6 won't need to remove any bridge edges.
  const specials = ['treasure','shop','center'];
  const grassRooms = Object.values(rooms).filter(r => r.type === 'grass');
  const doorCount = r => Object.values(r.doors).filter(Boolean).length;
  // Sort ascending by connection count: rooms with 1 door come first (preferred dead-ends)
  const shuffled = [...grassRooms].sort((a, b) => {
    const da = doorCount(a), db = doorCount(b);
    if (da !== db) return da - db;
    return Math.random() - 0.5; // random tiebreak
  });
  for (let i = 0; i < specials.length && i < shuffled.length; i++) {
    shuffled[i].type = specials[i];
  }

  // 5. Ensure all remaining are 'grass'
  // (already set to grass by default)

  // Step 5a: G-2 필수 방 유형 보장 (treasure/boss/shop/center 각 1개 이상)
  const deadEndTypes = new Set(['boss','treasure','shop','center']);
  {
    const requiredTypes = ['treasure', 'shop', 'center', 'boss'];
    for (const reqType of requiredTypes) {
      const exists = Object.values(rooms).some(r => r.type === reqType);
      if (!exists) {
        const candidates = Object.values(rooms).filter(r =>
          r.type === 'grass' && !deadEndTypes.has(r.type)
        );
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          pick.type = reqType;
        }
      }
    }
  }

  // Step 5: Add extra connections to create graph cycles
  const countDoors = r => Object.values(r.doors).filter(Boolean).length;

  for (const r of Object.values(rooms)) {
    if (deadEndTypes.has(r.type)) continue;
    for (const [nx, ny] of neighbors(r.x, r.y)) {
      if (countDoors(r) >= 4) break;
      const nb = rooms[key(nx,ny)];
      if (!nb || deadEndTypes.has(nb.type)) continue;
      if (countDoors(nb) >= 4) continue;
      // Skip if already connected
      const alreadyConn = (nx===r.x+1&&r.doors.e)||(nx===r.x-1&&r.doors.w)||
                          (ny===r.y+1&&r.doors.s)||(ny===r.y-1&&r.doors.n);
      if (alreadyConn) continue;
      if (Math.random() < 0.4) connectRooms(r.x, r.y, nx, ny);
    }
  }

  // Step 6: Enforce exactly 1 connection for dead-end rooms.
  //   Keep the connection to a non-deadEnd neighbor (avoids cutting bridges to the main graph).
  const oppDir = {n:'s',s:'n',e:'w',w:'e'};
  const dirDelta = {n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]};
  for (const r of Object.values(rooms)) {
    if (!deadEndTypes.has(r.type)) continue;
    const connected = Object.entries(r.doors).filter(([,v])=>v);
    if (connected.length <= 1) continue;
    // Find index of edge that leads to a non-deadEnd neighbor (prefer keeping that one)
    let keepIdx = 0;
    for (let i = 0; i < connected.length; i++) {
      const [dir] = connected[i];
      const [dx,dy] = dirDelta[dir];
      const nb = rooms[key(r.x+dx, r.y+dy)];
      if (nb && !deadEndTypes.has(nb.type)) { keepIdx = i; break; }
    }
    for (let i = 0; i < connected.length; i++) {
      if (i === keepIdx) continue;
      const [dir] = connected[i];
      r.doors[dir] = false;
      const [dx,dy] = dirDelta[dir];
      const nb = rooms[key(r.x+dx, r.y+dy)];
      if (nb) nb.doors[oppDir[dir]] = false;
    }
  }

  // Step 7: BFS 연결성 검증 — 고립 방 강제 연결 (다중 패스)
  (function ensureConnectivity() {
    function bfsFrom(startKey) {
      const reached = new Set([startKey]);
      const q = [startKey];
      while (q.length) {
        const cur = q.shift();
        const r = rooms[cur];
        if (!r) continue;
        for (const [dir, [ddx, ddy]] of Object.entries(dirDelta)) {
          if (!r.doors[dir]) continue;
          const nk = key(r.x + ddx, r.y + ddy);
          if (rooms[nk] && !reached.has(nk)) { reached.add(nk); q.push(nk); }
        }
      }
      return reached;
    }

    // 최대 rooms수만큼 반복하여 안정될 때까지 연결
    for (let pass = 0; pass < Object.keys(rooms).length; pass++) {
      const reached = bfsFrom(key(ex, ey));
      const isolated = Object.keys(rooms).filter(k => !reached.has(k));
      if (isolated.length === 0) break;

      let anyFixed = false;
      for (const isoKey of isolated) {
        const isoRoom = rooms[isoKey];
        // 인접한 도달 가능 방 탐색 (deadEndType 포함 — 버그 수정: 연결 후보에서 제외하지 않음)
        const adjReached = neighbors(isoRoom.x, isoRoom.y)
          .map(([nx, ny]) => rooms[key(nx, ny)])
          .filter(r => r && reached.has(key(r.x, r.y)));
        if (adjReached.length === 0) continue;

        // 연결 대상 우선순위: 비deadEnd + 여유 > 비deadEnd > 최후 수단(deadEnd 허용)
        const target = adjReached.find(r => !deadEndTypes.has(r.type) && countDoors(r) < 4)
                    || adjReached.find(r => !deadEndTypes.has(r.type))
                    || adjReached[0];
        if (!target) continue;

        if (deadEndTypes.has(isoRoom.type)) {
          // deadEnd 고립 방: 기존 연결 제거 후 1개만 연결
          for (const [dir, v] of Object.entries(isoRoom.doors)) {
            if (!v) continue;
            isoRoom.doors[dir] = false;
            const [ddx2, ddy2] = dirDelta[dir];
            const nb2 = rooms[key(isoRoom.x + ddx2, isoRoom.y + ddy2)];
            if (nb2) nb2.doors[oppDir[dir]] = false;
          }
        }
        connectRooms(isoRoom.x, isoRoom.y, target.x, target.y);
        anyFixed = true;
      }
      if (!anyFixed) break;
    }
  })();

  return {
    floorNum,
    rooms,
    grid,
    entry: { x: ex, y: ey },
    current: key(ex, ey),
  };
}

/* ── Room colors and icons (used by explore view in game.js) ── */
const ROOM_COLORS = {
  entry:    '#5a9e5a',
  grass:    '#3a5a3a',
  treasure: '#c8a020',
  shop:     '#6060c0',
  center:   '#c03060',
  boss:     '#901010',
};
const ROOM_ICONS = {
  entry:    '★',
  grass:    '',
  treasure: '◆',
  shop:     '$',
  center:   '+',
  boss:     '☠',
};

/* ── Adjacent room list (for "choose next room" UI) ─────── */
function getAdjacentRooms(floor) {
  const cur = floor.rooms[floor.current];
  if (!cur) return [];
  const result = [];
  const deltas = { n:[0,-1], s:[0,1], e:[1,0], w:[-1,0] };
  for (const [dir, [dx,dy]] of Object.entries(deltas)) {
    if (!cur.doors[dir]) continue;
    const k = key(cur.x + dx, cur.y + dy);
    if (floor.rooms[k]) result.push({ dir, room: floor.rooms[k], key: k });
  }
  return result;
}

function enterRoom(floor, roomKey) {
  const r = floor.rooms[roomKey];
  if (!r) return;
  floor.current = roomKey;
  r.visited = true;
}
