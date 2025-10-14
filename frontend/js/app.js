// Main application logic for NYC Taxi Analytics Dashboard

class TaxiAnalyticsApp {
    constructor() {
        this.currentSection = 'overview';
        this.data = {
            dashboardStats: null,
            hourlyPatterns: null,
            dailyPatterns: null,
            distanceAnalysis: null,
            paymentAnalysis: null,
            speedAnalysis: null,
            zones: null,
            boroughs: null
        };
        this.isLoading = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            Utils.showLoading();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Check API health
            const health = await api.healthCheck();
            if (health.status !== 'healthy') {
                throw new Error('API is not healthy');
            }
            
            // Load initial data
            await this.loadDashboardData();
            
            // Generate insights
            await insightsGenerator.generateAllInsights();
            
            Utils.hideLoading();
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            Utils.hideLoading();
            Utils.showError('Failed to initialize application. Please check your connection.');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Window events
        window.addEventListener('resize', Utils.debounce(() => {
            chartManager.resizeAllCharts();
        }, 250));

        // Error dismissal
        window.hideError = () => Utils.hideError();
    }

    /**
     * Switch between sections
     */
    async switchSection(sectionName) {
        if (this.currentSection === sectionName) return;

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Hide current section
        document.getElementById(this.currentSection).classList.remove('active');

        // Show new section
        document.getElementById(sectionName).classList.add('active');
        this.currentSection = sectionName;

        // Load section-specific data
        await this.loadSectionData(sectionName);
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            this.isLoading = true;

            // Load core dashboard data
            const [
                dashboardStats,
                hourlyPatterns,
                dailyPatterns,
                distanceAnalysis,
                paymentAnalysis,
                speedAnalysis
            ] = await Promise.all([
                api.getDashboardStats(),
                api.getHourlyPatterns(),
                api.getDailyPatterns(),
                api.getDistanceAnalysis(),
                api.getPaymentAnalysis(),
                api.getSpeedAnalysis()
            ]);

            // Store data
            this.data.dashboardStats = dashboardStats;
            this.data.hourlyPatterns = hourlyPatterns;
            this.data.dailyPatterns = dailyPatterns;
            this.data.distanceAnalysis = distanceAnalysis;
            this.data.paymentAnalysis = paymentAnalysis;
            this.data.speedAnalysis = speedAnalysis;

            // Update dashboard
            this.updateDashboardStats();
            this.createOverviewCharts();

            this.isLoading = false;

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.isLoading = false;
            throw error;
        }
    }

    /**
     * Load section-specific data
     */
    async loadSectionData(sectionName) {
        try {
            switch (sectionName) {
                case 'patterns':
                    await this.loadPatternsData();
                    break;
                case 'geography':
                    await this.loadGeographyData();
                    break;
                case 'economics':
                    await this.loadEconomicsData();
                    break;
                case 'insights':
                    await this.loadInsightsData();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${sectionName} data:`, error);
            Utils.showError(`Failed to load ${sectionName} data`);
        }
    }

    /**
     * Load patterns data
     */
    async loadPatternsData() {
        if (this.data.hourlyPatterns && this.data.dailyPatterns) {
            this.createPatternsCharts();
        } else {
            await this.loadDashboardData();
            this.createPatternsCharts();
        }
    }

    /**
     * Load geography data
     */
    async loadGeographyData() {
        try {
            // Load borough and zone data
            const [zones, boroughs] = await Promise.all([
                api.getZones(),
                api.getBoroughs()
            ]);

            this.data.zones = zones;
            this.data.boroughs = boroughs;

            // Create geography charts
            this.createGeographyCharts();

            // Initialize map if not already done
            if (!window.mapManager.map) {
                window.mapManager.initMap();
            }

            // Load sample trips for map
            const trips = await api.getTrips({ per_page: 1000 });
            if (trips && trips.trips) {
                window.mapManager.addTripMarkers(trips.trips);
            }

        } catch (error) {
            console.error('Failed to load geography data:', error);
            throw error;
        }
    }

    /**
     * Load economics data
     */
    async loadEconomicsData() {
        if (this.data.paymentAnalysis && this.data.distanceAnalysis) {
            this.createEconomicsCharts();
        } else {
            await this.loadDashboardData();
            this.createEconomicsCharts();
        }
    }

    /**
     * Load insights data
     */
    async loadInsightsData() {
        // Insights are already generated in init()
        // Just create the derived features chart
        this.createDerivedFeaturesChart();
    }

    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        const stats = this.data.dashboardStats;
        if (!stats) return;

        // Animate numbers
        const totalTripsEl = document.getElementById('total-trips');
        const totalRevenueEl = document.getElementById('total-revenue');
        const avgDurationEl = document.getElementById('avg-duration');
        const avgFareEl = document.getElementById('avg-fare');

        if (totalTripsEl) {
            Utils.animateNumber(totalTripsEl, 0, stats.total_trips);
        }
        if (totalRevenueEl) {
            totalRevenueEl.textContent = Utils.formatCurrency(stats.total_revenue);
        }
        if (avgDurationEl) {
            avgDurationEl.textContent = Utils.formatDuration(stats.average_duration_minutes);
        }
        if (avgFareEl) {
            avgFareEl.textContent = Utils.formatCurrency(stats.average_fare);
        }
    }

    /**
     * Create overview charts
     */
    createOverviewCharts() {
        if (this.data.dashboardStats && this.data.dashboardStats.popular_pickup_zones) {
            chartManager.createPopularZonesChart(this.data.dashboardStats.popular_pickup_zones);
        }
    }

    /**
     * Create patterns charts
     */
    createPatternsCharts() {
        if (this.data.hourlyPatterns) {
            chartManager.createHourlyChart(this.data.hourlyPatterns);
        }
        if (this.data.dailyPatterns) {
            chartManager.createDailyChart(this.data.dailyPatterns);
        }
        if (this.data.distanceAnalysis) {
            chartManager.createDistanceChart(this.data.distanceAnalysis);
        }
        if (this.data.speedAnalysis) {
            chartManager.createSpeedChart(this.data.speedAnalysis);
        }
        if (this.data.paymentAnalysis) {
            chartManager.createPaymentChart(this.data.paymentAnalysis);
        }
    }

    /**
     * Create geography charts
     */
    createGeographyCharts() {
        // Create borough chart from dashboard stats
        if (this.data.dashboardStats && this.data.dashboardStats.popular_pickup_zones) {
            // Group by borough
            const boroughData = {};
            this.data.dashboardStats.popular_pickup_zones.forEach(zone => {
                if (!boroughData[zone.borough]) {
                    boroughData[zone.borough] = {
                        borough: zone.borough,
                        trip_count: 0,
                        avg_fare: 0,
                        avg_distance: 0,
                        avg_duration_minutes: 0,
                        total_revenue: 0
                    };
                }
                boroughData[zone.borough].trip_count += zone.trip_count;
            });

            const boroughArray = Object.values(boroughData);
            chartManager.createBoroughChart(boroughArray);
        }
    }

    /**
     * Create economics charts
     */
    createEconomicsCharts() {
        // Create fare vs distance scatter plot
        if (this.data.distanceAnalysis) {
            // This would need actual trip data for scatter plot
            // For now, create a simple bar chart
            chartManager.createDistanceChart(this.data.distanceAnalysis);
        }

        // Create tip analysis chart
        if (this.data.paymentAnalysis) {
            chartManager.createPaymentChart(this.data.paymentAnalysis);
        }
    }

    /**
     * Create derived features chart
     */
    createDerivedFeaturesChart() {
        // This would need actual trip data with derived features
        // For now, create a sample chart
        const sampleData = [
            { trip_speed_mph: 15, fare_per_mile: 3.5 },
            { trip_speed_mph: 25, fare_per_mile: 4.2 },
            { trip_speed_mph: 35, fare_per_mile: 3.8 },
            { trip_speed_mph: 20, fare_per_mile: 4.0 },
            { trip_speed_mph: 30, fare_per_mile: 3.9 }
        ];
        chartManager.createDerivedFeaturesChart(sampleData);
    }

    /**
     * Refresh all data
     */
    async refreshData() {
        try {
            Utils.showLoading();
            api.clearCache();
            await this.loadDashboardData();
            await insightsGenerator.generateAllInsights();
            Utils.hideLoading();
        } catch (error) {
            console.error('Failed to refresh data:', error);
            Utils.hideLoading();
            Utils.showError('Failed to refresh data');
        }
    }

    /**
     * Get current data
     */
    getData() {
        return this.data;
    }

    /**
     * Export data
     */
    exportData(format = 'json') {
        const data = this.getData();
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nyc_taxi_analytics_data.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new TaxiAnalyticsApp();
    await window.app.init();
});

// Global functions for debugging
window.debug = {
    app: () => window.app,
    api: () => window.api,
    charts: () => window.chartManager,
    map: () => window.mapManager,
    insights: () => window.insightsGenerator,
    refresh: () => window.app.refreshData(),
    export: () => window.app.exportData()
};


