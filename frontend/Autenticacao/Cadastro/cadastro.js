document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const nome = document.getElementById('nome').value
    const email = document.getElementById('email').value
    const senha = document.getElementById('senha').value
    

    const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome, email, senha})
    })
    
    const data = await response.json()
    if (response.ok) {
        alert("Registrado com sucesso!")
        window.location.href = '../login/login.html'
    } else {
        alert(data.error)
    }
})

