/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/log',

        '../pd_ai_service/pd-ai-vendor.service',
    ],
    function (
        log,
        vendor_service
    ) {

        function getHandler(parameters) {
            const vendor = vendor_service.getByCNPJ(formatCNPJ(parameters.vendorCNPJ));
            log.audit({ title: 'Fornecedor Data', details: vendor });

            if (!vendor) {
                log.error({ title: 'Não foi possível localizar o fornecedor correspondente.', details: parameters.vendorCNPJ });

                throw (`Não foi possível localizar um fornecedor cadastrado com o CNPJ ${formatCNPJ(parameters.vendorCNPJ)}`);
            }

            return vendor;
        }

        function formatCNPJ(cnpj) {
            cnpj = cnpj.replace(/\D/g, '');

            cnpj = cnpj.replace(/^(\d{2})(\d)/, '$1.$2');
            cnpj = cnpj.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            cnpj = cnpj.replace(/\.(\d{3})(\d)/, '.$1/$2');
            cnpj = cnpj.replace(/(\d{4})(\d)/, '$1-$2');

            return String(cnpj);
        };

        return {
            get: getHandler
        }
    }
)
