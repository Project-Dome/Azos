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
        const TYPE = 'customrecord_pd_ai_vendor_alert_rcpt';
        const FIELDS = {
            employee: { name: 'custrecord_pd_ai_var_employee_ls' },
            employeeEmail: { name: 'email', join: 'custrecord_pd_ai_var_employee_ls' },
            isInactive: { name: 'isinactive' }
        };

        function getAllEmails() {
            const _recipients = search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: buildQuery()
            });

            return (_recipients || [])
                .map(function (recipient) { return recipient?.employeeEmail; })
                .filter(function (email) { return !isNullOrEmpty(email); });

            function buildQuery() {
                return search_util
                    .where(search_util.query(FIELDS.isInactive, 'is', false));
            }
        };

        return {
            getAllEmails: getAllEmails
        };
    }
);
