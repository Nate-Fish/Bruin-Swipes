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
const path = require('path');
const cookieParser = require('cookie-parser');

// Attempt to import express
let express;
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
});

mongo.connectClient(); // Connect here, so that atleast the serving of pages is ready

//On server/process closing, perform cleanup functions
process.on('SIGINT', () => {
    mongo.closeClient();
    console.log("Closing down BruinSwipes server...");
    process.exit(0);
});

// -------------------------------------------------------------------
// END SERVER CODE, BEGIN ROUTES
// -------------------------------------------------------------------

// TODO: REMOVE THIS LINE AND REPLACE IT WITH A CLASS IMPLEMENTATION OF ROUTES AND ACCOUNTS

let routes = require("./routes.js");

// ACCOUNT BASICS, AGAIN, MOVE THIS ELSEWHERE / IMPLEMENT DIFFERENTLY
// Sign up for an account
app.post('/sign-up', (req, res) => routes.sign_up(req, res));

// Login to an account
app.post('/login', (req, res) => routes.login(req, res));

// Logout of the account
app.get('/logout', (req, res) => routes.logout(req, res));

// On every page load, verify if the user is signed in and if so, who they are signed is as.
app.get('/verify-session', (req, res) => routes.verify_session(req, res));

