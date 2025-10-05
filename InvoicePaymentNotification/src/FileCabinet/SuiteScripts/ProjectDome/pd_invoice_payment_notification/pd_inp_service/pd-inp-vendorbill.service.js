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
        const FIELDS = {
            id: { name: 'internalid' },
            transactionNumber: { name: 'tranid' },
            status: { name: 'statusRef' },
            isWebhookSent: { name: 'custbody_pd_inp_sent_webhook' },
            amount: { name: 'custrecord_pd_cpmbc_item' }
        };
 
        function readData(record) {
            return record_util
                .handler(record)
                .data({ fields: FIELDS });
        }

        return {
            readData: readData
        }
    }
)