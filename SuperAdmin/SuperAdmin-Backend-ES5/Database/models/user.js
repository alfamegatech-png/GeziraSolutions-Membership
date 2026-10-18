const Sequelize = require('sequelize');
const sequelize = require('../../Database/dbConnection.js').sequelize;

const User = sequelize.define(
  'user',
  {
    id: {
      type: Sequelize.TEXT,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: Sequelize.TEXT,
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    name: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    fullname: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    safe_no: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    national_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    CreatedBy: { 
      type: Sequelize.TEXT, 
      allowNull: false 
    },
    UpdatedBy: { 
      type: Sequelize.TEXT, 
      allowNull: false 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {User};
