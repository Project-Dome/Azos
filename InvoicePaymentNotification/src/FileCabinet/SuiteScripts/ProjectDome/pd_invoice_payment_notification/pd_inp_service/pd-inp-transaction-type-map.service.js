/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define([], function() {

    const TRANSACTION_TYPE_MAP = {
        "REFUND": 1,
        // TODO: VER OS OUTROS TIPOS DE TRANSAÇÃO COM A FRAN
    };

    function getCode(label) {
        return TRANSACTION_TYPE_MAP[label] || label;
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
