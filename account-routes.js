/** account-routes.js
 * 
 * A file that specifies how to handle all general account
 * based route activities (sign up, login, verify, etc.).
 * 
 * Uses an authentication system (with the email service)
 * to certify that the user has ownership of their given
 * UCLA email account.
 * 
 */


//NEEDED REQUIREMENTS (INCLUDE NEW MODULES AS NEEDED)
const mongo = require('./mongodb-library.js');
const accounts = require('./accounts.js');
const fs = require('fs');
const { emailHandler, notificationHandler } = require('./email-service.js');


// HELPER FUNCTIONS

/**
 * Test if a user is signed in to a session using their cookies from the given
 * req object and return the verify session response if they are. Otherwise,
 * send a standard response to the user that they are not signed in and return
 * false.
 * 
 * Ensure that after the usage of this function, if it returns false, you immediately
 * end the route.
 * 
 * @param {*} req Assumes req.cookies is initialized
 * @param {*} res
 * @returns A verify_session response or false
 */
async function test_signed(req, res) {
    let response = { isSignedIn: false, "status": "fail", "message": "You are not signed in." };
    if (req.cookies == undefined || req.cookies["session"] == undefined) {
        res.send(response);
        return false;
    }
    let verify_response = await accounts.verify_session(req.cookies["session"]);
    if (!verify_response["valid"]) {
        res.send(response);
        return false;
    }
    return verify_response;
}



/**
 * Sign up an account. If the user correctly provides all parameters and a valid email
 * send them a confirmation email with a link to the certified route using the emailService.
 * 
 * They are then expected to verify themselves by using the link and logging on, at which
 * point we provide them their session.
 * 
 * @param {*} req expects req.body to be equivalent to a JSON of the following structure
 * {
 *      first: {String},
 *      last: {String},
 *      password: {String},
 *      email: {String}
 * }
 * @param {*} res a response on whether the user's request was successful. If it was, 
 * they are sent an email to verify their account. Of the form:
 * {
 *      info: {String}
 *      accountCreated: {Boolean}
 * }
 */
async function sign_up(req, res) {
    let first = req.body.first;
    let last = req.body.last;
    let password = req.body.password;
    let email = req.body.email;

    //Sign up the account
    let response = await accounts.sign_up(first, last, password, email);

    if (response["accountCreated"]) {
        // Send an email to the client here.
        emailHandler.certify_email(response["name"], response["email"], response["user_id"]);
    }
    res.send({
        "info": response["info"],
        "accountCreated": response["accountCreated"]
    });
}

/**
 * Login in a user. Sets session in cookie (for 24 hours.)
 * @param {*} req The request should have a body that has the following structure:
 * {
 *      email: {String},
 *      password: {String}
 * }
 * @param {*} res The result is a JS object of the following structure:
 * {
 *      loggedIn: {Boolean},
 *      info: {String},
 * }
 */
async function login(req, res) {
    let email = req.body.email;
    let password = req.body.password;
    let login_response = {
        info: "FAILED",
        "loggedIn": false
    }
    try {
        login_response = await accounts.login(email, password);

        if (login_response["loggedIn"]) {
            // Issue a new session using the account's _id
            let session_response = await accounts.issue_session(login_response["user_id"]);
            res.cookie("session", session_response["hash"], {
                maxAge: 5 * 24 * 60 * 60 * 1000,
                httpOnly: true
            });
        }
    } catch (error) {
        console.log("An Error Occurred in the Login Function... " + error.message);
    }

    res.send({
        "info": login_response["info"],
        "loggedIn": login_response["loggedIn"]
    });
}

/**
 * Logout, deleting the session cookie.
 * @param {*} req 
 * @param {*} res 
 * {
 *      info: [STRING]
 * }
 */
async function logout(req, res) {
    try {
        let x = req.cookies["session"];
    } catch (error) {
        res.send({
            "info": "You're not signed in."
        });
        return;
    }
    res.clearCookie("session");
    res.send({
        "info": "You have been logged out."
    });
}

/**
 * A function meant to be run on every page load, verifying if the user's session
 * is valid.
 * The user will send a Request object in which the cookies are stored.
 * If the session cookie exists and the session (hash) is valid, then the session
 * is valid. Otherwise, the session is invalid.
 * 
 * 
 * @param {*} req 
 * @param {JSON} res An object of the form:
 * {
 *      isSignedIn: {Boolean},
 *      name: {String},
 * }
 */
async function verify_session(req, res) {
    let verify_response = await test_signed(req, res);
    if (!verify_response) {
        return;
    }

    let response = await accounts.get_account_attribute(verify_response["user_id"], ["first", "email"]);
    response.name = response.first; delete response.first;
    response.isSignedIn = true;
    res.send(response);
}

/**
 * Certify that an account owns their UCLA account and update their certified flag.
 * 
 * @param {JSON} req We expect query to contain URL parameters such that req.params =
 * {
 *      user_id: {String},
 *      email: {String}
 * }
 */
async function certify(req, res) {
    let user_id = req.query.user_id;
    let email = req.query.email;

    let certify_response = await accounts.certify(user_id, email);

    res.send(certify_response || { status: "fail" });

}

/**
 * Fetch a profile.
 * 
 * @param {JSON} req We expect query to contain URL parameters such that req.params =
 * {
 *      email: {String}
 * }
 */
async function fetch_profile(req, res) {
    let email = req.query.email;
    let response = await accounts.fetch_profile(email);

    res.send(response || { status: "fail" });
}

/**
 * Post a profile.
 * 
 * @param {*} req We expect the body to have atleast one key with the following form:
 * {
 *      img?: {String},
 *      bio?: {String}
 * }
 * @param {*} res 
 * @returns 
 */
async function post_profile(req, res) {
    //Expect res to have body.data attribute
    let verify_response = await test_signed(req, res);
    if (!verify_response) {
        return;
    }

    let params = {
        bio: req.body.bio,
        img: req.body.img
    }
    let response = await accounts.post_profile(verify_response["user_id"], params);
    res.send(response);
}

async function get_notifications(req, res) {
    let verify_response = await test_signed(req, res);
    if (!verify_response) {
        return;
    }
    res.send(await notificationHandler.getAll(verify_response["user_id"]));
}

async function read_notifications(req, res) {
    let verify_response = await test_signed(req, res);
    if (!verify_response) {
        return;
    }
    await notificationHandler.readAll(verify_response["user_id"]);
    res.send({ "status": "success" });
}
/**
 * Send a message.
 * 
 * @param {*} req We expect the body to have atleast one key with the following form:
 * {
 *      email: {String},
 *      message: {String}
 * }
 * @param {*} res 
 * @returns 
 */
async function send_messages(req, res) {
    // Expect res to have body.data attribute
    let verify_response = await test_signed(req, res);
    if (!verify_response) {
        return;
    }
    // Grab the email of the current user using account_attribute
    let email = await accounts.get_account_attribute(verify_response["user_id"], "email");
    // User sends in their req.body: req.body.email, req.body.message ONLY
    let response = await accounts.send_messages(email, req.body.email, req.body.message);

    res.send(response);
    // Assume that the messages array for any conversation has length >= 1 always
}

async function get_messages(req, res) {
    // Expect res to have body.data attribute
    let verify_response = await test_signed(req, res);
    if (!verify_response) {
        return;
    }
    let email = await accounts.get_account_attribute(verify_response["user_id"], "email");
    let response = await accounts.get_messages(email);
    res.send(response);
}

/**
 * A function meant to handle queries for the Listings Database from the MongoDB
 * 
 * @param {JSON} req - We expect the query to contain URL parameters such that req.body = 
 * {
 *      locations: [Array, of, locations],
 *      price_range: {
 *          price_min: {Number},
 *          price_max: {Number}
 *      },
 *      time_range: {
 *          time_min: {Timestamp}
 *          time_max: {Timestamp}
 *      },
 *      selling: {Boolean},
 *      sort: {
 *          order_by: {String},
 *          asc: {Boolean} //ascending is assumed unless otherwise specified
 *      }
 * }
 * 
 * If a parameter is not used for querying or sorting, keep the structure but replace the values with undefined. Example:
 *  * {
 *      locations: ["rendezvous", "bplate"],
 *      price_range: {
 *          price_min: undefined,
 *          price_max: 8.5
 *      },
 *      time_range: {
 *          time_min: 2023-02-22T12:12
 *          time_max: undefined
 *      },
 *      selling: undefined,
 *      sort: {
 *          order_by: "Time",
 *          asc: true
 *      }
 * }
 * 
 */
async function get_listings(req, res) {
    let verify_response = await test_signed(req, res);
    if (!verify_response) {
        return;
    }
    
    // The verify response provides the user's id
    response = await accounts.query_listings(verify_response["user_id"], req);
    // Always send a response
    res.send(response);
}
/**
 * 
 * 
 * @param {*} req expects req.body to be equivalent to a JSON of the following structure
 * {
 * 
 * 
 * 
 * }
 * @param {*} res a response on whether the user's request was successful. If it was, send back a success message
 * {
 * 
 * 
 * }
 */
async function post_listing(req, res) {
    // Expect res to have body.data attribute
    let verify_response = await test_signed(req, res);
    if (!verify_response) {
        return;
    }

    await accounts.insert_listing(verify_response["user_id"], req);
    res.send({ "status": "success" });
}

/**
 * Resolve a given user listing if the user is logged in and owns that
 * listing.
 * 
 * @param {*} req Assume that req.query includes a id attribute pointing
 * to the MongoDB _id document of the listing that needs to be resolved
 * @param {*} res 
 */
async function resolve_listing(req, res) {
    let verify_response = await test_signed(req, res);
    if (!verify_response) {
        return;
    }

    res.send(await accounts.resolve_listing(verify_response["user_id"], req.query.id));
}

module.exports = {
    sign_up, login, logout, verify_session, certify, get_listings, post_listing, get_notifications, read_notifications, fetch_profile, post_profile, send_messages, get_messages, resolve_listing
}