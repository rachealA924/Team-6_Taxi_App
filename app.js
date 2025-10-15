// Dashboard State Management
const dashboardState = {
    allTrips: [],
    filteredTrips: [],
    currentPage: 1,
    itemsPerPage: 20,
    currentSort: 'pickupTime',
    sortDirection: 'desc'
};

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const USE_API = true; // set to true when your backend is running

// Sample data structure - fallback if API is not available
const sampleTrips = [
    {
        id: 1,
        pickupTime: '2024-01-15 08:30:00',
        dropoffTime: '2024-01-15 09:15:00',
        passengerCount: 2,
        tripDistance: 4.2,
        tripDuration: 45,
        fareAmount: 18.50,
        tipAmount: 3.70,
        paymentType: 'Credit card',
        pickupLat: 40.7589,
        pickupLon: -73.9851,
        dropoffLat: 40.7614,
        dropoffLon: -73.9776
    },
    {
        id: 2,
        pickupTime: '2024-01-15 12:45:00',
        dropoffTime: '2024-01-15 13:05:00',
        passengerCount: 1,
        tripDistance: 1.8,
        tripDuration: 20,
        fareAmount: 8.25,
        tipAmount: 1.65,
        paymentType: 'Cash',
        pickupLat: 40.7128,
        pickupLon: -74.0060,
        dropoffLat: 40.7282,
        dropoffLon: -74.0776
    },
    {
        id: 3,
        pickupTime: '2024-01-15 17:20:00',
        dropoffTime: '2024-01-15 18:10:00',
        passengerCount: 4,
        tripDistance: 6.5,
        tripDuration: 50,
        fareAmount: 28.00,
        tipAmount: 5.60,
        paymentType: 'Credit card',
        pickupLat: 40.7505,
        pickupLon: -73.9934,
        dropoffLat: 40.6892,
        dropoffLon: -74.0445
    },
    {
        id: 4,
        pickupTime: '2024-01-15 19:30:00',
        dropoffTime: '2024-01-15 19:55:00',
        passengerCount: 2,
        tripDistance: 3.1,
        tripDuration: 25,
        fareAmount: 14.75,
        tipAmount: 2.95,
        paymentType: 'Credit card',
        pickupLat: 40.7489,
        pickupLon: -73.9680,
        dropoffLat: 40.7580,
        dropoffLon: -73.9855
    },
    {
        id: 5,
        pickupTime: '2024-01-15 22:00:00',
        dropoffTime: '2024-01-15 22:30:00',
        passengerCount: 1,
        tripDistance: 5.8,
        tripDuration: 30,
        fareAmount: 24.50,
        tipAmount: 4.90,
        paymentType: 'Credit card',
        pickupLat: 40.6782,
        pickupLon: -73.9442,
        dropoffLat: 40.7589,
        dropoffLon: -73.9851
    }
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard initialized');
    await loadSampleData();
    setupEventListeners();
});

// Load data from API or fallback to sample data
async function loadSampleData() {
    try {
        if (!USE_API) {
            dashboardState.allTrips = sampleTrips;
            dashboardState.filteredTrips = [...sampleTrips];
            console.log('Sample data loaded:', dashboardState.allTrips.length, 'trips');
            await updateStats();
            await renderDashboard();
            return;
        }
        console.log('Fetching data from API...');
        const response = await fetch(`${API_BASE_URL}/trips`);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        dashboardState.allTrips = data.trips;
        dashboardState.filteredTrips = [...data.trips];
        
        console.log(`Loaded ${data.trips.length} trips from API`);
        await updateStats();
        await renderDashboard();
        
    } catch (error) {
        console.warn('API not available, using sample data:', error.message);
    dashboardState.allTrips = sampleTrips;
    dashboardState.filteredTrips = [...sampleTrips];
    console.log('Sample data loaded:', dashboardState.allTrips.length, 'trips');
        await updateStats();
        await renderDashboard();
    }
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

// Handle search input
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    filterTripsBySearch(searchTerm);
}

// Custom search algorithm - filters trips based on search term
function filterTripsBySearch(searchTerm) {
    if (!searchTerm) {
        dashboardState.filteredTrips = [...dashboardState.allTrips];
    } else {
        const results = [];
        for (let i = 0; i < dashboardState.allTrips.length; i++) {
            const trip = dashboardState.allTrips[i];
            const searchableText = [
                trip.pickupTime,
                trip.dropoffTime,
                trip.paymentType,
                trip.passengerCount.toString(),
                trip.fareAmount.toString()
            ].join(' ').toLowerCase();
            
            if (searchableText.includes(searchTerm)) {
                results.push(trip);
            }
        }
        dashboardState.filteredTrips = results;
    }
    dashboardState.currentPage = 1;
    renderDashboard();
}

// Apply filters from UI
async function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const passengerCount = document.getElementById('passengerCount').value;
    const minFare = document.getElementById('minFare').value;
    const maxFare = document.getElementById('maxFare').value;
    const minDistance = document.getElementById('minDistance').value;
    const maxDistance = document.getElementById('maxDistance').value;
    
    try {
        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (passengerCount) params.append('passengerCount', passengerCount);
        if (minFare) params.append('minFare', minFare);
        if (maxFare) params.append('maxFare', maxFare);
        if (minDistance) params.append('minDistance', minDistance);
        if (maxDistance) params.append('maxDistance', maxDistance);
        params.append('sort', dashboardState.currentSort);
        params.append('order', dashboardState.sortDirection);

        if (!USE_API) throw new Error('API disabled');
        console.log('Fetching filtered data from API...');
        const response = await fetch(`${API_BASE_URL}/trips?${params}`);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        dashboardState.filteredTrips = data.trips;
        dashboardState.currentPage = 1;
        
        console.log(`Loaded ${data.trips.length} filtered trips from API`);
        await renderDashboard();
        
    } catch (error) {
        console.warn('API not available, using local filtering:', error.message);
        
        // Fallback to local filtering
    let filtered = [...dashboardState.allTrips];
    
    // Date filter
    if (startDate) {
        filtered = filtered.filter(trip => trip.pickupTime >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter(trip => trip.pickupTime <= endDate);
    }
    
    // Passenger count filter
    if (passengerCount) {
        filtered = filtered.filter(trip => trip.passengerCount === parseInt(passengerCount));
    }
    
    // Fare range filter
    if (minFare) {
        filtered = filtered.filter(trip => trip.fareAmount >= parseFloat(minFare));
    }
    if (maxFare) {
        filtered = filtered.filter(trip => trip.fareAmount <= parseFloat(maxFare));
    }
    
    // Distance range filter
    if (minDistance) {
        filtered = filtered.filter(trip => trip.tripDistance >= parseFloat(minDistance));
    }
    if (maxDistance) {
        filtered = filtered.filter(trip => trip.tripDistance <= parseFloat(maxDistance));
    }
    
    dashboardState.filteredTrips = filtered;
    dashboardState.currentPage = 1;
        await renderDashboard();
    
    console.log('Filters applied:', filtered.length, 'trips remaining');
    }
}

// Reset all filters
async function resetFilters() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('passengerCount').value = '';
    document.getElementById('minFare').value = '';
    document.getElementById('maxFare').value = '';
    document.getElementById('minDistance').value = '';
    document.getElementById('maxDistance').value = '';
    document.getElementById('searchInput').value = '';
    
    dashboardState.filteredTrips = [...dashboardState.allTrips];
    dashboardState.currentPage = 1;
    await updateStats();
    await renderDashboard();
}

// Update statistics from API or calculate locally
async function updateStats() {
    try {
        if (!USE_API) throw new Error('API disabled');
        // Try to get stats from API first
        const response = await fetch(`${API_BASE_URL}/trips/stats`);
        
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
            console.log('Stats loaded from API');
            return;
        }
    } catch (error) {
        console.warn('API stats not available, calculating locally:', error.message);
    }
    
    // Fallback: calculate stats locally
    const trips = dashboardState.filteredTrips;
    if (trips.length === 0) {
        updateStatsDisplay({
            totalTrips: 0,
            avgFare: 0,
            avgDuration: 0,
            avgDistance: 0,
            totalRevenue: 0,
            avgTip: 0
        });
        return;
    }
    
    const stats = {
        totalTrips: trips.length,
        avgFare: trips.reduce((sum, trip) => sum + trip.fareAmount, 0) / trips.length,
        avgDuration: trips.reduce((sum, trip) => sum + trip.tripDuration, 0) / trips.length,
        avgDistance: trips.reduce((sum, trip) => sum + trip.tripDistance, 0) / trips.length,
        totalRevenue: trips.reduce((sum, trip) => sum + trip.fareAmount, 0),
        avgTip: trips.reduce((sum, trip) => sum + trip.tipAmount, 0) / trips.length
    };
    
    updateStatsDisplay(stats);
}

// Update the stats display in the UI
function updateStatsDisplay(stats) {
    const totalTripsElement = document.getElementById('totalTrips');
    const avgFareElement = document.getElementById('avgFare');
    const avgDurationElement = document.getElementById('avgDuration');
    const totalRevenueElement = document.getElementById('totalRevenue');
    
    if (totalTripsElement) {
        totalTripsElement.textContent = stats.totalTrips.toLocaleString();
    }
    if (avgFareElement) {
        avgFareElement.textContent = `$${stats.avgFare.toFixed(2)}`;
    }
    if (avgDurationElement) {
        avgDurationElement.textContent = `${Math.round(stats.avgDuration)} min`;
    }
    if (totalRevenueElement) {
        totalRevenueElement.textContent = `$${stats.totalRevenue.toFixed(2)}`;
    }
}

// Load hourly data from API
async function loadHourlyData() {
    try {
        if (!USE_API) throw new Error('API disabled');
        const response = await fetch(`${API_BASE_URL}/trips/hourly`);
        
        if (response.ok) {
            const hourlyData = await response.json();
            console.log('Hourly data loaded from API');
            return hourlyData;
        }
    } catch (error) {
        console.warn('API hourly data not available, calculating locally:', error.message);
    }
    
    // Fallback: calculate hourly data locally
    const trips = dashboardState.filteredTrips;
    const hourlyCounts = new Array(24).fill(0);
    const hourlyFares = new Array(24).fill(0);
    const hourlyDistances = new Array(24).fill(0);
    
    trips.forEach(trip => {
        const hour = parseInt(trip.pickupTime.split(' ')[1].split(':')[0]);
        hourlyCounts[hour]++;
        hourlyFares[hour] += trip.fareAmount;
        hourlyDistances[hour] += trip.tripDistance;
    });
    
    return hourlyCounts.map((count, hour) => ({
        hour: hour,
        count: count,
        avgFare: count > 0 ? (hourlyFares[hour] / count).toFixed(2) : 0,
        avgDistance: count > 0 ? (hourlyDistances[hour] / count).toFixed(2) : 0
    }));
}

// Load payment type data from API
async function loadPaymentTypeData() {
    try {
        if (!USE_API) throw new Error('API disabled');
        const response = await fetch(`${API_BASE_URL}/trips/payment-types`);
        
        if (response.ok) {
            const paymentData = await response.json();
            console.log('Payment data loaded from API');
            return paymentData;
        }
    } catch (error) {
        console.warn('API payment data not available, calculating locally:', error.message);
    }
    
    // Fallback: calculate payment data locally
    const trips = dashboardState.filteredTrips;
    const paymentTypes = {};
    
    trips.forEach(trip => {
        const type = trip.paymentType;
        if (!paymentTypes[type]) {
            paymentTypes[type] = { count: 0, totalFare: 0, totalTip: 0 };
        }
        paymentTypes[type].count++;
        paymentTypes[type].totalFare += trip.fareAmount;
        paymentTypes[type].totalTip += trip.tipAmount;
    });
    
    return Object.entries(paymentTypes).map(([type, data]) => ({
        paymentType: type,
        count: data.count,
        avgFare: (data.totalFare / data.count).toFixed(2),
        avgTip: (data.totalTip / data.count).toFixed(2)
    }));
}

// Sort table by selected column
function sortTable() {
    const sortBy = document.getElementById('sortBy').value;
    dashboardState.currentSort = sortBy;
    
    // Toggle sort direction
    if (dashboardState.currentSort === sortBy) {
        dashboardState.sortDirection = dashboardState.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    sortTripsByField(dashboardState.filteredTrips, sortBy, dashboardState.sortDirection);
    renderDashboard();
}

// Custom sorting algorithm - sorts trips by specified field
function sortTripsByField(trips, field, direction) {
    const sortedTrips = [...trips];
    
    // Bubble sort implementation
    for (let i = 0; i < sortedTrips.length - 1; i++) {
        for (let j = 0; j < sortedTrips.length - i - 1; j++) {
            let shouldSwap = false;
            
            if (field === 'pickupTime') {
                shouldSwap = direction === 'asc' 
                    ? sortedTrips[j].pickupTime > sortedTrips[j + 1].pickupTime
                    : sortedTrips[j].pickupTime < sortedTrips[j + 1].pickupTime;
            } else if (field === 'fare') {
                shouldSwap = direction === 'asc'
                    ? sortedTrips[j].fareAmount > sortedTrips[j + 1].fareAmount
                    : sortedTrips[j].fareAmount < sortedTrips[j + 1].fareAmount;
            } else if (field === 'distance') {
                shouldSwap = direction === 'asc'
                    ? sortedTrips[j].tripDistance > sortedTrips[j + 1].tripDistance
                    : sortedTrips[j].tripDistance < sortedTrips[j + 1].tripDistance;
            } else if (field === 'duration') {
                shouldSwap = direction === 'asc'
                    ? sortedTrips[j].tripDuration > sortedTrips[j + 1].tripDuration
                    : sortedTrips[j].tripDuration < sortedTrips[j + 1].tripDuration;
            }
            
            if (shouldSwap) {
                const temp = sortedTrips[j];
                sortedTrips[j] = sortedTrips[j + 1];
                sortedTrips[j + 1] = temp;
            }
        }
    }
    
    dashboardState.filteredTrips = sortedTrips;
    console.log('Trips sorted by', field, 'in', direction, 'order');
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(dashboardState.filteredTrips.length / dashboardState.itemsPerPage);
    const newPage = dashboardState.currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        dashboardState.currentPage = newPage;
        renderDashboard();
    }
}

// Render entire dashboard
async function renderDashboard() {
    await updateMetrics();
    await renderCharts();
    renderInsights();
    renderTable();
    updatePagination();
}

// Update metrics cards
async function updateMetrics() {
    // Use the API-based stats function
    await updateStats();
}

// Render charts
async function renderCharts() {
    const trips = dashboardState.filteredTrips;
    
    // Load data from API or use local data
    const hourlyData = await loadHourlyData();
    const paymentData = await loadPaymentTypeData();
    
    // Hourly distribution chart
    renderHourlyChartFromData(hourlyData);
    
    // Fare distribution chart
    renderFareChart(trips);
    
    // Passenger count chart
    renderPassengerChart(trips);
    
    // Payment type chart
    renderPaymentChartFromData(paymentData);
}

// Render hourly distribution chart
function renderHourlyChart(trips) {
    const hourlyData = new Array(24).fill(0);
    
    trips.forEach(trip => {
        const hour = parseInt(trip.pickupTime.split(' ')[1].split(':')[0]);
        hourlyData[hour]++;
    });
    
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    
    if (window.hourlyChartInstance) {
        window.hourlyChartInstance.destroy();
    }
    
    window.hourlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => i + ':00'),
            datasets: [{
                label: 'Number of Trips',
                data: hourlyData,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Render fare distribution chart
function renderFareChart(trips) {
    const fareRanges = {
        '0-10': 0,
        '10-20': 0,
        '20-30': 0,
        '30-40': 0,
        '40+': 0
    };
    
    trips.forEach(trip => {
        const fare = trip.fareAmount;
        if (fare < 10) fareRanges['0-10']++;
        else if (fare < 20) fareRanges['10-20']++;
        else if (fare < 30) fareRanges['20-30']++;
        else if (fare < 40) fareRanges['30-40']++;
        else fareRanges['40+']++;
    });
    
    const ctx = document.getElementById('fareChart').getContext('2d');
    
    if (window.fareChartInstance) {
        window.fareChartInstance.destroy();
    }
    
    window.fareChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(fareRanges),
            datasets: [{
                data: Object.values(fareRanges),
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(241, 196, 15, 0.7)',
                    'rgba(231, 76, 60, 0.7)',
                    'rgba(155, 89, 182, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Render passenger count chart
function renderPassengerChart(trips) {
    const passengerCounts = {};
    
    trips.forEach(trip => {
        const count = trip.passengerCount;
        passengerCounts[count] = (passengerCounts[count] || 0) + 1;
    });
    
    const ctx = document.getElementById('passengerChart').getContext('2d');
    
    if (window.passengerChartInstance) {
        window.passengerChartInstance.destroy();
    }
    
    window.passengerChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(passengerCounts),
            datasets: [{
                label: 'Number of Trips',
                data: Object.values(passengerCounts),
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Render payment type chart
function renderPaymentChart(trips) {
    const paymentTypes = {};
    
    trips.forEach(trip => {
        const type = trip.paymentType;
        paymentTypes[type] = (paymentTypes[type] || 0) + 1;
    });
    
    const ctx = document.getElementById('paymentChart').getContext('2d');
    
    if (window.paymentChartInstance) {
        window.paymentChartInstance.destroy();
    }
    
    window.paymentChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(paymentTypes),
            datasets: [{
                data: Object.values(paymentTypes),
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(241, 196, 15, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Render hourly chart from API data
function renderHourlyChartFromData(hourlyData) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    
    if (window.hourlyChartInstance) {
        window.hourlyChartInstance.destroy();
    }
    
    window.hourlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hourlyData.map(data => data.hour + ':00'),
            datasets: [{
                label: 'Number of Trips',
                data: hourlyData.map(data => data.count),
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Trips by Hour of Day'
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

// Render payment chart from API data
function renderPaymentChartFromData(paymentData) {
    const ctx = document.getElementById('paymentChart').getContext('2d');
    
    if (window.paymentChartInstance) {
        window.paymentChartInstance.destroy();
    }
    
    window.paymentChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: paymentData.map(data => data.paymentType),
            datasets: [{
                data: paymentData.map(data => data.count),
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(241, 196, 15, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Payment Methods'
                }
            }
        }
    });
}

// Render insights
function renderInsights() {
    const trips = dashboardState.filteredTrips;
    
    if (trips.length === 0) {
        document.getElementById('peakHoursInsight').textContent = 'No data available';
        document.getElementById('fareInsight').textContent = 'No data available';
        document.getElementById('distanceInsight').textContent = 'No data available';
        return;
    }
    
    // Calculate peak hours
    const hourlyCounts = new Array(24).fill(0);
    trips.forEach(trip => {
        const hour = parseInt(trip.pickupTime.split(' ')[1].split(':')[0]);
        hourlyCounts[hour]++;
    });
    
    const maxTrips = Math.max(...hourlyCounts);
    const peakHour = hourlyCounts.indexOf(maxTrips);
    
    document.getElementById('peakHoursInsight').textContent = 
        `Peak travel time is ${peakHour}:00 with ${maxTrips} trips. This represents ${((maxTrips/trips.length)*100).toFixed(1)}% of total trips.`;
    
    // Calculate fare insights
    const fares = trips.map(t => t.fareAmount);
    const avgFare = fares.reduce((a, b) => a + b, 0) / fares.length;
    const tips = trips.map(t => t.tipAmount);
    const avgTip = tips.reduce((a, b) => a + b, 0) / tips.length;
    
    document.getElementById('fareInsight').textContent = 
        `Average fare is $${avgFare.toFixed(2)} with an average tip of $${avgTip.toFixed(2)}. Tip rate is ${((avgTip/avgFare)*100).toFixed(1)}%.`;
    
    // Calculate distance insights
    const distances = trips.map(t => t.tripDistance);
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    const minDistance = Math.min(...distances);
    
    document.getElementById('distanceInsight').textContent = 
        `Average trip distance is ${avgDistance.toFixed(1)} miles. Range: ${minDistance.toFixed(1)} - ${maxDistance.toFixed(1)} miles.`;
}

// Render data table
function renderTable() {
    const tbody = document.getElementById('tripTableBody');
    tbody.innerHTML = '';
    
    const startIndex = (dashboardState.currentPage - 1) * dashboardState.itemsPerPage;
    const endIndex = startIndex + dashboardState.itemsPerPage;
    const currentTrips = dashboardState.filteredTrips.slice(startIndex, endIndex);
    
    if (currentTrips.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No trips found</td></tr>';
        return;
    }
    
    currentTrips.forEach(trip => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${trip.pickupTime}</td>
            <td>${trip.dropoffTime}</td>
            <td>${trip.passengerCount}</td>
            <td>${trip.tripDistance.toFixed(2)}</td>
            <td>${trip.tripDuration}</td>
            <td>$${trip.fareAmount.toFixed(2)}</td>
            <td>$${trip.tipAmount.toFixed(2)}</td>
            <td>${trip.paymentType}</td>
        `;
    });
}

// Update pagination info
function updatePagination() {
    const totalPages = Math.ceil(dashboardState.filteredTrips.length / dashboardState.itemsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${dashboardState.currentPage} of ${totalPages}`;
    
    const prevBtn = document.querySelector('.page-btn:first-of-type');
    const nextBtn = document.querySelector('.page-btn:last-of-type');
    
    if (prevBtn) {
        prevBtn.disabled = dashboardState.currentPage === 1;
    }
    if (nextBtn) {
        nextBtn.disabled = dashboardState.currentPage >= totalPages;
    }
}

//API Integration Functions (to be implemented when backend is ready)
async function fetchTripsFromAPI() {
    try {
         const response = await fetch('http://localhost:5000/api/trips');
         const data = await response.json();
         return data;
        
        // For now, return sample data
        return sampleTrips;
    } catch (error) {
        console.error('Error fetching trips:', error);
        return [];
    }
}

async function fetchFilteredTrips(filters) {
    try {
         const response = await fetch('http://localhost:5000/api/trips/filter', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(filters)
         });
         const data = await response.json();
         return data;
        
        // For now, return sample data
        return sampleTrips;
    } catch (error) {
        console.error('Error fetching filtered trips:', error);
        return [];
    }
}

console.log('Dashboard app loaded successfully');

