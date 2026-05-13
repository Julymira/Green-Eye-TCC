const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

/*
 * 1. ROTA DE CRIAÇÃO (POST)
 * Agora salva na tabela intermediária report_categories
 */
router.post('/', upload.single('foto'), async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            categorias,
            quantidade,
            problemas_causados,
            descricao_adicional,
            lat,
            lng
        } = req.body;

        // Bug 1 fix: validar antes de converter
        if (!lat || !lng || !categorias) {
            return res.status(400).json({ error: 'Localização e Tipo de Resíduo são obrigatórios.' });
        }

        // Multer retorna string se vier um valor, array se vier múltiplos
        const categoriasArray = Array.isArray(categorias)
            ? categorias.map(Number)
            : [Number(categorias)];

        const photoBuffer = req.file ? req.file.buffer : null;
        const extensao = req.file
            ? req.file.originalname.split('.').pop().toLowerCase()
            : null;

        await client.query('BEGIN');

        const novaOcorrenciaQuery = `
            INSERT INTO reports (
                lat, lng, descricao_adicional,
                quantidade, problemas_causados,
                photo_content, extensao, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id;
        `;

        const resReport = await client.query(novaOcorrenciaQuery, [
            lat, lng, descricao_adicional,
            quantidade, problemas_causados,
            photoBuffer, extensao, 'Nova'
        ]);

        const reportId = resReport.rows[0].id;

        // Vincular todas as categorias na tabela intermediária
        await Promise.all(
            categoriasArray.map(categoryId =>
                client.query(
                    'INSERT INTO report_categories (report_id, category_id) VALUES ($1, $2)',
                    [reportId, categoryId]
                )
            )
        );

        await client.query('COMMIT');
        res.status(201).json({ id: reportId, message: "Ocorrência criada com sucesso!" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro ao criar ocorrência:", err.message);
        res.status(500).json({ error: 'Erro no servidor ao tentar criar ocorrência.' });
    } finally {
        client.release();
    }
});

/*
 * 2. ROTA DE LEITURA (GET)
 * Buscando o nome da categoria com JOIN
 */
router.get('/', async (req, res) => {
    try {
        // Reset automático: libera ocorrências cujo prazo aprovado expirou
        await pool.query(`
            UPDATE public.collection_requests
            SET status = 'Expirada'
            WHERE status = 'Aprovada' AND prazo IS NOT NULL AND prazo < NOW()
        `);
        await pool.query(`
            UPDATE public.reports r
            SET empresa_selecionada = false
            WHERE empresa_selecionada = true
              AND NOT EXISTS (
                SELECT 1 FROM public.collection_requests cr
                WHERE cr.report_id = r.id AND cr.status = 'Aprovada'
              )
        `);
        await pool.query(`
            UPDATE public.reports
            SET status = 'Em verificação'
            WHERE status = 'Cedido' AND empresa_selecionada = false AND merged_into IS NULL
        `);

        const { status } = req.query;
        
        // Query com JOIN e STRING_AGG para agrupar categorias numa única linha
        let query = `
            SELECT
                r.id, r.lat, r.lng, r.quantidade, r.status, r.created_at, r.descricao_adicional,
                r.problemas_causados, r.empresa_selecionada,
                (r.photo_content IS NOT NULL) as has_photo,
                COALESCE(r.peso_heatmap, CASE r.quantidade WHEN 'Pequena' THEN 1 WHEN 'Média' THEN 2 WHEN 'Grande' THEN 3 ELSE 1 END) as peso_heatmap,
                COALESCE(STRING_AGG(DISTINCT c.nome, ', ' ORDER BY c.nome), 'Sem categoria') as tipo_lixo,
                (SELECT COUNT(*) FROM public.collection_requests cr
                 WHERE cr.report_id = r.id AND cr.status = 'Pendente') as solicitacoes_pendentes,
                (SELECT COUNT(*) FROM public.collection_requests cr
                 WHERE cr.report_id = r.id AND cr.status = 'Coletada') as coletadas_aguardando
            FROM reports r
            LEFT JOIN report_categories rc ON r.id = rc.report_id
            LEFT JOIN categories c ON rc.category_id = c.id
        `;

        let condicoes = ['r.merged_into IS NULL', "r.status != 'Resolvida'"];

        let params = [];

        if (status) {
            const statusArray = status.split(',');
            params.push(statusArray);
            condicoes.push(`r.status = ANY($${params.length})`);
        }

        if (condicoes.length > 0) {
            query += " WHERE " + condicoes.join(" AND ");
        }

        query += " GROUP BY r.id, r.lat, r.lng, r.quantidade, r.status, r.created_at, r.descricao_adicional, r.problemas_causados, r.empresa_selecionada, r.peso_heatmap";
        query += " ORDER BY r.created_at DESC";
        
        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error('Erro na rota GET /reports:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/*
 * 3. ROTA DE IMAGEM (GET)
 * Serve os bytes da foto armazenada no banco
 */
router.get('/:id/foto', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT photo_content, extensao FROM reports WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0 || !result.rows[0].photo_content) {
            return res.status(404).send('Imagem não encontrada');
        }

        const { photo_content, extensao } = result.rows[0];
        const contentType = extensao === 'jpg' ? 'image/jpeg' : `image/${extensao}`;

        res.set('Content-Type', contentType);
        res.send(photo_content);
    } catch (err) {
        console.error('Erro ao buscar imagem:', err.message);
        res.status(500).send('Erro ao buscar imagem.');
    }
});

/*
 * 4. ROTA DE ATUALIZAÇÃO (PUT)
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, empresa_selecionada, quantidade, descricao_adicional, problemas_causados } = req.body;

        const fields = [];
        const values = [];

        if (status !== undefined) {
            const statusValidos = ['Nova', 'Em verificação', 'Cedido', 'Revisão', 'Resolvida', 'Unificada'];
            if (!statusValidos.includes(status)) {
                return res.status(400).json({ error: 'Status inválido.' });
            }
            fields.push(`status = $${fields.length + 1}`);
            values.push(status);
        }

        if (empresa_selecionada !== undefined) {
            fields.push(`empresa_selecionada = $${fields.length + 1}`);
            values.push(empresa_selecionada);
        }

        if (quantidade !== undefined) {
            fields.push(`quantidade = $${fields.length + 1}`);
            values.push(quantidade);
        }

        if (descricao_adicional !== undefined) {
            fields.push(`descricao_adicional = $${fields.length + 1}`);
            values.push(descricao_adicional);
        }

        if (problemas_causados !== undefined) {
            fields.push(`problemas_causados = $${fields.length + 1}`);
            values.push(problemas_causados);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const query = `UPDATE reports SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ocorrência não encontrada' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao atualizar ocorrência.');
    }
});

/*
 * 5. ROTA: Listar solicitações de coleta de uma ocorrência (Gestor)
 */
router.get('/:id/requests', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT cr.id, cr.status, cr.prazo, cr.coletado_em, cr.created_at,
                   c.nome_fantasia, c.telefone, c.email_contato
            FROM public.collection_requests cr
            JOIN public.companies c ON cr.company_id = c.id
            WHERE cr.report_id = $1
            ORDER BY cr.created_at DESC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar solicitações:", err);
        res.status(500).json({ error: "Erro ao buscar solicitações." });
    }
});

/*
 * 6. ROTA: Gestor aprova uma solicitação e define prazo
 */
router.post('/:id/requests/:requestId/approve', verifyToken, async (req, res) => {
    const { id, requestId } = req.params;
    const { prazo } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Bloqueia aprovação se já existe uma solicitação Aprovada ativa para esta ocorrência
        const jaAprovada = await client.query(
            `SELECT id FROM public.collection_requests
             WHERE report_id = $1 AND status = 'Aprovada'`,
            [id]
        );
        if (jaAprovada.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: "Já existe uma empresa aprovada para esta ocorrência. Aguarde a confirmação de coleta ou negue a solicitação atual." });
        }

        await client.query(
            `UPDATE public.collection_requests SET status = 'Aprovada', prazo = $1 WHERE id = $2`,
            [prazo, requestId]
        );

        // Nega automaticamente todas as outras solicitações pendentes da mesma ocorrência
        await client.query(
            `UPDATE public.collection_requests SET status = 'Negada' WHERE report_id = $1 AND id != $2 AND status = 'Pendente'`,
            [id, requestId]
        );

        await client.query(
            `UPDATE public.reports SET empresa_selecionada = true, status = 'Cedido' WHERE id = $1`,
            [id]
        );

        await client.query('COMMIT');
        res.json({ message: "Solicitação aprovada!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro ao aprovar solicitação:", err);
        res.status(500).json({ error: "Erro ao aprovar solicitação." });
    } finally {
        client.release();
    }
});

/*
 * 7. ROTA: Gestor nega uma solicitação
 */
router.post('/:id/requests/:requestId/deny', verifyToken, async (req, res) => {
    const { id, requestId } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE public.collection_requests SET status = 'Negada' WHERE id = $1`,
            [requestId]
        );

        // Se não houver mais nenhuma solicitação aprovada, libera a ocorrência
        const aprovadas = await client.query(
            `SELECT id FROM public.collection_requests
             WHERE report_id = $1 AND status = 'Aprovada'`,
            [id]
        );
        if (aprovadas.rows.length === 0) {
            await client.query(
                `UPDATE public.reports SET empresa_selecionada = false WHERE id = $1`,
                [id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: "Solicitação negada." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro ao negar solicitação:", err);
        res.status(500).json({ error: "Erro ao negar solicitação." });
    } finally {
        client.release();
    }
});

/*
 * 8. ROTA: Gestor finaliza revisão pós-coleta
 */
router.post('/:id/review-collection', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            `UPDATE public.collection_requests SET status = 'Revisada' WHERE report_id = $1 AND status = 'Coletada'`,
            [id]
        );
        res.json({ message: "Revisão registrada." });
    } catch (err) {
        console.error("Erro ao registrar revisão:", err);
        res.status(500).json({ error: "Erro ao registrar revisão." });
    }
});

/*
 * 9. ROTA: Estatísticas completas para relatórios (Gestor)
 */
router.get('/estatisticas', verifyToken, async (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: "Acesso restrito a administradores." });
    }
    try {
        const [
            kpis,
            kpisColeta,
            ocorrenciasPorMes,
            statusPorMes,
            porCategoria,
            categoriaQuantidade,
            taxaResolucaoCategoria,
            tempoMedioCategoria,
            distribuicaoQuantidade,
            rankingEmpresas,
            solicitacoesPorEmpresa,
            expiracaoPorEmpresa,
            solicitacoesPorMes,
            tipoInstituicao,
            empresasPorCategoria,
            funil,
            tempoPorEtapa,
            reabertas,
            crescimentoOcorrencias,
            crescimentoEmpresas,
            porDiaSemana,
            porHora,
            unificacoesPorCategoria,
            topLocaisUnificados,
            topLocaisOcorrencias
        ] = await Promise.all([

            // KPIs GERAIS
            pool.query(`
                SELECT
                    COUNT(*) FILTER (WHERE merged_into IS NULL) as total_ocorrencias,
                    COUNT(*) FILTER (WHERE status = 'Resolvida') as total_resolvidas,
                    ROUND(COUNT(*) FILTER (WHERE status = 'Resolvida')::numeric / NULLIF(COUNT(*) FILTER (WHERE merged_into IS NULL), 0) * 100, 1) as taxa_resolucao,
                    ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) FILTER (WHERE status = 'Resolvida'), 1) as tempo_medio_resolucao_dias,
                    COUNT(*) FILTER (WHERE status = 'Nova') as total_novas,
                    COUNT(*) FILTER (WHERE status = 'Em verificação') as total_verificacao,
                    COUNT(*) FILTER (WHERE merged_into IS NOT NULL) as total_unificadas
                FROM public.reports
            `),

            // KPIs DE COLETA
            pool.query(`
                SELECT
                    COUNT(*) as total_solicitacoes,
                    COUNT(*) FILTER (WHERE status IN ('Revisada','Coletada')) as total_coletadas,
                    COUNT(*) FILTER (WHERE status = 'Aprovada' OR status = 'Revisada' OR status = 'Coletada') as total_aprovadas,
                    COUNT(*) FILTER (WHERE status = 'Negada') as total_negadas,
                    COUNT(*) FILTER (WHERE status = 'Expirada') as total_expiradas,
                    ROUND(COUNT(*) FILTER (WHERE status IN ('Revisada','Coletada'))::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('Aprovada','Revisada','Coletada','Expirada')), 0) * 100, 1) as taxa_coleta,
                    ROUND(COUNT(*) FILTER (WHERE status = 'Expirada')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('Aprovada','Revisada','Coletada','Expirada')), 0) * 100, 1) as taxa_expiracao,
                    ROUND(COUNT(*) FILTER (WHERE status IN ('Aprovada','Revisada','Coletada'))::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('Aprovada','Revisada','Coletada','Negada')), 0) * 100, 1) as taxa_aprovacao,
                    (SELECT COUNT(DISTINCT id) FROM public.companies) as total_empresas,
                    (SELECT COUNT(DISTINCT company_id) FROM public.collection_requests) as empresas_ativas
                FROM public.collection_requests
            `),

            // OCORRÊNCIAS POR MÊS (últimos 12 meses)
            pool.query(`
                SELECT
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mes,
                    COUNT(*) as criadas,
                    COUNT(*) FILTER (WHERE status = 'Resolvida') as resolvidas
                FROM public.reports
                WHERE merged_into IS NULL AND created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at)
            `),

            // STATUS ATUAL DAS OCORRÊNCIAS POR MÊS (barras empilhadas)
            pool.query(`
                SELECT
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mes,
                    status,
                    COUNT(*) as quantidade
                FROM public.reports
                WHERE merged_into IS NULL AND created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', created_at), status
                ORDER BY DATE_TRUNC('month', created_at)
            `),

            // DISTRIBUIÇÃO POR CATEGORIA
            pool.query(`
                SELECT c.nome as categoria, COUNT(DISTINCT r.id) as quantidade
                FROM public.categories c
                LEFT JOIN report_categories rc ON rc.category_id = c.id
                LEFT JOIN public.reports r ON rc.report_id = r.id AND r.merged_into IS NULL
                GROUP BY c.nome
                ORDER BY quantidade DESC
            `),

            // CATEGORIA × QUANTIDADE
            pool.query(`
                SELECT c.nome as categoria, r.quantidade, COUNT(*) as total
                FROM public.reports r
                JOIN report_categories rc ON rc.report_id = r.id
                JOIN public.categories c ON rc.category_id = c.id
                WHERE r.merged_into IS NULL AND r.quantidade IS NOT NULL
                GROUP BY c.nome, r.quantidade
                ORDER BY c.nome
            `),

            // TAXA DE RESOLUÇÃO POR CATEGORIA
            pool.query(`
                SELECT
                    c.nome as categoria,
                    COUNT(DISTINCT r.id) as total,
                    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'Resolvida') as resolvidas,
                    ROUND(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'Resolvida')::numeric / NULLIF(COUNT(DISTINCT r.id), 0) * 100, 1) as taxa
                FROM public.categories c
                LEFT JOIN report_categories rc ON rc.category_id = c.id
                LEFT JOIN public.reports r ON rc.report_id = r.id AND r.merged_into IS NULL
                GROUP BY c.nome
                ORDER BY taxa DESC NULLS LAST
            `),

            // TEMPO MÉDIO DE RESOLUÇÃO POR CATEGORIA
            pool.query(`
                SELECT
                    c.nome as categoria,
                    ROUND(AVG(EXTRACT(EPOCH FROM (r.updated_at - r.created_at)) / 86400), 1) as dias_medio
                FROM public.reports r
                JOIN report_categories rc ON rc.report_id = r.id
                JOIN public.categories c ON rc.category_id = c.id
                WHERE r.status = 'Resolvida' AND r.merged_into IS NULL
                GROUP BY c.nome
                ORDER BY dias_medio DESC
            `),

            // DISTRIBUIÇÃO POR QUANTIDADE (gravidade)
            pool.query(`
                SELECT quantidade, COUNT(*) as total
                FROM public.reports
                WHERE merged_into IS NULL AND quantidade IS NOT NULL
                GROUP BY quantidade
                ORDER BY CASE quantidade WHEN 'Pequena' THEN 1 WHEN 'Média' THEN 2 WHEN 'Grande' THEN 3 END
            `),

            // RANKING EMPRESAS POR COLETAS REALIZADAS
            pool.query(`
                SELECT co.nome_fantasia, co.is_ong,
                    COUNT(*) FILTER (WHERE cr.status IN ('Revisada','Coletada')) as coletadas,
                    COUNT(*) as total_solicitacoes
                FROM public.companies co
                LEFT JOIN public.collection_requests cr ON cr.company_id = co.id
                GROUP BY co.id, co.nome_fantasia, co.is_ong
                HAVING COUNT(*) > 0
                ORDER BY coletadas DESC
                LIMIT 10
            `),

            // SOLICITAÇÕES POR EMPRESA (empilhado por status)
            pool.query(`
                SELECT co.nome_fantasia,
                    COUNT(*) FILTER (WHERE cr.status = 'Pendente') as pendente,
                    COUNT(*) FILTER (WHERE cr.status IN ('Aprovada','Revisada','Coletada')) as aprovada,
                    COUNT(*) FILTER (WHERE cr.status = 'Negada') as negada,
                    COUNT(*) FILTER (WHERE cr.status = 'Expirada') as expirada,
                    COUNT(*) FILTER (WHERE cr.status IN ('Revisada','Coletada')) as realizada
                FROM public.companies co
                JOIN public.collection_requests cr ON cr.company_id = co.id
                GROUP BY co.id, co.nome_fantasia
                ORDER BY (COUNT(*) FILTER (WHERE cr.status IN ('Revisada','Coletada'))) DESC
                LIMIT 10
            `),

            // TAXA DE EXPIRAÇÃO POR EMPRESA
            pool.query(`
                SELECT co.nome_fantasia,
                    COUNT(*) FILTER (WHERE cr.status = 'Expirada') as expiradas,
                    COUNT(*) FILTER (WHERE cr.status IN ('Aprovada','Revisada','Coletada','Expirada')) as aprovadas_total,
                    ROUND(COUNT(*) FILTER (WHERE cr.status = 'Expirada')::numeric / NULLIF(COUNT(*) FILTER (WHERE cr.status IN ('Aprovada','Revisada','Coletada','Expirada')), 0) * 100, 1) as taxa_expiracao
                FROM public.companies co
                JOIN public.collection_requests cr ON cr.company_id = co.id
                GROUP BY co.id, co.nome_fantasia
                HAVING COUNT(*) FILTER (WHERE cr.status IN ('Aprovada','Revisada','Coletada','Expirada')) > 0
                ORDER BY taxa_expiracao DESC
                LIMIT 10
            `),

            // SOLICITAÇÕES POR MÊS
            pool.query(`
                SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mes, COUNT(*) as total
                FROM public.collection_requests
                WHERE created_at >= NOW() - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at)
            `),

            // ONGs vs EMPRESAS (coletas)
            pool.query(`
                SELECT
                    CASE WHEN co.is_ong THEN 'ONG' ELSE 'Empresa Parceira' END as tipo,
                    COUNT(*) FILTER (WHERE cr.status IN ('Revisada','Coletada')) as coletadas
                FROM public.companies co
                JOIN public.collection_requests cr ON cr.company_id = co.id
                GROUP BY co.is_ong
            `),

            // EMPRESAS POR CATEGORIA
            pool.query(`
                SELECT c.nome as categoria, COUNT(DISTINCT cc.company_id) as empresas
                FROM public.categories c
                LEFT JOIN company_categories cc ON cc.category_id = c.id
                GROUP BY c.nome
                ORDER BY empresas DESC
            `),

            // FUNIL DE ATENDIMENTO
            pool.query(`
                SELECT
                    COUNT(*) FILTER (WHERE merged_into IS NULL) as registradas,
                    COUNT(*) FILTER (WHERE merged_into IS NULL AND status != 'Nova') as em_atendimento,
                    (SELECT COUNT(DISTINCT report_id) FROM public.collection_requests) as com_solicitacao,
                    (SELECT COUNT(DISTINCT report_id) FROM public.collection_requests WHERE status IN ('Aprovada','Revisada','Coletada')) as coleta_aprovada,
                    (SELECT COUNT(DISTINCT report_id) FROM public.collection_requests WHERE status IN ('Revisada','Coletada')) as coleta_confirmada,
                    COUNT(*) FILTER (WHERE status = 'Resolvida') as resolvidas
                FROM public.reports
            `),

            // TEMPO MÉDIO ENTRE ETAPAS
            pool.query(`
                SELECT
                    ROUND(AVG(EXTRACT(EPOCH FROM (cr.prazo - r.created_at)) / 86400) FILTER (WHERE cr.prazo IS NOT NULL AND cr.status IN ('Aprovada','Revisada','Coletada','Expirada')), 1) as dias_ate_solicitacao_aprovada,
                    ROUND(AVG(EXTRACT(EPOCH FROM (cr.coletado_em - cr.created_at)) / 86400) FILTER (WHERE cr.coletado_em IS NOT NULL), 1) as dias_solicitacao_ate_coleta,
                    ROUND(AVG(EXTRACT(EPOCH FROM (r.updated_at - cr.coletado_em)) / 86400) FILTER (WHERE r.status = 'Resolvida' AND cr.coletado_em IS NOT NULL), 1) as dias_coleta_ate_resolucao
                FROM public.collection_requests cr
                JOIN public.reports r ON cr.report_id = r.id
            `),

            // OCORRÊNCIAS REABERTAS (voltaram de Cedido para Em verificação por expiração)
            pool.query(`
                SELECT r.id, COUNT(cr.id) as vezes_expirou
                FROM public.reports r
                JOIN public.collection_requests cr ON cr.report_id = r.id AND cr.status = 'Expirada'
                GROUP BY r.id
                HAVING COUNT(cr.id) >= 1
                ORDER BY vezes_expirou DESC
                LIMIT 10
            `),

            // CRESCIMENTO ACUMULADO DE OCORRÊNCIAS
            pool.query(`
                SELECT
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mes,
                    COUNT(*) as novas_no_mes,
                    SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as acumulado
                FROM public.reports
                WHERE merged_into IS NULL
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at)
            `),

            // CRESCIMENTO ACUMULADO DE EMPRESAS
            pool.query(`
                SELECT
                    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mes,
                    COUNT(*) as novas_no_mes,
                    SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as acumulado
                FROM public.companies
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at)
            `),

            // POR DIA DA SEMANA
            pool.query(`
                SELECT
                    EXTRACT(DOW FROM created_at) as dia_num,
                    TO_CHAR(created_at, 'Day') as dia,
                    COUNT(*) as total
                FROM public.reports
                WHERE merged_into IS NULL
                GROUP BY EXTRACT(DOW FROM created_at), TO_CHAR(created_at, 'Day')
                ORDER BY dia_num
            `),

            // POR HORA DO DIA
            pool.query(`
                SELECT EXTRACT(HOUR FROM created_at) as hora, COUNT(*) as total
                FROM public.reports
                WHERE merged_into IS NULL
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY hora
            `),

            // UNIFICAÇÕES POR CATEGORIA
            pool.query(`
                SELECT c.nome as categoria, COUNT(DISTINCT r.id) as unificadas
                FROM public.reports r
                JOIN report_categories rc ON rc.report_id = r.id
                JOIN public.categories c ON rc.category_id = c.id
                WHERE r.merged_into IS NOT NULL
                GROUP BY c.nome
                ORDER BY unificadas DESC
            `),

            // TOP LOCAIS COM MAIS UNIFICAÇÕES
            pool.query(`
                SELECT
                    r_principal.id,
                    r_principal.lat,
                    r_principal.lng,
                    COUNT(r_absorvidas.id) as absorvidas
                FROM public.reports r_principal
                JOIN public.reports r_absorvidas ON r_absorvidas.merged_into = r_principal.id
                GROUP BY r_principal.id, r_principal.lat, r_principal.lng
                ORDER BY absorvidas DESC
                LIMIT 5
            `),

            // TOP LOCAIS COM MAIS OCORRÊNCIAS (por grid ~200m)
            pool.query(`
                SELECT
                    ROUND(lat::numeric, 3) as lat_grid,
                    ROUND(lng::numeric, 3) as lng_grid,
                    COUNT(*) as total,
                    SUM(COALESCE(peso_heatmap, CASE quantidade WHEN 'Pequena' THEN 1 WHEN 'Média' THEN 2 WHEN 'Grande' THEN 3 ELSE 1 END)) as peso_total
                FROM public.reports
                WHERE merged_into IS NULL
                GROUP BY ROUND(lat::numeric, 3), ROUND(lng::numeric, 3)
                ORDER BY total DESC
                LIMIT 10
            `)
        ]);

        res.json({
            kpis: { ...kpis.rows[0], ...kpisColeta.rows[0] },
            kpis_coleta: kpisColeta.rows[0],
            ocorrencias_por_mes: ocorrenciasPorMes.rows,
            status_por_mes: statusPorMes.rows,
            por_categoria: porCategoria.rows,
            categoria_quantidade: categoriaQuantidade.rows,
            taxa_resolucao_categoria: taxaResolucaoCategoria.rows,
            tempo_medio_categoria: tempoMedioCategoria.rows,
            distribuicao_quantidade: distribuicaoQuantidade.rows,
            ranking_empresas: rankingEmpresas.rows,
            solicitacoes_por_empresa: solicitacoesPorEmpresa.rows,
            expiracao_por_empresa: expiracaoPorEmpresa.rows,
            solicitacoes_por_mes: solicitacoesPorMes.rows,
            tipo_instituicao: tipoInstituicao.rows,
            empresas_por_categoria: empresasPorCategoria.rows,
            funil: funil.rows[0],
            tempo_por_etapa: tempoPorEtapa.rows[0],
            reabertas: reabertas.rows,
            crescimento_ocorrencias: crescimentoOcorrencias.rows,
            crescimento_empresas: crescimentoEmpresas.rows,
            por_dia_semana: porDiaSemana.rows,
            por_hora: porHora.rows,
            unificacoes_por_categoria: unificacoesPorCategoria.rows,
            top_locais_unificados: topLocaisUnificados.rows,
            top_locais_ocorrencias: topLocaisOcorrencias.rows,
        });

    } catch (err) {
        console.error('Erro ao buscar estatísticas:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/*
 * 10. ROTA: Histórico de ocorrências resolvidas (Gestor)
 */
router.get('/historico', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.id, r.lat, r.lng, r.quantidade, r.status, r.created_at, r.updated_at,
                r.descricao_adicional, r.problemas_causados,
                (r.photo_content IS NOT NULL) as has_photo,
                COALESCE(STRING_AGG(DISTINCT c.nome, ', ' ORDER BY c.nome), 'Sem categoria') as tipo_lixo,
                (
                    SELECT JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', cr.id,
                            'status', cr.status,
                            'prazo', cr.prazo,
                            'coletado_em', cr.coletado_em,
                            'created_at', cr.created_at,
                            'empresa', co.nome_fantasia,
                            'empresa_email', co.email_contato,
                            'empresa_telefone', co.telefone
                        ) ORDER BY cr.created_at DESC
                    )
                    FROM public.collection_requests cr
                    JOIN public.companies co ON cr.company_id = co.id
                    WHERE cr.report_id = r.id
                ) as coletas
            FROM public.reports r
            LEFT JOIN report_categories rc ON r.id = rc.report_id
            LEFT JOIN categories c ON rc.category_id = c.id
            WHERE r.status = 'Resolvida'
            GROUP BY r.id
            ORDER BY r.updated_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar histórico:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/*
 * 10. ROTA: Gestor unifica ocorrências repetidas
 */
router.post('/merge', verifyToken, async (req, res) => {
    const { principal_id, absorvidas_ids } = req.body;

    if (!principal_id || !Array.isArray(absorvidas_ids) || absorvidas_ids.length === 0) {
        return res.status(400).json({ error: 'Informe o ID principal e ao menos uma ocorrência a absorver.' });
    }
    if (absorvidas_ids.includes(principal_id)) {
        return res.status(400).json({ error: 'A ocorrência principal não pode estar na lista de absorvidas.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Busca pesos individuais de todas (principal + absorvidas)
        const todosIds = [principal_id, ...absorvidas_ids];
        const { rows: todasOcorrencias } = await client.query(
            `SELECT id, quantidade, peso_heatmap FROM public.reports WHERE id = ANY($1) AND merged_into IS NULL`,
            [todosIds]
        );

        if (todasOcorrencias.length !== todosIds.length) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Uma ou mais ocorrências não foram encontradas ou já estão unificadas.' });
        }

        const pesoMap = { 'Pequena': 1, 'Média': 2, 'Grande': 3 };
        const pesoTotal = todasOcorrencias.reduce((acc, r) => {
            return acc + (r.peso_heatmap || pesoMap[r.quantidade] || 1);
        }, 0);

        // Atualiza a principal com o peso acumulado
        await client.query(
            `UPDATE public.reports SET peso_heatmap = $1, updated_at = NOW() WHERE id = $2`,
            [pesoTotal, principal_id]
        );

        // Marca as absorvidas
        await client.query(
            `UPDATE public.reports SET merged_into = $1, status = 'Unificada', updated_at = NOW() WHERE id = ANY($2)`,
            [principal_id, absorvidas_ids]
        );

        await client.query('COMMIT');
        res.json({ message: 'Ocorrências unificadas com sucesso!', peso_heatmap: pesoTotal });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao unificar ocorrências:', err);
        res.status(500).json({ error: 'Erro ao unificar ocorrências.' });
    } finally {
        client.release();
    }
});

module.exports = router;