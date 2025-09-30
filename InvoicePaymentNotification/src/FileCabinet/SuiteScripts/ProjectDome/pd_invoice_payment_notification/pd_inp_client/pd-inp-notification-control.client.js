/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/record',
        'N/ui/dialog',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,
        dialog
    ) {

        const MESSAGE_MANAGEMENT_SUITELET_URL = '/app/site/hosting/scriptlet.nl?script=customscript_pd_cpm_manager_install_st&deploy=customdeploy_pd_cpm_manager_install_st';

        function pageInit(_context) { }

        function sendToPaymentApi() {
            var options = {
                title: 'Confirmação',
                message: 'Deseja reenviar o pagamento?'
            };

            function success(result) { 
                console.log("Success with value " + result); 
            }

            function failure(reason) { 
                console.log("Failure: " + reason); 
            }
            
            dialog.confirm(options).then(success).catch(failure); 
        }


        return {
            pageInit:pageInit,
            sendToPaymentApi: sendToPaymentApi
        }
    }
);