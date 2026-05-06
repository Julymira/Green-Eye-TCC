// src/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import axios from 'axios';
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

// --- COMPONENTE DE HEATMAP ---
function HeatmapLayer({ ocorrencias }) {
    const map = useMap();
    useEffect(() => {
        const pontos = ocorrencias.map(d => [
            parseFloat(d.lat),
            parseFloat(d.lng),
            parseInt(d.peso_heatmap) || 1
        ]);
        const maxPeso = Math.max(...pontos.map(p => p[2]), 3);
        const heat = L.heatLayer(pontos, {
            radius: 25,
            blur: 25,
            maxZoom: 17,
            max: maxPeso,
            gradient: { 0.3: 'blue', 0.5: 'lime', 0.7: 'yellow', 1.0: 'red' }
        }).addTo(map);
        return () => { map.removeLayer(heat); };
    }, [map, ocorrencias]);
    return null;
}

function Dashboard() {
    const [ocorrencias, setOcorrencias] = useState([]);
    const [stats, setStats] = useState({ total: 0, novas: 0, verificacao: 0, resolvidas: 0 });
    const [focoMapa, setFocoMapa] = useState(null);
    const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(null);
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [prazoInput, setPrazoInput] = useState('');
    const [heatmapAtivo, setHeatmapAtivo] = useState(false);
    const [editando, setEditando] = useState(false);
    const [editForm, setEditForm] = useState({ quantidade: '', descricao_adicional: '', problemas_causados: '' });
    const [temColetaConfirmada, setTemColetaConfirmada] = useState(false);
    const [selecionadas, setSelecionadas] = useState([]);
    const [modalUnificacao, setModalUnificacao] = useState(false);
    const [principalId, setPrincipalId] = useState(null);
    const navigate = useNavigate();

    // --- NOVA LÓGICA DE CORES (STATUS) ---
    const getIcon = (ocorrencia) => {
        let iconUrl;

        if (ocorrencia.status === 'Resolvida') {
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png';
        } else if (ocorrencia.status === 'Revisão') {
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png';
        } else if (ocorrencia.status === 'Cedido') {
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png';
        } else if (ocorrencia.status === 'Em verificação') {
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png';
        } else {
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

    const calcularEstatisticas = (dados) => {
        const s = { total: dados.length, novas: 0, verificacao: 0, resolvidas: 0 };
        dados.forEach(d => {
            if (d.status === 'Nova') s.novas++;
            else if (d.status === 'Em verificação') s.verificacao++;
            else if (d.status === 'Resolvida') s.resolvidas++;
        });
        setStats(s);
    };

    const carregarDados = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:3000/api/reports', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                setOcorrencias(res.data);
                calcularEstatisticas(res.data);
            } else {
                setOcorrencias([]);
            }
        } catch (err) {
            console.error("Erro ao carregar dashboard:", err);
            setOcorrencias([]);
        }
    }, []);

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

    const atualizarStatus = async (id, novoStatus) => {
        const ok = await confirmar(`Mudar status para "${novoStatus}"?`);
        if (!ok) return;
        fetch(`/api/reports/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        }).then(res => {
            if (res.ok) carregarDados();
        });
    };

    const focarNoMapa = (lat, lng) => {
        setFocoMapa([lat, lng]);
        document.getElementById('mapa-admin').scrollIntoView({ behavior: 'smooth' });
    };

    const handleSalvarEdicao = async (acao = null) => {
        const token = localStorage.getItem('token');
        try {
            const payload = { ...editForm };
            if (acao === 'liberar') { payload.empresa_selecionada = false; payload.status = 'Em verificação'; }
            if (acao === 'resolver') { payload.empresa_selecionada = false; payload.status = 'Resolvida'; }

            await axios.put(
                `http://localhost:3000/api/reports/${ocorrenciaSelecionada.id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Marca as solicitações 'Coletada' como 'Revisada' para não re-abrir o formulário
            if (acao === 'liberar' || acao === 'resolver') {
                await axios.post(
                    `http://localhost:3000/api/reports/${ocorrenciaSelecionada.id}/review-collection`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            if (acao === 'liberar') toast.success("Informações salvas. Ocorrência liberada para nova coleta.");
            else if (acao === 'resolver') toast.success("Ocorrência marcada como Resolvida.");
            else toast.success("Ocorrência atualizada.");

            setEditando(false);
            setTemColetaConfirmada(false);
            carregarDados();
            if (acao) setOcorrenciaSelecionada(null);
            else setOcorrenciaSelecionada(prev => ({ ...prev, ...editForm }));
        } catch (err) {
            toast.error("Erro ao salvar alterações.");
        }
    };

    const abrirDetalhes = async (ocorrencia) => {
        setOcorrenciaSelecionada(ocorrencia);
        setEditForm({
            quantidade: ocorrencia.quantidade || '',
            descricao_adicional: ocorrencia.descricao_adicional || '',
            problemas_causados: ocorrencia.problemas_causados || ''
        });
        setSolicitacoes([]);
        setTemColetaConfirmada(false);
        focarNoMapa(ocorrencia.lat, ocorrencia.lng);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost:3000/api/reports/${ocorrencia.id}/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSolicitacoes(res.data);
            const hasColetada = ocorrencia.status === 'Revisão';
            setTemColetaConfirmada(hasColetada);
            setEditando(hasColetada);
        } catch (err) {
            console.error("Erro ao buscar solicitações:", err);
            setEditando(false);
        }
    };

    const handleAprovar = async (requestId) => {
        if (!prazoInput) {
            toast('Defina um prazo antes de aprovar.', { icon: '⚠️' });
            return;
        }
        const token = localStorage.getItem('token');
        try {
            await axios.post(
                `http://localhost:3000/api/reports/${ocorrenciaSelecionada.id}/requests/${requestId}/approve`,
                { prazo: prazoInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Solicitação aprovada!");
            setPrazoInput('');
            abrirDetalhes(ocorrenciaSelecionada);
            carregarDados();
        } catch (err) {
            if (err.response?.status === 409) {
                toast(err.response.data.error, { icon: '⚠️' });
            } else {
                toast.error("Erro ao aprovar.");
            }
        }
    };

    const handleNegar = async (requestId) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(
                `http://localhost:3000/api/reports/${ocorrenciaSelecionada.id}/requests/${requestId}/deny`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Solicitação negada.");
            abrirDetalhes(ocorrenciaSelecionada);
            carregarDados();
        } catch (err) {
            toast.error("Erro ao negar.");
        }
    };

    const toggleSelecionada = (id) => {
        setSelecionadas(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const abrirModalUnificacao = () => {
        setPrincipalId(selecionadas[0]);
        setModalUnificacao(true);
    };

    const handleUnificar = async () => {
        if (!principalId) return;
        const absorvidas = selecionadas.filter(id => id !== principalId);
        const token = localStorage.getItem('token');
        try {
            await axios.post(
                'http://localhost:3000/api/reports/merge',
                { principal_id: principalId, absorvidas_ids: absorvidas },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Ocorrências unificadas com sucesso!');
            setModalUnificacao(false);
            setSelecionadas([]);
            setPrincipalId(null);
            carregarDados();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao unificar.');
        }
    };

    useEffect(() => {
        const needsChange = localStorage.getItem('needsPasswordChange');
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/');
            return;
        }

        if (needsChange === 'true') {
            toast('Redefinição de senha obrigatória!', { icon: '⚠️' });
            navigate('/change-password');
            return;
        }

        carregarDados();
    }, [navigate, carregarDados]);

    const handleLogout = () => {
    // Limpa o Local Storage
    localStorage.clear(); 
    toast('Você saiu do sistema.');
    navigate('/'); // Volta para a Home
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
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/admin/historico')} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        📋 Histórico
                    </button>
                    <button onClick={() => navigate('/admin/tutorial')} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        📖 Tutorial
                    </button>
                    <button onClick={handleLogout} className="btn-logout" style={{ background: 'white', color: '#c62828', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Sair (Logout)
                    </button>
                </div>
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
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px'}}>
                            <h3 style={{color: '#2e7d32', margin: 0}}>📍 Mapa de Ocorrências</h3>
                            <button
                                onClick={() => setHeatmapAtivo(prev => !prev)}
                                style={{
                                    padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                                    border: heatmapAtivo ? 'none' : '1px solid #2e7d32',
                                    background: heatmapAtivo ? '#e53935' : 'white',
                                    color: heatmapAtivo ? 'white' : '#2e7d32'
                                }}
                            >
                                🔥 {heatmapAtivo ? 'Desativar Heatmap' : 'Ativar Heatmap'}
                            </button>
                        </div>

                        <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                            <MapContainer center={[-16.2531, -47.9503]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <MapController coords={focoMapa} />

                                {heatmapAtivo ? (
                                    <HeatmapLayer ocorrencias={ocorrencias} />
                                ) : (
                                    ocorrencias.map(d => (
                                        <Marker key={d.id} position={[d.lat, d.lng]} icon={getIcon(d)}>
                                            <Popup>
                                                <strong>#{d.id} - {d.tipo_lixo}</strong><br/>
                                                Status: {d.status}<br/>
                                                Qtd: {d.quantidade}
                                            </Popup>
                                        </Marker>
                                    ))
                                )}
                            </MapContainer>

                            {/* LEGENDA: muda conforme o modo ativo */}
                            <div className="map-legend">
                                {heatmapAtivo ? (
                                    <>
                                        <strong style={{display:'block', marginBottom:'5px'}}>Legenda (Calor)</strong>
                                        <div><span className="dot blue"></span> Baixa concentração</div>
                                        <div><span className="dot yellow"></span> Média concentração</div>
                                        <div><span className="dot red"></span> Alta concentração</div>
                                    </>
                                ) : (
                                    <>
                                        <strong style={{display:'block', marginBottom:'5px'}}>Legenda (Status)</strong>
                                        <div><span className="dot red"></span> Nova</div>
                                        <div><span className="dot yellow"></span> Em Verificação</div>
                                        <div><span className="dot blue"></span> Cedido</div>
                                        <div><span className="dot violet"></span> Revisão</div>
                                        <div><span className="dot green"></span> Resolvida</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COLUNA 2: TABELA ou DETALHES */}
                    <div className="dashboard-card" style={{overflowX: ocorrenciaSelecionada ? 'visible' : 'auto'}}>
                        {!ocorrenciaSelecionada ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <h3 style={{color: '#2e7d32', margin: 0}}>📋 Lista de Ocorrências</h3>
                                    {selecionadas.length >= 2 && (
                                        <button
                                            onClick={abrirModalUnificacao}
                                            style={{ cursor: 'pointer', padding: '7px 14px', background: '#6a1b9a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}
                                        >
                                            🔗 Unificar Selecionadas ({selecionadas.length})
                                        </button>
                                    )}
                                </div>
                                <table style={tableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={{...thStyle, width: '32px'}}></th>
                                            <th style={thStyle}>ID</th>
                                            <th style={thStyle}>Data</th>
                                            <th style={thStyle}>Tipo</th>
                                            <th style={thStyle}>Status</th>
                                            <th style={thStyle}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ocorrencias.map(d => (
                                            <tr key={d.id} style={{background: selecionadas.includes(d.id) ? '#f3e5f5' : d.status === 'Resolvida' ? '#f9f9f9' : 'white'}}>
                                                <td style={{...tdStyle, textAlign: 'center'}}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selecionadas.includes(d.id)}
                                                        onChange={() => toggleSelecionada(d.id)}
                                                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                                    />
                                                </td>
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
                                                        background: d.status === 'Nova' ? '#ffebee' : d.status === 'Resolvida' ? '#e8f5e9' : d.status === 'Cedido' ? '#e3f2fd' : d.status === 'Revisão' ? '#f3e5f5' : '#fff3e0',
                                                        color: d.status === 'Nova' ? '#c62828' : d.status === 'Resolvida' ? '#2e7d32' : d.status === 'Cedido' ? '#1565c0' : d.status === 'Revisão' ? '#6a1b9a' : '#e65100'
                                                    }}>
                                                        {d.status}
                                                    </span>
                                                    {d.empresa_selecionada && (
                                                        <span title="Empresa já selecionada para esta coleta" style={{ marginLeft: '5px' }}>⚠️</span>
                                                    )}
                                                    {parseInt(d.coletadas_aguardando) > 0 && (
                                                        <span title="Coleta confirmada — aguardando revisão do gestor" style={{ marginLeft: '5px' }}>📦</span>
                                                    )}
                                                    {parseInt(d.solicitacoes_pendentes) > 0 && (
                                                        <span title="Possui solicitações de coleta pendentes" style={{ marginLeft: '5px' }}>🛒</span>
                                                    )}
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
                                                        <button
                                                            onClick={() => abrirDetalhes(d)}
                                                            style={{ cursor: 'pointer', padding: '5px 8px', border: '1px solid #2196f3', borderRadius: '4px', background: 'white', color: '#2196f3', fontWeight: 'bold', fontSize: '11px' }}
                                                            title="Ver detalhes"
                                                        >
                                                            📍 Ver
                                                        </button>
                                                        {d.status === 'Nova' && (
                                                            <button onClick={() => atualizarStatus(d.id, 'Em verificação')} style={{ cursor: 'pointer', padding: '5px 8px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff3e0', fontSize: '11px' }}>
                                                                ⚠️ Verificar
                                                            </button>
                                                        )}
                                                        {d.status === 'Revisão' && (
                                                            <span style={{ padding: '5px 8px', borderRadius: '4px', background: '#f3e5f5', color: '#6a1b9a', fontSize: '11px', fontWeight: 'bold' }}>
                                                                📋 Revisar
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* MODAL DE UNIFICAÇÃO */}
                                {modalUnificacao && (
                                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ background: 'white', borderRadius: '10px', padding: '28px', maxWidth: '520px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                                            <h3 style={{ color: '#6a1b9a', marginTop: 0 }}>🔗 Unificar Ocorrências</h3>
                                            <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
                                                Escolha qual será a <strong>ocorrência principal</strong>. As demais serão absorvidas e seus pesos somados no mapa de calor.
                                            </p>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                                {selecionadas.map(id => {
                                                    const oc = ocorrencias.find(o => o.id === id);
                                                    return (
                                                        <label key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '6px', border: `2px solid ${principalId === id ? '#6a1b9a' : '#e0e0e0'}`, background: principalId === id ? '#f3e5f5' : 'white', cursor: 'pointer', fontSize: '14px' }}>
                                                            <input
                                                                type="radio"
                                                                name="principal"
                                                                value={id}
                                                                checked={principalId === id}
                                                                onChange={() => setPrincipalId(id)}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                            <div>
                                                                <strong>#{id}</strong> — {oc?.tipo_lixo} ({oc?.quantidade})
                                                                <br/>
                                                                <small style={{ color: '#888' }}>{new Date(oc?.created_at).toLocaleDateString('pt-BR')} · {oc?.status}</small>
                                                            </div>
                                                            {principalId === id && <span style={{ marginLeft: 'auto', fontSize: '11px', background: '#6a1b9a', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>Principal</span>}
                                                        </label>
                                                    );
                                                })}
                                            </div>

                                            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px', padding: '10px 14px', background: '#f9f9f9', borderRadius: '6px' }}>
                                                As ocorrências absorvidas terão status <strong>Unificada</strong> e não aparecerão mais na lista, mas o peso delas no mapa de calor será mantido na ocorrência principal.
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => { setModalUnificacao(false); setSelecionadas([]); setPrincipalId(null); }} style={{ cursor: 'pointer', padding: '8px 16px', border: '1px solid #ccc', borderRadius: '6px', background: 'white', color: '#555', fontSize: '14px' }}>
                                                    Cancelar
                                                </button>
                                                <button onClick={handleUnificar} style={{ cursor: 'pointer', padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#6a1b9a', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                                                    🔗 Confirmar Unificação
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* CABEÇALHO: voltar | título | botão de ação (canto superior direito) */}
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <button
                                            onClick={() => setOcorrenciaSelecionada(null)}
                                            style={{ background: 'none', border: '1px solid #ccc', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px', color: '#555' }}
                                            title="Voltar para a lista"
                                        >
                                            ← Voltar
                                        </button>
                                        <h3 style={{color: '#2e7d32', margin: 0}}>📄 Ocorrência #{ocorrenciaSelecionada.id}</h3>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                            background: ocorrenciaSelecionada.status === 'Nova' ? '#ffebee' : ocorrenciaSelecionada.status === 'Resolvida' ? '#e8f5e9' : ocorrenciaSelecionada.status === 'Cedido' ? '#e3f2fd' : ocorrenciaSelecionada.status === 'Revisão' ? '#f3e5f5' : '#fff3e0',
                                            color: ocorrenciaSelecionada.status === 'Nova' ? '#c62828' : ocorrenciaSelecionada.status === 'Resolvida' ? '#2e7d32' : ocorrenciaSelecionada.status === 'Cedido' ? '#1565c0' : ocorrenciaSelecionada.status === 'Revisão' ? '#6a1b9a' : '#e65100'
                                        }}>
                                            {ocorrenciaSelecionada.status}
                                        </span>
                                        {/* BOTÃO DE AÇÃO NO CANTO SUPERIOR DIREITO */}
                                        <div>
                                            {ocorrenciaSelecionada.status === 'Nova' && (
                                                <button onClick={() => { atualizarStatus(ocorrenciaSelecionada.id, 'Em verificação'); setOcorrenciaSelecionada(null); }} style={{ cursor: 'pointer', padding: '8px 14px', border: '1px solid #ccc', borderRadius: '6px', background: '#fff3e0', fontSize: '13px' }}>
                                                    ⚠️ Liberar para Verificação
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* PAINEL DE SOLICITAÇÕES DE COLETA */}
                                {solicitacoes.length > 0 && (() => {
                                    const statusAtivo = ['Pendente', 'Aprovada', 'Coletada'];
                                    const ativas = solicitacoes.filter(s => statusAtivo.includes(s.status));
                                    const historico = solicitacoes.filter(s => !statusAtivo.includes(s.status));
                                    const jaTemAprovada = ativas.some(s => s.status === 'Aprovada');

                                    const badgeStyle = (status) => {
                                        const map = {
                                            'Pendente':  { bg: '#fff3e0', color: '#e65100' },
                                            'Aprovada':  { bg: '#e8f5e9', color: '#2e7d32' },
                                            'Coletada':  { bg: '#e3f2fd', color: '#1565c0' },
                                            'Negada':    { bg: '#ffebee', color: '#c62828' },
                                            'Revisada':  { bg: '#f3e5f5', color: '#6a1b9a' },
                                            'Expirada':  { bg: '#eeeeee', color: '#616161' },
                                        };
                                        return map[status] || { bg: '#f5f5f5', color: '#555' };
                                    };

                                    const renderLinha = (s, isHistorico) => (
                                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: isHistorico ? '#fafafa' : 'white', borderRadius: '6px', border: `1px solid ${isHistorico ? '#f0f0f0' : '#eee'}`, marginBottom: '6px', flexWrap: 'wrap', gap: '8px', opacity: isHistorico ? 0.75 : 1 }}>
                                            <div style={{ fontSize: '13px', color: '#444' }}>
                                                <strong>{s.nome_fantasia}</strong>
                                                <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: badgeStyle(s.status).bg, color: badgeStyle(s.status).color }}>
                                                    {s.status}
                                                </span>
                                                {s.prazo && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#888' }}>Prazo: {new Date(s.prazo).toLocaleDateString('pt-BR')}</span>}
                                                {s.coletado_em && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#2e7d32' }}>✅ Coletado em {new Date(s.coletado_em).toLocaleDateString('pt-BR')}</span>}
                                            </div>
                                            {!isHistorico && s.status === 'Pendente' && (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {!jaTemAprovada && (
                                                        <button onClick={() => handleAprovar(s.id)} style={{ cursor: 'pointer', background: '#2e7d32', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '12px' }}>
                                                            ✅ Aprovar
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleNegar(s.id)} style={{ cursor: 'pointer', background: '#c62828', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '12px' }}>
                                                        ❌ Negar
                                                    </button>
                                                </div>
                                            )}
                                            {!isHistorico && s.status === 'Coletada' && (
                                                <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: '#fff8e1', color: '#f57f17' }}>
                                                    📦 Aguardando revisão do gestor
                                                </span>
                                            )}
                                        </div>
                                    );

                                    return (
                                        <div style={{ marginBottom: '20px', padding: '16px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                                            <h4 style={{ margin: '0 0 12px 0', color: '#2e7d32', fontSize: '14px' }}>🛒 Solicitações de Coleta</h4>

                                            {ativas.length > 0 && (
                                                <>
                                                    {ativas.some(s => s.status === 'Pendente') && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                                            <label style={{ fontSize: '13px', color: '#555' }}>Prazo para coleta:</label>
                                                            <input
                                                                type="date"
                                                                value={prazoInput}
                                                                onChange={e => setPrazoInput(e.target.value)}
                                                                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
                                                            />
                                                        </div>
                                                    )}
                                                    {ativas.map(s => renderLinha(s, false))}
                                                </>
                                            )}

                                            {historico.length > 0 && (
                                                <>
                                                    <p style={{ fontSize: '12px', color: '#999', margin: '12px 0 6px 0', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                                        Histórico anterior
                                                    </p>
                                                    {historico.map(s => renderLinha(s, true))}
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* CORPO: DUAS COLUNAS — informações | foto */}
                                <div style={{display: 'flex', gap: '24px', alignItems: 'flex-start'}}>

                                    {/* COLUNA ESQUERDA: INFORMAÇÕES */}
                                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#444'}}>
                                        <div>
                                            <strong style={{color: '#2e7d32'}}>🗓 Data:</strong><br/>
                                            {new Date(ocorrenciaSelecionada.created_at).toLocaleDateString('pt-BR')} às {new Date(ocorrenciaSelecionada.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div>
                                            <strong style={{color: '#2e7d32'}}>♻️ Tipo de Resíduo:</strong><br/>
                                            {ocorrenciaSelecionada.tipo_lixo}
                                        </div>

                                        {editando ? (
                                            <>
                                                {temColetaConfirmada && (
                                                    <div style={{ padding: '10px 14px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '6px', fontSize: '13px', color: '#5d4037' }}>
                                                        📦 <strong>A empresa confirmou a coleta.</strong> Revise as informações e decida o próximo passo.
                                                    </div>
                                                )}
                                                <div>
                                                    <strong style={{color: '#2e7d32'}}>📦 Quantidade:</strong><br/>
                                                    <select
                                                        value={editForm.quantidade}
                                                        onChange={e => setEditForm(p => ({ ...p, quantidade: e.target.value }))}
                                                        style={{ marginTop: '4px', padding: '5px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', width: '100%' }}
                                                    >
                                                        <option value="Pequena">Pequena</option>
                                                        <option value="Média">Média</option>
                                                        <option value="Grande">Grande</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <strong style={{color: '#2e7d32'}}>⚠️ Problemas Observados:</strong><br/>
                                                    <textarea
                                                        value={editForm.problemas_causados}
                                                        onChange={e => setEditForm(p => ({ ...p, problemas_causados: e.target.value }))}
                                                        rows={3}
                                                        style={{ marginTop: '4px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', width: '100%', resize: 'vertical' }}
                                                    />
                                                </div>
                                                <div>
                                                    <strong style={{color: '#2e7d32'}}>📝 Descrição Adicional:</strong><br/>
                                                    <textarea
                                                        value={editForm.descricao_adicional}
                                                        onChange={e => setEditForm(p => ({ ...p, descricao_adicional: e.target.value }))}
                                                        rows={3}
                                                        style={{ marginTop: '4px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', width: '100%', resize: 'vertical' }}
                                                    />
                                                </div>
                                                {temColetaConfirmada ? (
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <button onClick={() => handleSalvarEdicao('liberar')} style={{ cursor: 'pointer', background: '#1565c0', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '5px', fontSize: '13px', fontWeight: 'bold' }}>
                                                            🔓 Ainda há material — Liberar para nova coleta
                                                        </button>
                                                        <button onClick={() => handleSalvarEdicao('resolver')} style={{ cursor: 'pointer', background: '#2e7d32', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '5px', fontSize: '13px', fontWeight: 'bold' }}>
                                                            ✅ Material totalmente coletado — Resolver
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => handleSalvarEdicao()} style={{ cursor: 'pointer', background: '#2e7d32', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '5px', fontSize: '13px', fontWeight: 'bold' }}>
                                                            💾 Salvar
                                                        </button>
                                                        <button onClick={() => setEditando(false)} style={{ cursor: 'pointer', background: 'none', border: '1px solid #ccc', padding: '7px 14px', borderRadius: '5px', fontSize: '13px', color: '#555' }}>
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <strong style={{color: '#2e7d32'}}>📦 Quantidade:</strong><br/>
                                                        {ocorrenciaSelecionada.quantidade}
                                                    </div>
                                                    <button
                                                        onClick={() => setEditando(true)}
                                                        style={{ cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '5px', padding: '4px 10px', fontSize: '12px', color: '#555' }}
                                                    >
                                                        ✏️ Editar
                                                    </button>
                                                </div>
                                                <div>
                                                    <strong style={{color: '#2e7d32'}}>⚠️ Problemas Observados:</strong><br/>
                                                    {ocorrenciaSelecionada.problemas_causados || <em style={{color:'#999'}}>Não informado</em>}
                                                </div>
                                                <div>
                                                    <strong style={{color: '#2e7d32'}}>📝 Descrição Adicional:</strong><br/>
                                                    {ocorrenciaSelecionada.descricao_adicional || <em style={{color:'#999'}}>Não informado</em>}
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <strong style={{color: '#2e7d32'}}>📍 Coordenadas:</strong><br/>
                                            {Number(ocorrenciaSelecionada.lat).toFixed(5)}, {Number(ocorrenciaSelecionada.lng).toFixed(5)}
                                        </div>
                                    </div>

                                    {/* COLUNA DIREITA: FOTO */}
                                    {ocorrenciaSelecionada.has_photo && (
                                        <div style={{flex: 1}}>
                                            <strong style={{color: '#2e7d32', fontSize: '14px'}}>📷 Foto:</strong>
                                            <div style={{marginTop: '8px'}}>
                                                <img
                                                    src={`/api/reports/${ocorrenciaSelecionada.id}/foto`}
                                                    alt="Foto da ocorrência"
                                                    style={{width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd'}}
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

export default Dashboard;