/**
 * The logging module.
 * 
 * A generic NodeJS logging module to help save logs to local
 * files stored on the system (uses localDB)
 * 
 * Exports a class object for a logger that you can initialize.
 */

let winston = null;
console.log("Attempting to enable logging...");
try {
    winston = require('winston');
    console.log("Logging enabled!");
} catch (error) {
    console.log("The logging module could not be found. Make sure to run npm install winston.");
    console.log("All logging is disabled!");
}

class Logger {
    /**
     * Construct a new file, where the .log file extension
     * will be appended to the given filename.
     * 
     * @param {String} filename 
     */
    constructor(filename) {
        if (winston == null) {
            return;
        }

        const myFormat = winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} ${level}: ${message}`;
        });

        this.logger = winston.createLogger({
            format: winston.format.combine(
                winston.format.timestamp(),
                myFormat
            ),
            transports: [
                new winston.transports.File({filename: filename + ".log"})
            ]
        });
    }

    log (message) {
        if (winston == null) {
            return;
        }

        try {
            this.logger.log({level: "info", message});
        } catch (error) {
            console.log(`An error occured with logging. ${error.message}`);
        }
    }
}



module.exports = Logger;