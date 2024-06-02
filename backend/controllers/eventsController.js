const connection = require('../models/db');

const getEvents = (req, res) => {
    const query = 'SELECT * FROM events';
    connection.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

const createEvent = (req, res) => {
    const { title, description, date, location, schedule, created_by } = req.body;
    const query = 'INSERT INTO events (title, description, date, location, schedule, created_by) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(query, [title, description, date, location, schedule, created_by], (err, results) => {
        if (err) throw err;
        res.json({ message: 'Event created successfully' });
    });
};

module.exports = { getEvents, createEvent };

