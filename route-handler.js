/**
 * The route handler class. Allows you to cleanly set up all get and post routes
 * for a given express app.
 */

let account_routes = require('./account_routes.js');

function routeHandler (app) { // Default export (bottom of file)
    setup_get_routes(app);
    setup_post_routes(app);
}

function setup_get_routes (app) {
    // START ACCOUNT GET ROUTES

    // Logout of the account
    app.get('/logout', (req, res) => account_routes.logout(req, res));

    // On every page load, verify if the user is signed in and if so, who they are signed is as.
    app.get('/verify-session', (req, res) => account_routes.verify_session(req, res));

    // END ACCOUNT GET ROUTES
}

function setup_post_routes (app) {
    // START ACCOUNT POST ROUTES

    // Sign up for an account
    app.post('/sign-up', (req, res) => account_routes.sign_up(req, res));

    // Login to an account
    app.post('/login', (req, res) => account_routes.login(req, res));

    // START ACCOUNT GET ROUTES
}


module.exports = routeHandler;