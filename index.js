const express = require('express');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
const PORT = 3000;

mongoose.connect('mongodb+srv://hamna:mzOEzRP2MF3QmxLQ@cluster0.lts1eva.mongodb.net/codescale', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'aviationlankaa@gmail.com',
    pass: 'pafy gbep mdyo cawt'
  }
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Missing or invalid token.' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== 'codescaleSecret') {
    return res.status(401).json({ error: 'Unauthorized - Invalid token.' });
  }

  next();
};

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  location: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
  weatherData: {
    temperature: Number,
    conditions: String,
    humidity: Number,
    windSpeed: Number,
    pressure: Number,
    visibility: Number,
  },
});

const User = mongoose.model('User', userSchema);

cron.schedule('0 */3 * * *', async () => {
  console.log('Cron job running...');
  const users = await User.find();

  users.forEach(async (user) => {
    try {
      const weatherData = await fetchWeather(user.location);
      updateWeatherData(user._id, weatherData);

      
      sendEmail(user.email, weatherData);
    } catch (error) {
      console.error('Error processing user:', error);
    }
  });
});


async function fetchWeather(location) {
  const apiKey = '66ef0828c36b07d339221b5438f8072e';
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return {
      temperature: data.main.temp,
      conditions: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      visibility: data.visibility,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}


async function updateWeatherData(userId, weatherData) {
  try {
    await User.findByIdAndUpdate(userId, { $set: { weatherData } });
    console.log(`Weather data updated for user with ID: ${userId}`);
  } catch (error) {
    console.error('Error updating weather data:', error);
    throw error;
  }
}


async function sendEmail(to, weatherData) {
  const currentDate = new Date();

  const mailOptions = {
    from: 'aviationlankaa@gmail.com', 
    to,
    subject: 'Current Weather Report',
    html: `
      <p>Current Date and Time: ${currentDate.toLocaleString()}</p>
      <p>Temperature: ${weatherData.temperature}</p>
      <p>Conditions: ${weatherData.conditions}</p>
      <p>Humidity: ${weatherData.humidity}</p>
      <p>Wind Speed: ${weatherData.windSpeed}</p>
      <p>Pressure: ${weatherData.pressure}</p>
      <p>Visibility: ${weatherData.visibility}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}


app.post('/user', async (req, res) => {
  const { email, location } = req.body;

  try {
    if (!email || !location) {
      return res.status(400).json({ error: 'Email and location are required.' });
    }

    const currentDate = new Date();
    const newUser = new User({ email, location, lastUpdated: currentDate });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to store user data.' });
  }
});

app.put('/user/:userId/location', authenticate, async (req, res) => {
  const { userId } = req.params;
  const { newLocation } = req.body;

  try {
    if (!newLocation) {
      return res.status(400).json({ error: 'New location is required.' });
    }

    const user = await User.findByIdAndUpdate(userId, { $set: { location: newLocation } }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user location.' });
  }
});

app.get('/users/weather/:date', authenticate, async (req, res) => {
  const { date } = req.params;

  try {
    const users = await User.find();
    const result = users.map(user => {
      return {
        email: user.email,
        location: user.location,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Failed to retrieve user information. ${error.message || error}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
