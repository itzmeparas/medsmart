const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize database
function initDb() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = { users: [], medicines: [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
}
initDb();

function readDb() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { users: [], medicines: [] };
    }
}

function writeDb(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Routes
// POST /signup
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    
    const db = readDb();
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    const newUser = { id: Date.now().toString(), name, email, password };
    db.users.push(newUser);
    writeDb(db);
    res.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});


app.post('/addMedicine', (req, res) => {
    const { userId, name, dosage, time, frequency } = req.body;
    if (!userId || !name || !dosage || !time || !frequency) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const db = readDb();
    const newMedicine = {
        id: Date.now().toString(),
        userId,
        name,
        dosage,
        time,
        frequency,
        status: 'Scheduled'
    };
    db.medicines.push(newMedicine);
    writeDb(db);
    res.json({ success: true, medicine: newMedicine });
});


app.get('/getMedicines', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    
    const db = readDb();
    const userMedicines = db.medicines.filter(m => m.userId === userId);
    res.json({ success: true, medicines: userMedicines });
});


app.put('/updateMedicine/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDb();
    const index = db.medicines.findIndex(m => m.id === id);
    if (index !== -1) {
        db.medicines[index].status = status || db.medicines[index].status;
        writeDb(db);
        res.json({ success: true, medicine: db.medicines[index] });
    } else {
        res.status(404).json({ error: 'Medicine not found' });
    }
});


app.delete('/deleteMedicine/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const initialLength = db.medicines.length;
    db.medicines = db.medicines.filter(m => m.id !== id);
    if (db.medicines.length < initialLength) {
        writeDb(db);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Medicine not found' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
