const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  // 'http://localhost:5173',                // Local development (removed for production)
  'https://bolt-frontend-k834.onrender.com', // Render frontend
  'https://winddrop.tech',                  // Custom domain
  'http://139.59.38.179:3000',             // DigitalOcean server
  'https://139.59.38.179:3000',            // DigitalOcean server (HTTPS)
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  }
});

// Store active rooms
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('room:create', ({ code, device }) => {
    // Check if room already exists
    if (rooms.has(code)) {
      socket.emit('room:error', 'Room already exists');
      return;
    }

    // Create new room with socket ID
    const room = {
      id: code,
      code,
      devices: [{ ...device, socketId: socket.id }],
      host: device.id,
      createdAt: new Date()
    };

    rooms.set(code, room);
    socket.join(code);
    
    socket.emit('room:joined', { room, isHost: true });
    socket.to(code).emit('room:updated', { room });
  });

  socket.on('room:join', ({ code, device }) => {
    const room = rooms.get(code);
    
    if (!room) {
      socket.emit('room:error', 'Room not found');
      return;
    }

    if (room.devices.length >= 2) {
      socket.emit('room:error', 'Room is full');
      return;
    }

    // Add device to room with socket ID
    room.devices.push({ ...device, socketId: socket.id });
    socket.join(code);
    
    socket.emit('room:joined', { room, isHost: false });
    socket.to(code).emit('room:updated', { room });
  });

  socket.on('room:leave', () => {
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );

    if (room) {
      // Remove the device from the room
      room.devices = room.devices.filter(d => d.socketId !== socket.id);
      
      if (room.devices.length === 0) {
        // Delete empty room
        rooms.delete(room.code);
      } else if (room.host === socket.id) {
        // Assign new host
        room.host = room.devices[0].id;
        room.devices[0].isHost = true;
      }

      // Leave the socket room
      socket.leave(room.code);
      
      // Notify all remaining devices in the room
      io.to(room.code).emit('room:updated', { room });
      
      // Notify the leaving device
      socket.emit('room:left');
    }
  });

  socket.on('transfer:text', ({ transfer, receiverId }) => {
    console.log('Received text transfer:', { transfer, receiverId, senderSocketId: socket.id }); // Debug log

    // Find the room the sender is in
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );
    
    if (room) {
      // Find the receiver's socket ID
      const receiver = room.devices.find(d => d.id === receiverId);
      console.log('Found receiver for text transfer:', receiver); // Debug log

      if (receiver) {
        // Make sure we're not sending to ourselves
        if (receiver.socketId === socket.id) {
          console.log('Preventing self-transfer of text'); // Debug log
          return;
        }

        // Send transfer to receiver
        socket.to(receiver.socketId).emit('transfer:received', transfer);
        console.log('Sent text transfer to receiver:', receiver.socketId); // Debug log
      } else {
        console.log('Receiver not found in room for text transfer'); // Debug log
      }
    } else {
      console.log('Room not found for sender of text transfer'); // Debug log
    }
  });

  socket.on('transfer:start', ({ transfer, receiverId }) => {
    console.log('Received transfer start:', { transfer, receiverId, senderSocketId: socket.id }); // Debug log

    // Find the room the sender is in
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );
    
    if (room) {
      // Find the receiver's socket ID
      const receiver = room.devices.find(d => d.id === receiverId);
      console.log('Found receiver for transfer:', receiver); // Debug log

      if (receiver) {
        // Make sure we're not sending to ourselves
        if (receiver.socketId === socket.id) {
          console.log('Preventing self-transfer'); // Debug log
          return;
        }

        // Send transfer metadata to receiver
        socket.to(receiver.socketId).emit('transfer:received', transfer);
        console.log('Sent transfer metadata to receiver:', receiver.socketId); // Debug log

        // Acknowledge to sender that metadata was sent
        socket.emit('transfer:metadata_sent', { transferId: transfer.id });
      } else {
        console.log('Receiver not found in room'); // Debug log
      }
    } else {
      console.log('Room not found for sender'); // Debug log
    }
  });

  socket.on('transfer:chunk', ({ transferId, chunk, offset, total, chunkNumber, totalChunks, receiverId }, ack) => {
    console.log('Received file chunk:', { 
      transferId, 
      offset, 
      total, 
      chunkNumber,
      totalChunks,
      chunkSize: chunk.byteLength || chunk.length,
      senderSocketId: socket.id
    });

    // Find the room the sender is in
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );
    
    if (room) {
      // Find the receiver's socket ID
      const receiver = room.devices.find(d => d.id === receiverId);
      console.log('Found receiver for file transfer:', receiver);

      if (receiver) {
        // Make sure we're not sending to ourselves
        if (receiver.socketId === socket.id) {
          console.log('Preventing self-transfer of file');
          if (ack) ack();
          return;
        }

        // Send chunk to receiver
        socket.to(receiver.socketId).emit('transfer:chunk', { 
          transferId, 
          chunk, 
          offset, 
          total,
          chunkNumber,
          totalChunks
        });
        
        // Calculate and emit progress
        const progress = Math.round((chunkNumber / totalChunks) * 100);
        socket.emit('transfer:progress', { id: transferId, progress });
        socket.to(receiver.socketId).emit('transfer:progress', { id: transferId, progress });
        
        console.log('Sent file chunk to receiver:', { 
          receiverSocketId: receiver.socketId,
          progress,
          chunkNumber,
          totalChunks
        });
        if (ack) ack(); // Acknowledge to sender
      } else {
        console.log('Receiver not found in room for file transfer');
        if (ack) ack();
      }
    } else {
      console.log('Room not found for sender of file transfer');
      if (ack) ack();
    }
  });

  socket.on('transfer:file', ({ transferId, fileData, fileName, fileType, receiverId }) => {
    console.log('Received file data:', { 
      transferId, 
      fileName, 
      fileType,
      fileSize: fileData.byteLength || fileData.length,
      senderSocketId: socket.id
    }); // Debug log

    // Find the room the sender is in
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );
    
    if (room) {
      // Find the receiver's socket ID
      const receiver = room.devices.find(d => d.id === receiverId);
      console.log('Found receiver for file transfer:', receiver); // Debug log

      if (receiver) {
        // Make sure we're not sending to ourselves
        if (receiver.socketId === socket.id) {
          console.log('Preventing self-transfer of file'); // Debug log
          return;
        }

        // Send file data to receiver
        socket.to(receiver.socketId).emit('transfer:file', { 
          transferId, 
          fileData,
          fileName,
          fileType
        });
        
        // Update progress to 100%
        socket.emit('transfer:progress', { id: transferId, progress: 100 });
        socket.to(receiver.socketId).emit('transfer:progress', { id: transferId, progress: 100 });
        
        console.log('Sent file data to receiver:', { 
          receiverSocketId: receiver.socketId,
          fileName
        }); // Debug log
      } else {
        console.log('Receiver not found in room for file transfer'); // Debug log
      }
    } else {
      console.log('Room not found for sender of file transfer'); // Debug log
    }
  });

  socket.on('transfer:complete', ({ transferId, receiverId }) => {
    console.log('Transfer complete:', { transferId, senderSocketId: socket.id });

    // Find the room the sender is in
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );
    
    if (room) {
      // Find the receiver's socket ID
      const receiver = room.devices.find(d => d.id === receiverId);
      if (receiver) {
        // Make sure we're not sending to ourselves
        if (receiver.socketId === socket.id) {
          console.log('Preventing self-transfer completion');
          return;
        }

        // Notify receiver that transfer is complete
        socket.to(receiver.socketId).emit('transfer:complete', { transferId });
        
        // Update progress to 100%
        socket.emit('transfer:progress', { id: transferId, progress: 100 });
        socket.to(receiver.socketId).emit('transfer:progress', { id: transferId, progress: 100 });
        
        console.log('Notified receiver of transfer completion:', receiver.socketId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Handle cleanup in room:leave event
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );

    if (room) {
      room.devices = room.devices.filter(d => d.socketId !== socket.id);
      
      if (room.devices.length === 0) {
        rooms.delete(room.code);
      } else if (room.host === socket.id) {
        room.host = room.devices[0].id;
        room.devices[0].isHost = true;
      }

      io.to(room.code).emit('room:updated', { room });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 