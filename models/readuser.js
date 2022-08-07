'use strict'
module.exports = (sequelize, DataTypes) => {
  const Readuser = sequelize.define('Readuser', {
    messageId: DataTypes.INTEGER,
    readId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Readuser',
    tableName: 'Readusers',
    underscored: true
  })
  Readuser.associate = function(models) {
    // associations can be defined here
    Readuser.belongsTo(models.Message, { foreignKey: 'messageId' })
    Readuser.belongsTo(models.User, { foreignKey: 'readId' })
  }
  return Readuser
}