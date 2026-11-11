/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 *
 * PD | INP | Notification Control Builder (CNAB + Manual)
 */

define([
    'N/query',
    'N/log',
    '../pd_inp_service/pd-inp-notification-control.service'
], function (
    query,
    log,
    notificationControlService
) {

    const STATUS_PENDENTE_ID = 1;

    // Rodar somente para a subsidiária PIPA BRASIL (id 3)
    const SUBSIDIARY_ID = 3;

    const INTEGRATION_TYPE = {
        BONUS_PAYMENT_AGENCY: 1,
        COMISSION_PAYMENT:    2,
        SINISTRO:             3,
        REEMBOLSO:            4
    };

    /* ===============================
     * Mapeamento: custbodypd_azos_type_transaction → INTEGRATION_TYPE
     *  1   = Indenização do sinistro         → SINISTRO
     *  2   = Pagamento bônus (Agenciamento)  → BONUS inativo, fallback COMISSION
     *  3   = Pagamento comissão              → COMISSION_PAYMENT
     *  4   = Pagamento Resseguro (Sem Sin.)  → SINISTRO (a confirmar)
     *  5   = Recusa da proposta - Reembolso  → REEMBOLSO
     *  106 = Sinistro                        → SINISTRO
     *  Demais (101-105): fora do escopo → fallback COMISSION_PAYMENT
     * =============================== */
    const VENDOR_BILL_TYPE_TO_INTEGRATION = {
        1:   INTEGRATION_TYPE.SINISTRO,
        2:   INTEGRATION_TYPE.COMISSION_PAYMENT,
        3:   INTEGRATION_TYPE.COMISSION_PAYMENT,
        4:   INTEGRATION_TYPE.SINISTRO,
        5:   INTEGRATION_TYPE.REEMBOLSO,
        106: INTEGRATION_TYPE.SINISTRO
    };

    function resolveIntegrationType(rawType) {
        var parsed = parseInt(rawType, 10);
        if (!parsed) {
            log.error('Builder | resolveIntegrationType', 'Tipo nulo ou inválido — fallback COMISSION_PAYMENT');
            return INTEGRATION_TYPE.COMISSION_PAYMENT;
        }
        var resolved = VENDOR_BILL_TYPE_TO_INTEGRATION[parsed];
        if (resolved === undefined) {
            log.error('Builder | resolveIntegrationType', 'Tipo ' + parsed + ' não mapeado — fallback COMISSION_PAYMENT');
            return INTEGRATION_TYPE.COMISSION_PAYMENT;
        }
        return resolved;
    }

    function getInputData() {

        const sqlCnab = `
            SELECT
                occ.custrecord_brl_retflocc_l_transaction AS payment_id,
                occ.custrecord_brl_retflocc_i_installment AS installment,
                TO_CHAR(t.trandate, 'YYYY-MM-DD')         AS payment_date,
                t.custbodypd_azos_type_transaction        AS transaction_type,
                LISTAGG(occ.custrecord_brl_retflocc_t_code, ',')       AS codes,
                LISTAGG(occ.custrecord_brl_retflocc_ta_details, ' | ') AS messages

            FROM customrecord_brl_ret_file_occurrence occ

            LEFT JOIN transaction t
                ON t.id = occ.custrecord_brl_retflocc_l_transaction

            LEFT JOIN transactionline tl_cnab
                ON tl_cnab.transaction = t.id
                AND tl_cnab.mainline = 'T'

            LEFT JOIN customrecord_pd_inp_notification_control nc
                ON nc.custrecord_pd_inp_nc_payment_id = occ.custrecord_brl_retflocc_l_transaction
                AND nc.custrecord_pd_inp_nc_origin = 'CNAB'

            WHERE occ.custrecord_brl_retflocc_l_status IN (2,3)
              AND nc.id IS NULL
              AND tl_cnab.subsidiary = ${SUBSIDIARY_ID}

            GROUP BY
                occ.custrecord_brl_retflocc_l_transaction,
                occ.custrecord_brl_retflocc_i_installment,
                TO_CHAR(t.trandate, 'YYYY-MM-DD'),
                t.custbodypd_azos_type_transaction
        `;

        const sqlManual = `
            SELECT DISTINCT
                vp.id                                AS payment_id,
                TO_CHAR(vp.trandate, 'YYYY-MM-DD')   AS payment_date,
                vb.id                                AS vendor_bill_id,
                vb.custbodypd_azos_type_transaction  AS transaction_type

            FROM transaction vp

            JOIN transactionline tl
                ON tl.transaction = vp.id
                AND tl.mainline = 'F'
                AND tl.createdfrom IS NOT NULL

            JOIN transaction vb
                ON vb.id = tl.createdfrom
                AND vb.type = 'VendBill'

            JOIN transactionline tl_vb
                ON tl_vb.transaction = vb.id
                AND tl_vb.mainline = 'T'

            LEFT JOIN customrecord_brl_ret_file_occurrence occ
                ON occ.custrecord_brl_retflocc_l_transaction = vb.id
                AND occ.custrecord_brl_retflocc_t_code = '00'

            LEFT JOIN customrecord_pd_inp_notification_control nc
                ON nc.custrecord_pd_inp_nc_transaction_id = vb.id

            WHERE vp.type = 'VendPymt'
              AND vp.voided = 'F'
              AND vb.custbodypd_azos_type_transaction IS NOT NULL
              AND vp.trandate >= TO_DATE(TO_CHAR(ADD_MONTHS(SYSDATE, -3), 'YYYY-MM-DD'), 'YYYY-MM-DD')
              AND occ.id IS NULL
              AND nc.id IS NULL
              AND tl_vb.subsidiary = ${SUBSIDIARY_ID}
        `;

        const cnabResults = query.runSuiteQL({ query: sqlCnab }).asMappedResults()
            .map(r => ({ ...r, source: 'CNAB' }));

        const manualResults = query.runSuiteQL({ query: sqlManual }).asMappedResults()
            .map(r => ({ ...r, source: 'MANUAL' }));

        log.audit('Builder | getInputData', {
            cnab:   cnabResults.length,
            manual: manualResults.length
        });

        return [...cnabResults, ...manualResults];
    }

    function map(context) {

        const row = JSON.parse(context.value);

        const key = row.source === 'CNAB'
            ? `CNAB|${row.payment_id}|${row.installment}`
            : `MANUAL|${row.payment_id}|${row.vendor_bill_id}`;

        context.write({ key, value: row });
    }

    function reduce(context) {

        const rows  = context.values.map(v => JSON.parse(v));
        const first = rows[0];

        /* ===============================
         * FLUXO MANUAL
         * =============================== */
        if (first.source === 'MANUAL') {

            const integrationType = resolveIntegrationType(first.transaction_type);

            const payload = {
                status:          STATUS_PENDENTE_ID,
                integrationType: integrationType,
                transactionId:   first.vendor_bill_id,
                paymentId:       first.payment_id,
                origin:          'MANUAL',

                custrecord_pd_inp_nc_date_payment: first.payment_date,

                reasonCode:    'AZOS',
                reasonMessage: 'Pagamento baixado de forma manual'
            };

            try {
                notificationControlService.create(payload);
            } catch (e) {
                log.error('Builder | erro ao criar NC (MANUAL)', e);
            }

            return;
        }

        /* ===============================
         * FLUXO CNAB
         * =============================== */
        var paymentId       = null;
        var installment     = null;
        var paymentDate     = null;
        var transactionType = null;

        const codesSet    = new Set();
        const messagesSet = new Set();

        rows.forEach(function (row) {

            paymentId       = row.payment_id;
            installment     = row.installment;
            paymentDate     = row.payment_date || null;
            transactionType = row.transaction_type || transactionType;

            if (row.codes) {
                row.codes.split(',').forEach(c => {
                    const v = String(c || '').trim();
                    if (v) codesSet.add(v);
                });
            }

            if (row.messages) {
                row.messages.split(' | ').forEach(m => {
                    const v = String(m || '').trim();
                    if (v) messagesSet.add(v);
                });
            }
        });

        if (!paymentId || !paymentDate) return;

        const integrationType = resolveIntegrationType(transactionType);

        const payload = {
            status:          STATUS_PENDENTE_ID,
            integrationType: integrationType,
            transactionId:   paymentId,
            paymentId:       paymentId,
            origin:          'CNAB',

            custrecord_pd_inp_nc_date_payment: paymentDate,

            reasonCode:    Array.from(codesSet).join(','),
            reasonMessage: Array.from(messagesSet).join(' | ')
        };

        try {
            notificationControlService.create(payload);
        } catch (e) {
            log.error('Builder | erro ao criar NC (CNAB)', e);
        }
    }

    function summarize(summary) {
        log.audit('Builder', 'Execução finalizada');
    }

    return {
        getInputData,
        map,
        reduce,
        summarize
    };
});