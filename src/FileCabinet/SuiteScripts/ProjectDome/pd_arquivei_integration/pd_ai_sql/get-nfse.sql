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
    AND TRUNC(nfse.custrecord_pd_ai_nfse_issue_date) >= TO_DATE('31/10/2025', 'DD/MM/YYYY')
    AND TRUNC(nfse.custrecord_pd_ai_nfse_issue_date) <= TO_DATE('31/10/2025', 'DD/MM/YYYY')
    AND nfse.custrecord_pd_ai_nfse_cnpj = '19427033000140'
    AND nfse.custrecord_pd_ai_nfse_taker_cnpj = '39520039000175'
    AND nfse.custrecord_pd_ai_nfse_number = '543049'
    AND v.category = 4
ORDER BY
    nfse.custrecord_pd_ai_nfse_issue_date DESC;