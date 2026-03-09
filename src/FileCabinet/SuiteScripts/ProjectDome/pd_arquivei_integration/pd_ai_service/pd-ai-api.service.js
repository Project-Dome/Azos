/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        './pd-ai-api-request.service',
    ],
    function (
        api_request_service,
    ) {

        function getNFSe(options) {
            if (!options?.apiId || !options?.apiKey || !options?.cnpj)
                throw 'Invalid data API service - getNFSe';

           return api_request_service.get({
                path: '/nfse/received?cnpj[]=' + options.cnpj,
                next: options.next,
                apiId: options.apiId,
                apiKey: options.apiKey
            });
        }

        function getPDF(options) {
            if (!options?.NFSeId || !options?.apiId || !options?.apiKey)
                throw 'Invalid data API service - getPDF';

            return api_request_service.get({
                path: '/nfse/danfse/?id=' + options.NFSeId,
                apiId: options.apiId,
                apiKey: options.apiKey
            });
        }

        return {
            getPDF: getPDF,
            getNFSe: getNFSe,
        };
    }
);