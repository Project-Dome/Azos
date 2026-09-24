/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @author Project Dome - Mário Augusto Braga Costa
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
        const TYPE = 'location';
        const FIELDS = {
            id: { name: 'internalid' },
            name: { name: 'name' },
            subsidiary: { name: 'subsidiary' }
        };
        function getHandler(parameters) {
            const locations = search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.subsidiary, "anyof", parameters.subsidiary))
            });

            return locations;
        }

        return {
            get: getHandler
        }
    }
)
