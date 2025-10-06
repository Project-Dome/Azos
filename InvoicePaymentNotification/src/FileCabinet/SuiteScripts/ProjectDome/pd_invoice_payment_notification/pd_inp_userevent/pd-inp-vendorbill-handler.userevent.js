/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author Project Dome - Roque Costa
 */

define(
    [
        '../pd_inp_service/pd-inp-vendorbill.service',
        '../pd_inp_service/pd-inp-notification-control.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-userevent.util'
    ],
    function (
        vendorbill_service,
        notification_control_service,

        userevent_util
    ) {
        function beforeLoad(context) {
            context.form.addButton({
                id: 'custpage_btn_send_payment',
                label: 'Enviar Webhook de Pagamento',
                functionName: 'sendToPaymentWebhook'
            })
        }

        function afterSubmit(context) {
            if (!userevent_util.isCreation(context) && !userevent_util.isEdition(context)) return
            
            const vendorBillData = vendorbill_service.readData(context.newRecord);

            if(!checkIfVendorBillIsAbleToIntegrate(vendorBillData)) return;

            const notificationControlId = notification_control_service.create(vendorBillData);

            const newVendorBillRec = vendorbill_service.load(context.newRecord.id);
            vendorbill_service.setNotificationAsSent(newVendorBillRec, notificationControlId);
        }

        function checkIfVendorBillIsAbleToIntegrate(vendorBillData) {
            return vendorBillData.status == 'paidInFull' &&
                !vendorBillData.isWebhookSent &&
                vendorBillData.transactionType;
        }

        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        }
    }
);