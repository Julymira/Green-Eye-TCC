// 1. INICIALIZAÇÃO DO MAPA
// Centralizado em Luziânia com um zoom inicial bom
const map = L.map('map').setView([-16.2531, -47.9503], 13);

// Adiciona a camada visual do mapa (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 2. FUNÇÃO PARA DEFINIR O ÍCONE (A LÓGICA DAS CORES)
// Isso garante que o mapa obedeça à legenda do seu HTML
function getIconUrl(denuncia) {
    // 1. VERDE: Se estiver resolvida
    if (denuncia.status === 'Resolvida') {
        return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png';
    }

    // Normaliza o texto da quantidade para minúsculas
    const qtd = (denuncia.quantidade || '').toLowerCase();

    // 2. VERMELHO: Nível Alto (ou Grande quantidade)
    if (qtd.includes('alto') || qtd.includes('grande')) {
        return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
    } 
    
    // 3. LARANJA: Nível Médio
    else if (qtd.includes('médio') || qtd.includes('media') || qtd.includes('medio')) {
        return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png';
    } 
    
    // 4. AMARELO (GOLD): Nível Baixo (ou Pequena quantidade) - Padrão para o resto
    else {
        return 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png';
    }
}

// 3. FUNÇÃO PRINCIPAL PARA CARREGAR AS DENÚNCIAS
async function carregarDenunciasNoMapa() {
    try {
        // Busca as denúncias no seu Backend
        // O Backend já foi configurado para esconder as resolvidas antigas (> 24h)
        const response = await fetch('/api/reports'); 

        if (!response.ok) {
            throw new Error('Erro na resposta do servidor');
        }

        const denuncias = await response.json();

        // Para cada denúncia, cria um marcador no mapa
        denuncias.forEach(d => {
            // Define qual cor de ícone usar
            const iconUrl = getIconUrl(d);

            // Configura o ícone do Leaflet
            const icon = L.icon({
                iconUrl: iconUrl,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            // Cria o marcador na posição correta
            const marker = L.marker([d.lat, d.lng], { icon: icon });

            // Formata a data para ficar bonita (ex: 30/11/2025)
            const dataFormatada = new Date(d.created_at).toLocaleDateString('pt-BR');
            
            // Cria o balãozinho de informações (Popup) mais completo
            const popupContent = `
                <div style="min-width: 200px;">
                    <h3 style="margin: 0 0 5px 0; color: #2e7d32; font-size: 16px;">${d.tipo_lixo}</h3>
                    <p style="margin: 5px 0;"><strong>Status:</strong> ${d.status}</p>
                    <p style="margin: 5px 0;"><strong>Quantidade:</strong> ${d.quantidade || 'Não informada'}</p>
                    <p style="margin: 5px 0; font-size: 12px; color: #666;">Data: ${dataFormatada}</p>
                    ${d.descricao_adicional ? `<p style="margin-top: 8px; font-style: italic;">"${d.descricao_adicional}"</p>` : ''}
                </div>
            `;

            marker.bindPopup(popupContent);
            marker.addTo(map);
        });

    } catch (error) {
        console.error('Erro ao carregar denúncias:', error);
        // Não vamos alertar o usuário comum com popup de erro toda hora, apenas logar no console
    }
}

// 4. INICIA TUDO QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', carregarDenunciasNoMapa);