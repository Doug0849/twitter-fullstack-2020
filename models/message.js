'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'Sender' })
      Message.belongsTo(models.User, { foreignKey: 'receiverId', as: 'Receiver' })
    }
  }
  Message.init(
    {
      senderId: DataTypes.INTEGER,
      receiverId: DataTypes.INTEGER,
      content: DataTypes.TEXT,
      haveRead: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'Messages',
      underscored: true
    }
  )
  return Message
}
