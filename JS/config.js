// ========================================
// ไฟล์การตั้งค่าระบบกายภาพบำบัด (ปรับปรุงความแม่นยำ)
// config-improved.js
// ========================================

// การตั้งค่าหลักของระบบ - ปรับปรุงสำหรับความแม่นยำสูงสุด
const StrokeConfig = {
    // การตั้งค่า MediaPipe - ปรับให้แม่นยำที่สุด
    CONFIG: {
        MEDIAPIPE: {
            // เพิ่ม model complexity เป็น 2 (สูงสุด) เพื่อความแม่นยำสูง
            MODEL_COMPLEXITY: 2,
            
            // เปิด smooth landmarks เพื่อลดการกระเพื่อม
            SMOOTH_LANDMARKS: true,
            
            // ปิด segmentation เพื่อเพิ่มความเร็ว (ไม่จำเป็นสำหรับการตรวจจับท่า)
            ENABLE_SEGMENTATION: false,
            
            // ⭐ เพิ่มค่าความมั่นใจในการตรวจจับเป็น 0.8 (จาก 0.7)
            MIN_DETECTION_CONFIDENCE: 0.8,
            
            // ⭐ เพิ่มค่าความมั่นใจในการติดตามเป็น 0.8 (จาก 0.7)
            MIN_TRACKING_CONFIDENCE: 0.8,
            
            SELFIE_MODE: true
        },
        
        CAMERA: {
            // ⭐ เพิ่ม resolution สำหรับความชัดเจน
            WIDTH: 1920,  // เปลี่ยนจาก 1280
            HEIGHT: 1080, // เปลี่ยนจาก 720
            FACING_MODE: 'user',
            
            // ⭐ เพิ่ม frame rate เป็น 60 fps
            FRAME_RATE: 60
        },
        
        CANVAS: {
            CONNECTION_COLOR: '#00FF00',
            LANDMARK_COLOR: '#FF0000',
            HIGHLIGHT_COLOR: '#FFFF00',
            LINE_WIDTH: 3, // เพิ่มจาก 2 เพื่อความชัดเจน
            LANDMARK_RADIUS: 5 // เพิ่มจาก 4
        },
        
        // ⭐ การตั้งค่า Smoothing ที่ปรับปรุง
        SMOOTHING: {
            // จำนวน frame ที่ใช้ในการ smooth (เพิ่มเป็น 8 จาก 5)
            ANGLE_HISTORY_LENGTH: 8,
            
            // ใช้ Kalman Filter แทน moving average
            USE_KALMAN_FILTER: true,
            
            // Process noise สำหรับ Kalman Filter
            PROCESS_NOISE: 0.01,
            
            // Measurement noise สำหรับ Kalman Filter
            MEASUREMENT_NOISE: 0.1,
            
            // ⭐ Outlier detection threshold
            OUTLIER_THRESHOLD: 20 // องศา - ถ้ามุมเปลี่ยนเกิน 20 องศาในหนึ่ง frame = outlier
        },
        
        // ⭐ การตั้งค่าการตรวจจับที่แม่นยำ
        DETECTION: {
            // จำนวน frame ที่ต้องถูกต้องติดต่อกันก่อนนับ rep (เพิ่มจาก 30)
            REQUIRED_GOOD_FRAMES: 45,
            
            // ระยะเวลาคงท่าขั้นต่ำ (มิลลิวินาที)
            MIN_HOLD_DURATION: 1500, // เพิ่มจาก 1000
            
            // ⭐ Required visibility สำหรับแต่ละ landmark
            MIN_LANDMARK_VISIBILITY: 0.75, // เพิ่มจาก 0.7
            
            // ⭐ Angle tolerance - ช่วงที่ยอมรับได้
            ANGLE_TOLERANCE: 5, // ±5 องศา
            
            // ⭐ ตรวจสอบความเสถียร - มุมต้องคงที่ในช่วงนี้
            STABILITY_CHECK: true,
            STABILITY_THRESHOLD: 3, // มุมต้องไม่เปลี่ยนเกิน 3 องศา
            STABILITY_FRAMES: 15 // ตรวจสอบ 15 frames
        }
    },

    // สีที่ใช้ในระบบ
    COLORS: {
        SUCCESS: '#28a745',
        WARNING: '#ffc107',
        ERROR: '#dc3545',
        INFO: '#17a2b8',
        PRIMARY: '#007bff',
        SECONDARY: '#6c757d'
    },

    // ตำแหน่งของ Pose landmarks
    POSE_LANDMARKS: {
        NOSE: 0,
        LEFT_EYE_INNER: 1,
        LEFT_EYE: 2,
        LEFT_EYE_OUTER: 3,
        RIGHT_EYE_INNER: 4,
        RIGHT_EYE: 5,
        RIGHT_EYE_OUTER: 6,
        LEFT_EAR: 7,
        RIGHT_EAR: 8,
        MOUTH_LEFT: 9,
        MOUTH_RIGHT: 10,
        LEFT_SHOULDER: 11,
        RIGHT_SHOULDER: 12,
        LEFT_ELBOW: 13,
        RIGHT_ELBOW: 14,
        LEFT_WRIST: 15,
        RIGHT_WRIST: 16,
        LEFT_PINKY: 17,
        RIGHT_PINKY: 18,
        LEFT_INDEX: 19,
        RIGHT_INDEX: 20,
        LEFT_THUMB: 21,
        RIGHT_THUMB: 22,
        LEFT_HIP: 23,
        RIGHT_HIP: 24,
        LEFT_KNEE: 25,
        RIGHT_KNEE: 26,
        LEFT_ANKLE: 27,
        RIGHT_ANKLE: 28,
        LEFT_HEEL: 29,
        RIGHT_HEEL: 30,
        LEFT_FOOT_INDEX: 31,
        RIGHT_FOOT_INDEX: 32
    },

    // ⭐ ข้อมูลการออกกำลังกาย - ปรับปรุงค่า target angle ให้แม่นยำ
    EXERCISE_DATA: {
        'arm-raise-forward': {
            name: 'ยกแขนไปข้างหน้า',
            description: 'ยกแขนทั้งสองข้างไปข้างหน้าสลับกัน',
            landmarks: [11, 12, 13, 14, 15, 16],
            targetReps: 10,
            targetSets: 2,
            // ⭐ ปรับช่วงมุมให้แคบลงเพื่อความแม่นยำ
            targetAngleRange: [75, 95], // จาก [70, 100]
            restAngleRange: [0, 25], // เพิ่มช่วง rest ที่ชัดเจน
            primaryJoints: ['shoulder', 'elbow'],
            difficulty: 'easy',
            // ⭐ Landmark weights - น้ำหนักความสำคัญ
            landmarkWeights: {
                11: 1.5, // left shoulder - สำคัญที่สุด
                12: 1.5, // right shoulder
                13: 1.2, // left elbow
                14: 1.2, // right elbow
                15: 1.0, // left wrist
                16: 1.0  // right wrist
            }
        },
        'leg-extension': {
            name: 'เหยียดเข่าตรง',
            description: 'เหยียดเข่าให้ตรงจากท่านั่ง',
            landmarks: [23, 24, 25, 26, 27, 28],
            targetReps: 10,
            targetSets: 2,
            // ⭐ ปรับช่วงมุมให้แคบลง
            targetAngleRange: [165, 180], // จาก [160, 180]
            restAngleRange: [80, 100],
            primaryJoints: ['knee', 'hip'],
            difficulty: 'medium',
            landmarkWeights: {
                23: 1.3, // left hip
                24: 1.3, // right hip
                25: 1.5, // left knee - สำคัญที่สุด
                26: 1.5, // right knee
                27: 1.0, // left ankle
                28: 1.0  // right ankle
            }
        },
        'trunk-sway': {
            name: 'โยกลำตัวซ้าย-ขวา',
            description: 'โยกลำตัวไปทางซ้ายและขวาสลับกัน',
            landmarks: [11, 12, 23, 24],
            targetReps: 10,
            targetSets: 2,
            // ⭐ ปรับช่วงมุม
            targetAngleRange: [18, 32], // จาก [15, 35]
            restAngleRange: [-8, 8],
            primaryJoints: ['trunk'],
            difficulty: 'easy',
            landmarkWeights: {
                11: 1.5,
                12: 1.5,
                23: 1.5,
                24: 1.5
            }
        },
        'neck-tilt': {
            name: 'เอียงศีรษะซ้าย-ขวา',
            description: 'เอียงศีรษะไปทางซ้ายและขวาสลับกัน',
            landmarks: [7, 8, 11, 12],
            targetReps: 10,
            targetSets: 2,
            // ⭐ ปรับช่วงมุม
            targetAngleRange: [22, 38], // จาก [20, 40]
            restAngleRange: [-8, 8],
            primaryJoints: ['neck'],
            difficulty: 'easy',
            landmarkWeights: {
                7: 1.5,  // left ear
                8: 1.5,  // right ear
                11: 1.2, // left shoulder
                12: 1.2  // right shoulder
            }
        }
    },

    // Utility functions
    getExerciseName: function(exerciseId) {
        return this.EXERCISE_DATA[exerciseId]?.name || 'ไม่ทราบชื่อท่า';
    },

    getExerciseDescription: function(exerciseId) {
        return this.EXERCISE_DATA[exerciseId]?.description || '';
    },

    // การตั้งค่า API (ถ้ามี)
    API_CONFIG: {
        BASE_URL: 'https://api.stroketherapy.com/v1',
        TIMEOUT: 30000,
        HEADERS: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        ENDPOINTS: {
            CREATE_SESSION: '/sessions',
            UPDATE_SESSION: '/sessions',
            COMPLETE_SESSION: '/sessions/complete',
            POSE_ANGLES: '/data/pose-angles',
            POSE_LANDMARKS: '/data/pose-landmarks',
            SAVE_ANALYSIS: '/data/movement-analysis',
            SAVE_PROGRESS: '/progress',
            PROGRESS: '/progress',
            EXERCISES: '/exercises',
            EXERCISE_BY_ID: '/exercises'
        }
    }
};

// ⭐ Kalman Filter Class สำหรับ smooth angles
class KalmanFilter {
    constructor(processNoise = 0.01, measurementNoise = 0.1) {
        this.processNoise = processNoise;
        this.measurementNoise = measurementNoise;
        this.estimate = 0;
        this.errorEstimate = 1;
        this.isInitialized = false;
    }

    filter(measurement) {
        if (!this.isInitialized) {
            this.estimate = measurement;
            this.isInitialized = true;
            return measurement;
        }

        // Prediction
        const predictedEstimate = this.estimate;
        const predictedErrorEstimate = this.errorEstimate + this.processNoise;

        // Update
        const kalmanGain = predictedErrorEstimate / (predictedErrorEstimate + this.measurementNoise);
        this.estimate = predictedEstimate + kalmanGain * (measurement - predictedEstimate);
        this.errorEstimate = (1 - kalmanGain) * predictedErrorEstimate;

        return this.estimate;
    }

    reset() {
        this.estimate = 0;
        this.errorEstimate = 1;
        this.isInitialized = false;
    }
}

// ⭐ Outlier Detection Class
class OutlierDetector {
    constructor(threshold = 20) {
        this.threshold = threshold;
        this.lastValue = null;
    }

    isOutlier(value) {
        if (this.lastValue === null) {
            this.lastValue = value;
            return false;
        }

        const diff = Math.abs(value - this.lastValue);
        const isOutlier = diff > this.threshold;
        
        if (!isOutlier) {
            this.lastValue = value;
        }

        return isOutlier;
    }

    reset() {
        this.lastValue = null;
    }
}

// Utility class for common operations
class StrokeUtils {
    static getExerciseName(exerciseId) {
        return StrokeConfig.EXERCISE_DATA[exerciseId]?.name || 'ไม่ทราบชื่อท่า';
    }

    static getExerciseDescription(exerciseId) {
        return StrokeConfig.EXERCISE_DATA[exerciseId]?.description || '';
    }

    static getDifficultyLabel(difficulty) {
        const labels = {
            'easy': 'ง่าย',
            'medium': 'ปานกลาง',
            'hard': 'ยาก'
        };
        return labels[difficulty] || difficulty;
    }

    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    static calculateProgress(current, target) {
        return Math.min(100, Math.round((current / target) * 100));
    }

    // ⭐ คำนวณ weighted average สำหรับ landmarks
    static calculateWeightedLandmarkVisibility(landmarks, exerciseId) {
        const exerciseData = StrokeConfig.EXERCISE_DATA[exerciseId];
        if (!exerciseData) return 0;

        const weights = exerciseData.landmarkWeights || {};
        let totalWeight = 0;
        let weightedSum = 0;

        exerciseData.landmarks.forEach(index => {
            const landmark = landmarks[index];
            if (landmark) {
                const weight = weights[index] || 1.0;
                weightedSum += landmark.visibility * weight;
                totalWeight += weight;
            }
        });

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    // ⭐ ตรวจสอบความเสถียรของมุม
    static checkAngleStability(angleHistory, threshold = 3, requiredFrames = 15) {
        if (angleHistory.length < requiredFrames) {
            return false;
        }

        const recentAngles = angleHistory.slice(-requiredFrames);
        const avgAngle = recentAngles.reduce((a, b) => a + b, 0) / recentAngles.length;
        
        return recentAngles.every(angle => Math.abs(angle - avgAngle) <= threshold);
    }
}

// ส่งออกเป็น global variables
window.StrokeConfig = StrokeConfig;
window.StrokeUtils = StrokeUtils;
window.KalmanFilter = KalmanFilter;
window.OutlierDetector = OutlierDetector;

console.log('✅ config-improved.js โหลดเรียบร้อยแล้ว (ปรับปรุงความแม่นยำ)');