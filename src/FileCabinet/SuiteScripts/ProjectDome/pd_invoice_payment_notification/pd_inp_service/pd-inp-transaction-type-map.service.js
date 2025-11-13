/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define([], function() {

    const TRANSACTION_TYPE_MAP = {
        'BONUS_PAYMENT_AGENCY': 2,
        'COMISSION_PAYMENT': 3
    };

    function getCode(label) {
        if (!TRANSACTION_TYPE_MAP.hasOwnProperty(label)) throw new Error(`Status label "${label}" not found in STATUS_MAP.`);
        
        return TRANSACTION_TYPE_MAP[label];
    }

    function getLabel(code) {
        const entry = Object.entries(TRANSACTION_TYPE_MAP).find(([key, val]) => val === code);
        return entry ? entry[0] : code;
    }

    return {
        getCode,
        getLabel
    };
});
