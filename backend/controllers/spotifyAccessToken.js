const axios = require('axios');
const qs = require('qs');


const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
 
// console.log(client_id, client_secret);
const data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: client_id,
    client_secret: client_secret
  });


// console.log('DATA',data);


async function getSpotifyAccessToken() {
  try{
    const response = await axios.post('https://accounts.spotify.com/api/token',data,{
      headers:{
        "Content-Type": "application/x-www-form-urlencoded"
      }
        
    })
    // console.log(response.data.access_token);
    return response.data.access_token;

  }
  catch(err){
    console.log("something fucked up ",err);

  }
    

}

module.exports = getSpotifyAccessToken;



