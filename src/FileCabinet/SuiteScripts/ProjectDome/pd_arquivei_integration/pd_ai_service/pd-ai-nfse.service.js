/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/record',
        // 'N/file',
        // 'N/encode',
        './pd-ai-subsidiary.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-date.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,
        // file,
        // encode,

        subsidiary_service,

        record_util,
        search_util,
        date_util
    ) {

        const TYPE = 'customrecord_pd_ai_nfse';
        let FIELDS = {
            internalId: { name: 'internalid' },
            isInactive: { name: 'isinactive' },
            docImport: { name: 'custrecord_pd_ai_nfse_doc_import', type: 'list' },
            file: { name: 'custrecord_pd_ai_nfse_file' },
            number: { name: 'custrecord_pd_ai_nfse_number' },
            issueDate: { name: 'custrecord_pd_ai_nfse_issue_date', sort: 'DESC' },
            amount: { name: 'custrecord_pd_ai_nfse_amount' },
            serviceCode: { name: 'custrecord_pd_ai_nfse_service_code' },
            corporateName: { name: 'custrecord_pd_ai_nfse_corporate_name' },
            fantasyName: { name: 'custrecord_pd_ai_nfse_fantasy_name' },
            vendorCnpj: { name: 'custrecord_pd_ai_nfse_cnpj' },
            vendorStateRegister: { name: 'custrecord_pd_ai_nfse_state_register' },
            vendorAddressStreet: { name: 'custrecord_pd_ai_nfse_address_street' },
            vendorAddressNumber: { name: 'custrecord_pd_ai_nfse_address_number' },
            vendorAddressComplement: { name: 'custrecord_pd_ai_nfse_address_complement' },
            vendorAddressDistrict: { name: 'custrecord_pd_ai_nfse_address_district' },
            vendorAddressCountyCod: { name: 'custrecord_pd_ai_nfse_address_count_cod' },
            vendorAddressState: { name: 'custrecord_pd_ai_nfse_address_state' },
            vendorAddressCep: { name: 'custrecord_pd_ai_nfse_address_cep' },
            // vendorAddressMunicipality: { name: 'custrecord_pd_ai_nfse_municipality' },
            providerId: { name: 'custrecord_pd_ai_nfse_provider', type: 'list' },
            // providerCategory: { name: 'category', join: 'custrecord_pd_ai_nfse_provider' },

            rpsNumber: { name: 'custrecord_pd_ai_nfse_rps_number' },
            rpsSerie: { name: 'custrecord_pd_ai_nfse_rps_serie' },

            takerCnpj: { name: 'custrecord_pd_ai_nfse_taker_cnpj' },
            pdf: { name: 'custrecord_pd_ai_nfse_pdf' },
            documentId: { name: 'custrecord_pd_ai_nfse_document_id' },

            calculationBase: { name: 'custrecord_pd_ai_nfse_calculation_base' },
            aliquot: { name: 'custrecord_pd_ai_nfse_aliquot' },
            cofins: { name: 'custrecord_pd_ai_nfse_cofins' },
            csll: { name: 'custrecord_pd_ai_nfse_csll' },
            ir: { name: 'custrecord_pd_ai_nfse_ir' },
            iss: { name: 'custrecord_pd_ai_nfse_iss' },
            pis: { name: 'custrecord_pd_ai_nfse_pis' },
            totalReceived: { name: 'custrecord_pd_ai_nfse_total_received' },
            conciliationTransaction: { name: 'custrecord_pd_ai_nfse_concil_transac' },
            issWithheld: { name: 'custrecord_pd_ai_nfse_iss_withheld' },
            nfseId: { name: 'custrecord_pd_ai_nfse_id' },
            status: { name: 'custrecord_pd_ai_nfse_status' }
        };

        function set(options) {
            log.audit({ title: 'options', details: options });

            let _nfseData = {};

            _nfseData[FIELDS.docImport.name] = options.data.docImportId;
            _nfseData[FIELDS.file.name] = options.data.file;
            _nfseData[FIELDS.number.name] = options.data.number;
            _nfseData[FIELDS.issueDate.name] = options.data.issueDate;
            _nfseData[FIELDS.corporateName.name] = options.data.corporateName;
            _nfseData[FIELDS.fantasyName.name] = options.data.fantasyName;
            _nfseData[FIELDS.amount.name] = options.data.valueTotal;
            _nfseData[FIELDS.serviceCode.name] = options.data.serviceCode;
            _nfseData[FIELDS.vendorCnpj.name] = options.data.vendorCnpj;
            _nfseData[FIELDS.takerCnpj.name] = options.data.takerCnpj;
            _nfseData[FIELDS.vendorStateRegister.name] = options.data.vendorStateRegister;
            _nfseData[FIELDS.vendorAddressStreet.name] = options.data.vendorAddressStreet;
            _nfseData[FIELDS.vendorAddressNumber.name] = options.data.vendorAddressNumber;
            _nfseData[FIELDS.vendorAddressComplement.name] = options.data.vendorAddressComplement;
            _nfseData[FIELDS.vendorAddressDistrict.name] = options.data.vendorAddressDistrict;
            _nfseData[FIELDS.vendorAddressCountyCod.name] = options.data.vendorAddressCountyCod;
            _nfseData[FIELDS.vendorAddressState.name] = options.data.vendorAddressState;
            _nfseData[FIELDS.vendorAddressCep.name] = options.data.vendorAddressCep;
            _nfseData[FIELDS.rpsNumber.name] = options.data.rpsNumber;
            _nfseData[FIELDS.rpsSerie.name] = options.data.rpsSerie;
            _nfseData[FIELDS.pdf.name] = options.data.pdf;
            _nfseData[FIELDS.providerId.name] = options.data.vendorId;

            _nfseData[FIELDS.calculationBase.name] = options.data.calculationBase;
            _nfseData[FIELDS.aliquot.name] = options.data.aliquot;
            _nfseData[FIELDS.cofins.name] = options.data.cofins;
            _nfseData[FIELDS.csll.name] = options.data.csll;
            _nfseData[FIELDS.ir.name] = options.data.ir;
            _nfseData[FIELDS.iss.name] = options.data.iss;
            _nfseData[FIELDS.pis.name] = options.data.pis;
            _nfseData[FIELDS.totalReceived.name] = options.data.totalReceived;
            _nfseData[FIELDS.issWithheld.name] = options.data.issWithheld == 2 ? false : true;
            _nfseData[FIELDS.nfseId.name] = options.data.nfseId;
            _nfseData[FIELDS.status.name] = options.data.statusId;

            // _nfseData[FIELDS.rpsNumber.name] = options.data.rpsNumber;
            // _nfseData[FIELDS.rpsSerie.name] = options.data.rpsSerie;

            _nfseData[FIELDS.conciliationTransaction.name] = options.data.conciliationTransaction;

            _nfseData[FIELDS.documentId.name] = options.data.documentId;

            return record_util
                .handler(options.record)
                .set(_nfseData);
        }

        function save(record, options) {
            return record.save({
                ignoreMandatoryFields: ifNullOrEmpty(options?.ignore, false)
            })
        }

        function create() {
            return record.create({ type: TYPE });
        }

        function get(parameters) {
            FIELDS['issueDateIso'] = {
                name: 'formulatext',
                formula: "TO_CHAR({custrecord_pd_ai_nfse_issue_date}, 'YYYY-MM-DD')"
            }
            FIELDS.conciliation = {
                name: 'custrecord_pd_ai_nc_nfse',
                join: 'custrecord_pd_ai_nc_nfse'
            }

            parameters.page = ifNullOrEmpty(parameters?.page, 1);

            const pageSize = 200;
            let result = search_util.getPaged({
                type: TYPE,
                columns: FIELDS,
                page: parameters.page,
                pageSize: pageSize,
                query: buildQuery(parameters)
            });

            let _pageNumber = result.count / pageSize;

            result.page.count = _pageNumber - Math.floor(_pageNumber) < 0.5 ? _pageNumber.round(0) + 1 : _pageNumber.round(0);

            log.audit({ title: 'result', details: result })

            return result;

            function buildQuery(parameters) {
                const _query = search_util
                    .where(search_util.query(FIELDS.isInactive, 'is', false))
                    .and(search_util.query(FIELDS.conciliation, 'anyof', '@NONE@'))

                if (!isNullOrEmpty(parameters.startDate)) {
                    _query.and(search_util.query(FIELDS.issueDate, 'onorafter', parameters.startDate));
                }

                if (!isNullOrEmpty(parameters.endDate)) {
                    _query.and(search_util.query(FIELDS.issueDate, 'onorbefore', parameters.endDate));
                }

                if (!isNullOrEmpty(parameters.vendorCnpj)) {
                    let _formatedCNPJ = parameters.vendorCnpj.replace(/[^a-zA-Z0-9]/g, "");
                    _query.and(search_util.query(FIELDS.vendorCnpj, 'haskeywords', _formatedCNPJ));
                }

                if (!isNullOrEmpty(parameters.subsidiary)) {
                    const subsidiaryData = subsidiary_service.getById(parameters.subsidiary);
                    log.audit({ title: 'subsidiaryData', details: subsidiaryData });

                    let _formatedCNPJ = subsidiaryData?.cnpj?.replace(/[^a-zA-Z0-9]/g, "");

                    _query.and(search_util.query(FIELDS.takerCnpj, 'haskeywords', _formatedCNPJ || 0));
                }

                if (!isNullOrEmpty(parameters.docNumber)) {
                    _query.and(search_util.query(FIELDS.number, 'is', parameters.docNumber));
                }

                return _query
            }
        }

        function getById(id) {
            FIELDS['issueDateIso'] = {
                name: 'formulatext',
                formula: "TO_CHAR({custrecord_pd_ai_nfse_issue_date}, 'YYYY-MM-DD')"
            }

            return search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.internalId, 'anyof', id))
            });
        };

        function setSubmit(options) {
            let _mapValues = {};

            options?.conciliationTransaction ? _mapValues[FIELDS.conciliationTransaction.name] = options.conciliationTransaction : null;

            log.audit({ title: '_mapValues', details: _mapValues });

            return record.submitFields({
                type: TYPE,
                id: options.recordId,
                values: _mapValues
            });
        }

        // Busca pelo ID do Arquivei; se não achar exatamente uma nota, tenta pela chave natural
        // (prestador + tomador + número). Resultado ambíguo (mais de uma) ou vazio retorna null.
        function getForCancelled({ id, vendorCnpj, takerCnpj, number }) {
            if (id) {
                const _byId = getSingle(
                    search_util.where(search_util.query(FIELDS.nfseId, 'is', id))
                );

                log.audit({ title: '_byId', details: _byId });

                if (_byId) return _byId;
            }

            if (!vendorCnpj || !takerCnpj || !number) return null;

            return getSingle(
                search_util
                    .where(search_util.query(FIELDS.vendorCnpj, 'is', vendorCnpj))
                    .and(search_util.query(FIELDS.takerCnpj, 'is', takerCnpj))
                    .and(search_util.query(FIELDS.number, 'is', number))
            );

            function getSingle(query) {
                const _data = search_util.all({
                    type: TYPE,
                    columns: FIELDS,
                    query: query
                });

                return (_data.length === 1 || _data.length === 2) ? _data[0] : null;
            }
        }

        function setStatus({ recordId, statusId }) {
            let _mapValues = {};
            _mapValues[FIELDS.status.name] = statusId;

            return record.submitFields({
                type: TYPE,
                id: recordId,
                values: _mapValues
            });
        }

        function getByStatusQuery(statusId) {
            return {
                type: 'suiteql',
                query: `
                    SELECT nfse.id AS id
                    FROM ${TYPE} AS nfse
                    WHERE nfse.${FIELDS.status.name} = ?`,
                params: [statusId]
            };
        }

        // O import gravava custrecord_pd_ai_nfse_id com o ID da primeira nota do lote; o ID correto
        // está no nome dos arquivos vinculados (XML: nfse_<id>.xml / PDF: <id>.pdf).
        function getWithInvalidNfseIdQuery() {
            return {
                type: 'suiteql',
                query: `
                    SELECT
                        nfse.id AS id,
                        nfse.${FIELDS.nfseId.name} AS currentnfseid,
                        fx.name AS xmlname,
                        fp.name AS pdfname
                    FROM
                        ${TYPE} AS nfse
                        LEFT JOIN file AS fx ON fx.id = nfse.${FIELDS.file.name}
                        LEFT JOIN file AS fp ON fp.id = nfse.${FIELDS.pdf.name}
                    WHERE
                        nfse.${FIELDS.nfseId.name} IS NULL
                        OR fx.name IS NULL
                        OR fx.name <> 'nfse_' || nfse.${FIELDS.nfseId.name} || '.xml'`
            };
        }

        function getNfseIdFromFileNames({ xmlName, pdfName }) {
            const _fromXml = /^nfse_(.+)\.xml$/.exec(xmlName || '');
            if (_fromXml) return _fromXml[1];

            const _fromPdf = /^(.+)\.pdf$/.exec(pdfName || '');
            if (_fromPdf) return _fromPdf[1];

            return null;
        }

        function setNfseId({ recordId, nfseId }) {
            let _mapValues = {};
            _mapValues[FIELDS.nfseId.name] = nfseId;

            return record.submitFields({
                type: TYPE,
                id: recordId,
                values: _mapValues
            });
        }

        function load(object) {
            return record.load({ type: TYPE, id: object.id, isDynamic: ifNullOrEmpty(object?.isDynamic, false) });
        }


        // ["custrecord_pd_ai_nfse_issue_date", "on", "14/01/2026 11:59 tarde"]

        return {
            // createNFSe: createNFSe,
            getForCancelled: getForCancelled,
            setStatus: setStatus,
            getByStatusQuery: getByStatusQuery,
            getWithInvalidNfseIdQuery: getWithInvalidNfseIdQuery,
            getNfseIdFromFileNames: getNfseIdFromFileNames,
            setNfseId: setNfseId,
            getById: getById,
            setSubmit: setSubmit,
            create: create,
            load: load,
            save: save,
            get: get,
            set: set
        };
    }
);