/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/record',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,

        record_util
    ) {
        const TYPE = 'vendorbill';
        const FIELDS = {
            id: { name: 'internalid' },
            transactionNumber: { name: 'transactionnumber' },
            status: { name: 'statusRef' },
            isWebhookSent: { name: 'custbody_pd_inp_sent_webhook' },
            totalAmount: { name: 'totalaftertaxes' },
            notificationControl: { name: 'custbody_pd_inp_notification_control' },
            transactionType: { name: 'custbodypd_azos_type_transaction' }
        };
 
        function load(id) {
            return record.load({
                type: TYPE,
                id: id
            });
        }

        function readData(record) {
            return record_util
                .handler(record)
                .data({ fields: FIELDS });
        }

        function setNotificationAsSent(vendorBillRecord, notificationControlId) {
            let vendorBillDataSet = {};

            vendorBillDataSet[FIELDS.isWebhookSent.name] = true;
            vendorBillDataSet[FIELDS.notificationControl.name] = notificationControlId;

            return record_util
                .handler(vendorBillRecord)
                .set(vendorBillDataSet)
                .save();
        }

        return {
            load: load,
            readData: readData,
            setNotificationAsSent: setNotificationAsSent
        }
    }
)