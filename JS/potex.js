// ========================================
// ระบบตรวจจับท่าทางที่แก้ไขใหม่ทั้งหมด
// potex-fixed.js
// ========================================
const API_CONFIG = {
    RENDER_URL: 'https://bn1-1.onrender.com',
    LOCAL_URL: 'http://localhost:4000',
    BASE_URL: 'https://bn1-1.onrender.com',  // ✅ แก้ไข
    TIMEOUT: 10000
};

// Global Variables
let physioApp = null;
let canvasRenderer = null;
let sessionStartTime = null;
let currentReps = 0;
let targetReps = 10;
let totalAccuracy = 0;
let repAccuracyCount = 0;
let isComplete = false;
// DOM Elements
const elements = {
    video: document.getElementById('input-video'),
    canvas: document.getElementById('output-canvas'),
    loadingOverlay: document.getElementById('loading-overlay'),
    successFlash: document.getElementById('success-flash'),
    exerciseTitle: document.getElementById('exercise-title'),
    repCounter: document.getElementById('rep-counter'),
    targetRepsElement: document.getElementById('target-reps'),
    statusMessage: document.getElementById('status-message'),
    completeOverlay: document.getElementById('complete-overlay')
};

// MediaPipe Pose Connections
const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
    [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [27, 29], [27, 31],
    [24, 26], [26, 28], [28, 30], [28, 32]
];

// การตั้งค่าท่าทางที่แก้ไขใหม่
const EXERCISE_CONFIG = {
    'arm-raise-forward': {
        name: 'ท่ายกแขนไปข้างหน้า',
        targetAngle: { min: 70, max: 100 },
        restAngle: { min: 0, max: 30 },
        landmarks: {
            shoulder: [11, 12],
            elbow: [13, 14],
            wrist: [15, 16]
        },
        requiredVisibility: 0.6,
        holdDuration: 1000,
        alternating: true, // เพิ่ม flag สำหรับการสลับข้าง
        feedback: {
            tooLow: 'ยกแขนให้สูงขึ้น ⬆️',
            tooHigh: 'ลดแขนลงเล็กน้อย ⬇️',
            perfect: 'ดีมาก! คงท่านี้ ✅',
            hold: 'คงท่า... {progress}%',
            nextSide: 'ดีมาก! ตอนนี้ยก{side} 👍'
        }
    },
    'leg-extension': {
        name: 'ท่าเหยียดเข่าตรง',
        targetAngle: { min: 160, max: 180 },
        restAngle: { min: 60, max: 120 },  // ✅ ขยายช่วงพัก
        landmarks: {
            hip: [23, 24],
            knee: [25, 26],
            ankle: [27, 28]
        },
        requiredVisibility: 0.6,
        holdDuration: 5000,
        alternating: true,
        feedback: {
            tooLow: 'เหยียดเข่าให้มากขึ้น ⬆️',
            tooHigh: 'เข่าตรงแล้ว ดีมาก ✅',
            perfect: 'ยอดเยี่ยม! คงท่า ✅',
            hold: 'กำลังคงท่า... {progress}%',
            nextSide: 'ดีมาก! ตอนนี้ยก{side} 👍'
        }
    },
    'trunk-sway': {
        name: 'ท่าโยกลำตัวซ้าย-ขวา',
        targetAngle: { min: 18, max: 32 }, // ลดระยะห่างขั้นต่ำ เพิ่มช่วงให้กว้าง
        restAngle: { min: 0, max: 100 }, // เพิ่มช่วงพักให้กว้าง
        landmarks: {
            shoulder: [11, 12],
            hip: [23, 24],
            nose: [0] // เพิ่มจมูกสำหรับตรวจจับ
        },
        requiredVisibility: 0.5, // ลดจาก 0.6 เป็น 0.5
        holdDuration: 800, // ลดจาก 2000 เหลือ 800ms (0.8 วินาที)
        useHeadPosition: true, // ใช้ตำแหน่งหัวแทนมุม
        alternating: true,
        feedback: {
            tooLow: 'โยกให้มากขึ้น ↔️',
            tooHigh: 'โยกพอดีแล้ว ✅',
            perfect: 'ดีแล้ว! คงท่า ✅',
            hold: 'คงท่า... {progress}%',
            nextSide: 'ดีมาก! ตอนนี้โยก{side} 👍'
        }
    }
};

// ระบบตรวจจับท่าทางที่แก้ไขใหม่
class ImprovedPoseDetector {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.isRunning = false;
        this.currentExercise = null;
        this.config = null;
        this.kalmanFilter = null;
        this.exerciseState = {
            phase: 'rest',
            lastAngle: 0,
            smoothedAngle: 0,
            movementStarted: false,
            holdStartTime: null,
            isHolding: false,
            holdProgress: 0,
            lastDirection: null,
            currentSide: 'left', // เพิ่มตัวแปรเก็บข้างปัจจุบัน
            accuracy: 0,
            consecutiveGoodFrames: 0,
            requiredGoodFrames: 45, 
            angleHistory: [],
            repCounted: false,
            lastCount: 0   // เพิ่มตัวนี้

        };
    }

    async initialize() {
        try {
            console.log('🚀 กำลังตั้งค่าระบบตรวจจับท่าทาง...');
            
            await this.waitForMediaPipe();
            
            this.pose = new Pose({
                locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
            });

           this.pose.setOptions({
            modelComplexity: StrokeConfig.CONFIG.MEDIAPIPE.MODEL_COMPLEXITY,
            smoothLandmarks: StrokeConfig.CONFIG.MEDIAPIPE.SMOOTH_LANDMARKS,
            enableSegmentation: StrokeConfig.CONFIG.MEDIAPIPE.ENABLE_SEGMENTATION,
            minDetectionConfidence: StrokeConfig.CONFIG.MEDIAPIPE.MIN_DETECTION_CONFIDENCE,
            minTrackingConfidence: StrokeConfig.CONFIG.MEDIAPIPE.MIN_TRACKING_CONFIDENCE,
        });


            this.pose.onResults(results => this.onResults(results));
            await this.setupCamera();
            
            console.log('✅ ระบบพร้อมใช้งาน');
            return true;
        } catch (error) {
            console.error('❌ Error initializing:', error);
            return false;
        }
    }

    async waitForMediaPipe() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkLibraries = () => {
                attempts++;
                if (window.Pose && window.Camera && window.drawConnectors && window.drawLandmarks) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('MediaPipe libraries failed to load'));
                } else {
                    setTimeout(checkLibraries, 200);
                }
            };
            
            checkLibraries();
        });
    }

    async setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                    frameRate: { ideal: 30 }
                },
                audio: false
            });

            elements.video.srcObject = stream;

            return new Promise(resolve => {
                elements.video.onloadedmetadata = () => {
                    elements.video.play();
                    this.setupCanvasSize();
                    
                    this.camera = new Camera(elements.video, {
                        onFrame: async () => {
                            if (this.pose && this.isRunning) {
                                await this.pose.send({ image: elements.video });
                            }
                        },
                        width: 1280,
                        height: 720
                    });
                    
                    resolve();
                };
            });
        } catch (error) {
            throw new Error('ไม่สามารถเข้าถึงกล้องได้');
        }
    }

    setupCanvasSize() {
        if (elements.video.videoWidth > 0 && elements.video.videoHeight > 0) {
            elements.canvas.width = elements.video.videoWidth;
            elements.canvas.height = elements.video.videoHeight;
        } else {
            elements.canvas.width = 1280;
            elements.canvas.height = 720;
        }
        
        console.log(`Canvas size: ${elements.canvas.width}x${elements.canvas.height}`);
    }

    async start() {
        if (!this.camera) throw new Error('กล้องไม่พร้อม');
        this.isRunning = true;
        await this.camera.start();
        elements.loadingOverlay.style.display = 'none';
        sessionStartTime = Date.now();
        console.log('🎥 เริ่มการตรวจจับ');
    }

    selectExercise(exerciseId) {
        this.currentExercise = exerciseId;
        this.config = EXERCISE_CONFIG[exerciseId];
        
        if (!this.config) {
            console.error('❌ ไม่พบการตั้งค่าสำหรับท่า:', exerciseId);
            return false;
        }

        // สร้าง Kalman Filter
        if (window.KalmanFilter) {
            this.kalmanFilter = new window.KalmanFilter(0.01, 0.1);
        }

        console.log('✅ เลือกท่า:', this.config.name);
        return true;
    }

    onResults(results) {
        if (!this.isRunning || !results.poseLandmarks) return;

        try {
            // คำนวณมุมท่าทาง
            const angle = this.calculateExerciseAngle(results.poseLandmarks);
            
            if (angle === null) {
                updateStatusMessage('ไม่สามารถตรวจจับท่าได้ กรุณาอยู่ในกรอบ');
                return;
            }

            // Smooth angle ด้วย Kalman Filter
            const smoothedAngle = this.kalmanFilter ? 
                this.kalmanFilter.filter(angle) : angle;

            this.exerciseState.smoothedAngle = Math.round(smoothedAngle);
            this.exerciseState.lastAngle = smoothedAngle;

            // เก็บประวัติมุม
            this.exerciseState.angleHistory.push(smoothedAngle);
            if (this.exerciseState.angleHistory.length > 10) {
                this.exerciseState.angleHistory.shift();
            }

            // ตรวจจับการเคลื่อนไหว
            this.detectMovement();

            // อัพเดท UI
            const analysisData = {
                exercise: this.currentExercise,
                phase: this.exerciseState.phase,
                currentAngle: this.exerciseState.smoothedAngle,
                targetAngle: this.config.targetAngle,
                accuracy: this.exerciseState.accuracy,
                reps: currentReps,
                targetReps: targetReps,
                isHolding: this.exerciseState.isHolding,
                holdProgress: this.exerciseState.holdProgress,
                currentSide: this.exerciseState.currentSide, // เพิ่มข้อมูลข้างปัจจุบัน
                leftAngle: this.exerciseState.leftAngle || 0,
                rightAngle: this.exerciseState.rightAngle || 0
            };

            // วาดผลลัพธ์บน canvas
            if (canvasRenderer) {
                canvasRenderer.drawPoseResults(results, analysisData);
            }

            // อัพเดทข้อความสถานะ
            updateStatusMessage(this.getStatusMessage());

        } catch (error) {
            console.warn('⚠️ Error in onResults:', error);
        }
    }

    // ⭐ ฟังก์ชันคำนวณมุมตามท่าทาง
    calculateExerciseAngle(landmarks) {
        if (!this.currentExercise || !this.config) return null;

        switch (this.currentExercise) {
            case 'arm-raise-forward':
                return this.calculateArmRaiseAngle(landmarks);
            case 'leg-extension':
                return this.calculateLegExtensionAngle(landmarks);
            case 'trunk-sway':
                return this.calculateTrunkSwayAngle(landmarks);
            case 'neck-tilt':
                return this.calculateNeckTiltAngle(landmarks);
            default:
                return null;
        }
    }

    // คำนวณมุมยกแขน - รองรับการสลับซ้าย-ขวา
    calculateArmRaiseAngle(landmarks) {
        const leftShoulder = landmarks[11];
        const leftElbow = landmarks[13];
        const leftWrist = landmarks[15];
        const leftHip = landmarks[23];

        const rightShoulder = landmarks[12];
        const rightElbow = landmarks[14];
        const rightWrist = landmarks[16];
        const rightHip = landmarks[24];

        // ตรวจสอบ visibility ของทั้งสองข้าง
        const leftVisible = this.checkLandmarksVisibility([leftShoulder, leftElbow, leftWrist, leftHip]);
        const rightVisible = this.checkLandmarksVisibility([rightShoulder, rightElbow, rightWrist, rightHip]);

        if (!leftVisible && !rightVisible) {
            return null;
        }

        let leftAngle = 0;
        let rightAngle = 0;

        // คำนวณมุมแขนซ้าย
        if (leftVisible) {
            const angle1 = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
            const angle2 = this.calculateAngle(leftHip, leftShoulder, leftElbow);
            leftAngle = Math.min(angle1, angle2);
        }

        // คำนวณมุมแขนขวา
        if (rightVisible) {
            const angle1 = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
            const angle2 = this.calculateAngle(rightHip, rightShoulder, rightElbow);
            rightAngle = Math.min(angle1, angle2);
        }

        // เก็บข้อมูลทั้งสองข้างไว้ใน state
        this.exerciseState.leftAngle = leftAngle;
        this.exerciseState.rightAngle = rightAngle;

        // สำหรับท่าที่ต้องสลับข้าง ให้ส่งค่ามุมของข้างที่ควรทำ
        if (this.config.alternating) {
            return this.exerciseState.currentSide === 'left' ? leftAngle : rightAngle;
        }

        // ถ้าไม่ต้องสลับ ส่งค่ามุมที่มากกว่า (ยกสูงกว่า)
        return Math.max(leftAngle, rightAngle);
    }

    // คำนวณมุมเหยียดเข่า - รองรับการสลับข้าง
    calculateLegExtensionAngle(landmarks) {
        const leftHip = landmarks[23];
        const leftKnee = landmarks[25];
        const leftAnkle = landmarks[27];

        const rightHip = landmarks[24];
        const rightKnee = landmarks[26];
        const rightAnkle = landmarks[28];

        // ตรวจสอบ visibility ของทั้งสองข้าง
        const leftVisible = this.checkLandmarksVisibility([leftHip, leftKnee, leftAnkle]);
        const rightVisible = this.checkLandmarksVisibility([rightHip, rightKnee, rightAnkle]);

        if (!leftVisible && !rightVisible) {
            return null;
        }

        let leftAngle = 0;
        let rightAngle = 0;

        // คำนวณมุมขาซ้าย
        if (leftVisible) {
            leftAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
        }

        // คำนวณมุมขาขวา
        if (rightVisible) {
            rightAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
        }

        // เก็บข้อมูลทั้งสองข้างไว้ใน state
        this.exerciseState.leftAngle = leftAngle;
        this.exerciseState.rightAngle = rightAngle;

        // สำหรับท่าที่ต้องสลับข้าง ให้ส่งค่ามุมของข้างที่ควรทำ
        if (this.config.alternating) {
            return this.exerciseState.currentSide === 'left' ? leftAngle : rightAngle;
        }

        // ถ้าไม่ต้องสลับ ส่งค่ามุมที่มากกว่า
        return Math.max(leftAngle, rightAngle);
    }

    // คำนวณมุมโยกลำตัว - ใช้ตำแหน่งหัวแทนมุม
    calculateTrunkSwayAngle(landmarks) {
        const nose = landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];

        if (!this.checkLandmarksVisibility([nose, leftShoulder, rightShoulder, leftHip, rightHip])) {
            return null;
        }

        // ถ้าใช้ระบบตรวจจับตำแหน่งหัว
        if (this.config.useHeadPosition) {
            // คำนวณจุดกลางของลำตัว (กึ่งกลางระหว่างไหล่)
            const centerX = (leftShoulder.x + rightShoulder.x) / 2;
            
            // คำนวณระยะห่างของหัวจากจุดกลาง (แกน X)
            const headOffsetX = nose.x - centerX;
            
            // เก็บทิศทางการเอียง
            // headOffsetX < 0 = เอียงซ้าย (ในกล้องหน้า)
            // headOffsetX > 0 = เอียงขวา
            this.exerciseState.swayDirection = headOffsetX < 0 ? 'left' : 'right';
            
            // คำนวณระยะห่างเป็น pixels (สำหรับเปรียบเทียบกับ targetDistance)
            const distance = Math.abs(headOffsetX) * 1000; // คูณ 1000 เพื่อแปลงเป็น pixels โดยประมาณ
            
            // สำหรับท่าที่ต้องสลับข้าง
            if (this.config.alternating) {
                // ตรวจสอบว่าเอียงไปทิศทางที่ถูกต้องหรือไม่
                const correctDirection = this.exerciseState.swayDirection === this.exerciseState.currentSide;
                
                // ถ้าเอียงถูกทิศทาง ส่งค่าระยะห่าง, ถ้าไม่ถูก ส่ง 0
                return correctDirection ? distance : 0;
            }
            
            return distance;
        }

        // ถ้าไม่ใช้ระบบตำแหน่งหัว ใช้มุมแบบเดิม
        const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
        const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipCenterX = (leftHip.x + rightHip.x) / 2;
        const hipCenterY = (leftHip.y + rightHip.y) / 2;

        const deltaX = shoulderCenterX - hipCenterX;
        const deltaY = shoulderCenterY - hipCenterY;
        const angleDeg = Math.abs(Math.atan2(deltaX, deltaY) * (180 / Math.PI));

        this.exerciseState.swayDirection = deltaX < 0 ? 'left' : 'right';

        if (this.config.alternating) {
            const correctDirection = this.exerciseState.swayDirection === this.exerciseState.currentSide;
            return correctDirection ? angleDeg : 0;
        }

        return angleDeg;
    }

    // คำนวณมุมเอียงศีรษะ - ใช้ตำแหน่งหัวแทนมุม
    calculateNeckTiltAngle(landmarks) {
        const nose = landmarks[0];
        const leftEar = landmarks[7];
        const rightEar = landmarks[8];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        if (!this.checkLandmarksVisibility([nose, leftEar, rightEar, leftShoulder, rightShoulder])) {
            return null;
        }

        // ถ้าใช้ระบบตรวจจับตำแหน่งหัว
        if (this.config.useHeadPosition) {
            // คำนวณจุดกลางของไหล่
            const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
            
            // คำนวณระยะห่างของหัวจากจุดกลางไหล่ (แกน X)
            const headOffsetX = nose.x - shoulderCenterX;
            
            // เก็บทิศทางการเอียง
            this.exerciseState.tiltDirection = headOffsetX < 0 ? 'left' : 'right';
            
            // คำนวณระยะห่างเป็น pixels
            const distance = Math.abs(headOffsetX) * 1000;
            
            // สำหรับท่าที่ต้องสลับข้าง
            if (this.config.alternating) {
                const correctDirection = this.exerciseState.tiltDirection === this.exerciseState.currentSide;
                return correctDirection ? distance : 0;
            }
            
            return distance;
        }

        // ถ้าไม่ใช้ระบบตำแหน่งหัว ใช้มุมแบบเดิม
        const headCenterX = (leftEar.x + rightEar.x) / 2;
        const headCenterY = (leftEar.y + rightEar.y) / 2;

        const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
        const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;

        const deltaX = headCenterX - shoulderCenterX;
        const deltaY = headCenterY - shoulderCenterY;
        const angleDeg = Math.abs(Math.atan2(deltaX, deltaY) * (180 / Math.PI));

        this.exerciseState.tiltDirection = deltaX < 0 ? 'left' : 'right';

        if (this.config.alternating) {
            const correctDirection = this.exerciseState.tiltDirection === this.exerciseState.currentSide;
            return correctDirection ? angleDeg : 0;
        }

        return angleDeg;
    }

    // ฟังก์ชันคำนวณมุมระหว่างจุด 3 จุด
    calculateAngle(point1, point2, point3) {
        const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) - 
                        Math.atan2(point1.y - point2.y, point1.x - point2.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        
        if (angle > 180.0) {
            angle = 360 - angle;
        }
        
        return angle;
    }

    // ตรวจสอบ visibility ของ landmarks
    checkLandmarksVisibility(landmarks) {
        return landmarks.every(lm => 
            lm && lm.visibility > this.config.requiredVisibility
        );
    }

    // ⭐ ตรวจจับการเคลื่อนไหว - รองรับการสลับข้าง
detectMovement() {
    const angle = this.exerciseState.smoothedAngle;
    const target = this.config.targetAngle;
    const rest = this.config.restAngle;

    const inTargetRange = angle >= target.min && angle <= target.max;
    const inRestRange = angle >= rest.min && angle <= rest.max;

    if (inTargetRange) {
        this.exerciseState.consecutiveGoodFrames++;

        if (!this.exerciseState.isHolding) {
            speakCooldown(this, "enterTarget", "ดีมาก คงท่าไว้", 1800);
            this.exerciseState.isHolding = true;
            this.exerciseState.holdStartTime = Date.now();
            this.exerciseState.phase = "holding";
        }

        if (this.exerciseState.holdStartTime) {
            const holdTime = Date.now() - this.exerciseState.holdStartTime;
            const seconds = Math.floor(holdTime / 1000);

            if (seconds > this.exerciseState.lastCount) {
                this.exerciseState.lastCount = seconds;
                if (seconds <= 5) {
                    speak(seconds.toString());
                }
            }

            this.exerciseState.holdProgress = Math.min(
                100,
                (holdTime / this.config.holdDuration) * 100
            );

            if (holdTime >= this.config.holdDuration && !this.exerciseState.repCounted) {
                this.exerciseState.repCounted = true;

                if (this.config.alternating) {
                    this.incrementRep();

                    if (this.exerciseState.currentSide === "left") {
                        this.exerciseState.currentSide = "right";
                        speakCooldown(this, "switchSide", "สลับข้างขวา", 1200);
                    } else {
                        this.exerciseState.currentSide = "left";
                        speakCooldown(this, "switchSide", "สลับข้างซ้าย", 1200);
                    }
                } else {
                    this.incrementRep();
                }
            }
        }

        const targetCenter = (target.min + target.max) / 2;
        const deviation = Math.abs(angle - targetCenter);
        const maxDeviation = (target.max - target.min) / 2;
        this.exerciseState.accuracy = Math.max(0, 100 - (deviation / maxDeviation) * 100);

    } else {
        if (!inRestRange) {
            if (angle < target.min - 10) {
                speakCooldown(this, "tooLow", "ยกให้สูงขึ้น", 1600);
            } else if (angle > target.max + 10) {
                speakCooldown(this, "tooHigh", "ลดลงนิดนึง", 1600);
            }
        }

        // ✅ รีเซ็ต lastCount เมื่อออกจากท่า
        if (this.exerciseState.isHolding) {
            this.exerciseState.isHolding = false;
            this.exerciseState.holdStartTime = null;
            this.exerciseState.holdProgress = 0;
            this.exerciseState.lastCount = 0;  // ✅ เพิ่ม
        }

        if (inRestRange && this.exerciseState.repCounted) {
            this.exerciseState.repCounted = false;
            this.exerciseState.consecutiveGoodFrames = 0;
            this.exerciseState.phase = "rest";
            this.exerciseState.lastCount = 0;  // ✅ เพิ่ม (รีเซ็ตอีกครั้งตอนกลับท่าพัก)
            speakCooldown(this, "backToRest", "เตรียมพร้อม", 2000);

        } else if (!inRestRange) {
            this.exerciseState.phase = "moving";
        }
    }
}
    getStatusMessage() {
        if (!this.config) return '';
        
        const state = this.exerciseState;
        const angle = state.smoothedAngle;
        const target = this.config.targetAngle;
        
        // แสดงข้างที่กำลังทำสำหรับท่าที่ต้องสลับ
        const sideText = this.config.alternating ? 
            (state.currentSide === 'left' ? ' (แขนซ้าย)' : ' (แขนขวา)') : '';
        
        if (state.isHolding) {
            return this.config.feedback.hold.replace('{progress}', Math.round(state.holdProgress)) + sideText;
        }
        
        if (angle < target.min - 10) {
            return this.config.feedback.tooLow + sideText;
        } else if (angle > target.max + 10) {
            return this.config.feedback.tooHigh + sideText;
        } else if (angle >= target.min && angle <= target.max) {
            return this.config.feedback.perfect + sideText;
        }
        
        return 'เคลื่อนไหวไปยังท่าเป้าหมาย...' + sideText;
    }

    incrementRep() {
        currentReps++;
        this.exerciseState.lastCount = 0;  // ✅ รีเซ็ต lastCount หลังนับครบ

        totalAccuracy += this.exerciseState.accuracy;
        repAccuracyCount++;

        updateRepCounter();
        showSuccessFlash();
        showCorrectPoseWithFeedback();  // ✅ เพิ่ม เรียกจอเขียว
        playSuccessSound();

        console.log(`✅ ทำสำเร็จ ${currentReps}/${targetReps} ครั้ง (ความแม่นยำ: ${Math.round(this.exerciseState.accuracy)}%)`);

        if (currentReps >= targetReps) {
            setTimeout(() => {
                completeExercise();
            }, 1000);
        } else {
            setTimeout(() => {
                this.exerciseState.phase = 'rest';
                updateStatusMessage('เตรียมพร้อมสำหรับครั้งต่อไป...');
            }, 1500);
        }
    }
        stop() {
            this.isRunning = false;
            if (this.camera) this.camera.stop();
        }

        destroy() {
            this.stop();
            if (elements.video.srcObject) {
                const stream = elements.video.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
                elements.video.srcObject = null;
            }
        }
    }

// Helper Functions
function updateRepCounter() {
    elements.repCounter.textContent = currentReps;
    elements.repCounter.classList.add('pulse');
    setTimeout(() => {
        elements.repCounter.classList.remove('pulse');
    }, 600);
}

function updateStatusMessage(message) {
    elements.statusMessage.textContent = message;
}

function showSuccessFlash() {
    elements.successFlash.classList.add('active');
    setTimeout(() => {
        elements.successFlash.classList.remove('active');
    }, 600);
}

function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
        console.warn('Cannot play sound:', error);
    }
}

// พูดแบบมีคูลดาวน์: กันพูดรัว
function speakCooldown(detector, key, text, cooldownMs = 1800) {
  const now = Date.now();
  detector.exerciseState._voice = detector.exerciseState._voice || {};
  const last = detector.exerciseState._voice[key] || 0;

  if (now - last >= cooldownMs) {
    detector.exerciseState._voice[key] = now;
    speak(text);
  }
}

function speak(text) {
    if (!('speechSynthesis' in window)) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'th-TH';
    utter.rate = 0.9;   // ช้าหน่อยสำหรับผู้สูงอายุ
    utter.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
}


// ===== SAVE TO DATABASE =====
async function saveToDatabase() {
    try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!token) {
            console.error('❌ No token found');
            return false;
        }

        if (!sessionStartTime) {
            console.error('❌ sessionStartTime is null');
            return false;
        }

        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);

        // ✅ แก้ไข: ชื่อ field ให้ตรงกับที่ server.js รับ
        const totalReps = currentReps;
        const leftCount  = Math.ceil(totalReps / 2);
        const rightCount = Math.floor(totalReps / 2);

        const payload = {
            exercise_id:      getExerciseIdFromName(),
            exercise_name:    physioApp?.config?.name || 'ท่าการฝึก',
            exercise_type:    physioApp?.currentExercise || 'unknown',
            actual_reps:      totalReps,
            actual_sets:      1,
            accuracy:         Math.round(physioApp?.exerciseState?.accuracy || 0), // ✅ เปลี่ยนจาก accuracy_percent
            session_duration: duration,   // ✅ เปลี่ยนจาก duration_seconds
            left_count:       leftCount,  // ✅ เพิ่ม
            right_count:      rightCount  // ✅ เพิ่ม
        };

        console.log("📤 Sending to API:", payload);

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/exercise-sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("❌ Server error:", response.status, errText);
            return false;
        }

        const result = await response.json();
        console.log("✅ Saved successfully:", result);
        return true;

    } catch (error) {
        console.error("❌ Save error:", error);
        return false;
    }
}
function getExerciseIdFromName() {
    const map = {
        'arm-raise-forward': 60001,
        'leg-extension': 60002,
        'trunk-sway': 60003,
        'neck-tilt': 60004
    };

    return map[physioApp.currentExercise] || 60001;
}

async function completeExercise() {
    if (isComplete) return;
    isComplete = true;

    const currentDate = new Date();

    const sessionData = {
        exercise: physioApp.currentExercise,
        reps: currentReps,
        accuracy: repAccuracyCount > 0 
            ? Math.round(totalAccuracy / repAccuracyCount) 
            : 0,
        duration_seconds: sessionStartTime 
            ? Math.floor((Date.now() - sessionStartTime) / 1000) 
            : 0,
        completedAt: currentDate.toISOString()
    };

    try {
        await saveToDatabase(sessionData);
        console.log("✅ บันทึกฐานข้อมูลสำเร็จ");
    } catch (err) {
        console.error("❌ บันทึก DB ล้มเหลว", err);
    }

    if (elements.completeOverlay) {
        elements.completeOverlay.classList.add('show');
    }

    setTimeout(() => {
        window.location.href = 'report.html';
    }, 3000);
}

function goBack() {
    if (confirm('การฝึกยังไม่เสร็จสิ้น ต้องการออกจริงหรือไม่?')) {
        cleanup();
        window.location.href = 'dashboard.html';
    }
}

function endExercise() {
    if (confirm('ต้องการจบการฝึกหรือไม่?')) {
        cleanup();
        window.location.href = 'dashboard.html';
    }
}

function cleanup() {
    if (physioApp) {
        physioApp.destroy();
    }
    if (canvasRenderer) {
        canvasRenderer.destroy();
    }
}

function getSelectedExerciseInfo() {
    const selectedExercise = localStorage.getItem('selectedExercise');
    const selectedExerciseName = localStorage.getItem('selectedExerciseName');
    if (!selectedExercise || !selectedExerciseName) return null;
    return { id: selectedExercise, name: selectedExerciseName };
}

// Initialization
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 เริ่มโหลดระบบตรวจจับท่าทาง...');
        
        const exerciseInfo = getSelectedExerciseInfo();
        if (!exerciseInfo) {
            alert('ไม่พบข้อมูลท่าทางที่เลือก');
            window.location.href = 'dashboard.html';
            return;
        }

        elements.exerciseTitle.textContent = exerciseInfo.name;
        elements.targetRepsElement.textContent = targetReps;
        
        // สร้าง Canvas Renderer
        canvasRenderer = new CanvasRenderer(elements.canvas, elements.video);
        
        // สร้าง Pose Detector
        physioApp = new ImprovedPoseDetector();
        const success = await physioApp.initialize();
        
        if (success) {
            const exerciseSelected = physioApp.selectExercise(exerciseInfo.id);
            if (exerciseSelected) {
                await physioApp.start();
                updateStatusMessage('เตรียมตัวในท่าเริ่มต้น...');
            } else {
                throw new Error('ไม่สามารถเลือกท่าทางได้');
            }
        } else {
            throw new Error('ไม่สามารถเริ่มต้นระบบได้');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
        window.location.href = 'dashboard.html';
    }
});

window.addEventListener('beforeunload', function(event) {
    if (!isComplete && currentReps > 0) {
        event.preventDefault();
        event.returnValue = '';
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        goBack();
    }
});
// ============================================
// ตัวอย่างโค้ดสำหรับเพิ่มเอฟเฟกต์จอเขียว
// ============================================

// ฟังก์ชันสำหรับแสดงจอเขียวเมื่อทำท่าถูก
function showCorrectPoseEffect() {
    const videoContainer = document.getElementById('video-container') || 
                          document.querySelector('.video-container');
    const statusMessage = document.getElementById('status-message');
    
    // เพิ่ม class เพื่อแสดงเอฟเฟกต์จอเขียว
    if (videoContainer) {
        videoContainer.classList.add('correct-pose');
        
        // ลบ class หลังจาก animation เสร็จ
        setTimeout(() => {
            videoContainer.classList.remove('correct-pose');
        }, 800);
    }
    
    // เปลี่ยนสถานะข้อความ
    if (statusMessage) {
        statusMessage.textContent = '✓ ท่าถูกต้อง! เยี่ยมมาก!';
        statusMessage.classList.add('success');
        
        setTimeout(() => {
            statusMessage.classList.remove('success');
        }, 2000);
    }
}

// ============================================
// ฟังก์ชันเพิ่มเติมสำหรับ Mobile
// ============================================

// เพิ่ม haptic feedback บนมือถือ (สั่นเบาๆ เมื่อทำถูก)
function triggerHapticFeedback() {
    if (navigator.vibrate) {
        // สั่น 50ms เมื่อทำถูก
        navigator.vibrate(50);
    }
}

// เรียกใช้พร้อมกับจอเขียว
function showCorrectPoseWithFeedback() {
    showCorrectPoseEffect();
    triggerHapticFeedback();
    
    // เล่นเสียง (ถ้ามี)
    const successSound = document.getElementById('success-sound');
    if (successSound) {
        successSound.play().catch(e => console.log('Cannot play sound:', e));
    }
}

console.log('Green flash effect loaded! 🟢');
console.log('Use showCorrectPoseEffect() to trigger green screen flash');

console.log('✅ potex-fixed.js โหลดเสร็จแล้ว');