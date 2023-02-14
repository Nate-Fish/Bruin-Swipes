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

class emailHandler {
    /**
     * Ready the emailHandler by authorizing/loading the credentials
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
}

// Have only a single handler, authenticated once
if (!module.exports.handler) {
    module.exports.handler = new emailHandler();
}
module.exports = {handler:null};