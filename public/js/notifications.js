/*
    Script to ready the notifications.html page for the client.

    Relies on the following IDs existing:

    1. unread
    2. read
    3. read_button
*/

function readyButtons() {
    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }

    getElem("read_button").addEventListener("click", (evt) => {
        makeRequest('/read-notifications');
        window.location.reload();
    });
}

function genNotification(values) {
    let {time, title, desc} = values;
    let q = (text) => quickCreate("p", null, text);
    let elems = [q(time), q(title), q(desc)];

    let notification = quickCreate("div", {"class": ["notification"]});
    elems.forEach((not) => notification.append(not));
    return notification;
}

async function fillNotifications() {
    // Make the request and then fill the corresponding collapsible accordingly
    let notifications = await makeRequest("/get-notifications");
    console.log(notifications);

    // notifications = [{
    //     title: "TITLE 1",
    //     desc: "DESC 1",
    //     time: "TIMESTAMP 1",
    //     read: false
    // }, {
    //     title: "TITLE 2",
    //     desc: "DESC 2",
    //     time: "TIMESTAMP 2",
    //     read: false
    // }]

    let unreadDiv = getElem("unread");
    let readDiv = getElem("read");

    let unread_notis = [];
    let read_notis = [];

    notifications.forEach((notification) => {
        generated = genNotification(notification);
        !notification.read ? unread_notis.push(generated) : read_notis.push(generated);
    });

    // Render the notifications
    renderNotifications(unreadDiv, unread_notis);
    renderNotifications(readDiv, read_notis)
}

function renderNotifications(div, list) {
    if (list.length == 0) {
        return;
    }
    div.innerHTML = "";
    div.append(...list);
}

function showError() {
    getElem("wrapper").innerHTML = "<h1>Error, Please Sign in to view notifications.</h1><h1><a href='index.html'>Go Back Home</a></h1>";
}

function main_notifications(signedIn) {
    if (!signedIn.isSignedIn) {
        showError();
        return;
    }

    readyButtons();
    fillNotifications();
}


signInQueue.push(main_notifications);
