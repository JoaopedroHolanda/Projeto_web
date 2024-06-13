document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userId = parseInt(localStorage.getItem('userId'));

    if (!token) {
        window.location.href = '../Autenticacao/Login/login.html';
        return;
    }

    fetch('http://localhost:3000/inscricoes', {
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const container = document.getElementById('inscricoes-container');
        container.innerHTML = ''; // Limpa o container antes de preencher com dados
        data.forEach(inscricao => {
            let card = document.getElementById(`evento-${inscricao.evento_id}`);
            if (!card) {
                card = document.createElement('div');
                card.className = 'inscricao-card';
                card.id = `evento-${inscricao.evento_id}`;
                card.innerHTML = `
                    <h3>${inscricao.evento}</h3>
                    <div class="participantes"></div>
                `;
                container.appendChild(card);
            }
            const participantesDiv = card.querySelector('.participantes');
            const participanteDiv = document.createElement('div');
            participanteDiv.className = 'participante';
            participanteDiv.innerHTML = `
                <p>Nome: ${inscricao.nome}
                </p>
                <p>Email: ${inscricao.email}</p>
                <p>Status: <span id="status-${inscricao.evento_id}-${inscricao.usuario_id}">${inscricao.status}</span></p>
                <button onclick="confirmarPresenca(${inscricao.evento_id}, ${inscricao.usuario_id})">Confirmar Presença</button>
                <button onclick="marcarFalta(${inscricao.evento_id}, ${inscricao.usuario_id})">Marcar Falta</button>
`;
            participantesDiv.appendChild(participanteDiv);
        });
    })
    .catch(error => console.error('Error fetching inscricoes:', error));
});

function confirmarPresenca(eventoId, usuarioId) {
    atualizarStatus(eventoId, usuarioId, 'Participou');
}

function marcarFalta(eventoId, usuarioId) {
    atualizarStatus(eventoId, usuarioId, 'Não Participou');
}

function atualizarStatus(eventoId, usuarioId, status) {
    fetch('http://localhost:3000/inscricoes/atualizar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') 
        },
        body: JSON.stringify({
            inscricoes: [
                { evento_id: eventoId, usuario_id: usuarioId, status }
            ]
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.mensagem) {
            alert(data.mensagem);
            if (status === 'Não Participou') {
                const participanteDiv = document.getElementById(`status-${eventoId}-${usuarioId}`).parentElement.parentElement;
                participanteDiv.parentElement.removeChild(participanteDiv);
            } else {
                document.getElementById(`status-${eventoId}-${usuarioId}`).textContent = status;
            }
        } else if (data.erro) {
            console.error('Error:', data.erro);
            alert('Failed to update status. Check console for details.');
        }
    })
    .catch(error => {
        console.error('Error updating status:', error);
    });
}

document.getElementById('logout').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '../Autenticacao/Login/login.html';
});

