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
const {emailHandler, notificationHandler} = require('./email-service.js');

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

        emailHandler.certify_email(req.protocol + "://" + req.get('host'), 
        response["name"], response["email"], response["user_id"]);
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
async function logout (req, res) {
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
 *      first: {String},
 * }
 */
async function verify_session(req, res) {
    let response = {
        isSignedIn: false,
        name: null,
    };
    if (req.cookies == undefined || req.cookies["session"] == undefined) {
        res.send(response);
        return;
    }
    
    let verify_response = await accounts.verify_session(req.cookies["session"]);
    if (verify_response["valid"]) {
        response.isSignedIn = true;
        response.name = await accounts.get_account_attribute(verify_response["user_id"], "first");
    }
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

    res.send(certify_response);
}

async function get_notifications(req, res) {
    let response = {"status": "fail"};
    if (req.cookies == undefined || req.cookies["session"] == undefined) {
        return res.send(response);
    }
    let verify_response = await accounts.verify_session(req.cookies["session"]);
    if (!verify_response["valid"]) {
        return res.send(response);
    }
    res.send(await notificationHandler.getAll(verify_response["user_id"]));
}

async function read_notifications(req, res) {
    let response = {"status": "fail"};
    if (req.cookies == undefined || req.cookies["session"] == undefined) {
        return res.send(response);
    }
    let verify_response = await accounts.verify_session(req.cookies["session"]);
    if (!verify_response["valid"]) {
        return res.send(response);
    }
    await notificationHandler.readAll(verify_response["user_id"]);
    res.send({"status": "success"});
}

module.exports = {
    sign_up, login, logout, verify_session, certify, get_notifications, read_notifications
}