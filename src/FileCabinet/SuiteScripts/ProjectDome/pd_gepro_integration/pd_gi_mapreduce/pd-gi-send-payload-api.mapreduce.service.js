/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define([
    'N/search',
    'N/log',
    'N/file',
    'N/record',
    'N/https',
    'N/query'
], function (search, log, file, record, https, query) {

    const FOLDER_ID = 6340;
    const ENDPOINT_URL = 'https://api.gateway.azos.com.br/v1/sandbox/erp/movements';
    const API_KEY = 'rlCCY7pTaqQ2Lc6Ez0GyaJA49WtL345Gp0H6S9d1VbJ3oa82';

    function toISODate(dateStr) {
        if (!dateStr) return null;
        if (dateStr.indexOf('/') === -1) return dateStr;

        var parts = dateStr.split('/');
        if (parts.length !== 3) return null;

        var day = parts[0].padStart(2, '0');
        var month = parts[1].padStart(2, '0');
        var year = parts[2];

        return `${year}-${month}-${day}T00:00:00Z`;
    }

    function getInputData() {
        const transactionSearch = search.create({
            type: 'transaction',
            settings: [
                { name: 'consolidationtype', value: 'ACCTTYPE' },
                { name: 'includeperiodendtransactions', value: 'F' }
            ],
            filters: [
                ['mainline', 'any', ''],
                'AND',
                ['subsidiary', 'anyof', '3'],
                'AND',
                ['custbody_pd_integrated', 'is', 'F'],
                'AND',
                ['posting', 'is', 'T'] // Garante apenas transações contabilizadas
            ],
            columns: [
                'internalid',
                'recordtype',
                'externalid',
                'trandate',
                'datecreated',
                'account',
                search.createColumn({ name: 'number', join: 'account' }),
                'memomain',
                'memo',
                'debitamount',
                'creditamount',
                'custcolpd_ramo',
                'custcolpd_sistema_origem',
                'custcolpd_uf_risco',
                'custcolpd_cd_susep',
                'custcolpd_cd_produto',
                'custcol_plano',
                'custcol_ressegurador'
            ]
        });

        const rows = [];

        transactionSearch.run().each(function (r) {
            rows.push({
                transactionId: r.getValue('internalid'),
                recordType: r.getValue('recordtype'),
                externalId: r.getValue('externalid'),
                trandate: toISODate(r.getValue('trandate')),
                createdDate: r.getValue('datecreated'),
                accountId: r.getValue('account'),
                accountSusep: r.getValue({ name: 'number', join: 'account' }),
                memoMain: r.getValue('memomain'),
                memoLine: r.getValue('memo'),
                debit: Number(r.getValue('debitamount')) || 0,
                credit: Number(r.getValue('creditamount')) || 0,
                ramo: r.getValue('custcolpd_ramo'),
                sistemaOrigem: r.getValue('custcolpd_sistema_origem'),
                ufRisco: r.getValue('custcolpd_uf_risco'),
                cdSusep: r.getValue('custcolpd_cd_susep'),
                cdProduto: r.getValue('custcolpd_cd_produto'),
                plano: r.getValue('custcol_plano'),
                ressegurador: r.getValue('custcol_ressegurador')
            });
            return true;
        });

        return rows;
    }

    function map(context) {
        const row = JSON.parse(context.value);
        context.write({
            key: row.transactionId,
            value: row
        });
    }

    function reduce(context) {
        const rows = context.values.map(JSON.parse);

        const payload = {
            transactionId: context.key,
            recordType: rows[0].recordType,
            externalId: rows[0].externalId || null,
            trandate: rows[0].trandate,
            lines: rows.map(r => ({
                accountId: r.accountId,
                createdDate: r.createdDate,
                transactionId: r.transactionId,
                accountSusep: r.accountSusep,
                memoMain: r.memoMain,
                memoLine: r.memoLine,
                debit: r.debit,
                credit: r.credit,
                saldoInicial: 0,
                saldoFinal: 0,
                ramo: r.ramo,
                sistemaOrigem: r.sistemaOrigem,
                ufRisco: r.ufRisco,
                cdSusep: r.cdSusep,
                cdProduto: r.cdProduto,
                plano: r.plano,
                ressegurador: r.ressegurador
            }))
        };

        context.write({
            key: context.key,
            value: JSON.stringify(payload)
        });
    }

    function getInitialBalances(accountIds, minTrandateISO, minTxId) {
        if (!accountIds || accountIds.length === 0) return {};

        const accountList = accountIds.join(',');
        
        const cutDateStr = minTrandateISO.split('T')[0];

        const sql = `
            SELECT 
                TransactionAccountingLine.Account as account_id,
                SUM(NVL(TransactionAccountingLine.debit, 0)) - SUM(NVL(TransactionAccountingLine.credit, 0)) as initial_balance
            FROM 
                TransactionAccountingLine
            INNER JOIN 
                Transaction ON Transaction.ID = TransactionAccountingLine.Transaction
            WHERE 
                TransactionAccountingLine.Account IN (${accountList})
                AND Transaction.posting = 'T'
                AND (
                    Transaction.trandate < TO_DATE(?, 'YYYY-MM-DD')
                    OR (Transaction.trandate = TO_DATE(?, 'YYYY-MM-DD') AND Transaction.id < ?)
                )
            GROUP BY 
                TransactionAccountingLine.Account
        `;

        const balances = {};

        try {
            const result = query.runSuiteQL({
                query: sql,
                params: [cutDateStr, cutDateStr, minTxId]
            }).asMappedResults();

            result.forEach(row => {
                balances[row.account_id] = Number(row.initial_balance) || 0;
            });
        } catch (e) {
            log.error('ERRO SUITEQL SALDO INICIAL', e);
        }

        return balances;
    }

    function summarize(summary) {
        const transactions = [];
        const allLines = [];
        const accountIdsSet = new Set();
        let minTrandateISO = '9999-12-31T00:00:00Z';
        let minTxId = Infinity;

        summary.output.iterator().each(function (key, value) {
            const trx = JSON.parse(value);
            transactions.push(trx);

            trx.lines.forEach(line => {
                allLines.push(line);
                if (line.accountId) accountIdsSet.add(line.accountId);

                const currentTxId = Number(line.transactionId);
                
                if (trx.trandate < minTrandateISO) {
                    minTrandateISO = trx.trandate;
                    minTxId = currentTxId;
                } else if (trx.trandate === minTrandateISO && currentTxId < minTxId) {
                    minTxId = currentTxId;
                }
            });
            return true;
        });

        if (!transactions.length) return;

        log.audit('CORTE CONTÁBIL DEFINIDO', { minTrandateISO, minTxId });

        const accountIdsArray = Array.from(accountIdsSet);
        const initialBalances = getInitialBalances(accountIdsArray, minTrandateISO, minTxId);

        // A ordenação aqui precisa espelhar exatamente a query do banco (Trandate > ID > CreateDate)
        allLines.sort((a, b) => {
            if (a.accountSusep !== b.accountSusep) return (a.accountSusep || '').localeCompare(b.accountSusep || '');
            if (a.trandate !== b.trandate) return a.trandate.localeCompare(b.trandate);
            if (Number(a.transactionId) !== Number(b.transactionId)) return Number(a.transactionId) - Number(b.transactionId); // Desempata por ID
            return new Date(a.createdDate) - new Date(b.createdDate); // Último recurso
        });

        const runningBalances = { ...initialBalances };

        allLines.forEach(line => {
            const accountId = line.accountId;
            const currentBalance = runningBalances[accountId] || 0;

            line.saldoInicial = parseFloat(currentBalance.toFixed(2));
            line.saldoFinal = parseFloat((currentBalance + line.debit - line.credit).toFixed(2));

            runningBalances[accountId] = line.saldoFinal;

            // Limpeza de campos auxiliares
            delete line.accountId;
            delete line.createdDate;
            delete line.transactionId;
        });

        const batchId = `${Date.now()}`;
        const finalPayload = {
            batchId: batchId,
            generatedAt: new Date().toISOString(),
            totalTransactions: transactions.length,
            transactions: transactions
        };

        const fileName = `payload_gepro_full_${batchId}.json`;
        const payloadFile = file.create({
            name: fileName,
            fileType: file.Type.JSON,
            contents: JSON.stringify(finalPayload, null, 2),
            folder: FOLDER_ID
        });

        payloadFile.save();

        let response;
        try {
            response = https.post({
                url: ENDPOINT_URL,
                body: JSON.stringify(finalPayload),
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY
                }
            });
        } catch (e) {
            log.error('AZOS REQUEST ERROR', e);
            return;
        }

        if (response.code !== 200 && response.code !== 201) {
            log.error('AZOS INTEGRATION FAILED', { status: response.code, body: response.body });
            return;
        }

        transactions.forEach(function (trx) {
            try {
                record.submitFields({
                    type: trx.recordType,
                    id: trx.transactionId,
                    values: { custbody_pd_integrated: true },
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });
            } catch (e) {
                log.error('FLAG UPDATE ERROR', { transactionId: trx.transactionId, error: e });
            }
        });
    }

    return {
        getInputData,
        map,
        reduce,
        summarize
    };
});