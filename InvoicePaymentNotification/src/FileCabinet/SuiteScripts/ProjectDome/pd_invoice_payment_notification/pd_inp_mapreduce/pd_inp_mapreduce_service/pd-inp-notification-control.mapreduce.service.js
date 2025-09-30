/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/log',

        '../../pd_inp_service_api/pd-inp-notification-control.service'
    ],
    function (
        log,

        notification_control_service
    ) {
        function getInputData() {
            notification_control_service.getByStatus('status');
        }

        function map(context) {
            const notificationControl = JSON.parse(context.value);
            log.audit('notificationControl', notificationControl);
        };

        return {
            getInputData: getInputData,
            map: map
        }
    }
);