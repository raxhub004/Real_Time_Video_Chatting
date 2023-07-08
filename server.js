const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
require('./auth');

function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401);
  }
  
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const server = require('http').Server(app);
const io = require('socket.io')(server);

const { v4: uuidV4 } = require('uuid');

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use('/peerjs', peerServer);

let USER_LIST = [];
let ROOM_ID;

// Rendering a new room on a new connection
app.get('/', (req, res) => {
    ROOM_ID=uuidV4();
    if (req.user) {
        res.render(`index`, { ROOM_ID: ROOM_ID, username: req.user.displayName })
    } else
        res.render('not_login')
})

  
// app.listen(5000, () => console.log('listening on port: 5000'));

// Rendering the requested room
app.get('/:room', (req, res) => {
    ROOM_ID = req.params.room;
    console.log(ROOM_ID);
    if (req.user) {
        //sending the room.ejs view
        console.log(req.user.displayName);
        res.render('room', { roomId: ROOM_ID, username: req.user.displayName })
    } else
        res.render('not_login')
})


// On connecting to a new client
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId,username) => {

        console.log(userId);
        socket.join(roomId);
        USER_LIST.push({roomId: roomId , userId : userId ,username : username})
        console.log(USER_LIST);
        socket.broadcast.to(roomId).emit('user-connected', userId);
        // socket.to(roomId).emit('user-connected', userId);

        // Sending a new message to common chat
        socket.on('sendMessage', (message) => {
            io.to(roomId).emit('addNewMessage', message);
            // socket.broadcast.emit('receive', data)
        })

        // On disconnecting
        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        })
    })
})

app.get('/auth/google/failure', (req, res) => {
    res.send('Failed to authenticate..');
  });

app.get('/auth/google',
passport.authenticate('google', { scope: [ 'email', 'profile' ],prompt: 'select_account' }
));

app.get( '/google/callback',
passport.authenticate( 'google', {
successRedirect: (ROOM_ID) ? `/${ROOM_ID}` : '/',
failureRedirect: '/auth/google/failure'
})
);

server.listen(process.env.PORT||5000)

