const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://winddrop.app',
  'https://www.winddrop.app',
  'https://winddrop.tech',
  'https://www.winddrop.tech',
  'https://bolt-frontend-k834.onrender.com',
  'http://139.59.38.179:3000',
  'https://139.59.38.179:3000',
];

const customOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [...defaultOrigins, ...customOrigins];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Server-to-server or tools
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Automatically allow any winddrop domain or subdomain (*.winddrop.app)
  if (/^https:\/\/([a-z0-9-]+\.)*winddrop\.(app|tech)$/.test(origin)) return true;
  // Automatically allow any Render domain (*.onrender.com)
  if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return true;
  // Automatically allow localhost during testing
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
};

app.use(cors(corsOptions));

// Health check and root endpoints
app.get('/', (req, res) => {
  res.send('Device Connectivity WebSocket Server is running.');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Store active rooms
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  socket.on('room:create', ({ code, device }) => {
    console.log('📝 Room creation attempt:', { code, deviceName: device.name, socketId: socket.id });
    
    // Check if room already exists
    if (rooms.has(code)) {
      console.log('❌ Room already exists:', code);
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
    
    console.log('✅ Room created successfully:', { code, deviceName: device.name });
    socket.emit('room:joined', { room, isHost: true });
    socket.to(code).emit('room:updated', { room });
  });

  socket.on('room:join', ({ code, device }) => {
    console.log('🚪 Room join attempt:', { code, deviceName: device.name, socketId: socket.id });
    
    const room = rooms.get(code);
    
    if (!room) {
      console.log('❌ Room not found:', code);
      socket.emit('room:error', 'Room not found');
      return;
    }

    if (room.devices.length >= 2) {
      console.log('❌ Room is full:', code);
      socket.emit('room:error', 'Room is full');
      return;
    }

    // Add device to room with socket ID
    room.devices.push({ ...device, socketId: socket.id });
    socket.join(code);
    
    console.log('✅ Room joined successfully:', { code, deviceName: device.name, totalDevices: room.devices.length });
    socket.emit('room:joined', { room, isHost: false });
    socket.to(code).emit('room:updated', { room });
  });

  socket.on('room:leave', () => {
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );

    if (room) {
      console.log('👋 Device leaving room:', { code: room.code, socketId: socket.id });
      
      // Remove the device from the room
      room.devices = room.devices.filter(d => d.socketId !== socket.id);
      
      if (room.devices.length === 0) {
        // Delete empty room
        console.log('🗑️ Deleting empty room:', room.code);
        rooms.delete(room.code);
      } else if (room.host === socket.id) {
        // Assign new host
        room.host = room.devices[0].id;
        room.devices[0].isHost = true;
        console.log('👑 New host assigned in room:', room.code);
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
    console.log('📤 Text transfer initiated:', { 
      transferId: transfer.id, 
      content: transfer.content.substring(0, 50) + '...', 
      senderSocketId: socket.id 
    });

    // Find the room the sender is in
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );
    
    if (room) {
      // Find the receiver's socket ID
      const receiver = room.devices.find(d => d.id === receiverId);
      console.log('📤 Found receiver for text transfer:', receiver?.name);

      if (receiver) {
        // Make sure we're not sending to ourselves
        if (receiver.socketId === socket.id) {
          console.log('⚠️ Preventing self-transfer of text');
          return;
        }

        // Send transfer to receiver
        socket.to(receiver.socketId).emit('transfer:received', transfer);
        console.log('✅ Text transfer sent to receiver:', receiver.socketId);
      } else {
        console.log('❌ Receiver not found in room for text transfer');
      }
    } else {
      console.log('❌ Room not found for sender of text transfer');
    }
  });

  socket.on('transfer:start', ({ transfer, receiverId }) => {
    console.log('📁 File transfer started:', { 
      transferId: transfer.id, 
      fileName: transfer.fileName, 
      fileSize: transfer.fileSize,
      senderSocketId: socket.id 
    });

    // Enforce 150MB file size limit
    const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB
    if (transfer.fileSize > MAX_FILE_SIZE) {
      console.log('❌ File too large. Rejecting transfer:', transfer.fileName);
      socket.emit('transfer:error', 'File too large. Maximum allowed size is 150MB.');
      return;
    }

    // Find the room the sender is in
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );
    
    if (room) {
      // Find the receiver's socket ID
      const receiver = room.devices.find(d => d.id === receiverId);
      console.log('📁 Found receiver for file transfer:', receiver?.name);

      if (receiver) {
        // Make sure we're not sending to ourselves
        if (receiver.socketId === socket.id) {
          console.log('⚠️ Preventing self-transfer');
          return;
        }

        // Send transfer metadata to receiver
        socket.to(receiver.socketId).emit('transfer:received', transfer);
        console.log('✅ File transfer metadata sent to receiver:', receiver.socketId);

        // Acknowledge to sender that metadata was sent
        socket.emit('transfer:metadata_sent', { transferId: transfer.id });
      } else {
        console.log('❌ Receiver not found in room');
      }
    } else {
      console.log('❌ Room not found for sender');
    }
  });

  socket.on('transfer:chunk', ({ transferId, chunk, offset, total, chunkNumber, totalChunks, receiverId }, ack) => {
    console.log('📦 File chunk received:', { 
      transferId, 
      chunkNumber,
      totalChunks,
      chunkSize: chunk.byteLength || chunk.length,
      progress: Math.round((chunkNumber / totalChunks) * 100) + '%',
      senderSocketId: socket.id
    });

    // Find the room the sender is in
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );
    
    if (room) {
      // Find the receiver's socket ID
      const receiver = room.devices.find(d => d.id === receiverId);
      console.log('📦 Forwarding chunk to receiver:', receiver?.name);

      if (receiver) {
        // Make sure we're not sending to ourselves
        if (receiver.socketId === socket.id) {
          console.log('⚠️ Preventing self-transfer of file');
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
        
        console.log('✅ Chunk forwarded successfully:', { 
          receiverSocketId: receiver.socketId,
          progress: progress + '%',
          chunkNumber,
          totalChunks
        });
        if (ack) ack(); // Acknowledge to sender
      } else {
        console.log('❌ Receiver not found in room for file transfer');
        if (ack) ack();
      }
    } else {
      console.log('❌ Room not found for sender of file transfer');
      if (ack) ack();
    }
  });

  socket.on('transfer:file', ({ transferId, fileData, fileName, fileType, receiverId }) => {
    console.log('📁 File data received:', { 
      transferId, 
      fileName, 
      fileType,
      fileSize: fileData.byteLength || fileData.length,
      senderSocketId: socket.id
    });

    // Find the room the sender is in
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );
    
    if (room) {
      // Find the receiver's socket ID
      const receiver = room.devices.find(d => d.id === receiverId);
      console.log('📁 Found receiver for file transfer:', receiver?.name);

      if (receiver) {
        // Make sure we're not sending to ourselves
        if (receiver.socketId === socket.id) {
          console.log('⚠️ Preventing self-transfer of file');
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
        
        console.log('✅ File data sent to receiver:', { 
          receiverSocketId: receiver.socketId,
          fileName
        });
      } else {
        console.log('❌ Receiver not found in room for file transfer');
      }
    } else {
      console.log('❌ Room not found for sender of file transfer');
    }
  });

  socket.on('transfer:complete', ({ transferId, receiverId }) => {
    console.log('✅ File transfer completed:', { transferId, senderSocketId: socket.id });

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
          console.log('⚠️ Preventing self-transfer completion');
          return;
        }

        // Notify receiver that transfer is complete
        socket.to(receiver.socketId).emit('transfer:complete', { transferId });
        
        // Update progress to 100%
        socket.emit('transfer:progress', { id: transferId, progress: 100 });
        socket.to(receiver.socketId).emit('transfer:progress', { id: transferId, progress: 100 });
        
        console.log('✅ Transfer completion notified to receiver:', receiver.socketId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
    // Handle cleanup in room:leave event
    const room = Array.from(rooms.values()).find(r => 
      r.devices.some(d => d.socketId === socket.id)
    );

    if (room) {
      console.log('🧹 Cleaning up disconnected device from room:', room.code);
      room.devices = room.devices.filter(d => d.socketId !== socket.id);
      
      if (room.devices.length === 0) {
        console.log('🗑️ Deleting empty room after disconnect:', room.code);
        rooms.delete(room.code);
      } else if (room.host === socket.id) {
        room.host = room.devices[0].id;
        room.devices[0].isHost = true;
        console.log('👑 New host assigned after disconnect in room:', room.code);
      }

      io.to(room.code).emit('room:updated', { room });
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 