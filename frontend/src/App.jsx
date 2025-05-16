import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Migration from '../components/Migration';
import Policy from "../components/Policy";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-purple-600 to-blue-900 text-white px-4 py-12">
              <h1 className="text-4xl font-bold mb-4 text-center">Welcome to Playlist Migrator</h1>
              <p className="text-lg mb-8 text-center max-w-xl">
                Seamlessly transfer your playlists between Spotify and YouTube Music. Choose a direction to get started!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 w-full max-w-4xl">
                {/* Spotify to YouTube Card */}
                <div className="bg-gradient-to-r from-green-500 to-green-700 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-between text-white hover:scale-105 transform transition">
                  <h2 className="text-2xl font-semibold mb-2">Spotify → YouTube</h2>
                  <p className="mb-4 text-center">Move your favorite Spotify playlists to YouTube Music in just a few clicks.</p>
                  <Link to="/migration">
                    <button className="bg-white text-green-700 font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition">
                      Start Migration
                    </button>
                  </Link>
                </div>

                {/* YouTube to Spotify Card */}
                <div className="bg-gradient-to-r from-red-500 to-yellow-500 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-between text-white hover:scale-105 transform transition">
                  <h2 className="text-2xl font-semibold mb-2">YouTube → Spotify</h2>
                  <p className="mb-4 text-center">Coming soon! Transfer YouTube Music playlists to Spotify.</p>
                  <button className="bg-white text-red-600 font-semibold px-6 py-2 rounded-lg opacity-60 cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </div>

              {/* Info Card for Limited API and Developer Info */}
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-6 rounded-2xl shadow-lg mt-8 w-full max-w-4xl text-center text-white">
                <h2 className="text-xl font-semibold mb-2">API Limitations & Developer Info</h2>
                <p className="mb-4 text-center">Due to API limitations, migrating large numbers of playlists may take time. We're actively working on improving the experience.</p>
                <div className="text-sm">
                  <p>For any inquiries, contact the developer:</p>
                  <div className="flex justify-center gap-4 mt-2">
                    <a href="tester.debug003@gmail.com" className="text-white hover:underline">Email</a>
                    <a href="https://github.com/nktanwar" target="_blank" className="text-white hover:underline">GitHub</a>
                    <a href="https://www.linkedin.com/in/pankaj-rana-507078253/" target="_blank" className="text-white hover:underline">LinkedIn</a>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-sm text-white">
                <Link to="/policy" className="underline hover:text-gray-200">Privacy Policy</Link>
              </div>


            </div>
          }
        />
        <Route path="/migration" element={<Migration />} />
        <Route path="/policy" element={<Policy />} />
      </Routes>
    </Router>
  );
}

export default App;
