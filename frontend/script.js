// Inicializando o mapa
const map = L.map('map').setView([-16.2531, -47.9503], 13); // Coordenadas de Luziânia

// Camada de mapa base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Evento de clique no mapa para pegar lat/lng
map.on('click', function(e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;

  document.getElementById('lat').value = lat;
  document.getElementById('lng').value = lng;

  // Colocar um marcador
  L.marker([lat, lng]).addTo(map)
    .bindPopup('Local da denúncia')
    .openPopup();
});

// Enviando o formulário
document.getElementById('reportForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const description = document.getElementById('description').value;
  const lat = document.getElementById('lat').value;
  const lng = document.getElementById('lng').value;

  if (!lat || !lng) {
    alert('Clique no mapa para selecionar a localização!');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, lat, lng })
    });

    if (res.ok) {
      alert('Denúncia enviada com sucesso!');
      location.reload();
    } else {
      alert('Erro ao enviar denúncia.');
    }
  } catch (error) {
    console.error('Erro ao enviar:', error);
  }
});
