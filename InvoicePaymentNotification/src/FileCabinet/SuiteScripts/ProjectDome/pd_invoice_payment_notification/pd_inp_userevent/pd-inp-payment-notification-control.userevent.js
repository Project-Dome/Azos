/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author Project Dome - Roque Costa
 */

define(
    [
        '../pd_inp_service/pd-inp-notification-control.service',
        '../pd_inp_service/pd-inp-transaction-type-map.service',
        '../pd_inp_api_service/pd-inp-azos-webhook.api'
    ],
    function (
        notification_control_service,
        transaction_type_map_service,
        azos_webhook_api_service,
    ) {

        function afterSubmit(context) {
            const notificationControlData = notification_control_service.readData(context.newRecord);

            if (notificationControlData.transactionType == transaction_type_map_service.code('REFUND'))
                sendToRefundPaymentWebhook(notificationControlData);
        }

        function sendToRefundPaymentWebhook(data) {
            const refundData = {
                transactionId: data.transactionNumber,  
                refundedValue: data.amount,  
                refundPaymentDate: new Date(),  
                status: 'APPROVED',  
                reason: null
            };

            azos_webhook_api_service.sendRefund(refundData)
        }
        
        return {
            afterSubmit: afterSubmit
        }
    }
);