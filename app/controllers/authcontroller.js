var exports = (module.exports = {});

exports.signup = function(req, res) {
  res.render('signup', { messages: req.flash('error')[0] });
};

exports.signin = function(req, res) {
  res.render('signin', { messages: req.flash('error')[0] });
};

exports.dashboard = function(req, res) {
  res.render('dashboard', { messages: req.flash('error')[0] });
};

exports.logout = function(req, res) {
  req.session.destroy(function(err) {
    res.redirect('/');
  });
};

exports.verification = function(req, res) {
  const models = require('../models');
  const Account = models.account;
  const VerificationToken = models.verificationToken;
  const { email, token } = req.query;

  Account.findOne({
    where: { email: email }
  })
    .then(account => {
      if (account.isVerified) {
        res.status(202).json('Email Already Verified');
      } else {
        VerificationToken.findOne({
          where: { token: token }
        })
          .then(foundToken => {
            if (foundToken.token === token) {
              Account.update(
                {
                  isVerified: true
                },
                {
                  where: {
                    id: foundToken.accountId
                  }
                }
              )
                .then(updatedUser => {
                  res.status(200).json(`Account with ${email} has been verified`);
                })
                .catch(reason => {
                  res.status(403).json('Verification failed');
                });
            } else if (foundToken.token !== token) {
              res.status(404).json('Token is not valid');
            } else {
              res.status(404).json('Token expired');
            }
          })
          .catch(reason => {
            console.log(reason);
            res.status(404).json('Token expired');
          });
      }
    })
    .catch(reason => {
      res.status(404).json('Email not found');
    });
};
