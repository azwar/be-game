const express = require('express');
const app = express();
const cors = require("cors");
app.use(cors());

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"],

  }
});

const users = []


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/count-joined', (req, res) => {
  res.send({ total: users.length });
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('list-players', msg => {
    socket.emit('listed-players', users);
    socket.broadcast.emit('listed-players', users);
  })
  
  socket.on('check-room', msg => {
    socket.emit('room-checked', users.length);
    socket.broadcast.emit('room-checked', users.length);
  })

  socket.on('join', ({ name }) => {
    if (users.length === 3) {
      socket.emit('room-full',)
    }

    console.log('user joined', users, socket.id)
    users.push({ name: name, id: socket.id})

    if (users.length === 3) {
      socket.broadcast.emit('start-play', 'go');
      socket.emit('start-play', 'go')
      play(users)
    } else {
      socket.broadcast.emit('joined', { total: users.length });
      socket.emit('joined', { total: users.length })
    }
  });

  const questions = [
    "What is your favorite song and why",
    "What is yout favotire food, how it taste",
    "What is your favorite movie",
  ]
  const play = (users) => {
    socket.broadcast.to(users[1]).emit('turn', questions);
    socket.broadcast.to(users[1]).emit('turn', []);
    socket.broadcast.to(users[1]).emit('turn', []);
  }

});

io.listen(3000, () => {
  console.log('listening on *:3000');
});

