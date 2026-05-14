import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── PALETA ──────────────────────────────────────────────────────────────────
const VERDE_RGB  = [46, 125, 50];
const VERDE_CLARO = [232, 245, 233];
const CINZA      = [100, 100, 100];
const PRETO      = [30, 30, 30];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// Remove caracteres fora do Latin-1 que jsPDF nao suporta na fonte padrao
function safe(str) {
    return String(str ?? '')
        // eslint-disable-next-line no-control-regex
        .replace(/[^\x00-\xFF]/g, '')   // remove emojis e caracteres fora do Latin-1
        .replace(/—/g, '-')        // em dash
        .replace(/–/g, '-');       // en dash
}

function fmt(v)  { return safe(v != null ? String(v) : '-'); }
function pct(v)  { return v != null ? `${v}%` : '-'; }
function dias(v) { return v != null ? `${v} dias` : '-'; }

function dataFormatada() {
    return new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ─── CABEÇALHO DE CADA PÁGINA ─────────────────────────────────────────────────
function addCabecalho(doc, gestorEmail, gestorRole) {
    const w = doc.internal.pageSize.getWidth();

    // Barra verde superior
    doc.setFillColor(...VERDE_RGB);
    doc.rect(0, 0, w, 18, 'F');

    // Título na barra
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Green Eye — Relatorio Estatistico', 14, 12);

    // Data e gestor na barra
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(safe(`Gerado em: ${dataFormatada()}`), w - 14, 8, { align: 'right' });
    doc.text(safe(`Gestor: ${gestorEmail}  |  Nivel: ${gestorRole === 'superadmin' ? 'Super Admin' : 'Gestor'}`), w - 14, 14, { align: 'right' });

    doc.setTextColor(...PRETO);
    return 24; // y inicial após cabeçalho
}

// ─── RODAPÉ DE CADA PÁGINA ───────────────────────────────────────────────────
function addRodape(doc) {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const total = doc.internal.getNumberOfPages();

    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.line(14, h - 12, w - 14, h - 12);
        doc.setFontSize(8);
        doc.setTextColor(...CINZA);
        doc.text('Desenvolvido por Julyana Mira Medeiros  |  Sistema Green Eye - Uso interno e confidencial', 14, h - 6);
        doc.text(`Pagina ${i} de ${total}`, w - 14, h - 6, { align: 'right' });
    }
}

// ─── TÍTULO DE SEÇÃO ─────────────────────────────────────────────────────────
function addTituloSecao(doc, texto, y) {
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(...VERDE_CLARO);
    doc.rect(14, y - 5, w - 28, 10, 'F');
    doc.setDrawColor(...VERDE_RGB);
    doc.rect(14, y - 5, 3, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...VERDE_RGB);
    doc.text(texto, 20, y + 2);
    doc.setTextColor(...PRETO);
    return y + 12;
}

// ─── PÁGINA DE CAPA ──────────────────────────────────────────────────────────
function addCapa(doc, gestorEmail, gestorRole) {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    // Fundo verde no topo
    doc.setFillColor(...VERDE_RGB);
    doc.rect(0, 0, w, 80, 'F');

    // Nome do sistema
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('GREEN EYE', w / 2, 38, { align: 'center' });
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Monitoramento Ambiental - Luziania/GO', w / 2, 50, { align: 'center' });

    // Título do relatório
    doc.setTextColor(...PRETO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Relatorio Estatistico Completo', w / 2, 105, { align: 'center' });

    // Linha decorativa
    doc.setDrawColor(...VERDE_RGB);
    doc.setLineWidth(1);
    doc.line(40, 112, w - 40, 112);

    // Informações de identificação
    const info = [
        ['Gerado em',          safe(dataFormatada())],
        ['Gestor responsavel', safe(gestorEmail)],
        ['Nivel de acesso',    gestorRole === 'superadmin' ? 'Super Administrador' : 'Gestor'],
        ['Desenvolvedora',     'Julyana Mira Medeiros'],
        ['Sistema',            'Green Eye v1.0 - TCC 2026'],
        ['Confidencialidade',  'Uso interno - nao divulgar sem autorizacao'],
    ];

    let y = 130;
    doc.setFontSize(11);
    info.forEach(([chave, valor]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...VERDE_RGB);
        doc.text(`${chave}:`, 40, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...PRETO);
        doc.text(valor, 105, y);
        y += 12;
    });

    // Aviso de rodapé da capa
    doc.setFontSize(9);
    doc.setTextColor(...CINZA);
    doc.text(
        'Este documento foi gerado automaticamente pelo Sistema Green Eye e contem dados\nestatisticos de ocorrencias ambientais, coletas e pontos de descarte registrados.',
        w / 2, h - 30, { align: 'center', maxWidth: w - 60 }
    );
}

// ─── FUNÇÃO PRINCIPAL ────────────────────────────────────────────────────────
export function gerarPDF(dados, pontos) {
    const gestorEmail = localStorage.getItem('userEmail') || 'não identificado';
    const gestorRole  = localStorage.getItem('userRole')  || 'gestor';

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // ── CAPA ─────────────────────────────────────────────────────────────────
    addCapa(doc, gestorEmail, gestorRole);

    const k  = dados.kpis        || {};
    const kc = dados.kpis_coleta || {};

    // ── SEÇÃO 1: KPIs DE OCORRÊNCIAS ─────────────────────────────────────────
    doc.addPage();
    let y = addCabecalho(doc, gestorEmail, gestorRole);
    y = addTituloSecao(doc, '1. KPIs - Ocorrencias de Descarte Irregular', y);

    autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['Indicador', 'Valor']],
        body: [
            ['Total de Ocorrencias Registradas',  fmt(k.total_ocorrencias)],
            ['Aguardando Atendimento (Novas)',     fmt(k.total_novas)],
            ['Ocorrencias Resolvidas',             fmt(k.total_resolvidas)],
            ['Taxa de Resolucao',                  pct(k.taxa_resolucao)],
            ['Tempo Medio de Resolucao',           dias(k.tempo_medio_resolucao_dias)],
            ['Ocorrencias Unificadas',             fmt(k.total_unificadas)],
        ],
        headStyles: { fillColor: VERDE_RGB, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 }, 1: { halign: 'center' } },
    });

    y = doc.lastAutoTable.finalY + 10;
    y = addTituloSecao(doc, '2. KPIs - Coletas por Empresas/ONGs', y);

    autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['Indicador', 'Valor']],
        body: [
            ['Total de Solicitacoes de Coleta',   fmt(kc.total_solicitacoes)],
            ['Coletas Efetivamente Realizadas',    fmt(kc.total_coletadas)],
            ['Taxa de Coleta',                     pct(kc.taxa_coleta)],
            ['Taxa de Aprovacao das Solicitacoes', pct(kc.taxa_aprovacao)],
            ['Taxa de Expiracao de Prazo',         pct(kc.taxa_expiracao)],
            ['Empresas/ONGs Ativas',               fmt(kc.empresas_ativas)],
            ['Total de Empresas Cadastradas',      fmt(kc.total_empresas)],
        ],
        headStyles: { fillColor: VERDE_RGB, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 }, 1: { halign: 'center' } },
    });

    // ── SEÇÃO 3: POR CATEGORIA ───────────────────────────────────────────────
    y = doc.lastAutoTable.finalY + 10;
    if (y > 230) { doc.addPage(); y = addCabecalho(doc, gestorEmail, gestorRole); }
    y = addTituloSecao(doc, '3. Ocorrencias por Categoria de Residuo', y);

    const catRows = (dados.por_categoria || []).map(d => [
        safe(d.categoria),
        fmt(d.quantidade),
        (() => {
            const tx = (dados.taxa_resolucao_categoria || []).find(x => x.categoria === d.categoria);
            return tx ? pct(parseFloat(tx.taxa).toFixed(1)) : '—';
        })(),
        (() => {
            const tm = (dados.tempo_medio_categoria || []).find(x => x.categoria === d.categoria);
            return tm ? dias(parseFloat(tm.dias_medio).toFixed(1)) : '—';
        })(),
    ]);

    autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['Categoria', 'Ocorrencias', 'Taxa de Resolucao', 'Tempo Medio']],
        body: catRows.length ? catRows : [['Sem dados', '-', '-', '-']],
        headStyles: { fillColor: VERDE_RGB, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
    });

    // ── SEÇÃO 4: OCORRÊNCIAS POR MÊS ─────────────────────────────────────────
    doc.addPage();
    y = addCabecalho(doc, gestorEmail, gestorRole);
    y = addTituloSecao(doc, '4. Volume Mensal de Ocorrencias (ultimos 12 meses)', y);

    const mesRows = (dados.ocorrencias_por_mes || []).map(d => [
        d.mes,
        fmt(d.criadas),
        fmt(d.resolvidas),
        d.criadas > 0
            ? `${((parseInt(d.resolvidas) / parseInt(d.criadas)) * 100).toFixed(0)}%`
            : '—',
    ]);

    autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['Mes', 'Criadas', 'Resolvidas', 'Taxa do Periodo']],
        body: mesRows.length ? mesRows : [['Sem dados', '-', '-', '-']],
        headStyles: { fillColor: VERDE_RGB, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
    });

    // ── SEÇÃO 5: FUNIL DE ATENDIMENTO ────────────────────────────────────────
    y = doc.lastAutoTable.finalY + 10;
    if (y > 200) { doc.addPage(); y = addCabecalho(doc, gestorEmail, gestorRole); }
    y = addTituloSecao(doc, '5. Funil de Atendimento - Ciclo de Vida', y);

    const f = dados.funil || {};
    autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['Etapa do Ciclo', 'Quantidade']],
        body: [
            ['1. Registradas',       fmt(f.registradas)],
            ['2. Em Atendimento',    fmt(f.em_atendimento)],
            ['3. Com Solicitacao',   fmt(f.com_solicitacao)],
            ['4. Coleta Aprovada',   fmt(f.coleta_aprovada)],
            ['5. Coleta Confirmada', fmt(f.coleta_confirmada)],
            ['6. Resolvidas',        fmt(f.resolvidas)],
        ],
        headStyles: { fillColor: VERDE_RGB, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 }, 1: { halign: 'center' } },
    });

    // ── SEÇÃO 6: RANKING DE EMPRESAS ─────────────────────────────────────────
    y = doc.lastAutoTable.finalY + 10;
    if (y > 200) { doc.addPage(); y = addCabecalho(doc, gestorEmail, gestorRole); }
    y = addTituloSecao(doc, '6. Ranking de Empresas e ONGs por Coletas Realizadas', y);

    const empRows = (dados.ranking_empresas || []).map((d, i) => [
        `${i + 1}.`,
        safe(d.nome_fantasia || '-'),
        fmt(d.total_solicitacoes),
        fmt(d.coletadas),
        d.total_solicitacoes > 0
            ? `${((parseInt(d.coletadas) / parseInt(d.total_solicitacoes)) * 100).toFixed(0)}%`
            : '—',
    ]);

    autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['#', 'Empresa / ONG', 'Solicitacoes', 'Realizadas', 'Eficiencia']],
        body: empRows.length ? empRows : [['-', 'Sem dados', '-', '-', '-']],
        headStyles: { fillColor: VERDE_RGB, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }
        },
    });

    // ── SEÇÃO 7: PONTOS DE DESCARTE ───────────────────────────────────────────
    doc.addPage();
    y = addCabecalho(doc, gestorEmail, gestorRole);
    y = addTituloSecao(doc, '7. KPIs - Pontos de Descarte Correto', y);

    const ativos   = pontos.filter(p => p.ativo);
    const inativos = pontos.filter(p => !p.ativo);
    const comGPS   = pontos.filter(p => p.lat && p.lng);
    const cidades  = [...new Set(pontos.map(p => p.cidade))];

    const tiposContagem = {};
    pontos.forEach(p => (p.tipos_residuo || []).forEach(t => { tiposContagem[t] = (tiposContagem[t] || 0) + 1; }));
    const tiposCobertos = new Set(ativos.flatMap(p => p.tipos_residuo || []));

    autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['Indicador', 'Valor']],
        body: [
            ['Total de Pontos Cadastrados',  String(pontos.length)],
            ['Pontos Ativos',                String(ativos.length)],
            ['Pontos Inativos',              String(inativos.length)],
            ['Com Localizacao GPS',          String(comGPS.length)],
            ['Cidades com Cobertura',        String(cidades.length)],
            ['Tipos de Residuo Cobertos',    `${tiposCobertos.size} de 9`],
        ],
        headStyles: { fillColor: VERDE_RGB, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 }, 1: { halign: 'center' } },
    });

    y = doc.lastAutoTable.finalY + 10;
    y = addTituloSecao(doc, '8. Cobertura por Tipo de Residuo', y);

    const TODOS_TIPOS = ['Eletronico', 'Organico', 'Entulho', 'Pneus', 'Moveis', 'Lixo Domestico', 'Hospitalar', 'Reciclavel', 'Outros'];
    const TODOS_TIPOS_ORIG = ['Eletrônico', 'Orgânico', 'Entulho', 'Pneus', 'Móveis', 'Lixo Doméstico', 'Hospitalar', 'Reciclável', 'Outros'];
    const tipoRows = TODOS_TIPOS.map((t, i) => [
        t,
        String(tiposContagem[TODOS_TIPOS_ORIG[i]] || 0),
        tiposCobertos.has(TODOS_TIPOS_ORIG[i]) ? 'Sim' : 'Nao',
    ]);

    autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['Tipo de Residuo', 'No. de Pontos', 'Tem Cobertura Ativa?']],
        body: tipoRows,
        headStyles: { fillColor: VERDE_RGB, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
            1: { halign: 'center' },
            2: {
                halign: 'center',
                fontStyle: 'bold',
            }
        },
        didParseCell(data) {
            if (data.column.index === 2 && data.section === 'body') {
                data.cell.styles.textColor = data.cell.raw === 'Sim' ? VERDE_RGB : [198, 40, 40];
            }
        },
    });

    // ── SEÇÃO 9: LISTA COMPLETA DE PONTOS ────────────────────────────────────
    y = doc.lastAutoTable.finalY + 10;
    if (y > 200) { doc.addPage(); y = addCabecalho(doc, gestorEmail, gestorRole); }
    y = addTituloSecao(doc, '9. Lista Completa de Pontos de Descarte', y);

    const pontoRows = pontos.map(p => [
        safe(p.nome),
        safe(p.cidade),
        safe(p.endereco),
        safe((p.tipos_residuo || []).join(', ') || '-'),
        safe(p.horario || '-'),
        p.lat && p.lng ? `${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)}` : '-',
        p.ativo ? 'Ativo' : 'Inativo',
    ]);

    autoTable(doc, {
        startY: y,
        margin: { left: 14, right: 14 },
        head: [['Nome', 'Cidade', 'Endereco', 'Tipos Aceitos', 'Horario', 'GPS', 'Status']],
        body: pontoRows.length ? pontoRows : [['Nenhum ponto cadastrado', '-', '-', '-', '-', '-', '-']],
        headStyles: { fillColor: VERDE_RGB, textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 22 },
            2: { cellWidth: 45 },
            3: { cellWidth: 38 },
            4: { cellWidth: 22 },
            5: { cellWidth: 24, halign: 'center' },
            6: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        },
        didParseCell(data) {
            if (data.column.index === 6 && data.section === 'body') {
                data.cell.styles.textColor =
                    String(data.cell.raw) === 'Ativo' ? VERDE_RGB : [198, 40, 40];
            }
        },
    });

    // ── RODAPÉ EM TODAS AS PÁGINAS ────────────────────────────────────────────
    addRodape(doc);

    // ── SALVA ─────────────────────────────────────────────────────────────────
    const nomeArquivo = `GreenEye_Relatorio_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(nomeArquivo);
}
