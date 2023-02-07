# Bruin-Swipes

## **Welcome to Bruin-Swipes!**

<div style="margin-bottom:15px"></div> 

> *One cannot think well, love well, sleep well, if one has not dined well. -Virginia Woolf*

### Authors:
Nate Fish, Ophir Siman-Tov, Sumeet Chhina, Mihir Srivastava, Pirjot Atwal

---
##  <u>About</u>

BruinSwipes is an online web application to help serve UCLA Bruins with buying and selling their meal swipes! The app allows users to easily arrange meetings on campus at their favorite dining location to exchange a meal swipe for cash. It's a must-have for UCLA's off-campus residents.

---
### Installing
Simply run the following commands while located in the root folder of the project to run the server on your machine. Visit the corresponding address that is printed in your terminal to view the website.

```
npm install
node index.js
```

Make sure to rename the downloaded .env-git file to .env and insert all necessary secrets into the file.
###  IMPORTANT
Make sure that you set up a database at MongoDB, initialize a user and a password, and insert the corresponding connection uri into the mongodb library file. Finally, make sure that the database allows access
from the configured server's IP address.


## For Developers 
Setup your standard express app with
```
npm init
npm install express
```
Then setup your react-client app with the following:
```
npm init react-app client
```
