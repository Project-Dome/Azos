/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        '../pd_ai_mr_service/pd-ai-pending-conciliation-nfse.mapreduce.service'
    ],
    function (
        map_reduce_service
    ) {
        return {
            getInputData: function () {
                return map_reduce_service.getInputData();
            },
            reduce: function (context) {
                map_reduce_service.reduce(context);
            }
        };
    }
);
