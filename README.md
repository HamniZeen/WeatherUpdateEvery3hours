Welcome to the Weather Update System! This Node.js application provides periodic weather updates to users through email. It uses Express for handling HTTP requests, MongoDB for storing user information and weather data, and the OpenWeatherMap API for fetching real-time weather information.

Clone the repository:
 git clone https://github.com/HamniZeen/WeatherUpdateEvery3hours.git

Navigate to the project directory
Install dependencies
Start the server

Endpoints:
1. Add User
- POST : '/user'
Add a new user with email and location.
Request:

{
  "email": "user@example.com",
  "location": "City, Country"
}

2. Update User Location
- PUT :'/user/:userId/location'
Update the location for a specific user.
Request:

{
  "newLocation": "New City, New Country"
}

3. Get Users for a Specific Date
- GET : '/users/weather/:date'
Get a list of users and their locations for a specific date.

Important Note
Authentication is required for updating the user's location and retrieving user information.

License
This project is licensed under the MIT License - see the LICENSE file for details.
