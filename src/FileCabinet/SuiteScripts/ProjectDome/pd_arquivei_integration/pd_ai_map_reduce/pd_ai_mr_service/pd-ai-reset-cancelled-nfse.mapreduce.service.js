/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/log',

        '../../pd_ai_service/pd-ai-nfse.service',
        '../../pd_ai_service/pd-ai-nfse-status.service'
    ],
    function (
        log,

        nfse_service,
        nfse_status_service
    ) {
        // Correção de execução única: devolve para "Recebida" todas as NFS-e marcadas como
        // "Cancelada", para que o MR de canceladas reprocesse os eventos com o ID correto.
        function getInputData() {
            const _mapByCode = getStatusMap();

            return nfse_service.getByStatusQuery(_mapByCode.cancelled.id);
        }

        function map(context) {
            const _recordId = JSON.parse(context.value).values[0];
            const _mapByCode = getStatusMap();

            nfse_service.setStatus({
                recordId: _recordId,
                statusId: _mapByCode.received.id
            });

            context.write({ key: 'updated', value: _recordId });
        }

        function summarize(summary) {
            let _updated = 0;

            summary.output.iterator().each(function () {
                _updated++;
                return true;
            });

            log.audit({ title: 'NFS-e revertidas para Recebida', details: _updated });

            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error({ title: 'Erro na NFS-e ' + key, details: error });
                return true;
            });
        }

        function getStatusMap() {
            return nfse_status_service.mapByCode(nfse_status_service.getAll());
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    }
);
