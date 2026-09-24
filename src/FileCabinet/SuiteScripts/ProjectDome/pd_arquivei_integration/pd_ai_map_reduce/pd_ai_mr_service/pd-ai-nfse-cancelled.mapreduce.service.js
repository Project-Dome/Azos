/**
 * @NApiVersion 2.1
 * @ModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/log',
        'N/runtime',
        'N/file',
        'N/encode',

        '../../pd_ai_service/pd-ai-subsidiary.service',
        '../../pd_ai_service/pd-ai-api-authorization.service',
        '../../pd_ai_service/pd-ai-script-parameters.service',
        '../../pd_ai_service/pd-ai-nfse.service',
        '../../pd_ai_service/pd-ai-api.service',
        '../../pd_ai_service/pd-ai-document-importation.service',
        '../../pd_ai_service/pd-ai-vendor.service',
        '../../pd_ai_service/pd-ai-nfse-status.service',


        // '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
        // '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-xml.util',
        '../../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        log,
        runtime,
        file,
        encode,

        subsidiary_service,
        api_authorization_service,
        script_parameters_service,
        nfse_service,
        api_service,
        document_importation_service,
        vendor_service,
        nfse_status_service,

        xml_util
    ) {

        function getInputData() {
            const _subsidiaryForEmissionDocument = subsidiary_service.getSubsidiary();

            return _subsidiaryForEmissionDocument;
        };

        function reduce(context) {

            try {
                const _subsidiaryData = JSON.parse(context.values[0]);
                if (!_subsidiaryData.autoImportNfse) return;

                if (_subsidiaryData.id != 2) return;

                const _paramsDoc = api_authorization_service.get();

                let _docImportData = document_importation_service.getBySubsidiaryAndConfigType({
                    subsidiaryId: _subsidiaryData.id,
                    configType: "cancelled"
                });
                const _hasDocImportation = _docImportData ? true : false;

                let mapData = {
                    subsidiaryId: _subsidiaryData.id,
                    apiId: _paramsDoc.apiId,
                    apiKey: _paramsDoc.apiKey,
                    next: _hasDocImportation ? _docImportData.urlNext : null
                };

                const nFSeList =
                    api_service.getNFSeCanceled(mapData);

                if (!_hasDocImportation) {

                    _docImportRecord = document_importation_service.create();
                    _docImportData = document_importation_service.set({
                        record: _docImportRecord,
                        data: {
                            subsidiary: _subsidiaryData.id,
                            urlNext: !isNullOrEmpty(nFSeList.page.next) ? nFSeList.page.next : nFSeList.nextPage,
                            configurationType: "cancelled"
                        }
                    });
                    _docImportData.id = document_importation_service.save(_docImportRecord);
                }

                let _statusList = nfse_status_service.getAll();
                let _mapByCode = nfse_status_service.mapByCode(_statusList);

                log.audit({
                    title: "_mapByCode",
                    details: _mapByCode
                });

                nFSeList.data.forEach(function (dataLine) {

                    const nFSeList =
                        api_service.getNFSe({
                            id: dataLine.id,
                            apiId: _paramsDoc.apiId,
                            apiKey: _paramsDoc.apiKey,
                            next: null
                        });

                    const _xmlFile = getXml({
                        docImport: 'nfse_',
                        xml: nFSeList.data[0].xml
                    });
                    log.audit('_xmlFile', _xmlFile);

                    let _jsonXmlFile = xml_util.xmlToJSON({ xml: _xmlFile.xml });

                    let nFSeData = mapJsonFileNFSe(_jsonXmlFile);
                    log.audit('nFSeData', nFSeData.number);

                    if (nFSeData.takerCnpj != _subsidiaryData.cnpj.onlyNumbers()) return;

                    let nfseRecordData = nfse_service.getForCancelled({
                        id: dataLine.id,
                        vendorCnpj: nFSeData.vendorCnpj,
                        takerCnpj: nFSeData.takerCnpj,
                        number: nFSeData.number
                    });
                    log.audit('nfseRecordData', nfseRecordData);

                    if (nfseRecordData) {
                        const nFSeRecord = nfse_service.load({ id: nfseRecordData.id });

                        nfse_service.set({
                            record: nFSeRecord,
                            data: {
                                statusId: _mapByCode.cancelled.id
                            }
                        });
                        const _nfseId = nfse_service.save(nFSeRecord);
                    }
                });

                document_importation_service.setSubmit({
                    urlNext: nFSeList.page.next,
                    recordId: _docImportData.id,
                });

            } catch (error) {
                log.error('Error Reduce', error);
            }
        };

        function getXml(options) {
            const _encoded = encode.convert({
                string: options.xml,
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8
            });

            return {
                xml: _encoded
            };
        };

        function mapJsonFileNFSe(json) {
            const objectXML = {};

            objectXML['number'] = json.CompNfse.Nfse[0].InfNfse[0].Numero || null;
            objectXML['issueDate'] = convertDate(json.CompNfse.Nfse[0].InfNfse[0].DataEmissao || null);
            objectXML['corporateName'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].RazaoSocial || null;
            objectXML['fantasyName'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].NomeFantasia || null;
            objectXML['serviceCode'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].ItemListaServico || null;
            objectXML['vendorCnpj'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].IdentificacaoPrestador[0].CpfCnpj[0].Cnpj || null;

            if (objectXML['vendorCnpj']) {
                objectXML['vendorId'] = ifNullOrEmpty(
                    ifNullOrEmpty(
                        vendor_service.getByCNPJ(formatCNPJ(objectXML['vendorCnpj'])), {}
                    )?.id, null
                );
            }

            objectXML['takerCnpj'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Tomador[0].IdentificacaoTomador[0].CpfCnpj[0].Cnpj || null;
            objectXML['vendorStateRegister'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].IdentificacaoPrestador[0].InscricaoMunicipal || null;
            objectXML['vendorAddressStreet'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].Endereco[0].Endereco || null;
            objectXML['vendorAddressNumber'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].Endereco[0].Numero || null;
            objectXML['vendorAddressComplement'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].Endereco[0].Complemento || null;
            objectXML['vendorAddressDistrict'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].Endereco[0].Bairro || null;
            objectXML['vendorAddressCountyCod'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].Endereco[0].CodigoMunicipio || null;
            objectXML['vendorAddressState'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].Endereco[0].Uf || null;
            objectXML['vendorAddressCep'] = json.CompNfse.Nfse[0].InfNfse[0].PrestadorServico[0].Endereco[0].Cep || null;

            objectXML['calculationBase'] = json.CompNfse.Nfse[0].InfNfse[0].ValoresNfse[0].BaseCalculo || null;
            // objectXML['Aliquota'] = json.CompNfse.Nfse[0].InfNfse[0].ValoresNfse[0].Aliquota || null;
            // objectXML['ValorIss'] = json.CompNfse.Nfse[0].InfNfse[0].ValoresNfse[0].ValorIss || null;
            objectXML['ValorLiquidoNfse'] = json.CompNfse.Nfse[0].InfNfse[0].ValoresNfse[0].ValorLiquidoNfse || null;

            objectXML['aliquot'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].Valores[0].Aliquota || null;
            objectXML['cofins'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].Valores[0].ValorCofins || null;
            objectXML['csll'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].Valores[0].ValorCsll || null;
            objectXML['ir'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].Valores[0].ValorIr || null;
            objectXML['iss'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].Valores[0].ValorIss || null;
            objectXML['pis'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].Valores[0].ValorPis || null;
            objectXML['totalReceived'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].Valores[0].ValorTotalRecebido || null;
            objectXML['issWithheld'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].Valores[0].IssRetido || null;

            objectXML['valueTotal'] = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Servico[0].Valores[0].ValorServicos || null;

            let _rps = json.CompNfse.Nfse[0].InfNfse[0].DeclaracaoPrestacaoServico[0].InfDeclaracaoPrestacaoServico[0].Rps;
            if (_rps) {

                if (_rps[0].IdentificacaoRps) {
                    objectXML['rpsNumber'] = _rps[0].IdentificacaoRps[0].Numero;
                    objectXML['rpsSerie'] = _rps[0].IdentificacaoRps[0].Serie;

                } else if (_rps[0].Id) {
                    objectXML['rpsNumber'] = _rps[0].Id;

                } else if (_rps[0].Status) {
                    objectXML['rpsSerie'] = _rps[0].Status;
                }
            } else {
                objectXML['rpsNumber'] = null;
                objectXML['rpsSerie'] = null;
            }

            return objectXML;
        };

        function formatCNPJ(cnpj) {
            cnpj = cnpj.replace(/\D/g, '');

            cnpj = cnpj.replace(/^(\d{2})(\d)/, '$1.$2');
            cnpj = cnpj.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            cnpj = cnpj.replace(/\.(\d{3})(\d)/, '.$1/$2');
            cnpj = cnpj.replace(/(\d{4})(\d)/, '$1-$2');

            return String(cnpj);
        };

        function convertDate(dateIsoString) {
            var _datePart = dateIsoString.split('T')[0];
            var _dateParts = _datePart.split('-');
            var _year = parseFloat(_dateParts[0]);
            var _month = parseFloat(_dateParts[1]) - 1;
            var _day = parseFloat(_dateParts[2]);

            return new Date(_year, _month, _day, 12);
        };

        return {
            getInputData: getInputData,
            reduce: reduce
        }
    }
);
