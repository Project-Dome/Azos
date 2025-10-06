/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define([], function() {

    const STATUS_MAP = {
        "PENDENTE": 1,
        "APROVADO": 2,
        "REJEITADO": 3,
        "ERRO": 4
    };

    function getCode(label) {
        return STATUS_MAP[label] || label;
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
