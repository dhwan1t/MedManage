module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Hospital staff joins their hospital's room
        socket.on('join:hospital', (hospitalId) => {
            socket.join(hospitalId);
            console.log(`Socket ${socket.id} joined hospital room: ${hospitalId}`);
        });

        // Ambulance operator joins their room
        socket.on('join:ambulance', (ambulanceId) => {
            socket.join(ambulanceId);
            console.log(`Socket ${socket.id} joined ambulance room: ${ambulanceId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

// All other events are emitted directly from routes via:
// const io = req.app.get('io')
// io.emit('event:name', data)
// io.to(roomId).emit('event:name', data)
