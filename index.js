const express = require('express');
const app = express();

const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const fs = require('fs');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

const {check, validationResult} = require('express-validator');

path = require('path');


app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect('mongodb://localhost:27017/[myFlixDB]', { useNewUrlParser: true, useUnifiedTopology: true });

const cors = require ('cors');
let allowedOrigins = ['*'];
app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback (null, true);
    if(allowedOrigins.indexOf(origin) === -1){//if a specific origin isn't found on the list of allowed origins
    let message = 'The CORS policy for this application doesnt allow access from origin' + origin;
  return callback(new Error(message), false);
}
return callback(null, true);
  }
}));

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');
app.use(morgan('common'));
app.use(express.static('public'));


//Gets data on ALL movies
app.get('/', (req, res) => {
  // res.send('Welcome to my app!');
  // responseText += '<small>Requested at: ' + req.requestTime + '</small>';
  let responseText = "Welcome to myFlix app!";
  res.send(responseText);
});

//Gets data on ALL movies
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});
//Gets data about single movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false}), (req, res) => {

 Movies.findOne({Title: req.params.title})

  .then((movie) => {
    res.status(200).json(movie);
  } )
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});

// READ genre by name
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false}), (req, res) => {
  const { genreName } =  req.params;
  const genre = Movies.find(movie => movie.Genre.Name === genreName).Genre; // the the .Genre will enable it return just the genre object

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send("no such genre")
  }
})

//get data about a director by name (bio, birth year, death yr)
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false}),(req, res) => {
  const { directorName } =  req.params;
  const director = Movies.find(movie => movie.Director.Name === directorName).Director; // the the .Genre will enable it return just the genre object

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send("no such director")
  }
})

//allow new users to register
app.post('/users',
//Validation logic here for request
//you can either use a chain of methods like .not().isEmpty()
//which means "opposite of isEmpty" in plain english "is not empty"
//or use .islength({min: 5}) which means
//minimum value of 5 characters are only allowed
[
check('Username', 'Username is required').isLength({min: 5}),
check('Username', 'Username contains non alphanumeric charcters - not allowed.').isAlphanumeric(),
check('Password','Password is required').not().isEmpty(),
check('Email', 'Email does not appear to be valid').isEmail()
],
(req, res) => {
//check the validation object for errors
let errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(422).json({errors: errors.array() });
}

  let hashedPassword = Users.hashPassword(req.body.Password);
  Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
    .then((user) => {
      if (user) {
      //If the user is found, send a response that it already exists
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) => { res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

//allow user to update info (username)
app.put('/users/:name/:username', passport.authenticate('jwt', { session: false}), (req, res) => {
  let user = Users.find((user) => {return user.name === req.params.name });

  if (user) {
    res.status(201).send('User with the name' + req.params.name + 'changed username to' + req.params.username);
  } else {
    res.status(404).send('User with the name' + req.params.name + 'was not found.');
  }
});
//allow users to ADD a movie to their list of favorites(showing text that move has been added)
app.post('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false}), (req, res) => {
	Users.findOneAndUpdate({Username:req.params.username}, {
    $push: {favoriteMovies: req.params.movieID}
  },
  {new: true}, //This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    }else {
      res.json(updatedUser);
    }
    });
  });
  
//allow users to DELETE a movie from their list of favorites (showing text)
app.delete('/users/:username/:movieID',passport.authenticate('jwt', { session: false}), (req, res) => {
	Users.findOneAndUpdate(
    { Username: req.params.username },
    {
        $pull: { FavoriteMovies: req.params.movieID },
    },
    { new: true },
    (err, updatedUser) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error ' + err);
        } else {
            res.json(updatedUser);
        }
    }
);
}
);

//get all users
app.get('/users',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
      Users.find()
          .then((users) => {
              res.status(201).json(users);
          })
          .catch((err) => {
              console.log(err);
              res.status(500).send('Error: ' + err);
          });
  }
);

 //allow existing users to deregister(text that user email has been removed)
 app.delete('/users/:name', (req, res) => {
	const { name } = req.params;

	let user = Users.find((user) => user.name == name);

	if (user) {
		res.status(200).send(`User has been removed from the database`);
	} else {
		res.status(400).send('User not found');
	}
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
  console.log('Listening on Port ' + port);
});

