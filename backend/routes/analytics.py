from flask import Blueprint, jsonify, request
from sqlalchemy import func, extract, and_, or_
from datetime import datetime, timedelta
from models.trip import Trip
from models.zone import Zone
from app import db
import json

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard-stats')
def dashboard_stats():
    """Get high-level statistics for the dashboard"""
    try:
        # Total trips
        total_trips = Trip.query.count()
        
        # Total revenue
        total_revenue = db.session.query(func.sum(Trip.total_amount)).scalar() or 0
        
        # Average trip duration
        avg_duration = db.session.query(func.avg(Trip.trip_duration)).scalar() or 0
        
        # Average fare
        avg_fare = db.session.query(func.avg(Trip.fare_amount)).scalar() or 0
        
        # Most popular pickup zones
        popular_pickups = db.session.query(
            Zone.borough,
            Zone.zone,
            func.count(Trip.id).label('trip_count')
        ).join(Trip, Zone.location_id == Trip.pickup_location_id)\
         .group_by(Zone.borough, Zone.zone)\
         .order_by(func.count(Trip.id).desc())\
         .limit(5).all()
        
        return jsonify({
            'total_trips': total_trips,
            'total_revenue': float(total_revenue),
            'average_duration_minutes': float(avg_duration) / 60 if avg_duration else 0,
            'average_fare': float(avg_fare),
            'popular_pickup_zones': [
                {
                    'borough': pickup.borough,
                    'zone': pickup.zone,
                    'trip_count': pickup.trip_count
                }
                for pickup in popular_pickups
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/hourly-patterns')
def hourly_patterns():
    """Get trip patterns by hour of day"""
    try:
        hourly_data = db.session.query(
            extract('hour', Trip.pickup_datetime).label('hour'),
            func.count(Trip.id).label('trip_count'),
            func.avg(Trip.fare_amount).label('avg_fare'),
            func.avg(Trip.trip_duration).label('avg_duration')
        ).group_by(extract('hour', Trip.pickup_datetime))\
         .order_by('hour').all()
        
        return jsonify([
            {
                'hour': int(hour_data.hour),
                'trip_count': hour_data.trip_count,
                'average_fare': float(hour_data.avg_fare) if hour_data.avg_fare else 0,
                'average_duration_minutes': float(hour_data.avg_duration) / 60 if hour_data.avg_duration else 0
            }
            for hour_data in hourly_data
        ])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/daily-patterns')
def daily_patterns():
    """Get trip patterns by day of week"""
    try:
        daily_data = db.session.query(
            extract('dow', Trip.pickup_datetime).label('day_of_week'),
            func.count(Trip.id).label('trip_count'),
            func.avg(Trip.fare_amount).label('avg_fare'),
            func.avg(Trip.total_amount).label('avg_total')
        ).group_by(extract('dow', Trip.pickup_datetime))\
         .order_by('day_of_week').all()
        
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        return jsonify([
            {
                'day_of_week': int(day_data.day_of_week),
                'day_name': day_names[int(day_data.day_of_week)],
                'trip_count': day_data.trip_count,
                'average_fare': float(day_data.avg_fare) if day_data.avg_fare else 0,
                'average_total': float(day_data.avg_total) if day_data.avg_total else 0
            }
            for day_data in daily_data
        ])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/distance-analysis')
def distance_analysis():
    """Analyze trip distance patterns"""
    try:
        distance_ranges = [
            (0, 1, '0-1 miles'),
            (1, 3, '1-3 miles'),
            (3, 5, '3-5 miles'),
            (5, 10, '5-10 miles'),
            (10, 20, '10-20 miles'),
            (20, float('inf'), '20+ miles')
        ]
        
        results = []
        for min_dist, max_dist, label in distance_ranges:
            if max_dist == float('inf'):
                query = Trip.query.filter(Trip.trip_distance >= min_dist)
            else:
                query = Trip.query.filter(and_(
                    Trip.trip_distance >= min_dist,
                    Trip.trip_distance < max_dist
                ))
            
            count = query.count()
            avg_fare = db.session.query(func.avg(Trip.fare_amount))\
                               .filter(query.whereclause).scalar() or 0
            avg_duration = db.session.query(func.avg(Trip.trip_duration))\
                                   .filter(query.whereclause).scalar() or 0
            
            results.append({
                'distance_range': label,
                'trip_count': count,
                'average_fare': float(avg_fare),
                'average_duration_minutes': float(avg_duration) / 60 if avg_duration else 0
            })
        
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/payment-analysis')
def payment_analysis():
    """Analyze payment method patterns"""
    try:
        payment_data = db.session.query(
            Trip.payment_type,
            func.count(Trip.id).label('count'),
            func.avg(Trip.tip_amount).label('avg_tip'),
            func.avg(Trip.total_amount).label('avg_total')
        ).group_by(Trip.payment_type).all()
        
        payment_types = {
            1: 'Credit Card',
            2: 'Cash',
            3: 'No Charge',
            4: 'Dispute',
            5: 'Unknown',
            6: 'Voided Trip'
        }
        
        return jsonify([
            {
                'payment_type': int(data.payment_type),
                'payment_name': payment_types.get(int(data.payment_type), 'Unknown'),
                'trip_count': data.count,
                'average_tip': float(data.avg_tip) if data.avg_tip else 0,
                'average_total': float(data.avg_total) if data.avg_total else 0
            }
            for data in payment_data
        ])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/speed-analysis')
def speed_analysis():
    """Analyze trip speed patterns"""
    try:
        # Filter out unrealistic speeds (0-100 mph range)
        speed_data = db.session.query(
            func.count(Trip.id).label('total_trips'),
            func.avg(Trip.trip_speed_mph).label('avg_speed'),
            func.min(Trip.trip_speed_mph).label('min_speed'),
            func.max(Trip.trip_speed_mph).label('max_speed')
        ).filter(and_(
            Trip.trip_speed_mph > 0,
            Trip.trip_speed_mph < 100
        )).first()
        
        # Speed distribution
        speed_ranges = [
            (0, 10, '0-10 mph'),
            (10, 20, '10-20 mph'),
            (20, 30, '20-30 mph'),
            (30, 40, '30-40 mph'),
            (40, float('inf'), '40+ mph')
        ]
        
        speed_distribution = []
        for min_speed, max_speed, label in speed_ranges:
            if max_speed == float('inf'):
                query = Trip.query.filter(Trip.trip_speed_mph >= min_speed)
            else:
                query = Trip.query.filter(and_(
                    Trip.trip_speed_mph >= min_speed,
                    Trip.trip_speed_mph < max_speed
                ))
            
            count = query.count()
            speed_distribution.append({
                'speed_range': label,
                'trip_count': count
            })
        
        return jsonify({
            'overall_stats': {
                'total_trips': speed_data.total_trips if speed_data else 0,
                'average_speed': float(speed_data.avg_speed) if speed_data and speed_data.avg_speed else 0,
                'min_speed': float(speed_data.min_speed) if speed_data and speed_data.min_speed else 0,
                'max_speed': float(speed_data.max_speed) if speed_data and speed_data.max_speed else 0
            },
            'speed_distribution': speed_distribution
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
