const express = require('express');
const app = express();
const cors = require("cors");
app.use(cors());

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { shuffle } = require('./src/utils');

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    allowedHeaders: ["Access-Control-Allow-Origin"],
  }
});

const users = []
const selectedQuestions = []
let currentUser = 0

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

  socket.on('select-question', data => {
    const { question } = data;
    selectedQuestions.push(question);
    socket.emit('question-selected', data);
    socket.broadcast.emit('question-selected', data);
  })

  socket.on('shuffle', data => {
    play(users)
  })
  
  socket.on('next-turn', data => {
    if (currentUser === 2) { // index 2
      currentUser = 0
    } else {
      currentUser = currentUser + 1
    }

    play(users)
  })

  socket.on('join', ({ name }) => {
    if (users.length === 3) {
      socket.emit('room-full')
      return
    }
    const socketId = socket.id

    socket.join('room');
    socket.join(socketId)
    console.log('user joined', users, socketId)
    users.push({ name: name, id: socketId})

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
    "What is your favorite song and why?",
    "What is yout favotire food, how it taste?",
    "What is your favorite movie?",
    "Tell us about your hobby(ies)?",
    "Do you have hard to forget memory as a child?",
    "Where you will go for vacation for next time?",
    "Where is your favorite place to go?",
    "What animal do you like, and why?",
    "What weather do you like?",
    "What is your favorite gadget?",
  ]

  const play = (users) => {
    const randomQuestions = shuffle(questions)
    const selectedQuestion = randomQuestions.splice(0, 3)

    try {
      for (let index = 0; index < users.length; index++) {
        const user = users[index];

        console.log('Sending question to', user)        
        
        if (index === currentUser) {
          io.to(user.id).emit('turn', selectedQuestion);
        } else {
          io.to(user.id).emit('turn', []);
        }
      }
    } catch (error) {
      console.log('error', error)
    }
  }
});

io.listen(3000, () => {
  console.log('listening on *:3000');
});

