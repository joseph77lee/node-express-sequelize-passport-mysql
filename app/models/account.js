module.exports = function(sequelize, DataTypes) {
  const Account = sequelize.define('account', {
    firstname: {
      type: DataTypes.STRING,
      notEmpty: true
    },

    lastname: {
      type: DataTypes.STRING,
      notEmpty: true
    },

    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    isVerified: {
      type: DataTypes.BOOLEAN
    }
  });

  Account.associate = function(models) {
    models.account.hasOne(models.verificationToken);
  };

  return Account;
};
