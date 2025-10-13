// Dashboard State Management
const dashboardState = {
    allTrips: [],
    filteredTrips: [],
    currentPage: 1,
    itemsPerPage: 20,
    currentSort: 'pickupTime',
    sortDirection: 'desc'
};

// Sample data structure - will be replaced with API calls later
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    loadSampleData();
    setupEventListeners();
    renderDashboard();
});

// Load sample data
function loadSampleData() {
    dashboardState.allTrips = sampleTrips;
    dashboardState.filteredTrips = [...sampleTrips];
    console.log('Sample data loaded:', dashboardState.allTrips.length, 'trips');
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
function applyFilters() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const passengerCount = document.getElementById('passengerCount').value;
    const minFare = document.getElementById('minFare').value;
    const maxFare = document.getElementById('maxFare').value;
    const minDistance = document.getElementById('minDistance').value;
    const maxDistance = document.getElementById('maxDistance').value;
    
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
    renderDashboard();
    
    console.log('Filters applied:', filtered.length, 'trips remaining');
}

// Reset all filters
function resetFilters() {
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
    renderDashboard();
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

