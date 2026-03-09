/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        search_util
    ) {
        const TYPE = 'subsidiary'
        const FIELDS = {
            id: { name: 'internalid' },
            cnpj: { name: 'custrecord_brl_subsd_t_fed_tx_reg' },
            autoImportNfse: { name: 'custrecord_pd_ai_import_nfse' },
            autoImportNfe: { name: 'custrecord_pd_ai_import_nfe' },
            autoImportCte: { name: 'custrecord_pd_ai_import_cte' }
        };

        function getSubsidiary() {
            return search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.cnpj, 'isnotempty'))
                    .and(search_util.query(FIELDS.autoImportNfse, 'is', true))
                    .or(search_util.query(FIELDS.autoImportNfe, 'is', true))
                    .or(search_util.query(FIELDS.autoImportCte, 'is', true))
            });
        };

        function getByCnpj(cnpj) {
            return search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.cnpj, 'is', cnpj))
            });
        }

        function getById(id) {
            return search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.id, 'is', id))
            });
        }

        return {
            getSubsidiary: getSubsidiary,
            getByCnpj: getByCnpj,
            getById: getById
        };
    }
);