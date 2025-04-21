import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure the Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCm9jQ4YChDxQLXu7onzEbIXSs1i7rQHHw")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)

# Use the Gemini 1.5 Flash model
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config={
        "temperature": 0.7,
        "max_output_tokens": 500,
        "top_k": 40,
        "top_p": 0.95,
    }
)

@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    """Test if the Gemini API connection is working"""
    try:
        # Make a simple query to test the connection
        response = model.generate_content("Hello, can you provide a brief response to test the connection?")
        return jsonify({
            "status": "success",
            "message": "API connection successful",
            "response": response.text
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"API connection error: {str(e)}"
        }), 500

@app.route('/api/suggestions', methods=['POST'])
def get_suggestions():
    """Get food reuse suggestions from Gemini AI"""
    try:
        # Get ingredients from the request
        data = request.json
        ingredients = data.get('ingredients', '')
        
        if not ingredients:
            return jsonify({
                "status": "error",
                "message": "No ingredients provided"
            }), 400
        
        # Construct the prompt
        prompt = f"""I have the following ingredients that I want to use up to reduce food waste: {ingredients}. 
        Please suggest 3 creative and practical ways to use these ingredients. 
        For each suggestion, provide a title and a brief description of how to prepare it. 
        Keep suggestions concise and focused on reducing food waste. Format your response as a JSON array with objects containing 'title' and 'description' properties."""
        
        # Send the request to Gemini
        response = model.generate_content(prompt)
        
        # Try to parse the response as JSON
        suggestions = []
        try:
            # Extract text content from response
            response_text = response.text
            
            # Look for JSON content within response text
            # Sometimes the model might include markdown code blocks or other text
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_content = response_text[json_start:json_end]
                suggestions = json.loads(json_content)
            else:
                # If no JSON array is found, try to extract structured data manually
                lines = response_text.split('\n')
                current_suggestion = None
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    if current_suggestion is None:
                        current_suggestion = {"title": line, "description": ""}
                    elif "description" in current_suggestion and not current_suggestion["description"]:
                        current_suggestion["description"] = line
                        suggestions.append(current_suggestion)
                        current_suggestion = None
        except Exception as e:
            print(f"Error parsing response: {e}")
            print(f"Raw response: {response.text}")
            # If parsing fails, return the raw text
            return jsonify({
                "status": "success",
                "raw_response": response.text,
                "suggestions": []
            })
        
        return jsonify({
            "status": "success",
            "ingredients": ingredients,
            "suggestions": suggestions
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error generating suggestions: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 