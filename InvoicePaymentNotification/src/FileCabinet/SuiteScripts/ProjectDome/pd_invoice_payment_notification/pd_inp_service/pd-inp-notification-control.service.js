/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/record',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,

        record_util,
        search_util
    ) {
        const TYPE = 'customrecord_pd_cpmbc_config_bill';
        const FIELDS = {
            id: { name: 'internalid' },
            subsidiary: { name: 'custrecord_pd_cpmbc_subsidiary' },
            vendor: { name: 'custrecordpd_cpmbc_vendor' },
            item: { name: 'custrecord_pd_cpmbc_item' },
            account: { name: 'custrecord_pd_cpmbc_account' }
        };

        function create(data) {
            const notiticationControlRec = record.create({ type: TYPE });

            let notificationControlDataSet = {};

            notificationControlDataSet[FIELDS.account] = data.account;
            notificationControlDataSet[FIELDS.account] = data.account;
            notificationControlDataSet[FIELDS.account] = data.account;
            notificationControlDataSet[FIELDS.account] = data.account;

            return record_util
                .handler(notiticationControlRec)
                .set(notificationControlDataSet)
        }

        function getByStatus(status) {
            if (isNullOrEmpty(subsidiaryId)) return;

            return search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.status, 'anyof', status))
            });
        }

        return {
            create: create,
            getByStatus: getByStatus
        }
    }
)