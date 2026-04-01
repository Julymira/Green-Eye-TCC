import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ChangePassword() {
    const [formData, setFormData] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const navigate = useNavigate();

    useEffect(() => {
        // Pega o email que salvamos no login
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail }));
        } else {
            navigate('/'); // Se não tem email, volta pro login
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            return setMessage({ text: 'As senhas não coincidem!', type: 'error' });
        }

        try {
            await axios.post('http://localhost:3000/api/admin/change-password', {
                email: formData.email,
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            setMessage({ text: 'Senha alterada com sucesso! Redirecionando...', type: 'success' });
            
            // Atualiza o localStorage para dizer que não precisa mais trocar
            localStorage.setItem('needsPasswordChange', 'false');

            setTimeout(() => navigate('/admin'), 2000);
        } catch (error) {
            setMessage({ 
                text: error.response?.data?.error || 'Erro ao alterar senha', 
                type: 'error' 
            });
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5', fontFamily: 'Arial' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '400px', textAlign: 'center' }}>
                <div style={{ background: '#ff5722', color: 'white', padding: '8px', borderRadius: '15px', fontSize: '12px', marginBottom: '20px', fontWeight: 'bold' }}>
                    ⚠️ REDEFINIÇÃO OBRIGATÓRIA
                </div>
                <h2 style={{ color: '#2e7d32' }}>Alterar Senha</h2>
                
                {message.text && (
                    <div style={{ padding: '10px', marginBottom: '10px', borderRadius: '5px', 
                        backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                        color: message.type === 'success' ? '#155724' : '#721c24' }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Email</label>
                    <input type="email" value={formData.email} readOnly style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', background: '#eee' }} />

                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Senha Atual (Temporária)</label>
                    <input type="password" required value={formData.currentPassword} 
                        onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                        style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px' }} />

                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Nova Senha</label>
                    <input type="password" required minLength="6" value={formData.newPassword}
                        onChange={e => setFormData({...formData, newPassword: e.target.value})}
                        style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px' }} />

                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Confirmar Nova Senha</label>
                    <input type="password" required value={formData.confirmPassword}
                        onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                        style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px' }} />

                    <button type="submit" style={{ width: '100%', padding: '12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Alterar Senha
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;