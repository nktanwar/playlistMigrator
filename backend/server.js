const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { google } = require('googleapis');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors')


const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin:'http://localhost:5173',
  credentials:true,
}))
async function connectDb() {
  try{
    const db = await mongoose.connect(process.env.mongoDbKey);
    console.debug("db connected");
  }
  catch(e){
    console.log("can not connect to the db");
  }
  
}

connectDb();

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID, //  OAuth Client ID
  process.env.YOUTUBE_CLIENT_SECRET, //  OAuth Client Secret
  'http://localhost:3000/oauth2callback' // Redirect URL after successful login
);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave:false, 
  saveUninitialized:false,
  cookie: {
    httpOnly: true,
    secure: false, // set to true only in production (HTTPS)
    sameSite: 'lax', // or 'none' if using HTTPS
  }
}));

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
const migrateroute = require('./routes/migrate'); 

app.use('/api',migrateroute);

// Route to initiate the OAuth2 flow
// This route will redirect the user to the Google authentication page
// where they can grant permission to  app
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],  
  });
  res.redirect(authUrl);
});

// Callback route where Google redirects after the user authenticates
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);  // Get tokens from Google
  oauth2Client.setCredentials(tokens);
  console.log(tokens);
  req.session.tokens = tokens;  // Store tokens in the session
  res.redirect('http://localhost:5173/migration');
});


// Route to check if the user is authenticated
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


