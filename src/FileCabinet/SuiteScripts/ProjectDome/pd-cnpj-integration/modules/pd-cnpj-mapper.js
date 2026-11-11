/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Vinicius Betim - Dome
 */
define(['N/search', './pd-cnpj-cts', './pd-cep-api'], function (search, cts, cepApi) {

    /**
     * @param {Record} currentRecord
     * @param {Object} json - Parsed BrasilAPI response body
     */
    function setFields(currentRecord, json) {
        var hasLegalName = _fieldExists(currentRecord, cts.ENTITY.FIELDS.COMPANY_NAME);

        var wasTradeNameEmpty = !currentRecord.getValue({ fieldId: cts.ENTITY.FIELDS.TRADE_NAME });
        var wasCompanyNameEmpty = hasLegalName
            ? !currentRecord.getValue({ fieldId: cts.ENTITY.FIELDS.COMPANY_NAME })
            : null;

        if (json.nome_fantasia && hasLegalName && wasTradeNameEmpty) {
            currentRecord.setValue({ fieldId: cts.ENTITY.FIELDS.TRADE_NAME, value: json.nome_fantasia });
        }

        if (json.razao_social) {
            if (hasLegalName) {
                if (wasCompanyNameEmpty) {
                    currentRecord.setValue({ fieldId: cts.ENTITY.FIELDS.COMPANY_NAME, value: json.razao_social });
                }
            } else {
                if (wasTradeNameEmpty) {
                    currentRecord.setValue({ fieldId: cts.ENTITY.FIELDS.TRADE_NAME, value: json.razao_social });
                }
            }
        }

        if (json.ddd_telefone_1) _setIfEmpty(currentRecord, cts.ENTITY.FIELDS.PHONE,         _formatPhone(json.ddd_telefone_1));
        if (json.ddd_telefone_2) _setIfEmpty(currentRecord, cts.ENTITY.FIELDS.ALT_PHONE,      _formatPhone(json.ddd_telefone_2));
        if (json.ddd_fax)        _setIfEmpty(currentRecord, cts.ENTITY.FIELDS.FAX,            _formatPhone(json.ddd_fax));
        if (json.email)          _setIfEmpty(currentRecord, cts.ENTITY.FIELDS.EMAIL,          json.email);

        if (_fieldExists(currentRecord, cts.ENTITY.FIELDS.TAX_REGIME)) {
            var taxRegimeLabel = _resolveTaxRegimeLabel(json);
            if (taxRegimeLabel) {
                var taxRegimeId = _lookupRecordIdByName(cts.ENTITY.TAX_REGIME_LOOKUP.RECORD_TYPE, taxRegimeLabel);
                if (taxRegimeId) {
                    _setIfEmpty(currentRecord, cts.ENTITY.FIELDS.TAX_REGIME, taxRegimeId);
                } else {
                    log.debug('pd-cnpj-mapper.setFields', 'Could not resolve customrecord_fte_taxregime for label "' + taxRegimeLabel + '" — leaving Tax Regime blank.');
                }
            }
        } else {
            log.debug('pd-cnpj-mapper.setFields', 'Field ' + cts.ENTITY.FIELDS.TAX_REGIME + ' not present on this record/form — skipping tax regime mapping.');
        }

        if (json.qsa && json.qsa.length) {
            log.debug('pd-cnpj-mapper.setFields', json.qsa.length + ' socio(s) found in qsa — not mapped (would require a related custom record, out of scope for this product)');
        }

        insertAddress(currentRecord, json);
    }

    /**
     * @param {Record} currentRecord
     * @param {Object} json - Parsed BrasilAPI CNPJ response body
     */
    function insertAddress(currentRecord, json) {
        var sublistId   = cts.ENTITY.SUBLISTS.ADDRESS.ID;
        var subrecordId = cts.ENTITY.SUBLISTS.ADDRESS.SUBRECORD.ID;
        var f           = cts.ENTITY.SUBLISTS.ADDRESS.SUBRECORD.FIELDS;

        if (currentRecord.getLineCount({ sublistId: sublistId }) > 0) {
            log.debug('pd-cnpj-mapper.insertAddress', 'Addressbook already has at least one line — leaving existing addresses untouched.');
            return;
        }

        var cep = null;
        if (json.cep) cep = cepApi.get(json.cep);

        var isDynamic = currentRecord.isDynamic;
        var line;
        var subrecord;

        if (isDynamic) {
            currentRecord.selectNewLine({ sublistId: sublistId });
            subrecord = currentRecord.getCurrentSublistSubrecord({
                sublistId: sublistId,
                fieldId:   subrecordId
            });
        } else {
            line = currentRecord.getLineCount({ sublistId: sublistId });
            currentRecord.insertLine({ sublistId: sublistId, line: line });
            subrecord = currentRecord.getSublistSubrecord({
                sublistId: sublistId,
                fieldId:   subrecordId,
                line:      line
            });
        }

        if (json.cep) {
            subrecord.setValue({ fieldId: f.ZIP, value: json.cep.replace(/\D/g, '') });
        }

        var logradouro = (cep && cep.street)        ? cep.street        : json.logradouro;
        if (logradouro) subrecord.setValue({ fieldId: f.ADDR1, value: _normalize(logradouro) });

        if (json.numero) subrecord.setValue({ fieldId: f.ADDR3, value: json.numero });

        var bairro = (cep && cep.neighborhood) ? cep.neighborhood : json.bairro;
        if (bairro) subrecord.setValue({ fieldId: f.ADDR2, value: _normalize(bairro) });

        if (json.complemento) subrecord.setValue({ fieldId: f.COMPLEMENT, value: _normalize(json.complemento) });

        var uf = (cep && cep.state) ? cep.state : json.uf;
        if (uf) subrecord.setValue({ fieldId: f.STATE, value: uf });

        if (json.codigo_municipio_ibge) {
            var cityId = _lookupCityInternalId(json.codigo_municipio_ibge);
            if (cityId) {
                subrecord.setValue({ fieldId: f.CITY, value: cityId });
            } else {
                log.debug('pd-cnpj-mapper.insertAddress', 'Could not resolve city for IBGE code ' + json.codigo_municipio_ibge + ' — leaving City blank.');
            }
        } else {
            log.debug('pd-cnpj-mapper.insertAddress', 'No codigo_municipio_ibge in response — leaving City blank.');
        }

        if (isDynamic) currentRecord.commitLine({ sublistId: sublistId });
    }

    /**
     * @param {Record} currentRecord
     * @param {string} fieldId
     * @param {string} value
     */
    function _setIfEmpty(currentRecord, fieldId, value) {
        var current = currentRecord.getValue({ fieldId: fieldId });
        if (current !== '' && current !== null && typeof current !== 'undefined') return;
        currentRecord.setValue({ fieldId: fieldId, value: value });
    }

    /**
     * @param  {string|number} ibgeCode
     * @returns {string|null}
     */
    function _lookupCityInternalId(ibgeCode) {
        if (!ibgeCode) return null;
        try {
            var results = search.create({
                type:    cts.ENTITY.CITY_LOOKUP.RECORD_TYPE,
                filters: [[cts.ENTITY.CITY_LOOKUP.FIELDS.IBGE_CODE, 'equalto', Number(ibgeCode)]],
                columns: ['internalid']
            }).run().getRange({ start: 0, end: 1 });

            if (!results.length) {
                log.debug('pd-cnpj-mapper._lookupCityInternalId', 'No customrecord_ftebr_city match for IBGE code ' + ibgeCode);
                return null;
            }
            log.debug('pd-cnpj-mapper._lookupCityInternalId', 'IBGE code ' + ibgeCode + ' resolved to internal ID ' + results[0].id);
            return results[0].id;
        } catch (e) {
            log.error('pd-cnpj-mapper._lookupCityInternalId', e);
            return null;
        }
    }

    /**
     * @param  {Record} currentRecord
     * @param  {string} fieldId
     * @returns {boolean}
     */
    function _fieldExists(currentRecord, fieldId) {
        return currentRecord.getField({ fieldId: fieldId }) !== null;
    }

    /**
     * @param  {string} recordType
     * @param  {string} name
     * @returns {string|null}
     */
    function _lookupRecordIdByName(recordType, name) {
        if (!name) return null;
        try {
            var results = search.create({
                type:    recordType,
                filters: [['name', 'is', name]],
                columns: ['internalid']
            }).run().getRange({ start: 0, end: 1 });

            if (!results.length) {
                log.debug('pd-cnpj-mapper._lookupRecordIdByName', 'No ' + recordType + ' match for name "' + name + '"');
                return null;
            }
            log.debug('pd-cnpj-mapper._lookupRecordIdByName', 'Name "' + name + '" resolved to internal ID ' + results[0].id + ' on ' + recordType);
            return results[0].id;
        } catch (e) {
            log.error('pd-cnpj-mapper._lookupRecordIdByName', e);
            return null;
        }
    }

    /**
     * @param  {Object} json
     * @returns {string|null}
     */
    function _resolveTaxRegimeLabel(json) {
        var labels = cts.ENTITY.TAX_REGIME_LOOKUP.LABELS;

        if (json.opcao_pelo_mei === true)     return labels.SIMPLES;
        if (json.opcao_pelo_simples === true) return labels.SIMPLES;

        if (json.regime_tributario && json.regime_tributario.length) {
            var latest = json.regime_tributario.reduce(function (acc, entry) {
                return (!acc || entry.ano > acc.ano) ? entry : acc;
            }, null);

            var forma = latest && latest.forma_de_tributacao;
            if (forma === 'LUCRO PRESUMIDO') return labels.LUCRO_PRESUMIDO;
            if (forma === 'LUCRO REAL')      return labels.LUCRO_REAL;

            log.debug('pd-cnpj-mapper._resolveTaxRegimeLabel', 'Unrecognized forma_de_tributacao "' + forma + '" — tax regime not mapped.');
            return null;
        }

        log.debug('pd-cnpj-mapper._resolveTaxRegimeLabel', 'No opcao_pelo_mei/opcao_pelo_simples/regime_tributario data in response — tax regime not mapped.');
        return null;
    }

    /**
     * @param  {string} str
     * @returns {string}
     */
    function _normalize(str) {
        if (!str) return '';
        if (typeof str.normalize === 'function') {
            return str.normalize('NFD').replace(/[^\x00-\x7F]/g, '');
        }
        return str;
    }

    /**
     * @param  {string} raw
     * @returns {string}
     */
    function _formatPhone(raw) {
        if (!raw) return '';
        var digits = raw.replace(/\D/g, '');
        if (digits.length === 10) return '(' + digits.substring(0, 2) + ') ' + digits.substring(2, 6) + '-' + digits.substring(6);
        if (digits.length === 11) return '(' + digits.substring(0, 2) + ') ' + digits.substring(2, 7) + '-' + digits.substring(7);
        return raw;
    }

    return {
        setFields:     setFields,
        insertAddress: insertAddress
    };
});
