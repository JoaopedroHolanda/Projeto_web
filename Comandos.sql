CREATE DATABASE gestao_eventos;

USE gestao_eventos;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    senha VARCHAR(255)
);

CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100),
    descricao TEXT,
    data DATE,
    local VARCHAR(100),
    programacao TEXT
);

CREATE TABLE inscricoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT,
    usuario_id INT,
    FOREIGN KEY (evento_id) REFERENCES eventos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);


ALTER USER 'seu_usuario( (geralmente o nome é root))'@'localhost' IDENTIFIED WITH mysql_native_password BY 'sua_senha(coloca a tua senha aq)';
FLUSH PRIVILEGES;