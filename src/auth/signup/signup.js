class SignupManager {
    constructor() {
        console.log('[DEBUG] SignupManager initialized');
        this.form = document.getElementById('signupForm');
        this.setup();
    }

    setup() {
        this.form?.addEventListener('submit', this.handleSignup.bind(this));
        this.setupPasswordToggle();
        this.setupGoogleSignup();
    }

    setupPasswordToggle() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.createElement('i');
        toggleBtn.className = 'fas fa-eye password-toggle';
        passwordInput?.parentElement?.appendChild(toggleBtn);

        toggleBtn.onclick = () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.className = 'fas fa-eye-slash password-toggle';
            } else {
                passwordInput.type = 'password';
                toggleBtn.className = 'fas fa-eye password-toggle';
            }
        };
    }

    setupGoogleSignup() {
        
        this.setupRealtimeValidation();
    }

    async setupRealtimeValidation() {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const usernameError = document.getElementById('username-error');
        const emailError = document.getElementById('email-error');
        let timeouts = {};

        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                this.handleInputValidation('username', usernameInput, usernameError, timeouts);
            });
        }

        if (emailInput) {
            emailInput.addEventListener('input', () => {
                this.handleInputValidation('email', emailInput, emailError, timeouts);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePassword(passwordInput.value);
            });
        }
    }

    async handleInputValidation(field, input, errorElement, timeouts) {
        clearTimeout(timeouts[field]);
        const value = input.value.trim();

        if (!value) {
            errorElement.innerText = '';
            input.classList.remove('invalid');
            return;
        }

        timeouts[field] = setTimeout(async () => {
            try {
                const response = await fetch(`/api/check-${field}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [field]: value })
                });
                const data = await response.json();

                if (!data.valid) {
                    errorElement.innerText = data.error;
                    input.classList.add('invalid');
                } else {
                    errorElement.innerText = '';
                    input.classList.remove('invalid');
                }
            } catch (err) {
                console.error(`Error checking ${field}:`, err);
                errorElement.innerText = `Lỗi kiểm tra ${field === 'username' ? 'tên đăng nhập' : 'email'}`;
                input.classList.add('invalid');
            }
        }, 400);
    }

    validatePassword(password) {
        const passwordStrength = document.getElementById('password-strength');
        const strengthText = document.getElementById('strength-text');
        
        if (!password) {
            passwordStrength.style.width = '0';
            strengthText.textContent = '';
            return;
        }

        let strength = 0;
        const patterns = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[!@#$%^&*]/.test(password)
        };

        strength = Object.values(patterns).filter(Boolean).length;

        const strengthClasses = ['weak', 'fair', 'good', 'strong'];
        const strengthMessages = ['Yếu', 'Trung bình', 'Tốt', 'Mạnh'];

        passwordStrength.className = `password-strength-meter ${strengthClasses[strength - 1]}`;
        passwordStrength.style.width = `${(strength / 5) * 100}%`;
        strengthText.textContent = strengthMessages[strength - 1];
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!this.validateForm({username, email, password, confirmPassword})) {
            return;
        }

        try {
            const response = await fetch('/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store',
                    'Pragma': 'no-cache'
                },
                credentials: 'include',
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // If there's a redirect URL, use it, otherwise fallback to login
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else {
                    window.location.href = '/auth/login?signup_success=true';
                }
            } else {
                // API error with specific message
                const errorMessage = data.error || 'Có lỗi xảy ra khi đăng ký!';
                window.location.href = `/auth/login?error=${encodeURIComponent(errorMessage)}`;
            }
        } catch (error) {
            // Network or other errors
            console.error('Signup error:', error);
            window.location.href = `/auth/login?error=${encodeURIComponent('Lỗi kết nối, vui lòng thử lại sau!')}`;
        }
    }

    showMessage(message, isSuccess) {
        const notification = document.createElement('div');
        notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.5s ease;
            background-color: ${isSuccess ? '#4CAF50' : '#f44336'};
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    validateForm(data) {
        if (!data.username || !data.email || !data.password || !data.confirmPassword) {
            alert('Vui lòng điền đầy đủ thông tin');
            return false;
        }

        if (data.password !== data.confirmPassword) {
            alert('Mật khẩu xác nhận không khớp');
            return false;
        }

        if (data.password.length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }

        return true;
    }


    loadGoogleSDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SignupManager();
});
