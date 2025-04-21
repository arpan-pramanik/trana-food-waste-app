# Trāṇa Food Waste App - AI Backend

This document describes the Flask backend for the Trāṇa food waste reduction app, which provides AI-powered suggestions for reusing leftover ingredients using Google's Gemini AI.

## Overview

The backend is built with Flask, a lightweight and flexible web framework for Python. It connects to Google's Gemini 1.5 Flash model to generate creative food reuse suggestions based on the ingredients provided by the user.

## Setup and Installation

### Prerequisites

- Python 3.9 or higher
- Pip package manager

### Installation

1. Clone the repository and navigate to the project directory:

```bash
git clone <repository-url>
cd trana-food-waste-app
```

2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

3. Set up your environment variables:

Create a `.env` file in the project root with your Gemini API key:

```
GEMINI_API_KEY=AIzaSyCm9jQ4YChDxQLXu7onzEbIXSs1i7rQHHw
```

Note: The API key is also hardcoded in the app.py file as a fallback, but using environment variables is the recommended approach for security.

## Running the Backend

Start the backend server:

```bash
python app.py
```

This will start the server at http://localhost:5000 with debug mode enabled for development.

## API Endpoints

### Test Connection

Tests if the connection to the Gemini AI API is working.

- **URL:** `/api/test-connection`
- **Method:** GET
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "status": "success", "message": "API connection successful", "response": "..." }`
- **Error Response:**
  - **Code:** 500
  - **Content:** `{ "status": "error", "message": "API connection error: ..." }`

### Get Suggestions

Gets food reuse suggestions from Gemini AI based on provided ingredients.

- **URL:** `/api/suggestions`
- **Method:** POST
- **Request Body:**
  ```json
  {
    "ingredients": "rice, avocado, bell peppers"
  }
  ```
- **Success Response:**
  - **Code:** 200
  - **Content:** 
    ```json
    {
      "status": "success",
      "ingredients": "rice, avocado, bell peppers",
      "suggestions": [
        {
          "title": "Avocado Rice Bowl",
          "description": "Sauté bell peppers and mix with cooked rice. Top with sliced avocado, a squeeze of lime, and a sprinkle of salt for a quick and nutritious meal."
        },
        ...
      ]
    }
    ```
- **Error Response:**
  - **Code:** 400
  - **Content:** `{ "status": "error", "message": "No ingredients provided" }`
  - **Code:** 500
  - **Content:** `{ "status": "error", "message": "Error generating suggestions: ..." }`

## Testing

You can test the Gemini API connection directly with the test script:

```bash
python test_gemini_api.py
```

## Connecting to the Frontend

The frontend in `pages/ai.html` is already configured to connect to this backend at `http://localhost:5000`. No changes to the frontend should be necessary as long as the backend API endpoints remain the same.

## Important Note

This backend uses CORS to allow connections from any origin. In a production environment, you should restrict this to specific origins for security. 