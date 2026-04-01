// src/LoginManager.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [cpf, setCpf] = useState('');
    const [senha, setSenha] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
    e.preventDefault();
    try {

        // Remove tudo que não for número antes de enviar para o banco
        const cpfLimpo = cpf.replace(/\D/g, '');

        const response = await axios.post('http://localhost:3000/api/login', {
            cpf: cpfLimpo, // enviando a variável cpf do state
            password: senha
        });

        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userType', 'admin');
            localStorage.setItem('userEmail', response.data.user.email);
            
            // Forçamos o 'true' ou 'false' a virar texto:
            localStorage.setItem('needsPasswordChange', String(response.data.user.needsPasswordChange));

            if (response.data.user.needsPasswordChange === true) {
                alert('🚩 Atenção: Sua senha é temporária e precisa ser alterada agora.');
                navigate('/change-password');
            } else {
                alert('✅ Login realizado!');
                navigate('/admin');
            }
        }


    } catch (error) {
        console.error(error);
        alert('❌ Erro no login: ' + (error.response?.data?.error || 'Servidor offline'));
    }
};

    // Estilos inline específicos para ficar igual à imagem
    const inputStyle = {
        backgroundColor: '#e3f2fd', // Azulzinho claro
        border: '1px solid #bbdefb'
    };

    const linkStyle = {
        color: '#4a148c', // Roxo
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '14px',
        display: 'inline-block',
        marginTop: '10px'
    };

    const listStyle = {
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
                
                {/* CABEÇALHO */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ color: '#555', fontSize: '13px', textTransform: 'uppercase', marginBottom: '5px', fontWeight: 'bold' }}>
                        🛡️ Área Administrativa
                    </div>
                    <h2 style={{ color: '#2e7d32', margin: 0, border: 'none', fontSize: '24px' }}>
                        Login Administrador
                    </h2>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">CPF do Administrador</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            style={inputStyle}
                            value={cpf} 
                            onChange={(e) => setCpf(e.target.value)}
                            placeholder="000.000.000-00"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            style={inputStyle}
                            value={senha} 
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="......"
                        />
                    </div>
                    
                    <button type="submit" className="btn-submit" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        ➜ Entrar como Administrador
                    </button>
                </form>

                {/* LINK VOLTAR */}
                <div style={{ textAlign: 'center' }}>
                    <Link to="/" style={linkStyle}>
                        ← Voltar ao início
                    </Link>
                </div>

                {/* INFORMAÇÕES IMPORTANTES */}
                <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
                        ℹ️ Informações importantes:
                    </h4>
                    <ul style={listStyle}>
                        <li>🔑 Acesso restrito a administradores autorizados</li>
                        <li>🛡️ Use suas credenciais fornecidas pelo sistema</li>
                        <li>🕒 Senhas temporárias devem ser alteradas no primeiro acesso</li>
                    </ul>
                </div>

            </div>
        </div>
    );
}

export default Login;
