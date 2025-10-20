// frontend/script.js

// 1. FUNÇÃO PARA CARREGAR AS DENÚNCIAS DA API
async function carregarDenunciasNoMapa() {
    try {
        // 1.1. Chama a Rota GET '/api/reports' que você criou no 'denuncias.js'
        const response = await fetch('/api/reports');

        if (!response.ok) {
            console.error('Erro ao buscar denúncias:', response.statusText);
            alert('Não foi possível carregar as denúncias do servidor.');
            return;
        }

        // 1.2. Converte a resposta em JSON (uma lista de denúncias)
        const denuncias = await response.json();

        if (denuncias.length === 0) {
            console.log('Nenhuma denúncia encontrada para exibir.');
            return;
        }

        // 1.3. Faz um loop sobre cada denúncia e a desenha no mapa
        denuncias.forEach(denuncia => {
            
            // Cria o texto do popup que aparece ao clicar
            const popupContent = `
                <b>Tipo:</b> ${denuncia.tipo_lixo || 'Não informado'}<br>
                <b>Status:</b> ${denuncia.status}
            `;

            // Cria o marcador (pin) no mapa
            L.marker([denuncia.lat, denuncia.lng])
                .addTo(map) // Adiciona ao mapa (que definimos abaixo)
                .bindPopup(popupContent);
        });

    } catch (err) {
        console.error('Erro de conexão ao carregar denúncias:', err);
        alert('Erro de conexão. Não foi possível conectar ao servidor para carregar o mapa.');
    }
}

// 2. INICIALIZAÇÃO DO MAPA
// (Definimos 'map' aqui para que a função acima possa usá-lo)
const map = L.map('map').setView([-16.2531, -47.9503], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);


// 3. CHAMA A FUNÇÃO QUANDO A PÁGINA TERMINA DE CARREGAR
// Isso garante que o mapa seja populado assim que o usuário abre o site
document.addEventListener('DOMContentLoaded', carregarDenunciasNoMapa);