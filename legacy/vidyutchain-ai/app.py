import requests
import openai
import os
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime
from zoneinfo import ZoneInfo

from math import sin, cos, radians
from flask import Flask, request, jsonify
from flask_cors import CORS
import cryptography
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
import base64
import uuid
import json

# Load environment variables
load_dotenv()


SOLCAST_API_KEY = os.getenv("SOLCAST_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI API
openai.api_key = OPENAI_API_KEY

# Initialize Flask app
app = Flask(__name__)
# Enable CORS with more specific configuration
CORS(app, resources={r"/api/*": {
    "origins": "*",  # Allow all origins
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
    "supports_credentials": True,
    "max_age": 3600
}})

# Constants for irradiance calculation
MAX_IRRADIANCE = 1000  # Maximum solar irradiance (W/m²)
CLEAR_SKY_IRRADIANCE = MAX_IRRADIANCE  # Irradiance under clear sky conditions

# Base price per kWh
BASE_PRICE_PER_KWH = 3.0

# Carbon offset certificate registry
certificates = {}

# Carbon offset calculation constants
CARBON_OFFSET_PER_KWH = 0.85  # kg of CO2 offset per kWh of renewable energy

# Certificate private key (in production, this should be stored securely)
ISSUER_PRIVATE_KEY = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)

# Certificate public key
ISSUER_PUBLIC_KEY = ISSUER_PRIVATE_KEY.public_key()

# Serialize the public key for sharing
ISSUER_PUBLIC_KEY_PEM = ISSUER_PUBLIC_KEY.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# Certificate class for carbon offset
class CarbonOffsetCertificate:
    def __init__(self, energy_amount, producer_wallet, timestamp=None, source_type=None, producer_name=None):
        self.certificate_id = str(uuid.uuid4())
        self.energy_amount = energy_amount  # kWh
        self.carbon_offset = energy_amount * CARBON_OFFSET_PER_KWH  # kg CO2
        self.producer_wallet = producer_wallet
        self.producer_name = producer_name or "Anonymous Producer"
        self.current_owner = producer_wallet
        self.timestamp = timestamp or datetime.now(ZoneInfo("UTC")).isoformat()
        self.status = "active"  # active, transferred, revoked
        self.signature = None
        self.transfer_history = []
        self.source_type = source_type or "generic"  # p2p, grid_dump, or virtual_grid
        self.claimable_by = ["industry", "company"] if source_type == "virtual_grid" else ["all"]
        
    def to_dict(self):
        return {
            "certificate_id": self.certificate_id,
            "energy_amount": self.energy_amount,
            "carbon_offset": self.carbon_offset,
            "producer_wallet": self.producer_wallet,
            "producer_name": self.producer_name,
            "current_owner": self.current_owner,
            "timestamp": self.timestamp,
            "status": self.status,
            "signature": self.signature.hex() if self.signature else None,
            "transfer_history": self.transfer_history,
            "source_type": self.source_type,
            "claimable_by": self.claimable_by
        }
    
    def sign(self, private_key):
        """Signs the certificate with the issuer's private key"""
        certificate_data = json.dumps({
            "certificate_id": self.certificate_id,
            "energy_amount": self.energy_amount,
            "carbon_offset": self.carbon_offset,
            "producer_wallet": self.producer_wallet,
            "producer_name": self.producer_name,
            "timestamp": self.timestamp,
            "source_type": self.source_type
        }, sort_keys=True).encode()
        
        self.signature = private_key.sign(
            certificate_data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return self.signature
    
    def verify(self, public_key):
        """Verifies the certificate's signature with the issuer's public key"""
        if not self.signature:
            return False
            
        certificate_data = json.dumps({
            "certificate_id": self.certificate_id,
            "energy_amount": self.energy_amount,
            "carbon_offset": self.carbon_offset,
            "producer_wallet": self.producer_wallet,
            "producer_name": self.producer_name,
            "timestamp": self.timestamp,
            "source_type": self.source_type
        }, sort_keys=True).encode()
        
        try:
            public_key.verify(
                self.signature,
                certificate_data,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except Exception:
            return False
    
    def transfer(self, to_wallet, to_user_role="individual"):
        """Transfers the certificate to a new owner"""
        if self.status != "active":
            raise ValueError("Certificate is not active and cannot be transferred")
        
        # Check if the certificate can be claimed by the recipient's role
        if self.source_type == "virtual_grid" and to_user_role not in self.claimable_by:
            raise ValueError(f"This Virtual Grid Pool certificate can only be claimed by {', '.join(self.claimable_by)}")
            
        self.transfer_history.append({
            "from": self.current_owner,
            "to": to_wallet,
            "timestamp": datetime.now(ZoneInfo("UTC")).isoformat()
        })
        
        self.current_owner = to_wallet
        return True

# Functions for certificate management
def issue_certificate(energy_amount, producer_wallet, source_type=None, producer_name=None):
    """Issues a new carbon offset certificate"""
    certificate = CarbonOffsetCertificate(energy_amount, producer_wallet, source_type=source_type, producer_name=producer_name)
    certificate.sign(ISSUER_PRIVATE_KEY)
    certificates[certificate.certificate_id] = certificate
    return certificate

def verify_certificate(certificate_id):
    """Verifies a certificate by ID"""
    if certificate_id not in certificates:
        return False
        
    certificate = certificates[certificate_id]
    return certificate.verify(ISSUER_PUBLIC_KEY)

def transfer_certificate(certificate_id, from_wallet, to_wallet, to_user_role="individual"):
    """Transfers a certificate to a new owner with role checking"""
    if certificate_id not in certificates:
        return False, "Certificate not found"
        
    certificate = certificates[certificate_id]
    
    if certificate.current_owner != from_wallet:
        return False, "You do not own this certificate"
        
    if certificate.status != "active":
        return False, "Certificate is not active"
    
    try:
        certificate.transfer(to_wallet, to_user_role)
        return True, "Certificate transferred successfully"
    except Exception as e:
        return False, str(e)

# Add new constants for advanced calculations
TIME_OF_DAY_PRICING_FACTORS = {
    # Hour: (description, factor)
    0: ("Night off-peak", 1.8),  # 80% increase
    1: ("Night off-peak", 1.8),
    2: ("Night off-peak", 1.8),
    3: ("Night off-peak", 1.8),
    4: ("Night off-peak", 1.7),
    5: ("Early morning", 1.6),
    6: ("Early morning", 1.5),
    7: ("Morning transition", 1.3),
    8: ("Morning shoulder", 1.2),
    9: ("Peak production approach", 1.1),
    10: ("Peak production", 0.92),
    11: ("Peak production", 0.9),
    12: ("Peak production", 0.88),  # 12% discount
    13: ("Peak production", 0.9),
    14: ("Post-peak", 0.95),
    15: ("Afternoon shoulder", 1.1),
    16: ("Late afternoon", 1.2),
    17: ("Evening transition", 1.3),
    18: ("Evening demand", 1.4),
    19: ("Evening peak", 1.5),
    20: ("Evening", 1.6),
    21: ("Night", 1.7),
    22: ("Night off-peak", 1.8),
    23: ("Night off-peak", 1.8),
}

# Seasonal adjustment factors
SEASONAL_ADJUSTMENTS = {
    # Month: (description, factor)
    1: ("Winter", 1.25),
    2: ("Winter", 1.2),
    3: ("Spring transition", 1.15),
    4: ("Spring", 1.05),
    5: ("Spring", 1.0),
    6: ("Summer", 0.95),
    7: ("Summer", 0.9),
    8: ("Summer", 0.9),
    9: ("Autumn transition", 1.0),
    10: ("Autumn", 1.05),
    11: ("Autumn", 1.15),
    12: ("Winter", 1.25),
}

# Grid demand patterns by hour (simulated)
GRID_DEMAND_PATTERNS = {
    # Hour: (description, demand factor)
    0: ("Low demand", 0.3),
    1: ("Lowest demand", 0.2),
    2: ("Lowest demand", 0.2),
    3: ("Lowest demand", 0.2),
    4: ("Low demand", 0.3),
    5: ("Low demand", 0.4),
    6: ("Rising demand", 0.5),
    7: ("Morning demand", 0.7),
    8: ("Business hours start", 0.8),
    9: ("Business hours", 0.9),
    10: ("Business peak", 1.0),
    11: ("Business peak", 1.0),
    12: ("Lunch hour", 0.9),
    13: ("Business peak", 1.0),
    14: ("Business peak", 1.0),
    15: ("School dismissal", 0.9),
    16: ("Commute hours", 0.8),
    17: ("Residential peak start", 0.9),
    18: ("Residential peak", 1.0),
    19: ("Evening peak", 1.0),
    20: ("Evening", 0.9),
    21: ("Evening reduction", 0.7),
    22: ("Night reduction", 0.5),
    23: ("Night low", 0.4),
}

# Panel efficiency by temperature model
def panel_efficiency_temperature_factor(temp_celsius):
    """
    Calculate solar panel efficiency factor based on temperature.
    Most panels lose ~0.4% efficiency per degree above 25°C.
    Some gain slightly in very cold weather.
    """
    if temp_celsius <= 25:
        # Slight improvement in efficiency at temperatures below 25°C
        return 1 + min(0.05, (25 - temp_celsius) * 0.002)  # Up to 5% improvement
    else:
        # Efficiency loss at higher temperatures
        return max(0.8, 1 - (temp_celsius - 25) * 0.004)  # Up to 20% loss

# Enhanced irradiance calculations
def calculate_advanced_irradiance_factor(irradiance):
    """
    Model the relationship between irradiance and energy production more accurately
    using a sigmoid-like curve rather than linear relationship
    """
    max_expected = 1000  # Maximum theoretical irradiance
    
    # Below 50 W/m², panels barely produce usable energy
    if irradiance < 50:
        return 0.05
    
    # Between 50-200 W/m², efficiency increases rapidly
    elif irradiance < 200:
        # Map 50-200 to 0.05-0.5 (rapidly increasing efficiency)
        return 0.05 + (irradiance - 50) * 0.45 / 150
    
    # Between 200-800 W/m², more linear relationship
    elif irradiance < 800:
        # Map 200-800 to 0.5-0.95 (good production range)
        return 0.5 + (irradiance - 200) * 0.45 / 600
    
    # Above 800 W/m², diminishing returns due to panel limitations
    else:
        # Map 800+ to 0.95-1.0 (diminishing returns)
        return min(1.0, 0.95 + (irradiance - 800) * 0.05 / 200)

# Fetch weather data
def fetch_weather(city):
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
    response = requests.get(url)
    data = response.json()
    
    # Check if the API returned an error
    if 'cod' in data and data['cod'] != 200:
        raise ValueError(f"Weather API error: {data.get('message', 'Unknown error')}")
        
    weather = {
        "temperature": data["main"]["temp"],
        "cloud_coverage": data["clouds"]["all"],  # % cloudiness
        "description": data["weather"][0]["description"],
    }
    return weather

# Function to calculate solar declination angle (δ)
def solar_declination(day_of_year):
    return 23.44 * sin(radians((360 / 365) * (day_of_year - 81)))

# Function to calculate solar hour angle (ω)
def solar_hour_angle(hour, longitude):
    solar_time = hour + (4 * (longitude - 15) + 60) / 60  # Corrected time in hours
    return (solar_time - 12) * 15  # Solar hour angle in degrees

# Function to calculate solar elevation angle (α)
def solar_elevation_angle(latitude, declination, hour_angle):
    return np.degrees(np.arcsin(sin(radians(latitude)) * sin(radians(declination)) +
                               cos(radians(latitude)) * cos(radians(declination)) *
                               cos(radians(hour_angle))))

# Dictionary of common Indian cities and their coordinates (latitude, longitude)
CITY_COORDINATES = {
    "mumbai": (19.0760, 72.8777),
    "delhi": (28.6139, 77.2090),
    "bangalore": (12.9716, 77.5946),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714),
    "jaipur": (26.9124, 75.7873),
    "surat": (21.1702, 72.8311),
    "bhopal": (23.2599, 77.4126),
    "indore": (22.7196, 75.8577),
    "nagpur": (21.1458, 79.0882),
    "lucknow": (26.8467, 80.9462),
    "kanpur": (26.4499, 80.3319),
}

# Function to get city coordinates
def get_city_coordinates(city):
    try:
        # First check our predefined coordinates
        city_lower = city.lower()
        if city_lower in CITY_COORDINATES:
            return CITY_COORDINATES[city_lower]
        
        # If not in our list, try to get from OpenWeatherMap API instead of Nominatim
        weather_url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}"
        response = requests.get(weather_url)
        
        if response.status_code != 200:
            raise ValueError(f"OpenWeatherMap API error: {response.status_code}")
            
        data = response.json()
        if 'coord' in data:
            return data['coord']['lat'], data['coord']['lon']
        else:
            raise ValueError(f"No coordinates found for city: {city}")
    except Exception as e:
        print(f"Warning: Using default coordinates for Bhopal - {str(e)}")
        # Default to Bhopal coordinates if there's an error
        return 23.2599, 77.4126

# Complex solar irradiance model
def fetch_irradiance(city, weather):
    """
    Estimates solar irradiance based on complex factors like solar declination, solar hour angle,
    and solar elevation angle, along with weather data.
    """
    try:
        # Get coordinates for the city
        latitude, longitude = get_city_coordinates(city)
        
        # Weather-based factors
        cloud_coverage = weather['cloud_coverage']  # Cloud coverage in percentage (0 to 100)
        temperature = weather['temperature']  # Current temperature in °C

        # Get current time in India timezone
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        hour = now.hour
        day_of_year = now.timetuple().tm_yday

        # Calculate solar declination for the current day
        declination = solar_declination(day_of_year)

        # Calculate solar hour angle for the current hour
        hour_angle = solar_hour_angle(hour, longitude)

        # Calculate solar elevation angle
        elevation_angle = solar_elevation_angle(latitude, declination, hour_angle)

        # Dynamic irradiance calculation based on elevation angle
        if elevation_angle > 0:
            irradiance = CLEAR_SKY_IRRADIANCE * (elevation_angle / 90)  # Proportional to the solar elevation angle
        else:
            # As the sun sets, the irradiance decays smoothly to 0
            irradiance = MAX_IRRADIANCE * np.exp(-abs(elevation_angle / 10))  # Exponentially decaying irradiance

        # Adjust irradiance based on cloud coverage (reduction in irradiance)
        cloud_factor = (100 - cloud_coverage) / 100  # 0-1 scale based on cloud coverage
        irradiance *= cloud_factor

        # Temperature effect: As temperature increases, solar panel efficiency decreases (simulated here)
        if temperature > 35:
            temperature_factor = 0.9  # 10% loss in efficiency due to high temperature
            irradiance *= temperature_factor

        # Create a DataFrame to return
        period_end = now.replace(minute=0, second=0, microsecond=0)
        ghi_data = {
            "period_end": [period_end],
            "ghi": [irradiance]
        }
        df = pd.DataFrame(ghi_data)
        
        return df[['period_end', 'ghi']], hour
    except Exception as e:
        print(f"Error in irradiance calculation: {str(e)}")
        # Return a default value if there's an error
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        hour = now.hour
        df = pd.DataFrame({"period_end": [now], "ghi": [500]})
        return df[['period_end', 'ghi']], hour

# Extract price from OpenAI response
def extract_price_from_response(response_text):
    try:
        # First look for the exact format we requested in our prompt
        import re
        final_price_match = re.search(r'final price for \d+(\.\d+)? kWh is ₹(\d+(\.\d+)?)', response_text.lower())
        if final_price_match:
            return float(final_price_match.group(2))
            
        # Look for ₹ symbol followed by a number
        price_match = re.search(r'₹\s*(\d+(\.\d+)?)', response_text)
        if price_match:
            # Extract all price mentions
            all_prices = re.findall(r'₹\s*(\d+(\.\d+)?)', response_text)
            if all_prices:
                # Take the last mentioned price as it's likely the conclusion
                return float(all_prices[-1][0])
        
        # If no ₹ symbol found, look for price or cost mentions
        price_match = re.search(r'price[:\s]*(\d+(\.\d+)?)|cost[:\s]*(\d+(\.\d+)?)', response_text.lower())
        if price_match:
            # Return the first group that matched
            for group in price_match.groups():
                if group and group.replace('.', '').isdigit():
                    return float(group)
        
        return None
    except Exception as e:
        print(f"Error extracting price: {str(e)}")
        return None

# Simple price prediction as fallback
def simple_price_prediction(weather, irradiance, energy_kwh):
    """Calculate price without using AI if API calls fail"""
    # Get current local time and date
    now = datetime.now(ZoneInfo("Asia/Kolkata"))
    current_hour = now.hour
    current_month = now.month
    current_minute = now.minute
    
    # ========= FACTOR 1: IRRADIANCE IMPACT =========
    # Use enhanced sigmoid-like model for irradiance
    irradiance_production_factor = calculate_advanced_irradiance_factor(irradiance)
    
    # Invert the production factor for pricing (lower production = higher price)
    irradiance_price_factor = 2 - irradiance_production_factor  # Range ~ 1.0 to 1.95
    
    # ========= FACTOR 2: TEMPERATURE IMPACT =========
    temperature = weather['temperature']
    temp_efficiency_factor = panel_efficiency_temperature_factor(temperature)
    
    # Invert the efficiency factor for pricing (lower efficiency = higher price)
    temperature_price_factor = 2 - temp_efficiency_factor  # Range ~ 1.0 to 1.2
    
    # ========= FACTOR 3: CLOUD IMPACT =========
    cloud_coverage = weather['cloud_coverage']
    # Non-linear response to clouds - first 20% has less impact than 80-100%
    if cloud_coverage <= 20:
        cloud_price_factor = 1 + (cloud_coverage / 100) * 0.2
    else:
        cloud_price_factor = 1.04 + ((cloud_coverage - 20) / 80) * 0.36
    
    # ========= FACTOR 4: TIME OF DAY IMPACT =========
    time_factor = TIME_OF_DAY_PRICING_FACTORS[current_hour][1]
    
    # Add minute-level interpolation between hours for smoother transitions
    if current_minute > 0 and current_hour < 23:
        next_hour = current_hour + 1
        next_hour_factor = TIME_OF_DAY_PRICING_FACTORS[next_hour][1]
        minute_progress = current_minute / 60.0
        time_factor = time_factor * (1 - minute_progress) + next_hour_factor * minute_progress
    
    # ========= FACTOR 5: SEASONAL IMPACT =========
    season_factor = SEASONAL_ADJUSTMENTS[current_month][1]
    
    # ========= FACTOR 6: GRID DEMAND IMPACT =========
    # When grid demand is high, solar is more valuable
    grid_demand = GRID_DEMAND_PATTERNS[current_hour][1]
    grid_price_factor = 1 + (grid_demand - 0.5) * 0.2  # Range: 0.9 to 1.1
    
    # ========= WEIGHTED FACTOR CALCULATION =========
    # Apply weights to each factor based on importance
    weighted_factors = {
        "irradiance": {"weight": 0.35, "factor": irradiance_price_factor},
        "temperature": {"weight": 0.15, "factor": temperature_price_factor},
        "cloud": {"weight": 0.10, "factor": cloud_price_factor},
        "time": {"weight": 0.20, "factor": time_factor},
        "season": {"weight": 0.10, "factor": season_factor},
        "grid": {"weight": 0.10, "factor": grid_price_factor}
    }
    
    # Calculate composite price factor
    composite_factor = sum(item["weight"] * item["factor"] for item in weighted_factors.values())
    
    # Calculate adjusted price
    adjusted_price_per_kwh = BASE_PRICE_PER_KWH * composite_factor
    
    # Calculate total price
    total_price = adjusted_price_per_kwh * energy_kwh
    
    # Generate detailed breakdown
    factor_breakdown = {factor: {"name": factor, "factor": details["factor"], 
                                "impact": details["weight"] * (details["factor"] - 1) * 100, 
                                "weight": details["weight"]} 
                       for factor, details in weighted_factors.items()}
    
    # Sort the factors by impact (absolute value)
    sorted_factors = sorted(factor_breakdown.values(), key=lambda x: abs(x["impact"]), reverse=True)
    
    return total_price, adjusted_price_per_kwh, factor_breakdown, sorted_factors

# Advanced price prediction explanation
def generate_price_explanation(factor_breakdown, sorted_factors, base_price):
    """Generate a human-readable explanation of price factors"""
    explanation = []
    
    # Add the most influential factors (top 3)
    explanation.append("Price factors (most influential first):")
    
    for idx, factor in enumerate(sorted_factors[:3]):
        name = factor["name"].capitalize()
        impact = factor["impact"]
        if impact > 0:
            explanation.append(f"- {name}: Increases price by {abs(impact):.1f}%")
        else:
            explanation.append(f"- {name}: Decreases price by {abs(impact):.1f}%")
    
    return "\n".join(explanation)

# Function to call OpenAI API for solar energy price prediction
def predict_price_using_openai(weather, irradiance_df, energy_kwh, current_hour):
    try:
        # Get the irradiance data
        ghi = irradiance_df['ghi'].iloc[0]
        
        # First calculate locally - we will use this as a reference and fallback
        local_price, local_price_per_kwh, factor_breakdown, sorted_factors = simple_price_prediction(weather, ghi, energy_kwh)
        
        # Generate local explanation for the pricing
        local_explanation = generate_price_explanation(factor_breakdown, sorted_factors, BASE_PRICE_PER_KWH * energy_kwh)
        
        # Construct the prompt for GPT
        prompt = f"""
        Predict the solar energy price (in ₹) for {energy_kwh} kWh with these conditions:
        - Temperature: {weather['temperature']}°C
        - Cloud coverage: {weather['cloud_coverage']}%
        - Time: {current_hour}:00 hours
        - Irradiance: {ghi:.2f} W/m²
        
        Base price: ₹{BASE_PRICE_PER_KWH}/kWh (total ₹{BASE_PRICE_PER_KWH * energy_kwh})
        
        Environmental factors impact:
        - LOW irradiance (< 200 W/m²): INCREASE price by 30-60%
        - HIGH temperature (> 35°C): INCREASE price by 10-20%
        - Cloud coverage: Each 10% increases price by 5%
        - Peak hours (10:00-14:00): DECREASE price by 5-10%
        - Non-peak hours: INCREASE price by 15-25%
        
        A realistic price in this scenario would be around ₹{local_price:.2f}, calculated based on advanced solar models.
        
        Do the calculation step by step, showing how each factor affects the price.
        Conclude with ONLY: "The final price for {energy_kwh} kWh is ₹X.XX" where X.XX is the calculated amount.
        """
        
        # Send prompt to OpenAI
        response = openai.chat.completions.create(
            model="gpt-4o",  # Using the chat completions API
            messages=[
                {"role": "system", "content": "You are a specialized solar energy pricing assistant that gives exact calculations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=250,
            temperature=0.3  # Lower temperature for more consistent responses
        )
        
        # Extract and return the response
        prediction = response.choices[0].message.content.strip()
        
        # Try to extract the actual price value from the response
        extracted_price = extract_price_from_response(prediction)
        
        # If no price was extracted or it's significantly different from our local calculation
        # (more than 30% difference), use the local calculation
        if not extracted_price or abs(extracted_price - local_price) / local_price > 0.3:
            # If extracted_price is valid but very different, show a warning
            if extracted_price:
                print(f"⚠️ AI price (₹{extracted_price:.2f}) differs significantly from calculated price (₹{local_price:.2f})")
            
            # Use the local calculation but keep the AI explanation if available
            return prediction + f"\n\n{local_explanation}", local_price
        
        return prediction, extracted_price
        
    except Exception as e:
        print(f"Error in price prediction: {str(e)}")
        # Calculate locally and return
        local_price, local_price_per_kwh, factor_breakdown, sorted_factors = simple_price_prediction(weather, ghi, energy_kwh)
        local_explanation = generate_price_explanation(factor_breakdown, sorted_factors, BASE_PRICE_PER_KWH * energy_kwh)
        return f"Estimated price (locally calculated): ₹{local_price:.2f}\n\n{local_explanation}", local_price

# Certificate API endpoints
@app.route('/api/certificates/issue', methods=['POST'])
def api_issue_certificate():
    try:
        data = request.get_json()
        
        # Validate required parameters
        if not data or 'energy_amount' not in data or 'producer_wallet' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required parameters: energy_amount and producer_wallet are required'
            }), 400
        
        energy_amount = float(data['energy_amount'])
        producer_wallet = data['producer_wallet']
        source_type = data.get('source_type', 'generic')
        producer_name = data.get('producer_name', 'Anonymous Producer')
        
        # Issue the certificate
        certificate = issue_certificate(energy_amount, producer_wallet, source_type, producer_name)
        
        return jsonify({
            'success': True,
            'certificate': certificate.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/certificates/<certificate_id>', methods=['GET'])
def api_get_certificate(certificate_id):
    try:
        if certificate_id not in certificates:
            return jsonify({
                'success': False,
                'error': 'Certificate not found'
            }), 404
            
        certificate = certificates[certificate_id]
        is_valid = verify_certificate(certificate_id)
        
        return jsonify({
            'success': True,
            'certificate': certificate.to_dict(),
            'is_valid': is_valid
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/certificates/transfer', methods=['POST'])
def api_transfer_certificate():
    try:
        data = request.get_json()
        
        # Validate required parameters
        if not data or 'certificate_id' not in data or 'from_wallet' not in data or 'to_wallet' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required parameters: certificate_id, from_wallet, and to_wallet are required'
            }), 400
            
        certificate_id = data['certificate_id']
        from_wallet = data['from_wallet']
        to_wallet = data['to_wallet']
        to_user_role = data.get('to_user_role', 'individual')
        
        # Transfer the certificate
        success, message = transfer_certificate(certificate_id, from_wallet, to_wallet, to_user_role)
        
        if not success:
            return jsonify({
                'success': False,
                'error': message
            }), 400
            
        return jsonify({
            'success': True,
            'message': message,
            'certificate': certificates[certificate_id].to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/certificates/by-owner/<wallet_address>', methods=['GET'])
def api_get_certificates_by_owner(wallet_address):
    try:
        owner_certificates = []
        
        for cert_id, cert in certificates.items():
            if cert.current_owner == wallet_address:
                owner_certificates.append(cert.to_dict())
                
        return jsonify({
            'success': True,
            'certificates': owner_certificates
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/certificates/issuer-public-key', methods=['GET'])
def api_get_issuer_public_key():
    try:
        return jsonify({
            'success': True,
            'public_key': ISSUER_PUBLIC_KEY_PEM.decode('utf-8')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Endpoint to calculate carbon offset for a given energy amount
@app.route('/api/calculate-carbon-offset', methods=['POST'])
def api_calculate_carbon_offset():
    try:
        data = request.get_json()
        
        if not data or 'energy_amount' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required parameter: energy_amount'
            }), 400
            
        energy_amount = float(data['energy_amount'])
        carbon_offset = energy_amount * CARBON_OFFSET_PER_KWH
        
        return jsonify({
            'success': True,
            'energy_amount': energy_amount,
            'carbon_offset': carbon_offset,
            'unit': 'kg CO2'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Virtual Grid Pool API endpoints
@app.route('/api/virtual-grid-pool/list-energy', methods=['POST'])
def api_list_energy_in_virtual_grid():
    try:
        data = request.get_json()
        
        # Validate required parameters
        if not data or 'energy_amount' not in data or 'producer_wallet' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required parameters: energy_amount and producer_wallet are required'
            }), 400
            
        energy_amount = float(data['energy_amount'])
        producer_wallet = data['producer_wallet']
        producer_name = data.get('producer_name', 'Anonymous Producer')
        pricing = data.get('pricing', {})
        
        # Verify transaction signature if provided
        transaction_signature = data.get('transaction_signature')
        if transaction_signature:
            # In a production system, you would verify this signature against the blockchain
            # For this demo, we'll just log it
            print(f"Received transaction signature: {transaction_signature}")
        
        # Issue a certificate for the listed energy
        certificate = issue_certificate(
            energy_amount=energy_amount,
            producer_wallet=producer_wallet,
            source_type="virtual_grid",
            producer_name=producer_name
        )
        
        # Store the listing in a virtual grid pool (would actually be stored in a database)
        # This is just a placeholder for demonstration
        listing_id = str(uuid.uuid4())
        listing = {
            'listing_id': listing_id,
            'energy_amount': energy_amount,
            'producer_wallet': producer_wallet,
            'producer_name': producer_name,
            'certificate_id': certificate.certificate_id,
            'timestamp': datetime.now(ZoneInfo("UTC")).isoformat(),
            'status': 'active',
            'pricing': pricing,
            'transaction_signature': transaction_signature
        }
        
        return jsonify({
            'success': True,
            'message': 'Energy successfully listed in Virtual Grid Pool with certificate',
            'listing': listing,
            'certificate': certificate.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/virtual-grid-pool/claim-certificate', methods=['POST'])
def api_claim_virtual_grid_certificate():
    try:
        data = request.get_json()
        
        # Validate required parameters
        if not data or 'certificate_id' not in data or 'claimer_wallet' not in data or 'user_role' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required parameters: certificate_id, claimer_wallet, and user_role are required'
            }), 400
            
        certificate_id = data['certificate_id']
        claimer_wallet = data['claimer_wallet']
        user_role = data['user_role']
        
        # Log transaction signature if provided
        transaction_signature = data.get('transaction_signature')
        if transaction_signature:
            print(f"Received transaction signature: {transaction_signature}")
        
        # Check if the user has the right role
        if user_role not in ['industry', 'company']:
            return jsonify({
                'success': False,
                'error': 'Only users with industry or company roles can claim Virtual Grid Pool certificates'
            }), 403
            
        # Check if the certificate exists
        if certificate_id not in certificates:
            return jsonify({
                'success': False,
                'error': 'Certificate not found'
            }), 404
            
        certificate = certificates[certificate_id]
        
        # Check if the certificate is from the Virtual Grid Pool
        if certificate.source_type != 'virtual_grid':
            return jsonify({
                'success': False,
                'error': 'This certificate is not from the Virtual Grid Pool'
            }), 400
            
        # Transfer the certificate to the claimer
        success, message = transfer_certificate(
            certificate_id=certificate_id,
            from_wallet=certificate.producer_wallet,
            to_wallet=claimer_wallet,
            to_user_role=user_role
        )
        
        if not success:
            return jsonify({
                'success': False,
                'error': message
            }), 400
            
        return jsonify({
            'success': True,
            'message': 'Certificate successfully claimed from Virtual Grid Pool',
            'certificate': certificate.to_dict()
        })
    except Exception as e:
        print(f"Error claiming certificate: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/virtual-grid-pool/available-certificates', methods=['GET'])
def api_get_available_certificates():
    try:
        # Find all certificates that:
        # 1. Are from the Virtual Grid Pool (source_type == "virtual_grid")
        # 2. Are still with their original producer (current_owner == producer_wallet)
        # 3. Have 'active' status
        available_certificates = []
        
        print(f"Total certificates in registry: {len(certificates)}")
        for cert_id, cert in certificates.items():
            print(f"Certificate {cert_id}: source_type={cert.source_type}, current_owner={cert.current_owner}, producer_wallet={cert.producer_wallet}, status={cert.status}")
            if (cert.source_type == "virtual_grid" and 
                cert.current_owner == cert.producer_wallet and
                cert.status == "active"):
                print(f"Adding certificate {cert_id} to available certificates")
                available_certificates.append(cert.to_dict())
        
        print(f"Found {len(available_certificates)} available certificates")        
        return jsonify({
            'success': True,
            'certificates': available_certificates
        })
    except Exception as e:
        print(f"Error in available-certificates: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/predict-price', methods=['POST'])
def predict_price():
    try:
        data = request.get_json()
        
        # Validate required parameters
        if not data or 'energy_kwh' not in data or 'city' not in data:
            return jsonify({
                'success': True,
                'error': 'Missing required parameters: energy_kwh and city are required'
            }), 400
            
        energy_kwh = float(data['energy_kwh'])
        city = data['city'].strip()
        
        # Fetch weather data
        weather = fetch_weather(city)

        # Fetch irradiance data and current hour
        irradiance_df, current_hour = fetch_irradiance(city, weather)
        ghi_value = float(irradiance_df.iloc[0]['ghi'])  # Convert to Python float

        try:
            # Try using OpenAI for price prediction
            _, ai_price = predict_price_using_openai(weather, irradiance_df, energy_kwh, current_hour)
            
            # Return simplified response with just the price
            return jsonify({
                'success': True,
                'price': float(ai_price)  # Convert to Python float
            })
                
        except Exception as ai_error:
            # Fallback to simple prediction if AI fails
            print(f"⚠️ AI prediction failed: {str(ai_error)}")
            local_price, _, _, _ = simple_price_prediction(weather, ghi_value, energy_kwh)
            
            # Return simplified response with just the price
            return jsonify({
                'success': True,
                'price': float(local_price)  # Convert to Python float
            })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
