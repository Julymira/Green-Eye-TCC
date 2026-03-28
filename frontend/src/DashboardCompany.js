import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import './DashboardCompany.css';

// Ícone personalizado para o mapa
const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function DashboardCompany() {
    const [reports, setReports] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                // Busca denúncias que dão "match" com as categorias da empresa
                const res = await axios.get('http://localhost:3000/api/companies/my-matches', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReports(res.data.reports);
                setCompanyInfo(res.data.company);
            } catch (err) {
                console.error("Erro ao carregar dashboard da empresa", err);
            }
        };
        fetchDashboardData();
    }, []);

    const handleSolicitarColeta = async (reportId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:3000/api/companies/assign/${reportId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("✅ Coleta solicitada! O status da denúncia foi atualizado.");
            // Recarrega a lista
            setReports(reports.filter(r => r.id !== reportId));
        } catch (err) {
            alert("❌ Erro ao solicitar coleta.");
        }
    };

    return (
        <div className="company-dashboard">
            <div className="sidebar">
                <div className="company-header">
                    <h3>Olá, {companyInfo?.nome_fantasia}</h3>
                    <p>Filtro: {companyInfo?.is_ong ? '🍀 Perfil ONG' : '🏢 Perfil Empresa'}</p> [cite: 42, 647, 655]
                </div>
                
                <div className="match-list">
                    <h4>📍 Denúncias compatíveis ({reports.length})</h4>
                    {reports.map(report => (
                        <div key={report.id} className="match-card">
                            <strong>{report.quantidade} de lixo</strong>
                            <p>{report.descricao_adicional}</p>
                            <button onClick={() => handleSolicitarColeta(report.id)}>
                                Solicitar Coleta
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="map-area">
                <MapContainer center={[-16.25, -47.95]} zoom={13} className="full-map">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {reports.map(report => (
                        <Marker key={report.id} position={[report.lat, report.lng]} icon={customIcon}>
                            <Popup>
                                <strong>{report.descricao_adicional}</strong><br/>
                                Status: {report.status}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

export default DashboardCompany;