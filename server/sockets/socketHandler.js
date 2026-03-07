const Ambulance = require('../models/Ambulance');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Join a specific room based on user role/ID
        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // Ambulance updating its location
        socket.on('update-location', async (data) => {
            try {
                const { ambulanceId, coordinates } = data;

                // Update DB
                const ambulance = await Ambulance.findById(ambulanceId);
                if (ambulance) {
                    ambulance.currentLocation.coordinates = coordinates;
                    await ambulance.save();
                }

                // Broadcast to admins or specific hospital rooms
                io.to('admin-room').emit('location-updated', {
                    ambulanceId,
                    coordinates
                });
            } catch (err) {
                console.error('Error updating location via socket', err);
            }
        });

        // Emitting case assignments
        socket.on('case-assigned', (data) => {
            const { ambulanceId, caseId } = data;
            // Emit to the specific ambulance room
            io.to(ambulanceId).emit('new-case', { caseId });
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};
