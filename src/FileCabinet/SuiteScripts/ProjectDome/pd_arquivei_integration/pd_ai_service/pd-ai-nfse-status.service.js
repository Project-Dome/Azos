/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/record',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,

        search_util
    ) {
        const TYPE = 'customrecord_pd_ai_nfse_status'
        const FIELDS = {
            id: { name: 'internalid' },
            code: { name: 'custrecord_pd_ai_sn_code' },
            name: { name: 'name' }
        };

        function getAll() {
            return search_util.all({
                type: TYPE,
                columns: FIELDS
            });
        };

        function mapByCode(list) {
            const map = {};

            list.forEach(function (item) {
                map[item.code] = item;
            });

            return map;
        }

        return {
            getAll: getAll,
            mapByCode: mapByCode
        };
    }
);