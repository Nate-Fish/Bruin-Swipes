/**
 * The route handler class. Allows you to cleanly set up all get and post routes
 * for a given express app.
 */

let account_routes = require('./account-routes.js');
let logger = new (require('./logging.js'))("logs/routes");

function routeHandler (app) { // Default export (bottom of file)
    // Setup logging for all routes
    app.use((req, res, next) => {
        // Avoid routes that are called too often
        if (!(req.originalUrl == "/get-messages" || req.originalUrl == "/query-listings")) {
            if (req.originalUrl == "/post-profile") {
                logger.log(`Route Called: ${req.originalUrl}, Body: ` + JSON.stringify({img: req.body.img != undefined, bio: req.body.bio}));
            } else {
                logger.log(`Route Called: ${req.originalUrl}, Body: ` + JSON.stringify(req.body));
            }
        }

        next();
    });
    
    setup_get_routes(app);
    setup_post_routes(app);
    console.log("Routes have been setup!");
}

function setup_get_routes (app) {
    // START ACCOUNT GET ROUTES

    // Logout of the account
    app.get('/logout', (req, res) => account_routes.logout(req, res));

    // On every page load, verify if the user is signed in and if so, who they are signed is as.
    app.get('/verify-session', (req, res) => account_routes.verify_session(req, res));

    // Certify an account (verify their email)
    app.get('/certify', (req, res) => account_routes.certify(req, res));

    // END ACCOUNT GET ROUTES

    // START NOTIFICATION GET ROUTES

    // Get all the notifications for this account
    app.get('/get-notifications', (req, res) => account_routes.get_notifications(req, res));

    // Read all notifications
    app.get('/read-notifications', (req, res) => account_routes.read_notifications(req, res));
    
    // END NOTIFICATION GET ROUTES

    // START MISC GET ROUTES

    // Fetch a profile
    app.get('/fetch-profile', (req, res) => account_routes.fetch_profile(req, res));

    // Get Messages
    app.get('/get-messages', (req, res) => account_routes.get_messages(req, res));

    // Resolve a listing
    app.get('/resolve-listing', (req, res) => account_routes.resolve_listing(req, res));

    // END MISC GET ROUTES

}

function setup_post_routes (app) {
    // START ACCOUNT POST ROUTES

    // Sign up for an account
    app.post('/sign-up', (req, res) => account_routes.sign_up(req, res));

    // Login to an account
    app.post('/login', (req, res) => account_routes.login(req, res));

    // Post a listing to DB
    app.post('/post-listing', (req, res) => account_routes.post_listing(req, res));

    // Get queried results from DB
    app.post('/get-listings', (req, res) => account_routes.get_listings(req, res));
    //Posts profile

    
    app.post('/post-profile', (req, res) => account_routes.post_profile(req, res));

    // START ACCOUNT GET ROUTES

    // Send Messages
    app.post('/send-messages', (req, res) => account_routes.send_messages(req, res));
}


module.exports = routeHandler;