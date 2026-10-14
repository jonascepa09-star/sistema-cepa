// Lógica de Login do Sistema CEPA

function alternarVisibilidadeSenha() {
    const inputSenha = document.getElementById('input-senha');
    const icone = document.getElementById('icone-olho');
    if (inputSenha.type === 'password') {
        inputSenha.type = 'text';
        icone.classList.remove('fa-eye');
        icone.classList.add('fa-eye-slash');
    } else {
        inputSenha.type = 'password';
        icone.classList.remove('fa-eye-slash');
        icone.classList.add('fa-eye');
    }
}

function preencher(login, senha) {
    document.getElementById('input-login').value = login;
    document.getElementById('input-senha').value = senha;
}

async function realizarLogin(e) {
    e.preventDefault();
    const login = document.getElementById('input-login').value.trim();
    const senha = document.getElementById('input-senha').value;
    const btn = document.getElementById('btn-login');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const toast = document.getElementById('toast-erro');
    const toastMsg = document.getElementById('toast-mensagem');

    toast.classList.add('hidden');
    btn.disabled = true;
    btnText.innerText = 'Autenticando...';
    btnSpinner.classList.remove('hidden');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Falha ao autenticar.');
        }

        // Armazena Token e Perfil no LocalStorage
        localStorage.setItem('cepa_token', data.token);
        localStorage.setItem('cepa_usuario', JSON.stringify(data.usuario));

        btnText.innerText = 'Redirecionando...';

        // Redireciona com base na role
        setTimeout(() => {
            window.location.href = data.redirectUrl || '/views/secretaria/dashboard.html';
        }, 500);

    } catch (err) {
        toastMsg.innerText = err.message;
        toast.classList.remove('hidden');
        btn.disabled = false;
        btnText.innerText = 'Acessar Plataforma';
        btnSpinner.classList.add('hidden');
    }
}
