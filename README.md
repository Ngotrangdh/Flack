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

### main.js

-   Line 3-27: check whether the user needs to login or not based on localStorage and the value of isUserExist, then display the webpage respectively.
-   line 29-39: check to whether or not disable the submit button of login form.
-   line 41-64: send an ajax request to server to check if username is valid and login user by display the main page.
-   line 66-82: send an ajax request to server to get a list of all active channels.
-   line 84-92: check to whether or not disable the create button to submit new channel.
-   line 99-117: emit new channels to event 'submit channel'.
-   line 119-135: emit new messages to event 'submit message'.
-   Line 138-151: call function createMessage() to create and display the new channel once it's been announced.
-   line 153-163: call funtion createChannel() to create and display the new message once it's been announced.
-   line 165-168: define function scrollToBottom(): once new message is created, the webpage will automatically scroll to bottom.
-   line 170-193: define function createMessage()
-   line 195-213: define function createChannel()
-   line 215-229: define function selectChannelHandler(): Change color of the channel is selected as active, save the channel id to localStorage and call function loadMessages() to display all the messages of this channel.
-   line 231-245: define function loadMessages()
-   line 247-260: define function deleteMessage(): emit the choosen message (which then will be deleted) to event 'delete message', then delete the message once it's been announced.
