document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token')
    if (!token) {
        window.location.href = '/login.html'
        return
    }

    const eventoSelect = document.getElementById('evento')
    const participanteSelect = document.getElementById('participante')
    const botaoSelecionarEvento = document.getElementById('botaoSelecionarEvento')
    const botaoSelecionarParticipante = document.getElementById('botaoSelecionarParticipante')

    // Fetch eventos
    async function buscarEventos() {
        const response = await fetch('http://localhost:3000/certificados/eventos', {
            headers: {
                'Authorization': token
            }
        })
        const eventos = await response.json()
        eventos.forEach(evento => {
            const option = document.createElement('option')
            option.value = evento.id
            option.textContent = evento.titulo
            eventoSelect.appendChild(option)
        })
    }

    // Fetch participantes for selected event
    async function buscarParticipantes(eventoId) {
        const response = await fetch(`http://localhost:3000/certificados/eventos/${eventoId}/participantes`, {
            headers: {
                'Authorization': token
            }
        })
        const participantes = await response.json()
        participanteSelect.innerHTML = '' // Clear previous options
        participantes.forEach(participante => {
            const option = document.createElement('option')
            option.value = participante.id
            option.textContent = participante.nome
            participanteSelect.appendChild(option)
        })
    }

    // Load eventos on page load
    await buscarEventos()

    // Load participantes when "Selecionar Evento" button is clicked
    botaoSelecionarEvento.addEventListener('click', async () => {
        const eventoId = eventoSelect.value
        await buscarParticipantes(eventoId)
    })

    // Handle participant selection
    botaoSelecionarParticipante.addEventListener('click', () => {
        const nomeParticipante = participanteSelect.options[participanteSelect.selectedIndex].text
        alert(`Participante selecionado: ${nomeParticipante}`)
    })

    // Handle certificate generation
    document.getElementById('formularioCertificado').addEventListener('submit', async function (evento) {
        evento.preventDefault()

        const eventoId = eventoSelect.value
        const participanteId = participanteSelect.value
        const nomeParticipante = participanteSelect.options[participanteSelect.selectedIndex].text
        const nomeEvento = eventoSelect.options[eventoSelect.selectedIndex].text

        // Cria um novo certificado com jsPDF
        const { jsPDF } = window.jspdf
        const doc = new jsPDF()

        doc.setFontSize(22)
        doc.text('Certificado de Participação', 105, 40, null, null, 'center')
        doc.setFontSize(16)
        doc.text(`Certificamos que ${nomeParticipante}`, 105, 70, null, null, 'center')
        doc.text(`participou do evento ${nomeEvento}`, 105, 90, null, null, 'center')
        doc.text('Emitido em:', 105, 110, null, null, 'center')
        const data = new Date().toLocaleDateString()
        doc.text(data, 105, 120, null, null, 'center')

        // Adiciona a pré-visualização do certificado na página
        const previsaoCertificado = document.getElementById('previsaoCertificado')
        previsaoCertificado.style.display = 'block'
        previsaoCertificado.innerHTML = `<h2>Pré-visualização do Certificado</h2>
                                        <p>Nome: ${nomeParticipante}</p>
                                        <p>Evento: ${nomeEvento}</p>
                                        <p>Data: ${data}</p>`
        
        // Baixa o PDF
        doc.save('certificado.pdf')
    })
})
