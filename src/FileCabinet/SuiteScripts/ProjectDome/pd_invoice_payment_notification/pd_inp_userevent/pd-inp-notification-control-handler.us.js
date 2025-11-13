/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author Project Dome - Roque Costa
 */

define(
    [
        '../pd_inp_service/pd-inp-notification-control.service',
        '../pd_inp_service/pd-inp-status-map.service',

    ],
    function (
        notification_control_service,
        status_map_service,
    ) {
        function beforeLoad(context) {
            context.form.clientScriptModulePath = '../pd_inp_client/pd-inp-notification-control.cs.js';

            const notificationControlData = notification_control_service.readData(context.newRecord);

            if (notificationControlData.status != status_map_service.getCode('PENDENTE')) {
                context.form.addButton({
                    id: 'custpage_btn_send_payment',
                    label: 'Enviar a Webhook de Pagamento',
                    functionName: 'sendToPaymentWebhook'
                })
            }
        }

        return {
            beforeLoad: beforeLoad
        }
    }
);            
        