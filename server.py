from flask import Flask, request, jsonify
import joblib
import json
import os
import re
import numpy as np
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import pickle
import requests

app = Flask(__name__)
CORS(app)
load_dotenv()  
API_KEY = "158dbd3bb6a543d89d7115734251209"
BASE_URL = "http://api.weatherapi.com/v1/forecast.json"
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Load the trained KNN model
with open('fertilizer_data.json', 'r') as f:
    fertilizer_guide = json.load(f)
    
with open("knn_model.joblib", "rb") as f:
    model = pickle.load(f)

def get_gemini_response(input_prompt, model_type="gemini-1.5-flash"):
    """
    Calls the Gemini API with the given prompt and returns the generated content.
    """
    model = genai.GenerativeModel(model_type)
    generation_config = {
        "temperature": 0.0,  # Consistent output
        "top_p": 1,
    }
    
    response = model.generate_content(input_prompt, generation_config=generation_config)
    
    # Debugging
    print("Gemini API response:", response)

    if not response.candidates:
        raise ValueError("Gemini API returned no candidates.")

    try:
        candidate_content = response.candidates[0].content.parts[0].text.strip()
        
        # Extract JSON from code block formatting if necessary
        json_match = re.search(r'```json\n([\s\S]+?)\n```', candidate_content)
        if json_match:
            json_string = json_match.group(1).strip()
        else:
            json_string = candidate_content

        return json.loads(json_string)
    
    except Exception as e:
        raise ValueError(f"Error extracting or parsing response: {e}")

def get_gemini_chat_response(input_prompt, model_type="gemini-1.5-flash"):
    """
    Calls the Gemini API for chat responses and returns plain text.
    """
    model = genai.GenerativeModel(model_type)
    generation_config = {
        "temperature": 0.7,  # More creative for chat
        "top_p": 0.9,
    }
    
    response = model.generate_content(input_prompt, generation_config=generation_config)
    
    if not response.candidates:
        raise ValueError("Gemini API returned no candidates.")

    try:
        return response.candidates[0].content.parts[0].text.strip()
    except Exception as e:
        raise ValueError(f"Error extracting response: {e}")

@app.route("/api/fertilizer-predict", methods=["POST"])
def predict_fertilizer():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["temperature", "humidity", "moisture", "soil", "crop", "nitrogen", "phosphorous", "potassium"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Convert and validate numeric fields
        try:
            temperature = float(data["temperature"])
            humidity = float(data["humidity"])
            moisture = float(data["moisture"])
            nitrogen = max(1, float(data["nitrogen"]))  # Ensure > 0
            phosphorous = max(1, float(data["phosphorous"]))
            potassium = max(1, float(data["potassium"]))
        except ValueError:
            return jsonify({"error": "All numeric fields must be valid numbers"}), 400

        # Validate soil and crop types
        soil = data["soil"].lower()
        crop = data["crop"].lower()
        soil_types = ["clayey", "loamy", "black", "red", "sandy"]
        crop_types = ["wheat", "rice", "maize", "cotton", "sugarcane"]

        if soil not in soil_types:
            return jsonify({"error": f"Invalid soil type. Must be one of: {soil_types}"}), 400
        if crop not in crop_types:
            return jsonify({"error": f"Invalid crop type. Must be one of: {crop_types}"}), 400

        soil_encoded = [1 if soil == s else 0 for s in soil_types]
        crop_encoded = [1 if crop == c else 0 for c in crop_types]

        prediction = model[0]  # Example: Use the array directly
        return jsonify({"fertilizer": prediction})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/recommend-fertilizer', methods=['POST'])
def recommend_fertilizer():
    """
    Analyzes soil, crop, and environmental data to recommend the best fertilizer with explanations.
    """
    data = request.get_json()

    # Validate required fields
    required_fields = ['temperature', 'humidity', 'moisture', 'soil', 'crop', 
                     'nitrogen', 'phosphorous', 'potassium']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        # Prepare the input prompt for Gemini
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
        - Recommended fertilizer (primary choice)
        - Alternative options (if applicable)
        - Scientific justification for the recommendation
        - Application instructions
        - Organic alternatives

        Response Format:
        {{
            "RecommendedFertilizer": "",
            "Alternatives": [],
            "ScientificReasoning": "",
            "ApplicationInstructions": "",
            "OrganicAlternatives": ""
        }}
        """

        # Get response from Gemini
        recommendation = get_gemini_response(input_prompt)
        return jsonify(recommendation)

    except Exception as e:
        return jsonify({"error": f"Error processing request: {e}"}), 500

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

@app.route('/api/chat/quick-tips', methods=['GET'])
def get_quick_tips():
    """
    Get quick farming tips using chat session
    """
    try:
        language = request.args.get('language', 'english').lower()
        session_id = f"tips_{language}"
        
        if language == 'tamil':
            message = """
            தற்போதைய காலநிலை மற்றும் பருவத்திற்கு ஏற்ற 5 விவசாய குறிப்புகளை தமிழில் வழங்கவும்.
            இது இந்தியாவின் விவசாயிகளுக்கு பயனுள்ளதாக இருக்க வேண்டும்.
            ஒவ்வொரு குறிப்பும் ஒரு வரியில் இருக்க வேண்டும்.
            """
        else:
            message = """
            Provide 5 quick farming tips for the current season that would be useful for Indian farmers.
            Each tip should be one line and practical.
            """
        
        tips_response = get_gemini_chat_response(message, session_id, language)
        tips = [tip.strip() for tip in tips_response.split('\n') if tip.strip() and not tip.strip().startswith('#')]
        
        return jsonify({
            "tips": tips[:5],  # Ensure only 5 tips
            "language": language
        })
        
    except Exception as e:
        default_tips = [
            "Check soil moisture regularly",
            "Monitor weather forecasts for planning", 
            "Inspect crops for pest damage daily",
            "Maintain proper spacing between plants",
            "Keep farming tools clean and maintained"
        ]
        
        if language == 'tamil':
            default_tips = [
                "மண்ணின் ஈரப்பதத்தை தொடர்ந்து சரிபார்க்கவும்",
                "திட்டமிடலுக்காக வானிலை முன்னறிவிப்பைக் கண்காணிக்கவும்",
                "தினமும் பயிர்களில் பூச்சி சேதம் இருக்கிறதா என்று பார்க்கவும்",
                "செடிகளுக்கு இடையில் சரியான இடைவெளி வைக்கவும்",
                "விவசாய கருவிகளை சுத்தமாக வைத்துக் கொள்ளுங்கள்"
            ]
        
        return jsonify({
            "tips": default_tips,
            "language": language,
            "fallback": True
        })

@app.route('/api/chat/clear-session', methods=['POST'])
def clear_chat_session():
    """
    Clear a specific chat session
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        if session_id in chat_sessions:
            del chat_sessions[session_id]
            return jsonify({"message": "Chat session cleared", "session_id": session_id})
        else:
            return jsonify({"message": "No active session found", "session_id": session_id})
            
    except Exception as e:
        return jsonify({"error": f"Failed to clear session: {str(e)}"}), 500

@app.route('/api/chat/sessions', methods=['GET'])
def get_active_sessions():
    """
    Get list of active chat sessions (for debugging)
    """
    try:
        sessions = []
        for session_id, session_data in chat_sessions.items():
            sessions.append({
                "session_id": session_id,
                "language": session_data.get("language"),
                "created_at": session_data.get("created_at"),
                "message_count": len(session_data["chat"].history)
            })
        
        return jsonify({"active_sessions": sessions, "total_sessions": len(sessions)})
        
    except Exception as e:
        return jsonify({"error": f"Failed to get sessions: {str(e)}"}), 500
@app.route("/forecast")
def get_forecast():
    params = {
        "key": API_KEY,
        "q": "Madurai",
        "days": 7,
        "aqi": "no",
        "alerts": "yes"
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()

    # Extract forecast info
    forecast_data = []
    for day in data["forecast"]["forecastday"]:
        forecast_data.append({
            "date": day["date"],
            "chance_of_rain": day["day"]["daily_chance_of_rain"]
        })

    return jsonify(forecast_data)

if __name__ == "__main__":
    app.run(debug=True, port=5000)