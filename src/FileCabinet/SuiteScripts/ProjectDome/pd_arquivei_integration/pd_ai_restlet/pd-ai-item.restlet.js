/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/log',

        '../pd_ai_service/pd-ai-subsidiary.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        log,

        subsidiary_service,
        search_util
    ) {
        const TYPE = 'item';
        const ITEM_TYPE = 'Service';
        const SUB_TYPE = [
            'Sale',
            'Purchase'
        ];

        const FIELDS = {
            id: { name: 'internalid' },
            name: { name: 'itemid' },
            itemType: { name: 'type' },
            subType: { name: 'subtype' },
            isInactive: { name: 'isinactive' },
            subsidiary: { name: 'subsidiary' }
        };

        function getHandler(parameters) {
            log.audit({ title: 'parameters', details: parameters });

            const subsidiaryData = subsidiary_service.getByCnpj(formatCNPJ(parameters.taker));

            if (!subsidiaryData) {
                throw "Subsidiaria de Tomador não esta registrada"
            }

            const items = search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: buildQuery(parameters, subsidiaryData.id)
            });

            function buildQuery(parameters, subsidiaryId) {
                let _query = search_util
                    .where(search_util.query(FIELDS.isInactive, "is", false))
                    .and(search_util.query(FIELDS.subsidiary, "anyof", subsidiaryId))

                if (parameters?.conciliation == 'nfse') {
                    _query.and(search_util.query(FIELDS.itemType, 'is', ITEM_TYPE));
                }

                return _query
            }

            return items;
        }

        function formatCNPJ(cnpj) {
            cnpj = cnpj.replace(/\D/g, '');

            cnpj = cnpj.replace(/^(\d{2})(\d)/, '$1.$2');
            cnpj = cnpj.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            cnpj = cnpj.replace(/\.(\d{3})(\d)/, '.$1/$2');
            cnpj = cnpj.replace(/(\d{4})(\d)/, '$1-$2');

            return String(cnpj);
        };


        return {
            get: getHandler
        }
    }
)
