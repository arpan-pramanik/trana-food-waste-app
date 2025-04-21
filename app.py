import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
import re

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
    """Get creative reuse ideas for leftover ingredients from Gemini AI"""
    try:
        # Get ingredients from the request
        data = request.json
        ingredients = data.get('ingredients', '')
        
        if not ingredients:
            return jsonify({
                "status": "error",
                "message": "No ingredients provided"
            }), 400
        
        # Validate that the request is related to food/ingredients
        if not is_food_related_query(ingredients):
            return jsonify({
                "status": "error",
                "message": "Please enter food ingredients only. This AI is specialized in food waste reduction and cannot answer general questions."
            }), 400
        
        # Construct the prompt
        prompt = f"""You are a creative culinary AI assistant focused exclusively on reducing food waste.
        
        Given the following ingredients: {ingredients}
        
        Please suggest 3 creative ways to use these ingredients to prevent food waste.
        
        Format your response as a JSON array of objects, where each object has the following structure:
        {{
            "title": "Name of the dish or recipe idea",
            "description": "A brief description of how to prepare it and why it's good for reducing waste"
        }}
        
        Each suggestion should be practical, use the ingredients provided, and focus on reducing food waste."""
        
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

@app.route('/api/learn', methods=['POST'])
def get_learn_content():
    """Get educational content about food waste topics from Gemini AI"""
    try:
        # Get topic from the request
        data = request.json
        topic = data.get('topic', '')
        
        if not topic:
            return jsonify({
                "status": "error",
                "message": "No topic provided"
            }), 400
        
        # Validate that the topic is related to food waste or sustainability
        if not is_food_waste_related_topic(topic):
            return jsonify({
                "status": "error",
                "message": "Please enter topics related to food waste, sustainable food practices, or eco-friendly cooking. This AI cannot answer general questions unrelated to these topics."
            }), 400
            
        # Construct the prompt
        prompt = f"""Please provide educational content about "{topic}" in the context of food waste reduction, 
        sustainable food practices, or environmentally friendly cooking methods.
        
        Format your response as a JSON object with the following structure:
        {{
            "title": "A clear title for this educational content",
            "introduction": "A brief introduction to the topic (1-2 sentences)",
            "content": "The main educational content with informative paragraphs. Use HTML formatting (<p>, <ul>, <li>, <strong>) for better display. DO NOT use markdown.",
            "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"],
            "actionSteps": ["Step 1 to implement this knowledge", "Step 2", "Step 3"]
        }}
        
        Make sure the content is informative, educational, and focused on sustainability and reducing food waste.
        Keep the entire response under 350 words and ensure the JSON is complete and properly closed."""
        
        # Send the request to Gemini
        response = model.generate_content(prompt)
        
        # Try to parse the response as JSON
        content = {}
        try:
            # Extract text content from response
            response_text = response.text
            
            # Look for JSON content within response text
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_content = response_text[json_start:json_end]
                
                # Try to parse the JSON
                try:
                    content = json.loads(json_content)
                except json.JSONDecodeError:
                    # If parsing fails, try to fix common JSON issues
                    # 1. Fix truncated content by ensuring quotes match
                    fixed_json = json_content
                    quote_count = fixed_json.count('"')
                    if quote_count % 2 != 0:  # Odd number of quotes (missing closing quote)
                        last_quote_pos = fixed_json.rfind('"')
                        if last_quote_pos != -1:
                            # If there's an open array of tips or actionSteps, close it
                            if "]" not in fixed_json[fixed_json.rfind("["):]:
                                fixed_json = fixed_json[:last_quote_pos+1] + "]}"
                            else:
                                fixed_json = fixed_json[:last_quote_pos+1] + "}"
                    
                    # 2. Ensure array brackets match
                    open_brackets = fixed_json.count("[")
                    close_brackets = fixed_json.count("]")
                    if open_brackets > close_brackets:
                        fixed_json = fixed_json + "]" * (open_brackets - close_brackets)
                    
                    # Try to parse the fixed JSON
                    try:
                        content = json.loads(fixed_json)
                    except json.JSONDecodeError:
                        # If still cannot parse, create a structured response manually
                        raise
            
            # If JSON parsing fails, create a structured response
            if not content:
                # Create a simple structured response
                content = {
                    "title": f"About {topic}",
                    "introduction": "Here's some information on this topic.",
                    "content": sanitize_content(response_text),
                    "tips": ["Be mindful of food waste", "Plan your meals", "Store food properly"],
                    "actionSteps": ["Implement one new practice", "Share knowledge with others", "Track your progress"]
                }
        except Exception as e:
            print(f"Error parsing response: {e}")
            print(f"Raw response: {response.text}")
            # Create a structured response
            content = {
                "title": f"About {topic}",
                "introduction": "Here's some information on this topic.",
                "content": sanitize_content(response_text),
                "tips": ["Be mindful of food waste", "Plan your meals", "Store food properly"],
                "actionSteps": ["Implement one new practice", "Share knowledge with others", "Track your progress"]
            }
        
        # Ensure all required fields are present and properly formatted
        content = validate_and_fix_content(content, topic)
        
        return jsonify({
            "status": "success",
            "topic": topic,
            "content": content
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error generating educational content: {str(e)}"
        }), 500

# Helper functions for validating queries
def is_food_related_query(query):
    """Check if the query is related to food ingredients"""
    # Common food keywords/patterns to check for
    food_keywords = [
        'recipe', 'food', 'ingredient', 'cook', 'meal', 'dish', 'vegetable', 'fruit',
        'meat', 'dairy', 'grain', 'spice', 'herb', 'leftover', 'kitchen', 'bake',
        'roast', 'fry', 'boil', 'grill', 'breakfast', 'lunch', 'dinner', 'snack',
        'appetizer', 'dessert', 'bread', 'rice', 'pasta', 'potato', 'tomato', 'onion',
        'garlic', 'chicken', 'beef', 'pork', 'fish', 'cheese', 'egg', 'milk', 'butter',
        'oil', 'sugar', 'salt', 'pepper', 'flour', 'salad', 'soup', 'stew', 'sauce'
    ]
    
    # Check if query contains basic food terms
    query_lower = query.lower()
    
    # If the query specifically asks about non-food topics
    non_food_patterns = [
        r'what is the weather', r'who (is|was|are|were)', r'when (is|was|did)',
        r'where (is|are|can)', r'how (tall|old|far|long|big|much money)',
        r'capital of', r'population of', r'president of', r'history of',
        r'math', r'calculate', r'solve', r'equation', r'physics', r'chemistry'
    ]
    
    for pattern in non_food_patterns:
        if re.search(pattern, query_lower):
            return False
    
    # Detect if it contains food keywords
    for keyword in food_keywords:
        if keyword.lower() in query_lower:
            return True
            
    # If no definitive non-food patterns but also no food keywords,
    # assume it might be food-related for better user experience
    return True

def is_food_waste_related_topic(topic):
    """Check if the topic is related to food waste or sustainability"""
    # Keywords related to food waste and sustainability
    relevant_keywords = [
        'food waste', 'compost', 'leftovers', 'storage', 'preservation', 'sustainable',
        'eco-friendly', 'green', 'environment', 'recycle', 'reuse', 'reduce',
        'carbon footprint', 'climate', 'organic', 'local food', 'seasonal',
        'meal plan', 'shopping list', 'expiration', 'best before', 'refrigeration',
        'freezing', 'canning', 'fermentation', 'drying', 'pickling', 'garden',
        'grow your own', 'farm to table', 'zero waste', 'biodegradable', 'packaging'
    ]
    
    # Check if topic contains relevant terms
    topic_lower = topic.lower()
    
    # If the topic specifically asks about non-food topics
    non_relevant_patterns = [
        r'what is the weather', r'who (is|was|are|were)', r'when (is|was|did)',
        r'where (is|are|can)', r'how (tall|old|far|long|big|much money)',
        r'capital of', r'population of', r'president of', r'history of',
        r'math', r'calculate', r'solve', r'equation', r'physics', r'chemistry',
        r'movie', r'film', r'celebrity', r'sports', r'game', r'politics'
    ]
    
    for pattern in non_relevant_patterns:
        if re.search(pattern, topic_lower):
            return False
    
    # Detect if it contains relevant keywords
    for keyword in relevant_keywords:
        if keyword.lower() in topic_lower:
            return True
            
    # For general food terms that might be related
    food_keywords = [
        'food', 'cooking', 'recipe', 'kitchen', 'meal', 'ingredient',
        'vegetable', 'fruit', 'meat', 'dairy', 'grain', 'diet', 'nutrition'
    ]
    
    for keyword in food_keywords:
        if keyword.lower() in topic_lower:
            return True
            
    # If no definitive non-relevant patterns but also no relevant keywords,
    # it might still be indirectly related - allow it
    return True

# Helper function to sanitize content
def sanitize_content(text):
    """Clean up content to make it suitable for display"""
    # Remove any code blocks, JSON formatting, or other technical elements
    text = re.sub(r'```json.*?```', '', text, flags=re.DOTALL)
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    text = re.sub(r'\{.*?\}', '', text, flags=re.DOTALL)
    
    # Clean up any remaining markdown
    text = text.replace('```', '').replace('`', '')
    
    # Format with simple HTML
    paragraphs = text.split('\n\n')
    html_content = ""
    for p in paragraphs:
        if p.strip():
            html_content += f"<p>{p.strip()}</p>"
    
    return html_content

# Helper function to validate and fix content structure
def validate_and_fix_content(content, topic):
    """Ensure all required fields are present and properly formatted"""
    if not isinstance(content, dict):
        content = {}
    
    # Ensure all required fields exist
    if "title" not in content or not content["title"]:
        content["title"] = f"About {topic}"
    
    if "introduction" not in content or not content["introduction"]:
        content["introduction"] = "Here's what you should know about this topic related to food waste reduction."
    
    if "content" not in content or not content["content"]:
        content["content"] = "<p>This topic is important for sustainable food practices. Consider learning more about reducing waste and environmental impact of food consumption.</p>"
    
    # Ensure tips is a list
    if "tips" not in content or not isinstance(content["tips"], list):
        content["tips"] = ["Be mindful of food waste", "Plan your meals", "Store food properly"]
    elif len(content["tips"]) == 0:
        content["tips"] = ["Be mindful of food waste", "Plan your meals", "Store food properly"]
    
    # Ensure actionSteps is a list
    if "actionSteps" not in content or not isinstance(content["actionSteps"], list):
        content["actionSteps"] = ["Implement one new practice", "Share knowledge with others", "Track your progress"]
    elif len(content["actionSteps"]) == 0:
        content["actionSteps"] = ["Implement one new practice", "Share knowledge with others", "Track your progress"]
    
    return content

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 