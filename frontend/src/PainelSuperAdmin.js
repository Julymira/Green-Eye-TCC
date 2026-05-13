import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const VERDE = '#2e7d32';

function PainelSuperAdmin() {
    const navigate = useNavigate();
    const [gestores, setGestores] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [novoGestor, setNovoGestor] = useState({ email: '', cpf: '', role: 'gestor' });
    const [enviando, setEnviando] = useState(false);
    const [senhaGerada, setSenhaGerada] = useState(null);

    const token = localStorage.getItem('token');

    const headers = { Authorization: `Bearer ${token}` };

    const carregarGestores = useCallback(async () => {
        if (!token) { navigate('/'); return; }
        try {
            const res = await axios.get('http://localhost:3000/api/admin/gestores', { headers });
            setGestores(res.data);
        } catch (err) {
            if (err.response?.status === 403) {
                toast.error('Acesso negado.');
                navigate('/');
            } else {
                toast.error('Erro ao carregar gestores.');
            }
        } finally {
            setCarregando(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, navigate]);

    useEffect(() => { carregarGestores(); }, [carregarGestores]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleCpfChange = (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
        setNovoGestor(prev => ({ ...prev, cpf: v }));
    };

    const handleCriarGestor = async (e) => {
        e.preventDefault();
        const cpfLimpo = novoGestor.cpf.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) {
            toast('CPF inválido. Informe os 11 dígitos.', { icon: '⚠️' });
            return;
        }
        setEnviando(true);
        try {
            const res = await axios.post('http://localhost:3000/api/admin/gestores', novoGestor, { headers });
            toast.success('Gestor criado com sucesso!');
            setSenhaGerada(res.data.tempPassword);
            setNovoGestor({ email: '', cpf: '' });
            carregarGestores();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erro ao criar gestor.');
        } finally {
            setEnviando(false);
        }
    };

    const handleResetSenha = async (id, email) => {
        if (!window.confirm(`Resetar senha de ${email}? Uma nova senha temporária será gerada.`)) return;
        try {
            const res = await axios.post(`http://localhost:3000/api/admin/gestores/${id}/reset-senha`, {}, { headers });
            toast.success('Senha resetada!');
            setSenhaGerada(res.data.tempPassword);
        } catch {
            toast.error('Erro ao resetar senha.');
        }
    };

    const handleRemover = async (id, email) => {
        if (!window.confirm(`Remover o gestor ${email}? Esta ação não pode ser desfeita.`)) return;
        try {
            await axios.delete(`http://localhost:3000/api/admin/gestores/${id}`, { headers });
            toast.success('Gestor removido.');
            setGestores(prev => prev.filter(g => g.id !== id));
        } catch {
            toast.error('Erro ao remover gestor.');
        }
    };

    return (
        <div>
            {/* NAVBAR */}
            <nav className="navbar">
                <div className="brand" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                    🛡️ Painel Super Admin
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/admin')} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        📊 Painel Gestor
                    </button>
                    <button onClick={handleLogout} style={{ background: 'white', color: '#c62828', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Sair (Logout)
                    </button>
                </div>
            </nav>

            <div style={{ padding: '28px', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ color: VERDE, margin: 0 }}>👥 Gerenciamento de Gestores</h1>
                        <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>
                            Logado como: {localStorage.getItem('userEmail')}
                        </p>
                    </div>
                    <button
                        onClick={() => { setModalAberto(true); setSenhaGerada(null); }}
                        style={{ background: VERDE, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                        ➕ Novo Gestor
                    </button>
                </div>

                {/* ALERTA DE SENHA GERADA */}
                {senhaGerada && (
                    <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
                        <strong style={{ color: '#f57c00' }}>⚠️ Senha temporária gerada — anote agora, ela não será exibida novamente:</strong>
                        <div style={{ fontFamily: 'monospace', fontSize: '18px', marginTop: '8px', color: '#333', letterSpacing: '2px' }}>
                            {senhaGerada}
                        </div>
                        <button
                            onClick={() => { navigator.clipboard.writeText(senhaGerada); toast.success('Copiado!'); }}
                            style={{ marginTop: '8px', background: '#f57c00', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            📋 Copiar
                        </button>
                        <button
                            onClick={() => setSenhaGerada(null)}
                            style={{ marginTop: '8px', marginLeft: '8px', background: 'transparent', color: '#888', border: '1px solid #ccc', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Fechar
                        </button>
                    </div>
                )}

                {/* TABELA DE GESTORES */}
                <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                    {carregando ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Carregando...</div>
                    ) : gestores.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                            Nenhum gestor cadastrado ainda.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f4f4f4' }}>
                                    {['#', 'Email', 'CPF', 'Nível', 'Status', 'Criado em', 'Ações'].map(h => (
                                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '13px', borderBottom: '2px solid #ddd', color: '#555' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {gestores.map((g, i) => (
                                    <tr key={g.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#888' }}>{i + 1}</td>
                                        <td style={{ padding: '11px 14px', fontSize: '13px' }}>{g.email}</td>
                                        <td style={{ padding: '11px 14px', fontSize: '13px', fontFamily: 'monospace' }}>{g.cpf}</td>
                                        <td style={{ padding: '11px 14px', fontSize: '13px' }}>
                                            {g.role === 'superadmin'
                                                ? <span style={{ color: '#6a1b9a', fontWeight: 'bold' }}>🛡️ Super Admin</span>
                                                : <span style={{ color: '#1565c0', fontWeight: 'bold' }}>👤 Gestor</span>
                                            }
                                        </td>
                                        <td style={{ padding: '11px 14px', fontSize: '13px' }}>
                                            {g.is_temp_password
                                                ? <span style={{ color: '#f57c00', fontWeight: 'bold' }}>⚠️ Senha temporária</span>
                                                : <span style={{ color: VERDE, fontWeight: 'bold' }}>✅ Ativo</span>
                                            }
                                        </td>
                                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#888' }}>
                                            {new Date(g.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td style={{ padding: '11px 14px', display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleResetSenha(g.id, g.email)}
                                                style={{ background: '#f57c00', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                            >
                                                🔑 Resetar Senha
                                            </button>
                                            <button
                                                onClick={() => handleRemover(g.id, g.email)}
                                                style={{ background: '#c62828', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                            >
                                                🗑️ Remover
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL: NOVO GESTOR */}
            {modalAberto && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '10px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ color: VERDE, margin: '0 0 20px 0' }}>➕ Criar Novo Gestor</h3>
                        <form onSubmit={handleCriarGestor}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px', fontWeight: 'bold' }}>Email</label>
                                <input
                                    type="email" required
                                    value={novoGestor.email}
                                    onChange={e => setNovoGestor(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="gestor@email.com"
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px', fontWeight: 'bold' }}>CPF</label>
                                <input
                                    type="text" required
                                    value={novoGestor.cpf}
                                    onChange={handleCpfChange}
                                    placeholder="000.000.000-00"
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px', fontWeight: 'bold' }}>Nível de Acesso</label>
                                <select
                                    value={novoGestor.role}
                                    onChange={e => setNovoGestor(prev => ({ ...prev, role: e.target.value }))}
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                                >
                                    <option value="gestor">Gestor comum</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit" disabled={enviando}
                                    style={{ flex: 1, background: VERDE, color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    {enviando ? '⏳ Criando...' : '✅ Criar Gestor'}
                                </button>
                                <button
                                    type="button" onClick={() => setModalAberto(false)}
                                    style={{ flex: 1, background: '#eee', color: '#555', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PainelSuperAdmin;
