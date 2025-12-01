// src/Mapa.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- CORREÇÃO DE ÍCONES DO LEAFLET NO REACT ---
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconMarker,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
// ----------------------------------------------

function Mapa() {
    const [denuncias, setDenuncias] = useState([]);

    // Lógica das Cores
    const getIcon = (denuncia) => {
        let iconUrl;
        
        if (denuncia.status === 'Resolvida') {
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png';
        } else {
            const qtd = (denuncia.quantidade || '').toLowerCase();
            if (qtd.includes('alto') || qtd.includes('grande')) {
                iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
            } else if (qtd.includes('médio') || qtd.includes('media')) {
                iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png';
            } else {
                iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png';
            }
        }

        return L.icon({
            iconUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: iconShadow
        });
    };

    // Carregar dados
    useEffect(() => {
        fetch('/api/reports')
            .then(res => res.json())
            .then(data => setDenuncias(data))
            .catch(err => console.error("Erro ao buscar denúncias:", err));
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <MapContainer center={[-16.2531, -47.9503]} zoom={13} style={{ height: '500px', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                
                {denuncias.map(d => (
                    <Marker 
                        key={d.id} 
                        position={[d.lat, d.lng]} 
                        icon={getIcon(d)}
                    >
                        <Popup>
                            <h3 style={{ margin: '0 0 5px 0', color: '#2e7d32' }}>{d.tipo_lixo}</h3>
                            <p><strong>Status:</strong> {d.status}</p>
                            <p><strong>Qtd:</strong> {d.quantidade}</p>
                            {d.descricao_adicional && <p><i>"{d.descricao_adicional}"</i></p>}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* LEGENDA FLUTUANTE */}
            <div className="map-legend">
                <strong>Legenda</strong>
                <div><span className="dot green"></span> Resolvido</div>
                <div><span className="dot yellow"></span> Nível Baixo</div>
                <div><span className="dot orange"></span> Nível Médio</div>
                <div><span className="dot red"></span> Nível Alto</div>
            </div>
        </div>
    );
}

export default Mapa;