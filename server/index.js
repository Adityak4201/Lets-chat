const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const {addUser, removeUser, getUser, getUsersinRoom} = require('./users.js');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {cors: {origin:"*", methods: ["GET", "POST"], credentials: true}});


io.on('connection', (socket) => {
    socket.on('join', ({name, room}, callback) => {
        const {user, error} = addUser({id: socket.id, name, room});

        if(error) return callback(error);

        socket.emit('message',{user: 'admin', text:`${user.name}, welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text:`${user.name} has joined the chat!!`});

        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersinRoom(user.room)});

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        let user = getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});
        io.to(user.room).emit('roomData', {room: user.room, users: getUsersinRoom(user.room)});

        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message',{user:'admin', text:`${user.name} has left the room`});
        }
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server now running on port ${PORT}`));