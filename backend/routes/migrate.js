const express = require('express');
const router = express.Router();
const { extractSpotifyPlaylist } = require('../controllers/spotify');
const { searchYoutube, CreatePlaylist, insertToPlaylist } = require('../controllers/youtube');
const { google } = require('googleapis');

router.post('/spotifyData', async (req, res) => {
    const { playlistUrl } = req.body;
    if (!playlistUrl) {
        return res.status(400).json({ error: 'playlistUrl is required' });
    }

    try {
        console.log("Received playlist URL:", playlistUrl);
        const Playlist = await extractSpotifyPlaylist(playlistUrl);

        const TracksArray = Playlist.tracks.items;
        const tracksInfo = TracksArray.map(obj => {
            const trackName = obj.track.name;
            const artists = obj.track.artists.map(artist => artist.name).join(',');
            return {
                name: trackName,
                artists: artists
            };
        });

        let ytVideosId = [];

        for(const obj of tracksInfo){
            let searchString = obj.name;
           
            try {
                const ytResponseData = await searchYoutube(searchString);
                ytVideosId.push(ytResponseData);
            } catch (err) {
                console.error("YouTube search failed:", searchString, err.message);
                ytVideosId.push({ error: `Failed to find YouTube video for track "${obj.name}"` });
            }
        }


        // let ytVideosId = await Promise.all(tracksInfo.map(async (obj) => {
        //     let searchString = obj.name;
        //     const artists = obj.artists.split(',');
        //     for (let i = 0; i < artists.length; i++) {
        //         searchString += ` | ${artists[i]}`;
        //     }

        //     try {
        //         const ytResponseData = await searchYoutube(searchString);
        //         return ytResponseData;
        //     } catch (err) {
        //         console.error("YouTube search failed:", searchString, err.message);
        //         return { error: `Failed to find YouTube video for track "${obj.name}"` };
        //     }
        // }));


       
        if (!req.session.tokens || !req.session.tokens.access_token) {
            return res.status(401).json({ error: 'User not authenticated with Google' });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            'http://localhost:3000/oauth2callback'
        );
        oauth2Client.setCredentials(req.session.tokens);

        const playlistId = await CreatePlaylist(oauth2Client);

       
        // const insertResponse = await Promise.all(ytVideosId.map(async (id) => {
        //     if (id.error) return id;

        //     try {
        //         const result = await insertToPlaylist(oauth2Client, id, playlistId);
        //         return { success: true, videoId: id };
        //     } catch (err) {
        //         console.error(`Failed to insert video ${id}:`, err.message);
        //         return { error: `Failed to insert video ID ${id} into playlist` };
        //     }
        // }));



        let insertResponse = [];

        for(const id of ytVideosId){
            if(id.error){
                console.error(id.error);
                return res.status(500).json({ error: id.error });
            }
            try{
                const result = await insertToPlaylist(oauth2Client, id, playlistId);
                insertResponse.push({ success: true, videoId: id });
            }
            catch(err){
                console.error(`Failed to insert video ${id}:`, err.message);
                insertResponse.push({ error: `Failed to insert video ID ${id} into playlist` });
            }
        }





        res.json({ tracksInfo, playlistId, insertResponse });

    } catch (err) {
        console.error("Spotify to YouTube migration failed:", err);
        res.status(500).json({ error: 'Something went wrong while processing the request' });
    }
});

module.exports = router;
