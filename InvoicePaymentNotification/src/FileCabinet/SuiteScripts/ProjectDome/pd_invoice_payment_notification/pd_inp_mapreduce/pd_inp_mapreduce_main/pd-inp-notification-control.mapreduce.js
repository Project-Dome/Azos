/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @author Project Dome - Roque Costa
 */

define(
    [
        '../pd_inp_mapreduce_service/pd-inp-notification-control.mapreduce.service'
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
            }
        };
    }
);