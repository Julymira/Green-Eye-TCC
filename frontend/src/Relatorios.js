import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ─── PALETA ──────────────────────────────────────────────────────────────────
const VERDE = '#2e7d32';
const CORES = ['#2e7d32', '#f57c00', '#1565c0', '#c62828', '#6a1b9a', '#00838f', '#558b2f', '#4527a0'];
const CORES_STATUS = {
    Nova: '#c62828', 'Em verificação': '#f57c00', Cedido: '#1565c0',
    Revisão: '#6a1b9a', Resolvida: '#2e7d32', Unificada: '#00838f',
};

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────
function KpiCard({ valor, label, cor = VERDE, sub }) {
    return (
        <div style={{ background: 'white', borderRadius: '8px', padding: '18px 22px', border: `1px solid #e0e0e0`, borderTop: `4px solid ${cor}`, flex: 1, minWidth: '150px' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: cor }}>{valor ?? '—'}</div>
            <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>{label}</div>
            {sub && <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{sub}</div>}
        </div>
    );
}

function Secao({ titulo, children }) {
    return (
        <div style={{ marginBottom: '36px' }}>
            <h2 style={{ color: VERDE, fontSize: '17px', borderBottom: '2px solid #c5e1a5', paddingBottom: '8px', marginBottom: '20px' }}>{titulo}</h2>
            {children}
        </div>
    );
}

function GraficoCard({ titulo, children, height = 280 }) {
    return (
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '16px 20px', flex: 1, minWidth: '300px' }}>
            <h4 style={{ color: '#444', margin: '0 0 14px 0', fontSize: '14px' }}>{titulo}</h4>
            <ResponsiveContainer width="100%" height={height}>
                {children}
            </ResponsiveContainer>
        </div>
    );
}

function Row({ children }) {
    return <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>{children}</div>;
}

const fmt = v => v ?? '—';
const pct = v => v != null ? `${v}%` : '—';
const dias = v => v != null ? `${v} dias` : '—';

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
export default function Relatorios() {
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [aba, setAba] = useState(0);

    const carregar = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        try {
            const res = await axios.get('http://localhost:3000/api/reports/estatisticas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDados(res.data);
        } catch {
            toast.error('Erro ao carregar estatísticas.');
        } finally {
            setCarregando(false);
        }
    }, [navigate]);

    useEffect(() => { carregar(); }, [carregar]);

    const abas = [
        '📊 Visão Geral',
        '📅 Tempo',
        '♻️ Resíduos',
        '🏭 Empresas',
        '🔄 Fluxo',
        '📡 Monitoramento',
        '🔗 Unificações',
    ];

    if (carregando) return (
        <div>
            <NavbarRelatorio navigate={navigate} />
            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Carregando estatísticas...</div>
        </div>
    );

    if (!dados) return null;

    const k = dados.kpis || {};
    const kc = dados.kpis_coleta || {};

    return (
        <div>
            <NavbarRelatorio navigate={navigate} />

            <div style={{ padding: '28px', maxWidth: '1300px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ color: VERDE, margin: 0 }}>📈 Relatório Estatístico</h1>
                    <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>Dados em tempo real do banco de dados</p>
                </div>

                {/* ABAS */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '28px', borderBottom: '2px solid #e0e0e0', paddingBottom: '0' }}>
                    {abas.map((a, i) => (
                        <button key={i} onClick={() => setAba(i)} style={{
                            padding: '8px 16px', cursor: 'pointer', border: 'none', background: 'none',
                            borderBottom: aba === i ? `3px solid ${VERDE}` : '3px solid transparent',
                            color: aba === i ? VERDE : '#666', fontWeight: aba === i ? 'bold' : 'normal',
                            fontSize: '13px', marginBottom: '-2px'
                        }}>{a}</button>
                    ))}
                </div>

                {/* ── ABA 0: VISÃO GERAL ── */}
                {aba === 0 && <AbaVisaoGeral k={k} kc={kc} dados={dados} />}

                {/* ── ABA 1: TEMPO ── */}
                {aba === 1 && <AbaTempo dados={dados} />}

                {/* ── ABA 2: RESÍDUOS ── */}
                {aba === 2 && <AbaResiduos dados={dados} />}

                {/* ── ABA 3: EMPRESAS ── */}
                {aba === 3 && <AbaEmpresas dados={dados} kc={kc} />}

                {/* ── ABA 4: FLUXO ── */}
                {aba === 4 && <AbaFluxo dados={dados} />}

                {/* ── ABA 5: MONITORAMENTO ── */}
                {aba === 5 && <AbaMonitoramento dados={dados} kc={kc} />}

                {/* ── ABA 6: UNIFICAÇÕES ── */}
                {aba === 6 && <AbaUnificacoes dados={dados} k={k} />}
            </div>
        </div>
    );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function NavbarRelatorio({ navigate }) {
    return (
        <nav className="navbar">
            <div className="brand" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>📊 Painel do Gestor</div>
            <button onClick={() => navigate('/admin')} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                ← Voltar ao Painel
            </button>
        </nav>
    );
}

// ─── ABA 0: VISÃO GERAL ──────────────────────────────────────────────────────
function AbaVisaoGeral({ k, kc, dados }) {
    const pieQuantidade = (dados.distribuicao_quantidade || []).map(d => ({ name: d.quantidade, value: parseInt(d.total) }));
    const pieTipo = (dados.tipo_instituicao || []).map(d => ({ name: d.tipo, value: parseInt(d.coletadas) }));

    return (
        <>
            <Secao titulo="📌 KPIs — Ocorrências">
                <Row>
                    <KpiCard valor={fmt(k.total_ocorrencias)} label="Total de Ocorrências" cor="#1565c0" />
                    <KpiCard valor={fmt(k.total_novas)} label="Aguardando Atendimento" cor="#c62828" />
                    <KpiCard valor={fmt(k.total_resolvidas)} label="Resolvidas" cor={VERDE} />
                    <KpiCard valor={pct(k.taxa_resolucao)} label="Taxa de Resolução" cor={VERDE} />
                    <KpiCard valor={dias(k.tempo_medio_resolucao_dias)} label="Tempo Médio de Resolução" cor="#f57c00" />
                    <KpiCard valor={fmt(k.total_unificadas)} label="Unificadas" cor="#00838f" />
                </Row>
            </Secao>

            <Secao titulo="📌 KPIs — Coletas">
                <Row>
                    <KpiCard valor={fmt(kc.total_solicitacoes)} label="Total de Solicitações" cor="#1565c0" />
                    <KpiCard valor={fmt(kc.total_coletadas)} label="Coletas Realizadas" cor={VERDE} />
                    <KpiCard valor={pct(kc.taxa_coleta)} label="Taxa de Coleta" cor={VERDE} />
                    <KpiCard valor={pct(kc.taxa_aprovacao)} label="Taxa de Aprovação" cor="#f57c00" />
                    <KpiCard valor={pct(kc.taxa_expiracao)} label="Taxa de Expiração" cor="#c62828" />
                    <KpiCard valor={fmt(kc.empresas_ativas)} label={`Empresas Ativas / ${kc.total_empresas} Cadastradas`} cor="#6a1b9a" />
                </Row>
            </Secao>

            <Secao titulo="📊 Distribuição por Gravidade e Tipo de Instituição">
                <Row>
                    <GraficoCard titulo="Distribuição por Quantidade (Gravidade)">
                        <PieChart>
                            <Pie data={pieQuantidade} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {pieQuantidade.map((_, i) => <Cell key={i} fill={[VERDE, '#f57c00', '#c62828'][i % 3]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </GraficoCard>

                    <GraficoCard titulo="Coletas por Tipo de Instituição (ONGs vs Empresas)">
                        <PieChart>
                            <Pie data={pieTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {pieTipo.map((_, i) => <Cell key={i} fill={[VERDE, '#1565c0'][i % 2]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </GraficoCard>
                </Row>
            </Secao>
        </>
    );
}

// ─── ABA 1: TEMPO ────────────────────────────────────────────────────────────
function AbaTempo({ dados }) {
    const porMes = (dados.ocorrencias_por_mes || []).map(d => ({
        mes: d.mes,
        Criadas: parseInt(d.criadas),
        Resolvidas: parseInt(d.resolvidas),
    }));

    const solMes = (dados.solicitacoes_por_mes || []).map(d => ({
        mes: d.mes,
        Solicitações: parseInt(d.total),
    }));

    // Barras empilhadas por status por mês
    const statusMeses = {};
    (dados.status_por_mes || []).forEach(d => {
        if (!statusMeses[d.mes]) statusMeses[d.mes] = { mes: d.mes };
        statusMeses[d.mes][d.status] = parseInt(d.quantidade);
    });
    const statusMesData = Object.values(statusMeses);
    const todosStatus = [...new Set((dados.status_por_mes || []).map(d => d.status))];

    return (
        <>
            <Secao titulo="📅 Volume de Ocorrências — Criadas vs. Resolvidas por Mês">
                <GraficoCard titulo="Ocorrências Criadas × Resolvidas (últimos 12 meses)" height={300}>
                    <LineChart data={porMes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Criadas" stroke="#c62828" strokeWidth={2} dot />
                        <Line type="monotone" dataKey="Resolvidas" stroke={VERDE} strokeWidth={2} dot />
                    </LineChart>
                </GraficoCard>
            </Secao>

            <Secao titulo="📅 Status das Ocorrências por Mês">
                <GraficoCard titulo="Ocorrências por Status em cada Mês (barras empilhadas)" height={300}>
                    <BarChart data={statusMesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        {todosStatus.map(s => (
                            <Bar key={s} dataKey={s} stackId="a" fill={CORES_STATUS[s] || '#90a4ae'} />
                        ))}
                    </BarChart>
                </GraficoCard>
            </Secao>

            <Secao titulo="📅 Volume de Solicitações de Coleta por Mês">
                <GraficoCard titulo="Solicitações enviadas por empresas (últimos 12 meses)" height={280}>
                    <BarChart data={solMes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Solicitações" fill="#1565c0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </GraficoCard>
            </Secao>
        </>
    );
}

// ─── ABA 2: RESÍDUOS ─────────────────────────────────────────────────────────
function AbaResiduos({ dados }) {
    const porCategoria = (dados.por_categoria || []).map(d => ({
        name: d.categoria, value: parseInt(d.quantidade)
    }));

    const taxaResolucao = (dados.taxa_resolucao_categoria || []).map(d => ({
        categoria: d.categoria,
        'Taxa (%)': parseFloat(d.taxa) || 0,
    }));

    const tempoMedio = (dados.tempo_medio_categoria || []).map(d => ({
        categoria: d.categoria,
        'Dias (média)': parseFloat(d.dias_medio) || 0,
    }));

    // Categoria × Quantidade (agrupado)
    const catQtd = {};
    (dados.categoria_quantidade || []).forEach(d => {
        if (!catQtd[d.categoria]) catQtd[d.categoria] = { categoria: d.categoria };
        catQtd[d.categoria][d.quantidade] = parseInt(d.total);
    });
    const catQtdData = Object.values(catQtd);

    return (
        <>
            <Secao titulo="♻️ Distribuição por Categoria de Lixo">
                <Row>
                    <GraficoCard titulo="Ocorrências por Categoria" height={300}>
                        <PieChart>
                            <Pie data={porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}>
                                {porCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </GraficoCard>

                    <GraficoCard titulo="Quantidade de Ocorrências por Categoria" height={300}>
                        <BarChart data={porCategoria} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                            <Tooltip />
                            <Bar dataKey="value" name="Ocorrências" fill={VERDE} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </GraficoCard>
                </Row>
            </Secao>

            <Secao titulo="♻️ Categoria × Quantidade (Gravidade)">
                <GraficoCard titulo="Gravidade das Ocorrências por Categoria (Pequena / Média / Grande)" height={300}>
                    <BarChart data={catQtdData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Pequena" stackId="a" fill={VERDE} />
                        <Bar dataKey="Média" stackId="a" fill="#f57c00" />
                        <Bar dataKey="Grande" stackId="a" fill="#c62828" />
                    </BarChart>
                </GraficoCard>
            </Secao>

            <Secao titulo="♻️ Eficiência de Resolução por Categoria">
                <Row>
                    <GraficoCard titulo="Taxa de Resolução por Categoria (%)">
                        <BarChart data={taxaResolucao} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} unit="%" />
                            <YAxis dataKey="categoria" type="category" tick={{ fontSize: 11 }} width={90} />
                            <Tooltip formatter={v => `${v}%`} />
                            <Bar dataKey="Taxa (%)" fill={VERDE} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </GraficoCard>

                    <GraficoCard titulo="Tempo Médio de Resolução por Categoria (dias)">
                        <BarChart data={tempoMedio} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" unit=" dias" />
                            <YAxis dataKey="categoria" type="category" tick={{ fontSize: 11 }} width={90} />
                            <Tooltip formatter={v => `${v} dias`} />
                            <Bar dataKey="Dias (média)" fill="#f57c00" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </GraficoCard>
                </Row>
            </Secao>
        </>
    );
}

// ─── ABA 3: EMPRESAS ─────────────────────────────────────────────────────────
function AbaEmpresas({ dados, kc }) {
    const ranking = (dados.ranking_empresas || []).map(d => ({
        empresa: d.nome_fantasia.length > 18 ? d.nome_fantasia.slice(0, 18) + '…' : d.nome_fantasia,
        Coletadas: parseInt(d.coletadas),
        Total: parseInt(d.total_solicitacoes),
    }));

    const solPorEmpresa = (dados.solicitacoes_por_empresa || []).map(d => ({
        empresa: d.nome_fantasia.length > 18 ? d.nome_fantasia.slice(0, 18) + '…' : d.nome_fantasia,
        Realizada: parseInt(d.realizada) || 0,
        Aprovada: parseInt(d.aprovada) || 0,
        Negada: parseInt(d.negada) || 0,
        Expirada: parseInt(d.expirada) || 0,
        Pendente: parseInt(d.pendente) || 0,
    }));

    const expiracao = (dados.expiracao_por_empresa || []).map(d => ({
        empresa: d.nome_fantasia.length > 18 ? d.nome_fantasia.slice(0, 18) + '…' : d.nome_fantasia,
        'Taxa (%)': parseFloat(d.taxa_expiracao) || 0,
    }));

    const empCat = (dados.empresas_por_categoria || []).map(d => ({
        categoria: d.categoria,
        Empresas: parseInt(d.empresas),
    }));

    return (
        <>
            <Secao titulo="🏭 KPIs de Empresas/ONGs">
                <Row>
                    <KpiCard valor={fmt(kc.total_empresas)} label="Empresas Cadastradas" cor="#1565c0" />
                    <KpiCard valor={fmt(kc.empresas_ativas)} label="Empresas com Solicitações" cor={VERDE} />
                    <KpiCard valor={pct(kc.taxa_aprovacao)} label="Taxa de Aprovação" cor="#f57c00" />
                    <KpiCard valor={pct(kc.taxa_expiracao)} label="Taxa de Expiração Global" cor="#c62828" />
                </Row>
            </Secao>

            <Secao titulo="🏆 Ranking de Empresas por Coletas Realizadas">
                <GraficoCard titulo="Top 10 — Coletas Realizadas vs. Total de Solicitações" height={300}>
                    <BarChart data={ranking}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="empresa" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Total" fill="#e0e0e0" />
                        <Bar dataKey="Coletadas" fill={VERDE} />
                    </BarChart>
                </GraficoCard>
            </Secao>

            <Secao titulo="📊 Solicitações por Empresa (por Status)">
                <GraficoCard titulo="Distribuição de Status das Solicitações por Empresa" height={320}>
                    <BarChart data={solPorEmpresa}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="empresa" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Realizada" stackId="a" fill={VERDE} />
                        <Bar dataKey="Aprovada" stackId="a" fill="#43a047" />
                        <Bar dataKey="Pendente" stackId="a" fill="#f57c00" />
                        <Bar dataKey="Negada" stackId="a" fill="#c62828" />
                        <Bar dataKey="Expirada" stackId="a" fill="#9e9e9e" />
                    </BarChart>
                </GraficoCard>
            </Secao>

            <Secao titulo="⏰ Taxa de Expiração por Empresa">
                <Row>
                    <GraficoCard titulo="Empresas com Maior Taxa de Expiração de Prazo (%)">
                        <BarChart data={expiracao} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} unit="%" />
                            <YAxis dataKey="empresa" type="category" tick={{ fontSize: 11 }} width={120} />
                            <Tooltip formatter={v => `${v}%`} />
                            <Bar dataKey="Taxa (%)" fill="#c62828" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </GraficoCard>

                    <GraficoCard titulo="Cobertura de Categorias — Empresas Cadastradas por Tipo de Resíduo">
                        <BarChart data={empCat} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="categoria" type="category" tick={{ fontSize: 11 }} width={90} />
                            <Tooltip />
                            <Bar dataKey="Empresas" fill="#1565c0" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </GraficoCard>
                </Row>
            </Secao>
        </>
    );
}

// ─── ABA 4: FLUXO ────────────────────────────────────────────────────────────
function AbaFluxo({ dados }) {
    const f = dados.funil || {};
    const etapas = [
        dados.funil?.registradas,
        dados.funil?.em_atendimento,
        dados.funil?.com_solicitacao,
        dados.funil?.coleta_aprovada,
        dados.funil?.coleta_confirmada,
        dados.funil?.resolvidas,
    ];
    const max = Math.max(...etapas.map(v => parseInt(v) || 0), 1);

    const funilData = [
        { label: 'Registradas', valor: parseInt(f.registradas) || 0, cor: '#1565c0' },
        { label: 'Em Atendimento', valor: parseInt(f.em_atendimento) || 0, cor: '#f57c00' },
        { label: 'Com Solicitação', valor: parseInt(f.com_solicitacao) || 0, cor: '#6a1b9a' },
        { label: 'Coleta Aprovada', valor: parseInt(f.coleta_aprovada) || 0, cor: '#43a047' },
        { label: 'Coleta Confirmada', valor: parseInt(f.coleta_confirmada) || 0, cor: '#00838f' },
        { label: 'Resolvidas', valor: parseInt(f.resolvidas) || 0, cor: VERDE },
    ];

    const t = dados.tempo_por_etapa || {};
    const tempoEtapas = [
        { etapa: 'Criação → Aprovação', dias: parseFloat(t.dias_ate_solicitacao_aprovada) || 0 },
        { etapa: 'Solic. → Coleta', dias: parseFloat(t.dias_solicitacao_ate_coleta) || 0 },
        { etapa: 'Coleta → Resolução', dias: parseFloat(t.dias_coleta_ate_resolucao) || 0 },
    ];

    const reabertas = (dados.reabertas || []).map(d => ({
        id: `#${d.id}`,
        'Expirações': parseInt(d.vezes_expirou),
    }));

    return (
        <>
            <Secao titulo="🔄 Funil de Atendimento — Ciclo de Vida das Ocorrências">
                <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', padding: '24px' }}>
                    {funilData.map((e, i) => {
                        const largura = max > 0 ? (e.valor / max) * 100 : 0;
                        const pctAnterior = i > 0 && funilData[i - 1].valor > 0
                            ? ((e.valor / funilData[i - 1].valor) * 100).toFixed(0)
                            : null;
                        return (
                            <div key={i} style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: '#555' }}>
                                    <span><strong>{e.label}</strong></span>
                                    <span style={{ color: e.cor, fontWeight: 'bold' }}>
                                        {e.valor}
                                        {pctAnterior && <span style={{ color: '#aaa', fontWeight: 'normal', marginLeft: '6px' }}>({pctAnterior}% da etapa anterior)</span>}
                                    </span>
                                </div>
                                <div style={{ background: '#f5f5f5', borderRadius: '4px', height: '28px', overflow: 'hidden' }}>
                                    <div style={{ background: e.cor, height: '100%', width: `${largura}%`, borderRadius: '4px', transition: 'width 0.5s', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: 'white', fontSize: '12px', fontWeight: 'bold', minWidth: e.valor > 0 ? '30px' : '0' }}>
                                        {e.valor > 0 ? e.valor : ''}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Secao>

            <Secao titulo="⏱ Tempo Médio Entre Etapas">
                <GraficoCard titulo="Dias médios em cada transição do fluxo" height={220}>
                    <BarChart data={tempoEtapas}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="etapa" tick={{ fontSize: 12 }} />
                        <YAxis unit=" dias" />
                        <Tooltip formatter={v => `${v} dias`} />
                        <Bar dataKey="dias" name="Dias (média)" fill="#f57c00" radius={[4, 4, 0, 0]}>
                            {tempoEtapas.map((_, i) => <Cell key={i} fill={['#1565c0', '#f57c00', VERDE][i]} />)}
                        </Bar>
                    </BarChart>
                </GraficoCard>
            </Secao>

            {reabertas.length > 0 && (
                <Secao titulo="🔁 Ocorrências com Mais Expirações de Prazo">
                    <GraficoCard titulo="Top ocorrências que retornaram ao ciclo por prazo expirado" height={220}>
                        <BarChart data={reabertas}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="id" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="Expirações" fill="#c62828" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </GraficoCard>
                </Secao>
            )}
        </>
    );
}

// ─── ABA 5: MONITORAMENTO ────────────────────────────────────────────────────
function AbaMonitoramento({ dados, kc }) {
    const crescOcorr = (dados.crescimento_ocorrencias || []).map(d => ({
        mes: d.mes, 'Novas no mês': parseInt(d.novas_no_mes), 'Acumulado': parseInt(d.acumulado)
    }));
    const crescEmp = (dados.crescimento_empresas || []).map(d => ({
        mes: d.mes, 'Novas no mês': parseInt(d.novas_no_mes), 'Acumulado': parseInt(d.acumulado)
    }));

    const porDia = (dados.por_dia_semana || []).map(d => ({
        dia: DIAS[parseInt(d.dia_num)] || d.dia_num,
        Ocorrências: parseInt(d.total)
    }));

    const porHora = Array.from({ length: 24 }, (_, h) => {
        const found = (dados.por_hora || []).find(d => parseInt(d.hora) === h);
        return { hora: `${String(h).padStart(2, '0')}h`, Ocorrências: found ? parseInt(found.total) : 0 };
    });

    return (
        <>
            <Secao titulo="📡 Crescimento Acumulado de Ocorrências">
                <GraficoCard titulo="Ocorrências registradas — novas por mês e total acumulado" height={300}>
                    <LineChart data={crescOcorr}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Novas no mês" stroke="#f57c00" strokeWidth={2} dot />
                        <Line type="monotone" dataKey="Acumulado" stroke={VERDE} strokeWidth={2} dot={false} />
                    </LineChart>
                </GraficoCard>
            </Secao>

            <Secao titulo="📡 Crescimento Acumulado de Empresas Cadastradas">
                <GraficoCard titulo="Empresas/ONGs cadastradas ao longo do tempo" height={260}>
                    <LineChart data={crescEmp}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Novas no mês" stroke="#f57c00" strokeWidth={2} dot />
                        <Line type="monotone" dataKey="Acumulado" stroke="#1565c0" strokeWidth={2} dot={false} />
                    </LineChart>
                </GraficoCard>
            </Secao>

            <Secao titulo="📅 Padrão de Denúncias — Dia e Hora">
                <Row>
                    <GraficoCard titulo="Ocorrências por Dia da Semana">
                        <BarChart data={porDia}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dia" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="Ocorrências" fill="#1565c0" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </GraficoCard>

                    <GraficoCard titulo="Ocorrências por Hora do Dia" height={280}>
                        <BarChart data={porHora}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hora" tick={{ fontSize: 9 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="Ocorrências" fill="#6a1b9a" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </GraficoCard>
                </Row>
            </Secao>

            <Secao titulo="📍 Top 10 Locais com Maior Concentração de Ocorrências">
                <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f4f4f4' }}>
                                {['#', 'Lat', 'Lng', 'Ocorrências', 'Peso no Heatmap'].map(h => (
                                    <th key={h} style={{ padding: '10px', textAlign: 'left', fontSize: '13px', borderBottom: '2px solid #ddd' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(dados.top_locais_ocorrencias || []).map((l, i) => (
                                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                                    <td style={{ padding: '9px 10px', fontSize: '13px', color: '#555' }}>{i + 1}</td>
                                    <td style={{ padding: '9px 10px', fontSize: '13px', color: '#555' }}>{Number(l.lat_grid).toFixed(3)}</td>
                                    <td style={{ padding: '9px 10px', fontSize: '13px', color: '#555' }}>{Number(l.lng_grid).toFixed(3)}</td>
                                    <td style={{ padding: '9px 10px', fontSize: '13px', fontWeight: 'bold', color: '#c62828' }}>{l.total}</td>
                                    <td style={{ padding: '9px 10px', fontSize: '13px', color: '#f57c00', fontWeight: 'bold' }}>{l.peso_total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Secao>
        </>
    );
}

// ─── ABA 6: UNIFICAÇÕES ──────────────────────────────────────────────────────
function AbaUnificacoes({ dados, k }) {
    const uniCat = (dados.unificacoes_por_categoria || []).map(d => ({
        categoria: d.categoria, Unificadas: parseInt(d.unificadas)
    }));

    const topUnif = (dados.top_locais_unificados || []).map(d => ({
        local: `#${d.id}`, Absorvidas: parseInt(d.absorvidas)
    }));

    return (
        <>
            <Secao titulo="🔗 KPIs de Unificações">
                <Row>
                    <KpiCard valor={fmt(k.total_unificadas)} label="Ocorrências Absorvidas por Unificação" cor="#00838f" />
                    <KpiCard valor={fmt(uniCat.reduce((a, d) => a + d.Unificadas, 0))} label="Total nas categorias mapeadas" cor="#00838f" />
                </Row>
            </Secao>

            <Secao titulo="🔗 Unificações por Categoria">
                <Row>
                    <GraficoCard titulo="Qual tipo de lixo gera mais denúncias repetidas no mesmo local?">
                        <BarChart data={uniCat} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis dataKey="categoria" type="category" tick={{ fontSize: 11 }} width={90} />
                            <Tooltip />
                            <Bar dataKey="Unificadas" fill="#00838f" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </GraficoCard>

                    {topUnif.length > 0 && (
                        <GraficoCard titulo="Top locais com mais ocorrências absorvidas (por ID principal)">
                            <BarChart data={topUnif}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="local" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="Absorvidas" fill="#6a1b9a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </GraficoCard>
                    )}
                </Row>
            </Secao>
        </>
    );
}
