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
        const TYPE = 'location'
        const FIELDS = {
            id: { name: 'internalid' },
            subsidiary: { name: 'subsidiary', type: 'list' }
        };

        function getById(id) {
            return search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.id, 'anyof', id))
            });
        };

        function load(object) {
            return record.load({ type: TYPE, id: object.id, isDynamic: ifNullOrEmpty(object?.isDynamic, false) });
        }

        return {
            getById: getById,
            load: load
        };
    }
);