/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/record',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,

        record_util,
        search_util
    ) {
        const TYPE = 'purchaseorder';
        const FIELDS = {
            location: { name: 'location', type: 'list' },
            internalId: { name: 'internalid' }
        };

        function getById(id) {
            return search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.internalId, 'anyof', id))
            });
        }

        return {
            getById: getById
        };
    }
);
