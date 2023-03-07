/**
 * A generic email handler using Google's Gmail API.
 * 
 * Allows you to send emails of different template types
 * to any user.
 * 
 * 
 * @author Pirjot Atwal
 */

const fs = require('fs').promises;
const { raw } = require('express');
const path = require('path');
const process = require('process');
const accounts = require('./accounts.js');
const mongo = require('./mongodb-library.js');

// Install the following libraries with npm install
let authenticate, google;
try {
    console.log("Importing Google APIs... (This may take a moment)");
    authenticate = require('@google-cloud/local-auth').authenticate;
    google = require('googleapis').google;
    console.log("Google APIs loaded!");
} catch (error) {
    console.error(error.message);
    console.log("Error in importing Google libraries. Make sure to run npm install first.")
}


// Constants for gmail
const SCOPES = ['https://mail.google.com/',
'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
'https://www.googleapis.com/auth/gmail.compose',
'https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        console.log("Load Saved Credentials Error: " + err.message);
        return null;
    }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

class emailService {
    /**
     * Ready the emailService by authorizing/loading the credentials
     */
    constructor() {
        console.log("Initializing email client...")

        this.auth = null;

        this.initialize();
    }

    async initialize() {
        await this.authorize();
        console.log("Email service initialized!");
        
        // this.send_email(`pirjot@g.ucla.edu`, `Hey`, `<p><b>This is BruinBot!</b></p>`);
    }

    /**
     * Return the client either form saved credentials
     * or a new authenticate call to google cloud.
     * 
     * Initialize the notification handler.
     *
     * @returns An auth client
     */
    async authorize() {
        this.auth = await loadSavedCredentialsIfExist();
        if (!this.auth) {
            try {
                this.auth = await authenticate({
                    scopes: SCOPES,
                    keyfilePath: CREDENTIALS_PATH,
                });
            } catch (error) {
                console.error(error);
                console.error("Did not get valid credentials.json. Make sure to initialize the GAPI credentials and Google Cloud Project Gmail API.");
                return;
            }
        }
        if (this.auth.credentials) {
            await saveCredentials(this.auth);
        }

    }

    checkAuth() {
        if (!this.auth) {
            console.error("Auth is not authorized yet. Make sure requests wait for the instance to be finished authenticating.");
            // Alternatively, add a manual delay here (bad implementation)
        }
        return this.auth;
    }

    /**
     * Send an email with the passed in parameters to the given recipient.
     * The body is expressed in HTML.
     * 
     * @param {String} recipients Emails of all recipients, comma separated with a space 
     * @param {String} subject 
     * @param {String} body in HTML
     */
    async send_email(recipients, subject, body) {
        let auth = this.checkAuth();
        // Send a template email, replacing our word into the subject/body as needed

        let rawEmail = `MIME-Version: 1.0
Date: Mon, 13 Feb 2023 19:19:28 -0800
Message-ID: <CAJ5an2uVZouTF1v376ZuyDYgD4C+c9TZtjJ04qB_GKsxN28-5g@mail.gmail.com>
Subject: `+ subject + `
From: Bruinswipes Bot <bruinswipesbot@gmail.com>
To: ` + recipients + `
Content-Type: multipart/alternative; boundary="00000000000068396205f4a06e0b"

--00000000000068396205f4a06e0b
Content-Type: text/plain; charset="UTF-8"

Body

--00000000000068396205f4a06e0b
Content-Type: text/html; charset="UTF-8"

` + body + `

--00000000000068396205f4a06e0b--`;

        // Perform some replacement in a given email (FOR LATER)
        // emailRaw.replaceAll('ANYTHING', 'SOMETHING')

        // Create the draft
        let encoded = Buffer.from(rawEmail).toString('base64');
        const gmail = google.gmail({version: 'v1', auth});
        let res = await gmail.users.drafts.create({
            'userId': 'me',
            'requestBody': {
                "message": {
                  "raw": encoded
                }
            }
        });
        // Send the draft
        let draftID = res.data.id;
        res = await gmail.users.drafts.send({
            'userId': 'me',
            'requestBody': {
                "id": draftID
            }
        });
    }

    /**
     * Send a certification email with a link to where the user can get
     * their email certified...
     * @param {String} address The address of the server (get this using req.protocol and req.get('host'))
     * @param {*} name 
     * @param {*} email 
     * @param {*} user_id 
     */
    async certify_email(address, name, email, user_id) {
        // TODO: Change recipients to actual email parameter above (for now, route emails to where you want)
        this.send_email("bruinswipesbot@gmail.com", "Verify your BruinSwipes Account", `
<p>Hi ` + name + `,</p>
    
<p>Welcome to BruinSwipes! After verifying your account, you can login normally from the website. Verify your account with the link below:</p>
<a href="` + address + `/certify?user_id=` + user_id + `&email=` + email + `">Verify your account</a>
        
<p>Go Bruins!</p>
`);
    }

}


/**
 * Each user has a collection of notifications to their name,
 * stored in a collection of notifications some of which are
 * "active".
 * 
 * We assume notifications are either unread or read
 * and that the handling of notifications for any single user happens
 * solely through calls to the notificationService.
 * 
 * Therefore, to add new notifications we service a route for the user
 * and send them an email about the specific notification's information.
 * This class' main job is to parse the specific body for each type
 * of notification.
 * 
 * We have special cases where certain notifications are between users.
 * In this case, we expect some information to passed in to represent
 * the user being notified (such as their email).
 * 
 * We keep track of all notifications, unread or read and provide
 * utility routes for the user to fetch their notifications.
 * 
 * 
 */

class notificationService {
    /**
     * 
     * @param {emailService} emailHandler 
     */
    constructor(emailHandler) {
        if (!emailHandler) {
            return;
        }

        console.log("Notification Service Ready!");

        this.emailHandler = emailHandler;

        this.database = "Accounts";
        this.collection = "notifications";

        // Examples
        // this.notify_message("Pirjot", "dev@gmail.com", null);
    }

    /**
     * Notify the given user with user_id or email by sending them
     * an email with body and storing the notification
     * provided into their notification database.
     * 
     * @param {String} user_id_email The user id or email
     * @param {String} subject
     * @param {String} body 
     * @param {JSON} notification Body to store in MongoDB database
     * @param {Boolean} emailForUserID False if user_id provided, true otherwise
     */
    async notify(user_id_email, subject, body, notification, emailForUserID=false) {
        let user_id = user_id_email;
        if (emailForUserID) {
            user_id = await accounts.get_account_attribute(user_id_email, "_id", true);
            user_id = user_id.toString();
        }
        
        // Make sure the notification is of the correct format, if not set default parameters
        if (!notification.title) {
            notification.title = "ERROR";
        }
        if (!notification.desc) {
            notification.desc = "ERROR";
        }

        // Setup the notification
        notification.user_id = user_id;
        notification.time = (new Date()).toDateString();
        notification.read = false;

        // Send the email to the given user
        let email = emailForUserID ? user_id_email : await accounts.get_account_attribute(user_id, "email");
        // this.emailHandler.send_email(email, subject, body);

        // Store the notification
        mongo.add_data(notification, this.database, this.collection);
    }

    /**
     * Set all notifications to read for this user.
     * 
     * @param {String} user_id 
     */
    async readAll(user_id) {
        await mongo.update_docs({user_id: user_id}, {$set: {"read": true}}, this.database, this.collection);
    }

    /**
     * Get all the notifications for a given user id.
     * @param {*} user_id 
     */
    async getAll(user_id) {
        return await mongo.get_data({user_id: user_id}, this.database, this.collection);
    }

    // DEFINE ALL NEW NOTIFICATIONS

    /**
     * TODO: Notifications for each type of user interaction:
     * 
     * Examples:
     * 1. Profile Modification (Unnecessary)
     * 2. Monthly Statistics (Unnecessary)
     * 3. User listing for selling has new user
     * 4. Request has been filled
     * 5. Message sent from one user to another
     */

    /**
     * Notify a user by sending them a generic message.
     * @param {*} from 
     * @param {*} to 
     * @param {*} messageBody 
     */
    async notify_message(from, to, messageBody) {
        // Template function
        let body = `<h1>Hi you got a new message from: `+ from +`</h1>`;

        // Mongo Notification
        let notification = {
            "title": "New Message",
            "desc": "This is my description"
        };
        this.notify(to, "New Message", body, notification, true);
    }
}

let emailHandler = new emailService();
let notificationHandler = new notificationService(emailHandler);
module.exports = {emailHandler, notificationHandler};

// Email Handler also adds notificationHandler to module.exports
// module.exports.notificationHandler = new notificationService(module.exports.emailHandler);