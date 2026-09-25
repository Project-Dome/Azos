/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/record',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record
    ) {
        const TYPE = 'employee';
        const FIELDS = {
            email: { name: 'email' }
        };

        // Load individual por employee (e não busca por anyof) — decisão registrada na spec,
        // seção 10: mais simples de garantir corretude a partir do multi-select da Configuração
        function getEmailById(employeeId) {
            const _employee = record.load({ type: TYPE, id: employeeId });

            return ifNullOrEmpty(_employee.getValue(FIELDS.email.name), null);
        };

        return {
            getEmailById: getEmailById
        };
    }
);
