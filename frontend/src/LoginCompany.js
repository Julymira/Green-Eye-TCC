import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function LoginCompany() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            // Rota para autenticar empresas (E-mail + Senha)
            const response = await axios.post('http://localhost:3000/api/companies/login', {
                email_contato: email,
                password: password
            });

            if (response.data.token) {
                // Salva o token para persistência e identifica o tipo de usuário
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userType', 'company');
                alert('✅ Login realizado com sucesso!');
                navigate('/dashboard-empresa'); // Página que criaremos para o "match" de lixo
            }
        } catch (error) {
            alert('❌ E-mail ou senha incorretos!');
        }
    };

    // Estilos inline para seguir o padrão do seu Login.js
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

    const infoListStyle = {
        listStyle: 'none',
        padding: 0,
        fontSize: '13px',
        color: '#444',
        textAlign: 'left',
        lineHeight: '1.8'
    };

    return (
        <div className="form-container">
            <div className="form-card" style={{ maxWidth: '400px' }}>
                
                {/* CABEÇALHO INTEGRADO AO ESTILO GREEN EYE */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ color: '#555', fontSize: '13px', textTransform: 'uppercase', marginBottom: '5px', fontWeight: 'bold' }}>
                        💼 Portal do Parceiro
                    </div>
                    <h2 style={{ color: '#2e7d32', margin: 0, border: 'none', fontSize: '24px' }}>
                        Login Empresa
                    </h2>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">E-mail de Contato</label>
                        <input 
                            type="email" 
                            className="form-input" 
                            style={inputStyle}
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contato@empresa.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            style={inputStyle}
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="......"
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn-submit" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        ➜ Entrar no Painel da Empresa
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <Link to="/cadastro-empresa" style={{ ...linkStyle, color: '#2e7d32' }}>
                        Ainda não é parceiro? Cadastre-se aqui!
                    </Link>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <Link to="/" style={linkStyle}>
                        ← Voltar ao início
                    </Link>
                </div>

                {/* INFORMAÇÕES DE AJUDA PARA O PARCEIRO */}
                <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
                        ℹ️ Instruções de acesso:
                    </h4>
                    <ul style={infoListStyle}>
                        <li>♻️ Visualize denúncias de acordo com sua especialidade [cite: 700]</li>
                        <li>📅 Gerencie o status das coletas em Luziânia [cite: 106, 695]</li>
                        <li>🔒 Mantenha suas credenciais em segurança </li>
                    </ul>
                </div>

            </div>
        </div>
    );
}

export default LoginCompany;