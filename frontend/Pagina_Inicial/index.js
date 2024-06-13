document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token')
    if (!token) {
        window.location.href = './Autenticacao/Login/login.html'
        return
    }

    const containerEventos = document.getElementById('eventos')
    const inputBusca = document.getElementById('input-busca')
    const mensagemSucesso = document.getElementById('success-message')

    async function buscarEventos() {
        const resposta = await fetch('http://localhost:3000/eventos', {
            headers: {
                'Authorization': token
            }
        })

        const eventos = await resposta.json()
        containerEventos.innerHTML = ''
        eventos.forEach(evento => {
            const divEvento = criarCardEvento(evento)
            containerEventos.appendChild(divEvento)
        })
    }

    await buscarEventos()

    const modal = document.getElementById('modal')
    const fecharModal = document.getElementsByClassName('close')[0]
    const tituloModal = document.getElementById('modal-title')
    const formulario = document.getElementById('form-criar-evento')

    document.getElementById('add-event').addEventListener('click', function() {
        formulario.reset()
        tituloModal.innerText = 'Criar Novo Evento'
        modal.style.display = 'block'
    })

    fecharModal.addEventListener('click', function() {
        modal.style.display = 'none'
    })

    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none'
        }
    })

    formulario.addEventListener('submit', async function(event) {
        event.preventDefault()
        const titulo = document.getElementById('titulo').value
        const descricao = document.getElementById('descricao').value
        const data = document.getElementById('data').value
        const local = document.getElementById('local').value
        const programacao = document.getElementById('programacao').value

        const dadosEvento = {
            titulo,
            descricao,
            data,
            local,
            programacao
        }

        let url = 'http://localhost:3000/eventos'
        let metodo = 'POST'

        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(dadosEvento)
        })

        const resultado = await resposta.json()

        if (resposta.ok) {
            await buscarEventos();
            modal.style.display = 'none';
        } else {
            alert('Erro ao salvar evento: ' + resultado.message)
        }
    })

    function criarCardEvento(evento) {
        const divEvento = document.createElement('div')
        divEvento.className = 'card-evento'
        divEvento.setAttribute('data-id', evento.id)
        divEvento.innerHTML = `
            <h3>${evento.titulo}</h3>
            <p><strong>Descrição:</strong> ${evento.descricao}</p>
            <p><strong>Data:</strong> ${new Date(evento.data).toLocaleDateString()}</p>
            <p><strong>Local:</strong> ${evento.local}</p>
            <p><strong>Programação:</strong> ${evento.programacao}</p>
            <button class="btn-evento" onclick="inscreverNoEvento(${evento.id})">Participar</button>
            <button class="btn-deletar" data-id="${evento.id}">Deletar</button>
        `
        adicionarListenersEventos(divEvento, evento.id)
        return divEvento
    }

    function adicionarListenersEventos(elementoEvento, eventoId) {
        const botaoDeletar = elementoEvento.getElementsByClassName('btn-deletar')[0]
        botaoDeletar.addEventListener('click', async function() {
            const idDeletar = elementoEvento.getAttribute('data-id')
            try {
                const resposta = await fetch(`http://localhost:3000/eventos/${idDeletar}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': token
                    }
                })

                if (resposta.ok) {
                    elementoEvento.remove()
                    alert("Evento deletado com sucesso!")
                } else {
                    const resultado = await resposta.text()
                    alert('Erro ao deletar evento: ' + resultado)
                }
            } catch (erro) {
                alert('Erro ao deletar evento: ' + erro.message)
            }
        })
    }

    window.inscreverNoEvento = async function(eventoId) {
        try {
            const resposta = await fetch('http://localhost:3000/inscrever', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ evento_id: eventoId })
            })

            if (resposta.ok) {
                alert("Inscrito com sucesso!")
            } else {
                const resultado = await resposta.text()
                alert('Erro ao inscrever no evento: ' + resultado)
            }
        } catch (erro) {
            alert('Erro ao inscrever no evento: ' + erro.message)
        }
    }

    inputBusca.addEventListener('input', function() {
        const filtro = inputBusca.value.toLowerCase()
        const cardsEventos = document.getElementsByClassName('card-evento')

        Array.from(cardsEventos).forEach(function(cardEvento) {
            const titulo = cardEvento.querySelector('h3').innerText.toLowerCase()
            if (titulo.includes(filtro)) {
                cardEvento.style.display = ''
            } else {
                cardEvento.style.display = 'none'
            }
        })
    })

    document.getElementById('logout').addEventListener('click', function() {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        window.location.href = './Autenticacao/Login/login.html'
    })
})
