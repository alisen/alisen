const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bug 1: SQL Injection vulnerability (no input sanitization)
const users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
    { id: 2, username: 'user1', password: 'pass123', role: 'user' },
    { id: 3, username: 'user2', password: 'pass456', role: 'user' }
];

// Bug 2: Storing passwords in plain text
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Direct string concatenation vulnerable to injection
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    
    // Simulating database query
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        res.json({ message: 'Login successful', user: user });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Fixed: Path traversal vulnerability prevented
app.get('/file', (req, res) => {
    const filename = req.query.name;
    
    // Validate filename to prevent path traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).send('Invalid filename');
    }
    
    // Sanitize filename - only allow alphanumeric, dots, hyphens, and underscores
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
    
    // Use path.resolve to get absolute path and ensure it's within uploads directory
    const uploadsDir = path.resolve(__dirname, 'uploads');
    const filepath = path.resolve(uploadsDir, sanitizedFilename);
    
    // Verify the resolved path is within the uploads directory
    if (!filepath.startsWith(uploadsDir)) {
        return res.status(400).send('Invalid file path');
    }
    
    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('File not found');
        } else {
            res.send(data);
        }
    });
});

// Fixed: Optimized algorithm - O(n) complexity using Set
app.get('/duplicates', (req, res) => {
    const numbers = Array.from({ length: 10000 }, () => Math.floor(Math.random() * 1000));
    
    // Use Set for O(1) lookups
    const seen = new Set();
    const duplicates = new Set();
    
    // Single pass through array - O(n) complexity
    for (const num of numbers) {
        if (seen.has(num)) {
            duplicates.add(num);
        } else {
            seen.add(num);
        }
    }
    
    // Convert Set to Array for response
    res.json({ duplicates: Array.from(duplicates) });
});

// Bug 5: Memory leak - not clearing intervals
const intervals = [];
app.post('/monitor', (req, res) => {
    const { interval } = req.body;
    
    // Creating interval but never clearing it
    const intervalId = setInterval(() => {
        console.log('Monitoring...', new Date());
    }, interval || 1000);
    
    intervals.push(intervalId);
    res.json({ message: 'Monitoring started', id: intervals.length });
});

// Fixed: Race condition resolved using atomic operations
let counter = 0;
const counterLock = new Map(); // Simple mutex implementation

app.post('/increment', async (req, res) => {
    // Generate unique request ID for tracking
    const requestId = crypto.randomBytes(16).toString('hex');
    
    // Wait if another request is processing
    while (counterLock.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Acquire lock
    counterLock.set(requestId, true);
    
    try {
        // Simulating async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Atomic increment - read and update in one operation
        counter++;
        
        res.json({ counter: counter });
    } finally {
        // Always release lock
        counterLock.delete(requestId);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});