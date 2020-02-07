const bcrypt = require('bcrypt');

module.exports = function(passport, account) {
  const Account = account;
  const LocalStrategy = require('passport-local').Strategy;

  passport.use(
    'local-signup',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
      },
      function(req, email, password, done) {
        Account.findOne({
          where: {
            email: email
          }
        }).then(async function(account) {
          if (account) {
            return done(null, false, {
              message: 'That email is already taken'
            });
          } else {
            const accountPassword = await promiseWrapper((resolve, reject) => {
              bcrypt.hash(password, 8, (err, hash) => {
                if (err) {
                  reject(err);
                }
                resolve(hash);
              });
            });

            const data = {
              email: email,
              password: accountPassword,
              firstname: req.body.firstname,
              lastname: req.body.lastname
            };

            Account.create(data).then(function(newAccount, created) {
              if (!newAccount) {
                return done(null, false);
              }

              if (newAccount) {
                return done(null, newAccount);
              }
            });
          }
        });
      }
    )
  );

  //LOCAL SIGNIN
  passport.use(
    'local-signin',
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
      },

      function(req, email, password, done) {
        var Account = account;

        const isValidPassword = async function(userpass, password) {
          return await promiseWrapper((resolve, reject) => {
            bcrypt.compare(password, userpass, (err, isMatch) => {
              if (err) {
                return reject(err);
              }

              if (!isMatch) {
                return reject(false);
              }

              resolve(true);
            });
          });
        };

        Account.findOne({
          where: {
            email: email
          }
        })
          .then(function(account) {
            if (!account) {
              return done(null, false, {
                message: 'Email does not exist'
              });
            }

            if (!isValidPassword(account.password, password)) {
              return done(null, false, {
                message: 'Incorrect password.'
              });
            }

            var accountinfo = account.get();
            return done(null, accountinfo);
          })
          .catch(function(err) {
            console.log('Error:', err);

            return done(null, false, {
              message: 'Something went wrong with your Signin'
            });
          });
      }
    )
  );

  //serialize
  passport.serializeUser(function(account, done) {
    done(null, account.id);
  });

  // deserialize user
  passport.deserializeUser(function(id, done) {
    Account.findByPk(id).then(function(account) {
      if (account) {
        done(null, account.get());
      } else {
        done(account.errors, null);
      }
    });
  });
};

const promiseWrapper = callback =>
  new Promise((resolve, reject) => {
    callback(resolve, reject);
  });
