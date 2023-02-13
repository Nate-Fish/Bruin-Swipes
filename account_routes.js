/**
 * THIS FILE HAS NOT BEEN IMPLEMENTED AS NEEDED YET.
 * 
 * THIS IS JUST A TEMPLATE UNTIL FUTURE NOTICE.
 * 
 * 
 * WE LOOK TO MAKE A CLASS TO HANDLE ROUTING / UTILIZE EXPRESS ROUTERS TO MAKE THIS PROCESS NICER
 */

//NEEDED REQUIREMENTS (INCLUDE NEW MODULES AS NEEDED)
const mongo = require('./mongodb-library.js');
const accounts = require('./accounts.js')
const fs = require('fs');

/**
 * Sign up an account, manipulating the user's cookies to store their special session ID.
 * 
 * @param {*} req expects req.body to be equivalent to a JSON of the following structure
 * {
 *      username: {STRING},
 *      password: {STRING},
 *      email: {STRING}
 * }
 * @param {*} res 
 * @returns a response on whether the user's request was successful. If it was, 
 * a session is automatically issued and the cookie is set. Of the form:
 * {
 *      info: "ACCOUNT CREATED" / ...
 *      account_created: true / false
 * }
 */
async function sign_up(req, res) {
    //TODO: Perform some error checking possibly, parsing, cleaning up,etc.
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;

    //Sign up the account
    let sign_up_response = await accounts.sign_up(username, password, email);

    if (sign_up_response["account_created"]) {
        //Issue a new session using the account's _id
        let session_response = await accounts.issue_session(sign_up_response["user_id"]);

        res.cookie("session", session_response["hash"], {
            maxAge: 5 * 24 * 60 * 60 * 1000,
            httpOnly: true
        });
    }
    res.send({
        "info": sign_up_response["info"],
        "account_created": sign_up_response["account_created"]
    });
}

/**
 * Login in a user. Sets session in cookie (for 24 hours.)
 * @param {*} req The request should have a body that has the following structure:
 * {
 *      username: {STRING},
 *      password: {STRING}
 * }
 * @param {*} res The result is a JS object of the following structure:
 * {
 *      loggedIn: true / false,
 *      info: {STRING},
 * }
 */
async function login(req, res) {
    //TODO: Perform some error checking possibly, parsing, cleaning up, etc.
    let username = req.body.username;
    let password = req.body.password;
    let login_response = {
        info: "FAILED",
        "loggedIn": false
    }
    try {
        login_response = await accounts.login(username, password);

        if (login_response["loggedIn"]) {
            //Issue a new session using the account's _id
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
 *      isSignedIn: true / false,
 *      username: [STRING],
 *      data: [STRING]
 * }
 */
async function verify_session(req, res) {
    let response = {
        isSignedIn: false,
        username: null,
        data: null
    };
    if (req.cookies == undefined || req.cookies["session"] == undefined) {
        res.send(response);
        return;
    }
    
    let verify_response = await accounts.verify_session(req.cookies["session"]);
    if (verify_response["valid"]) {
        response.isSignedIn = true;
        response.username = await accounts.get_account_username(verify_response["user_id"]);
    }
    res.send(response);
}


module.exports = {
    sign_up, login, logout, verify_session
}