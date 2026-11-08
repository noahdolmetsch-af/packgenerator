/**
 * Flyer für Tennisstunden: draws one picture on a canvas (Noah 07.11.2026 «ok Flyer»). The blocks of the model
 * (flyer.js buildModel) are stacked one under the other in their order; the header sits on top and the sign-up
 * band at the bottom. In 16:9 the photo stands on the left and the blocks on the right. When the content is
 * longer than the picture, everything shrinks a little (down to 40 %); when it is short, it grows a little.
 * Runs in the browser only (canvas). The QR code comes from qrMatrix (pay/qrmatrix.js).
 */
import { photoRect } from './flyer.js';

const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const C = { green: '#17573a', yellow: '#d9ef3a', ink: '#10241a', paper: '#fffef9', pale: '#eef4e6', card: '#f4f8ea', mute: '#3d5247' };
const font = (w, px) => `${w} ${Math.max(8, Math.round(px))}px ${FONT}`;

/** Splits a text into lines that fit maxW with the font set on g (words, then characters for very long words). */
export function wrapText(g, text, maxW) {
  const out = [];
  for (const para of String(text ?? '').split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (g.measureText(test).width <= maxW || !line) {
        line = test;
        while (g.measureText(line).width > maxW && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && g.measureText(line.slice(0, cut)).width > maxW) cut--;
          out.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out.length ? out : [''];
}
function ellipsis(g, text, maxW) {
  let s = String(text ?? '');
  if (g.measureText(s).width <= maxW) return s;
  while (s.length > 1 && g.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
}
function rrect(g, x, y, w, h, r) {
  const k = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + k, y);
  g.arcTo(x + w, y, x + w, y + h, k);
  g.arcTo(x + w, y + h, x, y + h, k);
  g.arcTo(x, y + h, x, y, k);
  g.arcTo(x, y, x + w, y, k);
  g.closePath();
}

/** Draws the photo (cover, zoomed around the focus) into a rounded box. */
function drawPhoto(g, im, box, r, ph) {
  g.save();
  rrect(g, box.x, box.y, box.w, box.h, r);
  g.clip();
  if (im) {
    const s = photoRect(im.width, im.height, box.w, box.h, ph?.fx, ph?.fy, ph?.zoom);
    g.drawImage(im, s.sx, s.sy, s.sw, s.sh, box.x, box.y, box.w, box.h);
  } else {
    const grad = g.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    grad.addColorStop(0, '#a9d3b9');
    grad.addColorStop(1, '#4f9b72');
    g.fillStyle = grad;
    g.fillRect(box.x, box.y, box.w, box.h);
  }
  g.restore();
}
function drawBadge(g, text, box, u) {
  if (!text) return;
  // «ab 6 Jahren» → two lines at the middle word; own line breaks win
  let lines = String(text).split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1 && lines[0].length > 6) {
    const words = lines[0].split(/\s+/);
    if (words.length > 1) {
      let best = 1;
      let gap = Infinity;
      for (let i = 1; i < words.length; i++) {
        const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
        if (d < gap) ((gap = d), (best = i));
      }
      lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
    }
  }
  lines = lines.slice(0, 3);
  const r = 62 * u;
  const cx = box.x + box.w - r - 14 * u;
  const cy = box.y + box.h - r - 14 * u;
  g.fillStyle = 'rgba(0,0,0,.18)';
  g.beginPath();
  g.arc(cx, cy + 4 * u, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = C.yellow;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = C.ink;
  g.textAlign = 'center';
  let size = 28 * u;
  g.font = font(800, size);
  while (size > 12 * u && Math.max(...lines.map((l) => g.measureText(l).width)) > r * 1.6) {
    size -= 1 * u;
    g.font = font(800, size);
  }
  lines.forEach((l, i) => g.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * size * 1.15 + size * 0.35));
  g.textAlign = 'left';
}

/** One block: its height at width w and a function that draws it at (x, y). u: the size unit. */
function plan(g, id, m, w, u, ctx) {
  if (id === 'title') {
    g.font = font(800, 62 * u);
    const lines = wrapText(g, m.title, w).slice(0, 3);
    const lh = 68 * u;
    g.font = font(600, 30 * u);
    const sub = m.sub ? wrapText(g, m.sub, w).slice(0, 3) : [];
    const h = lines.length * lh + (sub.length ? 10 * u + sub.length * 38 * u : 0);
    return {
      h,
      draw(x, y) {
        g.font = font(800, 62 * u);
        lines.forEach((l, i) => {
          const base = y + i * lh + 54 * u;
          g.fillStyle = C.yellow;
          g.fillRect(x, base - 22 * u, Math.min(w, g.measureText(l).width), 24 * u);
          g.fillStyle = C.green;
          g.fillText(l, x, base);
        });
        g.font = font(600, 30 * u);
        g.fillStyle = C.ink;
        sub.forEach((l, i) => g.fillText(l, x, y + lines.length * lh + 10 * u + 28 * u + i * 38 * u));
      },
    };
  }
  if (id === 'table') {
    const lw = 150 * u;
    g.font = font(600, 27 * u);
    const rows = m.rows.map(([k, v]) => ({ k, lines: wrapText(g, v, w - lw - 16 * u) }));
    const lh = 36 * u;
    const gap = 12 * u;
    const h = rows.reduce((s, r) => s + r.lines.length * lh + gap, 0) - gap;
    return {
      h,
      draw(x, y) {
        let yy = y;
        for (const r of rows) {
          g.font = font(800, 27 * u);
          g.fillStyle = C.green;
          g.fillText(r.k, x, yy + 27 * u);
          g.font = font(600, 27 * u);
          g.fillStyle = C.ink;
          r.lines.forEach((l, i) => g.fillText(l, x + lw + 16 * u, yy + 27 * u + i * lh));
          yy += r.lines.length * lh + gap;
        }
      },
    };
  }
  if (id === 'levels') {
    const pad = 16 * u;
    g.font = font(600, 24 * u);
    const items = m.levels.map((l) => ({ name: l.name, lines: wrapText(g, l.line, w - 2 * pad - 10 * u) }));
    const hOf = (it) => pad + 32 * u + it.lines.length * 32 * u + pad - 6 * u;
    const gap = 12 * u;
    return {
      h: items.reduce((s, it) => s + hOf(it) + gap, 0) - gap,
      draw(x, y) {
        let yy = y;
        for (const it of items) {
          const h = hOf(it);
          g.fillStyle = C.card;
          rrect(g, x, yy, w, h, 10 * u);
          g.fill();
          g.fillStyle = C.yellow;
          g.fillRect(x, yy + 8 * u, 8 * u, h - 16 * u);
          g.font = font(800, 28 * u);
          g.fillStyle = C.green;
          g.fillText(ellipsis(g, it.name, w - 2 * pad), x + pad + 10 * u, yy + pad + 24 * u);
          g.font = font(600, 24 * u);
          g.fillStyle = C.ink;
          it.lines.forEach((l, i) => g.fillText(l, x + pad + 10 * u, yy + pad + 24 * u + 34 * u + i * 32 * u));
          yy += h + gap;
        }
      },
    };
  }
  if (id === 'cards') {
    const cols = Math.min(m.cards.length, 3);
    const gap = 14 * u;
    const cw = (w - gap * (cols - 1)) / cols;
    const pad = 14 * u;
    g.font = font(500, 22 * u);
    const cards = m.cards.map((c) => ({ ...c, lines: wrapText(g, c.text, cw - 2 * pad).slice(0, 6) }));
    const rows = [];
    for (let i = 0; i < cards.length; i += cols) rows.push(cards.slice(i, i + cols));
    const rowH = rows.map((r) => Math.max(...r.map((c) => pad + 6 * u + 28 * u + c.lines.length * 28 * u + pad - 6 * u)));
    return {
      h: rowH.reduce((s, h) => s + h + gap, 0) - gap,
      draw(x, y) {
        let yy = y;
        rows.forEach((r, ri) => {
          r.forEach((c, ci) => {
            const cx = x + ci * (cw + gap);
            g.fillStyle = C.card;
            rrect(g, cx, yy, cw, rowH[ri], 8 * u);
            g.fill();
            g.fillStyle = C.yellow;
            g.fillRect(cx, yy, cw, 6 * u);
            g.font = font(800, 23 * u);
            g.fillStyle = C.green;
            g.fillText(ellipsis(g, c.label, cw - 2 * pad), cx + pad, yy + pad + 22 * u);
            g.font = font(500, 22 * u);
            g.fillStyle = C.ink;
            c.lines.forEach((l, i) => g.fillText(l, cx + pad, yy + pad + 22 * u + 30 * u + i * 28 * u));
          });
          yy += rowH[ri] + gap;
        });
      },
    };
  }
  if (id === 'trainer') {
    g.font = font(500, 24 * u);
    const lines = m.trainer.text ? wrapText(g, m.trainer.text, w - 24 * u).slice(0, 5) : [];
    const head = m.trainer.name ? `${m.words.trainer}: ${m.trainer.name}` : m.words.trainer;
    return {
      h: 34 * u + lines.length * 31 * u,
      draw(x, y) {
        g.fillStyle = C.yellow;
        g.fillRect(x, y, 6 * u, 34 * u + lines.length * 31 * u);
        g.font = font(800, 25 * u);
        g.fillStyle = C.green;
        g.fillText(ellipsis(g, head, w - 24 * u), x + 20 * u, y + 25 * u);
        g.font = font(500, 24 * u);
        g.fillStyle = C.ink;
        lines.forEach((l, i) => g.fillText(l, x + 20 * u, y + 25 * u + 34 * u + i * 31 * u - 2 * u));
      },
    };
  }
  if (id === 'free') {
    g.font = font(800, 25 * u);
    const padX = 20 * u;
    const rows = [[]];
    let used = 0;
    for (const chip of m.chips) {
      const cw = g.measureText(chip.text).width + 2 * padX;
      if (used + cw > w && rows[rows.length - 1].length) {
        rows.push([]);
        used = 0;
      }
      rows[rows.length - 1].push({ ...chip, cw });
      used += cw + 12 * u;
    }
    const chipH = 50 * u;
    return {
      h: rows.length * (chipH + 10 * u) - 10 * u,
      draw(x, y) {
        rows.forEach((r, ri) => {
          let xx = x;
          for (const chip of r) {
            g.fillStyle = chip.kind === 'deadline' ? C.yellow : C.pale;
            rrect(g, xx, y + ri * (chipH + 10 * u), chip.cw, chipH, chipH / 2);
            g.fill();
            if (chip.kind !== 'deadline') {
              g.strokeStyle = C.green;
              g.lineWidth = 2 * u;
              g.stroke();
            }
            g.font = font(800, 25 * u);
            g.fillStyle = chip.kind === 'deadline' ? C.ink : C.green;
            g.fillText(chip.text, xx + padX, y + ri * (chipH + 10 * u) + 33 * u);
            xx += chip.cw + 12 * u;
          }
        });
      },
    };
  }
  // an own text block: ctx.extra[i]
  const x = ctx.extra;
  g.font = font(800, 28 * u);
  const head = x.title ? wrapText(g, x.title, w).slice(0, 2) : [];
  g.font = font(500, 25 * u);
  const body = x.text ? wrapText(g, x.text, w).slice(0, 8) : [];
  return {
    h: head.length * 36 * u + (head.length && body.length ? 4 * u : 0) + body.length * 33 * u,
    draw(px, py) {
      g.font = font(800, 28 * u);
      g.fillStyle = C.green;
      head.forEach((l, i) => g.fillText(l, px, py + 28 * u + i * 36 * u));
      g.font = font(500, 25 * u);
      g.fillStyle = C.ink;
      body.forEach((l, i) => g.fillText(l, px, py + 26 * u + head.length * 36 * u + (head.length ? 4 * u : 0) + i * 33 * u));
    },
  };
}

/** The ids of the blocks to flow: «extra» texts are expanded to extra:0, extra:1 … (after the flow blocks the user placed). */
function flowIds(m) {
  return m.order.filter((id) => !['top', 'photo', 'cta'].includes(id)).flatMap((id) => (id === 'free' ? ['free', ...m.extra.map((_, i) => `extra:${i}`)] : [id]));
}

/**
 * Draws one flyer. canvas: the target; fmt: { w, h }; model: buildModel(); opts: { img (an Image or null), photo
 * ({ fx, fy, zoom }), qr ({ n, rows } from qrMatrix or null) }.
 */
export function drawFlyer(canvas, fmt, m, { img = null, photo = null, qr = null } = {}) {
  const W = fmt.w;
  const H = fmt.h;
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  const base = Math.min(W, H * 1.05) / 1000;
  const wide = W / H > 1.3;
  g.fillStyle = C.paper;
  g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';

  const withTop = m.order.includes('top');
  const withPhoto = m.order.includes('photo');
  const withCta = m.order.includes('cta');
  const ids = flowIds(m);

  // everything for one size factor s: the pieces and the height they need
  const layout = (s) => {
    const u = base * s;
    const M = 56 * base * Math.max(0.7, s);
    const topH = withTop && (m.audience || m.hint) ? 62 * u : 0;
    const ctaH = withCta ? 232 * u : 0;
    const gap = 26 * u;
    const y0 = topH + (topH ? gap : M * 0.6);
    const y1 = H - ctaH - (ctaH ? gap : M * 0.6);
    const photoW = withPhoto && wide ? W * 0.34 : 0;
    const x0 = M + (photoW ? photoW + 40 * base : 0);
    const cw = W - M - x0;
    const banner = withPhoto && !wide ? { h: Math.min(cw * (W === H ? 0.42 : 0.5), (y1 - y0) * 0.4) } : null;
    const parts = ids.map((id) => ({ id, ...plan(g, id.startsWith('extra:') ? 'extra' : id, m, cw, u, { extra: id.startsWith('extra:') ? m.extra[Number(id.slice(6))] : null }) }));
    const bodyH = parts.reduce((t, p) => t + p.h, 0) + Math.max(0, parts.length - 1) * gap + (banner ? banner.h + gap : 0);
    return { u, M, topH, ctaH, gap, y0, y1, photoW, x0, cw, banner, parts, bodyH };
  };

  let s = 1.25;
  let L = layout(s);
  while (L.bodyH > L.y1 - L.y0 && s > 0.4) {
    s = Math.round((s - 0.04) * 100) / 100;
    L = layout(s);
  }
  const { u, M } = L;

  // header
  if (L.topH) {
    g.fillStyle = C.pale;
    g.fillRect(0, 0, W, L.topH);
    g.font = font(700, 22 * u);
    g.fillStyle = C.mute;
    const half = (W - 2 * M) / 2;
    if (m.audience) g.fillText(ellipsis(g, m.audience, m.hint ? half : W - 2 * M), M, L.topH / 2 + 8 * u);
    if (m.hint) {
      g.textAlign = 'right';
      g.fillText(ellipsis(g, m.hint, half), W - M, L.topH / 2 + 8 * u);
      g.textAlign = 'left';
    }
  }
  // photo
  if (withPhoto && L.photoW) {
    const box = { x: M, y: L.y0, w: L.photoW, h: L.y1 - L.y0 };
    drawPhoto(g, img, box, 18 * u, photo);
    drawBadge(g, m.badge, box, u);
  }
  // blocks
  let y = L.y0;
  if (L.banner) {
    const box = { x: L.x0, y, w: L.cw, h: L.banner.h };
    drawPhoto(g, img, box, 16 * u, photo);
    drawBadge(g, m.badge, box, u);
    y += L.banner.h + L.gap;
  }
  // in 16:9 the column is centred in the free height when it is short
  if (wide && L.photoW) y += Math.max(0, (L.y1 - L.y0 - L.bodyH) / 2);
  for (const p of L.parts) {
    p.draw(L.x0, y);
    y += p.h + L.gap;
  }
  // sign-up band
  if (withCta) drawCta(g, m, { W, H, u, M, h: L.ctaH, qr });
}

function drawCta(g, m, { W, H, u, M, h, qr }) {
  const y = H - h;
  g.fillStyle = C.green;
  g.fillRect(0, y, W, h);
  const pad = 28 * u;
  let x = M;
  if (qr) {
    const box = h - 2 * pad;
    g.fillStyle = '#ffffff';
    rrect(g, x, y + pad, box, box, 12 * u);
    g.fill();
    const q = 14 * u;
    const cell = Math.floor((box - 2 * q) / qr.n);
    const off = (box - cell * qr.n) / 2;
    g.fillStyle = C.ink;
    for (let r = 0; r < qr.n; r++) for (let c = 0; c < qr.n; c++) if (qr.rows[r][c]) g.fillRect(x + off + c * cell, y + pad + off + r * cell, cell, cell);
    x += box + 34 * u;
  }
  const maxW = W - M - x;
  g.font = font(800, 46 * u);
  const bw = Math.min(maxW, g.measureText(m.button).width + 80 * u);
  const bh = 72 * u;
  const by = y + pad + 4 * u;
  g.fillStyle = C.yellow;
  rrect(g, x, by, bw, bh, 14 * u);
  g.fill();
  g.fillStyle = C.ink;
  g.textAlign = 'center';
  g.fillText(ellipsis(g, m.button, bw - 30 * u), x + bw / 2, by + bh / 2 + 16 * u);
  g.textAlign = 'left';
  g.fillStyle = '#ffffff';
  const sizes = [24, 21, 24];
  const weights = [700, 600, 600];
  let ly = by + bh + 34 * u;
  [m.note, m.shortUrl, m.contact].forEach((txt, i) => {
    if (!txt) return;
    let size = sizes[i] * u;
    g.font = font(weights[i], size);
    while (size > 14 * u && g.measureText(txt).width > maxW) {
      size -= 1 * u;
      g.font = font(weights[i], size);
    }
    g.fillText(ellipsis(g, txt, maxW), x, ly);
    ly += 30 * u;
  });
}

/** Loads a picture from a data address; null when it cannot be read. */
export const loadImage = (src) =>
  new Promise((ok) => {
    if (!src) return ok(null);
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(null);
    im.src = src;
  });
