const express = require('express');
const router = express.Router();
const { extractSpotifyPlaylist } = require('../controllers/spotify');
const { searchYoutube, CreatePlaylist, insertToPlaylist } = require('../controllers/youtube');
const { google } = require('googleapis');
const Mapping = require('../models/Mapping')


let PlaylistName ="";
router.post('/spotifyData', async (req, res) => {
    const { playlistUrl } = req.body;
    if (!playlistUrl) {
        return res.status(400).json({ error: 'playlistUrl is required' });
    }

    try {
        console.log("Received playlist URL:", playlistUrl);

        // Extract the playlist ID from the URL and fetch the playlist data
        // extractSpotifyPlaylist is a function that fetches the playlist data from Spotify API
        // It is defined in the controllers/spotify.js file
        const Playlist = await extractSpotifyPlaylist(playlistUrl);
        PlaylistName = Playlist.name;
        // https://open.spotify.com/track/3BJe4B8zGnqEdQPMvfVjuS?si=47d360d55ea94322
        // https://open.spotify.com/track/3BJe4B8zGnqEdQPMvfVjuS?si=ac2865bf67d74fa9
        
        // extracting the tracks from the playlist data
        const TracksArray = Playlist.tracks.items;
        const tracksInfo = TracksArray.map(obj => {
            const trackId = obj.track.id;
            const trackName = obj.track.name;
            const artists = obj.track.artists.map(artist => artist.name);
            return {
                name: trackName,
                artists: artists,
                Id:trackId,
                
            };
        });

        let ytVideosId = [];

        for(const obj of tracksInfo){
            let searchString = obj.name + '+' + obj.artists.join('+');
            // for(const artist of obj.artists){
            //     searchString+='+' + artist;
            // }
           
            try {
                // Search for the video on YouTube using the searchYoutube function 
                // It is defined in the controllers/youtube.js file
                // The searchYoutube function takes a search string and returns the video ID
                
                    const mapping = await Mapping.findOne({spotifyId:obj.Id});
                    if(!mapping){
                        const ytResponseData = await searchYoutube(searchString);
                        ytVideosId.push(ytResponseData);
                        
                            const newMapping = new Mapping({
                                spotifyId:obj.Id,
                                youtubeId:ytResponseData,
                            })
                            await newMapping.save();
                            console.log("saved success");
                    }
                    else{
                        ytVideosId.push(mapping.youtubeId);
                    }
                
                
            } catch (err) {
                console.error("YouTube search failed:", searchString, err.message);
                ytVideosId.push({ error: `Failed to find YouTube video for track "${obj.name}"` });
            }
        }

       
        if (!req.session.tokens || !req.session.tokens.access_token) {
            return res.status(401).json({ error: 'User not authenticated with Google' });
        }


        // Create an OAuth2 client with the user's tokens
        // The tokens are stored in the session after the user authenticates with Google
        // The OAuth2 client is used to make requests to the YouTube API
        // The OAuth2 client is created using the client ID and client secret from the environment variables
        // The redirect URL is the same as the one used during authentication
        // The client ID and client secret are stored in the environment variables
        // The redirect URL is the same as the one used during authentication
        
        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            'http://localhost:3000/oauth2callback'
        );

        // Set the credentials for the OAuth2 client using the tokens stored in the session
        // The tokens are used to authenticate the requests to the YouTube API
        oauth2Client.setCredentials(req.session.tokens);


        // create a new YouTube playlist using the CreatePlaylist function
        // The CreatePlaylist function takes the OAuth2 client as an argument and returns the playlist ID           
        const playlistId = await CreatePlaylist(oauth2Client,PlaylistName);
        let insertResponse = [];
        let failed =[];

        const getVideoNameFromId = (id)=>{
            for(const obj of tracksInfo){
                if(obj.Id == id){
                    return obj.name;
                }
            }
            return "Err";

        }

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
                const mapping = await Mapping.findOne({youtubeId:id});
                let videoName = getVideoNameFromId(mapping.spotifyId); 
                failed.push( videoName );
                
            }
        }

        const migratedPlaylistUrl = `https://music.youtube.com/playlist?list=${playlistId}`;
        console.log("Playlist migration done here is the url: ", migratedPlaylistUrl)
        res.json({ migratedPlaylistUrl,failed });

    } catch (err) {
        // console.error("Spotify to YouTube migration failed:", err);
        console.log(err);
        res.status(500).json({error: "Invalid URL"});
    }
});



router.post('/spotifyData/public', async (req, res) => {
    const { playlistUrl } = req.body;
    if (!playlistUrl) {
        return res.status(400).json({ error: 'playlistUrl is required' });
    }

    try {
        console.log("Received playlist URL (public):", playlistUrl);

        const Playlist = await extractSpotifyPlaylist(playlistUrl);
        PlaylistName = Playlist.name;

        const TracksArray = Playlist.tracks.items;
        const tracksInfo = TracksArray.map(obj => ({
            name: obj.track.name,
            artists: obj.track.artists.map(artist => artist.name),
            Id: obj.track.id,
        }));

        let ytVideosId = [];

        for (const obj of tracksInfo) {
            let searchString = obj.name + '+' + obj.artists.join('+');
            const mapping = await Mapping.findOne({ spotifyId: obj.Id });

            if (!mapping) {
                const ytResponseData = await searchYoutube(searchString);
                ytVideosId.push(ytResponseData);

                await new Mapping({
                    spotifyId: obj.Id,
                    youtubeId: ytResponseData,
                }).save();
                console.log("Saved id", { spotifyId: obj.Id, youtubeId: ytResponseData });
            } else {
                ytVideosId.push(mapping.youtubeId);
            }
        }

        // Use YOUR OWN OAuth2 tokens (not user's)
        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            'http://localhost:3000/oauth2callback'
        );

        oauth2Client.setCredentials({
            access_token: process.env.MY_YT_ACCESS_TOKEN,
            refresh_token: process.env.MY_YT_REFRESH_TOKEN,
        });

        const playlistId = await CreatePlaylist(oauth2Client, PlaylistName);
        let insertResponse = [];
        let failed =[];

        const getVideoNameFromId = (id)=>{
            for(const obj of tracksInfo){
                if(obj.Id == id){
                    return obj.name;
                }
            }
            return "Err";

        }

        for (const id of ytVideosId) {
            if (id.error) {
                console.error(id.error);
                return res.status(500).json({ error: id.error });
            }

            try {
                await insertToPlaylist(oauth2Client, id, playlistId);
                insertResponse.push({ success: true, videoId: id });
            } catch (err) {
                console.error(`Failed to insert video ${id}:`, err.message);
                const mapping = await Mapping.findOne({youtubeId:id});
                let videoName = getVideoNameFromId(mapping.spotifyId); 
                failed.push( videoName );
            }
        }

        const migratedPlaylistUrl = `https://music.youtube.com/playlist?list=${playlistId}`;
        console.log("Public playlist migration done: ", migratedPlaylistUrl);
        res.json({ migratedPlaylistUrl,failed, note: "This playlist was saved in the app's YouTube account. You can copy it to your own later." });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Something went wrong with public playlist migration." });
    }
});





module.exports = router;
