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
app.get('/movies/:title', (req, res) => {
  const {title} =  req.params;
  const movie = movies.find(movie => movie.Title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send("no such movie")
  }
})

// READ genre by name
app.get('/movies/genre/:genreName', (req, res) => {
  const { genreName } =  req.params;
  const genre = movies.find(movie => movie.Genre.Name === genreName).Genre; // the the .Genre will enable it return just the genre object

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send("no such genre")
  }
})

//get data about a director by name (bio, birth year, death yr)
app.get('/movies/director/:directorName', (req, res) => {
  const { directorName } =  req.params;
  const director = movies.find(movie => movie.Director.Name === directorName).Director; // the the .Genre will enable it return just the genre object

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send("no such director")
  }
})
app.get('/users', (req, res) => {
  Users.find()
  .then((users) => {
    res.status(201).json(users);
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
})

//allow new users to register
app.post('/users', (req, res) => {
  // let hashedPassword = Users.hashPassword(req.body.Password);
  Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
    .then((user) => {
      if (user) {
      // If the user is found, send a response that it already exists
       return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users
          .create({
           Username: req.body.Username,
            Password: req.body.Password,
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


//app.post('/users'
//Validation logic here for request
//you can either use a chain of methods like not().Empty()
//which means "opposite of isEmpty" in plain english "is not empty"
//or use .isLength({min:5}) which means
//minimum value of 5 characters are only allowed
//[
  //check('Username', 'Username is required').isLength({min: 5}),
  //check('Username', 'Username contains non alphanumeric characters -not allowed.').isAlphanumeric,
  //check('Password', 'Password is required').not().isEmpty()
//], (req, res) => {
//check the validation object for errors
//let errors = validationResult(req);

//if (!errors.isEmpty()) {
  //return res.status(422).json({errors:errors.array() });
//}

  //let hashedPassword = Users.hashPassword(req.body.Password);
  //Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
    //.then((user) => {
      //if (user) {
      //If the user is found, send a response that it already exists
       // return res.status(400).send(req.body.Username + ' already exists');
      //} else {
        //Users
          //.create({
           // Username: req.body.Username,
            //Password: hashedPassword,
            //Email: req.body.Email,
           // Birthday: req.body.Birthday
          //})
          //.then((user) => { res.status(201).json(user) })
         //.catch((error) => {
           // console.error(error);
           // res.status(500).send('Error: ' + error);
          //});
      //}
    //})
    //.catch((error) => {
     // console.error(error);
     // res.status(500).send('Error: ' + error);
    //});
//});


//allow user to update info (username)
app.put('/users/:name/:username', (req, res) => {
  let user = users.find((user) => {return user.name === req.params.name });

  if (user) {
    res.status(201).send('User with the name' + req.params.name + 'changed username to' + req.params.username);
  } else {
    res.status(404).send('User with the name' + req.params.name + 'was not found.');
  }
});
//allow users to ADD a movie to their list of favorites(showing text that move has been added)
app.post('/users/:name/:movieTitle', (req, res) => {
	const { name, movieTitle } = req.params;

	let user = users.find((user) => user.name == name);

	if (user) {
		user.favoriteMovies.push(movieTitle);
		res.status(200).send(
			`Movie has been added to user array`
		);
	} else {
		res.status(400).send('User not found');
	}
});

//allow users to DELETE a movie from their list of favorites (showing text)
app.delete('/users/:name/:movieTitle', (req, res) => {
	const { name, movieTitle } = req.params;

	let user = users.find((user) => user.name == name);

	if (user) {
		user.favoriteMovies = user.favoriteMovies.filter(
			(title) => title !== movieTitle
		);
		res.status(200).send(
			`Movie has been removed from user array`
		);
	} else {
		res.status(400).send('User not found');
	}
});

 //allow existing users to deregister(text that user email has been removed)
 app.delete('/users/:name', (req, res) => {
	const { name } = req.params;

	let user = users.find((user) => user.name == name);

	if (user) {
		res.status(200).send(`User has been removed from the database`);
	} else {
		res.status(400).send('User not found');
	}
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
}); 