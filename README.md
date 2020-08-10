#Flack
A Web Chat

## Feature

Allow users to:

-   Sign in
-   Create channels
-   Join existing channels
-   Send messages
-   Delete their own messages (personal touch)

## How it was built

### app.py

#### Global variables

-   user[]: an array of users, each user is defined by User class with id and username properties
-   conversation[]: an array of channels. Each channel is defined by Conversation class with the following properties: id, name and messages which is an array of messages created in this channel. Each message is defined by Message class with the following properties: id, user_id, message (content of the message), timestamp, username (of the sender), and channel_id in which the message was created

#### @app.route("/")

-   Check if user exists on server and pass the variable isUserExist to javascript to decide if the user needs to login. This will eliminate the case that the webpage automatically log in the user who was stored in LocalStorage previously while this user is not saved in the flask app anymore as the server has just restarted over.
-   Render index.html

#### @app.route("/login", methods=["POST"])

-   Handle ajax request from client: check if the username provided is valid and return json responses. If the provided username is valid, return a json object including id and username of the user. And add this user to the global variable - users[]

#### @app.route("/channels")

-   Handle ajax request from client: return a list of all of the active channels as a json object

#### @app.route("/messages/<channelId>")

-   Handle ajax request from client: return a list of all of the messages belong to the channel whose id is channelId

#### @socketio.on("submit channel")

-   Once a new channel is received, add the channel to the global variable - conversations, then announce it to all users

#### @socketio.on("submit message")

-   Once a new message is received, add the message to the messages array of the conversation it belongs to
-   Check if any channel has reached the maximum of 100 messages. If any, delete the oldest message of that channel
-   Then announce the new message to all users

#### @socketio.on("delete message")

-   Once a message is received, delete the message from the messages array of the channel it belongs to, and annouce it to all users.

## Technologies

-   Flask
-   Socket.IO
-   JavaScript
