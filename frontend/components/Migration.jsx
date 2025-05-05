import React, { useEffect, useState } from 'react';

export default function PlaylistMigrator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [note, setNote] = useState('');
  const [failed, setFailed] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokens = urlParams.get('tokens');

    if (tokens) {
      localStorage.setItem('tokens', tokens);
      window.location.href = 'https://playlistmigrator.onrender.com';
    } else {
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('https://playlistmigrator.onrender.com/check-auth', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setStatusMessage('You are logged in! Your playlist will be added to your YouTube account.');
      } else {
        setStatusMessage('Not logged in. The playlist will be created using our account and a link will be provided.');
      }
    } catch (err) {
      console.log('Error checking auth status:', err);
      setStatusMessage('Error checking auth.');
    }
  };

  const migratePlaylist = async () => {
    setResultUrl('');
    setNote('');
    if (!playlistUrl.trim()) return alert('Please enter a valid playlist URL');

    const endpoint = isAuthenticated
      ? 'https://playlistmigrator.onrender.com/api/spotifyData'
      : 'https://playlistmigrator.onrender.com/api/spotifyData/public';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistUrl }),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert('Error: ' + errorData.error);
        return;
      }

      const data = await res.json();
      setResultUrl(data.migratedPlaylistUrl);
      setFailed(data.failed);
      setNote(data.note || '');
      alert('Playlist migration complete!');
    } catch (err) {
      console.error('Error migrating playlist:', err);
      alert('Something went wrong.');
    }
  };

  const redirectToLogin = () => {
    window.location.href = 'https://playlistmigrator.onrender.com/auth';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-black text-white">
      <div className="bg-black bg-opacity-70 p-8 rounded-2xl shadow-lg w-full max-w-lg text-center">
        <h1 className="text-3xl font-extrabold mb-4">Welcome to Playlist Migrator</h1>
        <p className="text-lg mb-2 text-gray-300">Migrate your Spotify playlists to YouTube Music</p>
        <p className="text-sm text-gray-400 mb-4">
          Want the playlist saved directly to your YouTube account? Log in with Google below. If you skip login, it will be created using our account and a link will be provided.
        </p>

        {!isAuthenticated && (
          <button
            onClick={redirectToLogin}
            className="bg-gradient-to-r from-green-600 to-green-800 hover:bg-green-700 px-6 py-3 rounded-lg text-white mb-6 transition-transform transform hover:scale-105"
          >
            Login with Google
          </button>
        )}

        <label htmlFor="playlistInput" className="block text-left mb-2 text-gray-400">
          Paste Spotify Playlist Link
        </label>
        <input
          type="text"
          id="playlistInput"
          placeholder="Paste Spotify playlist URL here"
          className="w-full p-4 mb-6 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 text-white"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
        />

        <button
          onClick={migratePlaylist}
          className="bg-gradient-to-r from-green-600 to-green-800 hover:bg-green-700 px-6 py-3 rounded-lg text-white mb-6 transition-transform transform hover:scale-105"
        >
          Migrate Playlist
        </button>

        <div id="status" className="mt-2 text-green-400 text-sm">
          {statusMessage}
        </div>

        {resultUrl && (
          <div className="mt-6">
            <a
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 underline text-lg"
            >
              Go To Your YouTube Playlist
            </a>
            {note && (
              <p className="text-sm text-gray-400 mt-2">{note}</p>
            )}

            {failed.length > 0 && (
              <div className="mt-4 text-left">
                <h3 className="text-red-400 text-md font-semibold mb-2">Failed to Migrate:</h3>
                <ul className="list-disc list-inside text-sm text-gray-300 max-h-40 overflow-y-auto">
                  {failed.map((song, index) => (
                    <li key={index}>{song}</li>
                  ))}
                </ul>
              </div>
            )}






          </div>
        )}
      </div>
    </div>
  );
}
