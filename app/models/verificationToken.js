module.exports = function(sequelize, DataTypes) {
  const VerificationToken = sequelize.define('verificationToken', {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  VerificationToken.associate = function(models) {
    models.verificationToken.belongsTo(models.account);
  };

  return VerificationToken;
};
