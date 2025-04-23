# Trāṇa - Food Waste Reduction App

## Overview
Trāṇa is a web application designed to help users reduce food waste and promote sustainability. The app provides various features such as food logging, carbon footprint calculation, AI-powered reuse suggestions, and educational resources to encourage sustainable practices.

## Features
- **Homepage**: Introduction to Trāṇa with navigation to other sections.
- **Food Logger**: Log food items with details and receive alerts for items nearing expiry.
- **Carbon Footprint Calculator**: Calculate the carbon emissions associated with wasted food.
- **AI Suggestions**: Get creative reuse ideas for food items using the Gemini AI API.
- **Learn Section**: Access static educational content on food storage, meal planning, and composting.
- **Gamification**: Earn badges for actions taken to reduce food waste and track achievements.
- **Profile Page**: View user statistics and edit personal information.

## AI-Powered Food Reuse Suggestions

The application includes a feature that uses Google's Gemini AI model to provide creative suggestions for reusing leftover ingredients. This feature helps users:

1. Reduce food waste by finding new ways to use ingredients
2. Save money by making the most of what's already in the kitchen
3. Discover new recipe ideas they might not have considered

## Technical Implementation

The project consists of:

- Frontend: HTML, CSS, and JavaScript
- Backend: Python with Flask for the AI suggestions API
- Database: Local storage for user data
- AI Integration: Google's Gemini 1.5 Flash model via API

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Web browser (Chrome, Firefox, etc.)
- Internet connection (for AI features)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd Trāṇa-food-waste-app
   ```

2. Set up the Python backend for AI features:
   ```
   ./setup.sh
   ```
   This script will:
   - Create a virtual environment
   - Install the required dependencies
   - Set up the API key for Gemini AI
   - Test the connection to the API

3. Start the backend server:
   ```
   source venv/bin/activate
   python app.py
   ```

4. Open the web application:
   - Open the `index.html` file in your web browser
   - Navigate to the "AI Suggestions" page

## Usage

### AI Suggestions

1. Go to the "AI Suggestions" page
2. Enter the ingredients you want to use up
3. Click "Get Reuse Ideas"
4. View creative suggestions for using your ingredients
5. Save suggestions you like for future reference

## API Documentation

The backend provides two main endpoints:

- `GET /api/test-connection` - Tests the connection to the Gemini AI API
- `POST /api/suggestions` - Gets food reuse suggestions based on provided ingredients

For detailed information, see [README-AI-BACKEND.md](README-AI-BACKEND.md).

## File Structure
```
Trāṇa-food-waste-app
├── index.html
├── pages
│   ├── food.html
│   ├── carbon.html
│   ├── ai.html
│   ├── learn.html
│   ├── badges.html
│   └── profile.html
├── css
│   └── style.css
├── js
│   ├── main.js
│   ├── storage.js
│   ├── carbon-calculator.js
│   ├── food-logger.js
│   ├── badges.js
│   ├── ai-suggestions.js
│   └── config.js
├── assets
│   ├── icons
│   └── badges
└── README.md
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Open the `index.html` file in your web browser to view the application.
3. Ensure you have an active internet connection for API calls to the Gemini AI.

## Technologies Used
- HTML
- CSS
- JavaScript
- Local Storage for data persistence

## Contribution
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments
- Google's Gemini AI for powering the smart suggestions
- All contributors to the project