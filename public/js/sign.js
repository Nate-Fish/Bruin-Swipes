/**
 * Sign Up / In script for users to sign up or login into their
 * account through sign.html. Made to be robust (as little dependent
 * to the DOM as possible).
 * 
 * DOM Dependencies:
 * We require the following IDs to exist on the DOM after the
 * DOMContentLoaded event:
 * 
 * signParent
 * 
 * signUpTab
 * loginTab
 * 
 * signup-first
 * signup-last
 * signup-email
 * signup-password
 * signup-confirm
 * 
 * login-email
 * login-password
 * 
 * signUpForm
 * loginForm
 * signUpSubmit
 * loginSubmit
 * 
 * message
 * 
 * @author Pirjot Atwal
 */

// TODO: Write script for sign up login and authentication on backend (ucla email)
// TODO: Change View to Logout Button if user signed in

/**
 * When a user selects a tab, show the corresponding form and disable the other one.
 */
let activeWindow = "sign";
function selectTab() {
    // Initialize variables
    let signTab = getElem('signUpTab');
    let loginTab = getElem('loginTab');
    let signUpForm = getElem('signUpForm');
    let loginForm = getElem('loginForm');
    let message = getElem('message');

    // Set transparency for default (we assign the signUpForm to be visible)
    signUpForm.style.opacity = "100";
    loginForm.style.opacity = "0";
    loginForm.style.display = "none";

    /**
     * Helper function to fade in/out forms.
     * @param {*} formToShow 
     * @param {*} formToHide 
     */
    function showTab(formToShow, formToHide, active) {
        message.innerText = "";
        formToShow.style.display = "block";
        formToHide.style.display = "none";
        formToShow.offsetHeight;

        formToShow.style.opacity = "100";
        formToHide.style.opacity = "0";

        activeWindow = active;
    }

    signTab.addEventListener("click", (evt) => showTab(signUpForm, loginForm, "sign"));
    loginTab.addEventListener("click", (evt) => showTab(loginForm, signUpForm, "login"));
}

// Signup and Login Buttons
function buttonSetup() {
    // Initialize variables
    let signButton = getElem("signUpSubmit");
    let loginButton = getElem("loginSubmit");
    let message = getElem("message");
    
    signButton.addEventListener("click", async (evt) => {
        message.innerText = "Signing up...";

        // Get input values
        let first = getElem('signup-first').value;
        let last = getElem('signup-last').value;
        let email = getElem('signup-email').value;
        let password = getElem('signup-password').value;
        let confirm = getElem('signup-password').value;
        
        if (password != confirm) {
            message.innerHTML = "Passwords do not match";
        }

        // Send request
        let res = await makeRequest('/sign-up', {
            first, last, email, password
        });
        
        if (res.accountCreated) {
            message.innerHTML = "Account successfully created! Verify your account using the email in your school account.";
        } else {
            message.innerHTML = "Account creation failed: " + res.info + ". Try again.";
        }
    });

    loginButton.addEventListener("click", async (evt) => {
        message.innerText = "Logging in...";

        // Get input values
        let email = getElem('login-email').value;
        let password = getElem('login-password').value;

        // Send request
        let res = await makeRequest('/login', {
            email, password
        });

        if (res.loggedIn) {
            message.innerHTML = "Login successful!";

            setTimeout(() => location.assign('/index.html'), 2000);
        } else {
            message.innerHTML = "Login failed. Reason: " + res.info;
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.keyCode == 13) {
            activeWindow == "sign" ? signButton.click() : loginButton.click();
        }
    });
}


/**
 * Main function for sign.html.
 * 
 * We chain the following based on sign in status
 * If the user is already signed in, we provide a logout button before they can sign in again.
 * 
 * Otherwise, we show the sign in menu.
 */
function main(signedIn) {
    if (!signedIn.isSignedIn) {
        selectTab();
        buttonSetup();
        return;
    }
    // The user is signed in. Instead, display a default logout button.
    let parent = getElem("signParent");
    parent.innerHTML = `
    <div style="display: flex; flex-flow: column nowrap; text-align:center;">
        <h1>Hi ` + signedIn.name + `, it seems you're already signed in. Logout here:</h1>
        <button style="margin:auto" onclick=logout()>Logout</button>
    </div>
    `;
}


// Inject our function into the sign in queue (happens after DOMContentLoaded)
signInQueue.push(main);