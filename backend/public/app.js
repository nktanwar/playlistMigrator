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
async function  migratePlaylist() {
    // Get the playlist URL from the input field
    const playlistUrl = document.getElementById('playlistInput').value.trim();
    console.log(playlistUrl);

    try{
        const response = await fetch('http://localhost:3000/api/spotifyData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playlistUrl })
        })
        console.log("Response from backend",response);
        if(!response.ok){
            const errorData = await response.json();
            console.log("Error in response",errorData);
            alert("Error in migrating playlist: " + errorData.error);
            return;
        }
        else{
            const data = await response.json();
            console.log("Data from backend",data.migratedPlaylistUrl);
            alert("Playlist migrated successfully! .");

            const link  = document.createElement('a');
            link.href = data.migratedPlaylistUrl;
            link.target = '_blank';
            link.textContent = "Go To Your Youtube Playlist";
            document.querySelector('.resultantUrl').append(link);
            
            

        }
        
    

    }catch(err){
        console.log("Error in fetching data from backend",err);
        alert("something went wrong while fetching data from backend");
    }
   
}
