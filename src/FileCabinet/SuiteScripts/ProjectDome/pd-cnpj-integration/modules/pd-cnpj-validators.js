/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Vinicius Betim - Dome
 */
define([], function () {

    /**
     * @param  {string} cnpj
     * @returns {boolean}
     */
    function validateCNPJ(cnpj) {
        cnpj = cnpj.replace(/\D/g, '');
        if (cnpj.length !== 14) return false;
        if (/^(\d)\1+$/.test(cnpj)) return false;

        var tamanho, numeros, digitos, soma, pos, i, resultado;

        tamanho = 12;
        numeros = cnpj.substring(0, tamanho);
        digitos = cnpj.substring(tamanho);
        soma    = 0;
        pos     = tamanho - 7;

        for (i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

        tamanho = 13;
        numeros = cnpj.substring(0, tamanho);
        soma    = 0;
        pos     = tamanho - 7;

        for (i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2) pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

        return true;
    }

    /**
     * @param  {string} cpf
     * @returns {boolean}
     */
    function validateCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cpf)) return false;

        var i, soma, resto;

        soma = 0;
        for (i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i), 10) * (10 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(9), 10)) return false;

        soma = 0;
        for (i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i), 10) * (11 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.charAt(10), 10)) return false;

        return true;
    }

    /**
     * @param  {string} email
     * @returns {boolean}
     */
    function validateEmail(email) {
        var regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        return regex.test(email.trim());
    }

    /**
     * @param  {string} emailsTxt
     * @returns {{ valid: string[], invalid: string[] }}
     */
    function splitAndValidateEmails(emailsTxt) {
        var normalized = emailsTxt.replace(/[;\s]+/g, ',');
        var parts      = normalized.split(',');
        var valid      = [];
        var invalid    = [];

        for (var i = 0; i < parts.length; i++) {
            var entry = parts[i].trim();
            if (!entry) continue;
            if (validateEmail(entry)) valid.push(entry);
            else                      invalid.push(entry);
        }

        return { valid: valid, invalid: invalid };
    }

    /**
     * @param  {Object} body - Parsed BrasilAPI CNPJ response
     * @returns {{ valid: boolean, title?: string, message?: string }}
     */
    function validateApiResponse(body) {
        var status = body.descricao_situacao_cadastral || '';
        if (status.toUpperCase() !== 'ATIVA') {
            return {
                valid:   false,
                title:   'CNPJ Status Warning',
                message: 'CNPJ ' + body.cnpj + ' is not active. Current status: ' + status
            };
        }
        return { valid: true };
    }

    return {
        validateCNPJ:           validateCNPJ,
        validateCPF:            validateCPF,
        validateEmail:          validateEmail,
        splitAndValidateEmails: splitAndValidateEmails,
        validateApiResponse:    validateApiResponse
    };
});
