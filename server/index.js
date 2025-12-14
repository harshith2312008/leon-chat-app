const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// API Routes
app.get('/', (req, res) => {
    res.send('Leon Chat Server is running');
});

// Register
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, username });
    });
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).json({ error: 'Invalid password' });

        res.json({ id: user.id, username: user.username });
    });
});

// Search Users (exclude self and already friends/requested)
app.get('/users/search', (req, res) => {
    const { query, userId } = req.query; // userId of requester
    if (!query) return res.json([]);

    const sql = `
        SELECT id, username FROM users 
        WHERE username LIKE ? 
        AND id != ?
        AND id NOT IN (
            SELECT receiver_id FROM friend_requests WHERE sender_id = ?
            UNION 
            SELECT sender_id FROM friend_requests WHERE receiver_id = ?
        )
    `;

    db.all(sql, [`%${query}%`, userId, userId, userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Send Friend Request
app.post('/friend-request', (req, res) => {
    const { senderId, receiverId } = req.body;
    db.run(`INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)`, [senderId, receiverId], (err) => {
        if (err) {
            // Check for unique constraint violation (already requested)
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Request already sent' });
            }
            return res.status(500).json({ error: err.message });
        }

        // Real-time notification
        io.to(receiverId.toString()).emit('new_friend_request');

        res.json({ success: true });
    });
});

// Get Pending Requests (Received)
app.get('/friend-requests/pending/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = `
        SELECT fr.id, u.username, fr.created_at 
        FROM friend_requests fr
        JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
    `;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Accept/Reject Request
app.put('/friend-request/:id', (req, res) => {
    const { status } = req.body; // 'accepted' or 'rejected'
    const { id } = req.params;

    // First get the request to know sender/receiver
    db.get(`SELECT sender_id, receiver_id FROM friend_requests WHERE id = ?`, [id], (err, row) => {
        if (err || !row) return res.status(500).json({ error: 'Request not found' });

        const { sender_id, receiver_id } = row;

        db.run(`UPDATE friend_requests SET status = ? WHERE id = ?`, [status, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            if (status === 'accepted') {
                // Notify both users to update their contact lists
                io.to(sender_id.toString()).emit('friend_request_accepted');
                io.to(receiver_id.toString()).emit('friend_request_accepted');
            }

            res.json({ success: true });
        });
    });
});

// Get Friends (for chat list)
app.get('/friends/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = `
        SELECT u.id, u.username 
        FROM users u
        JOIN friend_requests fr ON (fr.sender_id = u.id OR fr.receiver_id = u.id)
        WHERE (fr.sender_id = ? OR fr.receiver_id = ?)
        AND fr.status = 'accepted'
        AND u.id != ?
    `;
    db.all(sql, [userId, userId, userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Old Get All Users (Deprecated but kept for safety if needed, or remove)
// app.get('/users', ...

// Get Messages between two users
app.get('/messages/:u1/:u2', (req, res) => {
    const { u1, u2 } = req.params;
    const sql = `
        SELECT m.id, m.sender_id, m.receiver_id, m.content, m.timestamp
        FROM messages m
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.timestamp ASC
    `;
    db.all(sql, [u1, u2, u2, u1], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Map to client format
        const messages = rows.map(r => ({
            id: r.id,
            senderId: r.sender_id,
            receiverId: r.receiver_id,
            content: r.content,
            timestamp: r.timestamp
        }));

        res.json(messages);
    });
});

// Socket.io Logic
// Store active sockets: userId -> socketId
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins with their ID
    socket.on('join', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} joined as ${socket.id}`);
        socket.join(userId.toString()); // Join a room room named after the user ID
    });

    // Send private message
    socket.on('private_message', ({ senderId, receiverId, content }) => {
        const timestamp = new Date().toISOString();

        // Save to DB
        db.run(`INSERT INTO messages (sender_id, receiver_id, content, timestamp) VALUES (?, ?, ?, ?)`,
            [senderId, receiverId, content, timestamp],
            (err) => {
                if (err) console.error('Error saving message:', err.message);
            }
        );

        // Emit to receiver if online
        // We can just use to(receiverId) since we made them join a room
        io.to(receiverId.toString()).emit('receive_message', {
            senderId,
            content,
            timestamp
        });

        // Also emit back to sender (optional, if they want confirmation or for multi-device)
        // For now, client assumes sent.
    });

    socket.on('disconnect', () => {
        // Remove user from map
        for (const [uid, sid] of connectedUsers.entries()) {
            if (sid === socket.id) {
                connectedUsers.delete(uid);
                console.log(`User ${uid} disconnected`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
