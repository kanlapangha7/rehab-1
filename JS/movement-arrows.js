// ========================================
// ระบบลูกศรแนะนำท่าทาง (Movement Guide Arrows)
// movement-arrows.js
// ========================================

class MovementArrowGuide {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.arrowConfig = {
            // การตั้งค่าลูกศร
            size: 60,           // ขนาดลูกศร
            lineWidth: 6,       // ความหนาเส้น
            color: '#FFFFFF',   // สีขาว
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            shadowBlur: 10,
            
            // Animation
            pulseSpeed: 0.05,   // ความเร็วของการเต้น
            pulseMin: 0.8,      // ขนาดต่ำสุดเมื่อเต้น
            pulseMax: 1.2,      // ขนาดสูงสุดเมื่อเต้น
            
            // ระยะห่างจาก landmark
            offset: 100
        };
        
        this.animationFrame = 0;
    }
    
    // ฟังก์ชันหลักสำหรับวาดลูกศรตามท่าต่างๆ
    drawExerciseArrows(landmarks, exerciseId, currentAngle, targetAngle, currentSide = 'left') {
        if (!landmarks || !exerciseId) return;
        
        this.animationFrame += this.arrowConfig.pulseSpeed;
        const pulseFactor = Math.sin(this.animationFrame) * 
                           (this.arrowConfig.pulseMax - this.arrowConfig.pulseMin) / 2 + 
                           (this.arrowConfig.pulseMax + this.arrowConfig.pulseMin) / 2;
        
        switch (exerciseId) {
            case 'arm-raise-forward':
                this.drawArmRaiseArrows(landmarks, currentAngle, targetAngle, currentSide, pulseFactor);
                break;
            case 'leg-extension':
                this.drawLegExtensionArrows(landmarks, currentAngle, targetAngle, pulseFactor);
                break;
            case 'trunk-sway':
                this.drawTrunkSwayArrows(landmarks, currentAngle, targetAngle, currentSide, pulseFactor);
                break;
            case 'neck-tilt':
                this.drawNeckTiltArrows(landmarks, currentAngle, targetAngle, currentSide, pulseFactor);
                break;
        }
    }
    
    // ลูกศรสำหรับ "ยกแขนไปข้างหน้า"
    drawArmRaiseArrows(landmarks, currentAngle, targetAngle, currentSide, pulseFactor) {
        const isInTarget = currentAngle >= targetAngle.min && currentAngle <= targetAngle.max;
        
        if (isInTarget) {
            // ถ้าถึงเป้าแล้ว แสดงลูกศรลง (ให้กลับลงสู่ท่าเริ่มต้น)
            this.drawArmDownArrow(landmarks, currentSide, pulseFactor, '#00FF00');
        } else if (currentAngle < targetAngle.min) {
            // ถ้ายังไม่ถึง แสดงลูกศรขึ้น
            this.drawArmUpArrow(landmarks, currentSide, pulseFactor, '#FFFF00');
        }
    }
    
    // ลูกศรขึ้น (ยกแขน)
    drawArmUpArrow(landmarks, side, pulseFactor, color = '#FFFFFF') {
        const shoulderIndex = side === 'left' ? 11 : 12;
        const wristIndex = side === 'left' ? 15 : 16;
        
        const shoulder = landmarks[shoulderIndex];
        const wrist = landmarks[wristIndex];
        
        if (!shoulder || !wrist) return;
        
        const x = wrist.x * this.canvas.width;
        const y = wrist.y * this.canvas.height - this.arrowConfig.offset;
        
        // วาดลูกศรชี้ขึ้น
        this.drawArrow(x, y, 'up', pulseFactor, color);
        
        // แสดงข้อความ
        this.drawText('ยกขึ้น', x, y - 50, color);
    }
    
    // ลูกศรลง (ลดแขน)
    drawArmDownArrow(landmarks, side, pulseFactor, color = '#FFFFFF') {
        const shoulderIndex = side === 'left' ? 11 : 12;
        const wristIndex = side === 'left' ? 15 : 16;
        
        const shoulder = landmarks[shoulderIndex];
        const wrist = landmarks[wrist];
        
        if (!shoulder || !wrist) return;
        
        const x = wrist.x * this.canvas.width;
        const y = wrist.y * this.canvas.height + this.arrowConfig.offset;
        
        // วาดลูกศรชี้ลง
        this.drawArrow(x, y, 'down', pulseFactor, color);
        
        // แสดงข้อความ
        this.drawText('ลงลง', x, y + 70, color);
    }
    
    // ลูกศรสำหรับ "เหยียดเข่าตรง"
    drawLegExtensionArrows(landmarks, currentAngle, targetAngle, pulseFactor) {
        const isInTarget = currentAngle >= targetAngle.min && currentAngle <= targetAngle.max;
        
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];
        
        if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return;
        
        if (isInTarget) {
            // แสดงลูกศรงอเข่า (กลับสู่ท่าเริ่มต้น)
            this.drawLegBendArrow(landmarks, 'left', pulseFactor, '#00FF00');
            this.drawLegBendArrow(landmarks, 'right', pulseFactor, '#00FF00');
        } else {
            // แสดงลูกศรยืดตรง
            this.drawLegStraightenArrow(landmarks, 'left', pulseFactor, '#FFFF00');
            this.drawLegStraightenArrow(landmarks, 'right', pulseFactor, '#FFFF00');
        }
    }
    
    // ลูกศรยืดขา
    drawLegStraightenArrow(landmarks, side, pulseFactor, color) {
        const ankleIndex = side === 'left' ? 27 : 28;
        const ankle = landmarks[ankleIndex];
        
        if (!ankle) return;
        
        const x = ankle.x * this.canvas.width;
        const y = ankle.y * this.canvas.height;
        
        // ลูกศรชี้ลง (ยืดขา)
        this.drawArrow(x + 80, y, 'down', pulseFactor, color);
        this.drawText('ยืดตรง', x + 80, y + 70, color);
    }
    
    // ลูกศรงอเข่า
    drawLegBendArrow(landmarks, side, pulseFactor, color) {
        const ankleIndex = side === 'left' ? 27 : 28;
        const ankle = landmarks[ankleIndex];
        
        if (!ankle) return;
        
        const x = ankle.x * this.canvas.width;
        const y = ankle.y * this.canvas.height;
        
        // ลูกศรชี้ขึ้น (งอเข่า)
        this.drawArrow(x + 80, y, 'up', pulseFactor, color);
        this.drawText('งอเข่า', x + 80, y - 50, color);
    }
    
    // ลูกศรสำหรับ "โยกลำตัวซ้าย-ขวา"
    drawTrunkSwayArrows(landmarks, currentAngle, targetAngle, currentSide, pulseFactor) {
        const isInTarget = currentAngle >= targetAngle.min && currentAngle <= targetAngle.max;
        
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        
        if (!leftShoulder || !rightShoulder) return;
        
        const centerX = ((leftShoulder.x + rightShoulder.x) / 2) * this.canvas.width;
        const centerY = ((leftShoulder.y + rightShoulder.y) / 2) * this.canvas.height;
        
        if (isInTarget) {
            // กลับกลาง
            this.drawArrow(centerX, centerY - 100, 'center', pulseFactor, '#00FF00');
            this.drawText('กลับกลาง', centerX, centerY - 150, '#00FF00');
        } else {
            // โยกไปข้างที่กำลังทำ
            if (currentSide === 'left') {
                this.drawArrow(centerX - 150, centerY, 'left', pulseFactor, '#FFFF00');
                this.drawText('โยกซ้าย', centerX - 150, centerY - 50, '#FFFF00');
            } else {
                this.drawArrow(centerX + 150, centerY, 'right', pulseFactor, '#FFFF00');
                this.drawText('โยกขวา', centerX + 150, centerY - 50, '#FFFF00');
            }
        }
    }
    
    // ลูกศรสำหรับ "เอียงศีรษะซ้าย-ขวา"
    drawNeckTiltArrows(landmarks, currentAngle, targetAngle, currentSide, pulseFactor) {
        const isInTarget = currentAngle >= targetAngle.min && currentAngle <= targetAngle.max;
        
        const nose = landmarks[0];
        
        if (!nose) return;
        
        const x = nose.x * this.canvas.width;
        const y = nose.y * this.canvas.height;
        
        if (isInTarget) {
            // กลับกลาง
            this.drawArrow(x, y - 120, 'center', pulseFactor, '#00FF00');
            this.drawText('กลับกลาง', x, y - 170, '#00FF00');
        } else {
            // เอียงไปข้างที่กำลังทำ
            if (currentSide === 'left') {
                this.drawArrow(x - 100, y - 80, 'left', pulseFactor, '#FFFF00');
                this.drawText('เอียงซ้าย', x - 100, y - 130, '#FFFF00');
            } else {
                this.drawArrow(x + 100, y - 80, 'right', pulseFactor, '#FFFF00');
                this.drawText('เอียงขวา', x + 100, y - 130, '#FFFF00');
            }
        }
    }
    
    // ฟังก์ชันวาดลูกศรพื้นฐาน
    drawArrow(x, y, direction, scale = 1, color = '#FFFFFF') {
        const size = this.arrowConfig.size * scale;
        const ctx = this.ctx;
        
        ctx.save();
        
        // เงา
        ctx.shadowColor = this.arrowConfig.shadowColor;
        ctx.shadowBlur = this.arrowConfig.shadowBlur;
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = this.arrowConfig.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        
        switch (direction) {
            case 'up':
                // เส้นตัว
                ctx.moveTo(x, y + size / 2);
                ctx.lineTo(x, y - size / 2);
                // หัวลูกศร
                ctx.moveTo(x - size / 3, y - size / 6);
                ctx.lineTo(x, y - size / 2);
                ctx.lineTo(x + size / 3, y - size / 6);
                break;
                
            case 'down':
                // เส้นตัว
                ctx.moveTo(x, y - size / 2);
                ctx.lineTo(x, y + size / 2);
                // หัวลูกศร
                ctx.moveTo(x - size / 3, y + size / 6);
                ctx.lineTo(x, y + size / 2);
                ctx.lineTo(x + size / 3, y + size / 6);
                break;
                
            case 'left':
                // เส้นตัว
                ctx.moveTo(x + size / 2, y);
                ctx.lineTo(x - size / 2, y);
                // หัวลูกศร
                ctx.moveTo(x - size / 6, y - size / 3);
                ctx.lineTo(x - size / 2, y);
                ctx.lineTo(x - size / 6, y + size / 3);
                break;
                
            case 'right':
                // เส้นตัว
                ctx.moveTo(x - size / 2, y);
                ctx.lineTo(x + size / 2, y);
                // หัวลูกศร
                ctx.moveTo(x + size / 6, y - size / 3);
                ctx.lineTo(x + size / 2, y);
                ctx.lineTo(x + size / 6, y + size / 3);
                break;
                
            case 'center':
                // ลูกศรสองทิศทาง (←→ หรือ ↑↓)
                // ลูกศรซ้าย
                ctx.moveTo(x - size / 4, y - size / 6);
                ctx.lineTo(x - size / 2, y);
                ctx.lineTo(x - size / 4, y + size / 6);
                // ลูกศรขวา
                ctx.moveTo(x + size / 4, y - size / 6);
                ctx.lineTo(x + size / 2, y);
                ctx.lineTo(x + size / 4, y + size / 6);
                // เส้นกลาง
                ctx.moveTo(x - size / 2, y);
                ctx.lineTo(x + size / 2, y);
                break;
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    // ฟังก์ชันวาดข้อความ
    drawText(text, x, y, color = '#FFFFFF') {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.font = 'bold 24px Kanit, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // เงาข้อความ
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(text, x, y);
        ctx.restore();
    }
}

// ส่งออกเป็น global
window.MovementArrowGuide = MovementArrowGuide;

console.log('✅ movement-arrows.js โหลดเรียบร้อยแล้ว');