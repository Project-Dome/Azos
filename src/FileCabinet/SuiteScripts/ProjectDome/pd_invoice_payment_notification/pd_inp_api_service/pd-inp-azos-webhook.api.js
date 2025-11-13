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
            'x-api-key': 'rlCCY7pTaqQ2Lc6Ez0GyaJA49WtL345Gp0H6S9d1VbJ3oa82'
        }

        function sendComissions(data) {
            const commissionsApiPath = 'v1/erp/commissions';
            const path = `${BASE_URL}/${commissionsApiPath}`;
            log.audit('POST', path);
            log.audit('body', data);
            const response = https.post({
                url: `${BASE_URL}/${commissionsApiPath}`,
                headers: HEADERS,
                body: JSON.stringify(data),
            });
            return handleResponse(data, response);
        }

        function sendRefund(data) {
            const refundApiPath = 'v1/erp/webhooks/refund';
            const path = `${BASE_URL}/${refundApiPath}`;
            log.audit('POST', path);
            log.audit('body', data);
            const response = https.post({
                url: path,
                headers: HEADERS,
                body: JSON.stringify(data),
            });

            return handleResponse(data, response);
        }

        function handleResponse(requestBody, response) {
            const responseBody = JSON.parse(response.body);
            log.audit('Response Body', responseBody);
            if (response.code >= 200 && response.code < 300) 
                return { success: true, requestBody: requestBody, data: responseBody };
            
            return { success: false, requestBody: requestBody, error: responseBody };
        }

        return {
            sendRefund: sendRefund,
            sendComissions: sendComissions
        }
    }
)