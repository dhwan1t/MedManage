const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mediroute')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/public'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/ambulance', require('./routes/ambulance'));
app.use('/api/hospital', require('./routes/hospital'));
app.use('/api/admin', require('./routes/admin'));

require('./sockets/socketHandler')(io);

app.set('io', io);

server.listen(5000, () => console.log('Server running on port 5000'));
