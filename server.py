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
app = Flask(__name__)
CORS(app)
load_dotenv()  
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
# Load the trained KNN model


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
        go through the pdf at link https://www.nrcs.usda.gov/sites/default/files/2023-06/EC750_2023.pdf 
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

if __name__ == "__main__":
    app.run(debug=True, port=5000)
