// All visual marks are schematic. This renderer is not an individual-fish model.
export class OceanScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.record = null;
    this.showLice = false;
    this.motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.motionPreference.matches;
    this.motionPreference.addEventListener("change", (event) => {
      this.reduced = event.matches;
      this.dirty = true;
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.start = performance.now();
    this.lastDraw = 0;
    this.draw = this.draw.bind(this);
    requestAnimationFrame(this.draw);
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(bounds.width * pixelRatio);
    this.canvas.height = Math.round(bounds.height * pixelRatio);
    this.dpr = pixelRatio;
    this.width = bounds.width;
    this.height = bounds.height;
    this.dirty = true;
  }
  update(record, showLice) {
    this.record = record;
    this.showLice = showLice;
    this.dirty = true;
  }
  drawFish(context, x, y, size, direction, phase, depth, lice) {
    context.save();
    context.translate(x, y);
    context.scale(
      (direction * size * (this.height / 560)) / (this.width / 1000),
      size,
    );
    context.globalAlpha = 0.48 + depth * 0.42;
    const shimmer = context.createLinearGradient(0, -5, 0, 7);
    shimmer.addColorStop(0, "#75829c");
    shimmer.addColorStop(0.42, "#c3cad6");
    shimmer.addColorStop(0.55, "#adb5c5");
    shimmer.addColorStop(1, "#657491");
    context.fillStyle = shimmer;
    context.beginPath();
    context.moveTo(-17, 0);
    context.bezierCurveTo(-5, -9, 13, -8, 20, -1);
    context.bezierCurveTo(21, 1, 11, 5, 1, 6);
    context.bezierCurveTo(-7, 5, -12, 3, -17, 0);
    context.fill();
    context.fillStyle = "#8c96aa";
    const tail = Math.sin(phase) * 2;
    context.beginPath();
    context.moveTo(-15, 0);
    context.lineTo(-26, -7 + tail);
    context.lineTo(-23, 0);
    context.lineTo(-26, 7 + tail);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(-5, -5);
    context.lineTo(1, -11);
    context.lineTo(7, -5);
    context.closePath();
    context.fill();
    context.fillStyle = "#566480";
    context.beginPath();
    context.moveTo(5, 2);
    context.lineTo(0, 9);
    context.lineTo(-1, 3);
    context.fill();
    context.strokeStyle = "#54617b";
    context.lineWidth = 0.5;
    context.beginPath();
    context.moveTo(10, -4);
    context.quadraticCurveTo(6, 0, 10, 4);
    context.stroke();
    context.fillStyle = "#202c44";
    context.beginPath();
    context.arc(15, -1.7, 1.1, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha *= 0.65;
    for (let k = 0; k < 5; k++) {
      context.beginPath();
      context.arc(-7 + k * 3, -2 + (k % 2), 0.5, 0, Math.PI * 2);
      context.fill();
    }
    if (lice) {
      context.globalAlpha = 0.95;
      context.fillStyle = "#e88d76";
      for (let k = 0; k < Math.min(4, Math.ceil(lice)); k++) {
        context.beginPath();
        context.ellipse(
          -6 + k * 4,
          -1 + (k % 2) * 3,
          1.5,
          1,
          0,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    }
    context.restore();
  }
  draw(now) {
    requestAnimationFrame(this.draw);
    if (document.hidden) return;
    if (now - this.lastDraw < 40 || (this.reduced && !this.dirty)) return;
    this.lastDraw = now;
    this.dirty = false;
    const context = this.context;
    if (!this.width) return;
    const w = this.width,
      h = this.height,
      sx = w / 1000,
      sy = h / 560;
    context.setTransform(this.dpr * sx, 0, 0, this.dpr * sy, 0, 0);
    const elapsedSeconds = this.reduced ? 4 : (now - this.start) / 1000,
      record = this.record;
    const sky = context.createLinearGradient(0, 0, 0, 200);
    sky.addColorStop(0, "#263450");
    sky.addColorStop(1, "#6f7c96");
    context.fillStyle = sky;
    context.fillRect(0, 0, 1000, 560);
    context.fillStyle = "#404e69";
    context.beginPath();
    context.moveTo(0, 145);
    context.lineTo(0, 79);
    context.lineTo(55, 98);
    context.lineTo(127, 83);
    context.lineTo(215, 116);
    context.lineTo(291, 107);
    context.lineTo(357, 143);
    context.lineTo(1000, 143);
    context.lineTo(1000, 80);
    context.lineTo(944, 92);
    context.lineTo(874, 74);
    context.lineTo(809, 111);
    context.lineTo(727, 117);
    context.lineTo(650, 149);
    context.closePath();
    context.fill();
    context.fillStyle = "#334059";
    context.beginPath();
    context.moveTo(0, 121);
    context.lineTo(99, 140);
    context.lineTo(159, 137);
    context.lineTo(252, 166);
    context.lineTo(0, 170);
    context.fill();
    context.beginPath();
    context.moveTo(1000, 121);
    context.lineTo(935, 141);
    context.lineTo(846, 138);
    context.lineTo(737, 163);
    context.lineTo(1000, 170);
    context.fill();
    const water = context.createLinearGradient(0, 150, 0, 560);
    water.addColorStop(0, "#3b507b");
    water.addColorStop(0.18, "#273e6d");
    water.addColorStop(0.7, "#182b50");
    water.addColorStop(1, "#122243");
    context.fillStyle = water;
    context.fillRect(0, 160, 1000, 400);
    // Sunlight is illustrative; simulated temperature remains in the numerical label.
    context.save();
    context.globalAlpha = 0.045;
    context.fillStyle = "#d2dcef";
    for (let i = 0; i < 5; i++) {
      const x = 300 + i * 122 + Math.sin(elapsedSeconds * 0.12) * 25;
      context.beginPath();
      context.moveTo(x, 160);
      context.lineTo(x + 25, 160);
      context.lineTo(x - 100, 560);
      context.lineTo(x - 220, 560);
      context.fill();
    }
    context.restore();
    context.strokeStyle = "#8e9cb9";
    context.lineWidth = 1;
    context.globalAlpha = 0.16;
    for (let i = 0; i < 20; i++) {
      const x = (i * 83 + Math.sin(elapsedSeconds * 0.17 + i) * 8) % 1000,
        y = 163 + (i % 5) * 10;
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(x + 18, y - 3, x + 39, y);
      context.stroke();
    }
    context.globalAlpha = 1;
    // An elliptical sea cage. Front mesh stays translucent to keep the system visible.
    const cx = 555,
      top = 210,
      bottom = 415,
      rx = 254,
      ry = 49;
    context.strokeStyle = "#a2aaba31";
    context.lineWidth = 1.1;
    for (let k = 0; k < 10; k++) {
      const a = Math.PI + (k * Math.PI) / 9,
        x = cx + rx * Math.cos(a),
        y = top + ry * Math.sin(a);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(
        cx + rx * 0.82 * Math.cos(a),
        bottom + ry * 0.7 * Math.sin(a),
      );
      context.stroke();
    }
    for (let k = 1; k < 6; k++) {
      const q = k / 6;
      context.beginPath();
      context.ellipse(
        cx,
        top + (bottom - top) * q,
        rx * (1 - 0.18 * q),
        ry * (1 - 0.3 * q),
        0,
        Math.PI,
        2 * Math.PI,
      );
      context.stroke();
    }
    const shadow = context.createRadialGradient(cx, 410, 20, cx, 410, 230);
    shadow.addColorStop(0, "#06153244");
    shadow.addColorStop(1, "#06153200");
    context.fillStyle = shadow;
    context.fillRect(cx - 260, 280, 520, 210);
    // Fish are representative marks. Their number follows a fraction of survival.
    const growth = record ? Math.cbrt(record.W / 150) : 1,
      count = Math.max(
        3,
        Math.round((37 * (record?.N ?? 100000)) / (this.initialFish || 100000)),
      );
    const fish = [];
    for (let i = 0; i < count; i++) {
      const a = i * 2.399 + elapsedSeconds * (0.13 + (i % 4) * 0.018),
        depth = (Math.sin(a) + 1) / 2;
      fish.push({
        i,
        a,
        depth,
        x: cx + Math.cos(a) * (126 + (i % 5) * 17),
        y: top + 64 + (i % 7) * 17 + Math.sin(a) * 28,
      });
    }
    fish.sort((a, b) => a.depth - b.depth);
    for (const f of fish) {
      const size = (0.4 + growth * 0.14) * (0.72 + f.depth * 0.3);
      this.drawFish(
        context,
        f.x,
        f.y,
        size,
        Math.sin(f.a) > 0 ? -1 : 1,
        elapsedSeconds * 5 + f.i,
        f.depth,
        this.showLice && record?.mobile > 0.08 ? record.mobile : 0,
      );
    }
    context.strokeStyle = "#b3bbcb30";
    context.lineWidth = 0.9;
    for (let k = 0; k < 16; k++) {
      const a = (k * Math.PI) / 15,
        x = cx + rx * Math.cos(a),
        y = top + ry * Math.sin(a);
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(
        cx + rx * 0.94 * Math.cos(a),
        320,
        cx + rx * 0.82 * Math.cos(a),
        bottom + ry * 0.7 * Math.sin(a),
      );
      context.stroke();
    }
    for (let k = 1; k <= 7; k++) {
      const q = k / 7;
      context.beginPath();
      context.ellipse(
        cx,
        top + (bottom - top) * q,
        rx * (1 - 0.18 * q),
        ry * (1 - 0.3 * q),
        0,
        0,
        Math.PI,
      );
      context.stroke();
    }
    // Mooring lines.
    context.strokeStyle = "#b2b9c847";
    context.lineWidth = 1.5;
    for (const [x, y, ex, ey] of [
      [cx - rx, top, 66, 310],
      [cx + rx, top, 1008, 298],
      [cx - 190, top + 32, 114, 501],
      [cx + 190, top + 32, 963, 500],
    ]) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(ex, ey);
      context.stroke();
    }
    context.beginPath();
    context.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2);
    context.strokeStyle = "#1b2842";
    context.lineWidth = 13;
    context.stroke();
    context.strokeStyle = "#788295";
    context.lineWidth = 6;
    context.stroke();
    context.beginPath();
    context.ellipse(cx, top - 9, rx, ry, 0, 0, Math.PI * 2);
    context.strokeStyle = "#a1a8b77a";
    context.lineWidth = 1.3;
    context.stroke();
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6;
      const x = cx + rx * Math.cos(a),
        y = top + ry * Math.sin(a);
      context.strokeStyle = "#979faf";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, y - 11);
      context.stroke();
      if (k % 3 === 0) {
        context.fillStyle = "#c37b69";
        context.beginPath();
        context.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2);
        context.fill();
      }
    }
    // Feed and free-swimming particles are explicitly magnified schematic marks.
    if (this.showLice && record?.R > 0) {
      const n = Math.min(55, Math.ceil(record.R / 3000));
      context.fillStyle = "#e48c76";
      for (let i = 0; i < n; i++) {
        const x = 230 + ((i * 79.7 + elapsedSeconds * 10) % 650),
          y = 220 + ((i * 31.7 + Math.sin(elapsedSeconds + i) * 6) % 195);
        context.globalAlpha = 0.3 + (i % 3) * 0.18;
        context.beginPath();
        context.arc(x, y, 1.2 + (i % 3) * 0.3, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }
    if (record?.recovery > 0) {
      context.strokeStyle = "#b3c4e5";
      context.lineWidth = 1.2;
      context.globalAlpha = 0.4;
      for (let i = 0; i < 3; i++) {
        context.beginPath();
        context.ellipse(cx, top + 60 + i * 30, rx * 0.8, 35, 0, 0, Math.PI * 2);
        context.stroke();
      }
      context.globalAlpha = 1;
    }
    for (let i = 0; i < 18; i++) {
      context.fillStyle = "#b8c0d1";
      context.globalAlpha = 0.12;
      const x = (i * 137) % 1000,
        y = 230 + ((i * 67 - elapsedSeconds * 3) % 300);
      context.beginPath();
      context.arc(x, y, 1, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    const bottomFade = context.createLinearGradient(0, 420, 0, 560);
    bottomFade.addColorStop(0, "#12224300");
    bottomFade.addColorStop(1, "#12213ee0");
    context.fillStyle = bottomFade;
    context.fillRect(0, 410, 1000, 150);
  }
}
