/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mario Augusto Braga Costa
 */
define(
    [
        'N/log',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        log,

        search_util
    ) {
        const TYPE = 'customrecord_pd_ai_authorization';
        const FIELDS = {
            apiId: { name: 'custrecord_pd_ai_a_api_id' },
            apiKey: { name: 'custrecord_pd_ai_a_api_key' }
        };

        function get() {
            return search_util.first({
                type: TYPE,
                columns: FIELDS
            });
        };

        return {
            get: get
        };
    }
);