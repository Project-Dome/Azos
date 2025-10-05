/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
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
        const BASE_URL = 'https://api.gateway.azos.com.br';

        const HEADERS = {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey // TODO: ver de onde virá a apikey
        }

        function sendComissions(data) {
            const commissionsApiPath = 'v2/plataform/commissions/webhook';
            const path = `${BASE_URL}${commissionsApiPath}`;
            log.audit('POST', path);
            https.post({
                url: `${BASE_URL}/${commissionsApiPath}`,
                headers: HEADERS,
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        }

        function sendRefund(data) {
            const refundApiPath = '/v1/erp/webhooks/refund';
            const path = `${BASE_URL}${refundApiPath}`;
            log.audit('POST', path);
            https.post({
                url: path,
                headers: HEADERS,
                body: JSON.stringify(data),
            });

            return handleResponse(response);
        }

        function handleResponse(response) {
            response.body = JSON.parse(response.body);
            log.audit('Response Body', response.body);
            if (response.code >= 200 && response.code < 300) 
                return { success: true, data: response.body };
            
            return { success: false, error: response.body };
        }

        return {
            sendRefund: sendRefund,
            sendComissions: sendComissions
        }
    }
)