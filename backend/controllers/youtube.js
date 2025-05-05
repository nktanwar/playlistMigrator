const axios = require('axios');
const { google } = require('googleapis');


// Function to search for a YouTube video using the YouTube Data API
// It takes a search string as input and returns the video ID of the first result
async function searchYoutube(trackInfoString) {
    try {
        const apikey = process.env.YOUTUBE_API_KEY;
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: trackInfoString,
                type: 'video',
                key: apikey,
            }
        });

        if (response.data.items.length === 0) {
            throw new Error(`No video found for the track: ${trackInfoString}`);
        }

        return response.data.items[0].id.videoId;
    } catch (err) {
        console.error("YouTube search error:", err.response?.data || err.message);
        throw new Error(`YouTube search failed for "${trackInfoString}": ${err.message}`);
    }
}


// Function to create a new YouTube playlist using the YouTube Data API
// It takes an OAuth2 client as input and returns the playlist ID of the created playlist
// The OAuth2 client is used to authenticate the requests to the YouTube API
// The OAuth2 client is created using the client ID and client secret from the environment variables
// The redirect URL is the same as the one used during authentication
async function CreatePlaylist(oauth2Client,title) {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    try {
        const response = await youtube.playlists.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: title,//will be changed to the name of the Spotify playlist
                    description: 'Created via Spotify to YouTube migration tool',
                },
                status: {
                    privacyStatus: 'public',
                },
            },
        });

        return response.data.id;
    } catch (err) {
        console.error("Error creating YouTube playlist:", err.response?.data || err.message);
        throw new Error('Failed to create YouTube playlist');
    }
}



// Function to insert a video into a YouTube playlist using the YouTube Data API
// It takes an OAuth2 client, video ID, and playlist ID as input
// It returns the response data from the API call
// The OAuth2 client is used to authenticate the requests to the YouTube API
async function insertToPlaylist(oauth2Client, videoId, playlistId) {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    try {
        const response = await youtube.playlistItems.insert({
            part: ['snippet'],
            requestBody: {
                snippet: {
                    playlistId,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId,
                    },
                    position: 0
                }
            }
        });

        console.log(`Inserted video ${videoId} into playlist ${playlistId}`);
        return response.data;
    } catch (err) {
        console.error("Error inserting video into playlist:", err.response?.data || err.message);
        throw new Error(`Failed to insert video ID ${videoId} into playlist`);
    }
}

module.exports = {
    searchYoutube,
    CreatePlaylist,
    insertToPlaylist
};
