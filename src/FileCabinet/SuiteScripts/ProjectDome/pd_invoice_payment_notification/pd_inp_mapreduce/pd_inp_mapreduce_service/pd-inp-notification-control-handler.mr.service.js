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

        status_map_service,
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
            log.audit('response', response);

            const notificationControlRec = notification_control_service.load(notificationControlData.id)

            try {
                let message;
                let status;
                
                if (response && response.success) {
                    message = response.data.message || 'Integração realizada com sucesso.';
                    status = status_map_service.getCode('ENVIADO');
                } else {
                    message = `Erro na integração: \n ${JSON.stringify(response.error.message)}`;
                    status = status_map_service.getCode('ERRO');
                }

                notification_control_service.setStatus(
                    status, 
                    notificationControlRec, 
                    message, 
                    JSON.stringify(response.requestBody)
                );

            } catch (error) {
                log.error('Erro inesperado na integração', error);
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

            return azos_webhook_api_service.sendRefund(refundData)
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

            return azos_webhook_api_service.sendComissions(comissionsData)
        }

        return {
            getInputData: getInputData,
            map: map
        }
    }
);