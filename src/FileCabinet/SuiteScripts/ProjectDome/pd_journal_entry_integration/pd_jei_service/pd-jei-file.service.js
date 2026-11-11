/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - João Lima Neves
 */

define(
    [
        'N/record',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,

        search_util
    ) {
        const TYPE = 'file';
        const FIELDS = {
            id: { name: 'internalid' },
            name: { name: 'name' },
            folder: { name: 'folder' }
        };

        function getByFolderId(folderId) {
            return search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.folder, 'anyof', folderId))
            });
        }

        return {
            getByFolderId: getByFolderId
        }
    }
)