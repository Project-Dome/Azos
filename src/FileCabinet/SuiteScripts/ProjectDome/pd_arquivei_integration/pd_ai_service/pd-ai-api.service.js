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
            if (!options?.apiId || !options?.apiKey || !options?.cnpj && !options?.id)
                throw 'Invalid data API service - getNFSe';

            const filter = !isNullOrEmpty(options?.cnpj) ?
                'cnpj[]=' + options.cnpj :
                'id[]=' + options?.id

            log.audit({
                title: "api",
                details: {
                    path: '/nfse/received?' + filter,
                    next: options.next,
                    apiId: options.apiId,
                    apiKey: options.apiKey
                }
            })

            return api_request_service.get({
                path: '/nfse/received?' + filter,
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

        function getNFSeCanceled(options) {
            if (!options?.apiId || !options?.apiKey)
                throw 'Invalid data API service - getNFSeCanceled';

            return api_request_service.get({
                path: '/nfse/events?type[]=101101',
                next: options.next,
                apiId: options.apiId,
                apiKey: options.apiKey
            });
        }

        return {
            getPDF: getPDF,
            getNFSe: getNFSe,
            getNFSeCanceled: getNFSeCanceled
        };
    }
);