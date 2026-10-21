/* ============================================================
   PMD Sprite Animator  —  per-character basePath + animData
   ============================================================ */

// PMD direction rows: 0=S 1=SW 2=W 3=NW 4=N 5=NE 6=E 7=SE
const DIR = { S:0, SW:1, W:2, NW:3, N:4, NE:5, E:6, SE:7 };

class SpriteAnimator {
  constructor(canvas, basePath, animData) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.basePath = basePath;   // e.g. 'assets/chars/inuyasha/'
    this.animData = animData;   // per-character ANIM_DATA object
    this._images  = {};
    this._animName = 'Idle';
    this._dir      = DIR.E;
    this._frameIdx = 0;
    this._tick     = 0;
    this._loop     = true;
    this._onComplete = null;
    this._rafId    = null;
    this._running  = false;
  }

  _loadImage(animName) {
    if (this._images[animName]) return Promise.resolve(this._images[animName]);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => { this._images[animName] = img; resolve(img); };
      img.onerror = () => reject(new Error(`Failed: ${this.basePath}${animName}-Anim.png`));
      img.src = `${this.basePath}${animName}-Anim.png`;
    });
  }

  async play(animName, dir, { loop = true, onComplete = null } = {}) {
    // Fall back to Hurt if requested animation doesn't exist in animData
    if (!this.animData[animName] && animName === 'Faint') animName = 'Hurt';
    if (!this.animData[animName]) return;

    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._animName   = animName;
    this._dir        = dir;
    this._frameIdx   = 0;
    this._tick       = 0;
    this._loop       = loop;
    this._onComplete = onComplete;
    this._running    = true;
    try { await this._loadImage(animName); } catch { return; }
    this._step();
  }

  _step() {
    if (!this._running) return;
    const data = this.animData[this._animName];
    const img  = this._images[this._animName];
    if (!img || !data) return;

    const { fw, fh, durations } = data;
    const totalFrames = durations.length;

    if (this.canvas.width !== fw || this.canvas.height !== fh) {
      this.canvas.width  = fw;
      this.canvas.height = fh;
      this.ctx.imageSmoothingEnabled = false;
      if (this.onFrameResize) this.onFrameResize(this.canvas);
    }

    const sx = this._frameIdx * fw;
    const sy = this._dir * fh;
    this.ctx.clearRect(0, 0, fw, fh);
    this.ctx.drawImage(img, sx, sy, fw, fh, 0, 0, fw, fh);

    this._tick++;
    if (this._tick >= durations[this._frameIdx]) {
      this._tick = 0;
      this._frameIdx++;
      if (this._frameIdx >= totalFrames) {
        if (this._loop) {
          this._frameIdx = 0;
        } else {
          this._frameIdx = totalFrames - 1;
          this._running  = false;
          if (this._onComplete) this._onComplete();
          return;
        }
      }
    }
    this._rafId = requestAnimationFrame(() => this._step());
  }

  stop() {
    this._running = false;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
  }
}

// Global registry keyed by canvas element id
const SPRITES = {};

// Fallback when AnimData.xml is unavailable or not yet loaded
const FALLBACK_ANIM = {
  Idle:   { fw: 24, fh: 24, durations: [16, 6, 6] },
  Walk:   { fw: 24, fh: 24, durations: [6, 6, 6, 6] },
  Attack: { fw: 32, fh: 32, durations: [3, 2, 3, 2, 3, 3, 4] },
  Hurt:   { fw: 24, fh: 24, durations: [2, 8] },
  Faint:  { fw: 24, fh: 24, durations: [8, 8, 8, 8] },
  Charge: { fw: 24, fh: 24, durations: [4, 4, 4] },
  Sleep:  { fw: 24, fh: 24, durations: [12, 12] },
};

async function loadAnimDataFromXml(basePath) {
  try {
    const resp = await fetch(basePath + 'AnimData.xml');
    if (!resp.ok) return null;
    const text = await resp.text();
    const doc  = new DOMParser().parseFromString(text, 'text/xml');
    const result = {};
    const copyOfs = {};
    for (const animEl of doc.querySelectorAll('Anim')) {
      const name   = animEl.querySelector('Name')?.textContent;
      if (!name) continue;
      const copyOf = animEl.querySelector('CopyOf')?.textContent;
      if (copyOf) { copyOfs[name] = copyOf; continue; }
      const fw  = parseInt(animEl.querySelector('FrameWidth')?.textContent  || '24');
      const fh  = parseInt(animEl.querySelector('FrameHeight')?.textContent || '24');
      const durations = Array.from(animEl.querySelectorAll('Duration')).map(d => parseInt(d.textContent));
      if (durations.length) result[name] = { fw, fh, durations };
    }
    for (const [n, ref] of Object.entries(copyOfs)) {
      if (result[ref]) result[n] = result[ref];
    }
    return Object.keys(result).length ? result : null;
  } catch { return null; }
}

/*
  initSprite(id, facing, charDef)
  charDef = { char: '0001', animData: {...} | null }
  Returns a Promise — await it before calling playSprite.
*/
async function initSprite(id, facing, charDef) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const basePath = `assets/chars/${charDef.char}/`;
  let animData = charDef.animData;
  if (!animData) {
    // Use pre-bundled data first (avoids CORS issues with file:// protocol)
    if (typeof ANIM_DATA_BUNDLE !== 'undefined' && ANIM_DATA_BUNDLE[charDef.char]) {
      animData = ANIM_DATA_BUNDLE[charDef.char];
    } else {
      animData = await loadAnimDataFromXml(basePath);
      if (!animData) animData = { ...FALLBACK_ANIM };
    }
    charDef.animData = animData;
  }
  const animator = new SpriteAnimator(canvas, basePath, animData);
  SPRITES[id] = { animator, facing };
  animator.onFrameResize = () => {
    if (window._onSpriteResize) window._onSpriteResize(id);
  };
  await animator.play('Idle', facing);
}

function playSprite(id, animName, { loop = true, onComplete = null } = {}) {
  const s = SPRITES[id];
  if (!s) return;
  s.animator.play(animName, s.facing, { loop, onComplete });
}

function idleSprite(id) {
  playSprite(id, 'Idle', { loop: true });
}

function setSpriteFacing(id, facing) {
  const s = SPRITES[id];
  if (s) s.facing = facing;
}
