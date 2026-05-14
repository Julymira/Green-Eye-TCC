import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TIPOS_INFO = {
    'Eletrônico':     { cor: '#1565c0', emoji: '💻' },
    'Orgânico':       { cor: '#2e7d32', emoji: '🥬' },
    'Entulho':        { cor: '#795548', emoji: '🧱' },
    'Pneus':          { cor: '#424242', emoji: '🔵' },
    'Móveis':         { cor: '#6a1b9a', emoji: '🛋️' },
    'Lixo Doméstico': { cor: '#f57c00', emoji: '🗑️' },
    'Hospitalar':     { cor: '#c62828', emoji: '🏥' },
    'Reciclável':     { cor: '#00838f', emoji: '♻️' },
    'Outros':         { cor: '#757575', emoji: '📦' },
};

const TIPOS_LISTA = Object.keys(TIPOS_INFO);

const VAZIO = { nome: '', endereco: '', cidade: '', telefone: '', horario: '', lat: '', lng: '', tipos_residuo: [], ativo: true };

function BadgeTipo({ tipo }) {
    const info = TIPOS_INFO[tipo] || { cor: '#757575', emoji: '📦' };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: info.cor + '18', color: info.cor,
            border: `1px solid ${info.cor}44`,
            borderRadius: '20px', padding: '3px 10px',
            fontSize: '12px', fontWeight: 'bold', margin: '2px'
        }}>
            {info.emoji} {tipo}
        </span>
    );
}

export default function GestaoPontosColeta() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [pontos, setPontos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(VAZIO);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        carregarPontos(); // eslint-disable-line react-hooks/exhaustive-deps
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function carregarPontos() {
        setCarregando(true);
        try {
            const res = await fetch('http://localhost:3000/api/pontos-coleta/todos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPontos(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Erro ao carregar pontos de coleta.');
        } finally {
            setCarregando(false);
        }
    }

    function abrirCriar() {
        setEditando(null);
        setForm(VAZIO);
        setModalAberto(true);
    }

    function abrirEditar(ponto) {
        setEditando(ponto);
        setForm({
            nome: ponto.nome || '',
            endereco: ponto.endereco || '',
            cidade: ponto.cidade || '',
            telefone: ponto.telefone || '',
            horario: ponto.horario || '',
            lat: ponto.lat || '',
            lng: ponto.lng || '',
            tipos_residuo: ponto.tipos_residuo || [],
            ativo: ponto.ativo ?? true,
        });
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setEditando(null);
        setForm(VAZIO);
    }

    function toggleTipo(tipo) {
        setForm(f => ({
            ...f,
            tipos_residuo: f.tipos_residuo.includes(tipo)
                ? f.tipos_residuo.filter(t => t !== tipo)
                : [...f.tipos_residuo, tipo]
        }));
    }

    async function salvar() {
        if (!form.nome || !form.endereco || !form.cidade) {
            toast.error('Nome, endereço e cidade são obrigatórios.');
            return;
        }
        setSalvando(true);
        try {
            const url = editando
                ? `http://localhost:3000/api/pontos-coleta/${editando.id}`
                : 'http://localhost:3000/api/pontos-coleta';
            const method = editando ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...form,
                    lat: form.lat !== '' ? parseFloat(form.lat) : null,
                    lng: form.lng !== '' ? parseFloat(form.lng) : null,
                })
            });
            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || 'Erro ao salvar.');
                return;
            }
            toast.success(editando ? 'Ponto atualizado!' : 'Ponto criado!');
            fecharModal();
            carregarPontos();
        } catch {
            toast.error('Erro de conexão.');
        } finally {
            setSalvando(false);
        }
    }

    async function remover(id) {
        if (!window.confirm('Remover este ponto de coleta?')) return;
        try {
            const res = await fetch(`http://localhost:3000/api/pontos-coleta/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) { toast.error('Erro ao remover.'); return; }
            toast.success('Ponto removido.');
            carregarPontos();
        } catch {
            toast.error('Erro de conexão.');
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            {/* NAVBAR */}
            <nav style={{
                background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
                padding: '12px 24px', display: 'flex', alignItems: 'center',
                gap: '12px', flexWrap: 'wrap'
            }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', marginRight: '16px' }}>
                    🌿 Green Eye
                </span>
                <button onClick={() => navigate('/admin')} style={btnNav}>📊 Painel</button>
                <button style={{ ...btnNav, background: 'rgba(255,255,255,0.2)' }}>♻️ Pontos de Coleta</button>
                <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ ...btnNav, marginLeft: 'auto' }}>Sair</button>
            </nav>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ margin: 0, color: '#1b5e20', fontSize: '24px' }}>♻️ Gestão de Pontos de Coleta</h1>
                        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
                            Cadastre e gerencie os locais de descarte correto de resíduos.
                        </p>
                    </div>
                    <button onClick={abrirCriar} style={{
                        background: '#2e7d32', color: 'white', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold',
                        cursor: 'pointer', fontSize: '14px'
                    }}>
                        ➕ Novo Ponto
                    </button>
                </div>

                {carregando ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Carregando...</div>
                ) : pontos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '10px', border: '1px solid #e0e0e0', color: '#888' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                        <p>Nenhum ponto cadastrado ainda.</p>
                    </div>
                ) : (
                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: '#f1f8e9' }}>
                                    {['Nome', 'Cidade', 'Endereço', 'Tipos', 'Status', 'Ações'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#2e7d32', fontWeight: 'bold', borderBottom: '2px solid #c5e1a5' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pontos.map((p, i) => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1b5e20' }}>{p.nome}</td>
                                        <td style={{ padding: '12px 16px', color: '#555' }}>{p.cidade}</td>
                                        <td style={{ padding: '12px 16px', color: '#555', maxWidth: '220px' }}>{p.endereco}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {p.tipos_residuo?.length > 0
                                                ? p.tipos_residuo.map(t => <BadgeTipo key={t} tipo={t} />)
                                                : <span style={{ color: '#bbb', fontSize: '12px' }}>—</span>
                                            }
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                                                background: p.ativo ? '#e8f5e9' : '#fbe9e7',
                                                color: p.ativo ? '#2e7d32' : '#c62828'
                                            }}>
                                                {p.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => abrirEditar(p)} style={btnAcao('#1565c0')}>✏️ Editar</button>
                                                <button onClick={() => remover(p.id)} style={btnAcao('#c62828')}>🗑️ Remover</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {modalAberto && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '12px', padding: '28px',
                        width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2 style={{ margin: '0 0 20px', color: '#1b5e20' }}>
                            {editando ? '✏️ Editar Ponto' : '➕ Novo Ponto de Coleta'}
                        </h2>

                        <div style={{ display: 'grid', gap: '14px' }}>
                            <Campo label="Nome *" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} />
                            <Campo label="Endereço *" value={form.endereco} onChange={v => setForm(f => ({ ...f, endereco: v }))} />
                            <Campo label="Cidade *" value={form.cidade} onChange={v => setForm(f => ({ ...f, cidade: v }))} />
                            <Campo label="Telefone" value={form.telefone} onChange={v => setForm(f => ({ ...f, telefone: v }))} />
                            <Campo label="Horário de funcionamento" value={form.horario} onChange={v => setForm(f => ({ ...f, horario: v }))} placeholder="Ex: Seg a Sex, 8h às 17h" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <Campo label="Latitude" value={form.lat} onChange={v => setForm(f => ({ ...f, lat: v }))} placeholder="-16.2531" />
                                <Campo label="Longitude" value={form.lng} onChange={v => setForm(f => ({ ...f, lng: v }))} placeholder="-47.9503" />
                            </div>

                            <div>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '8px' }}>
                                    Tipos de resíduo aceitos
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {TIPOS_LISTA.map(tipo => {
                                        const info = TIPOS_INFO[tipo];
                                        const sel = form.tipos_residuo.includes(tipo);
                                        return (
                                            <button key={tipo} onClick={() => toggleTipo(tipo)} style={{
                                                padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                                                fontWeight: 'bold', border: `1px solid ${info.cor}`,
                                                background: sel ? info.cor : 'white',
                                                color: sel ? 'white' : info.cor,
                                                transition: 'all 0.15s'
                                            }}>
                                                {info.emoji} {tipo}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {editando && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
                                    <label htmlFor="ativo" style={{ fontSize: '14px', color: '#555', cursor: 'pointer' }}>Ponto ativo (visível para o público)</label>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                            <button onClick={fecharModal} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontSize: '14px' }}>
                                Cancelar
                            </button>
                            <button onClick={salvar} disabled={salvando} style={{
                                padding: '10px 24px', borderRadius: '8px', border: 'none',
                                background: '#2e7d32', color: 'white', fontWeight: 'bold',
                                cursor: salvando ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: salvando ? 0.7 : 1
                            }}>
                                {salvando ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Campo({ label, value, onChange, placeholder }) {
    return (
        <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '4px' }}>{label}</label>
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }}
            />
        </div>
    );
}

const btnNav = {
    background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)',
    padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
};

function btnAcao(cor) {
    return {
        background: cor + '12', color: cor, border: `1px solid ${cor}44`,
        padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
        fontSize: '12px', fontWeight: 'bold'
    };
}
