class ProfileManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadUserData();
    }

    loadUserData() {
        try {
            const userData = JSON.parse(localStorage.getItem('auth_user')) || {};

            if (userData.role !== 'admin') {
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
            document.getElementById('username')?.setAttribute('value', userData.username || '');
            document.getElementById('email')?.setAttribute('value', userData.email || '');
            document.getElementById('phone')?.setAttribute('value', userData.phone || '');

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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});
