'use strict';
const express = require('express');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const LiveBoard = require('./helpers/liveBoard.js');
const util = require('./helpers/utils');
var mongoose = require('mongoose');
var bluebird = require('bluebird');
mongoose.Promise = bluebird;
const passport = require('passport');
const User = require('./schemas/userSchema.js')


const port = process.env.PORT || 3000;


//connect the database
if (!process.argv[2]) {
  const db = process.env.MONGODB_URI || 'mongodb://localhost/drawmie'
  mongoose.connect(db);
  mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
  mongoose.connection.on('connected', function callback () {
    console.log('Mongoose connection open on mongodb://localhost/drawmie!');
  });
}

let peers = {};
let chatRooms = {};


//configure passport
require('./authentication/init.js')(passport);

require('./middleware.js')(app, express);

// configure our server with all the middleware and routing
require('./routes.js')(app, express);

// Server Port
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

io.on('connection', (socket) => {
  socket.on('addMeToRoom', (id) => {
    chatRooms[id] = chatRooms[id] || []
    socket.emit('fetchMessages', chatRooms[id])
    let liveBoard = util.doGetBoard(id);
    if (liveBoard) {
      socket.join(id);
      io.to(id).emit('renderme', liveBoard.board);
      socket.on('peerId', peerId => {
        peers[id] = peers[id] || [];
        peers[id].push(peerId);
        socket.emit('peers', peers[id]);
      })
      socket.on('boardChange', shapes => {
        var length = 0;
        for (var key in shapes) {
          length++;
        }
        liveBoard.reset();
        liveBoard.board.shapes = shapes;
        liveBoard.board.next = length;
        io.to(id).emit('newBoard', liveBoard.board);
      })
      socket.on('resetBoard', () => {
        liveBoard.reset();
        io.to(id).emit('newBoard', liveBoard.board)
      })
      socket.on('newStreamer', peerId => {
        let i = peers[id].indexOf(peerId);
        if (i != -1) {
          peers[id].splice(i, 1);
          peers[id].unshift(peerId);
        }
        io.to(id).emit(peers[id]);
      });
      socket.on('sendMessage', message => {
        chatRooms[id].unshift(message);
        io.to(id).emit('fetchMessages', chatRooms[id])
      });
      socket.on('clientDrawing', (data) => {
        liveBoard.loadChange(data, function(changes) {
          io.to(id).emit('renderme', changes);
        });
      });
      socket.on('peerLeave', peerId => {
        let i = peers[id].indexOf(peerId);
        if (i != -1) {
          peers[id].splice(i ,1);
        }
      })
      socket.on('disconnect', data => {
        if (io.sockets.adapter.rooms[id]) {
          peers[id] =[];
          console.log('sockets ', io.sockets.adapter.rooms[id]);
        }
      })
    }
  });
});

//export the app
module.exports = app;
