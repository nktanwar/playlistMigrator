// Check if the user is authenticated
function checkAuthStatus() {
    fetch('/check-auth')
  .then(res => res.json())
  .then(data => {
    if (data.authenticated) {
      document.getElementById('status').innerHTML = "You are logged in!";
      document.getElementById('loginBtn').style.display = 'none';
      const migrateButton = document.createElement('button');
      migrateButton.textContent = 'Migrate Playlist';
      migrateButton.onclick = migratePlaylist;
      document.querySelector('.container').appendChild(migrateButton);
    } else {
      document.getElementById('status').innerHTML = "Please log in to continue.";
    }
  });

}

// Handle the tokens from URL and store them
function handleTokensFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokens = urlParams.get('tokens');
    if (tokens) {
        // Store tokens in localStorage
        localStorage.setItem('tokens', tokens);
        // Redirect to the main page after saving tokens
        window.location.href = 'http://localhost:3001';
    }
}

// If tokens exist in the URL, handle them
if (window.location.search.includes('tokens=')) {
    handleTokensFromURL();
} else {
    checkAuthStatus();
}

// Trigger the Google OAuth flow by redirecting to the backend /auth route
document.getElementById('loginBtn').addEventListener('click', function () {
    window.location.href = 'http://localhost:3000/auth';
});

// Call the backend to migrate playlist
function migratePlaylist() {
    // const playlistUrl = "https://open.spotify.com/playlist/42GYU1S2TAGsG2ArZNkKgq?si=YdN-iUfvS1qivDHf6DRR4g&pi=v8Kexa1cR6uTM";
    const playlistUrl = document.getElementById('playlistInput').value.trim();
    console.log(playlistUrl);

    fetch('http://localhost:3000/api/spotifyData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playlistUrl })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Playlist Migration Successful:', data);
        alert('Playlist migration was successful!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while migrating the playlist.');
    });
}
