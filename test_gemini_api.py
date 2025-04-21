#!/usr/bin/env python3
"""
Test script for verifying the Gemini API connection and functionality.
This script tests the Gemini API directly, without going through the Flask app.
"""

import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

def test_gemini_api():
    """Test basic functionality of the Gemini API with a simple prompt."""
    print("Testing Gemini API connection...")
    
    # Load environment variables
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        print("Please check your .env file")
        return False
    
    # Configure the API
    genai.configure(api_key=api_key)
    
    try:
        # Initialize the model (Gemini 1.5 Flash)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "temperature": 0.7,
                "max_output_tokens": 500,
                "top_k": 40,
                "top_p": 0.95,
            }
        )
        
        # Test with a simple prompt
        response = model.generate_content("Hello, can you provide a brief response to test the connection?")
        
        print("✅ API connection successful!")
        print(f"Response: {response.text}\n")
        
        # Test with a food waste suggestion prompt
        print("Testing food waste suggestion generation...")
        
        test_ingredients = "leftover rice, half an avocado, and some bell peppers"
        prompt = f"""I have the following ingredients that I want to use up to reduce food waste: {test_ingredients}. 
        Please suggest 3 creative and practical ways to use these ingredients. 
        For each suggestion, provide a title and a brief description of how to prepare it. 
        Keep suggestions concise and focused on reducing food waste. Format your response as a JSON array with objects containing 'title' and 'description' properties."""
        
        response = model.generate_content(prompt)
        
        # Try to parse the JSON response
        response_text = response.text
        print(f"Raw response: {response_text[:300]}...\n")
        
        # Look for JSON content
        json_start = response_text.find('[')
        json_end = response_text.rfind(']') + 1
        
        if json_start >= 0 and json_end > json_start:
            json_content = response_text[json_start:json_end]
            suggestions = json.loads(json_content)
            print("✅ Successfully parsed JSON response!")
            print(f"Number of suggestions: {len(suggestions)}")
            
            # Print formatted suggestions
            for i, suggestion in enumerate(suggestions):
                print(f"\nSuggestion {i+1}:")
                print(f"Title: {suggestion['title']}")
                print(f"Description: {suggestion['description']}")
            
            return True
        else:
            print("⚠️ Could not find JSON array in response. Response format:")
            print(response_text)
            return False
        
    except Exception as e:
        print(f"❌ Error testing Gemini API: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_gemini_api()
    print("\nTest result:", "✅ PASSED" if success else "❌ FAILED") 