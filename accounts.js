// First import the mongo library
// Assume that the client has already been connected and that disconnect is handled by caller
const mongo = require('./mongodb-library.js');
// Import the crypto module, used for encrypting a given username and password
const crypto = require('crypto');
const fs = require('fs');;
const { ObjectId } = require('mongodb'); // Necessary to interpret mongodb objectids

/**
 * Decrypt the hash/salt using a password and return true if the password is correct.
 * 
 * @param {String} password - The plain text password
 * @param {String} hash - The hash stored in the database
 * @param {String} salt - The salt stored in the database
 * @return {Boolean} if password is correct
 */
 function validPassword(password, hash, salt) {
    var hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}

/**
 * Generate a hash and salt encrypted version for a password.
 * 
 * @param {String} password The password to encrypt
 * @returns JSON with salt and hash as properties
 */
function genPassword(password) {
    var salt = crypto.randomBytes(32).toString('hex');
    var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    return {
        salt: salt,
        hash: genHash
    };
}

/**
 * Determine if a provided email is in valid format.
 * @param {*} email 
 * @returns True if valid, false otherwise
 */
function validateEmail(email) 
{
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

/**
 * Determine if a password meets complexity requirements.
 * i) at least one upper case letter (A – Z)
 * ii) at least one lower case letter (a - z)
 * iii) At least one digit (0 – 9)
 * iv) at least one special characters of !@#$%&*()
 * @param {*} password 
 * @returns
 */
function validatePassword(password) {
    // DISABLED FOR NOW
    return true;

    // return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/.test(password);
}

/**
 * Determine if a username is of valid structure.
 * A valid structure is defined as follows:
 * i) Any Alphanumerical characters between the length of 6 to 20
 * ii) No underscore or periods in conjuction
 * 
 * @param {*} username 
 * @returns 
 */
function validateUsername(username) {
    return /^(?=[a-zA-Z0-9._]{6,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/.test(username);
}

/**
 * Determine if a username already exists in the Accounts/accounts database. (Not case sensitive)
 * @param {String} username 
 * @returns {Boolean} true if the username already exists, false otherwise.
 */
async function username_exists(username) {
    try {
        return (await mongo.get_data({"username": RegExp("^"+username+"$", "i")}, "Accounts", "accounts")).length > 0;
    } catch (error) {}
}

/**
 * Determine if an account with the given email already exists. (Not case sensitive)
 * @param {String} email 
 * @returns {Boolean}
 */
async function email_exists(email) {
    try {
        return (await mongo.get_data({"email": RegExp("^"+email+"$", "i")}, "Accounts", "accounts")).length > 0;
    } catch (error) {}
}

/**
 * Sign up a new user, using their passed in username and password.
 * Return an object that symbolizes that status of whether the account was
 * created successfully or not.
 * 
 * @param {String} username A username's requirements is defined by its corresponding function
 * @param {String} password A password's requirements is defined by its corresponding function
 * @return A JSON Object TODO: ADD INFO THAT GETS SENT BACK IN JSON
 */
async function sign_up(username, password, email) {
    let createAccount = false;
    let message = "CREATE ACCOUNT FAILED";
    let user_id = 0;

    //CHECK REQUIREMENTS
    if (await username_exists(username)) { //No duplicate accounts
        message = "USERNAME ALREADY EXISTS";
    } else if (await email_exists(email)) { //No duplicate email
        message = "EMAIL ALREADY EXISTS";
    } else if (!validatePassword(password)) {
        message = "PASSWORD DOES NOT MEET SECURITY STANDARDS";
    } else if (!validateEmail(email)) {
        message = "EMAIL IS OF INVALID FORM";
    } else if (!validateUsername(username)) {
        message = "USERNAME IS OF INVALID FORM";
    } else {
        createAccount = true;
    }
    if (createAccount) {
        message = "ACCOUNT CREATED";

        //Generate a password hash
        let hashSalt = genPassword(password);
        // Data to send to MongoDB database
        let saveMe = {
            time: (new Date()).getTime(),
            username: username,
            email: email,
            hash: hashSalt.hash,
            salt: hashSalt.salt,
        };
        //Send the data to the database (Accounts/accounts collection)
        new_account = await mongo.add_data(saveMe, "Accounts", "accounts");
        user_id = new_account["insertedId"].toString();
        // Save a new profile for the user
        saveMe = {
            "TIME": (new Date()).getTime(),
            "USERNAME": username,
            "DESCRIPTION": "Description not yet set.",
            "USER_ID": user_id
        };
        await mongo.add_data(saveMe, "Accounts", "profiles");
    }

    return {
        info: message,
        account_created: createAccount,
        user_id: user_id,
    };
}

/**
 * "Issue" a session for a given user id. If the session for the ID already exists
 * refresh its time.
 * 
 * A session is a document with the following properties:
 * {
 *      user_id: The user id.
 *      hash: The hash to decrypt the encrypted_session, passed back to the client
 *      salt: The salt to decrypt the encrypted_session
 *      issue_time: The time this session was issued in milliseconds.
 *      _id: MongoDB generated ObjectID (unused)
 * }
 * 
 * @param {String} user_id The id of the user to create a session for
 * @returns the session object
 */
async function issue_session(user_id) {
    try {
        let matching_sessions = await mongo.get_data({"user_id": user_id}, "Accounts", "sessions");
        if (matching_sessions.length != 0) { //Just refresh the session if the user already has one
            await mongo.update_docs({"user_id": user_id}, {$set: {issue_time: (new Date()).getTime()}}, "Accounts", "sessions");
        } else { // Issue a new session
            let hashSalt = genPassword(user_id);
            let new_doc = {
                "user_id": user_id,
                "hash": hashSalt.hash,
                "salt": hashSalt.salt,
                issue_time: (new Date()).getTime(),
            }
            await mongo.add_data(new_doc, "Accounts", "sessions");
        }
        // Send back the the user's session (by re-verifying that it actually showed up in the database)
        let sessions = await mongo.get_data({"user_id": user_id}, "Accounts", "sessions");
        return sessions[0];
    } catch (error) {}
}

/**
 * Verify a session by checking if the passed in hash does exist, decrypts 
 * successfully AND the time between when it was issued and now isn't 
 * greater than a day.
 * To refresh the session, call issue_session on the user_id passed back.
 * 
 * @param {String} hash - A session hash that came from the client's cookies.
 * @returns a doc representing the state of the session formatted as such:
 * {
 *      info: "VALID" / "EXPIRED" / "INVALID",
 *      user_id: [STRING]
 *      valid: true / false
 * }
 */
async function verify_session(hash) {
    if (hash == undefined) {
        return {
            valid: false
        };
    }
    try {
        let sessions = await mongo.get_data({"hash": hash}, "Accounts", "sessions");
        let info = "INVALID";
        let valid = false;
        let user_id = 0;
        try {
            let my_session = sessions[0];
            let issue_time = my_session["issue_time"];
            if (((new Date()).getTime() - issue_time) / 1000 / 60 / 60 / 24 > 1) { // Calculate issue_time, can't be greater than a day
                info = "EXPIRED";              
            } else if (validPassword(my_session["user_id"], hash, my_session["salt"])) { // Check decryption
                user_id = my_session["user_id"];
                info = "VALID";
                valid = true;
            }
        } catch (error) {}
        return {
            info: info,
            valid: valid,
            user_id: user_id
        };
    } catch(error) {}
    return {
        valid: false
    };
}



/**
 * Take in a username and password, if it is valid, send back a session.
 * 
 * @param {String} username
 * @param {String} password
 * @returns An object symbolizing if the session was successfully issued.
 * {
 *      info: "LOGIN FAILED" / ...,
 *      user_id: <STRING>,
 *      loggedIn: true / false
 * }
 */
async function login(username, password) {
    let loggedIn = false;
    let message = "LOGIN FAILED";
    let user_id = 0;
    
    let accounts = (await mongo.get_data({"username": username}, "Accounts", "accounts"));

    if (accounts.length == 0) { //An account with that username doesn't exist
        message = "ACCOUNT DOES NOT EXIST";
    } else if (!validPassword(password, accounts[0]["hash"], accounts[0]["salt"])) { //Password incorrect
        message = "INCORRECT PASSWORD";
    } else { //Account is good
        user_id = accounts[0]["_id"].toString();
        message = "LOGIN SUCCESSFUL";
        loggedIn = true;
    }
    return {
        info: message,
        user_id: user_id,
        loggedIn: loggedIn
    };
}

/**
 * Get a person's username using their user_id.
 * 
 * @param {String} user_id
 * @returns {String} the person's username (or null if not found)
 */
async function get_account_username(user_id) {
    let username = null;
    try {
        let matching_accounts = await mongo.get_data({"_id": new ObjectId(user_id)}, "Accounts", "accounts");
        let my_account = matching_accounts[0];
        username = my_account["username"];
    } catch (error) {console.log("ERROR OCCURRED IN RETRIEVING USERNAME: " + error.message)}
    return username;
}

module.exports = {
    sign_up, login, get_account_username, issue_session, verify_session
}