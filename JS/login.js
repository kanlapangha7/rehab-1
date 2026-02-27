/**
 * ========================================
 * Login System - ระบบเข้าสู่ระบบ
 * login.js - Fixed Role-Based Redirect
 * ========================================
 */

// API Configuration
const API_CONFIG = {
    RENDER_URL: 'https://bn1-1.onrender.com',
    LOCAL_URL: 'http://localhost:4000',
    TIMEOUT: 10000
};

// Test and determine which API to use
async function getApiBaseUrl() {
    try {
        console.log('🌐 Testing Render API connection...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_CONFIG.RENDER_URL}/health`, {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('✅ Render API is available');
            return `${API_CONFIG.RENDER_URL}/api/auth`;
        }
    } catch (error) {
        console.log('⚠️ Render API not available:', error.message);
    }
    
    console.log('🔄 Using localhost as fallback');
    return `${API_CONFIG.LOCAL_URL}/api/auth`;
}

class LoginSystem {
    constructor() {
        this.config = {
            apiBaseUrl: null,
            isLoading: false,
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000,
            validationRules: this.getValidationRules(),
            connectionCheckTimeout: API_CONFIG.TIMEOUT
        };

        this.init();
    }

    async init() {
        this.config.apiBaseUrl = await getApiBaseUrl();
        console.log('📡 Using API:', this.config.apiBaseUrl);
        
        this.bindEvents();
        this.checkExistingSession();
        
        this.checkConnection().catch(err => {
            console.log('⚠️ Initial connection check failed:', err.message);
        });
        
        console.log('✅ Login System initialized');
    }

    getValidationRules() {
        return {
            username: {
                required: true,
                pattern: /^[0-9]{10}$/,
                message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก'
            },
            password: {
                required: true,
                minLength: 6,
                message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
            }
        };
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        const passwordToggle = document.getElementById('passwordToggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', this.togglePassword.bind(this));
        }

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', this.redirectToRegister.bind(this));
        }

        this.bindValidationEvents();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.config.isLoading) {
                const submitBtn = document.getElementById('submitBtn');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    bindValidationEvents() {
        const inputs = ['username', 'password'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('blur', () => this.validateField(inputId));
                input.addEventListener('input', () => this.clearFieldError(inputId));
            }
        });
    }

    checkExistingSession() {
        const userData = this.getStoredUserData();
        if (userData && this.isValidSession(userData)) {
            console.log('🔄 Existing session found, redirecting...');
            this.redirectToDashboard(userData);
        }
    }

    getStoredUserData() {
        try {
            const sessionData = sessionStorage.getItem('userData');
            const localData = localStorage.getItem('userData');
            
            if (sessionData) {
                return JSON.parse(sessionData);
            } else if (localData) {
                return JSON.parse(localData);
            }
        } catch (error) {
            console.warn('Failed to parse stored user data:', error);
        }
        
        return null;
    }

    isValidSession(userData) {
        if (!userData || !userData.loginTime) {
            return false;
        }

        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const timeDiff = now - loginTime;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        return timeDiff < maxAge;
    }

    async handleLogin(event) {
        event.preventDefault();
        
        if (this.config.isLoading) return;

        if (this.isLockedOut()) {
            const timeLeft = this.getLockoutTimeLeft();
            this.showErrorModal(`บัญชีถูกล็อค กรุณารอ ${Math.ceil(timeLeft / 60000)} นาที`);
            return;
        }

        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;
        const remember = document.getElementById('remember')?.checked;

        if (!this.validateLoginForm(username, password)) {
            return;
        }

        this.setLoadingState(true);

        try {
            console.log('🔄 Attempting login...', { username, api: this.config.apiBaseUrl });

            const response = await this.makeApiRequest('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    phone: username,
                    password: password
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Login successful:', result.user);
                this.loginSuccess(result, remember);
                this.clearFailedAttempts();
            } else {
                console.log('❌ Login failed:', result.message);
                this.loginFailed(result.message || 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
            }

        } catch (error) {
            console.log('⚠️ API Error:', error.message);
            console.log('🔄 API unavailable, trying localStorage...');
            this.fallbackLogin(username, password, remember);
            
        } finally {
            this.setLoadingState(false);
        }
    }

    async makeApiRequest(endpoint, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.connectionCheckTimeout);

        try {
            const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    validateLoginForm(username, password) {
        if (!username || !password) {
            this.showErrorModal('กรุณากรอกเบอร์โทรศัพท์และรหัสผ่าน');
            return false;
        }

        if (!this.validateField('username') || !this.validateField('password')) {
            return false;
        }

        return true;
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return false;

        const value = field.value.trim();
        const rule = this.config.validationRules[fieldId];

        if (!rule) return true;

        this.clearFieldError(fieldId);

        if (rule.required && !value) {
            this.showFieldError(fieldId, rule.message);
            return false;
        }

        if (value && rule.pattern && !rule.pattern.test(value)) {
            this.showFieldError(fieldId, rule.message);
            return false;
        }

        if (value && rule.minLength && value.length < rule.minLength) {
            this.showFieldError(fieldId, rule.message);
            return false;
        }

        this.showFieldSuccess(fieldId);
        return true;
    }

    showFieldError(fieldId, message) {
        const formGroup = document.getElementById(fieldId)?.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('success');
        formGroup.classList.add('error');

        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    showFieldSuccess(fieldId) {
        const formGroup = document.getElementById(fieldId)?.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('error');
        formGroup.classList.add('success');
    }

    clearFieldError(fieldId) {
        const formGroup = document.getElementById(fieldId)?.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('error', 'success');

        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    fallbackLogin(username, password, remember) {
        try {
            const users = JSON.parse(localStorage.getItem('registrationBackup') || '[]');
            const user = users.find(u => 
                u.phone === username && 
                u.password === password
            );

            if (user) {
                const apiResponse = {
                    success: true,
                    user: {
                        user_id: user.id,
                        phone: user.phone,
                        full_name: `${user.first_name} ${user.last_name}`,
                        role: user.role
                    },
                    token: 'fallback_token_' + Date.now()
                };
                
                console.log('✅ Fallback login successful');
                this.loginSuccess(apiResponse, remember);
                this.clearFailedAttempts();
            } else {
                this.loginFailed('เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
            }
        } catch (error) {
            console.error('Fallback login failed:', error);
            this.loginFailed('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

    loginSuccess(result, remember) {
        const userData = {
            user_id: result.user.user_id,
            phone: result.user.phone,
            full_name: result.user.full_name,
            role: result.user.role,
            token: result.token,
            loginTime: new Date().toISOString()
        };

        console.log('💾 Saving user data:', userData);

        // Save to storage
        if (remember) {
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('authToken', result.token);
        } else {
            sessionStorage.setItem('userData', JSON.stringify(userData));
            sessionStorage.setItem('authToken', result.token);
        }

        // Verify save
        const savedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        console.log('✅ Token saved:', savedToken ? 'YES' : 'NO');

        // Show success and redirect
        this.showSuccessModal();
        this.recordLoginHistory(userData);

        setTimeout(() => {
            this.redirectToDashboard(userData);
        }, 1500);
    }

    loginFailed(message) {
        this.incrementFailedAttempts();
        
        const attempts = this.getFailedAttempts();
        const remaining = this.config.maxLoginAttempts - attempts;

        if (remaining <= 0) {
            this.lockAccount();
            message = `เข้าสู่ระบบล้มเหลวหลายครั้ง บัญชีถูกล็อค ${this.config.lockoutDuration / 60000} นาที`;
        } else if (remaining <= 2) {
            message += ` (เหลือ ${remaining} ครั้ง)`;
        }

        this.showErrorModal(message);
    }

    // ✅ แก้ไขส่วนนี้ - เพิ่ม Caregiver redirect
    redirectToDashboard(userData) {
        let redirectUrl = 'dashboard.html'; // default
        
        console.log('🔍 Checking role for redirect:', userData.role);

        // ✅ เพิ่มการตรวจสอบ Caregiver
        switch (userData.role) {
            case 'Patient':
            case 'ผู้ป่วย':
                redirectUrl = 'dashboard.html';
                console.log('👤 Redirecting to Patient Dashboard');
                break;
                
            case 'Caregiver':
            case 'ผู้ดูแล':
            case 'ผู้ดูแลผู้ป่วย':
                redirectUrl = 'caregiver-dashboard.html';
                console.log('👨‍👩‍👧 Redirecting to Caregiver Dashboard');
                break;
                
            case 'Physiotherapist':
            case 'นักกายภาพบำบัด':
                redirectUrl = 'therapist-dashboard.html';
                console.log('🏥 Redirecting to Therapist Dashboard');
                break;
                
            case 'Admin':
                redirectUrl = 'admin-dashboard.html';
                console.log('⚙️ Redirecting to Admin Dashboard');
                break;
                
            default:
                console.warn('⚠️ Unknown role, using default:', userData.role);
                redirectUrl = 'dashboard.html';
        }

        console.log(`🚀 Final redirect URL: ${redirectUrl}`);
        
        // Add small delay for better UX
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 500);
    }

    recordLoginHistory(userData) {
        try {
            const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
            history.push({
                userId: userData.user_id,
                phone: userData.phone,
                role: userData.role,
                loginTime: userData.loginTime,
                userAgent: navigator.userAgent,
                success: true
            });

            if (history.length > 50) {
                history.splice(0, history.length - 50);
            }

            localStorage.setItem('loginHistory', JSON.stringify(history));
        } catch (error) {
            console.warn('Failed to record login history:', error);
        }
    }

    togglePassword() {
        const passwordInput = document.getElementById('password');
        const passwordToggle = document.getElementById('passwordToggle');
        const icon = passwordToggle?.querySelector('i');

        if (!passwordInput || !icon) return;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    setLoadingState(loading) {
        this.config.isLoading = loading;

        const loadingOverlay = document.getElementById('loadingOverlay');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnIcon = submitBtn?.querySelector('.btn-icon');

        if (loadingOverlay) {
            loadingOverlay.style.display = loading ? 'flex' : 'none';
        }

        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.classList.toggle('loading', loading);
        }

        if (btnText) {
            btnText.textContent = loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ';
        }

        if (btnIcon) {
            btnIcon.className = loading ? 'btn-icon fas fa-spinner fa-spin' : 'btn-icon fas fa-arrow-right';
        }

        const formInputs = document.querySelectorAll('#loginForm input, #loginForm button');
        formInputs.forEach(input => {
            input.disabled = loading;
        });
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const messageElement = document.getElementById('errorMessage');
        
        if (modal && messageElement) {
            messageElement.textContent = message;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    }

    redirectToRegister() {
        window.location.href = 'Useraccoun.html';
    }

    async checkConnection() {
        const statusElement = document.getElementById('connectionStatus');
        const statusText = statusElement?.querySelector('.status-text');
        const statusIcon = statusElement?.querySelector('.status-icon i');

        if (!statusElement) return;

        try {
            statusText.textContent = 'กำลังตรวจสอบ...';
            statusElement.className = 'connection-status checking';
            if (statusIcon) statusIcon.className = 'fas fa-spinner fa-spin';

            const healthUrl = this.config.apiBaseUrl.includes('render.com') ? 
                `${API_CONFIG.RENDER_URL}/health` : 
                `${API_CONFIG.LOCAL_URL}/health`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                const isRender = this.config.apiBaseUrl.includes('render.com');
                statusText.textContent = isRender ? 'เชื่อมต่อ Render แล้ว' : 'เชื่อมต่อ localhost แล้ว';
                statusElement.classList.remove('checking');
                statusElement.classList.add('connected');
                if (statusIcon) statusIcon.className = 'fas fa-check-circle';
                
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 3000);
            } else {
                throw new Error('Server not responding');
            }

        } catch (error) {
            console.log('⚠️ Connection check failed:', error.message);
            
            statusText.textContent = 'ทำงานแบบออฟไลน์';
            statusElement.classList.remove('checking');
            statusElement.classList.add('disconnected');
            if (statusIcon) statusIcon.className = 'fas fa-exclamation-triangle';
        }
    }

    // Failed attempts management
    getFailedAttempts() {
        const attempts = localStorage.getItem('loginAttempts');
        return attempts ? parseInt(attempts) : 0;
    }

    incrementFailedAttempts() {
        const attempts = this.getFailedAttempts() + 1;
        localStorage.setItem('loginAttempts', attempts.toString());
        localStorage.setItem('lastFailedAttempt', Date.now().toString());
    }

    clearFailedAttempts() {
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastFailedAttempt');
        localStorage.removeItem('accountLocked');
    }

    isLockedOut() {
        const locked = localStorage.getItem('accountLocked');
        if (!locked) return false;

        const lockTime = parseInt(locked);
        const now = Date.now();
        
        if (now - lockTime < this.config.lockoutDuration) {
            return true;
        } else {
            this.clearFailedAttempts();
            return false;
        }
    }

    lockAccount() {
        localStorage.setItem('accountLocked', Date.now().toString());
    }

    getLockoutTimeLeft() {
        const locked = localStorage.getItem('accountLocked');
        if (!locked) return 0;

        const lockTime = parseInt(locked);
        const elapsed = Date.now() - lockTime;
        return Math.max(0, this.config.lockoutDuration - elapsed);
    }

    static checkAuthStatus() {
        const sessionData = sessionStorage.getItem('userData');
        const localData = localStorage.getItem('userData');
        
        try {
            if (sessionData) {
                return JSON.parse(sessionData);
            } else if (localData) {
                return JSON.parse(localData);
            }
        } catch (error) {
            console.warn('Failed to parse stored auth data:', error);
        }
        
        return null;
    }

    static logout() {
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
    }
}

// Global functions for HTML onclick handlers
window.closeErrorModal = function() {
    if (window.loginSystem) {
        window.loginSystem.closeModals();
    }
};

window.redirectToRegister = function() {
    window.location.href = 'Useraccoun.html';
};

window.testConnection = function() {
    if (window.loginSystem) {
        window.loginSystem.checkConnection();
    }
};

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Login System...');
    window.loginSystem = new LoginSystem();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginSystem;
}