/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/record',
        'N/format',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,
        format,

        record_util,
        search_util
    ) {
        const TYPE = 'customrecord_pd_ai_vendor_alert_queue';
        const FIELDS = {
            id: { name: 'internalid' },
            number: { name: 'custrecord_pd_ai_vaq_number_ds' },
            cnpj: { name: 'custrecord_pd_ai_vaq_cnpj_ds' },
            vendorName: { name: 'custrecord_pd_ai_vaq_vendor_name_ds' },
            sentDate: { name: 'custrecord_pd_ai_vaq_sent_dt' }
        };

        function getPending() {
            return search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query({ name: 'isinactive' }, 'is', 'F'))
            });
        };

        function create() {
            return record.create({ type: TYPE });
        };

        function set(options) {
            let _vendorAlertQueue = {};

            _vendorAlertQueue[FIELDS.number.name] = options?.data?.number;
            _vendorAlertQueue[FIELDS.cnpj.name] = options?.data?.cnpj;
            _vendorAlertQueue[FIELDS.vendorName.name] = options?.data?.vendorName;

            return record_util
                .handler(options.record)
                .set(_vendorAlertQueue);
        };

        function save(record, options) {
            return record.save({
                ignoreMandatoryFields: ifNullOrEmpty(options?.ignore, false)
            });
        };

        // Registro reportado não é apagado: fica inativo, com a data de envio, como log de que já saiu num e-mail
        function markAsReported(recordId) {
            let _mapValues = { isinactive: true };

            _mapValues[FIELDS.sentDate.name] = format.format({
                value: new Date(),
                type: format.Type.DATE
            });

            return record.submitFields({
                type: TYPE,
                id: recordId,
                values: _mapValues
            });
        };

        return {
            getPending: getPending,
            create: create,
            set: set,
            save: save,
            markAsReported: markAsReported
        };
    }
);
