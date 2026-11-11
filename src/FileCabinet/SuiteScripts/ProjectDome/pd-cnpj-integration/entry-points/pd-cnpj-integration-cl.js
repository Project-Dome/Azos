/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @author Vinicius Betim - Dome
 */
define([
    '../modules/pd-cnpj-cts',
    '../modules/pd-cnpj-validators',
    '../modules/pd-cnpj-mapper',
    '../modules/pd-cnpj-api',
    'N/ui/dialog',
    'N/currentRecord'
], function (cts, validators, mapper, cnpjApi, dialog, currentRecord) {

    var _lastFetchedDigits = null;

    function pageInit(scriptContext) {
    }

    /**
     * @param   {Object} scriptContext
     * @returns {boolean} false clears the field and blocks save
     */
    function validateField(scriptContext) {
        var fieldId = scriptContext.fieldId;
        var record  = scriptContext.currentRecord;
        var value   = record.getValue({ fieldId: fieldId });

        if (!value) return true;

        if (fieldId === cts.ENTITY.FIELDS.CNPJ) {
            var digits = value.replace(/\D/g, '');

            if (digits.length === 14) {
                if (!validators.validateCNPJ(value)) {
                    dialog.alert({ title: 'Invalid CNPJ', message: 'The CNPJ "' + value + '" is invalid.' });
                    record.setValue({ fieldId: fieldId, value: '' });
                    return false;
                }
            } else if (digits.length === 11) {
                if (!validators.validateCPF(value)) {
                    dialog.alert({ title: 'Invalid CPF', message: 'The CPF "' + value + '" is invalid.' });
                    record.setValue({ fieldId: fieldId, value: '' });
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @param {Object} scriptContext
     */
    function fieldChanged(scriptContext) {
        if (scriptContext.fieldId !== cts.ENTITY.FIELDS.CNPJ) return;

        var record = scriptContext.currentRecord;
        var value  = record.getValue({ fieldId: cts.ENTITY.FIELDS.CNPJ });
        if (!value) return;

        var digits = value.replace(/\D/g, '');
        if (digits.length !== 14) return;
        if (!validators.validateCNPJ(value)) return;
        if (digits === _lastFetchedDigits) return;

        fetchCNPJ();
    }

    function fetchCNPJ() {
        var rec  = currentRecord.get();
        var cnpj = rec.getValue({ fieldId: cts.ENTITY.FIELDS.CNPJ });

        if (!cnpj) {
            dialog.alert({ title: 'Fetch CNPJ Data', message: 'Please fill in the CNPJ field first.' });
            return;
        }

        var response = cnpjApi.get(cnpj);

        if (response.code === 200) {
            var body       = JSON.parse(response.body);
            var validation = validators.validateApiResponse(body);
            if (!validation.valid) {
                dialog.alert({ title: validation.title, message: validation.message });
            }
            mapper.setFields(rec, body);
            _lastFetchedDigits = cnpj.replace(/\D/g, '');
        } else {
            dialog.alert({
                title:   'Erro ao consultar CNPJ',
                message: 'Não foi possível recuperar os dados da empresa. Verifique se o CNPJ está correto e tente novamente.'
            });
        }
    }

    return {
        pageInit:      pageInit,
        validateField: validateField,
        fieldChanged:  fieldChanged,
        fetchCNPJ:     fetchCNPJ
    };
});
