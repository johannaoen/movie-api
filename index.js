const express = require('express');
const app = express();

const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const fs = require('fs');
const Models = require('./models.js');

path = require('path');


app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//const cors = require ('cors');
//let allowedOrigins = ['*'];
//app.use(cors({
  //origin: (origin, callback) => {
   // if(!origin) return callback (null, true);
   // if(allowedOrigins.indexOf(origin) === -1){//if a specific origin isn't found on the list of allowed origins
   // let message = 'The CORS policy for this application doesnt allow access from origin' + origin;
 // return callback(new Error(message), false);
//}
//return callback(null, true);
//  }
//}));

require('./auth')(app);

const passport = require('passport');
require('./passport');
app.use(morgan('common'));
app.use(express.static('public'));


let users = [
  {
    id: 1,
    name: 'Johanna',
    username: 'johanna123',
    password: '1234',
    favoriteMovies: ['Frozen']
  },
  {
    id: 2,
    name: 'Bob',
    username : 'Bob2', 
    password: '12345',
    favoriteMovies: ['Harry Potter 1']
  },
]

let movies = [
  {
    "Title": "Harry Potter 1",
    "Description": "Yer a wizard Harry.",
    "Genre": {
      "Name": "Adventure",
      "Description": "In film and television, adventure is a category of a narrative fiction or semi-fiction"
    },
    "Director": {
      "Name": "J.K. Rowling",
      "Bio" : "J.K Rowling Biography, Height, Weight, Age, Measurements, Net Worth, Family, Wiki & much more! .",
      "Birth" : 1995,
    },
    "ImageUrl" : "jkrowling.jpg",
    "Featured" : false
  },

  {
    "Title": "Harry Potter 2",
    "Description": "Yer a wizard Harry.",
    "Genre": {
      "Name": "Adventure",
      "Description": "In film and television, adventure is a category of a narrative fiction or semi-fiction"
    },
    "Director": {
      "Name": "J.K. Rowling",
      "Bio" : "J.K Rowling Biography, Height, Weight, Age, Measurements, Net Worth, Family, Wiki & much more! .",
      "Birth" : 1995,
    },
    "ImageUrl" : "jkrowling.jpg",
    "Featured" : false
  },

  {
    "Title": "Frozen",
    "Description": "Ana and Elsa lose both of their parents in a tragic shipwreck are now tasked with ruling over the kingdom of Arendelle. However, they must navigate Elsa's destructive ice powers together.",
    "Genre": {
      "Name": "Family",
      "Description": "In film and television, Family is a category of a narrative fiction or semi-fiction suitable for family and kids."
    },
    "Director": {
      "Name": "John Doe",
      "Bio" : "John Doe is an American writer, director and producer of film and television. He is best known for creating the movie series Frozen 1 and Frozen 2.",
      "Birth" : 1961,
    },
    "ImageUrl" : "frozen.png",
    "Featured" : false
  }
];



app.get('/', (req, res) => {
  // res.send('Welcome to my app!');
  // responseText += '<small>Requested at: ' + req.requestTime + '</small>';
  let responseText = "Welcome to myFlix app!";
  res.send(responseText);
});
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
//allow new users to register
app.post('/users', (req, res) => {
let newUser = req.body; //this is possible due to the body parser
if (newUser.username){
 newUser.id = uuid.v4(); //uuid.v4() generates unique id
  users.push(newUser);
  res.status(201).json(newUser);
}else {
 res.status(400).send('New user requires username');
}
});

//app.post('/users', (req,res) => {
 // let hashedPassword = Users.hashPassword(req.body.Password);
 // Users.findOne({Username: req.body.Username}) //Search to see if a user with the requested username already exists
 // .then((user) => {
  //  if(user) {
      //If the user is found, send a response that it already exists
     // return res.status(400).send(req.body.Username + 'already exists');
    //}else{
     // Users
      //.create({
       // Username: req.body.Username. 
       // Password: 
      //})
    //}
   //}
 // })
//})


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