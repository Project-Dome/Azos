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
        const TYPE = 'vendorcategory';
        const FIELDS = {
            id: { name: 'internalid' },
            name: { name: 'name' }
        };
        function getHandler() {
            const categoryList = search_util.all({
                type: TYPE,
                columns: FIELDS

            });

            log.audit('categoryList', categoryList);

            return categoryList;
        }

        return {
            get: getHandler
        }
    }
)
