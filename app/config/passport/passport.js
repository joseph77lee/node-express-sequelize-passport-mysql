require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto-random-string');
const nodemailer = require('nodemailer');

module.exports = function(passport, models) {
  const Account = models.account;
  const VerificationToken = models.verificationToken;
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
            try {
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
                  return done(null, false, {
                    message: 'Internal error when creating an account.'
                  });
                }

                if (newAccount) {
                  VerificationToken.create({
                    accountId: newAccount.id,
                    token: crypto({ length: 30 })
                  })
                    .then(result => {
                      try {
                        sendVerificationEmail(newAccount.email, result.token);
                        return done(null, newAccount);
                      } catch (err) {
                        return done(null, false, {
                          message: 'Internal error when sending the verification email.'
                        });
                      }
                    })
                    .catch(error => {
                      return done(null, false, {
                        message: 'Internal error when creating verfication token.'
                      });
                    });
                }
              });
            } catch (err) {
              return done(null, false, {
                message: 'Something went wrong with your Signup'
              });
            }
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
          .then(async function(account) {
            if (!account) {
              return done(null, false, {
                message: 'Incorrect password.'
              });
            }

            if (!account.isVerified) {
              return done(null, false, {
                message: 'Your account is not verified yet.'
              });
            }

            try {
              await isValidPassword(account.password, password);
              var accountinfo = account.get();
              return done(null, accountinfo);
            } catch (err) {
              return done(null, false, { message: 'Incorrect password.' });
            }
          })
          .catch(function(err) {
            return done(null, false, {
              message: 'Something went wrong with your Signin.'
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

const sendVerificationEmail = (to, token) => {
  const hostUrl = process.env.HOST_URL;
  let transporter = nodemailer.createTransport({
    pool: true,
    host: 'your-main-host',
    port: 465,
    secure: true, // use TLS
    auth: {
      user: 'your-auth-user',
      pass: 'your-auth-password'
    }
  });

  return new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        from: 'your-from-email',
        to: to,
        subject: 'Verify Your Email',
        html: `<p>Verify you Email</p>
          <p>Click on this link to verify your email ${hostUrl}/verification?token=${token}&email=${to}</p>
          `
      },
      (err, info, response) => {
        if (err) {
          return reject(err);
        }

        return resolve(response);
      }
    );
  });
};
