/**
 * @NApiVersion 2.1
 * @NModuleScope public
 *
 * PD | INP | Notification Control (CNAB) Service
 */

define([
    'N/record',
    'N/search',
    'N/log',
    'N/format'
], function (record, search, log, format) {

    const TYPE = 'customrecord_pd_inp_notification_control';

    const FIELDS = {
        status:        'custrecord_pd_inp_nc_status',
        transactionId: 'custrecord_pd_inp_nc_transaction_id',
        paymentId:     'custrecord_pd_inp_nc_payment_id',
        reasonCode:    'custrecord_pd_inp_nc_reason_code',
        reasonMessage: 'custrecord_pd_inp_nc_reason_message',
        origin:        'custrecord_pd_inp_nc_origin',
        occurrenceId:  'custrecord_pd_inp_nc_occurrence_id',
        type:          'custrecord_pd_inp_nc_type',
        payload:       'custrecord_pd_inp_nc_payload',
        paymentDate:   'custrecord_pd_inp_nc_date_payment'
    };

    /* ===============================
     * LOAD
     * =============================== */
    function load(id) {
        return record.load({
            type: TYPE,
            id: id
        });
    }

    /* ===============================
     * UPDATE STATUS
     * =============================== */
    function setStatus(statusId, rec, webhookMessage, payload) {

        record.submitFields({
            type: TYPE,
            id: rec.id,
            values: {
                custrecord_pd_inp_nc_status: statusId,
                custrecord_pd_inp_nc_webhook_response: webhookMessage,
                custrecord_pd_inp_nc_payload: payload
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true
            }
        });

        log.audit('NC Service | status atualizado', {
            id: rec.id,
            status: statusId
        });
    }

    /* ===============================
     * FIND EXISTING (IDEMPOTÊNCIA)
     * =============================== */
    function findExisting(data) {

        const filters = [
            [FIELDS.paymentId, 'is', String(data.paymentId)],
            'AND',
            [FIELDS.type, 'anyof', data.integrationType],
            'AND',
            [FIELDS.origin, 'is', data.origin || 'CNAB']
        ];

        const s = search.create({
            type: TYPE,
            filters: filters,
            columns: ['internalid']
        });

        const r = s.run().getRange({ start: 0, end: 1 });

        return r && r.length ? r[0].getValue('internalid') : null;
    }

    /* ===============================
     * CREATE
     * =============================== */
    function create(data) {

        const existingId = findExisting(data);
        if (existingId) return existingId;

        const rec = record.create({
            type: TYPE,
            isDynamic: false
        });

        rec.setValue({ fieldId: FIELDS.status, value: data.status });
        rec.setValue({ fieldId: FIELDS.type, value: data.integrationType });
        rec.setValue({ fieldId: FIELDS.paymentId, value: String(data.paymentId) });
        rec.setValue({ fieldId: FIELDS.transactionId, value: String(data.transactionId) });
        rec.setValue({ fieldId: FIELDS.origin, value: data.origin || 'CNAB' });

        if (data.reasonCode)
            rec.setValue({ fieldId: FIELDS.reasonCode, value: data.reasonCode });

        if (data.reasonMessage)
            rec.setValue({ fieldId: FIELDS.reasonMessage, value: data.reasonMessage });

        if (data.occurrenceId)
            rec.setValue({ fieldId: FIELDS.occurrenceId, value: data.occurrenceId });

        /* ===============================
         * DATE PAYMENT (FORMA OFICIAL NETSUITE)
         * =============================== */
        if (data.custrecord_pd_inp_nc_date_payment) {

            const iso = data.custrecord_pd_inp_nc_date_payment; // esperado: YYYY-MM-DD
            const parts = iso.split('-');

            // Converte para formato BR
            const brDateString = `${parts[2]}/${parts[1]}/${parts[0]}`;

            const parsedDate = format.parse({
                value: brDateString,
                type: format.Type.DATE
            });

            rec.setValue({
                fieldId: FIELDS.paymentDate,
                value: parsedDate
            });

            log.audit('Date Payment BR', brDateString);
        }

        const id = rec.save();

        log.audit('NC Service | criado', { id });

        return id;
    }

    return {
        create,
        load,
        setStatus
    };
});