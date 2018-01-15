// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var weightSchema = mongoose.Schema({

        email   : String,
        date    : { type: Date, default: Date.now },
        weight  : Number

});


// create the model for users and expose it to our app
module.exports = mongoose.model('Weight', weightSchema);
