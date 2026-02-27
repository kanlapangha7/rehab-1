/**
 * ========================================
 * Main Dashboard System
 * dashboard.js - ระบบ Dashboard หลัก
 * ========================================
 */

class DashboardSystem {
    constructor() {
        // Configuration
        this.config = {
            currentUser: null,
            isInitialized: false,
            animations: {
                enabled: true,
                duration: 300
            }
        };

        // Initialize
        this.init();
    }

    /**
     * Initialize dashboard
     */
    init() {
        console.log('🚀 Dashboard System initializing...');

        // Check authentication first
        if (!this.checkAuthentication()) {
            return;
        }

        // Load user data
        this.loadUserData();

        // Update UI
        this.updateUserDisplay();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize animations
        this.initializeAnimations();

        // Hide loading
        this.hideLoading();

        // Mark as initialized
        this.config.isInitialized = true;

        console.log('✅ Dashboard System initialized');
    }

    /**
     * Check if user is authenticated
     */
    checkAuthentication() {
        console.log('🔐 Checking authentication...');

        // Check multiple storage locations
        const userData = this.getUserFromStorage();

        if (!userData) {
            console.error('❌ No user data found - redirecting to login');
            this.redirectToLogin();
            return false;
        }

        // Validate role
        const role = (userData.role || '').toLowerCase();
        const allowedRoles = ['patient', 'ผู้ป่วย', 'user', 'ผู้ใช้', ''];

        if (role && !allowedRoles.includes(role)) {
            console.error(`❌ Invalid role: ${role} - redirecting`);
            this.redirectBasedOnRole(role);
            return false;
        }

        this.config.currentUser = userData;
        console.log('✅ Authentication successful');
        return true;
    }

    /**
     * Get user data from storage
     */
    getUserFromStorage() {
        try {
            // Try sessionStorage first
            let userData = sessionStorage.getItem('userData');
            if (userData) {
                return JSON.parse(userData);
            }

            // Try localStorage
            userData = localStorage.getItem('userData');
            if (userData) {
                return JSON.parse(userData);
            }

            // Try alternative key
            userData = localStorage.getItem('user');
            if (userData) {
                return JSON.parse(userData);
            }

            return null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    /**
     * Load user data
     */
    loadUserData() {
        if (!this.config.currentUser) {
            this.config.currentUser = this.getUserFromStorage();
        }
    }

    /**
     * Update user display
     */
    updateUserDisplay() {
        const user = this.config.currentUser;
        if (!user) {
            this.setDefaultDisplay();
            return;
        }

        // Get display name
        const displayName = this.getDisplayName(user);
        const shortName = this.getShortName(user);

        // Update name elements
        const nameElement = document.getElementById('userName');
        if (nameElement) {
            nameElement.textContent = displayName;
        }

        const displayNameElement = document.getElementById('userDisplayName');
        if (displayNameElement) {
            displayNameElement.textContent = `Care ${shortName}`;
        }

        console.log(`👤 User display updated: ${displayName}`);
    }

    /**
     * Get display name from user object
     */
    getDisplayName(user) {
        // Try various name fields
        const nameFields = [
            user.full_name,
            user.fullName,
            user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null,
            user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null,
            user.username,
            user.name,
            user.phone ? `ผู้ใช้ ${user.phone}` : null
        ];

        for (const name of nameFields) {
            if (name && typeof name === 'string' && name.trim()) {
                return name.trim();
            }
        }

        return 'ผู้ใช้งาน';
    }

    /**
     * Get short name from user object
     */
    getShortName(user) {
        return user.first_name || 
               user.firstName || 
               user.username || 
               'User';
    }

    /**
     * Set default display
     */
    setDefaultDisplay() {
        const nameElement = document.getElementById('userName');
        if (nameElement) {
            nameElement.textContent = 'ผู้ใช้งาน';
        }

        const displayNameElement = document.getElementById('userDisplayName');
        if (displayNameElement) {
            displayNameElement.textContent = 'Care User';
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('🎯 Setting up event listeners...');

        // Phone mockup click
        const phoneMockup = document.querySelector('.phone-mockup');
        if (phoneMockup) {
            phoneMockup.addEventListener('click', () => this.startAssessment());
            this.addHoverEffect(phoneMockup);
        }

        // Step cards hover effects
        document.querySelectorAll('.step-card').forEach(card => {
            this.addHoverEffect(card);
        });

        // Logout button
        const logoutBtn = document.querySelector('.logout-btn-large');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.exitSystem());
        }

        // Logo click
        const logo = document.querySelector('.header-logo');
        if (logo) {
            logo.style.cursor = 'pointer';
            logo.addEventListener('click', () => {
                window.location.reload();
            });
        }

        console.log('✅ Event listeners setup complete');
    }

    /**
     * Add hover effect to element
     */
    addHoverEffect(element) {
        if (!element) return;

        element.addEventListener('mouseenter', () => {
            if (this.config.animations.enabled) {
                element.style.transform = 'translateY(-5px) scale(1.02)';
                element.style.transition = `all ${this.config.animations.duration}ms ease`;
            }
        });

        element.addEventListener('mouseleave', () => {
            if (this.config.animations.enabled) {
                element.style.transform = 'translateY(0) scale(1)';
            }
        });
    }

    /**
     * Initialize animations
     */
    initializeAnimations() {
        if (!this.config.animations.enabled) return;

        console.log('🎨 Initializing animations...');

        // Animate step cards
        const stepCards = document.querySelectorAll('.step-card');
        stepCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';

            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, (index + 1) * 150);
        });

        // Animate play button
        const playButton = document.querySelector('.play-button');
        if (playButton) {
            setInterval(() => {
                playButton.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    playButton.style.transform = 'scale(1)';
                }, 500);
            }, 3000);
        }

        // Animate care banner
        const careBanner = document.querySelector('.care-banner');
        if (careBanner) {
            careBanner.style.opacity = '0';
            careBanner.style.transform = 'translateY(-20px)';
            careBanner.style.transition = 'all 0.8s ease';

            setTimeout(() => {
                careBanner.style.opacity = '1';
                careBanner.style.transform = 'translateY(0)';
            }, 200);
        }

        console.log('✅ Animations initialized');
    }

    /**
     * Start assessment (go to exercise selection)
     */
    startAssessment() {
        console.log('🏃 Starting assessment...');

        try {
            // Show loading
            this.showLoading('กำลังเตรียมระบบประเมิน...');

            // Animate play button
            const playButton = document.querySelector('.play-button');
            if (playButton) {
                playButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }

            // Navigate after delay
            setTimeout(() => {
                window.location.href = 'exercise-selection.html';
            }, 1000);
        } catch (error) {
            console.error('Error starting assessment:', error);
            this.hideLoading();
            alert('เกิดข้อผิดพลาดในการเริ่มระบบประเมิน');
        }
    }

    /**
     * Exit system (logout)
     */
    exitSystem() {
        console.log('🚪 Exiting system...');

        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            try {
                this.showLoading('กำลังออกจากระบบ...');

                // Clear all user data
                this.clearUserData();

                // Redirect to login
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } catch (error) {
                console.error('Error exiting system:', error);
                window.location.href = 'login.html';
            }
        }
    }

    /**
     * Clear user data from storage
     */
    clearUserData() {
        try {
            sessionStorage.removeItem('userData');
            localStorage.removeItem('userData');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            console.log('✅ User data cleared');
        } catch (error) {
            console.error('Error clearing user data:', error);
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'กำลังโหลด...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const text = overlay.querySelector('p');
            if (text) text.textContent = message;
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
    }

    /**
     * Redirect to login
     */
    redirectToLogin() {
        this.clearUserData();
        this.showLoading('กำลังเปลี่ยนเส้นทางไปหน้าล็อกอิน...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    /**
     * Redirect based on user role
     */
    redirectBasedOnRole(role) {
        const routes = {
            'therapist': 'therapist-dashboard.html',
            'physiotherapist': 'therapist-dashboard.html',
            'นักกายภาพบำบัด': 'therapist-dashboard.html',
            'admin': 'admin-dashboard.html',
            'ผู้ดูแลระบบ': 'admin-dashboard.html'
        };

        const targetPage = routes[role] || 'login.html';
        
        this.showLoading('กำลังเปลี่ยนหน้า...');
        setTimeout(() => {
            window.location.href = targetPage;
        }, 1000);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.dashboard-notification');
        if (existing) existing.remove();

        // Create notification
        const notification = document.createElement('div');
        notification.className = `dashboard-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-family: 'Kanit', sans-serif;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

/**
 * Global functions (called from HTML)
 */
function startAssessment() {
    if (window.dashboardInstance) {
        window.dashboardInstance.startAssessment();
    }
}

function exitSystem() {
    if (window.dashboardInstance) {
        window.dashboardInstance.exitSystem();
    }
}

function goToProfile() {
    window.location.href = 'profile-edit.html';
}

/**
 * Error handlers
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    event.preventDefault();
});

/**
 * Initialize on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.dashboardInstance = new DashboardSystem();
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .phone-mockup {
        cursor: pointer !important;
        user-select: none;
    }

    .step-card {
        cursor: pointer !important;
    }

    .logout-btn-large {
        cursor: pointer !important;
        transition: all 0.3s ease;
    }

    .logout-btn-large:hover {
        transform: scale(1.05);
    }
`;
document.head.appendChild(style);

console.log('✅ dashboard.js loaded successfully');