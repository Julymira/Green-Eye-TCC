import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarInterna from '../../componentes/NavbarInterna';

const passos = [
    {
        numero: 1,
        titulo: 'Acesso ao Painel',
        descricao: 'Faça login com seu CPF e senha na tela de login. Caso seja seu primeiro acesso, será obrigatório redefinir sua senha antes de continuar. Sua conta é criada e gerenciada pelo Super Admin do sistema.',
        icone: '🔐',
    },
    {
        numero: 2,
        titulo: 'Visão Geral das Ocorrências',
        descricao: 'No painel principal você encontra os cards de resumo (Novas, Em Verificação, Cedidas, Em Revisão e Resolvidas) e a lista completa de ocorrências registradas. Use o heatmap para identificar as áreas com maior concentração de problemas.',
        icone: '📊',
    },
    {
        numero: 3,
        titulo: 'Registrar Nova Ocorrência',
        descricao: 'Clique em "➕ Nova Ocorrência" na barra superior para registrar uma ocorrência diretamente pelo painel, sem precisar sair da conta. Selecione o local no mapa, informe o tipo de resíduo, a gravidade e os problemas observados.',
        icone: '➕',
    },
    {
        numero: 4,
        titulo: 'Analisar uma Ocorrência',
        descricao: 'Clique em "Ver no Mapa" para visualizar a localização exata da ocorrência e seus detalhes completos. Use os filtros de status para organizar a visualização por fase do atendimento.',
        icone: '🗺️',
    },
    {
        numero: 5,
        titulo: 'Alterar Status da Ocorrência',
        descricao: 'Use o seletor de status em cada linha da tabela para avançar o ciclo de atendimento: Nova → Em Verificação → (aguarda empresa) → Revisão → Resolvida. Cada mudança é salva imediatamente.',
        icone: '🔄',
    },
    {
        numero: 6,
        titulo: 'Solicitações de Coleta',
        descricao: 'Empresas cadastradas podem solicitar a coleta de ocorrências compatíveis com suas categorias. Você verá o número de solicitações pendentes na coluna "Ações". Aprovar uma solicitação muda o status para "Cedido" e define um prazo para a empresa realizar a coleta.',
        icone: '🏭',
    },
    {
        numero: 7,
        titulo: 'Ciclo Completo de Atendimento',
        descricao: 'Após a empresa confirmar a coleta, o status vai para "Revisão". O gestor deve verificar se a coleta foi realizada corretamente e então marcar a ocorrência como "Resolvida". Ocorrências resolvidas saem da lista principal e ficam disponíveis no Histórico.',
        icone: '✅',
    },
    {
        numero: 8,
        titulo: 'Prazo de Coleta Expirado',
        descricao: 'Se a empresa não realizar a coleta dentro do prazo aprovado, o sistema retorna automaticamente a ocorrência para "Em Verificação", permitindo que outras empresas solicitem a coleta.',
        icone: '⏰',
    },
    {
        numero: 9,
        titulo: 'Unificação de Ocorrências',
        descricao: 'Quando múltiplas ocorrências forem do mesmo local, selecione-as na tabela e use o botão "Unificar" para agrupá-las em uma única ocorrência principal. Isso evita duplicidade e concentra o peso no heatmap.',
        icone: '🔗',
    },
    {
        numero: 10,
        titulo: 'Histórico de Resolvidas',
        descricao: 'Acesse "📋 Histórico" na barra superior para consultar todas as ocorrências já resolvidas, com data de resolução e empresa responsável pela coleta.',
        icone: '📋',
    },
    {
        numero: 11,
        titulo: 'Relatórios Estatísticos',
        descricao: 'Acesse "📈 Relatórios" para visualizar estatísticas completas: KPIs de ocorrências e coletas, distribuição por categoria, ranking de empresas, funil de atendimento, padrões por dia e hora, e análise de unificações.',
        icone: '📈',
    },
    {
        numero: 12,
        titulo: 'Gestão de Empresas',
        descricao: 'Empresas e ONGs se cadastram pelo link público do sistema. Para que recebam ocorrências compatíveis, precisam ter categorias de resíduos configuradas no perfil delas.',
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
            <NavbarInterna tipo="gestor" paginaAtual="tutorial" />

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
