class ProfileManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Empty since we removed avatar handling
    }

    async loadUserData() {
        try {
            // Fetch user data from server instead of localStorage
            const response = await fetch('/api/profile');
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            const userData = await response.json();
            
            // Set user role attribute on body
            document.body.setAttribute('data-user-role', userData.is_admin ? 'admin' : 'user');

            if (userData.is_admin) {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'block';
                });
            } else {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.style.display = 'none';
                });
            }

            // Load profile picture
            const profilePicture = document.getElementById('profilePicture');
            if (profilePicture) {
                profilePicture.src = userData.avatar || '/assets/default-avatar.png';
                profilePicture.alt = userData.name || 'Profile Picture';
                profilePicture.onerror = () => {
                    profilePicture.src = '/assets/default-avatar.png';
                };
            }

            // Set text content for display-only fields
            const username = document.getElementById('username');
            const email = document.getElementById('email');
            const name = document.getElementById('name');
            const dateOfBirth = document.getElementById('dateOfBirth');
            const address = document.getElementById('address');
            const phone = document.getElementById('phone');

            if (username) username.textContent = userData.username || '---';
            if (email) email.textContent = userData.email || '---';
            if (name) name.textContent = userData.name || '---';
            if (dateOfBirth) {
                if (userData.date_of_birth) {
                    const parts = userData.date_of_birth.split('/');
                    if (parts.length === 3) {
                        // Already in dd/mm/yyyy format
                        dateOfBirth.textContent = userData.date_of_birth;
                    } else {
                        // Convert from ISO format to dd/mm/yyyy
                        const date = new Date(userData.date_of_birth);
                        if (!isNaN(date.getTime())) {
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            dateOfBirth.textContent = `${day}/${month}/${year}`;
                        } else {
                            dateOfBirth.textContent = '---';
                        }
                    }
                } else {
                    dateOfBirth.textContent = '---';
                }
            }
            if (address) address.textContent = userData.address || '---';
            if (phone) phone.textContent = userData.phone || '---';

            // Load additional info
            const totalOrdersEl = document.getElementById('totalOrders');
            const favoriteProductsEl = document.getElementById('favoriteProducts');
            const reviewCountEl = document.getElementById('reviewCount');

            if (totalOrdersEl) totalOrdersEl.textContent = userData.totalOrders || '0';
            if (favoriteProductsEl) favoriteProductsEl.textContent = userData.favoriteProducts || 'None';
            if (reviewCountEl) reviewCountEl.textContent = userData.reviewCount || '0';

        } catch (error) {
            console.error('Error loading user data:', error);
            this.handleLoadError();
        }
    }

    handleLoadError() {
        this.showNotification('Không thể tải thông tin người dùng. Vui lòng thử lại sau.', 'error');
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});