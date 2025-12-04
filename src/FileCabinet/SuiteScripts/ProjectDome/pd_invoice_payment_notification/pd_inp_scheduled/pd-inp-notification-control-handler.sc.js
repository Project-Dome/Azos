/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/log',
        'N/crypto/random',

        '../pd_inp_service/pd-inp-status-map.service',
        '../pd_inp_service/pd-inp-notification-control.service',
        '../pd_inp_service/pd-inp-transaction-type-map.service',
        '../pd_inp_api_service/pd-inp-azos-webhook.api'
    ],
    function (
        log,
        random,

        status_map_service,
        notification_control_service,
        transaction_type_map_service,
        azos_webhook_api_service
    ) {
        function execute() {
            const notificationControlList = notification_control_service.getByStatus(status_map_service.getCode('PENDENTE')); 
            log.audit('notificationControlList', notificationControlList);

            const comissions = [];

            notificationControlList.forEach(function(notificationControlData) {
                if (notificationControlData.transactionType == transaction_type_map_service.getCode('BONUS_PAYMENT_AGENCY') ||
                    notificationControlData.transactionType == transaction_type_map_service.getCode('COMISSION_PAYMENT')) {

                    comissions.push({ 
                        transactionId: notificationControlData.transactionNumber, 
                        status: 'APPROVED' 
                    });
                }
            });

            let response;

            response = sendToComissionsPaymentWebhook(comissions);

            notificationControlList.forEach(function (notificationControlData) {
                const notificationControlRec = notification_control_service.load(notificationControlData.id);

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

            });
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

        function sendToComissionsPaymentWebhook(transactions) {
            const comissionsData = {  
                batchId: random.generateUUID(),  
                listSize: 1,  
                createdAt: new Date(),  
                type: 'COMMISSIONS',
                transactions: transactions
            };

            return azos_webhook_api_service.sendComissions(comissionsData)
        }

        return {
            execute: execute
        }
    }
);