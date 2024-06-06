const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const PDFDocument = require('pdfkit')

const app = express()
app.use(bodyParser.json())
app.use(cors())

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'gestao_eventos'
})

db.connect(err => {
    if (err) throw err
    console.log('Conectado ao MySQL')
})

const verificarToken = (req, res, next) => {
    const token = req.headers['authorization']
    if (!token) return res.status(403).json({ erro: 'Token é necessário' })

    jwt.verify(token, 'SECRET_KEY', (err, decoded) => {
        if (err) {
            return res.status(500).json({ erro: 'Falha na autenticação do token' })
        }
        req.userId = decoded.id
        next()
    })
}

app.post('/register', (req, res) => {
    const { nome, email, senha } = req.body
    const senhaHash = bcrypt.hashSync(senha, 8)
    console.log('Senha fornecida:', senha)
    console.log('Senha hash:', senhaHash)

    db.query('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', [nome, email, senhaHash], (err, result) => {
        if (err) return res.status(500).json({ erro: 'Erro ao registrar usuário' })
        res.status(200).json({ mensagem: 'Usuário registrado com sucesso' })
    })
})

app.post('/login', (req, res) => {
    const { email, senha } = req.body

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro no servidor' })
        if (results.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' })

        const user = results[0]
        console.log('Senha fornecida:', senha)
        console.log('Senha armazenada (hash):', user.senha)
        
        const senhaValida = bcrypt.compareSync(senha, user.senha)
        console.log('Senha válida:', senhaValida)
        
        if (!senhaValida) return res.status(401).json({ erro: 'Senha inválida' })

        const token = jwt.sign({ id: user.id }, 'SECRET_KEY', { expiresIn: 86400 })
        res.status(200).json({ auth: true, token })
    })
})

app.get('/eventos', verificarToken, (req, res) => {
    db.query('SELECT * FROM eventos', (err, results) => {
        if (err) return res.status(500).send('Erro ao buscar eventos')
        res.status(200).send(results)
    })
})

app.post('/eventos', verificarToken, (req, res) => {
    const { titulo, descricao, data, local, programacao } = req.body
    const usuario_id = req.userId

    db.query('INSERT INTO eventos (titulo, descricao, data, local, programacao, usuario_id) VALUES (?, ?, ?, ?, ?, ?)', 
    [titulo, descricao, data, local, programacao, usuario_id], (err, result) => {
        if (err) return res.status(500).json({ erro: 'Erro ao criar evento' })
        res.status(200).json({ mensagem: 'Evento criado com sucesso' })
    })
})

app.delete('/eventos/:id', verificarToken, (req, res) => {
    const { id } = req.params
    const usuario_id = req.userId

    db.query('SELECT * FROM eventos WHERE id = ? AND usuario_id = ?', [id, usuario_id], (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao verificar permissão' })
        if (results.length === 0) return res.status(403).json({ erro: 'Você não tem permissão para deletar este evento' })

        db.query('DELETE FROM inscricoes WHERE evento_id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ erro: 'Erro ao deletar inscrições' })

            db.query('DELETE FROM eventos WHERE id = ? AND usuario_id = ?', [id, usuario_id], (err, result) => {
                if (err) return res.status(500).json({ erro: 'Erro ao deletar evento' })
                if (result.affectedRows === 0) return res.status(403).json({ erro: 'Você não tem permissão para deletar este evento' })
                res.status(200).json({ mensagem: 'Evento deletado com sucesso' })
            })
        })
    })
})

app.get('/inscricoes', verificarToken, (req, res) => {
    const usuarioId = req.userId
    const query = `
        SELECT e.titulo as evento, u.nome, u.email, i.status, e.id as evento_id, u.id as usuario_id, e.usuario_id as criador_id
        FROM inscricoes i
        JOIN eventos e ON i.evento_id = e.id
        JOIN usuarios u ON i.usuario_id = u.id
        WHERE e.usuario_id = ?
    `
    db.query(query, [usuarioId], (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar inscrições' })
        res.json(results)
    })
})

app.get('/certificados/eventos', verificarToken, (req, res) => {
    const usuarioId = req.userId

    db.query('SELECT id, titulo FROM eventos WHERE usuario_id = ?', [usuarioId], (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar eventos' })
        res.status(200).json(results)
    })
})

app.get('/certificados/eventos/:id/participantes', verificarToken, (req, res) => {
    const { id } = req.params
    const usuarioId = req.userId

    db.query('SELECT * FROM eventos WHERE id = ? AND usuario_id = ?', [id, usuarioId], (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao verificar permissão' })
        if (results.length === 0) return res.status(403).json({ erro: 'Você não tem permissão para acessar os participantes deste evento' })

        const query = `
            SELECT u.id, u.nome
            FROM inscricoes i
            JOIN usuarios u ON i.usuario_id = u.id
            WHERE i.evento_id = ? AND i.status = 'Inscrito'
        `
        db.query(query, [id], (err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro ao buscar participantes' })
            res.status(200).json(results)
        })
    })
})

app.post('/inscricoes/atualizar', verificarToken, (req, res) => {
    const { inscricoes } = req.body

    const promises = inscricoes.map(inscricao => {
        return new Promise((resolve, reject) => {
            if (inscricao.status === 'Não Participou') {
                const deleteQuery = `
                    DELETE FROM inscricoes
                    WHERE evento_id = ? AND usuario_id = ?
                `
                db.query(deleteQuery, [inscricao.evento_id, inscricao.usuario_id], (err, results) => {
                    if (err) return reject(err)
                    resolve(results)
                })
            } else {
                const updateQuery = `
                    UPDATE inscricoes
                    SET status = ?
                    WHERE evento_id = ? AND usuario_id = ?
                `
                db.query(updateQuery, [inscricao.status, inscricao.evento_id, inscricao.usuario_id], (err, results) => {
                    if (err) return reject(err)
                    resolve(results)
                })
            }
        })
    })

    Promise.all(promises)
        .then(() => res.json({ mensagem: 'Status atualizado com sucesso' }))
        .catch(err => res.status(500).json({ erro: 'Erro ao atualizar status', detalhes: err }))
})

app.post('/inscrever', verificarToken, (req, res) => {
    const { evento_id } = req.body
    const usuario_id = req.userId

    const query = `
        INSERT INTO inscricoes (evento_id, usuario_id, status)
        VALUES (?, ?, 'Inscrito')
        ON DUPLICATE KEY UPDATE status = 'Inscrito'
    `
    db.query(query, [evento_id, usuario_id], (err, result) => {
        if (err) return res.status(500).json({ erro: 'Erro ao inscrever no evento' })
        res.status(200).json({ mensagem: 'Inscrito com sucesso' })
    })
})

app.get('/inscricoes/:eventoId', verificarToken, (req, res) => {
    const { eventoId } = req.params
    const query = `
        SELECT e.titulo AS evento, u.nome, u.email, i.status, e.id AS evento_id, u.id AS usuario_id
        FROM inscricoes i
        JOIN eventos e ON i.evento_id = e.id
        JOIN usuarios u ON i.usuario_id = u.id
        WHERE e.id = ?
    `
    db.query(query, [eventoId], (err, results) => {
        if (err) throw err
        res.json(results)
    })
})

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000')
})
