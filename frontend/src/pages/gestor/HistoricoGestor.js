import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import NavbarInterna from '../../componentes/NavbarInterna';

export default function HistoricoGestor() {
    const navigate = useNavigate();
    const [ocorrencias, setOcorrencias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [selecionada, setSelecionada] = useState(null);
    const [busca, setBusca] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        axios.get('http://localhost:3000/api/reports/historico', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setOcorrencias(res.data))
            .catch(() => toast.error('Erro ao carregar histórico.'))
            .finally(() => setCarregando(false));
    }, [navigate]);

    const filtradas = ocorrencias.filter(o =>
        `#${o.id} ${o.tipo_lixo} ${o.quantidade} ${o.descricao_adicional}`.toLowerCase()
            .includes(busca.toLowerCase())
    );

    const tdStyle = { padding: '10px', borderBottom: '1px solid #eee', color: '#555', fontSize: '13px' };
    const thStyle = { background: '#f4f4f4', padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontSize: '14px' };

    return (
        <div>
            <NavbarInterna tipo="gestor" paginaAtual="historico" />

            <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ color: '#2e7d32', margin: 0 }}>📋 Histórico de Ocorrências Resolvidas</h1>
                        <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>{ocorrencias.length} ocorrência(s) resolvida(s)</p>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por ID, tipo, descrição..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', minWidth: '280px' }}
                    />
                </div>

                {carregando ? (
                    <p style={{ color: '#888' }}>Carregando...</p>
                ) : filtradas.length === 0 ? (
                    <p style={{ color: '#aaa', textAlign: 'center', marginTop: '40px' }}>Nenhuma ocorrência resolvida encontrada.</p>
                ) : (
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

                        {/* TABELA */}
                        <div style={{ flex: 2, background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>ID</th>
                                        <th style={thStyle}>Tipo</th>
                                        <th style={thStyle}>Quantidade</th>
                                        <th style={thStyle}>Resolvida em</th>
                                        <th style={thStyle}>Coletas</th>
                                        <th style={thStyle}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtradas.map(o => {
                                        const coletaRealizada = (o.coletas || []).find(c => c.status === 'Revisada' || c.status === 'Coletada');
                                        return (
                                            <tr key={o.id} style={{ background: selecionada?.id === o.id ? '#e8f5e9' : 'white', cursor: 'pointer' }} onClick={() => setSelecionada(o)}>
                                                <td style={tdStyle}>#{o.id}</td>
                                                <td style={tdStyle}><strong>{o.tipo_lixo}</strong></td>
                                                <td style={tdStyle}>{o.quantidade}</td>
                                                <td style={tdStyle}>{new Date(o.updated_at).toLocaleDateString('pt-BR')}</td>
                                                <td style={tdStyle}>
                                                    {coletaRealizada
                                                        ? <span style={{ padding: '3px 8px', borderRadius: '10px', background: '#e8f5e9', color: '#2e7d32', fontSize: '11px', fontWeight: 'bold' }}>✅ {coletaRealizada.empresa}</span>
                                                        : <span style={{ color: '#aaa', fontSize: '12px' }}>Sem coleta registrada</span>
                                                    }
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
                            <div style={{ flex: 1, background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '20px', minWidth: '300px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ color: '#2e7d32', margin: 0 }}>Ocorrência #{selecionada.id}</h3>
                                    <button onClick={() => setSelecionada(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#aaa' }}>✕</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#444' }}>
                                    <div><strong style={{ color: '#2e7d32' }}>♻️ Tipo:</strong><br />{selecionada.tipo_lixo}</div>
                                    <div><strong style={{ color: '#2e7d32' }}>📦 Quantidade:</strong><br />{selecionada.quantidade}</div>
                                    <div><strong style={{ color: '#2e7d32' }}>🗓 Registrada em:</strong><br />{new Date(selecionada.created_at).toLocaleDateString('pt-BR')}</div>
                                    <div><strong style={{ color: '#2e7d32' }}>✅ Resolvida em:</strong><br />{new Date(selecionada.updated_at).toLocaleDateString('pt-BR')}</div>
                                    {selecionada.descricao_adicional && (
                                        <div><strong style={{ color: '#2e7d32' }}>📝 Descrição:</strong><br />{selecionada.descricao_adicional}</div>
                                    )}
                                    {selecionada.problemas_causados && (
                                        <div><strong style={{ color: '#2e7d32' }}>⚠️ Problemas:</strong><br />{selecionada.problemas_causados}</div>
                                    )}
                                    <div><strong style={{ color: '#2e7d32' }}>📍 Coordenadas:</strong><br />{Number(selecionada.lat).toFixed(5)}, {Number(selecionada.lng).toFixed(5)}</div>

                                    {selecionada.has_photo && (
                                        <div>
                                            <strong style={{ color: '#2e7d32' }}>📷 Foto:</strong>
                                            <img
                                                src={`/api/reports/${selecionada.id}/foto`}
                                                alt="Foto"
                                                style={{ width: '100%', marginTop: '6px', borderRadius: '6px', border: '1px solid #ddd', maxHeight: '200px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* HISTÓRICO DE COLETAS */}
                                {selecionada.coletas && selecionada.coletas.length > 0 && (
                                    <div style={{ marginTop: '20px' }}>
                                        <strong style={{ color: '#2e7d32', fontSize: '14px' }}>🚛 Ciclo de Coletas</strong>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                            {selecionada.coletas.map(c => {
                                                const cores = {
                                                    'Revisada':  { bg: '#f3e5f5', color: '#6a1b9a' },
                                                    'Coletada':  { bg: '#e3f2fd', color: '#1565c0' },
                                                    'Aprovada':  { bg: '#e8f5e9', color: '#2e7d32' },
                                                    'Negada':    { bg: '#ffebee', color: '#c62828' },
                                                    'Expirada':  { bg: '#eeeeee', color: '#616161' },
                                                    'Pendente':  { bg: '#fff3e0', color: '#e65100' },
                                                };
                                                const cor = cores[c.status] || { bg: '#f5f5f5', color: '#555' };
                                                return (
                                                    <div key={c.id} style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #eee', background: '#fafafa', fontSize: '13px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                            <strong>{c.empresa}</strong>
                                                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: cor.bg, color: cor.color }}>{c.status}</span>
                                                        </div>
                                                        <div style={{ color: '#888', fontSize: '12px' }}>
                                                            Solicitado em {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                                            {c.prazo && <> · Prazo: {new Date(c.prazo).toLocaleDateString('pt-BR')}</>}
                                                            {c.coletado_em && <> · Coletado em {new Date(c.coletado_em).toLocaleDateString('pt-BR')}</>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
