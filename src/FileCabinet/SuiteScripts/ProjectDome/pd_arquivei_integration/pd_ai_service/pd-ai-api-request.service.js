/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Maria Vitoria
 */
define(
    [
        'N/log',
        'N/https'
    ],
    function (
        log,
        https
    ) {
        function buildHeaders(options) {
            const _headers = {
                "Content-Type": "application/json",
                "Accept": "*/*",
                "X-API-ID": options.apiId,
                "X-API-KEY": options.apiKey
            }
            return _headers;
        };

        function getBaseUrl() {
            return 'https://api.arquivei.com.br/v1' //'https://sandbox-api.arquivei.com.br/v1' 
        };

        function buildUrl(options) {
            var _baseUrl = getBaseUrl()
            if (options.next) {
                return options.next;
            } else {
                return _baseUrl + options.path;
            }
        };

        function getHandler(options) {
            const _url = buildUrl(options);
            const _headers = buildHeaders(options);

            log.audit({ title: 'Options', details: options });
            log.audit({ title: 'URL', details: _url });

            let _response = https.get({
                url: _url,
                headers: _headers
            });

            log.audit({ title: 'Response Body', details: _response.body });
            log.audit({ title: 'Response Code', details: _response.code });

            let _isSuccess = (
                _response.code >= 200
                && _response.code <= 299
            );

            if (_isSuccess) {
                if (options.parse == false) {
                    return _response.body;
                }

                return JSON.parse(_response.body);
            };

            throw _response.body;
        };

        return {
            get: getHandler
        };
    }
);