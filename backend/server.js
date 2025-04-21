const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
// Import the  migration route

app.use(bodyParser.json());



const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID, // Your OAuth Client ID
  process.env.YOUTUBE_CLIENT_SECRET, // Your OAuth Client Secret
  'http://localhost:3000/oauth2callback' // Redirect URL after successful login
);

app.use(session({
  secret: process.env.SESSION_SECRET, // Secret for session management
  resave: false,
  saveUninitialized: true,
}));

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
const migrateroute = require('./routes/migrate'); 
app.use('/api',migrateroute);

// Route to initiate the OAuth2 flow
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],  // Define necessary scopes
  });
  res.redirect(authUrl);
});

// Callback route where Google redirects after the user authenticates
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);  // Get tokens from Google
  oauth2Client.setCredentials(tokens);
  req.session.tokens = tokens;  // Store tokens in the session
  res.redirect('/index.html');
});

app.get('/', (req, res) => {
  if (req.session.tokens) {
    res.send('Successfully authenticated with Google!');
  } else {
    res.send('Please authenticate first.');
  }
});
app.get('/check-auth', (req, res) => {
  if (req.session.tokens) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});


module.exports = oauth2Client; 


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
