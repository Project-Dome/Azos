/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Vinicius Betim - Dome
 */
define(['N/https', './pd-cnpj-cts'], function (https, cts) {

    /**
     * @param  {string} cep - Raw CEP (digits only or formatted)
     * @returns {Object|null} Parsed address object, or null on error/not found
     */
    function get(cep) {
        try {
            var digits   = cep.replace(/\D/g, '');
            var response = https.get({
                url:     cts.API.CEP_BASE_URL + digits,
                headers: { 'Accept': 'application/json' }
            });
            log.debug('pd-cep-api | status', response.code);
            log.debug('pd-cep-api | body', response.body);

            if (response.code !== 200) {
                log.error('pd-cep-api.get', 'HTTP ' + response.code + ' for CEP ' + digits);
                return null;
            }

            return JSON.parse(response.body);
        } catch (e) {
            log.error('pd-cep-api.get', e);
            return null;
        }
    }

    return { get: get };
});
