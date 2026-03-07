module.exports = (io) => {
  io.on("connection", (socket) => {
    const { userId, role, hospitalId, ambulanceId } = socket.user;
    console.log(`Client connected: ${socket.id} | user=${userId} role=${role}`);

    // ── Auto-join rooms based on JWT claims ──

    // Hospital staff automatically join their hospital's room (P1-03 fix)
    if (role === "hospital" && hospitalId) {
      socket.join(hospitalId.toString());
      console.log(
        `Socket ${socket.id} auto-joined hospital room: ${hospitalId}`,
      );
    }

    // Ambulance operators automatically join their ambulance's room
    if (role === "ambulance" && ambulanceId) {
      socket.join(ambulanceId.toString());
      console.log(
        `Socket ${socket.id} auto-joined ambulance room: ${ambulanceId}`,
      );
    }

    // Admins join a shared admin room for broadcast events
    if (role === "admin") {
      socket.join("admin");
      console.log(`Socket ${socket.id} auto-joined admin room`);
    }

    // ── Manual room joins (with authorization checks) ──

    // Hospital staff can explicitly join their hospital's room
    // (redundant with auto-join above, but kept for backwards compat)
    socket.on("join:hospital", (requestedHospitalId) => {
      if (role !== "hospital" && role !== "admin") {
        socket.emit("error", {
          msg: "Access denied: only hospital staff or admins can join hospital rooms",
        });
        return;
      }

      // Hospital users can only join their own hospital's room
      if (
        role === "hospital" &&
        hospitalId &&
        requestedHospitalId !== hospitalId.toString()
      ) {
        socket.emit("error", {
          msg: "Access denied: you can only join your own hospital room",
        });
        return;
      }

      socket.join(requestedHospitalId);
      console.log(
        `Socket ${socket.id} joined hospital room: ${requestedHospitalId}`,
      );
    });

    // Ambulance operator can explicitly join their ambulance room
    socket.on("join:ambulance", (requestedAmbulanceId) => {
      if (role !== "ambulance" && role !== "admin") {
        socket.emit("error", {
          msg: "Access denied: only ambulance operators or admins can join ambulance rooms",
        });
        return;
      }

      if (
        role === "ambulance" &&
        ambulanceId &&
        requestedAmbulanceId !== ambulanceId.toString()
      ) {
        socket.emit("error", {
          msg: "Access denied: you can only join your own ambulance room",
        });
        return;
      }

      socket.join(requestedAmbulanceId);
      console.log(
        `Socket ${socket.id} joined ambulance room: ${requestedAmbulanceId}`,
      );
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id} | user=${userId}`);
    });
  });
};

// All other events are emitted directly from routes via:
// const io = req.app.get('io')
// io.to(roomId).emit('event:name', data)   — targeted to a specific room
// io.to('admin').emit('event:name', data)   — broadcast to admin room
