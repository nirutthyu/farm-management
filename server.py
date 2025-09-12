from flask import Flask, request, jsonify
import joblib
import json
import os
import re
import numpy as np
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from sklearn.preprocessing import LabelEncoder
import pickle
import requests
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)
load_dotenv()  
API_KEY = "158dbd3bb6a543d89d7115734251209"
BASE_URL = "http://api.weatherapi.com/v1/forecast.json"
client = MongoClient("mongodb://localhost:27017/")
db = client.farmUsers
users_collection = db.users

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Load the fertilizer guide
with open('fertilizer_data.json', 'r') as f:
    fertilizer_guide = json.load(f)

# Define soil, crop, and fertilizer classes
soil_classes = ["Sandy", "Loamy", "Clayey", "Black", "Red"]
crop_classes = ["Wheat", "Rice", "Maize", "Cotton", "Sugarcane"]
fertilizer_classes = ["Urea", "DAP", "NPK 10-10-10", "NPK 20-20-20", "MOP", "DAP", "17-17-17"]

# Initialize LabelEncoders
soil_encoder = LabelEncoder()
soil_encoder.classes_ = np.array(soil_classes)
crop_encoder = LabelEncoder()
crop_encoder.classes_ = np.array(crop_classes)

# Load trained KNN model
MODEL_PATH = "ferti_new.joblib"
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file '{MODEL_PATH}' not found")
knn_model = joblib.load(MODEL_PATH)

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    password = data.get("password")
    land_size = data.get("landSize")
    soil_type = data.get("soilType")
    location = data.get("location")

    if users_collection.find_one({"name": name}):
        return jsonify({"message": "Username already exists"}), 400

    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        "name": name,
        "password": hashed_password,
        "landSize": land_size,
        "soilType": soil_type,
        "location": location
    })
    return jsonify({"message": "Registration successful!"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    name = data.get("name")
    password = data.get("password")

    user = users_collection.find_one({"name": name})
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"message": "Incorrect password"}), 401
    
    # You can return more user details if needed
    return jsonify({"message": "Login successful", "user": {
        "name": user["name"],
        "landSize": user["landSize"],
        "soilType": user["soilType"],
        "location": user["location"]
    }}), 200

def get_gemini_response(input_prompt, model_type="gemini-1.5-flash"):
    model = genai.GenerativeModel(model_type)
    generation_config = {"temperature": 0.0, "top_p": 1}
    response = model.generate_content(input_prompt, generation_config=generation_config)
    if not response.candidates:
        raise ValueError("Gemini API returned no candidates.")
    try:
        candidate_content = response.candidates[0].content.parts[0].text.strip()
        json_match = re.search(r'```json\n([\s\S]+?)\n```', candidate_content)
        if json_match:
            json_string = json_match.group(1).strip()
        else:
            json_string = candidate_content
        return json.loads(json_string)
    except Exception as e:
        raise ValueError(f"Error parsing Gemini response: {e}")

def get_gemini_chat_response(input_prompt, model_type="gemini-1.5-flash"):
    model = genai.GenerativeModel(model_type)
    generation_config = {"temperature": 0.7, "top_p": 0.9}
    response = model.generate_content(input_prompt, generation_config=generation_config)
    if not response.candidates:
        raise ValueError("Gemini API returned no candidates.")
    try:
        return response.candidates[0].content.parts[0].text.strip()
    except Exception as e:
        raise ValueError(f"Error parsing Gemini chat response: {e}")

@app.route("/api/fertilizer-predict", methods=["POST"])
def predict_fertilizer():
    try:
        data = request.get_json()

        required_fields = ["temperature", "humidity", "moisture", "soil", "crop", "nitrogen", "phosphorous", "potassium"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Convert numeric fields
        try:
            temperature = float(data["temperature"])
            humidity = float(data["humidity"])
            moisture = float(data["moisture"])
            nitrogen = float(data["nitrogen"])
            phosphorous = float(data["phosphorous"])
            potassium = float(data["potassium"])
        except ValueError:
            return jsonify({"error": "Numeric fields must be valid numbers"}), 400

        # Handle unseen soil and crop
        soil = data["soil"].capitalize() if data["soil"].capitalize() in soil_classes else soil_classes[0]
        crop = data["crop"].capitalize() if data["crop"].capitalize() in crop_classes else crop_classes[0]

        soil_encoded = int(soil_encoder.transform([soil])[0])
        crop_encoded = int(crop_encoder.transform([crop])[0])

        # Prepare features
        features = np.array([temperature, humidity, moisture, soil_encoded, crop_encoded, nitrogen, phosphorous, potassium]).reshape(1, -1)

        # Predict fertilizer
        y_pred = knn_model.predict(features)
        if y_pred.ndim > 1:  # probability vector
            pred_index = int(np.argmax(y_pred, axis=1)[0])
        else:
            pred_index = int(y_pred[0])
        predicted_fertilizer = fertilizer_classes[pred_index]

        return jsonify({"fertilizer": predicted_fertilizer})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recommend-fertilizer', methods=['POST'])
def recommend_fertilizer():
    data = request.get_json()
    required_fields = ['temperature', 'humidity', 'moisture', 'soil', 'crop', 'nitrogen', 'phosphorous', 'potassium']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400
    try:
        input_prompt = f"""
        Act as an experienced agricultural scientist specializing in soil fertility and crop nutrition.
        Analyze the following farm conditions and recommend the most suitable fertilizer with detailed reasoning:

        - Temperature: {data['temperature']}°C
        - Humidity: {data['humidity']}%
        - Soil Moisture: {data['moisture']}%
        - Soil Type: {data['soil']}
        - Crop Type: {data['crop']}
        - Current Nutrient Levels:
          * Nitrogen (N): {data['nitrogen']} ppm
          * Phosphorous (P): {data['phosphorous']} ppm
          * Potassium (K): {data['potassium']} ppm

        Provide a structured JSON response with:
        - RecommendedFertilizer
        - Alternatives
        - ScientificReasoning
        - ApplicationInstructions
        - OrganicAlternatives
        """
        recommendation = get_gemini_response(input_prompt)
        return jsonify(recommendation)
    except Exception as e:
        return jsonify({"error": f"Error processing request: {e}"}), 500

@app.route("/forecast")
def get_forecast():
    params = {"key": API_KEY, "q": "Madurai", "days": 7, "aqi": "no", "alerts": "yes"}
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    forecast_data = [{"date": day["date"], "chance_of_rain": day["day"]["daily_chance_of_rain"]} for day in data["forecast"]["forecastday"]]
    return jsonify(forecast_data)
@app.route("/api/users/<username>/products", methods=["POST"])
def add_product(username):
    """
    Adds a product to the user's products array in MongoDB.
    If products array does not exist, creates it.
    """
    data = request.get_json()
    product_name = data.get("name")
    price = data.get("price")

    if not product_name or price is None:
        return jsonify({"error": "Product name and price are required"}), 400

    # Convert price to float
    try:
        price = float(price)
    except ValueError:
        return jsonify({"error": "Price must be a number"}), 400

    # Find user
    user = users_collection.find_one({"name": username})

    if not user:
        # Optional: create user if doesn't exist
        users_collection.insert_one({
            "name": username,
            "products": [{"name": product_name, "price": price}]
        })
        return jsonify({"message": "User created and product added"}), 201

    # If user exists, update the products array
    if "products" in user:
        users_collection.update_one(
            {"name": username},
            {"$push": {"products": {"name": product_name, "price": price}}}
        )
    else:
        users_collection.update_one(
            {"name": username},
            {"$set": {"products": [{"name": product_name, "price": price}]}}
        )

    return jsonify({"message": "Product added successfully"}), 200
@app.route("/api/users/<username>/products", methods=["GET"])
def get_products(username):
    """
    Fetch all products for a user.
    """
    user = users_collection.find_one({"name": username})

    if not user or "products" not in user:
        return jsonify([])  # No products

    return jsonify(user["products"])


# Add your other chat endpoints here (unchanged)...
@app.route('/api/chat/quick-tips', methods=['GET'])
def get_quick_tips():
    language = request.args.get('language', 'english').lower()
    default_tips_en = [
        "Check soil moisture regularly",
        "Monitor weather forecasts for planning",
        "Inspect crops for pest damage daily",
        "Maintain proper spacing between plants",
        "Keep farming tools clean and maintained"
    ]
    default_tips_ta = [
        "மண்ணின் ஈரப்பதத்தை தொடர்ந்து சரிபார்க்கவும்",
        "திட்டமிடலுக்காக வானிலை முன்னறிவிப்பைக் கண்காணிக்கவும்",
        "தினமும் பயிர்களில் பூச்சி சேதம் இருக்கிறதா என்று பார்க்கவும்",
        "செடிகளுக்கு இடையில் சரியான இடைவெளி வைக்கவும்",
        "விவசாய கருவிகளை சுத்தமாக வைத்துக் கொள்ளுங்கள்"
    ]
    tips = default_tips_en if language == 'english' else default_tips_ta
    return jsonify({"tips": tips, "language": language})



if __name__ == "__main__":
    app.run(debug=True, port=5000)
