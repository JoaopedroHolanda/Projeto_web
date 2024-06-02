const connection = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    connection.query(query, [email], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;

                if (isMatch) {
                    const token = jwt.sign({ id: user.id }, 'secretkey', { expiresIn: '1h' });
                    res.json({ token });
                } else {
                    res.status(400).json({ message: 'Invalid password' });
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
};

const register = (req, res) => {
    const { email, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) throw err;

        const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
        connection.query(query, [email, hash], (err, results) => {
            if (err) throw err;
            res.json({ message: 'User registered successfully' });
        });
    });
};

module.exports = { login, register };
