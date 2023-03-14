/** js/profile.js
 * 
 * The main script to setup the profile.html page.
 * 
 * Users should be able to view information about their
 * own profile if they choose their own profile and
 * the profile's of others if they want.
 * 
 * Required IDs to work correctly:
 * 
 * 1. profile_area
 * 2. lost_profile
 * 3. profile-photo
 * 4. profileImg
 * 5. welcome
 * 6. save-bio
 * 7. name_span
 * 8. email_span
 * 9. listingsArea
 * 10. listingsTable
 * 
 * 
 * Elements defined with the signed class will be hidden if the user
 * is not signed in as the person that they are viewing the profile for
 * (use this to differ between when one is viewing their own settings
 * and the profile of another)
 */

/**
 * Generate the profile view for a given email.
 * 
 * If the email is null, provide the error for the profile.
 * 
 * @param {String|null} email 
 */
async function view(email, myemail) {
    if (email == null) {
        getElem("profile_area").style.display = "none";
        getElem("lost_profile").style.display = "block";
    }
    // Dynamically fill in elements based on the fetch call for the profile
    let response = await makeRequest("/fetch-profile?email=" + email);
    console.log(response);
    getElem("profileImg").src = response.img;

    // Display bio, name, email
    let bio = getElem("bio");
    bio.textContent = response.bio;

    getElem("name_span").textContent = response.name;
    getElem("email_span").textContent = response.email;

    // Hide all elements that are under the signed attribute
    if (myemail == email) {
        // The user is signed in and viewing their own account.
        // Configure for the personal view

        // Active Listings display
        let listings = await makeRequest("/get-listings", {get_self: true});
        listings.forEach(createListing);

    } else {
        // The user is viewing someone else's profile
        // Configure for public view

        // Make the bio read only
        bio.readOnly = true;
        bio.placeholder = "";

        // Hide all signed class elements
        for (let elem of document.getElementsByClassName("signed")) {
            elem.style.display = "none";
        }

        // Hide any other necessary objects
        getElem("welcome").style.display = "none";
        getElem("save-bio").style.display = "none";
    }
}

/**
 * Create a HTMLelement that represents a listing and append
 * it to the listingsTable on the page.
 * @param {*} listing 
 * @returns 
 */
function createListing(listing) {
    console.log(listing);
    if (listing.resolved) {
        return;
    }

    let listingTable = getElem("listingsTable");

    let resolveButton = quickCreate("button", {"class": ["bruin-button"]}, "Resolve");

    resolveButton.addEventListener("click", async (evt) => {
        let response = await makeRequest(`/resolve-listing?id=${listing._id}`);
        window.location.reload();
    });

    listingTable.append(
        quickCreate("p", null, listing.location),
        quickCreate("p", null, listing.time),
        quickCreate("p", null, "$" + listing.price),
        quickCreate("p", null, listing.selling ? "Selling" : "Buying"),
        resolveButton
    );
}

// For now, just provide a hello message is someone wants to view their own profile
function main(signedIn) {
    // Get the parameters in the url (follow the question mark)
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    // We expect the account to be specified with the parameter email (we cannot guarantee names are unique)
    let email = params.email || signedIn.email;

    view(email, signedIn.email);

    // Setup buttons for user input
    let profileInput = getElem("profile-photo")
    profileInput.addEventListener("change", (evt) => sendImage(profileInput.files[0]));
    getElem("save-bio").addEventListener("click", sendBio);
}

/**
 * Send the file that user has selected to the server
 * @param {*} file The file route, as provided by input type = file
 */
function sendImage(file) {
    var reader = new FileReader();

    /**
     * Convert an image to a specific resolution for the result
     * 
     * From: https://stackoverflow.com/questions/934012/get-image-data-url-in-javascript
     * @param {*} url 
     * @param {*} callback
     * @returns 
     */
    function imageToDataUri(url, callback) {
        let img = quickCreate("img", {"src": url});
        img.width = 100;
        img.height = 100;

        img.setAttribute('crossOrigin', 'anonymous');

        img.onload = function () {
            var canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
    
            var ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0, 100, 100);

            var dataURL = canvas.toDataURL("image/png");
    
            callback(dataURL);
        };
    }

    reader.onloadend = async function () {
        console.log(reader.result);
        imageToDataUri(reader.result, async (result) => {
            let response = await (makeRequest('/post-profile', { img: result }));
            window.location.reload();
        });
    }
    reader.readAsDataURL(file);
}

/**
 * Send the user's bio to the server.
 */
async function sendBio() {
    let bioInput = getElem("bio").value;

    // Valid input check
    if (bioInput == "") {
        return;
    }
    let response = await (makeRequest('/post-profile', { bio: bioInput }));
    console.log(response);
    window.location.reload();
}

signInQueue.push(main);
