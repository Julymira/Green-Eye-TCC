// src/NovaOcorrencia.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../../styles/RegisterCompany.css';

// --- ÍCONES ---
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

// --- COMPONENTE DE CLIQUE ---
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

function NovaOcorrencia() {
    const navigate = useNavigate();
    const [fileName, setFileName] = useState('Nenhum arquivo escolhido');
    const [foto, setFoto] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        fetch('http://localhost:3000/api/companies/categories')
            .then(res => res.json())
            .then(data => setCategorias(data))
            .catch(err => console.error('Erro ao buscar categorias:', err));
    }, []);

    const handleCategoriaChange = (id) => {
        setCategoriasSelecionadas(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const [form, setForm] = useState({
        quantidade: 'Pequena',
        problemas_causados: '',
        descricao_adicional: '',
        lat: '', 
        lng: ''
    });

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
                body: formData
            });

            if (response.ok) {
                toast.success("Ocorrência enviada com sucesso!");
                navigate('/');
            } else {
                const erroTexto = await response.text();
                console.error("Erro do servidor:", erroTexto);
                toast.error(`Erro ${response.status}: ${erroTexto}`);
                setEnviando(false);
            }
        } catch (error) {
            console.error("Erro de rede:", error);
            toast.error("Erro ao conectar com o servidor. Verifique se o backend está rodando.");
            setEnviando(false);
        }
    };

    return (
        <div className="ocorrencia-container">
            {/* Título da Página com margem ajustada */}
            <h2 style={{color: '#2e7d32', textAlign: 'center', marginBottom: '20px', marginTop: '20px'}}>
                📢 Cadastrar Nova Ocorrência
            </h2>
            
            <form onSubmit={handleSubmit} className="ocorrencia-grid">
                
                {/* COLUNA 1: MAPA (ESQUERDA) */}
                <div className="ocorrencia-card map-column">
                    {/* AJUSTE AQUI: Margem inferior pequena (5px) */}
                    <h3 style={{marginTop: 0, marginBottom: '5px', color: '#2e7d32'}}>1. Localização</h3>
                    
                    {/* AJUSTE AQUI: Margem superior zero */}
                    <p className="map-instruction" style={{marginTop: 0, marginBottom: '10px'}}>
                        Clique no local exato do lixo no mapa abaixo:
                    </p>
                    
                    <div className="form-map-large">
                        <MapContainer
                            center={[-16.2531, -47.9503]}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
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
                            : <span style={{color: '#777', fontStyle: 'italic'}}>Aguardando clique no mapa...</span>
                        }
                    </div>
                </div>

                {/* COLUNA 2: DADOS (DIREITA) */}
                <div className="ocorrencia-card">
                    {/* AJUSTE AQUI: Margem inferior padrão para alinhar visualmente */}
                    <h3 style={{marginTop: 0, marginBottom: '15px', color: '#2e7d32'}}>2. Detalhes da Ocorrência</h3>

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
                        <label htmlFor="foto" className="custom-file-upload">
                            <span className="upload-label">📷 Escolher Foto</span>
                            <span id="file-name" style={{marginTop: '5px'}}>{fileName}</span>
                        </label>
                        <input type="file" id="foto" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <button type="submit" className="btn-submit" style={{marginTop: '20px'}} disabled={enviando}>
                        {enviando ? '⏳ Enviando...' : '🚀 Enviar Ocorrência'}
                    </button>
                </div>

            </form>
        </div>
    );
}

export default NovaOcorrencia;