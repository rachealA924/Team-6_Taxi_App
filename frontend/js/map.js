// Interactive map functionality for NYC Taxi Analytics Dashboard

class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.heatmapLayer = null;
        this.boroughLayers = new Map();
    }

    /**
     * Initialize the map
     */
    initMap() {
        // NYC coordinates
        const nycCenter = [40.7128, -74.0060];
        
        // Create map
        this.map = L.map('map').setView(nycCenter, 11);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add borough boundaries (simplified)
        this.addBoroughBoundaries();
        
        console.log('Map initialized');
    }

    /**
     * Add borough boundaries to the map
     */
    addBoroughBoundaries() {
        // Simplified NYC borough boundaries
        const boroughs = {
            'Manhattan': {
                color: '#667eea',
                bounds: [[40.7000, -74.0500], [40.8000, -73.9000]]
            },
            'Brooklyn': {
                color: '#764ba2',
                bounds: [[40.5700, -74.0500], [40.7000, -73.8000]]
            },
            'Queens': {
                color: '#f093fb',
                bounds: [[40.5400, -74.0500], [40.8000, -73.7000]]
            },
            'Bronx': {
                color: '#f5576c',
                bounds: [[40.8000, -73.9500], [40.9200, -73.8000]]
            },
            'Staten Island': {
                color: '#4facfe',
                bounds: [[40.5000, -74.2500], [40.6500, -74.0000]]
            }
        };

        Object.entries(boroughs).forEach(([name, config]) => {
            const bounds = L.rectangle(config.bounds, {
                color: config.color,
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.1
            }).addTo(this.map);

            // Add borough label
            const center = bounds.getBounds().getCenter();
            L.marker(center, {
                icon: L.divIcon({
                    className: 'borough-label',
                    html: `<div style="
                        background: ${config.color};
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-weight: bold;
                        font-size: 12px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    ">${name}</div>`,
                    iconSize: [80, 20],
                    iconAnchor: [40, 10]
                })
            }).addTo(this.map);

            this.boroughLayers.set(name, bounds);
        });
    }

    /**
     * Add trip markers to the map
     */
    addTripMarkers(trips) {
        // Clear existing markers
        this.clearMarkers();

        // Limit markers for performance
        const maxMarkers = 1000;
        const sampleTrips = trips.slice(0, maxMarkers);

        sampleTrips.forEach(trip => {
            if (trip.pickup_latitude && trip.pickup_longitude) {
                const marker = L.circleMarker([trip.pickup_latitude, trip.pickup_longitude], {
                    radius: 4,
                    fillColor: this.getTripColor(trip),
                    color: '#fff',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.6
                }).addTo(this.map);

                // Add popup with trip details
                marker.bindPopup(this.createTripPopup(trip));
                this.markers.push(marker);
            }
        });

        // Fit map to show all markers
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    /**
     * Create heatmap layer
     */
    createHeatmap(trips) {
        // Clear existing heatmap
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
        }

        // Prepare heatmap data
        const heatmapData = trips
            .filter(trip => trip.pickup_latitude && trip.pickup_longitude)
            .slice(0, 5000) // Limit for performance
            .map(trip => [
                trip.pickup_latitude,
                trip.pickup_longitude,
                1 // intensity
            ]);

        if (heatmapData.length > 0) {
            this.heatmapLayer = L.heatLayer(heatmapData, {
                radius: 20,
                blur: 15,
                maxZoom: 17,
                gradient: {
                    0.4: 'blue',
                    0.6: 'cyan',
                    0.7: 'lime',
                    0.8: 'yellow',
                    1.0: 'red'
                }
            }).addTo(this.map);
        }
    }

    /**
     * Add borough statistics to map
     */
    addBoroughStats(boroughData) {
        boroughData.forEach(borough => {
            const layer = this.boroughLayers.get(borough.borough);
            if (layer) {
                // Update layer style based on trip count
                const intensity = Math.min(borough.trip_count / 10000, 1);
                layer.setStyle({
                    fillOpacity: 0.2 + (intensity * 0.3),
                    color: Utils.getBoroughColor(borough.borough)
                });

                // Add popup with statistics
                layer.bindPopup(this.createBoroughPopup(borough));
            }
        });
    }

    /**
     * Get color for trip based on fare amount
     */
    getTripColor(trip) {
        const fare = trip.fare_amount || 0;
        if (fare < 10) return '#4CAF50'; // Green for low fare
        if (fare < 25) return '#FFC107'; // Yellow for medium fare
        if (fare < 50) return '#FF9800'; // Orange for high fare
        return '#F44336'; // Red for very high fare
    }

    /**
     * Create popup content for trip
     */
    createTripPopup(trip) {
        return `
            <div style="min-width: 200px;">
                <h4>Trip Details</h4>
                <p><strong>Pickup:</strong> ${new Date(trip.pickup_datetime).toLocaleString()}</p>
                <p><strong>Distance:</strong> ${trip.trip_distance} miles</p>
                <p><strong>Duration:</strong> ${Utils.formatDuration(trip.trip_duration / 60)}</p>
                <p><strong>Fare:</strong> ${Utils.formatCurrency(trip.fare_amount)}</p>
                <p><strong>Speed:</strong> ${Utils.formatSpeed(trip.trip_speed_mph)}</p>
            </div>
        `;
    }

    /**
     * Create popup content for borough
     */
    createBoroughPopup(borough) {
        return `
            <div style="min-width: 200px;">
                <h4>${borough.borough} Statistics</h4>
                <p><strong>Total Trips:</strong> ${Utils.formatNumber(borough.trip_count)}</p>
                <p><strong>Average Fare:</strong> ${Utils.formatCurrency(borough.avg_fare)}</p>
                <p><strong>Average Distance:</strong> ${borough.avg_distance.toFixed(2)} miles</p>
                <p><strong>Average Duration:</strong> ${Utils.formatDuration(borough.avg_duration_minutes)}</p>
                <p><strong>Total Revenue:</strong> ${Utils.formatCurrency(borough.total_revenue)}</p>
            </div>
        `;
    }

    /**
     * Clear all markers
     */
    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }

    /**
     * Clear heatmap
     */
    clearHeatmap() {
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
            this.heatmapLayer = null;
        }
    }

    /**
     * Toggle between markers and heatmap view
     */
    toggleView(type) {
        if (type === 'markers') {
            this.clearHeatmap();
        } else if (type === 'heatmap') {
            this.clearMarkers();
        }
    }

    /**
     * Add layer control
     */
    addLayerControl() {
        const baseMaps = {
            "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
        };

        const overlayMaps = {
            "Boroughs": new L.LayerGroup(Object.values(this.boroughLayers))
        };

        L.control.layers(baseMaps, overlayMaps).addTo(this.map);
    }

    /**
     * Fit map to specific bounds
     */
    fitToBounds(bounds) {
        if (bounds && this.map) {
            this.map.fitBounds(bounds);
        }
    }

    /**
     * Get map bounds
     */
    getBounds() {
        return this.map ? this.map.getBounds() : null;
    }

    /**
     * Update map center
     */
    setCenter(lat, lng, zoom = 11) {
        if (this.map) {
            this.map.setView([lat, lng], zoom);
        }
    }
}

// Create global map manager instance
window.mapManager = new MapManager();

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map in geography section
    const geographySection = document.getElementById('geography');
    if (geographySection) {
        // Use Intersection Observer to initialize map when section becomes visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !window.mapManager.map) {
                    window.mapManager.initMap();
                    window.mapManager.addLayerControl();
                }
            });
        });
        observer.observe(geographySection);
    }
});


