const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
require('dotenv').config();
const cors = require('cors')


const app = express();
app.set('trust proxy', 1);

app.use(bodyParser.json());
app.use(cors({
  origin:'https://playlist-migrator-tau.vercel.app',
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
  'https://playlistmigrator.onrender.com/oauth2callback' // Redirect URL after successful login
);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.mongoDbKey,
    collectionName: 'sessions', // optional, default is "sessions"
    ttl: 60 * 60 * 24 // 1 day in seconds
  }),
  cookie: {
    httpOnly: true,
    secure: true, // set to true in production with HTTPS
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 // 1 day in ms
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
  try {
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    req.session.tokens = tokens; // Store tokens in session

    // Explicitly save session to MongoDB before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("❌ Error saving session:", err);
        return res.status(500).send("Session save failed");
      }

      console.log("✅ Session saved:", req.session.id);
      res.redirect('https://playlist-migrator-tau.vercel.app/migration');
    });
  } catch (error) {
    console.error("❌ OAuth callback error:", error);
    res.status(500).send("OAuth failed");
  }
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


