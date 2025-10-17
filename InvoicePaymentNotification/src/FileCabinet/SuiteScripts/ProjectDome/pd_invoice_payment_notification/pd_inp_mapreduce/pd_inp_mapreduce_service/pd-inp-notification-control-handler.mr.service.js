/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/log',
        'N/crypto/random',

        '../../pd_inp_service/pd-inp-status-map.service',
        '../../pd_inp_service/pd-inp-notification-control.service',
        '../../pd_inp_service/pd-inp-transaction-type-map.service',
        '../../pd_inp_api_service/pd-inp-azos-webhook.api'
    ],
    function (
        log,
        random,

        status_map_service ,
        notification_control_service,
        transaction_type_map_service,
        azos_webhook_api_service
    ) {
        function getInputData() {
            return notification_control_service.getByStatus(status_map_service.getCode('PENDENTE'));
        }

        function map(context) {
            const notificationControlData = JSON.parse(context.value);
            log.audit('notificationControlData', notificationControlData);

            let response;

            if (notificationControlData.transactionType == transaction_type_map_service.getCode('REFUND'))
                response = sendToRefundPaymentWebhook(notificationControlData);
            else
                response = sendToComissionsPaymentWebhook(notificationControlData);

            if (response && response.success) {
                const message = `Erro na integração: \n ${JSON.stringify(response.error.message)}`;
                notification_control_service.updateStatus(notificationControlData.id, status_map_service.getCode('ERRO'), message);
            } else {
                notification_control_service.updateStatus(notificationControlData.id, status_map_service.getCode('ENVIADO'));
            }
        };

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

        function sendToComissionsPaymentWebhook(data) {
            const comissionsData = {  
                batchId: random.generateUUID(),  
                listSize: 1,  
                createdAt: new Date(),  
                type: 'COMMISSIONS',
                transactions: [  
                    { transactionId: data.transactionNumber, status: 'APPROVED' }
                ]  
            };

            azos_webhook_api_service.sendComissions(comissionsData)
        }

        return {
            getInputData: getInputData,
            map: map
        }
    }
);