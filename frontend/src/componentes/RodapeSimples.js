import React from 'react';

export default function RodapeSimples() {
    return (
        <footer style={{
            borderTop: '1px solid #e0e0e0',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            background: '#fafafa',
            marginTop: 'auto',
        }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>
                🌿 <strong style={{ color: '#2e7d32' }}>Green Eye</strong> — Sistema de Monitoramento Ambiental
            </span>
            <span style={{ fontSize: '12px', color: '#ccc' }}>
                © 2026 Julyana Mira Medeiros
            </span>
        </footer>
    );
}
