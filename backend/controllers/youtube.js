const axios = require('axios');
const { google } = require('googleapis');

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

async function CreatePlaylist(oauth2Client) {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    try {
        const response = await youtube.playlists.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: 'Migrated Playlist',
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
