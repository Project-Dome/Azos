/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Roque Costa
 */

define(
    [
        'N/log',
        'N/https',
        'N/runtime',
    ],
    function (
        log,
        https,
        runtime
    ) {

        const BASE_URL = 'https://api.gateway.azos.com.br';

        /* ===============================
         * COMMISSIONS
         * =============================== */
        function sendComissions(data) {

            const apiPath = 'v1/erp/commissions';
            const path = `${BASE_URL}/${apiPath}`;

            log.audit('POST', path);
            log.audit('body', data);

            const response = https.post({
                url: path,
                headers: buildHeaders(),
                body: JSON.stringify(data),
            });

            return handleResponse(data, response);
        }

        function sendSinistro(data) {

            const apiPath = 'v1/erp/claim-payments';
            const path = `${BASE_URL}/${apiPath}`;

            log.audit('POST', path);
            log.audit('body', data);

            const response = https.post({
                url: path,
                headers: buildHeaders(),
                body: JSON.stringify(data),
            });

            return handleResponse(data, response);
        }

        /* ===============================
         * REFUND
         * =============================== */
        function sendRefund(data) {

            const apiPath = 'v1/erp/webhooks/refund';
            const path = `${BASE_URL}/${apiPath}`;

            log.audit('POST', path);
            log.audit('body', data);

            const response = https.post({
                url: path,
                headers: buildHeaders(),
                body: JSON.stringify(data),
            });

            return handleResponse(data, response);
        }

        /* ===============================
         * HANDLER
         * =============================== */
        function handleResponse(requestBody, response) {

            let responseBody = {};
            try {
                responseBody = JSON.parse(response.body);
            } catch (e) {
                responseBody = response.body;
            }

            log.audit('Response Body', responseBody);

            if (response.code >= 200 && response.code < 300) {
                return {
                    success: true,
                    requestBody: requestBody,
                    data: responseBody
                };
            }

            return {
                success: false,
                requestBody: requestBody,
                error: responseBody
            };
        }

        /* ===============================
         * HEADERS
         * =============================== */
        function buildHeaders() {
            return {
                'Content-Type': 'application/json',
                'x-api-key': runtime.getCurrentScript().getParameter({
                    name: 'custscript_pd_inp_azos_api_key'
                })
            };
        }

        return {
            sendComissions: sendComissions,
            sendSinistro: sendSinistro,
            sendRefund: sendRefund
        };
    }
);