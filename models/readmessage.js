'use strict'
module.exports = (sequelize, DataTypes) => {
  const ReadMessage = sequelize.define('ReadMessage', {
    messageId: DataTypes.INTEGER,
    readId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ReadMessage',
    tableName: 'ReadMessages',
    underscored: true
  })
  ReadMessage.associate = function(models) {
    // associations can be defined here
    ReadMessage.belongsTo(models.Message, { foreignKey: 'messageId' })
    ReadMessage.belongsTo(models.User, { foreignKey: 'readId' })
  }
  return ReadMessage
}