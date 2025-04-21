#!/usr/bin/env python3
"""
Test script for verifying the Flask backend with Gemini AI integration.
This script tests the backend API endpoints directly.
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:5000"

def print_color(text, color_code):
    """Print colored text to the console"""
    print(f"\033[{color_code}m{text}\033[0m")

def print_success(text):
    """Print success message in green"""
    print_color(text, 92)

def print_error(text):
    """Print error message in red"""
    print_color(text, 91)

def print_info(text):
    """Print info message in blue"""
    print_color(text, 94)

def print_warning(text):
    """Print warning message in yellow"""
    print_color(text, 93)

def test_connection_endpoint():
    """Test the /api/test-connection endpoint"""
    print_info("\n===== Testing /api/test-connection endpoint =====")
    
    try:
        response = requests.get(f"{BASE_URL}/api/test-connection")
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                print_success("✅ API connection test successful!")
                print_info(f"Response message: {data.get('message')}")
                print_info(f"Gemini response: {data.get('response')[:100]}...")
                return True
            else:
                print_error(f"❌ API returned error: {data.get('message')}")
                return False
        else:
            print_error(f"❌ HTTP Error: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("❌ Connection Error: Could not connect to the backend server")
        print_warning("Make sure the backend server is running at http://localhost:5000")
        return False
    except Exception as e:
        print_error(f"❌ Error testing connection endpoint: {str(e)}")
        return False

def test_suggestions_endpoint():
    """Test the /api/suggestions endpoint"""
    print_info("\n===== Testing /api/suggestions endpoint =====")
    
    test_ingredients = "leftover rice, half an avocado, and some bell peppers"
    print_info(f"Sending test ingredients: '{test_ingredients}'")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/suggestions",
            json={"ingredients": test_ingredients}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                suggestions = data.get("suggestions", [])
                
                if suggestions:
                    print_success(f"✅ Successfully received {len(suggestions)} suggestions!")
                    
                    # Display the suggestions
                    for i, suggestion in enumerate(suggestions):
                        print_info(f"\nSuggestion {i+1}:")
                        print_info(f"Title: {suggestion.get('title')}")
                        print_info(f"Description: {suggestion.get('description')}")
                    
                    return True
                else:
                    print_warning("⚠️ API returned success but no suggestions were found")
                    if "raw_response" in data:
                        print_info("Raw response from Gemini:")
                        print_info(data.get("raw_response")[:300] + "...")
                    return False
            else:
                print_error(f"❌ API returned error: {data.get('message')}")
                return False
        else:
            print_error(f"❌ HTTP Error: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("❌ Connection Error: Could not connect to the backend server")
        print_warning("Make sure the backend server is running at http://localhost:5000")
        return False
    except Exception as e:
        print_error(f"❌ Error testing suggestions endpoint: {str(e)}")
        return False

def run_tests():
    """Run all tests"""
    print_info("Starting Flask Backend Tests...")
    
    # Test connection first
    connection_success = test_connection_endpoint()
    if not connection_success:
        print_error("\n❌ Connection test failed. Stopping tests.")
        return False
    
    time.sleep(1)  # Small delay between tests
    
    # Test suggestions endpoint
    suggestions_success = test_suggestions_endpoint()
    
    # Print final results
    print_info("\n===== Test Results =====")
    if connection_success:
        print_success("✅ Connection Test: PASSED")
    else:
        print_error("❌ Connection Test: FAILED")
    
    if suggestions_success:
        print_success("✅ Suggestions Test: PASSED")
    else:
        print_error("❌ Suggestions Test: FAILED")
    
    return connection_success and suggestions_success

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1) 