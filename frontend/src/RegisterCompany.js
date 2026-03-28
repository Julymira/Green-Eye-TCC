import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function RegisterCompany() {
    const [formData, setFormData] = useState({
        nome_fantasia: '',
        cnpj: '',
        email_contato: '',
        password: '',
        telefone: '',
        responsavel: '',
        is_ong: false
    });

    const [categories, setCategories] = useState([]); 
    const [selectedCategories, setSelectedCategories] = useState([]);
    const navigate = useNavigate();

    // Busca categorias do banco
    useEffect(() => {
        axios.get('http://localhost:3000/api/companies/categories')
            .then(res => setCategories(res.data))
            .catch(err => console.error("Erro ao carregar categorias", err));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleCategoryToggle = (categoryId) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
        } else {
            if (selectedCategories.length < 3) {
                setSelectedCategories([...selectedCategories, categoryId]);
            } else {
                alert("⚠️ Como empresa parceira, você pode selecionar no máximo 3 categorias.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedCategories.length === 0) {
            alert("❌ Selecione pelo menos uma categoria de coleta.");
            return;
        }

        try {
            const payload = { ...formData, categories: selectedCategories };
            await axios.post('http://localhost:3000/api/companies', payload);
            alert("✅ Empresa cadastrada com sucesso!");
            navigate('/login');
        } catch (error) {
            alert("❌ Erro ao cadastrar. Verifique se o CNPJ ou E-mail já existem.");
        }
    };

    // Estilos iguais ao seu Login.js
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
            <div className="form-card" style={{ maxWidth: '500px' }}>
                
                {/* CABEÇALHO IGUAL AO LOGIN */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ color: '#555', fontSize: '13px', textTransform: 'uppercase', marginBottom: '5px', fontWeight: 'bold' }}>
                        💼 Programa de Parceiros
                    </div>
                    <h2 style={{ color: '#2e7d32', margin: 0, border: 'none', fontSize: '24px' }}>
                        Cadastro de Empresa
                    </h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nome Fantasia / Razão Social</label>
                        <input name="nome_fantasia" className="form-input" style={inputStyle} onChange={handleChange} required />
                    </div>

                    <div className="location-grid">
                        <div className="form-group">
                            <label className="form-label">CNPJ</label>
                            <input name="cnpj" className="form-input" style={inputStyle} onChange={handleChange} required placeholder="00.000.000/0001-00" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Responsável</label>
                            <input name="responsavel" className="form-input" style={inputStyle} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="location-grid">
                        <div className="form-group">
                            <label className="form-label">Telefone</label>
                            <input name="telefone" className="form-input" style={inputStyle} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">E-mail de Contato</label>
                            <input name="email_contato" type="email" className="form-input" style={inputStyle} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Senha de Acesso</label>
                        <input name="password" type="password" className="form-input" style={inputStyle} onChange={handleChange} required />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label className="checkbox-label" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                            <input name="is_ong" type="checkbox" onChange={handleChange} />
                            🛡️ Somos uma ONG (Entidade sem fins lucrativos)
                        </label>
                    </div>

                    {/* SEÇÃO DE CATEGORIAS ESTILIZADA */}
                    <div className="categories-section" style={{ border: '1px solid #bbdefb', backgroundColor: '#f0f7ff' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#01579b' }}>
                            ♻️ O que sua empresa coleta? (Máximo 3)
                        </h4>
                        <div className="categories-grid">
                            {categories.map(cat => (
                                <button 
                                    key={cat.id}
                                    type="button"
                                    className={selectedCategories.includes(cat.id) ? 'cat-btn active' : 'cat-btn'}
                                    onClick={() => handleCategoryToggle(cat.id)}
                                >
                                    {cat.nome}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn-submit" style={{ marginTop: '20px' }}>
                        ➜ Finalizar Cadastro de Parceiro
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <Link to="/login-empresa" style={{ ...linkStyle, color: '#2e7d32' }}>
                        Já é parceiro? Clique aqui!
                    </Link>
                </div>

                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <Link to="/" style={linkStyle}>
                        ← Voltar ao início
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default RegisterCompany;