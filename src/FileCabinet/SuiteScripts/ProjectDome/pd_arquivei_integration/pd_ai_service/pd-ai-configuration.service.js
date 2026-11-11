/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/record',
        'N/format',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,
        format,

        search_util
    ) {
        const TYPE = 'customrecord_pd_ai_configuration';
        const FIELDS = {
            id: { name: 'internalid' },
            vendorAlertRecipients: { name: 'custrecord_pd_ai_cfg_vendor_alert_ms' },
            vendorAlertFrequency: { name: 'custrecord_pd_ai_cfg_vendor_freq_ls' },
            vendorAlertLastSent: { name: 'custrecord_pd_ai_cfg_vendor_last_dt' },
            vendorAlertSender: { name: 'custrecord_pd_ai_cfg_vendor_sender_ls' }
        };

        // Carrega o record (em vez de ler pelas colunas da busca) para o multi-select voltar como
        // array de ids e a data como Date, sem depender de como o search_util formata esses tipos
        function get() {
            const _configuration = search_util.first({
                type: TYPE,
                columns: { id: FIELDS.id },
                query: search_util
                    .where(search_util.query({ name: 'isinactive' }, 'is', 'F'))
            });
            if (!_configuration) return null;

            const _record = record.load({ type: TYPE, id: _configuration.id });

            return {
                id: _configuration.id,
                vendorAlertRecipients: ifNullOrEmpty(_record.getValue(FIELDS.vendorAlertRecipients.name), []),
                vendorAlertFrequency: ifNullOrEmpty(_record.getValue(FIELDS.vendorAlertFrequency.name), null),
                vendorAlertLastSent: ifNullOrEmpty(_record.getValue(FIELDS.vendorAlertLastSent.name), null),
                vendorAlertSender: ifNullOrEmpty(_record.getValue(FIELDS.vendorAlertSender.name), null)
            };
        };

        function setVendorAlertLastSent(options) {
            let _mapValues = {};

            _mapValues[FIELDS.vendorAlertLastSent.name] = format.format({
                value: options.date,
                type: format.Type.DATE
            });

            return record.submitFields({
                type: TYPE,
                id: options.recordId,
                values: _mapValues
            });
        };

        return {
            get: get,
            setVendorAlertLastSent: setVendorAlertLastSent
        };
    }
);
