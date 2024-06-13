document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token')
    const userId = parseInt(localStorage.getItem('userId'))

    if (!token) {
        window.location.href = '../Autenticacao/Login/login.html'
        return
    }

    fetch('http://localhost:3000/minhas-inscricoes', {
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
    })
    .then(data => {
        const container = document.getElementById('inscricoes-container')
        container.innerHTML = '' 
        data.forEach(inscricao => {
            const card = document.createElement('div')
            card.className = 'inscricao-card'
            card.id = `evento-${inscricao.evento_id}`
            card.innerHTML = `
                <h3>${inscricao.evento}</h3>
                <div class="participantes">
                    <p>Nome: ${inscricao.nome}</p>
                    <p>Email: ${inscricao.email}</p>
                    <p>Status: <span id="status-${inscricao.evento_id}-${inscricao.usuario_id}">${inscricao.status}</span></p>
                    <button class="remover-inscricao" onclick="removerInscricao(${inscricao.evento_id})">Remover Inscrição</button>
                </div>
            `
            container.appendChild(card)
        })
    })
    .catch(error => console.error('Error fetching inscricoes:', error))
})

function removerInscricao(eventoId) {
    fetch('http://localhost:3000/remover-inscricao', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({
            evento_id: eventoId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
    })
    .then(data => {
        if (data.mensagem) {
            alert(data.mensagem)
            const card = document.getElementById(`evento-${eventoId}`)
            card.parentNode.removeChild(card)
        } else if (data.erro) {
            console.error('Error:', data.erro)
            alert('Failed to remove inscrição. Check console for details.')
        }
    })
    .catch(error => {
        console.error('Error removing inscrição:', error)
    })
}
