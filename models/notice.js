'use strict'
module.exports = (sequelize, DataTypes) => {
  const Notice = sequelize.define(
    'Notice',
    {
      title: DataTypes.STRING,
      description: DataTypes.TEXT,
      isChecked: DataTypes.BOOLEAN,
      receivedId: DataTypes.INTEGER,
      objectType: DataTypes.STRING,
      objectId: DataTypes.INTEGER,
      authorAvatar: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'Notice',
      tableName: 'Notices',
      underscored: true
    }
  )
  Notice.associate = function (models) {
    // associations can be defined here
    Notice.belongsTo(models.User, { foreignKey: 'receivedId' })
    Notice.belongsTo(models.User, { foreignKey: 'objectId' })
  }
  return Notice
}
