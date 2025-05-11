class SettingsManager {
    constructor() {
        this.init();
        this.debounceTimeout = null;
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('settingsForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => this.debounceCheck(e.target, this.checkEmail));
        }

        // Phone number validation
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 10) value = value.slice(0, 10);
                e.target.value = value;
            });
        }

        // Date of birth validation
        const dateInput = document.getElementById('date_of_birth');
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                const validation = this.validateDate(e.target.value);
                if (!validation.isValid) {
                    this.showNotification(validation.error, 'error');
                    e.target.value = '';
                }
            });
        }
    }

    debounceCheck(input, checkFunction) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            checkFunction.call(this, input.value.trim(), input);
        }, 500);
    }

    async checkEmail(email, input) {
        if (!email) {
            this.updateValidationStatus(input, true);
            return;
        }

        if (!this.validateEmail(email)) {
            this.updateValidationStatus(input, false, 'Email không hợp lệ');
            return;
        }

        try {
            const response = await fetch(`/api/check-email/${encodeURIComponent(email)}`);
            const data = await response.json();
            
            this.updateValidationStatus(input, !data.exists,
                data.exists ? 'Email đã được sử dụng' : '');
        } catch (error) {
            console.error('Error checking email:', error);
        }
    }

    updateValidationStatus(input, isValid, message = '') {
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('validation-feedback')) {
            feedback.textContent = message;
            feedback.style.color = isValid ? 'green' : 'red';
        }
        
        input.style.borderColor = isValid ? '#28a745' : '#dc3545';
        input.dataset.valid = isValid;
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
    }

    validateDate(dateStr) {
        const date = new Date(dateStr);
        const currentYear = new Date().getFullYear();
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return { isValid: false, error: 'Ngày không hợp lệ' };
        }

        // Check year range (e.g., between 1900 and current year)
        const year = date.getFullYear();
        if (year > currentYear) {
            return { isValid: false, error: 'Ngày sinh không thể ở tương lai' };
        }
        if (year < 1900) {
            return { isValid: false, error: 'Năm sinh không hợp lý' };
        }

        return { isValid: true, error: '' };
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        try {
            const email = document.getElementById('email');
            
            // Check if email is valid
            if (email && email.dataset.valid === 'false') {
                throw new Error('Email không hợp lệ hoặc đã được sử dụng');
            }

            const dateOfBirth = document.getElementById('date_of_birth');
            
            // Validate date of birth
            if (dateOfBirth && dateOfBirth.value) {
                const dateValidation = this.validateDate(dateOfBirth.value);
                if (!dateValidation.isValid) {
                    throw new Error(dateValidation.error);
                }
            }

            const formData = {
                email: email ? email.value.trim() : undefined,
                phone: document.getElementById('phone').value.trim(),
                name: document.getElementById('name').value.trim(),
                date_of_birth: dateOfBirth ? dateOfBirth.value : undefined,
                address: document.getElementById('address').value.trim()
            };

            // Validate phone number
            if (formData.phone && !this.validatePhone(formData.phone)) {
                throw new Error('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số.');
            }

            // Validate name
            if (formData.name && formData.name.length < 2) {
                throw new Error('Họ và tên phải có ít nhất 2 ký tự.');
            }

            // Send to server
            const response = await fetch('/api/profile/update', { // send data to Flask server
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Không thể cập nhật thông tin');
            }

            // Update local storage after successful save
            const userData = JSON.parse(localStorage.getItem('auth_user')) || {};
            Object.assign(userData, formData);
            localStorage.setItem('auth_user', JSON.stringify(userData));
            
            this.showNotification('Cập nhật thông tin thành công!', 'success');
            
            // Redirect to profile page after successful update
            setTimeout(() => {
                window.location.href = '/profile';
            }, 1500);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification(error.message || 'Không thể lưu thông tin. Vui lòng thử lại sau.', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    loadUserData() {
        try {
            const userData = JSON.parse(localStorage.getItem('auth_user')) || {};
            
            const username = document.getElementById('username');
            const email = document.getElementById('email');
            const name = document.getElementById('name');
            const dateOfBirth = document.getElementById('date_of_birth');
            const address = document.getElementById('address');
            const phone = document.getElementById('phone');

            if (username) {
                username.value = userData.username || '';
                this.checkUsername(userData.username, username);
            }
            if (email) {
                email.value = userData.email || '';
                this.checkEmail(userData.email, email);
            }
            if (name) name.value = userData.name || '';
            if (dateOfBirth && userData.date_of_birth) {
                const date = new Date(userData.date_of_birth);
                if (!isNaN(date.getTime())) {
                    const formattedDate = date.toISOString().split('T')[0];
                    dateOfBirth.value = formattedDate;
                }
            }
            if (address) address.value = userData.address || '';
            if (phone) phone.value = userData.phone || '';

        } catch (error) {
            console.error('Error loading user data:', error);
            this.showNotification('Không thể tải thông tin người dùng', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});
/*
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('settingsForm');
    const alert = document.getElementById('alert');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            email: document.getElementById('email').value.trim(),
            name: document.getElementById('name').value.trim(),
            date_of_birth: document.getElementById('date_of_birth').value,
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address').value.trim()
        };

        try {
            const response = await fetch('/api/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showAlert('success', data.message);
                // Update form values with returned data
                if (data.user) {
                    Object.keys(data.user).forEach(key => {
                        const input = document.getElementById(key);
                        if (input) {
                            input.value = data.user[key] || '';
                        }
                    });
                }
            } else {
                showAlert('error', data.error);
            }
        } catch (err) {
            showAlert('error', 'Có lỗi xảy ra khi cập nhật thông tin');
        }
    });

    function showAlert(type, message) {
        alert.textContent = message;
        alert.className = `alert ${type}`;
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }
});
*/