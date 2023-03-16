/**
 * Accounts.js
 * 
 * Holds functions to manipulate database information relative
 * to accounts and perform functions specific to user data.
 */

// First import the mongo library
// Assume that the client has already been connected and that disconnect is handled by caller
const mongo = require('./mongodb-library.js');
// Import the crypto module, used for encrypting a given username and password
const crypto = require('crypto');
const { ObjectId } = require('mongodb'); // Necessary to interpret mongodb objectids
const { notificationHandler } = require('./email-service.js');
const Logger = require('./logging.js');
let logger = new Logger("logs/accounts");

// Import the default image
const fs = require('fs');
let default_image = null;
try {
    default_image = fs.readFileSync('public/images/default_profile.txt', 'utf8');
} catch (error) {logger.log("Could not access default image");}

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
function validateEmail(email) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email) && 
    email.substring(email.length - 8, email.length) == "ucla.edu";
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
    return password.length > 6;

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
        return await mongo.get_doc({ "email": RegExp("^" + email + "$", "i") }, "Accounts", "accounts") != null;
    } catch (error) { }
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
        message = "EMAIL IS OF INVALID FORM. YOU MUST SIGN UP WITH A UCLA EMAIL";
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
        logger.log(`New Account Created: ${user_id} ${first} ${last} ${email}`);
        // Save a new profile for the user
        saveMe = {
            "time": (new Date()).getTime(),
            "name": first + ' ' + last,
            "email": email,
            "description": "Description not yet set.",
            "img": default_image,
            "user_id": user_id
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
        let document = await mongo.get_doc({ "user_id": user_id }, "Accounts", "sessions");
        if (document != null) { //Just refresh the session if the user already has one
            await mongo.update_docs({ "user_id": user_id }, { $set: { issue_time: (new Date()).getTime() } }, "Accounts", "sessions");
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
        return await mongo.get_doc({ "user_id": user_id }, "Accounts", "sessions");
    } catch (error) { }
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
        let my_session = await mongo.get_doc({ "hash": hash }, "Accounts", "sessions");
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
        } catch (error) { }
        return {
            info: info,
            valid: valid,
            user_id: user_id
        };
    } catch (error) { }
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

    let account = await mongo.get_doc({ "email": RegExp("^" + email + "$", "i") }, "Accounts", "accounts");

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
        logger.log(`Logged In Account: ${user_id} ${email}`);
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
 * @param {String|Array} attribute first, email, or multiple in a list
 * @param {Boolean} emailforID False if User ID provided, True if email
 * @return the value for the given attribute (a JSON for attribute:value if list provided) otherwise null
 */
async function get_account_attribute(user_id_email, attribute, emailforID = false) {
    let value = null;
    try {
        let filter = emailforID ? { "email": user_id_email } : { "_id": new ObjectId(user_id_email) };
        // Check if attribute is an array
        if (Array.isArray(attribute)) {
            value = await mongo.get_doc(filter, "Accounts", "accounts", attribute);
        } else {
            value = (await mongo.get_doc(filter, "Accounts", "accounts"))[attribute];
        }
    } catch (error) { console.log("ERROR OCCURRED IN RETRIEVING ATTRIBUTE: " + error.message) }
    return value || null;
}


/**
 * Certify a user by checking if there is indeed an account with matching
 * user id and email. If so, certify them.
 * @param {*} user_id 
 * @param {*} email 
 */
async function certify(user_id, email) {
    let info = "Certification Failed";
    let certified = false;

    // Search for the account
    breakMe: try {
        // If the ID is not valid object ID in the first place, we immediately exit.
        let _id = null;
        try {
            _id = new ObjectId(user_id);
        } catch (error) {
            info = "UserID is of incorrect format."
            break breakMe;
        }

        let my_account = await mongo.get_doc({ "_id": _id }, "Accounts", "accounts");
        if (my_account == null) {
            info = "Account with matching ID does not exist."
            break breakMe;
        }
        if (my_account["email"] != email) {
            info = "Inputted ID and email combo is incorrect."
            break breakMe;
        }
        logger.log(`Certified Account: ${user_id} ${email}`);

        // Update the certified status
        await mongo.update_docs({ "_id": _id }, { $set: { "certified": true } }, "Accounts", "accounts");
        info = "Certification success. Please login through the login page.";
        certified = true;
    } catch (err) { };

    return {
        info,
        certified
    }
}

// write function to send messages
async function send_messages(sender, recipient, contents) {
    let response = ({ "status": "fail" });
    try {
        // Two Cases (Below, do this in accounts.js)
        // Case 1: New Conversation, use mongo.add_data to add the new document for the conversation, fill in the message
        // To query the conversation use {$all : {people: [EMAIL1, EMAIL2]}} 
        if (sender == recipient) { return response; }
        if (contents == "") { return response; }
        if (contents.length > 1000) { return response; }
        if (sender == null || recipient == null) { return response; }
        if (sender == "" || recipient == "") { return response; }
        // check if recipient email is valid
        let recipient_account = await mongo.get_doc({ email: recipient }, "Accounts", "accounts");
        if (recipient_account == null) { return response; }
        let conversation = await mongo.get_doc({ people: { $all: [sender, recipient] } }, "Messages", "messages");
        if (conversation == null) {
            await mongo.add_data({
                people: [sender, recipient],
                messages: [{
                    sender: sender,
                    contents: contents,
                    time: (new Date()).getTime()
                }]
            }, "Messages", "messages");
            logger.log(`New conversation: ${sender} ${recipient}`);

            // Send notification to user
            notificationHandler.new_conversation(sender, recipient);
            response.status = "success";
        }
        // Case 2: Existing Conversation, use mongo.update_docs to update the conversation, fill in the message
        else {
            await mongo.update_docs({ people: { $all: [sender, recipient] } }, {
                $push: {
                    messages: {
                        sender: sender,
                        contents: contents,
                        time: (new Date()).getTime()
                    }
                }
            }, "Messages", "messages");
            // Update the notification count
            notificationHandler.increment_conversation_cron(recipient, sender);
            response.status = "success";
        }
    } catch (error) { console.log("ERROR OCCURRED IN SENDING MESSAGES: " + error.message) }
    return response;
}

/**
 * Get messages uses user email to get all messages for that user. 
 * @param {string} sender sender email
 * @returns {array} array of all messages that the user has sent or received
 */
async function get_messages(sender) {
    let response = { "status": "fail" };
    try {
        response = await mongo.get_data({ people: sender }, "Messages", "messages");
    } catch (error) { console.log("ERROR OCCURRED IN RETRIEVING MESSAGES: " + error.message) }
    return response;
}


/**
 * Unpack req and use its defined values to query the Listings database and return the matches
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
 *      get_self: Boolean If true, return all queries for this user
 * }
 *   
 *   Returns response, which has the form =
 * {
 *      data: {
 *          results: {Array of documents}
 *      }
 * }
 * 
 */
listing_logger = new Logger("logs/listings");
async function query_listings(user_id, req) {
    if (req.body.get_self) {
        let email = await get_account_attribute(user_id, "email");
        return await mongo.get_data({"user.email": email}, "Listings", "listings");
    }
    
    //unpack req into query elements
    let locations = req.body.locations;
    let price_min = req.body.price_range.price_min;
    let price_max = req.body.price_range.price_max;
    let time_min = req.body.time_range.time_min;
    let time_max = req.body.time_range.time_max;
    let selling = req.body.selling;
    let order_by = req.body.sort.order_by;
    let asc = req.body.sort.asc;


    listing_logger.log(`Query received ->
    locations: ${locations}
    price_min: ${price_min}
    price_max: ${price_max}
    time_min: ${time_min}
    time_max: ${time_max}
    selling: ${selling}
    order_by: ${order_by}
    asc: ${asc}`);

    let response = {data: "No results match your filter. Try broadening your search!"};
    breakTry: try {
        // construct a compound query based on req passed
        let query = { $and: []};
        results = undefined;


        //if locations is nonempty, add each location to the query using the $or operator
        // we do this since only one location needs to be satisfied for the query to select it
        if(locations.length){
            loc_query = { $or: []};
            for(let i = 0; i < locations.length; i++){
                loc_query.$or.push({location: locations[i]});
            }
            listing_logger.log("Locations query: ", loc_query);
            query.$and.push(loc_query);
        }



        //if price_min exists, or if price_min is zero, filter for prices greater than or equal to price_min
        if(price_min !== undefined){
            query.$and.push({price: { $gte: price_min}});
        }


        //if price_max exists, or if price_max is zero, filter for prices less than or equal to price_max
        if(price_max !== undefined){
            query.$and.push({price: { $lte: price_max}});
        }


        //if time_min exists, filter for times greater than or equal to time_min
        if(time_min !== undefined){
            query.$and.push({time: { $gte: time_min}});
        }


        //if time_max exists, filter for times greater than or equal to time_max
        if(time_max !== undefined){
            query.$and.push({time: { $lte: time_max}});
        }


        //if selling is undefined, show both selling and buying by perfoming no additional filter
        if(selling === undefined){
            //do nothing since selling is undefined
            //empty code block for ease of reading
        }else if(selling){
            //if selling is true, filter for the selling flag
            query.$and.push({selling: true});
        }else{
            //if selling is false, filter for documents without the selling flag
            query.$and.push({selling: false});
        }


        //finally, only search through all documents which have not been resolved yet
        //a resolved listing is one where the poster has already sold the swipe, or the time window has expired
        query.$and.push({resolved: false});

        listing_logger.log("Submitted Query: ", JSON.stringify(query));


        //if order_by exists, sort the results based on the given attribute
        if(order_by !== undefined){
            listing_logger.log("Ordered query");
            results = await mongo.get_data(query, "Listings", "listings", order_by, asc);
        }else{
            //if order_by is undefined, don't sort
            results = await mongo.get_data(query, "Listings", "listings");
        }

        if (results.length === 0) {
            break breakTry;
        }
        response.data = results;
    } catch (error) {} // error handling if needed
    listing_logger.log("Response: ", JSON.stringify(response));
    return response;
}

/**
 * Write data as a document in the specified Database and Collection in MongoDB
 * @param {JSON} data - We expect data to have the form = 
 * {
 *      locations: {String},
 *      price: {Number}
 *      time: {Timestamp}
 *      time_posted: {Timestamp},
 *      resolved: {Boolean}
 *      selling: {Boolean},
 * }
 * @param {String} user_id - We expect user_id to represent a unique document in Accounts.accounts collection
 */
async function insert_listing(user_id, req) {
    //grab the user_id, first, and last names from the user_id given and store it in user JSON
    let user = await get_account_attribute(user_id, ["email", "first", "last"]);
    listing_logger.log(`Create new listing: ${JSON.stringify(user)}`);
    let listing = req.body;
    listing["user"] = user;
    let response = await mongo.add_data(listing, database = "Listings", collection = "listings");
}

/**
 * Fetch a user profile given email, otherwise return null if not found
 * @param {*} EMAIL 
 * @returns 
 */

async function fetch_profile(email) {
    let value = null;
    try {
        let filter = { "email": email };
        let acc = await mongo.get_doc(filter, "Accounts", "profiles");
        value = acc;
        delete value["user_id"];
    } catch (error) { }
    return value || null;
}

/**
 * Post a profile given the profile parameters.
 * We simply just update on the given parameters, unless they are undefined.
 * We bar the user from being able to update values in their profile they
 * shouldn't have access to. Valid parameters to update are given below:
 * 
 * We allow the values to be undefined as well, we filter out these values.
 * 
 * @param {String} user_id 
 * @param {JSON} params An object with keys matching those in the BIO Schema:
 * {
 *      bio: string,
 *      image: string
 * }
 * @returns 
 */
async function post_profile(user_id, params) {
    let response = { status: "fail" };
    let validParams = ["bio", "img"];
    breakMe: try {
        let filter = { "user_id": user_id };
        let update = {};
        for (let param of Object.keys(params)) {
            validParams.includes(param) && params[param] && (update[param] = params[param]);
        }
        if (update == {}) {
            break breakMe;
        }
        let update_copy = {img: update.img != undefined, bio: update.bio};
        logger.log(`Updating profile: ${user_id} ${JSON.stringify(update_copy)}`);
        update = { $set: update };
        let result = await mongo.update_docs(filter, update, "Accounts", "profiles");
        result.modifiedCount == 1 && (response.status = "success");
    } catch (error) { logger.log(`Error in POST PROFILE: ${error.message}`); }
    return response;
}

/**
 * Resolve th listing with the matching user id and Object ID for that
 * listing.
 * @param {*} user_id 
 * @param {*} id 
 */
async function resolve_listing(user_id, id) {
    let email = await get_account_attribute(user_id, "email");
    try {
        let response = await mongo.update_docs({"_id": new ObjectId(id), "user.email": email}, 
        {$set: {"resolved": true}}, "Listings", "listings");
        
        if (response.modifiedCount == 1) {
            listing_logger.log(`Resolved Listing: ${user_id} ${id}`);
            notificationHandler.resolve_listing(
                await mongo.get_doc({"_id": new ObjectId(id), "user.email": email}, "Listings", "listings"),
                email
            );
            return {"status": "success"};
        }
    } catch (err) {listing_logger.log(`ERROR IN RESOLVE: ${err.message}`); return {"status": "fail"}};
    return {"status": "fail"};
}

module.exports = {
    sign_up, login, get_account_attribute, issue_session, verify_session, certify, query_listings, insert_listing, fetch_profile, post_profile, send_messages, get_messages,
    resolve_listing
}