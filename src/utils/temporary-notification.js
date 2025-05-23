export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${typeof type === 'boolean' ? (type ? 'success' : 'error') : type}`;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'notification-message';
    messageDiv.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.onclick = () => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    };
    
    notification.appendChild(messageDiv);
    notification.appendChild(closeButton);
    document.body.appendChild(notification);

    // Add show class to trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto dismiss after 5 seconds
    const autoDismissTimeout = setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideOut 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }
    }, 5000);

    // Cancel auto dismiss when hovering
    notification.addEventListener('mouseenter', () => {
        clearTimeout(autoDismissTimeout);
    });
    
    // Resume auto dismiss after mouse leaves
    notification.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }
        }, 2000);
    });
}