// ==========================
// EXERCISE DATA
// ==========================
const exerciseData = {
    'arm-raise-forward': {
        name: 'ยกแขนไปข้างหน้า',
        gif: 'assets/gifs/arm-raise-forward.gif', // ใส่ path ของ GIF จริง
        instructions: [
            'ยืนหรือนั่งในท่าที่สบาย เท้าแยกห่างเท่ากับช่วงไหล่',
            'ยกแขนทั้งสองข้างขึ้นด้านหน้าไปจนถึงระดับไหล่ ค่อยๆ ยกขึ้นในจังหวะที่สม่ำเสมอ',
            'หยุดค้างท่าเป็นเวลา 2-3 วินาที เมื่อแขนอยู่ในระดับไหล่',
            'ค่อยๆ ลดแขนลงมาที่ตำแหน่งเริ่มต้น ควบคุมการเคลื่อนไหวตลอดเวลา',
            'ทำซ้ำ 10-15 ครั้ง พักระหว่างเซ็ต 30 วินาที'
        ],
        safety: [
            'อย่ายกแขนเกินระดับไหล่ในช่วงแรกของการฝึก',
            'หายใจเข้าขณะยกแขน หายใจออกขณะลดแขนลง',
            'หากรู้สึกปวดหรือเกร็งกล้ามเนื้อ ให้หยุดทันทีและพักผ่อน',
            'ไม่ควรฝืนทำหากรู้สึกเวียนศีรษะหรือไม่สบาย'
        ],
        benefits: [
            {
                icon: 'fa-dumbbell',
                title: 'เสริมสร้างกล้ามเนื้อ',
                description: 'เพิ่มความแข็งแรงของกล้ามเนื้อแขนและไหล่'
            },
            {
                icon: 'fa-arrows-alt',
                title: 'เพิ่มความยืดหยุ่น',
                description: 'ช่วยเพิ่มขอบเขตการเคลื่อนไหวของข้อต่อ'
            },
            {
                icon: 'fa-heartbeat',
                title: 'กระตุ้นการไหลเวียนเลือด',
                description: 'ส่งเสริมการไหลเวียนของเลือดในร่างกาย'
            }
        ]
    },
    'leg-extension': {
        name: 'เหยียดเข่าตรง',
        gif: 'assets/gifs/leg-extension.gif',
        instructions: [
            'นั่งบนเก้าอี้ที่มีพนักพิง หลังตั้งตรง มือจับที่พนักเก้าอี้',
            'ยกขาข้างหนึ่งขึ้น เหยียดเข่าให้ตรงจนขาขนานกับพื้น',
            'หยุดค้างท่าไว้ 3-5 วินาที รู้สึกถึงการหดตัวของกล้ามเนื้อขา',
            'ค่อยๆ ลดขาลงมาที่ตำแหน่งเริ่มต้น ไม่ควรปล่อยขาลงอย่างรวดเร็ว',
            'สลับขาและทำซ้ำ ขาละ 10-12 ครั้ง'
        ],
        safety: [
            'ไม่ควรเหยียดเข่าจนติดขัด ควรเหยียดให้เกือบตรง',
            'หากมีอาการปวดเข่าให้ลดขอบเขตการเคลื่อนไหว',
            'ห้ามส่ายหรือแกว่งขาอย่างรุนแรง',
            'ควรทำบนพื้นที่ปลอดภัยและมีที่จับไว้ในกรณีฉุกเฉิน'
        ],
        benefits: [
            {
                icon: 'fa-shoe-prints',
                title: 'เดินได้ดีขึ้น',
                description: 'เพิ่มความแข็งแรงของขาเพื่อการเดินที่มั่นคง'
            },
            {
                icon: 'fa-balance-scale',
                title: 'การทรงตัวดีขึ้น',
                description: 'ช่วยพัฒนาการทรงตัวและประสานสัมพันธ์'
            },
            {
                icon: 'fa-bone',
                title: 'กระดูกแข็งแรง',
                description: 'ช่วยเสริมสร้างความแข็งแรงของกระดูกและข้อต่อ'
            }
        ]
    },
    'trunk-sway': {
        name: 'โยกลำตัวซ้าย-ขวา',
        gif: 'assets/gifs/trunk-sway.gif',
        instructions: [
            'ยืนตัวตรง เท้าแยกห่างเท่ากับช่วงไหล่ มือแนบข้างลำตัว',
            'โน้มตัวไปทางด้านซ้ายเบาๆ รักษาท่าทางของกระดูกสันหลังให้ตรง',
            'หยุดค้างท่าไว้ 2-3 วินาที เมื่อรู้สึกถึงการยืดของกล้ามเนื้อด้านข้าง',
            'กลับสู่ตำแหน่งกลาง แล้วโน้มไปทางด้านขวาในลักษณะเดียวกัน',
            'ทำซ้ำไปมาระหว่างซ้ายและขวา 10-15 ครั้งในแต่ละด้าน'
        ],
        safety: [
            'เคลื่อนไหวอย่างช้าๆ และควบคุม ไม่ควรส่ายตัวอย่างรวดเร็ว',
            'อย่าโน้มตัวมากเกินไป ควรอยู่ในขอบเขตที่สบาย',
            'หากรู้สึกเวียนศีรษะให้หยุดทันทีและนั่งพัก',
            'ควรทำในพื้นที่ที่มีที่จับหรือมีคนดูแลอยู่ใกล้ๆ'
        ],
        benefits: [
            {
                icon: 'fa-arrows-left-right',
                title: 'ความยืดหยุ่นลำตัว',
                description: 'เพิ่มความยืดหยุ่นของกล้ามเนื้อลำตัวและหลัง'
            },
            {
                icon: 'fa-person-walking',
                title: 'การทรงตัว',
                description: 'พัฒนาการทรงตัวและความมั่นคงของลำตัว'
            },
            {
                icon: 'fa-spa',
                title: 'ลดอาการปวดหลัง',
                description: 'ช่วยบรรเทาอาการปวดและเกร็งกล้ามเนื้อหลัง'
            }
        ]
    }
};

// ==========================
// GET EXERCISE TYPE FROM URL
// ==========================
function getExerciseType() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('type') || 'arm-raise-forward';
}

// ==========================
// LOAD EXERCISE DATA
// ==========================
function loadExerciseData() {
    const exerciseType = getExerciseType();
    const exercise = exerciseData[exerciseType];

    if (!exercise) {
        console.error('Exercise not found:', exerciseType);
        return;
    }

    // Set exercise name
    document.getElementById('exercise-name').textContent = exercise.name;

    // Set GIF (with loading state)
    const gifElement = document.getElementById('exercise-gif');
    const loadingDemo = document.getElementById('loading-demo');
    
    gifElement.onload = function() {
        loadingDemo.classList.add('hidden');
    };
    
    gifElement.onerror = function() {
        loadingDemo.innerHTML = '<i class="fas fa-image" style="font-size: 48px; color: #ccc;"></i><p>ไม่สามารถโหลดตัวอย่างได้</p>';
    };
    
    gifElement.src = exercise.gif;

    // Load instructions
    const instructionsList = document.getElementById('instructions-list');
    instructionsList.innerHTML = exercise.instructions.map((instruction, index) => `
        <div class="instruction-item">
            <div class="instruction-number">${index + 1}</div>
            <div class="instruction-content">
                <p>${instruction}</p>
            </div>
        </div>
    `).join('');

    // Load safety tips
    const safetyTips = document.getElementById('safety-tips');
    safetyTips.innerHTML = exercise.safety.map(tip => `
        <div class="safety-item">
            <i class="fas fa-exclamation-circle"></i>
            <p>${tip}</p>
        </div>
    `).join('');

    // Load benefits
    const benefitsGrid = document.getElementById('benefits-grid');
    benefitsGrid.innerHTML = exercise.benefits.map(benefit => `
        <div class="benefit-card">
            <div class="benefit-icon">
                <i class="fas ${benefit.icon}"></i>
            </div>
            <h3>${benefit.title}</h3>
            <p>${benefit.description}</p>
        </div>
    `).join('');
}

// ==========================
// TEXT TO SPEECH
// ==========================
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

function speakInstructions() {
    const exerciseType = getExerciseType();
    const exercise = exerciseData[exerciseType];

    if (!exercise) return;

    // Cancel any ongoing speech
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    // Prepare text
    let textToSpeak = `${exercise.name}. `;
    textToSpeak += 'ขั้นตอนการฝึก. ';
    exercise.instructions.forEach((instruction, index) => {
        textToSpeak += `ขั้นตอนที่ ${index + 1}. ${instruction}. `;
    });

    // Create utterance
    currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
    currentUtterance.lang = 'th-TH';
    currentUtterance.rate = 0.9;
    currentUtterance.pitch = 1;

    // Show audio panel
    const audioPanel = document.getElementById('audio-panel');
    audioPanel.style.display = 'flex';

    // Update status
    document.getElementById('audio-status').textContent = 'กำลังอ่านคำแนะนำ...';

    // When speech ends
    currentUtterance.onend = function() {
        audioPanel.style.display = 'none';
    };

    // Start speaking
    speechSynthesis.speak(currentUtterance);
}

function stopSpeaking() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    document.getElementById('audio-panel').style.display = 'none';
}

// ==========================
// NAVIGATION
// ==========================
function goBack() {
    window.history.back();
}

function startExercise() {
    const exerciseType = getExerciseType();
    const exercise = exerciseData[exerciseType];
    
    // บันทึกลง localStorage สำหรับ potex.js
    localStorage.setItem('selectedExercise', exerciseType);
    localStorage.setItem('selectedExerciseName', exercise.name);
    
    // Show loading
    document.body.insertAdjacentHTML('beforeend', `
        <div class="loading-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(30,136,229,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999;">
            <div class="spinner"></div>
            <p style="color: white; margin-top: 20px; font-size: 16px; font-weight: 500;">กำลังเริ่มการฝึก...</p>
        </div>
    `);
    
    setTimeout(() => {
        window.location.href = `exercise-camera.html?type=${exerciseType}`;
    }, 500);
}

// ==========================
// INITIALIZE
// ==========================
document.addEventListener('DOMContentLoaded', function() {
    loadExerciseData();
});