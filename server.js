const express = require('express');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');

const exphbs = require('express-handlebars');
const flash = require('connect-flash');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true })); // session secret
app.use(flash());
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

//For Handlebars
app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('views', './app/views');
app.set('view engine', '.hbs');

app.get('/', function(req, res) {
  res.send('Welcome to Passport with Sequelize');
});

//Models
const models = require('./app/models');
const setStrategies = require('./app/config/passport/passport.js');
const setAuthRoutes = require('./app/routes/auth.js');

//Load passport strategies
setStrategies(passport, models);

//Routes
setAuthRoutes(app, passport);

//Sync Database
models.sequelize
  .sync()
  .then(function() {
    console.log('Nice! Database looks fine');
  })
  .catch(function(err) {
    console.log(err, 'Something went wrong with the Database Update!');
  });

app.listen(5000, function(err) {
  if (!err) {
    console.log('Site is live');
  } else {
    console.log(err);
  }
});
