# Bruin-Swipes

## **Welcome to Bruin-Swipes!**

<div style="margin-bottom:15px"></div> 

> *One cannot think well, love well, sleep well, if one has not dined well. -Virginia Woolf*

### Authors:
Nate Fish, Ophir Siman-Tov, Sumeet Chhina, Mihir Srivastava, Pirjot Atwal

---
##  <u>About</u>

BruinSwipes is an online web application to help serve UCLA Bruins with buying and selling their meal swipes! The app allows users to easily arrange meetings on campus at their favorite dining location to exchange a meal swipe for cash. It's a must-have for UCLA's off-campus residents.

FYI: You will need to have a valid UCLA email to be able to sign up for an account on the website.

---
### Installing
Simply run the following commands while located in the root folder of the project to run the server on your machine. Visit the corresponding address that is printed in your terminal to view the website.

```
npm install
node index.js
```

Make sure to rename the downloaded .env-git file to .env and insert all necessary secrets into the file.
###  IMPORTANT
### <i><u> MongoDB Setup </u></i>
Make sure that you set up a database at MongoDB, initialize a user and a password, and insert the corresponding connection uri into the mongodb library file. Finally, make sure that the database allows access
from the configured server's IP address (you will need to check this from MongoDB's website).

### <i><u> Gmail Setup </u></i>
Next, make sure you setup your own Google API credentials, enable the Gmail API and create an OAuth2 Client ID.
Save your downloaded credentials to this root folder and name it credentials.json. This is necessary for the email-service to work correctly.

On setting up your OAuth Client App:
Make sure the redirect URI is set to http://localhost:8000/oauth2callback. Every time you run the server
for the first time (or if your token expires: 7 days if your app is still in testing mode) the server
will open a webpage to ask you to login into your Gmail account so that it can access the email sending
service. Note: If you are running this program on a server, make sure that requests from the server
are allowed and that you manually load a valid token.json into the server's files for it load from.

## For Developers 
Setup your standard express app with
```
npm init
npm install express
```
Import necessary files like mongodb-library.js to your root folder and initialize
your secrets in a .env file (e.g. MONGOPASSWORD=???).

Next, make sure to download the necessary credentials.json file to your root folder containing the OAuth2.0 credentials for the Google API to work (alternatively, comment out the emailHandler imports in the main file if you aren't working with the email service yet.)

To view all the credentials necessary to see both the Gmail and MongoDB data, see the secrets google doc here: (only shared to developers of this project) <a href="https://docs.google.com/document/d/16fc05cGhRv3WcJdg3zonL68o0x3y5Ft5HMRoO8w7T0A/edit?usp=sharing">Secrets</a>.

### How to Communicate with the Backend
We communicate with the backend using fetch requests through local routes. You can view all routes available in route-handler.js.

For your use, you can use the helper function makeRequest (available in /public/js/global.js, expected to be imported in every HTML page) to make writing your requests easier. Make sure to *await* any fetch requests you make yourself and any call to an async function.

For any process that involves communication between the server and client do the following:

1. Write the function(s) in the backend that communicates with the database or server variables, organized by their specific module (e.g. accounts.js)
2. If desired, make a separate module to parse incoming requests (GET and POST fetch requests are passed to the server as a request and response object pair) and then utilize your lower level functions that you declared in Step 1. (e.g. account-routes.js)
3. Declare your function in its respective area (GET or POST) in route-handler.js.
4. Test your request on the frontend (perhaps in a React Object).

## Schema

### Accounts Schema
<br>

```
{
  _id: ObjectId
  
  time: double
  
  username: string

  email: double

  hash: string

  salt: null
}
```
<br>

### Profile Schema

```
{
  email: string
  
  _id : ObjectId
  
  user_id: string

  time: double

  description: string

  img: null
}
```