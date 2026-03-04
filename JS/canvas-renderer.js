// ========================================
// CanvasRenderer - Senior Friendly (ปรับปรุงความชัดเจน)
// รองรับ: arm-raise-forward, leg-extension, trunk-sway
// แก้ไข: นำลูกศรทั้งหมดออก
// ========================================

class CanvasRenderer {
  constructor(canvasElement, videoElement) {
    this.canvas = canvasElement;
    this.video = videoElement;
    this.ctx = canvasElement.getContext("2d");
    this.isInitialized = false;

    this.UI = {
      lineWidth: 10,
      lineColor: "rgba(0, 229, 255, 1)",
      lineGlow: "rgba(0, 229, 255, 0.35)",
      focusRadius: 16,
      focusColor: "#00FF6A",
      focusBorder: "#FFFFFF",
      focusBorderWidth: 3,
      jointRadius: 9,
      jointColor: "rgba(255,255,255,0.95)",
      tubeW: 32,
      tubeH: 280,
      tubeTop: 100,
      tubePad: 18,
      tubeRight: 30,
      tubeBg: "rgba(0,0,0,0.65)",
      tubeBorder: "#FFFFFF",
      tubeBorderWidth: 3,
      tubeEmpty: "rgba(255,255,255,0.12)",
      tubeWarn: "#FFD600",
      tubeOk: "#00FF6A",
      tubeTargetLine: "#FF4444",
      tubeTargetLineWidth: 4,
      tubeLabelFont: "bold 18px Kanit, Arial, sans-serif",
      tubeLabelColor: "#FFFFFF",
      holdBarW: 14,
      holdBarGap: 10,
      hudW: 420,
      hudH: 110,
      hudX: 16,
      hudY: 16,
      hudBg: "rgba(0,0,0,0.72)",
      hudRadius: 14,
      hudBorderOk: "#00FF6A",
      hudBorderWarn: "#FFD600",
      hudBorderHold: "#00BFFF",
      hudBorderWidth: 3,
      fontMain: "bold 26px Kanit, Arial, sans-serif",
      fontSub: "bold 22px Kanit, Arial, sans-serif",
      textFill: "#FFFFFF",
      textStroke: "rgba(0,0,0,0.9)",
      textStrokeW: 5,
      swayZoneW: 110,
      swayZoneH: 260,
      swayZoneTopOffset: 50,
      swayZoneGap: 24,
      swayZoneBorderActive: "#FFD600",
      swayZoneBorderIdle: "rgba(255,255,255,0.5)",
      swayZoneFillActive: "rgba(255, 214, 0, 0.22)",
      swayZoneFillIdle: "rgba(255,255,255,0.07)",
      swayZoneLabelFont: "bold 20px Kanit, Arial, sans-serif",
      swayZoneLabelActive: "#FFD600",
      swayZoneLabelIdle: "rgba(255,255,255,0.6)",
    };

    this._pulseFrame = 0;
    this.setupCanvas();
  }

  setupCanvas() {
    if (!this.canvas || !this.video) return;
    const updateCanvasSize = () => {
      if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.isInitialized = true;
      } else {
        setTimeout(updateCanvasSize, 100);
      }
    };
    updateCanvasSize();
  }

  drawPoseResults(poseResults, analysis = null) {
    if (!this.isInitialized || !poseResults) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this._pulseFrame = (this._pulseFrame + 1) % 60;

    ctx.clearRect(0, 0, w, h);
    if (this.video && this.video.videoWidth > 0) {
      ctx.drawImage(this.video, 0, 0, w, h);
    }

    const lm = poseResults.poseLandmarks;
    if (!lm || lm.length === 0) return;

    const exercise = analysis?.exercise || null;
    const side = analysis?.currentSide || "left";

    // 1) โซน trunk-sway
    if (exercise === "trunk-sway") {
      this.drawTrunkSwayZones(lm, analysis);
    }

    // 2) เส้นโครงร่าง
    this.drawMinimalLines(lm, exercise, side);

    // 3) จุดข้อต่อ
    const focus = this.getFocusIndices(exercise, side);
    this.drawFocusJoints(lm, focus);

    // 4) หลอดความคืบหน้า
    if (analysis?.targetAngle) {
      this.drawProgressTube(
        analysis.currentAngle || 0,
        analysis.targetAngle,
        !!analysis.isHolding,
        analysis.holdProgress || 0
      );
    }

    // 5) HUD
    this.drawHUD(analysis);
  }

  isVisible(p) {
    return !!p && (p.visibility ?? 1) > 0.5;
  }

  px(p) {
    return { x: p.x * this.canvas.width, y: p.y * this.canvas.height };
  }

  outlineText(text, x, y) {
    const ctx = this.ctx;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  getFocusIndices(exercise, side = "left") {
    const L = { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 };
    const R = { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 };

    if (exercise === "arm-raise-forward")
      return side === "right" ? [R.shoulder, R.elbow, R.wrist] : [L.shoulder, L.elbow, L.wrist];

    if (exercise === "leg-extension")
      return side === "right" ? [R.hip, R.knee, R.ankle] : [L.hip, L.knee, L.ankle];

    if (exercise === "trunk-sway")
      return [0, 11, 12];

    return [11, 13, 15];
  }

  drawMinimalLines(lm, exercise, side = "left") {
    const ctx = this.ctx;
    const L = { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 };
    const R = { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 };

    let lines = [];
    if (exercise === "arm-raise-forward") {
      lines = side === "right"
        ? [[R.shoulder, R.elbow], [R.elbow, R.wrist]]
        : [[L.shoulder, L.elbow], [L.elbow, L.wrist]];
    } else if (exercise === "leg-extension") {
      lines = side === "right"
        ? [[R.hip, R.knee], [R.knee, R.ankle]]
        : [[L.hip, L.knee], [L.knee, L.ankle]];
    } else if (exercise === "trunk-sway") {
      lines = [[11, 12], [11, 23], [12, 24], [23, 24]];
    } else {
      lines = [[11, 13], [13, 15]];
    }

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const [a, b] of lines) {
      const pa = lm[a], pb = lm[b];
      if (!this.isVisible(pa) || !this.isVisible(pb)) continue;
      const A = this.px(pa), B = this.px(pb);

      ctx.strokeStyle = this.UI.lineGlow;
      ctx.lineWidth = this.UI.lineWidth + 10;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();

      ctx.strokeStyle = this.UI.lineColor;
      ctx.lineWidth = this.UI.lineWidth;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawFocusJoints(lm, focusIndices) {
    const ctx = this.ctx;
    ctx.save();

    for (const idx of focusIndices) {
      const p = lm[idx];
      if (!this.isVisible(p)) continue;
      const { x, y } = this.px(p);

      ctx.beginPath();
      ctx.arc(x, y, this.UI.focusRadius, 0, Math.PI * 2);
      ctx.fillStyle = this.UI.focusColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, this.UI.focusRadius, 0, Math.PI * 2);
      ctx.strokeStyle = this.UI.focusBorder;
      ctx.lineWidth = this.UI.focusBorderWidth;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, this.UI.jointRadius, 0, Math.PI * 2);
      ctx.fillStyle = this.UI.jointColor;
      ctx.fill();
    }

    ctx.restore();
  }

  drawProgressTube(currentValue, targetAngle, isHolding, holdProgress) {
    const ctx = this.ctx;
    const w = this.canvas.width;

    const x = w - this.UI.tubeRight - this.UI.tubeW;
    const y = this.UI.tubeTop;
    const H = this.UI.tubeH;
    const W = this.UI.tubeW;

    const min = targetAngle.min ?? 0;
    const max = targetAngle.max ?? (min + 1);

    const displayMax = max * 1.15;
    const clampedVal = Math.max(0, Math.min(displayMax, currentValue));
    const fillRatio = clampedVal / displayMax;

    const inTarget = currentValue >= min && currentValue <= max;
    const fillColor = inTarget ? this.UI.tubeOk : this.UI.tubeWarn;

    ctx.save();

    ctx.fillStyle = this.UI.tubeBg;
    const padX = x - this.UI.tubePad;
    const padY = y - this.UI.tubePad - 28;
    const padW = W + this.UI.tubePad * 2 + this.UI.holdBarGap + this.UI.holdBarW + 4;
    const padH = H + this.UI.tubePad * 2 + 52;
    this.roundRect(padX, padY, padW, padH, 10);
    ctx.fill();

    ctx.font = this.UI.tubeLabelFont;
    ctx.fillStyle = this.UI.tubeLabelColor;
    ctx.textAlign = "center";
    ctx.fillText("มุม", x + W / 2, y - 6);

    ctx.fillStyle = this.UI.tubeEmpty;
    ctx.fillRect(x, y, W, H);

    const fillH = H * fillRatio;
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y + (H - fillH), W, fillH);

    const targetMinRatio = min / displayMax;
    const targetMaxRatio = max / displayMax;
    const lineMinY = y + H - H * targetMinRatio;
    const lineMaxY = y + H - H * targetMaxRatio;

    ctx.fillStyle = "rgba(0, 255, 106, 0.18)";
    ctx.fillRect(x, lineMaxY, W, lineMinY - lineMaxY);

    ctx.strokeStyle = this.UI.tubeTargetLine;
    ctx.lineWidth = this.UI.tubeTargetLineWidth;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(x - 6, lineMinY);
    ctx.lineTo(x + W + 6, lineMinY);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.font = "bold 14px Kanit, Arial, sans-serif";
    ctx.fillStyle = this.UI.tubeTargetLine;
    ctx.textAlign = "right";
    ctx.fillText(`${min}°`, x - 8, lineMinY + 5);

    ctx.strokeStyle = this.UI.tubeBorder;
    ctx.lineWidth = this.UI.tubeBorderWidth;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, W, H);

    ctx.font = "bold 20px Kanit, Arial, sans-serif";
    ctx.fillStyle = fillColor;
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(currentValue)}°`, x + W / 2, y + H + 26);

    if (isHolding) {
      const hx = x + W + this.UI.holdBarGap;
      const hp = Math.max(0, Math.min(1, holdProgress / 100));
      const hh = H * hp;

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(hx, y, this.UI.holdBarW, H);

      ctx.fillStyle = this.UI.tubeOk;
      ctx.fillRect(hx, y + (H - hh), this.UI.holdBarW, hh);

      ctx.strokeStyle = this.UI.tubeBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(hx, y, this.UI.holdBarW, H);

      ctx.font = "bold 13px Kanit, Arial, sans-serif";
      ctx.fillStyle = this.UI.tubeLabelColor;
      ctx.textAlign = "center";
      ctx.fillText("hold", hx + this.UI.holdBarW / 2, y - 6);
    }

    ctx.textAlign = "left";
    ctx.restore();
  }

  // trunk-sway zones (ไม่มีลูกศร)
  drawTrunkSwayZones(lm, analysis) {
    const leftShoulder = lm[11];
    const rightShoulder = lm[12];
    if (!this.isVisible(leftShoulder) || !this.isVisible(rightShoulder)) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const centerX = ((leftShoulder.x + rightShoulder.x) / 2) * w;
    const topY = ((leftShoulder.y + rightShoulder.y) / 2) * h - this.UI.swayZoneTopOffset;

    const zoneW = this.UI.swayZoneW;
    const zoneH = this.UI.swayZoneH;
    const gap = this.UI.swayZoneGap;

    // selfie mode: zone "ซ้าย (ของผู้ใช้)" อยู่ขวาบนจอ
    const leftZoneX = centerX + gap;
    const rightZoneX = centerX - gap - zoneW;

    const side = analysis?.currentSide || "left";

    ctx.save();

    const zones = [
      { x: leftZoneX,  label: "ซ้าย", key: "left"  },
      { x: rightZoneX, label: "ขวา",  key: "right" },
    ];

    for (const zone of zones) {
      const isActive = zone.key === side;

      ctx.fillStyle = isActive ? this.UI.swayZoneFillActive : this.UI.swayZoneFillIdle;
      ctx.fillRect(zone.x, topY, zoneW, zoneH);

      ctx.strokeStyle = isActive ? this.UI.swayZoneBorderActive : this.UI.swayZoneBorderIdle;
      ctx.lineWidth = isActive ? 5 : 2;
      ctx.setLineDash(isActive ? [] : [8, 5]);
      ctx.strokeRect(zone.x, topY, zoneW, zoneH);
      ctx.setLineDash([]);

      ctx.font = this.UI.swayZoneLabelFont;
      ctx.fillStyle = isActive ? this.UI.swayZoneLabelActive : this.UI.swayZoneLabelIdle;
      ctx.textAlign = "center";
      ctx.fillText(zone.label, zone.x + zoneW / 2, topY - 10);
    }

    ctx.textAlign = "left";
    ctx.restore();
  }

  drawHUD(analysis) {
    if (!analysis) return;

    const ctx  = this.ctx;
    const ex   = analysis.exercise;
    const side = analysis.currentSide || "left";
    const target = analysis.targetAngle;
    const val  = Math.round(analysis.currentAngle || 0);

    let msg = "ทำตามกรอบ";
    if (ex === "arm-raise-forward")
      msg = side === "left" ? "⬆️ ยกแขนซ้ายไปข้างหน้า" : "⬆️ ยกแขนขวาไปข้างหน้า";
    if (ex === "leg-extension")
      msg = side === "left" ? "⬆️ เหยียดขาซ้ายให้ตรง" : "⬆️ เหยียดขาขวาให้ตรง";
    if (ex === "trunk-sway")
      msg = side === "left" ? "↩️ เอียงตัวไปทางซ้าย" : "↪️ เอียงตัวไปทางขวา";

    let inTarget = false;
    if (target) inTarget = val >= (target.min ?? -999) && val <= (target.max ?? 999);

    let statusText, borderColor;
    if (analysis.isHolding) {
      statusText  = "✅ คงท่าไว้ดีมาก!";
      borderColor = this.UI.hudBorderHold;
    } else if (inTarget) {
      statusText  = "✅ ถูกต้อง — คงท่าไว้";
      borderColor = this.UI.hudBorderOk;
    } else {
      statusText  = "⬆️ ไปให้ถึงเส้นแดง";
      borderColor = this.UI.hudBorderWarn;
    }

    const hx = this.UI.hudX;
    const hy = this.UI.hudY;
    const hw = this.UI.hudW;
    const hh = this.UI.hudH;
    const r  = this.UI.hudRadius;

    ctx.save();

    ctx.fillStyle = this.UI.hudBg;
    this.roundRect(hx, hy, hw, hh, r);
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = this.UI.hudBorderWidth;
    this.roundRect(hx, hy, hw, hh, r);
    ctx.stroke();

    ctx.font        = this.UI.fontMain;
    ctx.fillStyle   = this.UI.textFill;
    ctx.strokeStyle = this.UI.textStroke;
    ctx.lineWidth   = this.UI.textStrokeW;
    this.outlineText(msg, hx + 14, hy + 38);

    ctx.font      = this.UI.fontSub;
    ctx.fillStyle = borderColor;
    this.outlineText(statusText, hx + 14, hy + 80);

    ctx.restore();
  }

  captureScreenshot() {
    if (!this.isInitialized) return null;
    try { return this.canvas.toDataURL("image/png"); }
    catch { return null; }
  }

  clear() {
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize() { this.setupCanvas(); }

  destroy() {
    this.clear();
    this.canvas = null;
    this.video  = null;
    this.ctx    = null;
    this.isInitialized = false;
  }
}

window.CanvasRenderer = CanvasRenderer;
console.log("✅ CanvasRenderer loaded");
