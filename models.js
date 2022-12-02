const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

let movieSchema = mongoose.Schema({
  Title: {type: String, required: true},
  Description: {type: String, required: true},
  Genre: {
    Name: String,
    Description: String
  },
  Director: {
    Name: String,
    Bio: String
  },
  Actors: [String],
  ImagePath: String,
  Featured: Boolean
});

let userSchema = mongoose.Schema({
  username: {type: String, required: true},
  password: {type: String, required: true},
  email: {type: String, required: true},
  birthday: Date,
  favoriteMovies: [{type: mongoose.Schema.Types.ObjectId, ref:'Movie'}]
});

//userSchema.statics.hashPassword = (password) => {
 // return bcrypt.hashSync(password, 10);
 // };
 // userSchema.methods.validatePassword = function(password) {
    //return bcrypt.compareSync(password, this.Password);
  //};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;