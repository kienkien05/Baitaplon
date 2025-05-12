export function showTemporaryNotification(message, isSuccess) {
  const notification = document.createElement('div');
  notification.className = `temporary-notification ${isSuccess ? 'success' : 'error'}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}