async function fetchProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  renderProductTable(products);
}

function renderProductTable(products) {
  const tbody = document.querySelector('#productTable tbody');
  tbody.innerHTML = '';
  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.quantity}</td>
      <td>${p.source || ''}</td>
      <td>
        <button class="btn-edit" data-id="${p.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" data-id="${p.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Khởi tạo và cập nhật biểu đồ
let charts = {};

// Modal handling
function setupModals() {
  const modals = document.querySelectorAll('.modal-container');
  const modalTriggers = document.querySelectorAll('[data-modal]');
  
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = trigger.getAttribute('data-modal');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
      }
    });
  });

  modals.forEach(modal => {
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

// Enhanced chart initialization
async function initializeCharts() {
    // Destroy existing charts before creating new ones
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = {};
    
    try {
        const timeRange = document.getElementById('timeRange').value;
        const response = await fetch(`/api/dashboard/stats?range=${timeRange}`);
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to load dashboard data');
        }
        
        const stats = result.data;
        if (!stats) {
            console.error('No stats data received');
            return;
        }

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#2b3674',
                        font: {size: 12}
                    }
                }
            }
        };

        // Update summary cards
        document.getElementById('totalProducts').textContent = stats.totalProducts.toLocaleString();
        
        // Transaction Chart
        if (document.getElementById('transactionChart')) {
            const transactionCtx = document.getElementById('transactionChart').getContext('2d');
            charts.transaction = new Chart(transactionCtx, {
                type: 'line',
                data: {
                    labels: stats.transactionDates || [],
                    datasets: [
                        {
                            label: 'Nhập kho',
                            data: stats.imports || [],
                            borderColor: '#4CAF50',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#4CAF50',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2
                        },
                        {
                            label: 'Xuất kho',
                            data: stats.exports || [],
                            borderColor: '#F44336',
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#F44336',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2
                        }
                    ]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString();
                                },
                                padding: 10
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                padding: 10
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            titleColor: '#000',
                            bodyColor: '#666',
                            bodyFont: {
                                size: 13
                            },
                            borderColor: 'rgba(0,0,0,0.1)',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} sản phẩm`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Inventory Chart
        if (document.getElementById('inventoryChart')) {
            const inventoryCtx = document.getElementById('inventoryChart').getContext('2d');
            const stockData = [
                stats.inStock || 0,
                stats.lowStock || 0,
                stats.outOfStock || 0
            ];
            
            if (stockData.some(value => value > 0)) {
                charts.inventory = new Chart(inventoryCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Còn hàng', 'Sắp hết', 'Hết hàng'],
                        datasets: [{
                            data: stockData,
                            backgroundColor: ['#4CAF50', '#FF9800', '#F44336']
                        }]
                    },
                    options: {
                        ...commonOptions,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.raw;
                                        const total = stockData.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                inventoryCtx.font = '14px Arial';
                inventoryCtx.textAlign = 'center';
                inventoryCtx.fillStyle = '#666';
                inventoryCtx.fillText('Chưa có dữ liệu tồn kho', inventoryCtx.canvas.width / 2, inventoryCtx.canvas.height / 2);
            }
        }

    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Update summary information
async function updateSummaryInfo() {
    try {
        const timeRange = document.getElementById('timeRange').value;
        const response = await fetch(`/api/dashboard/stats?range=${timeRange}`);
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to load dashboard data');
        }
        
        const stats = result.data;

        // Update summary cards
        const elements = {
            totalProducts: document.getElementById('totalProducts'),
            inStock: document.getElementById('inStock'),
            lowStock: document.getElementById('lowStock'),
            outOfStock: document.getElementById('outOfStock')
        };

        if (elements.totalProducts) elements.totalProducts.textContent = stats.totalProducts.toLocaleString();
        if (elements.inStock) elements.inStock.textContent = stats.inStock.toLocaleString();
        if (elements.lowStock) elements.lowStock.textContent = stats.lowStock.toLocaleString();
        if (elements.outOfStock) elements.outOfStock.textContent = stats.outOfStock.toLocaleString();

    } catch (error) {
        console.error('Error updating summary info:', error);
    }
}

// Thêm hàm để lắng nghe sự kiện thay đổi sản phẩm 
function setupProductChangeListeners() {
    // Listen for product changes from inventory actions
    window.addEventListener('productChanged', async () => {
        await Promise.all([
            fetchLatestTransactionData(),  // Add this new function call
            updateSummaryInfo()
        ]);
    });

    // Listen for form submissions that add/edit products
    document.addEventListener('productFormSubmit', async () => {
        await Promise.all([
            fetchLatestTransactionData(),
            updateSummaryInfo() 
        ]);
    });
}

// Add new function to fetch latest transaction data
async function fetchLatestTransactionData() {
    try {
        const timeRange = document.getElementById('timeRange').value;
        const response = await fetch(`/api/dashboard/stats?range=${timeRange}`);
        if (!response.ok) throw new Error('Failed to fetch latest stats');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        const stats = result.data;
        
        // Update transaction chart with new data
        if (charts.transaction) {
            charts.transaction.data.labels = stats.transactionDates || [];
            charts.transaction.data.datasets[0].data = stats.imports || [];
            charts.transaction.data.datasets[1].data = stats.exports || [];
            charts.transaction.update('active');  // Use active animation
        }

    } catch (error) {
        console.error('Error fetching latest transaction data:', error);
    }
}

// Add this function to show temporary notifications
function showTemporaryNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `temporary-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Use this when exporting data
async function handleExport() {
    try {
        // ... export logic ...
        showTemporaryNotification('Xuất dữ liệu thành công!');
    } catch (error) {
        showTemporaryNotification('Có lỗi khi xuất dữ liệu', 'error'); 
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing dashboard...');
    
    try {
        await Promise.all([
            initializeCharts(),
            updateSummaryInfo()
        ]);
        
        setupProductChangeListeners();  // Set up enhanced listeners
        
        // Modify refresh interval to use the new function
        setInterval(() => {
            if (!document.hidden) {
                fetchLatestTransactionData();
            }
        }, 60000);
        
        // Set up refresh intervals
        setInterval(() => {
            if (!document.hidden) {
                initializeCharts();
            }
        }, 60000); // Refresh charts every minute
        
        setInterval(() => {
            if (!document.hidden) {
                updateSummaryInfo();
            }
        }, 300000); // Refresh summary every 5 minutes
        
        // Handle time range changes
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', async () => {
                await Promise.all([
                    initializeCharts(),
                    updateSummaryInfo()
                ]);
            });
        }

        // Setup product change listeners
        setupProductChangeListeners();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
});

// Refresh charts more frequently
const REFRESH_INTERVAL = 60000; // Refresh every minute

function setupChartRefresh() {
    setInterval(() => {
        if (!document.hidden) {
            initializeCharts();
        }
    }, REFRESH_INTERVAL);
}
