import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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

function CountdownTimer({ prazo }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calc = () => {
            const diff = new Date(prazo) - new Date();
            if (diff <= 0) {
                setTimeLeft('⏰ Prazo expirado');
                return;
            }
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${seconds}s`);
        };
        calc();
        const id = setInterval(calc, 1000);
        return () => clearInterval(id);
    }, [prazo]);

    const expirado = new Date(prazo) - new Date() <= 0;
    return (
        <span style={{ fontWeight: 'bold', color: expirado ? '#c62828' : '#e65100' }}>
            ⏱ {timeLeft}
        </span>
    );
}

function DashboardCompany() {
    const [reports, setReports] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [focoMapa, setFocoMapa] = useState(null);
    const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(null);
    const navigate = useNavigate();

    const getIcon = (solicitacaoStatus) => {
        let color;
        if (solicitacaoStatus === 'Aprovada') color = 'green';
        else if (solicitacaoStatus === 'Pendente') color = 'gold';
        else color = 'red';

        return L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    };

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
        toast('Você saiu do sistema.');
        navigate('/');
    };

    const confirmar = (mensagem) => new Promise((resolve) => {
        toast((t) => (
            <div>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{mensagem}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { toast.dismiss(t.id); resolve(true); }}
                        style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                        Confirmar
                    </button>
                    <button onClick={() => { toast.dismiss(t.id); resolve(false); }}
                        style={{ background: '#757575', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                        Cancelar
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    });

    const handleSolicitarColeta = async (reportId) => {
        const ok = await confirmar("Deseja solicitar a coleta deste material?");
        if (!ok) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:3000/api/companies/requests/${reportId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Solicitação enviada! Aguarde aprovação do gestor.");
            carregarDados();
        } catch (err) {
            if (err.response?.status === 409) {
                toast('Você já solicitou esta coleta.', { icon: '⚠️' });
            } else {
                toast.error("Erro ao enviar solicitação.");
            }
        }
    };

    const handleConfirmarColeta = async (requestId, reportId) => {
        const ok = await confirmar("Confirmar que o material foi recolhido?");
        if (!ok) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:3000/api/companies/requests/${requestId}/confirm`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Coleta confirmada! Obrigado.");
            carregarDados();
            setOcorrenciaSelecionada(null);
        } catch (err) {
            toast.error("Erro ao confirmar coleta.");
        }
    };

    const focarNoMapa = (lat, lng) => {
        setFocoMapa([lat, lng]);
        document.getElementById('mapa-empresa').scrollIntoView({ behavior: 'smooth' });
    };

    const abrirDetalhes = (report) => {
        setOcorrenciaSelecionada(report);
        focarNoMapa(report.lat, report.lng);
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
                                    <Marker key={r.id} position={[r.lat, r.lng]} icon={getIcon(r.minha_solicitacao)}>
                                        <Popup>
                                            <strong>{r.tipo_lixo}</strong><br/>
                                            {r.quantidade}<br/>
                                            <button onClick={() => abrirDetalhes(r)} style={{marginTop:'5px', cursor:'pointer'}}>Ver detalhes</button>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>

                            <div className="map-legend">
                                <strong style={{ display: 'block', marginBottom: '5px' }}>Legenda</strong>
                                <div><span className="dot red"></span> Disponível</div>
                                <div><span className="dot yellow"></span> Aguardando aprovação</div>
                                <div><span className="dot green"></span> Aprovado</div>
                            </div>
                        </div>

                        {/* SEÇÃO DE SOLICITAÇÕES APROVADAS */}
                        {reports.some(r => r.minha_solicitacao === 'Aprovada') && (
                            <div style={{ marginTop: '16px', padding: '14px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #a5d6a7' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32', fontSize: '14px' }}>✅ Coletas Aprovadas para sua Empresa</h4>
                                {reports.filter(r => r.minha_solicitacao === 'Aprovada').map(r => (
                                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'white', borderRadius: '6px', border: '1px solid #c8e6c9', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: '#444' }}>
                                            <strong>{r.tipo_lixo}</strong>
                                            <span style={{ marginLeft: '8px', color: '#888' }}>{r.quantidade}</span>
                                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
                                                {new Date(r.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => abrirDetalhes(r)}
                                            style={{ cursor: 'pointer', padding: '5px 10px', border: '1px solid #2e7d32', borderRadius: '4px', background: 'white', color: '#2e7d32', fontSize: '12px', fontWeight: 'bold' }}
                                        >
                                            📄 Ver Ocorrência
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLUNA 2: TABELA ou DETALHES */}
                    <div className="dashboard-card" style={{ overflowX: ocorrenciaSelecionada ? 'visible' : 'auto' }}>
                        {!ocorrenciaSelecionada ? (
                            <>
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
                                                        <button onClick={() => abrirDetalhes(r)} style={{ cursor: 'pointer', padding: '5px 8px', border: '1px solid #2196f3', borderRadius: '4px', background: 'white', color: '#2196f3', fontSize: '11px' }}>
                                                            📍 Ver
                                                        </button>
                                                        {r.minha_solicitacao === 'Aprovada' ? (
                                                            <span style={{ padding: '5px 8px', borderRadius: '4px', background: '#e8f5e9', color: '#2e7d32', fontSize: '11px', fontWeight: 'bold' }}>
                                                                ✅ Aprovada
                                                            </span>
                                                        ) : r.empresa_selecionada ? (
                                                            <span style={{ padding: '5px 8px', borderRadius: '4px', background: '#fff3e0', color: '#e65100', fontSize: '11px', fontWeight: 'bold' }}>
                                                                ⚠️ Indisponível
                                                            </span>
                                                        ) : r.minha_solicitacao === 'Pendente' ? (
                                                            <span style={{ padding: '5px 8px', borderRadius: '4px', background: '#fff3e0', color: '#e65100', fontSize: '11px', fontWeight: 'bold' }}>
                                                                ⏳ Aguardando
                                                            </span>
                                                        ) : r.minha_solicitacao === 'Negada' ? (
                                                            <button onClick={() => handleSolicitarColeta(r.id)} style={{ cursor: 'pointer', background: '#c62828', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', fontSize: '11px' }}>
                                                                🔄 Tentar novamente
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleSolicitarColeta(r.id)} style={{ cursor: 'pointer', background: '#2e7d32', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', fontSize: '11px' }}>
                                                                🚛 Solicitar Coleta
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {reports.length === 0 && <p style={{textAlign:'center', color:'#999', marginTop: '20px'}}>Nenhum material compatível no momento.</p>}
                            </>
                        ) : (
                            <>
                                {/* CABEÇALHO: voltar + título */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <button
                                        onClick={() => setOcorrenciaSelecionada(null)}
                                        style={{ background: 'none', border: '1px solid #ccc', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px', color: '#555' }}
                                    >
                                        ← Voltar
                                    </button>
                                    <h3 style={{ color: '#2e7d32', margin: 0 }}>📄 Ocorrência #{ocorrenciaSelecionada.id}</h3>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                        background: ocorrenciaSelecionada.status === 'Nova' ? '#ffebee' : ocorrenciaSelecionada.status === 'Resolvida' ? '#e8f5e9' : ocorrenciaSelecionada.status === 'Cedido' ? '#e3f2fd' : ocorrenciaSelecionada.status === 'Revisão' ? '#f3e5f5' : '#fff3e0',
                                        color: ocorrenciaSelecionada.status === 'Nova' ? '#c62828' : ocorrenciaSelecionada.status === 'Resolvida' ? '#2e7d32' : ocorrenciaSelecionada.status === 'Cedido' ? '#1565c0' : ocorrenciaSelecionada.status === 'Revisão' ? '#6a1b9a' : '#e65100'
                                    }}>
                                        {ocorrenciaSelecionada.status}
                                    </span>
                                </div>

                                {/* BOTÃO DE AÇÃO NO DETALHE */}
                                <div style={{ marginBottom: '16px' }}>
                                    {ocorrenciaSelecionada.minha_solicitacao === 'Aprovada' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px 16px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #a5d6a7' }}>
                                            <div>
                                                <div style={{ fontSize: '13px', color: '#2e7d32', fontWeight: 'bold', marginBottom: '4px' }}>✅ Coleta aprovada!</div>
                                                {ocorrenciaSelecionada.prazo_coleta && (
                                                    <div style={{ fontSize: '13px', color: '#555' }}>
                                                        Prazo restante: <CountdownTimer prazo={ocorrenciaSelecionada.prazo_coleta} />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleConfirmarColeta(ocorrenciaSelecionada.request_id, ocorrenciaSelecionada.id)}
                                                style={{ cursor: 'pointer', background: '#1565c0', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}
                                            >
                                                📦 Confirmar Coleta Realizada
                                            </button>
                                        </div>
                                    ) : ocorrenciaSelecionada.empresa_selecionada ? (
                                        <span style={{ padding: '8px 14px', borderRadius: '6px', background: '#fff3e0', color: '#e65100', fontSize: '13px', fontWeight: 'bold' }}>
                                            ⚠️ Outra empresa já foi selecionada para esta coleta
                                        </span>
                                    ) : ocorrenciaSelecionada.minha_solicitacao === 'Pendente' ? (
                                        <span style={{ padding: '8px 14px', borderRadius: '6px', background: '#fff3e0', color: '#e65100', fontSize: '13px', fontWeight: 'bold' }}>
                                            ⏳ Aguardando aprovação do gestor
                                        </span>
                                    ) : ocorrenciaSelecionada.minha_solicitacao === 'Negada' ? (
                                        <button onClick={() => handleSolicitarColeta(ocorrenciaSelecionada.id)} style={{ cursor: 'pointer', background: '#c62828', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px' }}>
                                            🔄 Tentar novamente
                                        </button>
                                    ) : (
                                        <button onClick={() => handleSolicitarColeta(ocorrenciaSelecionada.id)} style={{ cursor: 'pointer', background: '#2e7d32', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px' }}>
                                            🚛 Solicitar Coleta
                                        </button>
                                    )}
                                </div>

                                {/* CORPO: informações + foto */}
                                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

                                    {/* COLUNA ESQUERDA: INFORMAÇÕES */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#444' }}>
                                        <div>
                                            <strong style={{ color: '#2e7d32' }}>🗓 Data:</strong><br/>
                                            {new Date(ocorrenciaSelecionada.created_at).toLocaleDateString('pt-BR')} às {new Date(ocorrenciaSelecionada.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div>
                                            <strong style={{ color: '#2e7d32' }}>♻️ Tipo de Resíduo:</strong><br/>
                                            {ocorrenciaSelecionada.tipo_lixo}
                                        </div>
                                        <div>
                                            <strong style={{ color: '#2e7d32' }}>📦 Quantidade:</strong><br/>
                                            {ocorrenciaSelecionada.quantidade}
                                        </div>
                                        <div>
                                            <strong style={{ color: '#2e7d32' }}>⚠️ Problemas Observados:</strong><br/>
                                            {ocorrenciaSelecionada.problemas_causados || <em style={{ color: '#999' }}>Não informado</em>}
                                        </div>
                                        <div>
                                            <strong style={{ color: '#2e7d32' }}>📝 Descrição Adicional:</strong><br/>
                                            {ocorrenciaSelecionada.descricao_adicional || <em style={{ color: '#999' }}>Não informado</em>}
                                        </div>
                                        <div>
                                            <strong style={{ color: '#2e7d32' }}>📍 Coordenadas:</strong><br/>
                                            {Number(ocorrenciaSelecionada.lat).toFixed(5)}, {Number(ocorrenciaSelecionada.lng).toFixed(5)}
                                        </div>
                                    </div>

                                    {/* COLUNA DIREITA: FOTO */}
                                    {ocorrenciaSelecionada.has_photo && (
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ color: '#2e7d32', fontSize: '14px' }}>📷 Foto:</strong>
                                            <div style={{ marginTop: '8px' }}>
                                                <img
                                                    src={`/api/reports/${ocorrenciaSelecionada.id}/foto`}
                                                    alt="Foto da ocorrência"
                                                    style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default DashboardCompany;