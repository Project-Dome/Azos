/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search',
    'N/log',
    'N/crypto/random',
    'N/email',

    '../pd_inp_service/pd-inp-status-map.service',
    '../pd_inp_service/pd-inp-notification-control.service',
    '../pd_inp_api_service/pd-inp-azos-webhook.api'
], function (
    search,
    log,
    random,
    email,
    statusMapService,
    notificationControlService,
    azosWebhookApi
) {

    const TYPE = 'customrecord_pd_inp_notification_control';
    const MAX_BATCH_SIZE = 1000;

    const TRANSACTION_TYPE = {
        BONUS_PAYMENT_AGENCY: 1,
        COMISSION_PAYMENT:    2,
        SINISTRO:             3,
        REEMBOLSO:            4
    };

    const FIELDS = {
        status:        'custrecord_pd_inp_nc_status',
        transactionId: 'custrecord_pd_inp_nc_transaction_id',
        type:          'custrecord_pd_inp_nc_type',
        origin:        'custrecord_pd_inp_nc_origin',
        reason:        'custrecord_pd_inp_nc_reason_message',
        reasonCode:    'custrecord_pd_inp_nc_reason_code',
        paymentDate:   'custrecord_pd_inp_nc_date_payment'
    };

    const STATUS = {
        PENDENTE: statusMapService.getCode('PENDENTE'),
        ENVIADO:  statusMapService.getCode('ENVIADO'),
        ERRO:     statusMapService.getCode('ERRO')
    };

    function getInputData() {
        return search.create({
            type: TYPE,
            filters: [
                 [FIELDS.status, 'anyof', STATUS.PENDENTE, STATUS.ERRO]
            ],
            columns: [
                'internalid',
                FIELDS.transactionId,
                FIELDS.type,
                FIELDS.origin,
                FIELDS.reason,
                FIELDS.reasonCode,
                FIELDS.paymentDate
            ]
        });
    }

    function map(context) {
        const r = JSON.parse(context.value);
        const transactionType = parseInt(r.values[FIELDS.type].value, 10);

        context.write({
            key: transactionType,
            value: r
        });
    }

    function getTranId(internalId) {
        try {
            const lookup = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: internalId,
                columns: ['tranid']
            });

            return lookup.tranid || internalId;

        } catch (e) {
            log.error('Erro ao buscar tranid', { internalId, error: e });
            return internalId; // fallback
        }
    }

    function reduce(context) {

        const transactionType = parseInt(context.key, 10);
        const records = context.values.map(v => JSON.parse(v));

        const transactions = records.map(r => {

            const internalId = r.values[FIELDS.transactionId];
            const tranid = getTranId(internalId);

            const origin = r.values[FIELDS.origin] || '';

            /* ===============================
             * FLUXO MANUAL
             * =============================== */
            if (origin === 'MANUAL') {

                let formattedDate = null;
                const rawDateField = r.values[FIELDS.paymentDate];

                if (rawDateField) {
                    if (typeof rawDateField === 'object' && rawDateField.text) {
                        formattedDate = rawDateField.text;
                    } else if (typeof rawDateField === 'string') {
                        formattedDate = rawDateField;
                    }
                }

                const transactionObject = {
                    transactionId: tranid,
                    status:        'APPROVED',
                    reason:        'Pagamento baixado de forma manual'
                };

                if (formattedDate) {
                    transactionObject.datePayment = formattedDate;
                }

                return transactionObject;
            }

            /* ===============================
             * FLUXO CNAB
             * =============================== */
            let reasonRaw = (r.values[FIELDS.reason] || '').trim();

            if (reasonRaw) {
                reasonRaw = reasonRaw
                    .split('|')
                    .map(p => p.trim())
                    .join(' | ');
            }

            const hasError =
                reasonRaw &&
                reasonRaw.toLowerCase() !== 'pagamento efetuado';

            /* ===============================
             * DATA
             * =============================== */
            let formattedDate = null;
            const rawDateField = r.values[FIELDS.paymentDate];

            if (rawDateField) {
                if (typeof rawDateField === 'object' && rawDateField.text) {
                    formattedDate = rawDateField.text;
                } else if (typeof rawDateField === 'string') {
                    formattedDate = rawDateField;
                }
            }

            const transactionObject = {
                transactionId: tranid,
                status:        hasError ? 'REJECTED' : 'APPROVED',
                reason:        hasError ? reasonRaw : 'Pagamento efetuado'
            };

            if (hasError) {

                const rawCodes = r.values[FIELDS.reasonCode] || '';

                const codesArray = rawCodes
                    .split(',')
                    .map(c => c.trim())
                    .filter(c => c);

                if (codesArray.length) {
                    transactionObject.reasonCodes = codesArray;
                }

            } else if (formattedDate) {
                transactionObject.datePayment = formattedDate;
            }

            return transactionObject;
        });

        /* ===============================
         * ROTEAMENTO POR TIPO
         * =============================== */
        var sendFn;
        var typeLabel;

        if (transactionType === TRANSACTION_TYPE.SINISTRO) {
            sendFn    = azosWebhookApi.sendSinistro;
            typeLabel = 'SINISTRO';
        } else if (transactionType === TRANSACTION_TYPE.REEMBOLSO) {
            sendFn    = azosWebhookApi.sendRefund;
            typeLabel = 'REFUND';
        } else {
            sendFn    = azosWebhookApi.sendComissions;
            typeLabel = 'COMMISSIONS';
        }

        sendInBatches(transactions, records, typeLabel, sendFn);
    }

    function sendInBatches(transactions, records, typeLabel, sendFn) {

        for (let i = 0; i < transactions.length; i += MAX_BATCH_SIZE) {

            const chunk        = transactions.slice(i, i + MAX_BATCH_SIZE);
            const chunkRecords = records.slice(i, i + MAX_BATCH_SIZE);

            const payload = {
                batchId:      random.generateUUID(),
                listSize:     chunk.length,
                createdAt:    new Date().toISOString(),
                type:         typeLabel,
                transactions: chunk
            };

            let response;
            try {
                response = sendFn(payload);
            } catch (e) {
                response = { error: e.message || e };
            }

            try {
                email.send({
                    author: 4,
                    recipients: ['vinicius.betim@projectdome.com.br'],
                    subject: `[INP] Payload enviado — ${typeLabel} — ${new Date().toISOString()}`,
                    body: `<pre>${JSON.stringify(payload, null, 2)}</pre>\n\n<b>Response:</b>\n<pre>${JSON.stringify(response, null, 2)}</pre>`
                });
            } catch (emailErr) {
                log.error('Sender | erro ao enviar e-mail de debug', emailErr);
            }

            const isSuccess =
                response &&
                (
                    response.status  === 'success' ||
                    response.success === true       ||
                    response.status  === 200
                );

            chunkRecords.forEach(r => {

                const rec = notificationControlService.load(r.id);

                const newStatus = isSuccess ? STATUS.ENVIADO : STATUS.ERRO;

                const message = isSuccess
                    ? 'Webhook enviado com sucesso'
                    : JSON.stringify(response?.error || response);

                notificationControlService.setStatus(
                    newStatus,
                    rec,
                    message,
                    JSON.stringify(payload)
                );
            });
        }
    }

    return {
        getInputData,
        map,
        reduce
    };
});