import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../../styles/RegisterCompany.css';

import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconMarker,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ setPosicao }) {
    const [position, setPosition] = useState(null);
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            setPosicao(e.latlng);
        },
    });
    return position === null ? null : <Marker position={position} />;
}

export default function NovaOcorrenciaGestor() {
    const navigate = useNavigate();
    const [fileName, setFileName] = useState('Nenhum arquivo escolhido');
    const [foto, setFoto] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const [form, setForm] = useState({
        quantidade: 'Pequena',
        problemas_causados: '',
        descricao_adicional: '',
        lat: '',
        lng: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        fetch('http://localhost:3000/api/companies/categories')
            .then(res => res.json())
            .then(data => setCategorias(data))
            .catch(() => toast.error('Erro ao carregar categorias.'));
    }, [navigate]);

    const handleCategoriaChange = (id) => {
        setCategoriasSelecionadas(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleMapClick = (latlng) => {
        setForm(prev => ({ ...prev, lat: latlng.lat, lng: latlng.lng }));
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
            setFoto(e.target.files[0]);
        } else {
            setFileName('Nenhum arquivo escolhido');
            setFoto(null);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.lat || !form.lng) {
            toast('Por favor, clique no mapa para marcar o local!', { icon: '⚠️' });
            return;
        }

        if (categoriasSelecionadas.length === 0) {
            toast('Selecione pelo menos um tipo de resíduo.', { icon: '⚠️' });
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        setEnviando(true);
        try {
            const formData = new FormData();
            categoriasSelecionadas.forEach(id => formData.append('categorias', id));
            formData.append('quantidade', form.quantidade);
            formData.append('problemas_causados', form.problemas_causados);
            formData.append('descricao_adicional', form.descricao_adicional);
            formData.append('lat', form.lat);
            formData.append('lng', form.lng);
            if (foto) formData.append('foto', foto);

            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                toast.success('Ocorrência registrada com sucesso!');
                navigate('/admin');
            } else {
                const erroTexto = await response.text();
                toast.error(`Erro ${response.status}: ${erroTexto}`);
                setEnviando(false);
            }
        } catch {
            toast.error('Erro ao conectar com o servidor.');
            setEnviando(false);
        }
    };

    return (
        <div>
            <nav className="navbar">
                <div className="brand" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                    📊 Painel do Gestor
                </div>
                <button onClick={() => navigate('/admin')} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ← Voltar ao Painel
                </button>
            </nav>

            <div className="ocorrencia-container">
                <h2 style={{ color: '#2e7d32', textAlign: 'center', marginBottom: '20px', marginTop: '20px' }}>
                    ➕ Registrar Nova Ocorrência
                </h2>

                <form onSubmit={handleSubmit} className="ocorrencia-grid">

                    {/* COLUNA 1: MAPA */}
                    <div className="ocorrencia-card map-column">
                        <h3 style={{ marginTop: 0, marginBottom: '5px', color: '#2e7d32' }}>1. Localização</h3>
                        <p className="map-instruction" style={{ marginTop: 0, marginBottom: '10px' }}>
                            Clique no local exato do lixo no mapa abaixo:
                        </p>

                        <div className="form-map-large">
                            <MapContainer
                                center={[-16.2531, -47.9503]}
                                zoom={14}
                                style={{ height: '500px', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <LocationMarker setPosicao={handleMapClick} />
                            </MapContainer>
                        </div>

                        <div style={{ marginTop: '10px', padding: '12px', background: '#e8f5e9', borderRadius: '6px', fontSize: '14px', color: '#2e7d32', textAlign: 'center', border: '1px solid #c5e1a5' }}>
                            <strong>Coordenadas: </strong>
                            {form.lat
                                ? `${form.lat}, ${form.lng}`
                                : <span style={{ color: '#777', fontStyle: 'italic' }}>Aguardando clique no mapa...</span>
                            }
                        </div>
                    </div>

                    {/* COLUNA 2: DADOS */}
                    <div className="ocorrencia-card">
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2e7d32' }}>2. Detalhes da Ocorrência</h3>

                        <div className="categories-section">
                            <h4 className="categories-title">
                                ♻️ Tipo de Resíduo (selecione todos que se aplicam)
                            </h4>
                            <div className="categories-grid">
                                {categorias.map(cat => (
                                    <label
                                        key={cat.id}
                                        className={`category-chip ${categoriasSelecionadas.includes(cat.id) ? 'active' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={categoriasSelecionadas.includes(cat.id)}
                                            onChange={() => handleCategoriaChange(cat.id)}
                                            style={{ display: 'none' }}
                                        />
                                        {cat.nome}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Quantidade Estimada:</label>
                            <select name="quantidade" className="form-select" value={form.quantidade} onChange={handleChange}>
                                <option>Pequena</option>
                                <option>Média</option>
                                <option>Grande</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Problemas Observados:</label>
                            <input
                                type="text" name="problemas_causados" className="form-input"
                                placeholder="Ex: Mau cheiro, bloqueio de rua..."
                                value={form.problemas_causados} onChange={handleChange} required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Descrição Adicional:</label>
                            <textarea
                                name="descricao_adicional" className="form-textarea" rows="4"
                                placeholder="Ponto de referência ou detalhes extras..."
                                value={form.descricao_adicional} onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">3. Foto (Opcional):</label>
                            <label htmlFor="foto-gestor" className="custom-file-upload">
                                <span className="upload-label">📷 Escolher Foto</span>
                                <span style={{ marginTop: '5px' }}>{fileName}</span>
                            </label>
                            <input type="file" id="foto-gestor" accept="image/*" onChange={handleFileChange} />
                        </div>

                        <button type="submit" className="btn-submit" style={{ marginTop: '20px' }} disabled={enviando}>
                            {enviando ? '⏳ Enviando...' : '🚀 Registrar Ocorrência'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
