document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const eventosContainer = document.getElementById('eventos');
    const inputBusca = document.getElementById('input-busca');
    const successMessage = document.getElementById('success-message');

    async function fetchEventos() {
        const response = await fetch('http://localhost:3000/eventos', {
            headers: {
                'Authorization': token
            }
        });

        const eventos = await response.json();
        eventosContainer.innerHTML = '';
        eventos.forEach(evento => {
            const eventoDiv = createEventCard(evento);
            eventosContainer.appendChild(eventoDiv);
        });
    }

    await fetchEventos();

    // Handle opening and closing of the modal for creating events
    const modal = document.getElementById('modal');
    const closeModal = document.getElementsByClassName('close')[0];
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('form-criar-evento');
    let editingEventId = null;

    document.getElementById('add-event').addEventListener('click', function() {
        form.reset();
        editingEventId = null;
        modalTitle.innerText = 'Criar Novo Evento';
        modal.style.display = 'block';
    });

    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Handle creating a new event or updating an existing event
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const titulo = document.getElementById('titulo').value;
        const descricao = document.getElementById('descricao').value;
        const data = document.getElementById('data').value;
        const local = document.getElementById('local').value;
        const programacao = document.getElementById('programacao').value;

        const eventData = {
            titulo,
            descricao,
            data,
            local,
            programacao
        };

        let url = 'http://localhost:3000/eventos';
        let method = 'POST';

        if (editingEventId) {
            url = `http://localhost:3000/eventos/${editingEventId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(eventData)
        });

        const result = await response.json();

        if (response.ok) {
            if (editingEventId) {
                // Update the existing event in the DOM
                const existingEvent = document.querySelector(`.card-evento[data-id='${editingEventId}']`);
                updateEventCard(existingEvent, result);
            } else {
                // Add the new event to the DOM
                const newEvent = createEventCard(result);
                eventosContainer.appendChild(newEvent);
            }
            modal.style.display = 'none';
        } else {
            alert('Erro ao salvar evento: ' + result.message);
        }
    });

    // Create a new event card element
    function createEventCard(evento) {
        const eventoDiv = document.createElement('div');
        eventoDiv.className = 'card-evento';
        eventoDiv.setAttribute('data-id', evento._id);
        eventoDiv.innerHTML = `
            <h3>${evento.titulo}</h3>
            <p><strong>Descrição:</strong> ${evento.descricao}</p>
            <p><strong>Data:</strong> ${new Date(evento.data).toLocaleDateString()}</p>
            <p><strong>Local:</strong> ${evento.local}</p>
            <p><strong>Programação:</strong> ${evento.programacao}</p>
            <button class="btn-evento">Participar</button>
            <button class="btn-editar">Editar</button>
            <button class="btn-deletar">Deletar</button>
        `;
        addEventListeners(eventoDiv, evento._id);
        return eventoDiv;
    }

    // Update an existing event card element
    function updateEventCard(eventElement, evento) {
        eventElement.querySelector('h3').innerText = evento.titulo;
        eventElement.querySelector('p').innerHTML = `<strong>Descrição:</strong> ${evento.descricao}`;
        eventElement.querySelector('p:nth-of-type(2)').innerHTML = `<strong>Data:</strong> ${new Date(evento.data).toLocaleDateString()}`;
        eventElement.querySelector('p:nth-of-type(3)').innerHTML = `<strong>Local:</strong> ${evento.local}`;
        eventElement.querySelector('p:nth-of-type(4)').innerHTML = `<strong>Programação:</strong> ${evento.programacao}`;
    }

    // Add event listeners for edit and delete buttons
    function addEventListeners(eventElement, eventId) {
        const editButton = eventElement.getElementsByClassName('btn-editar')[0];
        const deleteButton = eventElement.getElementsByClassName('btn-deletar')[0];

        editButton.addEventListener('click', function() {
            openEditModal(eventElement, eventId);
        });

        deleteButton.addEventListener('click', async function() {
            try {
                const response = await fetch(`http://localhost:3000/eventos/${eventId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': token
                    }
                });

                if (response.ok) {
                    eventElement.remove();
                    successMessage.style.display = 'block';
                    setTimeout(() => {
                        successMessage.style.display = 'none';
                    }, 2000);
                } else {
                    const result = await response.text();
                    alert('Erro ao deletar evento: ' + result);
                }
            } catch (error) {
                alert('Erro ao deletar evento: ' + error.message);
            }
        });
    }

    // Open the edit modal and populate the form with the current event data
    function openEditModal(eventElement, eventId) {
        const editModal = document.getElementById('edit-modal');
        const editForm = document.getElementById('form-editar-evento');
        const closeEditModal = document.getElementsByClassName('close-edit')[0];

        const titulo = eventElement.getElementsByTagName('h3')[0].innerText;
        const descricao = eventElement.getElementsByTagName('p')[0].innerText.replace('Descrição: ', '');
        const data = new Date(eventElement.getElementsByTagName('p')[1].innerText.replace('Data: ', '')).toISOString().split('T')[0];
        const local = eventElement.getElementsByTagName('p')[2].innerText.replace('Local: ', '');
        const programacao = eventElement.getElementsByTagName('p')[3].innerText.replace('Programação: ', '');

        document.getElementById('edit-titulo').value = titulo;
        document.getElementById('edit-descricao').value = descricao;
        document.getElementById('edit-data').value = data;
        document.getElementById('edit-local').value = local;
        document.getElementById('edit-programacao').value = programacao;

        editModal.style.display = 'block';

        closeEditModal.addEventListener('click', function() {
            editModal.style.display = 'none';
        });

        window.addEventListener('click', function(event) {
            if (event.target == editModal) {
                editModal.style.display = 'none';
            }
        });

        editForm.onsubmit = async function(event) {
            event.preventDefault();
            const titulo = document.getElementById('edit-titulo').value;
            const descricao = document.getElementById('edit-descricao').value;
            const data = document.getElementById('edit-data').value;
            const local = document.getElementById('edit-local').value;
            const programacao = document.getElementById('edit-programacao').value;

            const eventData = {
                titulo,
                descricao,
                data,
                local,
                programacao
            };

            try {
                const response = await fetch(`http://localhost:3000/eventos/${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(eventData)
                });

                const result = await response.json();

                if (response.ok) {
                    updateEventCard(eventElement, result);
                    editModal.style.display = 'none';
                } else {
                    alert('Erro ao salvar evento: ' + result.message);
                }
            } catch (error) {
                alert('Erro ao salvar evento: ' + error.message);
            }
        }
    }

    // Filter events based on search input
    inputBusca.addEventListener('input', function() {
        const filter = inputBusca.value.toLowerCase();
        const eventCards = document.getElementsByClassName('card-evento');

        Array.from(eventCards).forEach(function(eventCard) {
            const titulo = eventCard.querySelector('h3').innerText.toLowerCase();
            if (titulo.includes(filter)) {
                eventCard.style.display = '';
            } else {
                eventCard.style.display = 'none';
            }
        });
    });
});
      