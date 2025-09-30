/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define(
    [
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record_util
    ) {
        const TYPE = 'payment';
        const FIELDS = {
            id: { name: 'internalid' },
            subsidiary: { name: 'custrecord_pd_cpmbc_subsidiary' },
            vendor: { name: 'custrecordpd_cpmbc_vendor' },
            item: { name: 'custrecord_pd_cpmbc_item' },
            account: { name: 'custrecord_pd_cpmbc_account' }
        };

        function readData(record) {
            return record_util
                .handler(record)
                .data({ fields: FIELDS })
        }

        return {
            readData: readData
        }
    }
)