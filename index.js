/** Bruin Swipes main.js - Main Server File
 * Set up Bruin Swipes server and host it
 * on some available port.
 * 
 * Directs API calls and serves static pages.
 * 
 * @date 2/2/2023
 */

console.log("Welcome to BruinSwipes! Setting up the server... (Close the server at anytime with C-c)")

// Default imports
const cookieParser = require('cookie-parser');

// Attempt to import express
let express = require('express');
try {
    express = require('express');
} catch (err) {
    console.log("Error on importing Express. You likely did not run 'npm install' first.");
    process.exit(0);
}

// Load the mongo library and initialize the client
const mongo = require('./mongodb-library.js');

/**
 * Build the app and serve static files from the public folder.
 */
const app = express(); // Build the app
app.use(cookieParser()); // Allow the app to be able to read cookies from the request
app.use(express.static('public')); // By default, serve static files from the public folder
app.use(express.json()); // Allow JSON GET/POST requests

// Listen on default port or 3000 by default
let server = app.listen(process.env.PORT || 3000, () => {
    console.log("Starting to listen at http://localhost:" + server.address().port);

    mongo.connectClient(); // Connect here, so that atleast the serving of pages is ready
});


//On server/process closing, perform cleanup functions
process.on('SIGINT', () => {
    mongo.closeClient();
    console.log("Closing down BruinSwipes server...");
    process.exit(0);
});

// -------------------------------------------------------------------
// END SERVER CODE, BEGIN ROUTES & EMAIL SERVICE
// -------------------------------------------------------------------

// We do all "email handling" where it is necessary to do so
let {emailHandler} = require('./email-service.js');

let route_handler = require('./route-handler.js');
route_handler(app);



// -------------------------------------------------------------------
// END ROUTES & EMAIL SERVICE CODE
// -------------------------------------------------------------------

