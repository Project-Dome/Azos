/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        '../pd_ai_mr_service/pd-ai-fix-nfse-id.mapreduce.service'
    ],
    function (
        map_reduce_service
    ) {
        return {
            getInputData: function () {
                return map_reduce_service.getInputData();
            },
            map: function (context) {
                map_reduce_service.map(context);
            },
            summarize: function (summary) {
                map_reduce_service.summarize(summary);
            }
        };
    }
);
