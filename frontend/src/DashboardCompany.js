import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// --- ÍCONES DO MAPA ---
//import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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

function DashboardCompany() {
    const [reports, setReports] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [focoMapa, setFocoMapa] = useState(null);
    const navigate = useNavigate();

    // Ícone personalizado verde para a Empresa (Sustentabilidade)
    const customIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

    const carregarDados = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }

            const res = await axios.get('http://localhost:3000/api/companies/my-matches', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReports(res.data.reports || []);
            setCompanyInfo(res.data.company);
        } catch (err) {
            console.error("Erro ao carregar dashboard da empresa", err);
            if (err.response?.status === 401) navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const handleLogout = () => {
        localStorage.clear();
        alert("Você saiu do sistema.");
        navigate('/');
    };

    const handleSolicitarColeta = async (reportId) => {
        if (!window.confirm("Deseja solicitar a coleta deste material?")) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:3000/api/companies/assign/${reportId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("✅ Coleta solicitada com sucesso!");
            carregarDados(); // Recarrega para limpar o item que já foi "assinado"
        } catch (err) {
            alert("❌ Erro ao solicitar coleta.");
        }
    };

    const focarNoMapa = (lat, lng) => {
        setFocoMapa([lat, lng]);
        document.getElementById('mapa-empresa').scrollIntoView({ behavior: 'smooth' });
    };

    // Estilos de Tabela (Seguindo o padrão do Gestor)
    const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px' };
    const thStyle = { background: '#f4f4f4', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontSize: '14px' };
    const tdStyle = { padding: '10px', borderBottom: '1px solid #eee', color: '#555', fontSize: '13px' };

    return (
        <div>
            {/* NAVBAR PADRONIZADA */}
            <nav className="navbar" >
                <div className="brand" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                    🏢 Painel da Empresa: {companyInfo?.nome_fantasia}
                </div>
                <button onClick={handleLogout} className="btn-logout" style={{ background: 'white', color: '#c62828', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Sair (Logout)
                </button>
            </nav>

            <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* CARDS DE ESTATÍSTICA/INFO */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div style={{ background: '#2e7d32', color: 'white', padding: '20px', borderRadius: '8px', flex: 1, minWidth: '250px' }}>
                        <h3 style={{ margin: 0, fontSize: '28px' }}>{reports.length}</h3> 
                        <p style={{ margin: 0 }}>Materiais Compatíveis</p>
                    </div>
                    <div style={{ background: '#1976d2', color: 'white', padding: '20px', borderRadius: '8px', flex: 1, minWidth: '250px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>{companyInfo?.is_ong ? '🍀 Perfil ONG' : '🏢 Empresa Parceira'}</h3>
                        <p style={{ margin: 0 }}>Tipo de Instituição</p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    
                    {/* COLUNA 1: MAPA */}
                    <div className="dashboard-card" id="mapa-empresa">
                        <h3 style={{ color: '#2e7d32', marginTop: 0 }}>📍 Mapa de Coletas Disponíveis</h3>
                        <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                            <MapContainer center={[-16.2531, -47.9503]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                                <MapController coords={focoMapa} />

                                {reports.map(r => (
                                    <Marker key={r.id} position={[r.lat, r.lng]} icon={customIcon}>
                                        <Popup>
                                            <strong>{r.tipo_lixo}</strong><br/>
                                            {r.quantidade}<br/>
                                            <button onClick={() => handleSolicitarColeta(r.id)} style={{marginTop:'5px', cursor:'pointer'}}>Solicitar</button>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>

                    {/* COLUNA 2: TABELA DE MATCHES */}
                    <div className="dashboard-card" style={{ overflowX: 'auto' }}>
                        <h3 style={{ color: '#2e7d32', marginTop: 0 }}>📋 Materiais para Coleta</h3>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Tipo</th>
                                    <th style={thStyle}>Quantidade</th>
                                    <th style={thStyle}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(r => (
                                    <tr key={r.id}>
                                        <td style={tdStyle}>
                                            <strong>{r.tipo_lixo}</strong><br/>
                                            <small>{new Date(r.created_at).toLocaleDateString('pt-BR')}</small>
                                        </td>
                                        <td style={tdStyle}>{r.quantidade}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={() => focarNoMapa(r.lat, r.lng)} style={{ cursor: 'pointer', padding: '5px 8px', border: '1px solid #2196f3', borderRadius: '4px', background: 'white', color: '#2196f3', fontSize: '11px' }}>
                                                    📍 Ver
                                                </button>
                                                <button onClick={() => handleSolicitarColeta(r.id)} style={{ cursor: 'pointer', background: '#2e7d32', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', fontSize: '11px' }}>
                                                    🚛 Coletar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {reports.length === 0 && <p style={{textAlign:'center', color:'#999', marginTop: '20px'}}>Nenhum material compatível no momento.</p>}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default DashboardCompany;