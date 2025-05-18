class ProfileManager {
    constructor() {
        this.init();
    }

    async init() {
        this.loadUserData();
        this.setupEventListeners();
        await this.fetchUserStatistics();
    }

    async fetchUserStatistics() {
        try {
            const response = await fetch('/api/user/statistics');
            if (!response.ok) throw new Error('Failed to fetch user statistics');
            const data = await response.json();

            document.getElementById('totalOrders').textContent = data.totalOrders || '0';
            document.getElementById('favoriteProducts').textContent = data.favoriteProducts || 'None';
            document.getElementById('reviewCount').textContent = data.reviewCount || '0';
        } catch (error) {
            console.error('Error fetching user statistics:', error);
            // fallback to localStorage data if needed
        }
    }

    setupEventListeners() {
        // Empty since we removed avatar handling
    }

    loadUserData() {
        try {
            const userData = JSON.parse(localStorage.getItem('auth_user')) || {};
            console.log('Loading user data:', userData); // Debug log

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

            // Load form data
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
            document.getElementById('totalOrders')?.textContent = userData.totalOrders || '0';
            document.getElementById('favoriteProducts')?.textContent = userData.favoriteProducts || 'None';
            document.getElementById('reviewCount')?.textContent = userData.reviewCount || '0';

        } catch (error) {
            console.error('Error loading user data:', error);
            this.handleLoadError();
        }
    }

    handleLoadError() {
        const profilePicture = document.getElementById('profilePicture');
        if (profilePicture) {
            profilePicture.src = '/assets/default-avatar.png';
            profilePicture.alt = 'Default Avatar';
        }
        this.showNotification('Không thể tải thông tin người dùng', 'error');
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
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});
