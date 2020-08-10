document.addEventListener('DOMContentLoaded', () => {
    // check if user needs to login or not
    if (!localStorage.getItem('userId')) {
        document.querySelector('#login').style.display = 'flex';
        document.querySelector('#content').style.display = 'none';
    } else {
        // check if user saved in LocalStorage exists on server
        if (isUserExist === 'True') {
            document.querySelector('#login').style.display = 'none';
            document.querySelector('#content').style.display = 'flex';
        } else {
            localStorage.removeItem('userId');
            localStorage.removeItem('channelId');
            localStorage.removeItem('username');
            document.querySelector('#login').style.display = 'flex';
            document.querySelector('#content').style.display = 'none';
        }
    }

    // get the username from localStorage
    const profile = localStorage.getItem('username');
    if (profile != null) {
        document.querySelector('#profile').innerHTML = `<b>${profile}</b>`;
    }

    // display content decided
    document.querySelector('#page').style.display = 'block';

    // By default, submit button is disabled
    document.querySelector('#login-submit').disabled = true;

    // Enable button only if there is text in the input field
    document.querySelector('#username').onkeyup = () => {
        if (document.querySelector('#username').value.length > 0) {
            document.querySelector('#login-submit').disabled = false;
        } else {
            document.querySelector('#login-submit').disabled = true;
        }
    };

    // Check if username valid and login user
    document.querySelector('#login-form').onsubmit = () => {
        const username = document.querySelector('#username').value;

        // Creat request to add new user
        const request = new XMLHttpRequest();
        request.open('POST', '/login');
        request.onload = () => {
            const data = JSON.parse(request.responseText);
            if (data.success) {
                localStorage.setItem('userId', data.user_id);
                localStorage.setItem('username', data.username);
                document.querySelector('#profile').innerHTML = `<b>${data.username}</b>`;
                document.querySelector('#login').style.display = 'none';
                document.querySelector('#content').style.display = 'flex';
            } else {
                alert('Usernam has already been taken. Please choose another one!');
            }
        };
        const data = new FormData();
        data.append('username', username);
        request.send(data);
        return false;
    };

    // Send ajax request to server to get a list of active channels
    const request = new XMLHttpRequest();
    request.open('GET', '/channels');
    request.onload = () => {
        const data = JSON.parse(request.responseText);
        if (data.length === 0) {
            document.querySelector('#first-one').style.display = 'block';
            document.querySelector('#new-message').style.display = 'none';
        } else {
            document.querySelector('#first-one').style.display = 'none';
            for (const channel of data) {
                const json_data = JSON.parse(channel);
                createChannel(json_data);
            }
        }
    };
    request.send();

    // Disable new-channel-submit button
    document.querySelector('#new-channel-submit').disabled = true;
    document.querySelector('#new-channel').onkeyup = () => {
        if (document.querySelector('#new-channel').value.length > 0) {
            document.querySelector('#new-channel-submit').disabled = false;
        } else {
            document.querySelector('#new-channel-submit').disabled = true;
        }
    };

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    socket.on('connect', () => {
        // emit channels
        document.querySelector('#new-channel-submit').onclick = () => {
            document.querySelector('#first-one').style.display = 'none';
            const channel = document.querySelector('#new-channel').value;

            // check if channel already exists
            const channelListItem = document.querySelectorAll('.list-group-item');
            let found = false;
            channelListItem.forEach(function (item) {
                if (item.innerHTML.toLowerCase() === channel.toLowerCase()) {
                    found = true;
                }
            });
            if (found === false) {
                socket.emit('submit channel', { channel: channel });
                document.querySelector('#new-channel').value = '';
            } else {
                alert('Channel already exist. Try with another name!');
            }
        };

        // emit messages
        document.querySelector('#new-message').onkeypress = function (event) {
            if (event.keyCode == 13 && this.value.length > 0) {
                const message = this.value;
                const user_id = localStorage.getItem('userId');
                const channelId = localStorage.getItem('channelId');
                const d = new Date();
                const n = d.toLocaleString();
                socket.emit('submit message', {
                    channel_id: channelId,
                    user_id: user_id,
                    message: message,
                    timestamp: n,
                });
                this.value = '';
            }
        };
    });

    // when a new channel is announce, add to unordered list
    socket.on('announce channel', (data) => {
        const channelObject = JSON.parse(data);
        let found = false;
        const channelListItem = document.querySelectorAll('.list-group-item');
        channelListItem.forEach(function (item) {
            if (item.innerHTML === channelObject.name) {
                found = true;
            }
        });
        if (!found) {
            createChannel(channelObject);
        }
    });

    // when a new message is annouce, append new message to conversation that is active (active conversation is defined by channelID stored in local storage)
    const overflowWrapper = document.querySelector('#overflow-wrapper');
    socket.on('announce message', (data) => {
        const messageObject = JSON.parse(data);
        if (localStorage.getItem('channelId') == messageObject.channel_id) {
            // for (var i = 0; i < 100; i++) {
            createMessage(messageObject);
            // }
            scrollToBottom(overflowWrapper);
        }
    });

    // Function to scroll to bottom automatically
    function scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }

    // Function to create messages
    function createMessage(message) {
        const messageContainer = document.querySelector('#message-list');
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'message');
        li.dataset.messageid = `${message.id}`;
        li.innerHTML = `<div class="flex-grow-1"><b>${message.username}</b><small class="text-muted ml-3">${message.timestamp}</small>
                    <p class="text-secondary mt-2">${message.message}</p></div>`;

        // check if this is user's own message to display the delete button
        if (message.user_id === parseInt(localStorage.getItem('userId'))) {
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'btn-warning', 'my-2', 'delete-message');
            deleteButton.innerHTML = 'Delete';
            deleteButton.onclick = deleteMessage;
            li.append(deleteButton);
            li.classList.add('bg-green');
        }
        messageContainer.append(li);
        const messagesList = document.querySelectorAll('.message');
        if (messagesList.length > 100) {
            messageContainer.removeChild(messageContainer.childNodes[0]);
        }
    }

    // Function to create channel
    function createChannel(channel) {
        const channelContainer = document.querySelector('#channels');
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'list-group-item-action', 'channel');
        li.innerHTML = channel.name;
        li.dataset.channelId = channel.id;
        li.onclick = selectChannelHandler;
        // check if this li is an active channel on the last visit
        const activeChannelId = localStorage.getItem('channelId');
        if (!activeChannelId) {
            document.querySelector('#join-later').style.display = 'block';
            document.querySelector('#new-message').style.display = 'none';
        } else if (channel.id === parseInt(activeChannelId)) {
            li.classList.add('list-group-item-warning');
            loadMessages(activeChannelId);
        }
        channelContainer.append(li);
    }

    // Function change bg-color of channel when clicked (to be reused)
    function selectChannelHandler() {
        document.querySelector('#join-later').style.display = 'none';
        document.querySelector('#new-message').style.display = 'block';
        const channelListItem = document.querySelectorAll('.list-group-item');
        channelListItem.forEach(function (channel) {
            channel.classList.remove('list-group-item-warning');
        });
        this.classList.add('list-group-item-warning');
        // Save active channel to localStorage
        localStorage.setItem('channelId', this.dataset.channelId);
        // delete all message of current conversation
        document.querySelector('#message-list').innerHTML = '';
        loadMessages(this.dataset.channelId);
    }

    // Function to load messages of the active channel when clicked
    function loadMessages(channelId) {
        const request = new XMLHttpRequest();
        request.open('GET', `/messages/${channelId}`);
        request.onload = () => {
            const data = JSON.parse(request.responseText);
            const json_data = JSON.parse(data);
            for (const message of json_data) {
                if (localStorage.getItem('channelId') == message.channel_id) {
                    createMessage(message);
                }
            }
        };
        request.send();
    }

    function deleteMessage() {
        socket.emit('delete message', {
            message_id: this.parentElement.dataset.messageid,
        });

        socket.on('announce delete message', (data) => {
            // document.querySelector('[data-messageid="' + data.message_id + '"]').remove();
            const element = document.querySelector('[data-messageid="' + data.message_id + '"]');
            element.style.animationPlayState = 'running';
            element.addEventListener('animationend', () => {
                element.remove();
            });
        });
    }
});
