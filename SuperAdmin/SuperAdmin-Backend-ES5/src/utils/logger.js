const winston = require('winston');
const path = require('path');
const fs = require('fs');
const DailyRotateFile = require('winston-daily-rotate-file');
const os = require('os');

const logDirectory = process.env.LOG_DIR || path.join(os.tmpdir(), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

const logger = winston.createLogger({
    transports: [
        new DailyRotateFile({
            filename: path.join(logDirectory, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
        }),
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});

logger.on('error', (error) => {
    logger.error('Winston error:', error);
});

module.exports = {logger};
