import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

function CardPonto({ ponto }) {
    return (
        <div style={{
            background: 'white', borderRadius: '10px',
            border: '1px solid #e0e0e0', borderLeft: '4px solid #2e7d32',
            padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, color: '#1b5e20', fontSize: '16px' }}>{ponto.nome}</h3>
                {!ponto.ativo && (
                    <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>Inativo</span>
                )}
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>
                📍 {ponto.endereco}
            </div>
            {ponto.horario && (
                <div style={{ fontSize: '13px', color: '#555' }}>
                    🕐 {ponto.horario}
                </div>
            )}
            {ponto.telefone && (
                <div style={{ fontSize: '13px', color: '#555' }}>
                    📞 {ponto.telefone}
                </div>
            )}
            {ponto.tipos_residuo?.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                    {ponto.tipos_residuo.map(t => <BadgeTipo key={t} tipo={t} />)}
                </div>
            )}
        </div>
    );
}

export default function PontosColeta() {
    const [pontos, setPontos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [filtroCidade, setFiltroCidade] = useState('Todas');

    useEffect(() => {
        fetch('http://localhost:3000/api/pontos-coleta')
            .then(res => res.json())
            .then(data => setPontos(Array.isArray(data) ? data : []))
            .catch(() => setPontos([]))
            .finally(() => setCarregando(false));
    }, []);

    const cidades = ['Todas', ...new Set(pontos.map(p => p.cidade))];
    const tipos = ['Todos', ...Object.keys(TIPOS_INFO)];

    const pontosFiltrados = pontos.filter(p => {
        const okCidade = filtroCidade === 'Todas' || p.cidade === filtroCidade;
        const okTipo = filtroTipo === 'Todos' || p.tipos_residuo?.includes(filtroTipo);
        return okCidade && okTipo;
    });

    const pontosComCoordenadas = pontosFiltrados.filter(p => p.lat && p.lng);

    return (
        <div style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ color: '#2e7d32', margin: '0 0 8px 0', fontSize: '28px' }}>
                    ♻️ Pontos de Descarte Correto
                </h1>
                <p style={{ color: '#666', fontSize: '15px', maxWidth: '700px', margin: '0 auto' }}>
                    Encontre os locais oficiais para descartar seu lixo de forma responsável.
                    O descarte correto protege o meio ambiente e contribui para uma cidade mais limpa.
                </p>
            </div>

            {/* AVISO INFORMATIVO */}
            <div style={{
                background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '10px',
                padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '12px', alignItems: 'flex-start'
            }}>
                <span style={{ fontSize: '24px' }}>💡</span>
                <div style={{ fontSize: '14px', color: '#2e7d32', lineHeight: '1.6' }}>
                    <strong>Por que descartar corretamente?</strong> O descarte irregular de lixo contamina o solo e a água,
                    causa enchentes, atrai vetores de doenças e prejudica toda a comunidade.
                    Use os pontos indicados e ajude a manter Luziânia limpa!
                </div>
            </div>

            {/* FILTROS */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
                <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', marginRight: '8px' }}>Cidade:</label>
                    <select
                        value={filtroCidade}
                        onChange={e => setFiltroCidade(e.target.value)}
                        style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}
                    >
                        {cidades.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', marginRight: '8px' }}>Tipo de resíduo:</label>
                    <select
                        value={filtroTipo}
                        onChange={e => setFiltroTipo(e.target.value)}
                        style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}
                    >
                        {tipos.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <span style={{ fontSize: '13px', color: '#888', marginLeft: 'auto' }}>
                    {pontosFiltrados.length} ponto{pontosFiltrados.length !== 1 ? 's' : ''} encontrado{pontosFiltrados.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* MAPA */}
            {pontosComCoordenadas.length > 0 && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #2e7d32', marginBottom: '28px' }}>
                    <MapContainer center={[-16.2531, -47.9503]} zoom={13} style={{ height: '380px', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        {pontosComCoordenadas.map(p => (
                            <Marker key={p.id} position={[p.lat, p.lng]}>
                                <Popup>
                                    <strong>{p.nome}</strong><br />
                                    {p.endereco}<br />
                                    {p.horario && <span>🕐 {p.horario}<br /></span>}
                                    {p.tipos_residuo?.join(', ')}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            )}

            {/* LISTA DE PONTOS */}
            {carregando ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Carregando pontos...</div>
            ) : pontosFiltrados.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '48px', background: 'white',
                    borderRadius: '10px', border: '1px solid #e0e0e0', color: '#888'
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
                    <p>Nenhum ponto de coleta encontrado para os filtros selecionados.</p>
                    <p style={{ fontSize: '13px' }}>Em breve mais locais serão cadastrados!</p>
                </div>
            ) : (
                <div>
                    {/* Agrupa por cidade */}
                    {[...new Set(pontosFiltrados.map(p => p.cidade))].map(cidade => (
                        <div key={cidade} style={{ marginBottom: '28px' }}>
                            <h2 style={{
                                color: '#2e7d32', fontSize: '17px',
                                borderBottom: '2px solid #c5e1a5',
                                paddingBottom: '8px', marginBottom: '16px'
                            }}>
                                📍 {cidade}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                                {pontosFiltrados.filter(p => p.cidade === cidade).map(p => (
                                    <CardPonto key={p.id} ponto={p} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TIPOS DE RESÍDUO - GUIA */}
            <div style={{
                marginTop: '40px', background: 'white', borderRadius: '10px',
                border: '1px solid #e0e0e0', padding: '24px'
            }}>
                <h2 style={{ color: '#2e7d32', fontSize: '17px', marginTop: 0, marginBottom: '16px' }}>
                    📚 Guia Rápido de Descarte
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                    {[
                        { tipo: 'Eletrônico', desc: 'Celulares, computadores, televisores, pilhas e baterias.' },
                        { tipo: 'Orgânico', desc: 'Restos de alimentos, cascas, borra de café. Ideal para compostagem.' },
                        { tipo: 'Reciclável', desc: 'Papel, papelão, plástico limpo, vidro, metais e latas.' },
                        { tipo: 'Pneus', desc: 'Pneus velhos não devem ser jogados no lixo comum. Procure pontos específicos.' },
                        { tipo: 'Hospitalar', desc: 'Seringas, medicamentos vencidos e materiais perfurocortantes.' },
                        { tipo: 'Entulho', desc: 'Restos de construção civil. Nunca descarte em terrenos ou vias públicas.' },
                        { tipo: 'Móveis', desc: 'Sofás, colchões e móveis velhos têm pontos de coleta específicos.' },
                        { tipo: 'Lixo Doméstico', desc: 'Resíduos gerais do dia a dia, coletados pela limpeza pública.' },
                    ].map(({ tipo, desc }) => {
                        const info = TIPOS_INFO[tipo];
                        return (
                            <div key={tipo} style={{
                                padding: '12px 14px', borderRadius: '8px',
                                background: info.cor + '0d', border: `1px solid ${info.cor}33`
                            }}>
                                <div style={{ fontWeight: 'bold', color: info.cor, marginBottom: '4px', fontSize: '14px' }}>
                                    {info.emoji} {tipo}
                                </div>
                                <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.5' }}>{desc}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
