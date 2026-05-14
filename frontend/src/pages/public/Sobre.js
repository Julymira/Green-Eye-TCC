import React, { useState } from 'react';

const EMAIL = 'julyanamcontato@gmail.com';

function BotaoEmail({ style }) {
    const [copiado, setCopiado] = useState(false);

    function copiar() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(EMAIL).then(() => {
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
            }).catch(() => copiarFallback());
        } else {
            copiarFallback();
        }
    }

    function copiarFallback() {
        const el = document.createElement('textarea');
        el.value = EMAIL;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    }

    return (
        <button
            onClick={copiar}
            title="Clique para copiar o e-mail"
            style={{
                ...style,
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '8px',
                fontWeight: 'bold', fontSize: '14px',
                background: copiado ? '#2e7d32' : '#ea4335',
                color: 'white', border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'background 0.2s',
            }}
        >
            {copiado ? `✅ ${EMAIL} copiado!` : `📧 ${EMAIL}`}
        </button>
    );
}

const VERDE = '#2e7d32';
const VERDE_CLARO = '#e8f5e9';

function LinkBtn({ href, emoji, label, cor }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '8px', textDecoration: 'none',
                fontWeight: 'bold', fontSize: '14px',
                background: cor, color: 'white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
            {emoji} {label}
        </a>
    );
}

function Tecnologia({ nome, descricao, cor }) {
    return (
        <div style={{
            padding: '12px 16px', borderRadius: '8px',
            background: cor + '15', border: `1px solid ${cor}44`,
        }}>
            <div style={{ fontWeight: 'bold', color: cor, fontSize: '14px' }}>{nome}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>{descricao}</div>
        </div>
    );
}

export default function Sobre() {
    return (
        <div style={{ padding: '40px 20px', maxWidth: '860px', margin: '0 auto' }}>

            {/* HERO */}
            <div style={{
                background: `linear-gradient(135deg, ${VERDE}, #1b5e20)`,
                borderRadius: '16px', padding: '48px 40px', textAlign: 'center',
                color: 'white', marginBottom: '40px',
                boxShadow: '0 4px 20px rgba(46,125,50,0.3)'
            }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>🌿</div>
                <h1 style={{ margin: '0 0 8px', fontSize: '32px', letterSpacing: '1px' }}>Green Eye</h1>
                <p style={{ margin: 0, fontSize: '16px', opacity: 0.9, maxWidth: '520px', marginInline: 'auto' }}>
                    Sistema de Monitoramento Ambiental para gestão de descarte irregular de resíduos urbanos em Luziânia/GO
                </p>
            </div>

            {/* DESENVOLVEDORA */}
            <div style={{
                background: 'white', borderRadius: '14px',
                border: '1px solid #e0e0e0', padding: '36px 40px',
                marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
                <h2 style={{ color: VERDE, margin: '0 0 24px', fontSize: '20px', borderBottom: `2px solid ${VERDE_CLARO}`, paddingBottom: '12px' }}>
                    👩‍💻 Desenvolvedora
                </h2>

                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <h3 style={{ margin: '0 0 6px', fontSize: '22px', color: '#1b5e20' }}>Julyana Mira Medeiros</h3>
                        <p style={{ margin: '0 0 16px', color: '#666', fontSize: '14px', lineHeight: '1.7' }}>
                            Desenvolvedora do sistema Green Eye como Trabalho de Conclusão de Curso (TCC).
                            O projeto nasceu da necessidade real de Luziânia/GO em monitorar e gerenciar
                            ocorrências de descarte irregular de resíduos, contando com apoio da prefeitura municipal.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <LinkBtn href="https://www.linkedin.com/in/julymira" emoji="💼" label="LinkedIn" cor="#0077b5" />
                            <LinkBtn href="https://github.com/Julymira" emoji="🐙" label="GitHub" cor="#24292e" />
                            <LinkBtn href="https://instagram.com/Julymira_" emoji="📸" label="Instagram" cor="#e1306c" />
                            <BotaoEmail />
                        </div>
                    </div>
                </div>
            </div>

            {/* SOBRE O PROJETO */}
            <div style={{
                background: 'white', borderRadius: '14px',
                border: '1px solid #e0e0e0', padding: '36px 40px',
                marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
                <h2 style={{ color: VERDE, margin: '0 0 20px', fontSize: '20px', borderBottom: `2px solid ${VERDE_CLARO}`, paddingBottom: '12px' }}>
                    📋 Sobre o Projeto
                </h2>
                <div style={{ display: 'grid', gap: '16px', fontSize: '14px', color: '#444', lineHeight: '1.8' }}>
                    <p style={{ margin: 0 }}>
                        O <strong>Green Eye</strong> é um sistema web completo desenvolvido para facilitar o registro,
                        monitoramento e resolução de ocorrências de descarte irregular de resíduos urbanos.
                        A plataforma conecta <strong>cidadãos</strong>, <strong>gestores municipais</strong> e
                        <strong> empresas coletoras</strong> em um único ambiente digital.
                    </p>
                    <p style={{ margin: 0 }}>
                        O projeto conta com o interesse da <strong>Prefeitura Municipal de Luziânia/GO</strong>,
                        demonstrando o impacto real que uma solução tecnológica acadêmica pode ter na gestão pública ambiental.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '8px' }}>
                        {[
                            { emoji: '🗺️', texto: 'Mapa interativo de ocorrências com heatmap' },
                            { emoji: '📊', texto: 'Relatórios estatísticos completos com exportação em PDF' },
                            { emoji: '♻️', texto: 'Pontos de descarte correto para a população' },
                            { emoji: '🏭', texto: 'Portal para empresas e ONGs coletoras' },
                            { emoji: '🛡️', texto: 'Painel administrativo com controle de acesso por nível' },
                            { emoji: '📍', texto: 'Geolocalização e PostGIS para análise espacial' },
                        ].map(({ emoji, texto }) => (
                            <div key={texto} style={{
                                display: 'flex', gap: '10px', alignItems: 'flex-start',
                                background: VERDE_CLARO, borderRadius: '8px', padding: '12px'
                            }}>
                                <span style={{ fontSize: '20px' }}>{emoji}</span>
                                <span style={{ fontSize: '13px', color: '#2e7d32', fontWeight: '500' }}>{texto}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* TECNOLOGIAS */}
            <div style={{
                background: 'white', borderRadius: '14px',
                border: '1px solid #e0e0e0', padding: '36px 40px',
                marginBottom: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
                <h2 style={{ color: VERDE, margin: '0 0 20px', fontSize: '20px', borderBottom: `2px solid ${VERDE_CLARO}`, paddingBottom: '12px' }}>
                    🛠️ Tecnologias Utilizadas
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    <Tecnologia nome="React.js" descricao="Interface do usuário" cor="#61dafb" />
                    <Tecnologia nome="Node.js + Express" descricao="API e servidor backend" cor="#68a063" />
                    <Tecnologia nome="PostgreSQL + PostGIS" descricao="Banco de dados geoespacial" cor="#336791" />
                    <Tecnologia nome="React Leaflet" descricao="Mapas interativos" cor="#199900" />
                    <Tecnologia nome="Recharts" descricao="Gráficos e visualizações" cor="#8884d8" />
                    <Tecnologia nome="JWT + bcrypt" descricao="Autenticação segura" cor="#e67e22" />
                    <Tecnologia nome="jsPDF" descricao="Exportação em PDF" cor="#c62828" />
                    <Tecnologia nome="React Router v6" descricao="Navegação entre páginas" cor="#ca4245" />
                </div>
            </div>

            {/* RODAPÉ DA PÁGINA */}
            <div style={{ textAlign: 'center', color: '#aaa', fontSize: '13px', paddingTop: '8px' }}>
                © 2026 Julyana Mira Medeiros — Todos os direitos reservados à autora.<br />
                Green Eye foi desenvolvido como Trabalho de Conclusão de Curso (TCC).
            </div>
        </div>
    );
}
