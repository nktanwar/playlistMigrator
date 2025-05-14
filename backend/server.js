const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

const app = express();
app.set('trust proxy', 1);

app.use(bodyParser.json());
app.use(cors({
  origin: 'https://playlist-migrator-tau.vercel.app',
  credentials: true,
}));

async function connectDb() {
  try {
    await mongoose.connect(process.env.mongoDbKey);
    console.debug("✅ DB connected");
  } catch (e) {
    console.error("❌ Cannot connect to the DB", e);
  }
}

connectDb();

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  'https://playlistmigrator.onrender.com/oauth2callback'
);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // ✅ Important for reverse proxies like Render
  store: MongoStore.create({
    mongoUrl: process.env.mongoDbKey,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24,
    stringify: false,
    autoRemove: 'native',
    crypto: {
      secret: process.env.SESSION_SECRET
    }
  }),
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

const migrateroute = require('./routes/migrate');
app.use('/api', migrateroute);

// === AUTH FLOW START ===

app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
  });
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log("✅ Received tokens from Google:", tokens);

    req.session.tokens = tokens;

    req.session.save((err) => {
      if (err) {
        console.error("❌ Error saving session:", err);
        return res.status(500).send("Session save failed");
      }

      console.log("✅ Session saved to MongoDB with ID:", req.session.id);
      res.send(`
        <html>
          <head>
            <script>
              setTimeout(() => {
                window.location.href = 'https://playlist-migrator-tau.vercel.app/migration';
              }, 2000);
            </script>
          </head>
          <body>
            Logging you in...
          </body>
        </html>
      `);
    });
  } catch (error) {
    console.error("❌ OAuth callback error:", error);
    res.status(500).send("OAuth failed");
  }
});

// === AUTH CHECK ===

app.get('/', (req, res) => {
  if (req.session.tokens) {
    res.send('Successfully authenticated with Google!');
  } else {
    res.send('Please authenticate first.');
  }
});

app.get('/check-auth', (req, res) => {
  console.log("📦 Session on /check-auth:", req.session);
  console.log("🔑 Session tokens:", req.session.tokens);

  if (req.session.tokens) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// === DEBUGGING ENDPOINT ===

app.get('/debug-session', (req, res) => {
  res.json({
    session: req.session,
    cookieHeader: req.headers.cookie,
    sessionId: req.sessionID,
  });
});

module.exports = oauth2Client;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
