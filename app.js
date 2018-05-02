const mongoose = require('mongoose');

const express = require('express')
const querystring = require('querystring');
const port = 3000
const app = express()

const msgSchema = mongoose.Schema({
    // schema info goes here
    sender: String,
    message: String,
    timestamp: Number

});

const Content = mongoose.model('Content', msgSchema);


Content.find(function (err, contents) {
    // const msgContentsArr = [];
    if (err) return console.error(err);
    // console.log(`These are the contents: ${contents}`)
    for (i = 0; i < contents.length; i++) {
        messages.push(contents[i])
    }
    console.log(messages);
    
    
})

// List of all messages
let messages = []

// Track last active times for each sender
let users = {}

app.use(express.static("./public"))
app.use(express.json())

// generic comparison function for case-insensitive alphabetic sorting on the name field
function userSortFn(a, b) {
    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
  
    // names must be equal
    return 0;      
}

app.get("/messages", (request, response) => {
    // get the current time
    const now = Date.now();

    // consider users active if they have connected (GET or POST) in last 15 seconds
    const requireActiveSince = now - (15*1000)

    // create a new list of users with a flag indicating whether they have been active recently
    usersSimple = Object.keys(users).map((x) => ({name: x, active: (users[x] > requireActiveSince)}))

    // sort the list of users alphabetically by name
    usersSimple.sort(userSortFn);
    usersSimple.filter((a) => (a.name !== request.query.for))

    // update the requesting user's last access time
    users[request.query.for] = now;

    // send the latest 40 messages and the full user list, annotated with active flags
    response.send({messages: messages.slice(-40), users: usersSimple})
})

app.post("/messages", (request, response) => {
    // add a timestamp to each incoming message.
    const timestamp = Date.now()
    request.body.timestamp = timestamp

    // append the new message to the message list
    messages.push(request.body)

    // update the posting user's last access timestamp (so we know they are active)
    users[request.body.sender] = timestamp

    // Send back the successful response.
    response.status(201)
    // response.send(request.body)

    const instance = new Content({
        sender: request.body.sender,
        message: request.body.message,
        timestamp: request.body.timestamp
    });

    // Using Promises

    instance.save()
        .then(instance => response.send(
            request.body
        )).catch(err => response.send(err))

    // Using Callbacks    

    // instance.save(function (err, instance) {
    //     if (err) response.send(err);
    //     response.send(request.body)
    // });
        
})

app.listen(port, () => {
    mongoose.connect('mongodb://localhost/klack')
});