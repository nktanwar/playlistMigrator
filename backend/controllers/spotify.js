const getSpotifyAccessToken = require("./spotifyAccessToken");
const axios = require('axios')


// extractSpotifyPlaylist is a function that fetches the playlist data from Spotify API
async function extractSpotifyPlaylist (url){
    const accessToken = await getSpotifyAccessToken(); 
    const playlistId = extractPlaylistId(url);
    if(!playlistId){
        throw new Error ("Invalid playlist URL"); // Return Error response if playlist ID is invalid
    }
    else{
        try{
            
            const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`,{
                headers:{
                    Authorization:`Bearer ${accessToken}`
                }
            });
                console.log(response.status);
                if(response.status !== 200){    
                    throw new Error("Failed to fetch playlist"); // Return Error response if fetching fails
                }
                const playlistData = response.data; 
                // console.debug("Playlist data:", playlistData); // Log the fetched playlist data
                return playlistData;

        }
        catch(err){
            throw new Error(err);
        }
        
    }

   

}


// extractPlaylistId is a function that extracts the playlist ID from the Spotify URL
function extractPlaylistId(url){
    const regex = /playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    if(!match){
        console.log("Invalid playlist URL:", url); // Log the invalid URL if extraction fails
        return null;
    }
    else{
        // console.debug("match look like",match);
        // console.debug("Extracted Playlist ID:", match[1]); // Log the extracted playlist ID
        return match[1];
    }

}

module.exports = {extractSpotifyPlaylist}

