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
        const TYPE = 'vendor'
        const FIELDS = {
            id: { name: 'internalid' },
            cnpj: { name: 'custentity_brl_entity_t_fed_tax_reg' }
        };

        function getByCNPJ(cnpj) {
            return search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.cnpj, 'is', cnpj))
            });
        };

        return {
            getByCNPJ: getByCNPJ
        };
    }
);