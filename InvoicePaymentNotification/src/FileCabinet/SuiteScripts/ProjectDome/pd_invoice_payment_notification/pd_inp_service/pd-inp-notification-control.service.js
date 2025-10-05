/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/record',

        './status-map.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,

        status_map_service,

        record_util
    ) {
        const TYPE = 'customrecord_pd_inp_notification_control';
        const FIELDS = {
            id: { name: 'internalid' },
            status: { name: 'custrecord_pd_inp_integration_status' },
            vendorBill: { name: 'custrecord_pd_inp_vendorbill' },
            transactionAmount: { name: 'custrecord_pd_inp_transaction_amount' },
            transactionNumber: { name: 'custrecord_pd_inp_transaction_number' }
        };

        function load(id) {
            return record.load({ 
                type: TYPE, 
                id: id 
            });
        }

        function create(data) {
            const notiticationControlRec = record.create({ type: TYPE });

            let notificationControlDataSet = {};

            notificationControlDataSet[FIELDS.status] = status_map_service.getCode('PENDENTE');
            notificationControlDataSet[FIELDS.vendorBill] = data.vendorBillId;
            notificationControlDataSet[FIELDS.transactionType] = data.transactionType;
            notificationControlDataSet[FIELDS.transactionAmount] = data.amount;
            notificationControlDataSet[FIELDS.transactionNumber] = `${data.transactionNumber}${Date.now().toString().slice(-7)}`;

            return record_util
                .handler(notiticationControlRec)
                .set(notificationControlDataSet)
                .save();
        }

        function setStatus(status, notificationControlRecord) {
            let notificationControlDataSet = {};

            notificationControlDataSet[FIELDS.status] = status;

            return record_util
                .handler(notificationControlRecord)
                .set(notificationControlDataSet)
                .save();
        }

        return {
            load: load,
            create: create,
            setStatus: setStatus
        }
    }
)