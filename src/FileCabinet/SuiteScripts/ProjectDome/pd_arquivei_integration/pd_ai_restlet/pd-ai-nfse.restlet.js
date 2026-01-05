/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/log',
        'N/query',
        'N/url',

        '../pd_ai_service/pd-ai-subsidiary.service.js',
    ],
    function (
        log,
        query,
        url,

        subsidiary_service
    ) {
        function getHandler(parameters) {
            return getNfse(parameters);
        }

        const DEFAULT_PAGE_SIZE = 200;

        function getNfse(parameters) {
            log.audit({ title: 'parameters', details: parameters });
            
            parameters.page = ifNullOrEmpty(parameters?.page, 1);

            let NFSEQuery = `
                    SELECT
                        nfse.id AS internalId,
                        TO_CHAR(
                            nfse.custrecord_pd_ai_nfse_issue_date,
                            'YYYY-MM-DD'
                        ) AS issueDateIso,
                        nfse.custrecord_pd_ai_nfse_corporate_name AS corporateName,
                        nfse.custrecord_pd_ai_nfse_fantasy_name AS fantasyName,
                        nfse.custrecord_pd_ai_nfse_cnpj AS vendorCnpj,
                        nfse.custrecord_pd_ai_nfse_taker_cnpj AS takerCnpj,
                        nfse.custrecord_pd_ai_nfse_amount AS amount,
                        nfse.custrecord_pd_ai_nfse_number AS docNumber,
                        nfse.custrecord_pd_ai_nfse_service_code AS serviceCode,
                        nfse.custrecord_pd_ai_nfse_issue_date AS issueDate,
                        nfse.custrecord_pd_ai_nfse_provider AS providerId,
                        nfse.isinactive AS isInactive,
                        v.category AS providerCategory
                    From
                        customrecord_pd_ai_nfse as nfse
                        LEFT JOIN customrecord_pd_ai_nfse_conciliation AS nc_nfse ON nfse.id = nc_nfse.custrecord_pd_ai_nc_nfse
                        LEFT JOIN vendor AS v ON nfse.custrecord_pd_ai_nfse_provider = v.id
                    where
                        nc_nfse.custrecord_pd_ai_nc_nfse IS NULL
                        AND nfse.isinactive = 'F' `;

            if (!isNullOrEmpty(parameters.startDate))
                NFSEQuery += ` AND TRUNC(nfse.custrecord_pd_ai_nfse_issue_date) >= TO_DATE('${parameters.startDate}', 'DD/MM/YYYY') `;

            if (!isNullOrEmpty(parameters.endDate))
                NFSEQuery += ` AND TRUNC(nfse.custrecord_pd_ai_nfse_issue_date) <= TO_DATE('${parameters.endDate}', 'DD/MM/YYYY') `;

            if (!isNullOrEmpty(parameters.vendorCnpj))
                NFSEQuery += ` AND nfse.custrecord_pd_ai_nfse_cnpj = ${parameters.vendorCnpj.replace(/[^a-zA-Z0-9]/g, "")} `;

            if (!isNullOrEmpty(parameters.subsidiary))
                NFSEQuery += ` AND nfse.custrecord_pd_ai_nfse_taker_cnpj = ${subsidiary_service.getById(parameters.subsidiary).cnpj?.replace(/[^a-zA-Z0-9]/g, "") || 0} `;

            if (!isNullOrEmpty(parameters.docNumber))
                NFSEQuery += ` AND nfse.custrecord_pd_ai_nfse_number = ${parameters.docNumber} `;

            if (!isNullOrEmpty(parameters.vendorCategory))
                NFSEQuery += ` AND v.category = ${parameters.vendorCategory}`;

            NFSEQuery += `
                ORDER BY
                    nfse.custrecord_pd_ai_nfse_issue_date DESC`;

            log.audit({ title: 'NFSEQuery', details: NFSEQuery });

            const _paged = query.runSuiteQLPaged({
                query: NFSEQuery,
                pageSize: DEFAULT_PAGE_SIZE
            });
            log.audit({ title: '_paged', details: _paged });

            if (_paged.count == 0) return []

            const _page = _paged.fetch({ index: parameters.page - 1 });
            log.audit({ title: '_page', details: _page });

            const _data = _page.data.asMappedResults();
            let _pageNumber = _paged.count / DEFAULT_PAGE_SIZE;

            return {
                count: _paged.count,
                page: {
                    count: _pageNumber - Math.floor(_pageNumber) < 0.5 ? _pageNumber.round(0) + 1 : _pageNumber.round(0),
                    number: parameters.page,
                    isLast: _page.isLast,
                    isFirst: _page.isFirst,
                    data: _data
                }
            };
        }

        return {
            get: getHandler
        }
    }
)
