/**
 * This script is expected to be imported on every HTML page.
 * 
 * It does the following:
 * 1. Import other default scripts/libraries/css files (You don't need to import default.css)
 * 2. Initialize account sign in status
 * 3. Initialize the menu setup, available on every page (TODO: can be disabled with a separate script tag)
 * 4. Make available global helper functions
 */

// Import variables from the script data attributes
// True if we want to hide the navigation, false otherwise
let hideNav = Boolean(document.currentScript.getAttribute("data-hideNav"));

// Import Default Scripts/CSS files here
document.head.append(quickCreate("link", {
    "rel": "stylesheet",
    "href": "css/default.css",
}));
document.head.append(quickCreate("link", {
    "rel": "stylesheet",
    "href": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
}));

// Initialize Menu Setup
// We assume the content of the page is held in the body menu

/**
 * Draw the navigation at the top of body
 */
function drawNav() {
    // TODO: Write these HTML elements into their own files and import from the files

    document.body.innerHTML = `<div id="mySidebar" class="sidebar">
        <a href="javascript:void(0)" class="closebtn" onclick='closeNav()'>&times;</a>
        <a href="#">About</a>
        <a href="#">Services</a>
        <a href="#">Clients</a>
        <a href="#">Contact</a>
        </div>` +
        document.body.innerHTML;

    // signArea below is attached to the script in initAccountListeners
    document.body.innerHTML = `<div id="topMenu">
        <button class="openbtn" onclick="openNav()">&#9776;</button>
        <h2>BruinSwipes</h2>
        <div style="margin: auto 0 auto 0;" id="signArea"></div>
        </div>` +
        document.body.innerHTML;
}

/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
    getElem("mySidebar").style.width = "250px";
    getElem("topMenu").style.marginLeft = "250px";
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
    getElem("mySidebar").style.width = "0";
    getElem("topMenu").style.marginLeft = "0";
}


// -----------------------------------------------
// ACCOUNT AUTHENTICATION
// -----------------------------------------------
/**
 * Every object in the signInQueue is a function that accepts
 * the signedIn object as its parameter.
 * 
 * 
 */
let signInQueue = [];


/**
 * Initialize the Account Listeners. All information here
 * is relevant on the signed in status. We provide
 * a global "signInQueue" for functions that need to check
 * sign and status.
 * The object is of the following form:
 * {
 *      isSignedIn: {Boolean},
 *      name: {String}
 * }
 */
async function initAccountListeners() {
    // Attempt to sign with verify
    let signedIn = await checkSignedIn();

    for (func of signInQueue) {
        func(signedIn);
    }

    if (hideNav) {
        return;
    }

    // The sign up/in button area (div)
    let area = getElem('signArea');

    if (signedIn.isSignedIn) {
        area.innerHTML = `<button style="
        margin-right: 20px;
        cursor: pointer;
        " onclick="logout()">Logout</button>
        
        <a style="border: 2px solid white;
        background-color: #2774AE;
        border-radius: 15px;
        color: black;
        padding: 0.3rem 0.8rem;
        transition: background-color 0.25s;
        outline: none;
        cursor: pointer;
        text-decoration: none;
        font-size: 18px;
        " href="profile.html">
        <i class="fa fa-address-card"></i>  Welcome ` + signedIn.name +`!
        </a>`;

        

    } else {
        // TODO - Move this to CSS
        area.innerHTML = `
        <a href="sign.html" 
        onmouseover = "this.style.backgroundColor = 'white';"
        onmouseout = "this.style.backgroundColor = '#2774AE';"
        
        
        style="border: 2px solid white;
        background-color: #2774AE;
        border-radius: 15px;
        color: black;
        padding: 0.3rem 0.8rem;
        transition: background-color 0.25s;
        outline: none;
        cursor: pointer;
        text-decoration: none;
        font-size: 18px;"
        >Sign Up / Login</a>
        `;
    }
}


// TEMPORARY GLOBAL SIGNED IN FUNCTION
async function checkSignedIn() {
    let response = await makeRequest('/verify-session'); 
    return response;//{isSignedIn: false, username: null, data: null};
}



// Define and Implement Global Helper functions
/**
 * Utility helper function to minimize the lines needed
 * to initialize a new document element.
 * 
 * Also provides extra help in immediately assigning classes
 * to the classList (you only need to use "class" for the
 * key of the pair in which you are assigning classes)
 * 
 * EXAMPLES: 
 * quickCreate("div", {"class": ["room"], "style": "height: auto"}, "123")
 * quickCreate("h1", null, "Hello World")
 * 
 * @param {String} tagName The name of the tag
 * @param {JSON} tags The tags in JSON format
 * @param {String} text The textContent if needed to assign
 * @author Pirjot Atwal
 */

function quickCreate(tagName, tags = null, text = null) {
    let element = document.createElement(tagName);
    if (tags != null) {
        for (let key of Object.keys(tags)) {
            if (key == "class") {
                for (let className of tags[key]) {
                    element.classList.add(className);
                }
            } else {
                element.setAttribute(key, tags[key]);
            }
        }
    }
    if (text != null) {
        element.textContent = text;
    }
    return element;
}


/**
 * Make a request to the server with a certain route and body
 * if needed and return the response asynchronously.
 * @param {String} route 
 * @param {JSON} body 
 * @returns {JSON} Some JSON object or array.
 */
async function makeRequest(route, body=null) {
    let options = {
        method: 'GET',
        headers: {
            'Content-Type': "application/json"
        },
    };
    if (body != null) {
        options.method = 'POST';
        options.body = JSON.stringify(body)
    }
    let res = await (await fetch(route, options)).json();
    return res;
}

/**
 * Make a request to logout and refresh the page.
 */
async function logout() {
    await makeRequest('/logout');
    location.reload();
}
/**
 * Aliases for document related functions.
 */
/**
 * Alias for document.getElementById.
 */
function getElem(id) {
    return document.getElementById(id);
}


// Document listener for inserting all functions after initialize
document.addEventListener("DOMContentLoaded", (evt) => {
    !hideNav && drawNav();    

    initAccountListeners();
});