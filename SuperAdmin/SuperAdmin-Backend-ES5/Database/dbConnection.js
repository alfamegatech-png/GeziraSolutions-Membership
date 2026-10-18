const dotenv = require('dotenv');
dotenv.config();

const Sequelize = require('sequelize');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL must be configured in the local .env file');

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  schema: 'public',
  logging: false,
});

async function dbConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = {
  sequelize: sequelize,
  dbConnection: dbConnection
};
