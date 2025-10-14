// Utility functions for the NYC Taxi Analytics Dashboard

class Utils {
    /**
     * Format number with commas for better readability
     */
    static formatNumber(num) {
        if (num === null || num === undefined) return '-';
        return new Intl.NumberFormat('en-US').format(Math.round(num));
    }

    /**
     * Format currency values
     */
    static formatCurrency(amount) {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Format duration in minutes
     */
    static formatDuration(minutes) {
        if (minutes === null || minutes === undefined) return '-';
        if (minutes < 60) {
            return `${Math.round(minutes)} min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.round(minutes % 60);
        return `${hours}h ${remainingMinutes}m`;
    }

    /**
     * Format speed in mph
     */
    static formatSpeed(mph) {
        if (mph === null || mph === undefined) return '-';
        return `${Math.round(mph * 10) / 10} mph`;
    }

    /**
     * Generate random colors for charts
     */
    static generateColors(count) {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#fa709a', '#fee140', '#a8edea', '#fed6e3',
            '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef'
        ];
        
        return colors.slice(0, count);
    }

    /**
     * Debounce function to limit API calls
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Show loading overlay
     */
    static showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading overlay
     */
    static hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    static showError(message = 'An error occurred') {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.querySelector('p').textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    /**
     * Hide error message
     */
    static hideError() {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    /**
     * Get payment type name from code
     */
    static getPaymentTypeName(code) {
        const types = {
            1: 'Credit Card',
            2: 'Cash',
            3: 'No Charge',
            4: 'Dispute',
            5: 'Unknown',
            6: 'Voided Trip'
        };
        return types[code] || 'Unknown';
    }

    /**
     * Get day name from day number
     */
    static getDayName(dayNumber) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayNumber] || 'Unknown';
    }

    /**
     * Calculate percentage change
     */
    static calculatePercentageChange(oldValue, newValue) {
        if (!oldValue || oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }

    /**
     * Create tooltip content for charts
     */
    static createTooltipContent(label, value, unit = '') {
        return `${label}: ${Utils.formatNumber(value)}${unit}`;
    }

    /**
     * Validate data before processing
     */
    static validateData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        return true;
    }

    /**
     * Get borough color for consistent styling
     */
    static getBoroughColor(borough) {
        const colors = {
            'Manhattan': '#667eea',
            'Brooklyn': '#764ba2',
            'Queens': '#f093fb',
            'Bronx': '#f5576c',
            'Staten Island': '#4facfe',
            'EWR': '#00f2fe'
        };
        return colors[borough] || '#999999';
    }

    /**
     * Generate insights based on data patterns
     */
    static generateInsight(data, type) {
        switch (type) {
            case 'peak_hour':
                const maxHour = data.reduce((max, item) => 
                    item.trip_count > max.trip_count ? item : max, data[0]);
                return `Peak hour is ${maxHour.hour}:00 with ${Utils.formatNumber(maxHour.trip_count)} trips`;
            
            case 'peak_day':
                const maxDay = data.reduce((max, item) => 
                    item.trip_count > max.trip_count ? item : max, data[0]);
                return `Busiest day is ${maxDay.day_name} with ${Utils.formatNumber(maxDay.trip_count)} trips`;
            
            case 'avg_speed':
                const avgSpeed = data.reduce((sum, item) => sum + item.avg_speed, 0) / data.length;
                return `Average trip speed is ${Utils.formatSpeed(avgSpeed)}`;
            
            case 'payment_preference':
                const maxPayment = data.reduce((max, item) => 
                    item.trip_count > max.trip_count ? item : max, data[0]);
                return `${Utils.formatNumber((maxPayment.trip_count / data.reduce((sum, item) => sum + item.trip_count, 0)) * 100)}% of trips use ${maxPayment.payment_name}`;
            
            default:
                return 'No insight available';
        }
    }

    /**
     * Animate number counting
     */
    static animateNumber(element, start, end, duration = 1000) {
        const startTime = performance.now();
        const startValue = parseFloat(start) || 0;
        const endValue = parseFloat(end) || 0;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = startValue + (endValue - startValue) * progress;
            element.textContent = Utils.formatNumber(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Create data summary for insights
     */
    static createDataSummary(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { count: 0, total: 0, average: 0 };
        }
        
        const count = data.length;
        const total = data.reduce((sum, item) => sum + (item.value || item.count || 0), 0);
        const average = total / count;
        
        return { count, total, average };
    }
}

// Export for use in other modules
window.Utils = Utils;


