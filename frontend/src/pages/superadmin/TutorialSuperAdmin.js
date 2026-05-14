import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarInterna from '../../componentes/NavbarInterna';

const passos = [
    {
        numero: 1,
        titulo: 'Acesso ao Painel Super Admin',
        descricao: 'Faça login com seu CPF e senha. Por ser Super Admin, você é redirecionado automaticamente para o Painel Super Admin ao invés do painel de gestor comum. A partir daqui você gerencia todos os usuários do sistema.',
        icone: '🛡️',
    },
    {
        numero: 2,
        titulo: 'Criar um Novo Usuário',
        descricao: 'Clique em "➕ Novo Gestor" para abrir o formulário de cadastro. Preencha o email, o CPF (com máscara automática) e escolha o nível de acesso: "Gestor comum" ou "Super Admin". O sistema gera automaticamente uma senha temporária.',
        icone: '➕',
    },
    {
        numero: 3,
        titulo: 'Senha Temporária',
        descricao: 'Após criar o usuário, a senha temporária é exibida uma única vez na tela — copie e entregue ao novo gestor pelo canal seguro de sua escolha. Ela não poderá ser visualizada novamente. No primeiro acesso, o gestor será obrigado a criar uma senha própria.',
        icone: '🔑',
    },
    {
        numero: 4,
        titulo: 'Níveis de Acesso',
        descricao: 'Gestor comum: acessa o painel de ocorrências, coletas, relatórios e histórico. Super Admin: além de tudo que o gestor faz, também pode criar, resetar senhas e remover outros gestores. Escolha o nível com atenção.',
        icone: '👥',
    },
    {
        numero: 5,
        titulo: 'Tabela de Usuários',
        descricao: 'A tabela exibe todos os usuários cadastrados (exceto você mesmo), com email, CPF, nível de acesso e status da senha. O status "⚠️ Senha temporária" indica que o gestor ainda não fez o primeiro acesso.',
        icone: '📋',
    },
    {
        numero: 6,
        titulo: 'Resetar Senha de um Gestor',
        descricao: 'Se um gestor esquecer a senha, clique em "🔑 Resetar Senha" na linha correspondente. Uma nova senha temporária será gerada e exibida na tela. O gestor será obrigado a trocá-la no próximo acesso.',
        icone: '🔄',
    },
    {
        numero: 7,
        titulo: 'Remover um Gestor',
        descricao: 'Clique em "🗑️ Remover" para excluir um gestor do sistema. Uma confirmação será exigida. Restrições: não é possível remover outro Super Admin nem remover sua própria conta.',
        icone: '🗑️',
    },
    {
        numero: 8,
        titulo: 'Acessar o Painel de Gestor',
        descricao: 'Clique em "📊 Painel Gestor" na barra superior para acessar todas as funcionalidades do gestor comum: ocorrências, coletas, relatórios, histórico e registro de novas ocorrências. Você pode alternar entre os dois painéis livremente.',
        icone: '📊',
    },
];

export default function TutorialSuperAdmin() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'superadmin') {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div>
            <NavbarInterna tipo="superadmin" paginaAtual="tutorial" />

            <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
                <h1 style={{ color: '#2e7d32', marginBottom: '8px' }}>📖 Tutorial do Super Admin</h1>
                <p style={{ color: '#666', marginBottom: '32px', fontSize: '15px' }}>
                    Entenda como gerenciar os usuários do sistema Green Eye com segurança e controle.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {passos.map((passo) => (
                        <div
                            key={passo.numero}
                            style={{
                                background: 'white',
                                border: '1px solid #ce93d8',
                                borderLeft: '5px solid #6a1b9a',
                                borderRadius: '8px',
                                padding: '20px 24px',
                                display: 'flex',
                                gap: '20px',
                                alignItems: 'flex-start',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            }}
                        >
                            <div style={{
                                background: '#f3e5f5',
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
                                        background: '#6a1b9a',
                                        color: 'white',
                                        borderRadius: '12px',
                                        padding: '2px 10px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                    }}>
                                        Passo {passo.numero}
                                    </span>
                                    <h3 style={{ margin: 0, color: '#4a148c', fontSize: '16px' }}>{passo.titulo}</h3>
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
                    background: '#f3e5f5',
                    border: '1px solid #ce93d8',
                    borderRadius: '8px',
                    padding: '20px 24px',
                    color: '#6a1b9a',
                    fontSize: '14px',
                }}>
                    <strong>💡 Dica:</strong> Entregue sempre as senhas temporárias por um canal seguro e oriente os gestores a trocarem a senha imediatamente no primeiro acesso.
                </div>
            </div>
        </div>
    );
}
