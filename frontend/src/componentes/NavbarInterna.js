import React from 'react';
import { useNavigate } from 'react-router-dom';

const ITENS_GESTOR = [
    { label: '📖 Tutorial',         path: '/admin/tutorial',         id: 'tutorial' },
    { label: '📊 Painel',           path: '/admin',                  id: 'painel' },
    { label: '➕ Nova Ocorrência',   path: '/admin/nova-ocorrencia',  id: 'nova-ocorrencia' },
    { label: '♻️ Pontos de Coleta', path: '/admin/pontos-coleta',    id: 'pontos-coleta' },
    { label: '📈 Relatórios',       path: '/admin/relatorios',       id: 'relatorios' },
    { label: '📋 Histórico',        path: '/admin/historico',        id: 'historico' },
];

const ITENS_SUPERADMIN = [
    { label: '📖 Tutorial',         path: '/superadmin/tutorial',    id: 'tutorial' },
    { label: '🛡️ Super Admin',     path: '/superadmin',             id: 'painel' },
    { label: '📊 Painel Gestor',    path: '/admin',                  id: 'painel-gestor' },
];

export default function NavbarInterna({ tipo = 'gestor', paginaAtual }) {
    const navigate = useNavigate();
    const isSuperAdmin = localStorage.getItem('userRole') === 'superadmin';

    const ITEM_SUPERADMIN = { label: '🛡️ Super Admin', path: '/superadmin', id: 'superadmin' };

    const itensGestor = isSuperAdmin
        ? [
            { label: '📖 Tutorial',         path: '/admin/tutorial',         id: 'tutorial' },
            ITEM_SUPERADMIN,
            { label: '📊 Painel',           path: '/admin',                  id: 'painel' },
            { label: '➕ Nova Ocorrência',   path: '/admin/nova-ocorrencia',  id: 'nova-ocorrencia' },
            { label: '♻️ Pontos de Coleta', path: '/admin/pontos-coleta',    id: 'pontos-coleta' },
            { label: '📈 Relatórios',       path: '/admin/relatorios',       id: 'relatorios' },
            { label: '📋 Histórico',        path: '/admin/historico',        id: 'historico' },
          ]
        : ITENS_GESTOR;

    const itens = tipo === 'superadmin' ? ITENS_SUPERADMIN : itensGestor;

    function handleLogout() {
        localStorage.clear();
        navigate('/login');
    }

    return (
        <nav style={{
            background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
        }}>
            {/* MARCA */}
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '17px', marginRight: '8px' }}>
                🌿 Green Eye
            </span>

            {/* ITENS DE NAVEGAÇÃO */}
            {itens.map(item => {
                const ativo = item.id === paginaAtual;
                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        disabled={ativo}
                        style={{
                            background: ativo ? 'rgba(255,255,255,0.25)' : 'transparent',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.4)',
                            padding: '7px 13px',
                            borderRadius: '6px',
                            fontWeight: ativo ? 'bold' : 'normal',
                            cursor: ativo ? 'default' : 'pointer',
                            fontSize: '13px',
                            opacity: ativo ? 1 : 0.85,
                        }}
                    >
                        {item.label}
                    </button>
                );
            })}

            {/* SAIR — sempre à direita */}
            <button
                onClick={handleLogout}
                style={{
                    marginLeft: 'auto',
                    background: 'white',
                    color: '#c62828',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '13px',
                }}
            >
                Sair
            </button>
        </nav>
    );
}
