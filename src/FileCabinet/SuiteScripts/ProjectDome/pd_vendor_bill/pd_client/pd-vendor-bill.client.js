/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @author Project Dome - Joõa Lima Neves
 */
define(
    [
        'N/ui/dialog'
    ],
    function (
        dialog
    ) {

        function saveRecord(context) {
            var currentRecord = context.currentRecord;

            var sublistId = 'installment';
            var fieldTipoPagamento = 'custrecord_brl_inst_l_type_payment';
            var fieldTipoServico = 'custrecord_brl_inst_l_type_service';

            try {
                var lineCount = currentRecord.getLineCount({ sublistId: sublistId });

                if (lineCount === 0) {
                    return true;
                }

                for (var i = 0; i < lineCount; i++) {
                    var tipoPagamento = currentRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: fieldTipoPagamento,
                        line: i
                    });

                    var tipoServico = currentRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: fieldTipoServico,
                        line: i
                    });

                    if (!tipoPagamento || !tipoServico) {
                        dialog.alert({
                            title: 'Atenção: Campos de CNAB Obrigatórios',
                            message: 'Por favor, preencha os campos "Tipo de pagamento para CNAB" e "Tipo de serviço para CNAB" na prestação ' + (i + 1) + ' antes de salvar.'
                        });

                        return false;
                    }
                }

                return true;

            } catch (e) {
                console.error('Erro na validação do CNAB: ', e.message);
                return true;
            }
        }

        return {
            saveRecord: saveRecord
        };

    });