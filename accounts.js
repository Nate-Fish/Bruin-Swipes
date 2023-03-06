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
 * Determine if a given name is in valid format.
 * @param {String} first 
 * @param {String} last 
 * @returns {Boolean}
 */
function validateName(first, last) {
    return first.length > 3 && last.length > 3 && !(first + last).includes(" ");
}

/**
 * Determine if an account with the given email already exists. (Not case sensitive)
 * @param {String} email 
 * @returns {Boolean}
 */
async function email_exists(email) {
    try {
        return await mongo.get_doc({"email": RegExp("^"+email+"$", "i")}, "Accounts", "accounts") != null;
    } catch (error) {}
}

/**
 * Sign up a new user, using their passed in full name and password.
 * Return an object that symbolizes that status of whether the account was
 * created successfully or not.
 * 
 * @param {String} first The user's first name
 * @param {String} last The user's last name
 * @param {String} password The user's password
 * @param {String} email The user's email (unique)
 * @return A JSON Object of the following format:
 * {
        info: {String},
        accountCreated: {Boolean},
        user_id: {String},
    };
 */
async function sign_up(first, last, password, email) {
    let createAccount = false;
    let message = "CREATE ACCOUNT FAILED";
    let user_id = 0;

    //CHECK REQUIREMENTS
    if (await email_exists(email)) { //No duplicate email
        message = "EMAIL ALREADY EXISTS";
    } else if (!validatePassword(password)) {
        message = "PASSWORD DOES NOT MEET SECURITY STANDARDS";
    } else if (!validateEmail(email)) {
        message = "EMAIL IS OF INVALID FORM";
    } else if (!validateName(first, last)) {
        message = "NAME IS OF INVALID FORM. (No Spaces and greater than 3 characters)";
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
            first: first,
            last: last,
            email: email,
            certified: false,
            hash: hashSalt.hash,
            salt: hashSalt.salt,
        };
        //Send the data to the database (Accounts/accounts collection)
        new_account = await mongo.add_data(saveMe, "Accounts", "accounts");
        user_id = new_account["insertedId"].toString();
        // Save a new profile for the user
        saveMe = {
            "TIME": (new Date()).getTime(),
            "EMAIL": email,
            "DESCRIPTION": "Description not yet set.",
            "USER_ID": user_id
        };
        await mongo.add_data(saveMe, "Accounts", "profiles");
    }

    return {
        info: message,
        accountCreated: createAccount,
        user_id: user_id,
        name: first + " " + last,
        email: email
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
        let document = await mongo.get_doc({"user_id": user_id}, "Accounts", "sessions");
        if (document != null) { //Just refresh the session if the user already has one
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
        return await mongo.get_doc({"user_id": user_id}, "Accounts", "sessions");
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
        let my_session = await mongo.get_doc({"hash": hash}, "Accounts", "sessions");
        let info = "INVALID";
        let valid = false;
        let user_id = 0;
        try {
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
 * Take in a email and password, if it is valid, send back a session.
 * 
 * @param {String} email
 * @param {String} password
 * @returns An object symbolizing if the session was successfully issued.
 * {
 *      info: {String},
 *      user_id: {String},
 *      loggedIn: {Boolean}
 * }
 */
async function login(email, password) {
    let loggedIn = false;
    let message = "LOGIN FAILED";
    let user_id = 0;
    
    let account = await mongo.get_doc({"email": RegExp("^"+email+"$", "i")}, "Accounts", "accounts");

    if (account == null) { // An account with that email doesn't exist
        message = "ACCOUNT DOES NOT EXIST";
    } else if (!validPassword(password, account["hash"], account["salt"])) { // Password incorrect
        message = "INCORRECT PASSWORD";
    } else if (!account["certified"]) {
        message = "UNCERTIFIED ACCOUNT. CHECK YOUR EMAIL."
    } else { // Account is good
        user_id = account["_id"].toString();
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
 * Retrieve any given attribute using a person's user_id or email
 * from the Accounts database.
 * @param {String} user_id_email
 * @param {String} attribute first, email, etc.
 * @param {Boolean} emailforID False if User ID provided, True if email
 * @return the value for the given attribute otherwise null
 */
async function get_account_attribute(user_id_email, attribute, emailforID=false) {
    let value = null;
    try {
        let filter = emailforID ? {"email": user_id_email} : {"_id": new ObjectId(user_id_email)};
        let account = await mongo.get_doc(filter, "Accounts", "accounts");
        value = account[attribute];
    } catch (error) {console.log("ERROR OCCURRED IN RETRIEVING ATTRIBUTE: " + error.message)}
    return value;
}


/**
 * Certify a user by checking if there is indeed an account with matching
 * user id and email. If so, certify them.
 * @param {*} user_id 
 * @param {*} email 
 */
async function certify (user_id, email) {
    let info = "Certification Failed";
    let certified = false;

    // Search for the account
    breakMe: try {
        // If the ID is not valid object ID in the first place, we immediately exit.
        let _id = null;
        try {
            id = new ObjectId(user_id);
        } catch(error) {
            info = "UserID is of incorrect format."
            break breakMe;
        }

        let my_account = await mongo.get_doc({"_id": id}, "Accounts", "accounts");
        if (my_account == null) {
            info = "Account with matching ID does not exist."
            break breakMe;
        }
        if (my_account["email"] != email) {
            info = "Inputted ID and email combo is incorrect."
            break breakMe;
        }
        // Update the certified status
        await mongo.update_docs({"_id": id}, {$set: {"certified": true}}, "Accounts", "accounts");
        info = "Certification success. Please login through the login page.";
        certified = true;
    } catch (err) {};

    return {
        info,
        certified
    }
}

module.exports = {
    sign_up, login, get_account_attribute, issue_session, verify_session, certify
}