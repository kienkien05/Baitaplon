document.addEventListener('DOMContentLoaded', function() {
    // Dashboard refresh button
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        // Animation for refresh button
        this.classList.add('rotating');
        setTimeout(() => {
          this.classList.remove('rotating');
        }, 1000);
        
        // Simulate data refresh
        refreshDashboardData();
      });
    }
    
    function refreshDashboardData() {
      // Simulate API call and data update
      const dashboardCards = document.querySelectorAll('.dashboard-card-value');
      
      dashboardCards.forEach(card => {
        // Add loading state
        card.style.opacity = '0.5';
        
        setTimeout(() => {
          // Update with "new" data
          const currentValue = parseInt(card.textContent.replace(/,/g, ''));
          const newValue = currentValue + Math.floor(Math.random() * 10) - 5;
          card.textContent = newValue.toLocaleString();
          card.style.opacity = '1';
        }, 800);
      });
    }
});
