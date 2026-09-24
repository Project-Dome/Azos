/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-suitelet.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        suitelet_util
    ) {
        function onRequest(context) {
            suitelet_util.build({
                context: context,
                title: 'Conciliação - NFS-e',
                statics: {
                    html: (
                        [
                            'pd-ai-nfse.html',
                            'pd-ai-enter-values-purchase-order.html',
                            'pd-ai-confirmation-popup.html'
                        ]
                    ),
                    js: (
                        [
                            'pd-ai-nfse.js',
                            'pd-ai-enter-values-purchase-order.js',
                            'pd-ai-reconcile-notes.js'
                        ]
                    ),
                    css: (
                        [
                            'pd-ai-nfse.css'
                        ]
                    )
                },
                parameters: {
                    conciliation: 'nfse'
                }
            });
        }

        return {
            onRequest: onRequest
        }
    }
);
