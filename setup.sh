#!/bin/bash
# Setup script for Trana Food Waste App AI Backend

# Print colored text
print_blue() {
    echo -e "\e[34m$1\e[0m"
}

print_green() {
    echo -e "\e[32m$1\e[0m"
}

print_yellow() {
    echo -e "\e[33m$1\e[0m"
}

print_red() {
    echo -e "\e[31m$1\e[0m"
}

# Check Python version
print_blue "Checking Python version..."
if command -v python3 &>/dev/null; then
    python_version=$(python3 --version)
    print_green "Found $python_version"
else
    print_red "Python 3 not found. Please install Python 3.9 or higher."
    exit 1
fi

# Create virtual environment
print_blue "Creating virtual environment..."
if [ -d "venv" ]; then
    print_yellow "Virtual environment already exists. Skipping creation."
else
    python3 -m venv venv
    print_green "Virtual environment created."
fi

# Activate virtual environment
print_blue "Activating virtual environment..."
source venv/bin/activate
print_green "Virtual environment activated."

# Install dependencies
print_blue "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
print_green "Dependencies installed successfully."

# Check for .env file
print_blue "Checking for .env file..."
if [ -f ".env" ]; then
    print_green ".env file exists."
else
    print_yellow "Creating .env file with default Gemini API key..."
    echo "GEMINI_API_KEY=AIzaSyCm9jQ4YChDxQLXu7onzEbIXSs1i7rQHHw" > .env
    print_green ".env file created."
fi

# Test the Gemini API connection
print_blue "Testing Gemini API connection..."
print_yellow "Starting Python test script..."
python test_gemini_api.py
if [ $? -eq 0 ]; then
    print_green "Gemini API connection test passed."
else
    print_red "Gemini API connection test failed. Please check your API key in the .env file."
fi

print_green "Setup complete!"
print_blue "To start the backend server, run: source venv/bin/activate && python app.py" 