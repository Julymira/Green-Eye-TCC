import React from 'react';
import { Link } from 'react-router-dom';

export default function Rodape() {
    return (
        <footer style={{
            background: '#1b5e20',
            color: 'rgba(255,255,255,0.85)',
            padding: '28px 24px 20px',
            marginTop: '48px',
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>

                    {/* MARCA */}
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'white', marginBottom: '4px' }}>
                            🌿 Green Eye
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7, maxWidth: '260px', lineHeight: '1.6' }}>
                            Sistema de Monitoramento Ambiental Urbano — Luziânia/GO
                        </div>
                    </div>

                    {/* LINKS */}
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Sistema</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <Link to="/" style={linkStyle}>Início</Link>
                                <Link to="/ocorrencia" style={linkStyle}>Reportar Ocorrência</Link>
                                <Link to="/pontos-coleta" style={linkStyle}>Pontos de Coleta</Link>
                                <Link to="/sobre" style={linkStyle}>Sobre o Projeto</Link>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Desenvolvedora</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <a href="https://www.linkedin.com/in/julymira" target="_blank" rel="noopener noreferrer" style={linkStyle}>💼 LinkedIn</a>
                                <a href="https://github.com/Julymira" target="_blank" rel="noopener noreferrer" style={linkStyle}>🐙 GitHub</a>
                                <a href="https://instagram.com/Julymira_" target="_blank" rel="noopener noreferrer" style={linkStyle}>📸 Instagram</a>
                                <a href="mailto:julyanamcontato@gmail.com" style={linkStyle}>📧 E-mail</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DIVISOR */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', opacity: 0.65 }}>
                        © 2026 <strong style={{ color: 'white' }}>Julyana Mira Medeiros</strong> — Todos os direitos reservados à autora.
                        Desenvolvido como Trabalho de Conclusão de Curso (TCC).
                    </div>
                    <Link to="/sobre" style={{ fontSize: '12px', color: '#a5d6a7', textDecoration: 'none', fontWeight: 'bold' }}>
                        Sobre o Sistema →
                    </Link>
                </div>

            </div>
        </footer>
    );
}

const linkStyle = {
    color: 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
    fontSize: '13px',
    transition: 'color 0.2s',
};
