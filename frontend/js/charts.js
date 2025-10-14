// Chart.js configurations and utilities for NYC Taxi Analytics Dashboard

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#667eea',
                    borderWidth: 1
                }
            }
        };
    }

    /**
     * Create popular zones chart
     */
    createPopularZonesChart(data) {
        const ctx = document.getElementById('popularZonesChart').getContext('2d');
        
        if (this.charts.has('popularZones')) {
            this.charts.get('popularZones').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: data.map(item => `${item.zone}, ${item.borough}`),
                datasets: [{
                    label: 'Trip Count',
                    data: data.map(item => item.trip_count),
                    backgroundColor: Utils.generateColors(data.length),
                    borderColor: Utils.generateColors(data.length).map(color => color + 'CC'),
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatNumber(value);
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('popularZones', chart);
    }

    /**
     * Create hourly patterns chart
     */
    createHourlyChart(data) {
        const ctx = document.getElementById('hourlyChart').getContext('2d');
        
        if (this.charts.has('hourly')) {
            this.charts.get('hourly').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => `${item.hour}:00`),
                datasets: [{
                    label: 'Trip Count',
                    data: data.map(item => item.trip_count),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatNumber(value);
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('hourly', chart);
    }

    /**
     * Create daily patterns chart
     */
    createDailyChart(data) {
        const ctx = document.getElementById('dailyChart').getContext('2d');
        
        if (this.charts.has('daily')) {
            this.charts.get('daily').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.day_name),
                datasets: [{
                    label: 'Trip Count',
                    data: data.map(item => item.trip_count),
                    backgroundColor: Utils.generateColors(data.length),
                    borderColor: Utils.generateColors(data.length).map(color => color + 'CC'),
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatNumber(value);
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('daily', chart);
    }

    /**
     * Create distance analysis chart
     */
    createDistanceChart(data) {
        const ctx = document.getElementById('distanceChart').getContext('2d');
        
        if (this.charts.has('distance')) {
            this.charts.get('distance').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.distance_range),
                datasets: [{
                    label: 'Trip Count',
                    data: data.map(item => item.trip_count),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }, {
                    label: 'Avg Fare',
                    data: data.map(item => item.average_fare),
                    type: 'line',
                    borderColor: '#f5576c',
                    backgroundColor: 'rgba(245, 87, 108, 0.1)',
                    borderWidth: 3,
                    yAxisID: 'y1'
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatNumber(value);
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });

        this.charts.set('distance', chart);
    }

    /**
     * Create speed distribution chart
     */
    createSpeedChart(data) {
        const ctx = document.getElementById('speedChart').getContext('2d');
        
        if (this.charts.has('speed')) {
            this.charts.get('speed').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.speed_distribution.map(item => item.speed_range),
                datasets: [{
                    data: data.speed_distribution.map(item => item.trip_count),
                    backgroundColor: Utils.generateColors(data.speed_distribution.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        this.charts.set('speed', chart);
    }

    /**
     * Create payment analysis chart
     */
    createPaymentChart(data) {
        const ctx = document.getElementById('paymentChart').getContext('2d');
        
        if (this.charts.has('payment')) {
            this.charts.get('payment').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(item => item.payment_name),
                datasets: [{
                    data: data.map(item => item.trip_count),
                    backgroundColor: Utils.generateColors(data.length),
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        this.charts.set('payment', chart);
    }

    /**
     * Create borough analysis chart
     */
    createBoroughChart(data) {
        const ctx = document.getElementById('boroughChart').getContext('2d');
        
        if (this.charts.has('borough')) {
            this.charts.get('borough').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.borough),
                datasets: [{
                    label: 'Trip Count',
                    data: data.map(item => item.trip_count),
                    backgroundColor: data.map(item => Utils.getBoroughColor(item.borough)),
                    borderColor: data.map(item => Utils.getBoroughColor(item.borough)),
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatNumber(value);
                            }
                        }
                    }
                }
            }
        });

        this.charts.set('borough', chart);
    }

    /**
     * Create derived features chart
     */
    createDerivedFeaturesChart(data) {
        const ctx = document.getElementById('derivedFeaturesChart').getContext('2d');
        
        if (this.charts.has('derivedFeatures')) {
            this.charts.get('derivedFeatures').destroy();
        }

        // This would need actual derived features data from the API
        // For now, create a sample chart
        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Trip Speed vs Fare per Mile',
                    data: data.map(item => ({
                        x: item.trip_speed_mph || 0,
                        y: item.fare_per_mile || 0
                    })),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Trip Speed (mph)'
                        },
                        beginAtZero: true
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Fare per Mile ($)'
                        },
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.set('derivedFeatures', chart);
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }

    /**
     * Resize all charts
     */
    resizeAllCharts() {
        this.charts.forEach(chart => chart.resize());
    }

    /**
     * Update chart data
     */
    updateChart(chartName, newData) {
        const chart = this.charts.get(chartName);
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }
}

// Create global chart manager instance
window.chartManager = new ChartManager();

// Handle window resize
window.addEventListener('resize', Utils.debounce(() => {
    window.chartManager.resizeAllCharts();
}, 250));


