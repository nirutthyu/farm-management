from flask import Flask, request, jsonify
import joblib
import json
import os
import re
import tensorflow as tf
import numpy as np
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from sklearn.preprocessing import LabelEncoder
import pickle
import requests
from PIL import Image
from pymongo import MongoClient
from bson.objectid import ObjectId
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)
load_dotenv()  
API_KEY = "158dbd3bb6a543d89d7115734251209"
BASE_URL = "http://api.weatherapi.com/v1/forecast.json"
client = MongoClient("mongodb://localhost:27017/")
db = client.farmUsers
users_collection = db.users
trace_collection = db.traceability 

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
# Class labels
class_names = [
    # "HEALTHY PADDY",
    # "BACTERIAL LEAF BLIGHT OF PADDY",
    # "BACTERIAL LEAF STREAK OF PADDY",
    # "BAKANAE",
    # "BROWN SPOT IN PADDY",
    # "BLAST OF PADDY",
    # "FALSE SMUT",
    # "GRAIN DISCOLOURATION",
    # "RICE TANGRO",
    # "SHEATH BLIGHT OF PADDY",
    # "SHEATH ROT OF PADDY"
    "alterneria",
    "bacterialblight",
    "bollrot",
    "fusarium wilt",
    "grey",
    "rootrot",
    "verticillium wilt",
    "healthy"

]

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
@app.route('/api/chat', methods=['POST'])
def chat_with_bot():
    """
    Farm management chatbot endpoint with multilingual support
    """
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        user_message = data.get('message', '')
        language = data.get('language', 'english').lower()
        
        # Prepare the system prompt based on language
        if language == 'tamil':
            system_prompt = """
            நீங்கள் ஒரு அனுபவமிக்க விவசாய நிபுணர் மற்றும் நண்பரான உதவியாளர். தமிழ் மொழியில் பதிலளிக்கவும்.
            
            நீங்கள் பின்வரும் விஷயங்களில் உதவ முடியும்:
            - பயிர் மேலாண்மை மற்றும் பராமரிப்பு
            - உரம் மற்றும் களைக்கொல்லி பரிந்துரைகள்
            - நோய் மற்றும் பூச்சி கட்டுப்பாடு
            - மண் பராமரிப்பு மற்றும் நீர் மேலாண்மை
            - விதை தேர்வு மற்றும் விதைப்பு நேரம்
            - அறுவடை மற்றும் சந்தைப்படுத்துதல் ஆலோசனைகள்
            - வானிலை மற்றும் காலநிலை தொடர்பான ஆலோசனைகள்
            - உதிரி பாகங்கள் மற்றும் விவசாய கருவிகள்
 
            எளிய, நடைமுறை மற்றும் பயனுள்ள ஆலோசனைகளை வழங்கவும்.  
            பதில்களை எண்களால் வரிசைப்படுத்தவும்.  
            பதில்கள் கேள்விக்கு பொருத்தமான 5 வரிகள் மட்டும் இருக்க வேண்டும்.  
            பதில்களில் * குறி பயன்படுத்த வேண்டாம்.
            பதில்களின் முடிவில் தகவலின் மூலத்தை குறிப்பிடவும்.  

            """
        else:
            system_prompt = """
            You are an experienced agricultural expert and friendly assistant specializing in farm management.
            
            You can help with:
            - Crop management and care
            - Fertilizer and pesticide recommendations  
            - Disease and pest control
            - Soil care and water management
            - Seed selection and planting times
            - Harvesting and marketing advice
            - Weather and climate-related guidance
            - Farm equipment and tools
            
            Provide simple, practical, and helpful advice that farmers can easily understand and implement.
            Keep the response strictly to 5 lines only, relevant to the farmer's question.
            Be conversational and supportive in your responses provide it as numbered pointers dont exceed 200 words and dont include asterisks in the answer.
            Also provide the source from which the information is taken.
            """
        
        # Create the full prompt
        full_prompt = f"{system_prompt}\n\nFarmer's Question: {user_message}\n\nResponse:"
        
        # Get response from Gemini
        bot_response = get_gemini_chat_response(full_prompt)
        
        return jsonify({
            "response": bot_response,
            "language": language,
            "timestamp": str(pd.Timestamp.now()) if 'pd' in globals() else None
        })
        
    except Exception as e:
        error_message = "Sorry, I'm having trouble processing your request right now. Please try again."
        if language == 'tamil':
            error_message = "மன்னிக்கவும், உங்கள் கோரிக்கையை செயல்படுத்துவதில் சிக்கல் உள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
        
        return jsonify({
            "response": error_message,
            "error": str(e),
            "language": data.get('language', 'english') if 'data' in locals() else 'english'
        }), 500

@app.route('/api/chat/translate', methods=['POST'])
def translate_message():
    """
    Translate messages between Tamil and English using chat session
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Text is required"}), 400
        
        text = data.get('text', '')
        target_language = data.get('target_language', 'tamil').lower()
        session_id = f"translate_{target_language}"
        
        if target_language == 'tamil':
            message = f"Translate this to Tamil (keep it natural and conversational): {text}"
            chat_language = "english"
        else:
            message = f"Translate this to English (keep it natural and conversational): {text}"
            chat_language = "english"
        
        translated_text = get_gemini_chat_response(message, session_id, chat_language)
        
        return jsonify({
            "original_text": text,
            "translated_text": translated_text,
            "target_language": target_language
        })
        
    except Exception as e:
        return jsonify({
            "error": f"Translation failed: {str(e)}",
            "original_text": data.get('text', '') if 'data' in locals() else ''
        }), 500

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

interpreter = tf.lite.Interpreter(model_path="model_unquant.tflite")
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
def predict(image_path):
    # Preprocess
    img = Image.open(image_path).resize((224, 224))  # match Teachable Machine
    img = np.expand_dims(img, axis=0).astype(np.float32) / 255.0

    interpreter.set_tensor(input_details[0]['index'], img)
    interpreter.invoke()

    preds = interpreter.get_tensor(output_details[0]['index'])[0]

    predicted_index = np.argmax(preds)
    confidence = float(preds[predicted_index])

    return {
        "class": class_names[predicted_index],
        "confidence": confidence
    }

@app.route("/predict", methods=["POST"])
def predict_route():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    # Save temporarily
    filepath = os.path.join("uploads", file.filename)
    os.makedirs("uploads", exist_ok=True)
    file.save(filepath)

    # Call the helper
    result = predict(filepath)

    # Optionally, clean up file
    os.remove(filepath)

    return jsonify(result)

@app.route('/api/trace', methods=['POST'])
def save_trace_data():
    try:
        data = request.get_json()

        required_fields = ['user','product', 'batchNumber', 'location', 'notes', 'timestamp']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400
            
        # Insert into MongoDB
        result = trace_collection.insert_one({
            "user":data["user"],
            "product": data['product'],
            "batchNumber": data['batchNumber'],
            "location": data['location'],
            "notes": data['notes'],
            "timestamp": data['timestamp'],
        })

        return jsonify({"message": "Trace data saved successfully", "id": str(result.inserted_id)}), 201

    except Exception as e:
        print("Trace error:", e)
        return jsonify({"error": "Failed to save trace data"}), 500
    
# @app.route('/api/trace', methods=['GET'])
# def get_trace_data():
#     try:
#         print("Fetching trace data from DB...")
#         traces = list(trace_collection.find().sort("timestamp", -1).limit(10))
#         print(f"Fetched {len(traces)} traces")
#         for trace in traces:
#             trace['_id'] = str(trace['_id'])
#             if 'timestamp' in trace and isinstance(trace['timestamp'], datetime.datetime):
#                 trace['timestamp'] = trace['timestamp'].isoformat()
#         return jsonify({"traces": traces}), 200
#     except Exception as e:
#         print("Error fetching trace data:", e)
#         return jsonify({"error": "Failed to fetch trace data"}), 500
@app.route('/api/trace', methods=['GET'])
def get_trace_data():
    try:
        # 1️⃣ Get username from query params
        username = request.args.get("user")
        if not username:
            return jsonify({"error": "User not specified"}), 400

        print(f"Fetching trace data for user: {username}")

        # 2️⃣ Query MongoDB for that user only
        traces = list(
            trace_collection.find({"user": username})
            .sort("timestamp", -1)  # latest first
            .limit(10)
        )

        # 3️⃣ Convert ObjectId and datetime to JSON-friendly format
        for trace in traces:
            trace["_id"] = str(trace["_id"])
            if "timestamp" in trace and isinstance(trace["timestamp"], datetime.datetime):
                trace["timestamp"] = trace["timestamp"].isoformat()

        return jsonify({"traces": traces}), 200

    except Exception as e:
        print("Error fetching trace data:", e)
        return jsonify({"error": "Failed to fetch trace data"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
