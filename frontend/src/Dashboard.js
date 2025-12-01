// src/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- ÍCONES DO MAPA ---
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

// --- COMPONENTE PARA MOVER O MAPA ---
function MapController({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 16, { duration: 1.5 }); 
        }
    }, [coords, map]);
    return null;
}

function Dashboard() {
    const [denuncias, setDenuncias] = useState([]);
    const [stats, setStats] = useState({ total: 0, novas: 0, verificacao: 0, resolvidas: 0 });
    const [focoMapa, setFocoMapa] = useState(null);
    const navigate = useNavigate();

    // --- NOVA LÓGICA DE CORES (STATUS) ---
    const getIcon = (denuncia) => {
        let iconUrl;
        
        // 1. Resolvida = VERDE
        if (denuncia.status === 'Resolvida') {
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png';
        } 
        // 2. Em verificação = AMARELO (GOLD)
        else if (denuncia.status === 'Em verificação') {
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png';
        } 
        // 3. Nova = VERMELHO (Padrão para urgência)
        else {
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
        }

        return L.icon({
            iconUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: iconShadow
        });
    };

    const carregarDados = () => {
        fetch('/api/reports') 
            .then(res => res.json())
            .then(data => {
                setDenuncias(data);
                calcularEstatisticas(data);
            })
            .catch(err => console.error("Erro:", err));
    };

    const calcularEstatisticas = (dados) => {
        const s = { total: dados.length, novas: 0, verificacao: 0, resolvidas: 0 };
        dados.forEach(d => {
            if (d.status === 'Nova') s.novas++;
            else if (d.status === 'Em verificação') s.verificacao++;
            else if (d.status === 'Resolvida') s.resolvidas++;
        });
        setStats(s);
    };

    const atualizarStatus = (id, novoStatus) => {
        if (!window.confirm(`Mudar status para "${novoStatus}"?`)) return;
        fetch(`/api/reports/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        }).then(res => {
            if (res.ok) {
                carregarDados();
            }
        });
    };

    const focarNoMapa = (lat, lng) => {
        setFocoMapa([lat, lng]);
        document.getElementById('mapa-admin').scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        carregarDados();
        // eslint-disable-next-line
    }, []);

    const handleLogout = () => {
        navigate('/');
    };

    // Estilos
    const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px' };
    const thStyle = { background: '#f4f4f4', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontSize: '14px' };
    const tdStyle = { padding: '10px', borderBottom: '1px solid #eee', color: '#555', fontSize: '13px' };

    return (
        <div>
            {/* NAVBAR */}
            <nav className="navbar">
                <div className="brand" style={{color: 'white', fontSize: '20px', fontWeight: 'bold'}}>
                    📊 Painel do Gestor
                </div>
                <button onClick={handleLogout} style={{ background: 'white', color: '#c62828', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Sair (Logout)
                </button>
            </nav>

            <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* CARDS DE ESTATÍSTICA */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                     <div style={{ background: '#c62828', color: 'white', padding: '20px', borderRadius: '8px', flex: 1, minWidth: '200px' }}>
                        <h3 style={{margin:0, fontSize: '28px'}}>{stats.novas}</h3> <p style={{margin:0}}>Novas</p>
                    </div>
                    <div style={{ background: '#f57c00', color: 'white', padding: '20px', borderRadius: '8px', flex: 1, minWidth: '200px' }}>
                        <h3 style={{margin:0, fontSize: '28px'}}>{stats.verificacao}</h3> <p style={{margin:0}}>Em Verificação</p>
                    </div>
                    <div style={{ background: '#43a047', color: 'white', padding: '20px', borderRadius: '8px', flex: 1, minWidth: '200px' }}>
                        <h3 style={{margin:0, fontSize: '28px'}}>{stats.resolvidas}</h3> <p style={{margin:0}}>Resolvidas</p>
                    </div>
                </div>

                {/* GRID DO DASHBOARD */}
                <div className="dashboard-grid">
                    
                    {/* COLUNA 1: MAPA */}
                    <div className="dashboard-card" id="mapa-admin">
                        <h3 style={{color: '#2e7d32', marginTop: 0}}>📍 Mapa de Ocorrências</h3>
                        
                        <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                            <MapContainer center={[-16.2531, -47.9503]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <MapController coords={focoMapa} />

                                {denuncias.map(d => (
                                    <Marker key={d.id} position={[d.lat, d.lng]} icon={getIcon(d)}>
                                        <Popup>
                                            <strong>#{d.id} - {d.tipo_lixo}</strong><br/>
                                            Status: {d.status}<br/>
                                            Qtd: {d.quantidade}
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>

                            {/* --- NOVA LEGENDA DE STATUS --- */}
                            <div className="map-legend">
                                <strong style={{display:'block', marginBottom:'5px'}}>Legenda (Status)</strong>
                                <div><span className="dot red"></span> Nova</div>
                                <div><span className="dot yellow"></span> Em Verificação</div>
                                <div><span className="dot green"></span> Resolvida</div>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA 2: TABELA */}
                    <div className="dashboard-card" style={{overflowX: 'auto'}}>
                        <h3 style={{color: '#2e7d32', marginTop: 0}}>📋 Lista de Denúncias</h3>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>ID</th>
                                    <th style={thStyle}>Data</th>
                                    <th style={thStyle}>Tipo</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {denuncias.map(d => (
                                    <tr key={d.id} style={{background: d.status === 'Resolvida' ? '#f9f9f9' : 'white'}}>
                                        <td style={tdStyle}>#{d.id}</td>
                                        <td style={tdStyle}>
                                            {new Date(d.created_at).toLocaleDateString('pt-BR')} <br/>
                                            <small>{new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</small>
                                        </td>
                                        <td style={tdStyle}>
                                            <strong>{d.tipo_lixo}</strong><br/>
                                            <small>{d.quantidade}</small>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                                background: d.status === 'Nova' ? '#ffebee' : d.status === 'Resolvida' ? '#e8f5e9' : '#fff3e0',
                                                color: d.status === 'Nova' ? '#c62828' : d.status === 'Resolvida' ? '#2e7d32' : '#e65100'
                                            }}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                                                <button 
                                                    onClick={() => focarNoMapa(d.lat, d.lng)} 
                                                    style={{ cursor: 'pointer', padding: '5px 8px', border: '1px solid #2196f3', borderRadius: '4px', background: 'white', color: '#2196f3', fontWeight: 'bold', fontSize: '11px' }}
                                                    title="Ver no mapa"
                                                >
                                                    📍 Ver
                                                </button>

                                                {d.status === 'Nova' && (
                                                    <button onClick={() => atualizarStatus(d.id, 'Em verificação')} style={{ cursor: 'pointer', padding: '5px 8px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff3e0', fontSize: '11px' }}>
                                                        ⚠️ Verificar
                                                    </button>
                                                )}
                                                {d.status === 'Em verificação' && (
                                                    <button onClick={() => atualizarStatus(d.id, 'Resolvida')} style={{ cursor: 'pointer', background: '#43a047', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', fontSize: '11px' }}>
                                                        ✅ Resolver
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Dashboard;