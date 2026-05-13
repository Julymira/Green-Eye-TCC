import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const passos = [
    {
        numero: 1,
        titulo: 'Cadastro e Acesso',
        descricao: 'Acesse a tela de cadastro pelo link público e preencha os dados da sua empresa ou ONG: nome fantasia, CNPJ, e-mail de contato e senha. Após o cadastro, faça login pela tela de acesso para empresas.',
        icone: '📝',
    },
    {
        numero: 2,
        titulo: 'Configurar Categorias de Resíduos',
        descricao: 'Durante o cadastro, selecione as categorias de resíduos que sua empresa coleta (ex: orgânico, eletrônico, vidro). Isso é essencial — o sistema só exibirá ocorrências compatíveis com as categorias que você cadastrou.',
        icone: '🗂️',
    },
    {
        numero: 3,
        titulo: 'Visualizar Ocorrências Compatíveis',
        descricao: 'No painel da empresa você verá apenas as ocorrências cujas categorias de resíduos coincidem com as categorias da sua empresa. Cada ocorrência exibe localização, quantidade estimada, descrição e problemas causados.',
        icone: '📍',
    },
    {
        numero: 4,
        titulo: 'Solicitar Coleta',
        descricao: 'Clique em "Solicitar Coleta" na ocorrência de interesse. A solicitação fica com status "Pendente" até que o gestor a aprove. Você não pode enviar duas solicitações ativas para a mesma ocorrência.',
        icone: '🚛',
    },
    {
        numero: 5,
        titulo: 'Aguardar Aprovação do Gestor',
        descricao: 'O gestor analisará sua solicitação e poderá aprová-la ou recusá-la. Quando aprovada, a ocorrência passa para o status "Cedido" e você receberá um prazo para realizar a coleta.',
        icone: '⏳',
    },
    {
        numero: 6,
        titulo: 'Realizar a Coleta e Confirmar',
        descricao: 'Realize a coleta dentro do prazo aprovado. Em seguida, clique em "Confirmar Coleta" no painel para registrar que a coleta foi realizada. O status da ocorrência avança para "Revisão".',
        icone: '✅',
    },
    {
        numero: 7,
        titulo: 'Revisão pelo Gestor',
        descricao: 'Após a confirmação, o gestor verificará se a coleta foi realizada corretamente. Se aprovado, a ocorrência será marcada como "Resolvida". Mantenha evidências da coleta caso seja necessário comprovar.',
        icone: '🔍',
    },
    {
        numero: 8,
        titulo: 'Atenção ao Prazo',
        descricao: 'Se a coleta não for confirmada dentro do prazo, o sistema retorna automaticamente a ocorrência para "Em Verificação" e outras empresas poderão solicitá-la. Fique atento ao cronômetro exibido no painel.',
        icone: '⏰',
    },
    {
        numero: 9,
        titulo: 'Visualizar no Mapa',
        descricao: 'Use o botão "Ver no Mapa" para visualizar a localização exata da ocorrência antes de solicitar a coleta. Isso ajuda a planejar a logística e confirmar se está dentro da sua área de atuação.',
        icone: '🗺️',
    },
];

export default function TutorialEmpresa() {
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
                    🏢 Painel da Empresa
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/dashboard-empresa')}
                        style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        ← Voltar ao Painel
                    </button>
                </div>
            </nav>

            <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
                <h1 style={{ color: '#2e7d32', marginBottom: '8px' }}>📖 Tutorial da Empresa / ONG</h1>
                <p style={{ color: '#666', marginBottom: '32px', fontSize: '15px' }}>
                    Veja como utilizar o sistema Green Eye para solicitar e confirmar coletas de resíduos de forma eficiente.
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
