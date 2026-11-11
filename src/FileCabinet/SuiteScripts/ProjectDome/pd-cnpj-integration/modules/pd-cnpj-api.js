/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Vinicius Betim Dome
 */
define(['N/https', './pd-cnpj-cts'], function (https, cts) {

    /**
     * Fetches company data from BrasilAPI by CNPJ.
     * @param  {string} cnpj - Raw CNPJ (digits only or formatted)
     * @returns {Object}      - N/https ClientResponse
     */
    function get(cnpj) {
        try {
            var digits   = cnpj.replace(/\D/g, '');
            var url      = cts.API.CNPJ_BASE_URL + digits;

            log.debug('pd-cnpj-api.get | request', url);

            var response = https.get({
                url:     url,
                headers: { 'Accept': 'application/json' }
            });

            log.debug('pd-cnpj-api.get | status', response.code);
            log.debug('pd-cnpj-api.get | body',   response.body);

            return response;
        } catch (e) {
            log.error('pd-cnpj-api.get', e);
            throw e;
        }
    }

    return { get: get };
});