const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'gestao_eventos'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'Token é necessário' });

    jwt.verify(token, 'SECRET_KEY', (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Falha na autenticação do token.' });
        req.userId = decoded.id;
        next();
    });
};

app.post('/register', (req, res) => {
    const { nome, email, senha } = req.body;
    const hashedPassword = bcrypt.hashSync(senha, 8); 
    console.log('Senha fornecida:', senha);
    console.log('Senha hash:', hashedPassword);

    db.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro ao registrar usuário.' });
        res.status(200).json({ message: 'Usuário registrado com sucesso.' });
    });
});


app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor.' });
        if (results.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const user = results[0];
        console.log('Senha fornecida:', senha);
        console.log('Senha armazenada (hash):', user.senha);
        
        const passwordIsValid = bcrypt.compareSync(senha, user.senha);
        console.log('Senha válida:', passwordIsValid);
        
        if (!passwordIsValid) return res.status(401).json({ error: 'Senha inválida.' });

        const token = jwt.sign({ id: user.id }, 'SECRET_KEY', { expiresIn: 86400 }); // 24 horas
        res.status(200).json({ auth: true, token: token });
    });
});

app.get('/eventos', verifyToken, (req, res) => {
    db.query('SELECT * FROM eventos', (err, results) => {
        if (err) return res.status(500).send('Erro ao buscar eventos.');
        res.status(200).send(results);
    });
});

app.post('/eventos', verifyToken, (req, res) => {
    const { titulo, descricao, data, local, programacao } = req.body;
    db.query('INSERT INTO eventos (titulo, descricao, data, local, programacao) VALUES (?, ?, ?, ?, ?)', [titulo, descricao, data, local, programacao], (err, result) => {
        if (err) return res.status(500).send('Erro ao criar evento.');
        res.status(200).send('Evento criado com sucesso.');
    });
});

app.put('/eventos/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, data, local, programacao } = req.body;
    db.query('UPDATE eventos SET titulo = ?, descricao = ?, data = ?, local = ?, programacao = ? WHERE id = ?', [titulo, descricao, data, local, programacao, id], (err, result) => {
        if (err) return res.status(500).send('Erro ao atualizar evento.');
        res.status(200).send('Evento atualizado com sucesso.');
    });
});

app.delete('/eventos/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM eventos WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).send('Erro ao deletar evento.');
        res.status(200).send('Evento deletado com sucesso.');
    });
});

// Rotas de inscrições
app.get('/inscricoes', verifyToken, (req, res) => {
    db.query('SELECT i.id, e.titulo AS evento, u.nome, u.email FROM inscricoes i JOIN eventos e ON i.evento_id = e.id JOIN usuarios u ON i.usuario_id = u.id', (err, results) => {
        if (err) return res.status(500).send('Erro ao buscar inscrições.');
        res.status(200).send(results);
    });
});

app.post('/inscricoes', verifyToken, (req, res) => {
    const { evento_id } = req.body;
    const usuario_id = req.userId;
    db.query('INSERT INTO inscricoes (evento_id, usuario_id) VALUES (?, ?)', [evento_id, usuario_id], (err, result) => {
        if (err) return res.status(500).send('Erro ao registrar inscrição.');
        res.status(200).send('Inscrição registrada com sucesso.');
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
