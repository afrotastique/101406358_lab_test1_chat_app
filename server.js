const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');

// Connect to MongoDB'
const CONNECTION_STRING = "mongodb+srv://admin:admin@cluster0.qdglhd3.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});


// Define user schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Parse JSON bodies
app.use(express.json());

// Handle signup POST request
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists. Please choose another one.' });
        }

        // Create new user
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ message: 'Signup successful. You can now login.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
});

// app.listen(PORT, () => {
//     console.log(`Server listening on http://localhost:${PORT}/`);
// });


//////////////////////////////////////////

const express_server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}/`);
})

const ioServer = require('socket.io')(express_server);

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// })

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/group_chat.html');
})

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/signup.html');
// })

ioServer.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('say_hello', (msg) => {
        console.log(msg);
        //ioServer.emit('welcome', msg)//broadcast to all
        socket.emit('welcome', msg)
    })

    socket.on('chat_message', (msg) => {
        ioServer.emit('chat_message', msg);
    });

    //Join a room
    socket.on('join_group', (room) => {
        console.log(`User ${socket.id} joined room ${room}`)
        socket.join(room);
    })

    //Send message to a room
    socket.on('group_message', (data) => {
        console.log(`User ${socket.id} sent message to room ${data.group}`)
        ioServer.to(data.group).emit('group_message_client', data.message)
    });

    //Leave a room
    socket.on('leave_group', (group) => {
        socket.leave(group);
    })

    //socket.broadcast.emit('chat_message', 'A new user has joined the chat');

})


