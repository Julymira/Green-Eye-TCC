import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const statusConfig = {
    'Pendente':  { bg: '#fff3e0', color: '#e65100', label: 'Pendente' },
    'Aprovada':  { bg: '#e8f5e9', color: '#2e7d32', label: 'Aprovada' },
    'Coletada':  { bg: '#e3f2fd', color: '#1565c0', label: 'Coletada' },
    'Revisada':  { bg: '#f3e5f5', color: '#6a1b9a', label: 'Revisada' },
    'Negada':    { bg: '#ffebee', color: '#c62828', label: 'Negada' },
    'Expirada':  { bg: '#eeeeee', color: '#616161', label: 'Expirada' },
};

export default function HistoricoEmpresa() {
    const navigate = useNavigate();
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [selecionada, setSelecionada] = useState(null);
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [busca, setBusca] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        axios.get('http://localhost:3000/api/companies/my-history', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setSolicitacoes(res.data))
            .catch(() => toast.error('Erro ao carregar histórico.'))
            .finally(() => setCarregando(false));
    }, [navigate]);

    const filtradas = solicitacoes.filter(s => {
        const matchStatus = filtroStatus === 'Todos' || s.request_status === filtroStatus;
        const matchBusca = `#${s.report_id} ${s.tipo_lixo} ${s.quantidade} ${s.descricao_adicional || ''}`.toLowerCase()
            .includes(busca.toLowerCase());
        return matchStatus && matchBusca;
    });

    const contadores = Object.keys(statusConfig).reduce((acc, k) => {
        acc[k] = solicitacoes.filter(s => s.request_status === k).length;
        return acc;
    }, {});

    const tdStyle = { padding: '10px', borderBottom: '1px solid #eee', color: '#555', fontSize: '13px' };
    const thStyle = { background: '#f4f4f4', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontSize: '14px' };

    return (
        <div>
            <nav className="navbar">
                <div className="brand" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                    🏢 Painel da Empresa
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/dashboard-empresa')} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        ← Voltar ao Painel
                    </button>
                </div>
            </nav>

            <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ color: '#2e7d32', marginBottom: '6px' }}>📋 Histórico de Solicitações</h1>
                <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>{solicitacoes.length} solicitação(ões) no total</p>

                {/* CARDS DE RESUMO */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    {Object.entries(statusConfig).map(([status, cfg]) => (
                        contadores[status] > 0 && (
                            <div
                                key={status}
                                onClick={() => setFiltroStatus(filtroStatus === status ? 'Todos' : status)}
                                style={{
                                    padding: '12px 18px', borderRadius: '8px', cursor: 'pointer',
                                    border: `2px solid ${filtroStatus === status ? cfg.color : '#e0e0e0'}`,
                                    background: filtroStatus === status ? cfg.bg : 'white',
                                    minWidth: '100px', textAlign: 'center'
                                }}
                            >
                                <div style={{ fontSize: '22px', fontWeight: 'bold', color: cfg.color }}>{contadores[status]}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{cfg.label}</div>
                            </div>
                        )
                    ))}
                </div>

                {/* BARRA DE BUSCA */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Buscar por ID, tipo de lixo, descrição..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', flex: 1, minWidth: '240px' }}
                    />
                    {filtroStatus !== 'Todos' && (
                        <button onClick={() => setFiltroStatus('Todos')} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontSize: '13px', color: '#555' }}>
                            Limpar filtro ✕
                        </button>
                    )}
                </div>

                {carregando ? (
                    <p style={{ color: '#888' }}>Carregando...</p>
                ) : filtradas.length === 0 ? (
                    <p style={{ color: '#aaa', textAlign: 'center', marginTop: '40px' }}>Nenhuma solicitação encontrada.</p>
                ) : (
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

                        {/* TABELA */}
                        <div style={{ flex: 2, background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Ocorrência</th>
                                        <th style={thStyle}>Tipo de Lixo</th>
                                        <th style={thStyle}>Quantidade</th>
                                        <th style={thStyle}>Solicitado em</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtradas.map(s => {
                                        const cfg = statusConfig[s.request_status] || { bg: '#f5f5f5', color: '#555' };
                                        return (
                                            <tr
                                                key={s.request_id}
                                                style={{ background: selecionada?.request_id === s.request_id ? '#e8f5e9' : 'white', cursor: 'pointer' }}
                                                onClick={() => setSelecionada(s)}
                                            >
                                                <td style={tdStyle}>#{s.report_id}</td>
                                                <td style={tdStyle}><strong>{s.tipo_lixo}</strong></td>
                                                <td style={tdStyle}>{s.quantidade}</td>
                                                <td style={tdStyle}>{new Date(s.solicitado_em).toLocaleDateString('pt-BR')}</td>
                                                <td style={tdStyle}>
                                                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: cfg.bg, color: cfg.color }}>
                                                        {s.request_status}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <button style={{ cursor: 'pointer', padding: '4px 10px', border: '1px solid #2e7d32', borderRadius: '4px', background: 'white', color: '#2e7d32', fontSize: '12px', fontWeight: 'bold' }}>
                                                        Ver
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* PAINEL DE DETALHES */}
                        {selecionada && (
                            <div style={{ flex: 1, background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '20px', minWidth: '280px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ color: '#2e7d32', margin: 0 }}>Ocorrência #{selecionada.report_id}</h3>
                                    <button onClick={() => setSelecionada(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#aaa' }}>✕</button>
                                </div>

                                {/* STATUS DA SOLICITAÇÃO */}
                                {(() => {
                                    const cfg = statusConfig[selecionada.request_status] || { bg: '#f5f5f5', color: '#555' };
                                    return (
                                        <div style={{ padding: '10px 14px', borderRadius: '6px', background: cfg.bg, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', color: cfg.color, fontWeight: 'bold' }}>Solicitação: {selecionada.request_status}</span>
                                        </div>
                                    );
                                })()}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#444' }}>
                                    <div><strong style={{ color: '#2e7d32' }}>♻️ Tipo de Lixo:</strong><br />{selecionada.tipo_lixo}</div>
                                    <div><strong style={{ color: '#2e7d32' }}>📦 Quantidade:</strong><br />{selecionada.quantidade}</div>
                                    <div><strong style={{ color: '#2e7d32' }}>🗓 Ocorrência registrada em:</strong><br />{new Date(selecionada.ocorrencia_criada_em).toLocaleDateString('pt-BR')}</div>
                                    <div><strong style={{ color: '#2e7d32' }}>📤 Solicitação enviada em:</strong><br />{new Date(selecionada.solicitado_em).toLocaleDateString('pt-BR')}</div>

                                    {selecionada.prazo && (
                                        <div><strong style={{ color: '#2e7d32' }}>⏳ Prazo para coleta:</strong><br />{new Date(selecionada.prazo).toLocaleDateString('pt-BR')}</div>
                                    )}
                                    {selecionada.coletado_em && (
                                        <div><strong style={{ color: '#2e7d32' }}>✅ Coletado em:</strong><br />{new Date(selecionada.coletado_em).toLocaleDateString('pt-BR')}</div>
                                    )}

                                    {selecionada.descricao_adicional && (
                                        <div><strong style={{ color: '#2e7d32' }}>📝 Descrição:</strong><br />{selecionada.descricao_adicional}</div>
                                    )}
                                    {selecionada.problemas_causados && (
                                        <div><strong style={{ color: '#2e7d32' }}>⚠️ Problemas:</strong><br />{selecionada.problemas_causados}</div>
                                    )}

                                    <div>
                                        <strong style={{ color: '#2e7d32' }}>🔄 Status da Ocorrência:</strong><br />
                                        <span style={{
                                            padding: '3px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold',
                                            background: selecionada.report_status === 'Resolvida' ? '#e8f5e9' : '#fff3e0',
                                            color: selecionada.report_status === 'Resolvida' ? '#2e7d32' : '#e65100'
                                        }}>
                                            {selecionada.report_status}
                                        </span>
                                    </div>

                                    {selecionada.has_photo && (
                                        <div>
                                            <strong style={{ color: '#2e7d32' }}>📷 Foto da Ocorrência:</strong>
                                            <img
                                                src={`/api/reports/${selecionada.report_id}/foto`}
                                                alt="Foto"
                                                style={{ width: '100%', marginTop: '6px', borderRadius: '6px', border: '1px solid #ddd', maxHeight: '200px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
