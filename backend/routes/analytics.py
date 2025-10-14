from flask import Blueprint, jsonify, request
from app import Trip, Zone, db
from sqlalchemy import func, extract
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/trips/stats', methods=['GET'])
def get_trip_stats():
    """Get aggregated trip statistics"""
    try:
        # Get query parameters for filtering
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        passenger_count = request.args.get('passengerCount')
        
        # Build base query
        query = Trip.query
        
        # Apply filters
        if start_date:
            query = query.filter(Trip.pickup_datetime >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Trip.pickup_datetime <= datetime.fromisoformat(end_date))
        if passenger_count:
            query = query.filter(Trip.passenger_count == int(passenger_count))
        
        # Calculate statistics
        stats = query.with_entities(
            func.count(Trip.id).label('total_trips'),
            func.avg(Trip.fare_amount).label('avg_fare'),
            func.avg(Trip.trip_duration).label('avg_duration'),
            func.avg(Trip.trip_distance).label('avg_distance'),
            func.sum(Trip.total_amount).label('total_revenue'),
            func.avg(Trip.tip_amount).label('avg_tip'),
            func.min(Trip.fare_amount).label('min_fare'),
            func.max(Trip.fare_amount).label('max_fare'),
            func.min(Trip.trip_distance).label('min_distance'),
            func.max(Trip.trip_distance).label('max_distance')
        ).first()
        
        return jsonify({
            'totalTrips': stats.total_trips or 0,
            'avgFare': round(float(stats.avg_fare or 0), 2),
            'avgDuration': round(float(stats.avg_duration or 0), 2),
            'avgDistance': round(float(stats.avg_distance or 0), 2),
            'totalRevenue': round(float(stats.total_revenue or 0), 2),
            'avgTip': round(float(stats.avg_tip or 0), 2),
            'minFare': float(stats.min_fare or 0),
            'maxFare': float(stats.max_fare or 0),
            'minDistance': float(stats.min_distance or 0),
            'maxDistance': float(stats.max_distance or 0)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/trips/hourly', methods=['GET'])
def get_hourly_patterns():
    """Get hourly trip patterns"""
    try:
        # Get query parameters
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Build base query
        query = Trip.query
        
        # Apply filters
        if start_date:
            query = query.filter(Trip.pickup_datetime >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Trip.pickup_datetime <= datetime.fromisoformat(end_date))
        
        # Group by hour
        hourly_data = query.with_entities(
            extract('hour', Trip.pickup_datetime).label('hour'),
            func.count(Trip.id).label('count'),
            func.avg(Trip.fare_amount).label('avg_fare'),
            func.avg(Trip.trip_duration).label('avg_duration'),
            func.avg(Trip.trip_distance).label('avg_distance')
        ).group_by(extract('hour', Trip.pickup_datetime)).all()
        
        # Create array for all 24 hours
        result = []
        for hour in range(24):
            hour_data = next((h for h in hourly_data if h.hour == hour), None)
            result.append({
                'hour': hour,
                'count': hour_data.count if hour_data else 0,
                'avgFare': round(float(hour_data.avg_fare or 0), 2),
                'avgDuration': round(float(hour_data.avg_duration or 0), 2),
                'avgDistance': round(float(hour_data.avg_distance or 0), 2)
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/trips/payment-types', methods=['GET'])
def get_payment_type_analysis():
    """Get payment type breakdown"""
    try:
        # Get query parameters
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Build base query
        query = Trip.query
        
        # Apply filters
        if start_date:
            query = query.filter(Trip.pickup_datetime >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(Trip.pickup_datetime <= datetime.fromisoformat(end_date))
        
        # Group by payment type
        payment_data = query.with_entities(
            Trip.payment_type,
            func.count(Trip.id).label('count'),
            func.avg(Trip.fare_amount).label('avg_fare'),
            func.avg(Trip.tip_amount).label('avg_tip')
        ).group_by(Trip.payment_type).all()
        
        # Map payment types to names
        payment_type_names = {
            1: 'Credit card',
            2: 'Cash',
            3: 'No charge',
            4: 'Dispute',
            5: 'Unknown',
            6: 'Voided trip'
        }
        
        result = []
        for payment in payment_data:
            result.append({
                'paymentType': payment_type_names.get(payment.payment_type, 'Unknown'),
                'count': payment.count,
                'avgFare': round(float(payment.avg_fare or 0), 2),
                'avgTip': round(float(payment.avg_tip or 0), 2)
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
