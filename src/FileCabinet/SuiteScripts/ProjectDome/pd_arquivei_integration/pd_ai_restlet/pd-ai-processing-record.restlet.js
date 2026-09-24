/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        '../pd_ai_service/pd-ai-nfse-processing-record.service',
    ],
    function (
        nfse_processing_record_service,
    ) {
        function post(parameters) {
            log.audit({ title: 'parameters', details: parameters });

            parameters.map(function (line, index) {
                switch (line.documentImportation) {
                    case 'nfse':

                        try {
                            const recordProcessionNFSe = nfse_processing_record_service.create();
                            nfse_processing_record_service.set({
                                record: recordProcessionNFSe,
                                data: {
                                    status: nfse_processing_record_service.status.pending,
                                    nfse: line.docFileNfseId,
                                    errorMessage: '',
                                    reprocessing: false,
                                    issueDate: convertIsoDate(line.issueDateIso),
                                    vendor: line.vendorId,
                                    totalValue: manageParseFloat(line.totalValue),
                                    purchaseOrder: !(line.conciliationTypeCode == 'reconcile_invoice_without_po') ? line?.purchaseOrderId : null,
                                    invoice: line.conciliationTypeCode == 'reconcile_invoice_without_po' ? line?.purchaseOrderId : null,
                                    purchaseOrderLine: line?.purchaseOrderLine,
                                    item: line.itemId,
                                    conciliationType: nfse_processing_record_service.CONCILIATION_TYPE_ID[line.conciliationTypeCode],
                                    class: line?.classId,
                                    department: line?.departmentId,
                                    location: line?.locationId
                                }
                            });
                            nfse_processing_record_service.save(recordProcessionNFSe);
                        } catch (error) {
                            log.error({
                                title: 'error',
                                details: error
                            });
                        }

                    case 'nfe':
                        nfse_processing_record_service.create(line)
                        // processing_nfe_service.createProductNfe(line, _processingRecordId);
                        break;
                    case 'cte':
                        nfse_processing_record_service.create(line);
                        break;
                }
            });

            return JSON.stringify({ success: true });
        }

        function manageParseFloat(value) {
            if (String(value).includes(",")) {
                return parseFloat(value.replaceAll(".", "").replace(",", "."));
            } else {
                return parseFloat(value);
            }
        }

        function convertIsoDate(isoDate) {
            if (isNullOrEmpty(isoDate)) {
                return null;
            }
            const _dateParts = isoDate.split('-');
            const _year = parseFloat(_dateParts[0]);
            const _month = parseFloat(_dateParts[1]) - 1;
            const _day = parseFloat(_dateParts[2]);

            return new Date(_year, _month, _day, 12);
        }

        return {
            post: post
        };
    }
);