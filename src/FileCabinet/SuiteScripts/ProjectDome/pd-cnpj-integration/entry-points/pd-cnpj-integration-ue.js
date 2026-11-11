/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author Vinicius Betim - Dome
 */
define([
    'N/ui/serverWidget',
    'N/runtime',
    '../modules/pd-cnpj-cts',
    '../modules/pd-cnpj-validators',
    '../modules/pd-cnpj-mapper',
    '../modules/pd-cnpj-api'
], function (serverWidget, runtime, cts, validators, mapper, cnpjApi) {

    /**
     * @param {Object} scriptContext
     */
    function beforeLoad(scriptContext) {
        var isUI           = runtime.executionContext === runtime.ContextType.USER_INTERFACE;
        var isCreateOrEdit = scriptContext.type === scriptContext.UserEventType.CREATE
                          || scriptContext.type === scriptContext.UserEventType.EDIT;

        if (isUI && isCreateOrEdit) {
            scriptContext.form.addButton({
                id:           cts.BUTTON.ID,
                label:        cts.BUTTON.LABEL,
                functionName: cts.BUTTON.FUNCTION
            });
            scriptContext.form.clientScriptModulePath = cts.SCRIPTS.CLIENT_SCRIPT_PATH;
        }
    }

    /**
     * @param {Object} scriptContext
     */
    function beforeSubmit(scriptContext) {
        if (scriptContext.type === scriptContext.UserEventType.CSVIMPORT) {
            _processCsvImport(scriptContext.newRecord);
        }
    }

    /**
     * @param {Record} newRecord
     */
    function _processCsvImport(newRecord) {
        var cnpj = newRecord.getValue({ fieldId: cts.ENTITY.FIELDS.CNPJ });
        if (!cnpj) return;

        var digits = cnpj.replace(/\D/g, '');
        if (digits.length !== 14 || !validators.validateCNPJ(cnpj)) {
            log.debug('pd-cnpj-integration-ue._processCsvImport', 'CNPJ "' + cnpj + '" is not a valid 14-digit CNPJ — skipping lookup.');
            return;
        }

        var response = cnpjApi.get(cnpj);
        if (response.code !== 200) {
            log.debug('pd-cnpj-integration-ue._processCsvImport', 'BrasilAPI lookup failed with status ' + response.code + ' — skipping.');
            return;
        }

        var body = JSON.parse(response.body);
        mapper.setFields(newRecord, body);
    }

    return {
        beforeLoad:   beforeLoad,
        beforeSubmit: beforeSubmit
    };
});
