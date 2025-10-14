// API client for NYC Taxi Analytics Dashboard

class API {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Make HTTP request with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `${url}${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the response
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        try {
            return await this.request('/analytics/dashboard-stats');
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            throw error;
        }
    }

    /**
     * Get hourly trip patterns
     */
    async getHourlyPatterns() {
        try {
            return await this.request('/analytics/hourly-patterns');
        } catch (error) {
            console.error('Failed to fetch hourly patterns:', error);
            throw error;
        }
    }

    /**
     * Get daily trip patterns
     */
    async getDailyPatterns() {
        try {
            return await this.request('/analytics/daily-patterns');
        } catch (error) {
            console.error('Failed to fetch daily patterns:', error);
            throw error;
        }
    }

    /**
     * Get distance analysis
     */
    async getDistanceAnalysis() {
        try {
            return await this.request('/analytics/distance-analysis');
        } catch (error) {
            console.error('Failed to fetch distance analysis:', error);
            throw error;
        }
    }

    /**
     * Get payment analysis
     */
    async getPaymentAnalysis() {
        try {
            return await this.request('/analytics/payment-analysis');
        } catch (error) {
            console.error('Failed to fetch payment analysis:', error);
            throw error;
        }
    }

    /**
     * Get speed analysis
     */
    async getSpeedAnalysis() {
        try {
            return await this.request('/analytics/speed-analysis');
        } catch (error) {
            console.error('Failed to fetch speed analysis:', error);
            throw error;
        }
    }

    /**
     * Get trips with filters
     */
    async getTrips(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            return await this.request(`/trips?${queryParams}`);
        } catch (error) {
            console.error('Failed to fetch trips:', error);
            throw error;
        }
    }

    /**
     * Get zones data
     */
    async getZones() {
        try {
            return await this.request('/trips/zones');
        } catch (error) {
            console.error('Failed to fetch zones:', error);
            throw error;
        }
    }

    /**
     * Get boroughs data
     */
    async getBoroughs() {
        try {
            return await this.request('/trips/boroughs');
        } catch (error) {
            console.error('Failed to fetch boroughs:', error);
            throw error;
        }
    }

    /**
     * Get recent trips
     */
    async getRecentTrips(limit = 10) {
        try {
            return await this.request(`/trips/recent?limit=${limit}`);
        } catch (error) {
            console.error('Failed to fetch recent trips:', error);
            throw error;
        }
    }

    /**
     * Search trips
     */
    async searchTrips(query) {
        try {
            return await this.request(`/trips/search?q=${encodeURIComponent(query)}`);
        } catch (error) {
            console.error('Failed to search trips:', error);
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            return await this.request('/health');
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'unhealthy', error: error.message };
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout
        };
    }
}

// Create global API instance
window.api = new API();

// Add error handling for network issues
window.addEventListener('online', () => {
    console.log('Network connection restored');
    Utils.hideError();
});

window.addEventListener('offline', () => {
    console.log('Network connection lost');
    Utils.showError('Network connection lost. Please check your internet connection.');
});


