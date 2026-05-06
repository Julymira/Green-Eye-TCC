import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const passos = [
    {
        numero: 1,
        titulo: 'Acesso ao Painel',
        descricao: 'Faça login com seu e-mail e senha de gestor na tela de login. Caso seja seu primeiro acesso, será obrigatório redefinir sua senha antes de continuar.',
        icone: '🔐',
    },
    {
        numero: 2,
        titulo: 'Visão Geral das Ocorrências',
        descricao: 'No painel principal você encontra os cards de resumo (Novas, Em Verificação, Cedidas, Em Revisão e Resolvidas) e a lista completa de ocorrências registradas pelos cidadãos.',
        icone: '📊',
    },
    {
        numero: 3,
        titulo: 'Analisar uma Ocorrência',
        descricao: 'Clique em "Ver no Mapa" para visualizar a localização exata da ocorrência. Use os filtros de status para organizar a visualização por fase do atendimento.',
        icone: '🗺️',
    },
    {
        numero: 4,
        titulo: 'Alterar Status da Ocorrência',
        descricao: 'Use o seletor de status em cada linha da tabela para avançar o ciclo de atendimento: Nova → Em Verificação → (aguarda empresa) → Revisão → Resolvida. Cada mudança é salva imediatamente.',
        icone: '🔄',
    },
    {
        numero: 5,
        titulo: 'Solicitações de Coleta',
        descricao: 'Empresas cadastradas podem solicitar a coleta de ocorrências compatíveis com suas categorias. Você verá o número de solicitações pendentes na coluna "Ações". Aprovar uma solicitação muda o status para "Cedido" e define um prazo para a empresa realizar a coleta.',
        icone: '🏭',
    },
    {
        numero: 6,
        titulo: 'Ciclo Completo de Atendimento',
        descricao: 'Após a empresa confirmar a coleta, o status vai para "Revisão". O gestor deve verificar se a coleta foi realizada corretamente e então marcar a ocorrência como "Resolvida". Ocorrências resolvidas permanecem visíveis no histórico.',
        icone: '✅',
    },
    {
        numero: 7,
        titulo: 'Prazo de Coleta Expirado',
        descricao: 'Se a empresa não realizar a coleta dentro do prazo aprovado, o sistema retorna automaticamente a ocorrência para "Em Verificação", permitindo que outras empresas solicitem a coleta.',
        icone: '⏰',
    },
    {
        numero: 8,
        titulo: 'Gestão de Empresas',
        descricao: 'Empresas se cadastram pelo link público. Para que uma empresa receba ocorrências compatíveis, ela precisa ter categorias de resíduos configuradas no seu perfil.',
        icone: '🏢',
    },
];

export default function TutorialGestor() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div>
            {/* NAVBAR */}
            <nav className="navbar">
                <div className="brand" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                    📊 Painel do Gestor
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/admin')}
                        style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        ← Voltar ao Painel
                    </button>
                </div>
            </nav>

            <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
                <h1 style={{ color: '#2e7d32', marginBottom: '8px' }}>📖 Tutorial do Gestor</h1>
                <p style={{ color: '#666', marginBottom: '32px', fontSize: '15px' }}>
                    Siga os passos abaixo para entender como gerenciar as ocorrências e o fluxo de atendimento do sistema Green Eye.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {passos.map((passo) => (
                        <div
                            key={passo.numero}
                            style={{
                                background: 'white',
                                border: '1px solid #c5e1a5',
                                borderLeft: '5px solid #2e7d32',
                                borderRadius: '8px',
                                padding: '20px 24px',
                                display: 'flex',
                                gap: '20px',
                                alignItems: 'flex-start',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            }}
                        >
                            <div style={{
                                background: '#e8f5e9',
                                borderRadius: '50%',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '22px',
                                flexShrink: 0,
                            }}>
                                {passo.icone}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                    <span style={{
                                        background: '#2e7d32',
                                        color: 'white',
                                        borderRadius: '12px',
                                        padding: '2px 10px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                    }}>
                                        Passo {passo.numero}
                                    </span>
                                    <h3 style={{ margin: 0, color: '#1b5e20', fontSize: '16px' }}>{passo.titulo}</h3>
                                </div>
                                <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                                    {passo.descricao}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    marginTop: '36px',
                    background: '#f1f8e9',
                    border: '1px solid #a5d6a7',
                    borderRadius: '8px',
                    padding: '20px 24px',
                    color: '#2e7d32',
                    fontSize: '14px',
                }}>
                    <strong>💡 Dica:</strong> Em caso de dúvidas ou problemas técnicos, entre em contato com a equipe de suporte do Green Eye.
                </div>
            </div>
        </div>
    );
}
