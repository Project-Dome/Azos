/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @author Project Dome - Mário Augusto Braga Costa
 * @description Consolida as ocorrências de fornecedor não cadastrado da fila e envia um único e-mail por ciclo
 */
define(
    [
        'N/log',
        'N/email',
        'N/runtime',

        '../pd_ai_service/pd-ai-configuration.service',
        '../pd_ai_service/pd-ai-vendor-alert-queue.service',
        '../pd_ai_service/pd-ai-employee.service',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        log,
        email,
        runtime,

        configuration_service,
        vendor_alert_queue_service,
        employee_service
    ) {
        // Internal IDs dos valores de customlist_pd_ai_vendor_alert_freq -> intervalo em dias.
        // Só são conhecidos depois do primeiro deploy da lista e PODEM DIFERIR entre sandbox e
        // produção: conferir em Personalização > Listas > Frequência Alerta Fornecedor por ambiente.
        const FREQUENCY_INTERVAL_DAYS = {
            '1': 1,     // Diária
            '2': 7,     // Semanal
            '3': 30     // Mensal (30 dias corridos, não "mesmo dia do mês seguinte")
        };

        const MAX_RECIPIENTS_PER_EMAIL = 100;
        const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

        function execute() {
            try {
                const _configuration = configuration_service.get();
                if (!_configuration) {
                    log.audit({ title: 'Vendor Alert', details: 'Nenhum registro de configuração ativo.' });
                    return;
                }

                if (!_configuration.vendorAlertRecipients.length || !_configuration.vendorAlertFrequency) {
                    log.audit({ title: 'Vendor Alert', details: 'Alerta desligado (sem destinatário ou sem frequência).' });
                    return;
                }

                const _intervalDays = FREQUENCY_INTERVAL_DAYS[_configuration.vendorAlertFrequency];
                if (!_intervalDays) {
                    log.error({
                        title: 'Vendor Alert',
                        details: 'Frequência sem mapeamento de internal ID: ' + _configuration.vendorAlertFrequency
                    });
                    return;
                }

                const _today = new Date();
                if (!isIntervalElapsed(_configuration.vendorAlertLastSent, _today, _intervalDays)) {
                    log.audit({ title: 'Vendor Alert', details: 'Intervalo da frequência ainda não decorrido.' });
                    return;
                }

                // Fila vazia não envia nem atualiza a data: a próxima ocorrência dispara o envio
                // na execução seguinte, sem esperar um ciclo cheio
                const _pendingList = vendor_alert_queue_service.getPending();
                if (!_pendingList.length) {
                    log.audit({ title: 'Vendor Alert', details: 'Fila sem ocorrências pendentes.' });
                    return;
                }

                const _recipientEmails = resolveEmployeeEmails(_configuration.vendorAlertRecipients);
                if (!_recipientEmails.length) {
                    log.error({ title: 'Vendor Alert', details: 'Nenhum destinatário selecionado possui e-mail cadastrado.' });
                    return;
                }

                const _author = ifNullOrEmpty(_configuration.vendorAlertSender, runtime.getCurrentUser().id);


                sendEmail({
                    author: _author,
                    recipients: _recipientEmails,
                    subject: buildSubject(),
                    body: buildBody(_pendingList)
                });

                _pendingList.forEach(function (pending) {
                    vendor_alert_queue_service.markAsReported(pending.id);
                });

                configuration_service.setVendorAlertLastSent({
                    recordId: _configuration.id,
                    date: _today
                });

                log.audit({ title: 'Vendor Alert', details: 'E-mail enviado com ' + _pendingList.length + ' ocorrência(s).' });

            } catch (error) {
                log.error({ title: 'Error Vendor Alert', details: error });
            }
        };

        // Sem data de último envio (primeira execução) conta como intervalo já decorrido
        function isIntervalElapsed(lastSent, today, intervalDays) {
            if (!lastSent) return true;

            const _elapsedDays = Math.floor(
                (toDateOnly(today).getTime() - toDateOnly(lastSent).getTime()) / MILLISECONDS_PER_DAY
            );

            return _elapsedDays >= intervalDays;
        };

        function toDateOnly(date) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        };

        function resolveEmployeeEmails(employeeIds) {
            return employeeIds
                .map(function (employeeId) {
                    return employee_service.getEmailById(employeeId);
                })
                .filter(function (employeeEmail) {
                    return !isNullOrEmpty(employeeEmail);
                });
        };

        // N/email aceita no máximo 10 destinatários por envio
        function sendEmail(options) {

            log.audit('dataEmeail', options)

            for (let i = 0; i < options.recipients.length; i += MAX_RECIPIENTS_PER_EMAIL) {
                email.send({
                    author: options.author,
                    recipients: options.recipients.slice(i, i + MAX_RECIPIENTS_PER_EMAIL),
                    subject: options.subject,
                    body: options.body
                });
            }
        };

        function buildSubject() {
            return 'Fornecedores não cadastrados no NetSuite';
        };

        function buildBody(pendingList) {
            const _lines = pendingList.map(function (pending) {
                return '- Fornecedor: ' + escapeHtml(ifNullOrEmpty(pending.vendorName, '(não informado)')) +
                    ' | CNPJ: ' + escapeHtml(pending.cnpj) +
                    ' | NFS-e: ' + escapeHtml(pending.number);
            });

            return [
                'Olá,',
                '',
                'As NFS-e abaixo foram importadas da Arquivei, mas o fornecedor (CNPJ) não foi encontrado no NetSuite:',
                '',
                _lines.join('<br/>'),
                '',
                ' Cadastre os fornecedores para que as notas possam ser conciliadas.',
                '',
                'E-mail automático da integração Arquivei — não responda.'
            ].join('<br/>');
        };

        function escapeHtml(value) {
            return String(ifNullOrEmpty(value, ''))
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        return {
            execute: execute
        };
    }
);