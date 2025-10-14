// Insights generation and analysis for NYC Taxi Analytics Dashboard

class InsightsGenerator {
    constructor() {
        this.insights = new Map();
    }

    /**
     * Generate all insights based on loaded data
     */
    async generateAllInsights() {
        try {
            await Promise.all([
                this.generateTrafficInsights(),
                this.generateMobilityInsights(),
                this.generateTimeOptimizationInsights(),
                this.generateRevenueInsights(),
                this.generateEconomicInsights()
            ]);
        } catch (error) {
            console.error('Error generating insights:', error);
        }
    }

    /**
     * Generate traffic pattern insights
     */
    async generateTrafficInsights() {
        try {
            const [hourlyData, dailyData, speedData] = await Promise.all([
                api.getHourlyPatterns(),
                api.getDailyPatterns(),
                api.getSpeedAnalysis()
            ]);

            let insights = [];

            // Peak hour analysis
            if (hourlyData && hourlyData.length > 0) {
                const peakHour = hourlyData.reduce((max, item) => 
                    item.trip_count > max.trip_count ? item : max, hourlyData[0]);
                const offPeakHour = hourlyData.reduce((min, item) => 
                    item.trip_count < min.trip_count ? item : min, hourlyData[0]);

                insights.push(
                    `Peak traffic occurs at ${peakHour.hour}:00 with ${Utils.formatNumber(peakHour.trip_count)} trips, ` +
                    `while the quietest time is ${offPeakHour.hour}:00 with only ${Utils.formatNumber(offPeakHour.trip_count)} trips.`
                );

                // Rush hour analysis
                const morningRush = hourlyData.filter(item => item.hour >= 7 && item.hour <= 9);
                const eveningRush = hourlyData.filter(item => item.hour >= 17 && item.hour <= 19);
                
                if (morningRush.length > 0 && eveningRush.length > 0) {
                    const morningAvg = morningRush.reduce((sum, item) => sum + item.trip_count, 0) / morningRush.length;
                    const eveningAvg = eveningRush.reduce((sum, item) => sum + item.trip_count, 0) / eveningRush.length;
                    
                    insights.push(
                        `Rush hour patterns show ${Utils.formatNumber(morningAvg)} average trips during morning rush (7-9 AM) ` +
                        `and ${Utils.formatNumber(eveningAvg)} during evening rush (5-7 PM).`
                    );
                }
            }

            // Speed analysis
            if (speedData && speedData.overall_stats) {
                const avgSpeed = speedData.overall_stats.average_speed;
                insights.push(
                    `Average trip speed is ${Utils.formatSpeed(avgSpeed)}, indicating typical city traffic conditions. ` +
                    `Trips under 10 mph likely represent heavy traffic or short distances.`
                );
            }

            // Weekend vs weekday analysis
            if (dailyData && dailyData.length > 0) {
                const weekdays = dailyData.filter(item => item.day_of_week >= 1 && item.day_of_week <= 5);
                const weekends = dailyData.filter(item => item.day_of_week === 0 || item.day_of_week === 6);
                
                if (weekdays.length > 0 && weekends.length > 0) {
                    const weekdayAvg = weekdays.reduce((sum, item) => sum + item.trip_count, 0) / weekdays.length;
                    const weekendAvg = weekends.reduce((sum, item) => sum + item.trip_count, 0) / weekends.length;
                    
                    insights.push(
                        `Weekday usage (${Utils.formatNumber(weekdayAvg)} trips/day) is significantly higher than ` +
                        `weekend usage (${Utils.formatNumber(weekendAvg)} trips/day), reflecting commuter patterns.`
                    );
                }
            }

            this.insights.set('traffic', insights.join(' '));
            this.updateInsightElement('traffic-insight', this.insights.get('traffic'));

        } catch (error) {
            console.error('Error generating traffic insights:', error);
            this.updateInsightElement('traffic-insight', 'Unable to generate traffic insights at this time.');
        }
    }

    /**
     * Generate mobility pattern insights
     */
    async generateMobilityInsights() {
        try {
            const [dashboardData, distanceData] = await Promise.all([
                api.getDashboardStats(),
                api.getDistanceAnalysis()
            ]);

            let insights = [];

            // Distance analysis
            if (distanceData && distanceData.length > 0) {
                const shortTrips = distanceData.find(item => item.distance_range === '0-1 miles');
                const mediumTrips = distanceData.find(item => item.distance_range === '1-3 miles');
                const longTrips = distanceData.find(item => item.distance_range === '5-10 miles');

                if (shortTrips && mediumTrips) {
                    const shortPercentage = (shortTrips.trip_count / dashboardData.total_trips) * 100;
                    const mediumPercentage = (mediumTrips.trip_count / dashboardData.total_trips) * 100;
                    
                    insights.push(
                        `${shortPercentage.toFixed(1)}% of trips are short distances (0-1 miles), suggesting many passengers ` +
                        `use taxis for convenience rather than necessity. ${mediumPercentage.toFixed(1)}% are medium distances (1-3 miles).`
                    );
                }

                // Long distance trips
                if (longTrips && longTrips.trip_count > 0) {
                    const longPercentage = (longTrips.trip_count / dashboardData.total_trips) * 100;
                    insights.push(
                        `${longPercentage.toFixed(1)}% of trips cover 5-10 miles, indicating significant ` +
                        `cross-borough or long-distance travel patterns.`
                    );
                }
            }

            // Average trip characteristics
            if (dashboardData) {
                insights.push(
                    `The average trip covers ${dashboardData.average_distance?.toFixed(2) || 'N/A'} miles ` +
                    `and takes ${Utils.formatDuration(dashboardData.average_duration_minutes)}, ` +
                    `with an average fare of ${Utils.formatCurrency(dashboardData.average_fare)}.`
                );
            }

            this.insights.set('mobility', insights.join(' '));
            this.updateInsightElement('mobility-insight', this.insights.get('mobility'));

        } catch (error) {
            console.error('Error generating mobility insights:', error);
            this.updateInsightElement('mobility-insight', 'Unable to generate mobility insights at this time.');
        }
    }

    /**
     * Generate time optimization insights
     */
    async generateTimeOptimizationInsights() {
        try {
            const [hourlyData, dailyData] = await Promise.all([
                api.getHourlyPatterns(),
                api.getDailyPatterns()
            ]);

            let insights = [];

            // Time-based efficiency analysis
            if (hourlyData && hourlyData.length > 0) {
                // Find most and least efficient hours
                const efficiencyData = hourlyData.map(item => ({
                    hour: item.hour,
                    trips: item.trip_count,
                    avgFare: item.average_fare,
                    avgDuration: item.average_duration_minutes,
                    efficiency: item.average_fare / (item.average_duration_minutes / 60) // fare per hour
                }));

                const mostEfficient = efficiencyData.reduce((max, item) => 
                    item.efficiency > max.efficiency ? item : max, efficiencyData[0]);
                const leastEfficient = efficiencyData.reduce((min, item) => 
                    item.efficiency < min.efficiency ? item : min, efficiencyData[0]);

                insights.push(
                    `The most efficient time for drivers is ${mostEfficient.hour}:00, generating ` +
                    `${Utils.formatCurrency(mostEfficient.efficiency)} per hour. The least efficient is ${leastEfficient.hour}:00.`
                );

                // Duration patterns
                const longDurationHours = hourlyData.filter(item => item.average_duration_minutes > 25);
                if (longDurationHours.length > 0) {
                    insights.push(
                        `Hours with longest average trip duration (${longDurationHours.map(h => h.hour + ':00').join(', ')}) ` +
                        `likely correlate with heavy traffic periods.`
                    );
                }
            }

            // Day-of-week patterns
            if (dailyData && dailyData.length > 0) {
                const busiestDay = dailyData.reduce((max, day) => 
                    day.trip_count > max.trip_count ? day : max, dailyData[0]);
                const quietestDay = dailyData.reduce((min, day) => 
                    day.trip_count < min.trip_count ? day : min, dailyData[0]);

                insights.push(
                    `${busiestDay.day_name} is the busiest day with ${Utils.formatNumber(busiestDay.trip_count)} trips, ` +
                    `while ${quietestDay.day_name} is the quietest with ${Utils.formatNumber(quietestDay.trip_count)} trips.`
                );
            }

            this.insights.set('timeOptimization', insights.join(' '));
            this.updateInsightElement('time-optimization-insight', this.insights.get('timeOptimization'));

        } catch (error) {
            console.error('Error generating time optimization insights:', error);
            this.updateInsightElement('time-optimization-insight', 'Unable to generate time optimization insights at this time.');
        }
    }

    /**
     * Generate revenue opportunity insights
     */
    async generateRevenueInsights() {
        try {
            const [dashboardData, paymentData, hourlyData] = await Promise.all([
                api.getDashboardStats(),
                api.getPaymentAnalysis(),
                api.getHourlyPatterns()
            ]);

            let insights = [];

            // Revenue analysis
            if (dashboardData) {
                const avgRevenuePerTrip = dashboardData.total_revenue / dashboardData.total_trips;
                insights.push(
                    `Total revenue of ${Utils.formatCurrency(dashboardData.total_revenue)} across ` +
                    `${Utils.formatNumber(dashboardData.total_trips)} trips, averaging ` +
                    `${Utils.formatCurrency(avgRevenuePerTrip)} per trip.`
                );
            }

            // Payment method analysis
            if (paymentData && paymentData.length > 0) {
                const creditCardTrips = paymentData.find(p => p.payment_type === 1);
                const cashTrips = paymentData.find(p => p.payment_type === 2);
                
                if (creditCardTrips && cashTrips) {
                    const ccPercentage = (creditCardTrips.trip_count / (creditCardTrips.trip_count + cashTrips.trip_count)) * 100;
                    const ccAvgTip = creditCardTrips.average_tip;
                    const cashAvgTip = cashTrips.average_tip;
                    
                    insights.push(
                        `${ccPercentage.toFixed(1)}% of trips use credit cards, with an average tip of ` +
                        `${Utils.formatCurrency(ccAvgTip)}, compared to ${Utils.formatCurrency(cashAvgTip)} for cash payments.`
                    );
                }

                // Tip analysis
                const highestTipping = paymentData.reduce((max, item) => 
                    item.average_tip > max.average_tip ? item : max, paymentData[0]);
                
                insights.push(
                    `${highestTipping.payment_name} payments show the highest average tips ` +
                    `at ${Utils.formatCurrency(highestTipping.average_tip)} per trip.`
                );
            }

            // Peak revenue hours
            if (hourlyData && hourlyData.length > 0) {
                const revenueData = hourlyData.map(item => ({
                    hour: item.hour,
                    revenue: item.trip_count * item.average_fare
                }));
                
                const peakRevenueHour = revenueData.reduce((max, item) => 
                    item.revenue > max.revenue ? item : max, revenueData[0]);
                
                insights.push(
                    `Peak revenue hour is ${peakRevenueHour.hour}:00, generating approximately ` +
                    `${Utils.formatCurrency(peakRevenueHour.revenue)} in fares.`
                );
            }

            this.insights.set('revenue', insights.join(' '));
            this.updateInsightElement('revenue-insight', this.insights.get('revenue'));

        } catch (error) {
            console.error('Error generating revenue insights:', error);
            this.updateInsightElement('revenue-insight', 'Unable to generate revenue insights at this time.');
        }
    }

    /**
     * Generate economic insights
     */
    async generateEconomicInsights() {
        try {
            const [distanceData, paymentData] = await Promise.all([
                api.getDistanceAnalysis(),
                api.getPaymentAnalysis()
            ]);

            let insights = [];

            // Fare efficiency analysis
            if (distanceData && distanceData.length > 0) {
                const fareEfficiency = distanceData.map(item => ({
                    range: item.distance_range,
                    farePerMile: item.average_fare / parseFloat(item.distance_range.split('-')[0]) || 0,
                    avgFare: item.average_fare,
                    avgDistance: item.distance_range
                }));

                const mostEfficient = fareEfficiency.reduce((max, item) => 
                    item.farePerMile > max.farePerMile ? item : max, fareEfficiency[0]);

                insights.push(
                    `The most fare-efficient distance range is ${mostEfficient.range}, ` +
                    `generating higher revenue per mile for drivers.`
                );

                this.updateInsightElement('fare-efficiency-insight', this.insights.get('fareEfficiency'));
            }

            // Peak pricing insights
            const peakPricingInsight = `Peak hours (rush periods) show higher average fares, ` +
                `indicating demand-based pricing dynamics in the NYC taxi market.`;
            this.updateInsightElement('peak-pricing-insight', peakPricingInsight);

            // Distance premium insights
            const distancePremiumInsight = `Longer trips (5+ miles) show premium pricing, ` +
                `reflecting the value proposition of convenience for extended travel.`;
            this.updateInsightElement('distance-premium-insight', distancePremiumInsight);

        } catch (error) {
            console.error('Error generating economic insights:', error);
        }
    }

    /**
     * Update insight element in the DOM
     */
    updateInsightElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
            element.classList.add('data-update');
            setTimeout(() => element.classList.remove('data-update'), 500);
        }
    }

    /**
     * Get insight by type
     */
    getInsight(type) {
        return this.insights.get(type);
    }

    /**
     * Get all insights
     */
    getAllInsights() {
        return Object.fromEntries(this.insights);
    }

    /**
     * Clear all insights
     */
    clearInsights() {
        this.insights.clear();
    }
}

// Create global insights generator instance
window.insightsGenerator = new InsightsGenerator();


