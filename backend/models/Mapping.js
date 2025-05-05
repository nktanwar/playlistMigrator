const mongoose = require('mongoose');

const IdSchema = new mongoose.Schema({
    spotifyId:{type:String},
    youtubeId:{type:String},
})


const Mapping= mongoose.model('Mapping',IdSchema);

module.exports = Mapping;