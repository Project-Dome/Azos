/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/currentRecord',
        'N/ui/dialog',

       '../pd_inp_service/pd-inp-notification-control.service',
       '../pd_inp_service/pd-inp-status-map.service',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        current_record,
        dialog,

        notification_control_service,
        status_map_service
    ) {
        function pageInit(_context) { }

        function sendToPaymentWebhook() {
            var options = {
                title: 'Confirmação',
                message: 'Deseja reenviar o pagamento ao Webhook?'
            };

            function success() { 
                const notificationControlRec = notification_control_service.load(current_record.get().id);
                notification_control_service.setStatus(status_map_service.getCode('PENDENTE'), notificationControlRec);
            }

            function failure(reason) { 
                console.log("Failure: " + reason); 
            }
            
            dialog.confirm(options).then(success).catch(failure); 
        }


        return {
            pageInit:pageInit,
            sendToPaymentWebhook: sendToPaymentWebhook
        }
    }
);