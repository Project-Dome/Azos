/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/log',

        '../../pd_ai_service/pd-ai-nfse.service',],
    function (
        log,

        nfse_service
    ) {
        const RESULT = {
            updated: 'updated',
            withoutFile: 'withoutFile'
        };

        // Correção de execução única: só retorna NFS-e cujo custrecord_pd_ai_nfse_id não bate com o
        // nome do XML vinculado, então pode ser reexecutado sem retrabalho.
        function getInputData() {
            return nfse_service.getWithInvalidNfseIdQuery();
        }

        function map(context) {
            // Colunas na ordem do SELECT: id, currentnfseid, xmlname, pdfname
            const _values = JSON.parse(context.value).values;
            const _recordId = _values[0];

            log.debug({ title: 'Map', details: 'Record ID: ' + _recordId + ', currentNfseId: ' + _values[1] + ', xmlName: ' + _values[2] + ', pdfName: ' + _values[3] });

            const _nfseId = nfse_service.getNfseIdFromFileNames({
                xmlName: _values[2],
                pdfName: _values[3]
            });

            if (!_nfseId) {
                context.write({ key: RESULT.withoutFile, value: _recordId });
                return;
            }

            if (_nfseId == _values[1]) return;

            nfse_service.setNfseId({ recordId: _recordId, nfseId: _nfseId });

            context.write({ key: RESULT.updated, value: _recordId });
        }

        function summarize(summary) {
            const _result = {};
            _result[RESULT.updated] = [];
            _result[RESULT.withoutFile] = [];

            summary.output.iterator().each(function (key, value) {
                _result[key].push(value);
                return true;
            });

            log.audit({ title: 'NFS-e atualizadas', details: _result[RESULT.updated].length });
            log.audit({ title: 'NFS-e sem arquivo para extrair o ID', details: _result[RESULT.withoutFile].join(', ') });

            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error({ title: 'Erro na NFS-e ' + key, details: error });
                return true;
            });
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    }
);
