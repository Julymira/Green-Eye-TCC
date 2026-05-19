import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [tipo, setTipo] = useState('user');
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [contador, setContador] = useState(60);
    const navigate = useNavigate();

    useEffect(() => {
        if (!enviado) return;
        const interval = setInterval(() => {
            setContador(c => {
                if (c <= 1) {
                    clearInterval(interval);
                    navigate('/');
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [enviado, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = tipo === 'company'
                ? '/api/companies/forgot-password'
                : '/api/admin/forgot-password';

            await axios.post(endpoint, { email: email.toLowerCase() });
            setEnviado(true);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao enviar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (enviado) {
        return (
            <div className="form-container">
                <div className="form-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                    <h2 style={{ color: '#2e7d32' }}>E-mail enviado!</h2>
                    <p style={{ color: '#555', lineHeight: '1.6' }}>
                        As instruções de redefinição foram enviadas para <strong>{email}</strong>.
                    </p>
                    <p style={{ color: '#888', fontSize: '13px' }}>
                        Verifique também sua caixa de spam. O link é válido por 1 hora.
                    </p>
                    <p style={{ color: '#2e7d32', fontWeight: 'bold', marginTop: '16px' }}>
                        Redirecionando para a página inicial em {contador}s...
                    </p>
                    <div style={{ marginTop: '8px' }}>
                        <Link to="/" style={{ color: '#4a148c', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                            ← Ir para o início agora
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
                        🔑 Recuperação de acesso
                    </div>
                    <h2 style={{ color: '#2e7d32', margin: 0, border: 'none', fontSize: '24px' }}>
                        Esqueci minha senha
                    </h2>
                    <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>
                        Informe seu e-mail e enviaremos um link para redefinir sua senha.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Tipo de conta</label>
                        <select
                            className="form-input"
                            style={inputStyle}
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                        >
                            <option value="user">Gestor (Admin)</option>
                            <option value="company">Empresa / ONG</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">E-mail cadastrado</label>
                        <input
                            type="email"
                            className="form-input"
                            style={inputStyle}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        {loading ? 'Enviando...' : '➜ Enviar link de redefinição'}
                    </button>
                </form>

                <div style={{ textAlign: 'center' }}>
                    <Link to="/login" style={linkStyle}>← Voltar ao login</Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
