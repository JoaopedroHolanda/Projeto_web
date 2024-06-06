document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const nome = document.getElementById('nome').value
    const email = document.getElementById('email').value
    const senha = document.getElementById('senha').value
    const accountType = document.getElementById('accountType').value

    const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome, email, senha, accountType })
    })
    
    const data = await response.json()
    if (response.ok) {
        alert(data.message)
        window.location.href = '../login/login.html'
    } else {
        alert(data.error)
    }
})

