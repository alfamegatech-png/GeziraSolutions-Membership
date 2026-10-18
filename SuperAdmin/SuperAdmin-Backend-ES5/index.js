const express = require("express");
const bootstrap = require("./src/utils/bootstrap.js");
const dotenv = require("dotenv");
const morgan = require("morgan");
const winston = require("winston");
const path = require("path");
const DailyRotateFile = require("winston-daily-rotate-file");
const cors = require("cors");
const { logger } = require("./src/utils/logger.js");
const dbConnection = require("./Database/dbConnection.js").dbConnection;
const synchronizeTables = require("./Database/Migrate & Seeding/migrate.js").synchronizeTables;
const seedData = require("./Database/Migrate & Seeding/seedData.js").seedData;


// Ensure that associations are set up
require("./Database/models/associations.js");

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;
dotenv.config();

app.use(express.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
  const isApiRoute = req.url.startsWith('/api');
  if (isApiRoute) {
    logger.info(`${req.method} ${req.url}`);
  }
  next();
});

async function initialize() {
  await synchronizeTables();
  await seedData();
}
initialize();

bootstrap(app);
dbConnection();

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

logger.on('error', (error) => {
  logger.error('Winston error:', error);
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  console.log(`Server is running on port ${port}`);
});
