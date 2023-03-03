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
 * 
 * 
 */

/**
 * Generate the profile view for a given email.
 * 
 * If the email is null, provide the error for the profile.
 * 
 * @param {String|null} email 
 */
async function view(email) {
    if (email == null) {
        getElem("profile_area").style.display = "none";
        getElem("lost_profile").style.display = "block";
    }
    console.log(email);
    // Dynamically fill in elements based on the fetch call for the profile
    let response = await makeRequest("/fetch-profile?email=" + email);
    console.log(response);
    getElem("profileImg").src = response.img;

}


// For now, just provide a hello message is someone wants to view their own profile
function main(signedIn) {
    // Get the parameters in the url (follow the question mark)
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    console.log(signedIn)

    // We expect the account to be specified with the parameter email (we cannot guarantee names are unique)
    let email = params.email || signedIn.email;

    view(email);
}

function encodeImageFileAsURL(element) {
    var file = element.files[0];
    var reader = new FileReader();
    reader.onloadend = async function() {

        // let img = quickCreate("img", {"src": reader.result});
        // getElem("infoArea").append(img);
        let response = await(makeRequest('/post-profile', {img : reader.result}));
        console.log(response);

    }
    reader.readAsDataURL(file);

  }

signInQueue.push(main);
