// Guarda de Autenticação e Sessão
async function verificarSessao(perfilEsperado = null) {
    try {
        const token = localStorage.getItem('cepa_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch('/api/auth/me', { headers });
        if (!res.ok) {
            localStorage.removeItem('cepa_token');
            localStorage.removeItem('cepa_usuario');
            window.location.href = '/login.html';
            return null;
        }

        const data = await res.json();
        const usuario = data.usuario;
        localStorage.setItem('cepa_usuario', JSON.stringify(usuario));

        // Validação de Perfil se especificado
        if (perfilEsperado && usuario.perfil !== perfilEsperado && usuario.perfil !== 'SECRETARIA') {
            alert(`Acesso restrito ao perfil ${perfilEsperado}. Redirecionando...`);
            window.location.href = getRedirectUrl(usuario.perfil);
            return null;
        }

        // Atualiza elementos de interface do cabeçalho
        const elNome = document.getElementById('user-nome');
        const elPerfil = document.getElementById('user-perfil');
        if (elNome) elNome.innerText = usuario.nome;
        if (elPerfil) elPerfil.innerText = formatarPerfil(usuario.perfil);

        return usuario;
    } catch (e) {
        window.location.href = '/login.html';
        return null;
    }
}

function formatarPerfil(p) {
    const mapa = {
        'SECRETARIA': 'Secretaria / Adm',
        'COORDENACAO': 'Coordenação / Supervisor',
        'PROFESSOR': 'Professor / Preceptor',
        'ALUNO': 'Portal do Aluno'
    };
    return mapa[p] || p;
}

function getRedirectUrl(perfil) {
    if (perfil === 'COORDENACAO') return '/views/coordenacao/dashboard.html';
    if (perfil === 'PROFESSOR') return '/views/professor/mobile-chamada.html';
    if (perfil === 'ALUNO') return '/views/aluno/portal.html';
    return '/views/secretaria/dashboard.html';
}

async function fazerLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('cepa_token');
    localStorage.removeItem('cepa_usuario');
    window.location.href = '/login.html';
}
