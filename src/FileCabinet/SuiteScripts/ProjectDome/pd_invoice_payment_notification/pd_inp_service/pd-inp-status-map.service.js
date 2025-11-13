/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define([], function() {

    const STATUS_MAP = {
        "PENDENTE": 1,
        "ENVIADO": 2,
        "CANCELADO": 3,
        "ERRO": 5
    };

    function getCode(label) {
        if (!STATUS_MAP.hasOwnProperty(label)) throw new Error(`Status label "${label}" not found in STATUS_MAP.`);

        return STATUS_MAP[label];
    }

    function getLabel(code) {
        const entry = Object.entries(STATUS_MAP).find(([key, val]) => val === code);
        return entry ? entry[0] : code;
    }

    return {
        getCode,
        getLabel
    };
});
