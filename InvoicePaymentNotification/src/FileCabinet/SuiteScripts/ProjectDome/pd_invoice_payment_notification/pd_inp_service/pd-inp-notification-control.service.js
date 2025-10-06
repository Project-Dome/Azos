/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/record',

        './pd-inp-status-map.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,

        status_map_service,

        record_util,
        search_util
    ) {
        const TYPE = 'customrecord_pd_inp_notification_control';
        const FIELDS = {
            id: { name: 'internalid' },
            status: { name: 'custrecord_pd_inp_integration_status' },
            vendorBill: { name: 'custrecord_pd_inp_vendorbill' },
            transactionType: { name: 'custrecord_pd_inp_transaction_type' },
            transactionAmount: { name: 'custrecord_pd_inp_transaction_amount' },
            transactionNumber: { name: 'custrecord_pd_inp_transaction_number' }
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

        function create(data) {
            const notiticationControlRec = record.create({ type: TYPE });

            let notificationControlDataSet = {};

            notificationControlDataSet[FIELDS.status.name] = status_map_service.getCode('PENDENTE');
            notificationControlDataSet[FIELDS.vendorBill.name] = data.id;
            notificationControlDataSet[FIELDS.transactionType.name] = data.transactionType;
            notificationControlDataSet[FIELDS.transactionAmount.name] = data.totalAmount;
            notificationControlDataSet[FIELDS.transactionNumber.name] = `${data.transactionNumber}${Date.now().toString().slice(-7)}`;
            
            return record_util
                .handler(notiticationControlRec)
                .set(notificationControlDataSet)
                .save();
        }

        function setStatus(status, notificationControlRecord) {
            let notificationControlDataSet = {};

            notificationControlDataSet[FIELDS.status.name] = status;

            return record_util
                .handler(notificationControlRecord)
                .set(notificationControlDataSet)
                .save();
        }
        
        
        function getByStatus(status) {
            return search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.status, 'anyof', status)),
            });
        }

        return {
            load: load,
            readData: readData,
            create: create,
            setStatus: setStatus,
            getByStatus: getByStatus
        }
    }
)