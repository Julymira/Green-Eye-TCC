import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');
    const tipo = searchParams.get('tipo'); // 'user' ou 'company'

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token || !tipo) {
            toast.error('Link inválido.');
            navigate('/');
        }
    }, [token, tipo, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return toast.error('As senhas não coincidem.');
        }

        if (newPassword.length < 6) {
            return toast.error('A senha deve ter pelo menos 6 caracteres.');
        }

        setLoading(true);

        try {
            const endpoint = tipo === 'company'
                ? 'http://localhost:3000/api/companies/reset-password'
                : 'http://localhost:3000/api/admin/reset-password';

            await axios.post(endpoint, { token, newPassword });

            toast.success('Senha redefinida com sucesso!');

            setTimeout(() => {
                navigate(tipo === 'company' ? '/login-empresa' : '/login');
            }, 2000);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao redefinir senha. O link pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        backgroundColor: '#e3f2fd',
        border: '1px solid #bbdefb'
    };

    const linkStyle = {
        color: '#4a148c',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '14px',
        display: 'inline-block',
        marginTop: '10px'
    };

    return (
        <div className="form-container">
            <div className="form-card" style={{ maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ color: '#555', fontSize: '13px', textTransform: 'uppercase', marginBottom: '5px', fontWeight: 'bold' }}>
                        🔒 Nova senha
                    </div>
                    <h2 style={{ color: '#2e7d32', margin: 0, border: 'none', fontSize: '24px' }}>
                        Redefinir senha
                    </h2>
                    <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>
                        Escolha uma nova senha para sua conta.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nova senha</label>
                        <input
                            type="password"
                            className="form-input"
                            style={inputStyle}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirmar nova senha</label>
                        <input
                            type="password"
                            className="form-input"
                            style={inputStyle}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        {loading ? 'Salvando...' : '➜ Salvar nova senha'}
                    </button>
                </form>

                <div style={{ textAlign: 'center' }}>
                    <Link to="/login" style={linkStyle}>← Voltar ao login</Link>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
