/**
 * This script is expected to be imported on every HTML page.
 * 
 * It does the following:
 * 1. Import other default scripts/libraries/css files
 * 2. Initialize account sign in status
 * 3. Initialize the menu setup, available on every page (can be disabled with a separate script tag)
 * 4. Make available global helper functions
 */

// Import Default Scripts/CSS files here
document.head.append(quickCreate("link", {
    "rel": "stylesheet",
    "href": "css/default.css",
}));

// Initialize Menu Setup
// We assume the content of the page is held in the body menu

/**
 * Draw the navigation at the top of body
 */
function drawNav() {
    // TODO: Write these HTML elements into their own files and import from the files

    document.body.innerHTML = '<div id="mySidebar" class="sidebar">' +
        '<a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>' +
        '<a href="#">About</a>' +
        '<a href="#">Services</a>' +
        '<a href="#">Clients</a>' +
        '<a href="#">Contact</a>' +
        '</div>' +
        document.body.innerHTML;

    document.body.innerHTML = '<div id="topMenu">' +
        '<button class="openbtn" onclick="openNav()">&#9776; Open Sidebar</button>' +
        '<h2>Collapsed Sidebar</h2>' +
        '<button id="sign_up_button">SIGNUP</button>' +
        '<button id="sign_in_button">SIGNIN</button>' +
        '<p class="account_name">LOGIN INFO HERE</p>' +
        '</div>' +
        document.body.innerHTML;
}

/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openNav() {
    document.getElementById("mySidebar").style.width = "250px";
    document.getElementById("topMenu").style.marginLeft = "250px";
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("topMenu").style.marginLeft = "0";
}


// Initialize Accounts here
/**
 * TODO
 */
async function initAccountListeners() {
    document.getElementById("sign_up_button").addEventListener("click", async (evt) => {
        let username = prompt("USERNAME");
        let password = prompt("PASSWORD");
        let email = prompt("EMAIL");

        let response = await makeRequest('/sign-up', {username, password, email});
        alert(response);
        console.log(response);

    });
    document.getElementById("sign_in_button").addEventListener("click", async (evt) => {
        alert("THIS BUTTON DONT DO NOTHING YET")
    });

    // Attempt to sign with verify
    let signedIn = await checkSignedIn();
    console.log(signedIn);

    // Set all account spans to the account name
    for (let elem of document.getElementsByClassName("account_name")) {
        elem.textContent = "ACCOUNT SIGNED IN: " + signedIn.username;
    }
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


// TEMPORARY GLOBAL SIGNED IN FUNCTION
async function checkSignedIn() {
    let response = await makeRequest('/verify-session'); 
    return response;//{isSignedIn: false, username: null, data: null};
}



// Document listener for inserting all functions after initialize
document.addEventListener("DOMContentLoaded", (evt) => {
    drawNav();

    initAccountListeners();
});