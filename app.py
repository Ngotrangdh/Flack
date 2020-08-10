import os
import json

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

users = []
conversations = []


class User:
    def __init__(self, id, username):
        self.id = id
        self.username = username


class Message:
    def __init__(self, id, user_id, username, message, channel_id, timestamp):
        self.id = id
        self.user_id = user_id
        self.message = message
        self.timestamp = timestamp
        self.username = username
        self.channel_id = channel_id


class Conversation:
    def __init__(self, id, name):
        self.id = id
        self.name = name
        self.messages = []

    def add_message(self, message):
        self.messages.append(message)

    def toJson(self):
        return json.dumps(self.__dict__, default=lambda o: o.__dict__)


@app.route("/")
def index():
    isUserExist = len(users) != 0
    return render_template("index.html", isUserExist=isUserExist)


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username").capitalize()

    is_username_unique = True
    for user in users:
        if username == user.username:
            is_username_unique = False
            return jsonify({"success": False})
            break

    if is_username_unique == True:
        user_id = len(users) + 1
        user = User(user_id, username)
        users.append(user)
        return jsonify({"success": True, "user_id": user_id, "username": username})


@app.route("/channels")
def channels():
    return jsonify([conversation.toJson() for conversation in conversations])


@app.route("/messages/<channelId>")
def messages(channelId):
    messages = []
    for conversation in conversations:
        if conversation.id == int(channelId):
            messages = conversation.messages
            break

    json_messages = json.dumps([message.__dict__ for message in messages])

    return jsonify(json_messages)


@socketio.on("submit channel")
def create_channel(data):
    channel_id = len(conversations) + 1
    channel_name = data["channel"]
    conversation = Conversation(channel_id, channel_name)
    conversations.append(conversation)
    json_conversation = json.dumps(conversation.__dict__)

    emit("announce channel", json_conversation, broadcast=True)


@socketio.on("submit message")
def create_message(data):
    user_id = int(data["user_id"])
    message_content = data["message"]
    timestamp = data["timestamp"]
    channel_id = int(data["channel_id"])

    for conversation in conversations:
        if conversation.id == channel_id:
            if len(conversation.messages) == 0:
                message_id = 1
            else:
                message_id = conversation.messages[-1].id + 1
            break

    for user in users:
        if user.id == user_id:
            username = user.username
            break

    message = Message(
        message_id, user_id, username, message_content, channel_id, timestamp
    )

    json_message = json.dumps(message.__dict__)

    for conversation in conversations:
        if conversation.id == channel_id:
            conversation.add_message(message)
            if len(conversation.messages) > 100:
                conversation.messages = conversation.messages[-100:]
            break

    emit("announce message", json_message, broadcast=True)


@socketio.on("delete message")
def delete_message(data):
    message_id = data["message_id"]
    flag = False
    for conversation in conversations:
        index = 0
        for message in conversation.messages:
            if message.id == int(message_id):
                del conversation.messages[index]
                flag = True
                break
            index += 1
        if flag:
            break

    emit("announce delete message", {"message_id": message_id}, broadcast=True)
