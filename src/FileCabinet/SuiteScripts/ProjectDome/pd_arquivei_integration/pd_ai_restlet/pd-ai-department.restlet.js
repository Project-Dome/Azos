/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/log',

        '../pd_ai_service/pd-ai-location.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        log,

        location_service,

        search_util
    ) {
        const TYPE = 'department';
        const FIELDS = {
            id: { name: 'internalid' },
            name: { name: 'name' },
            subsidiary: { name: 'subsidiary' }
        };
        function getHandler(parameters) {
            log.audit({ title: 'parameters', details: parameters });

            // if (!parameters?.location) return [];

            // const locationRecord = location_service.load({ id: parameters?.location });
            // const locationSubsidiary = locationRecord.getValue({ fieldId: 'subsidiary' });

            // log.audit({ title: 'locationSubsidiary', details: locationSubsidiary });

            // if (!locationSubsidiary) return [];

            const _class = search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.subsidiary, "anyof", parameters.subsidiary))
            });

            return _class;
        }

        return {
            get: getHandler
        }
    }
)
