/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount 
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/log',
        'N/record',

        '../../pd_ai_service/pd-ai-nfse-processing-record.service',
        '../../pd_ai_service/pd-ai-vendor-bill.service',
        '../../pd_ai_service/pd-ai-purchase-order.service',
        '../../pd_ai_service/pd-ai-nfse.service',
        '../../pd_ai_service/pd-ai-script-parameters.service',

        '../../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-exception.util',
        '../../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        log,
        record,

        processing_nfse_service,
        vendor_bil_service,
        purchase_order_service,
        nfse_service,
        script_parameters
    ) {
        function getInputData() {
            let _lines = processing_nfse_service.getProcessRecord();

            return _lines;
        }

        let operationNature = {
            taxationMunicipality: 1
        }

        const reconciliationAction = {
            receipt_to_invoice: function (_conciliationData) { },
            create_invoice_for_po: function (_conciliationData) {

                try {
                    const _nfseData = nfse_service.getById(_conciliationData.nfse.id);
                    const _vendorBill = vendor_bil_service.transformData('purchaseorder', _conciliationData?.purchaseOrder?.id);
                    const _vendorBillData = vendor_bil_service.readData(_vendorBill);
                    log.audit('Vendor BillData', _vendorBillData);

                    const _vendorBillLocation = _vendorBill.getValue({ fieldId: 'location' });
                    if (!_vendorBillLocation) {
                        vendor_bil_service.set({
                            record: _vendorBill,
                            data: {
                                location: _conciliationData.location
                            }
                        });
                    }

                    const data = {
                        class: _conciliationData.class,
                        department: _conciliationData.department,
                        rpsNumber: _nfseData?.rpsNumber || _nfseData?.number,
                        rpsSerie: _nfseData?.rpsSerie || 0,
                        rpsDate: manageIssueDate(_nfseData.issueDateIso)
                    }

                    data['electronicDocument'] = script_parameters.getNFSeId(), data['operationNature'] = operationNature.taxationMunicipality

                    vendor_bil_service.set({
                        record: _vendorBill,
                        data: data
                    });

                    removeLines(_vendorBill, _conciliationData);

                    const vendorBillId = vendor_bil_service.save(_vendorBill);
                    log.audit('vendorBillId', vendorBillId);

                    processing_nfse_service.setSubmit({
                        recordId: _conciliationData.id,
                        status: processing_nfse_service.status.concluded,
                        invoice: vendorBillId,
                        reprocessing: 'F',
                        errorMessage: ""
                    });

                    nfse_service.setSubmit({
                        recordId: _conciliationData.nfse.id,
                        conciliationTransaction: vendorBillId
                    });
                } catch (error) {
                    log.error({ title: 'error', details: error });

                    processing_nfse_service.setSubmit({
                        recordId: _conciliationData.id,
                        status: processing_nfse_service.status.error,
                        errorMessage: getExceptionMessage(error),
                        reprocessing: 'F'
                    });
                }
            },
            reconcile_invoice_without_po: function (_conciliationData) {
                log.audit({
                    title: '_conciliationData',
                    details: _conciliationData
                })
                try {
                    const _nfseData = nfse_service.getById(_conciliationData.nfse.id);

                    const data = {
                        class: _conciliationData.class,
                        department: _conciliationData.department,
                        rpsNumber: _nfseData?.rpsNumber || _nfseData?.number,
                        rpsSerie: _nfseData?.rpsSerie || 0,
                        rpsDate: manageIssueDate(_nfseData.issueDateIso)
                    }

                    data['electronicDocument'] = script_parameters.getNFSeId(), data['operationNature'] = operationNature.taxationMunicipality

                    const vendorBillRecord = vendor_bil_service.load({ id: _conciliationData.invoice.id });
                    vendor_bil_service.set({
                        record: vendorBillRecord,
                        data: data
                    });
                    vendor_bil_service.save(vendorBillRecord);

                    processing_nfse_service.setSubmit({
                        recordId: _conciliationData.id,
                        status: processing_nfse_service.status.concluded,
                        invoice: _conciliationData.invoice.id,
                        reprocessing: 'F',
                        errorMessage: ""
                    });

                    nfse_service.setSubmit({
                        recordId: _conciliationData.nfse.id,
                        conciliationTransaction: _conciliationData.invoice.id
                    });
                } catch (error) {
                    log.error({ title: 'error', details: error });

                    processing_nfse_service.setSubmit({
                        recordId: _conciliationData.id,
                        status: processing_nfse_service.status.error,
                        errorMessage: getExceptionMessage(error),
                        reprocessing: 'F'
                    });
                }
            },
            reconcile_invoice: function (_conciliationData) {
                try {
                    const _nfseData = nfse_service.getById(_conciliationData.nfse.id);
                    const _vendorBillLines = vendor_bil_service.getLineVendorBillByPO(_conciliationData?.purchaseOrder?.id);
                    const vendorBillForConciliation = _vendorBillLines.filter(
                        element =>
                            element.orderLine == _conciliationData.purchaseOrderLine
                            && element.rate == _conciliationData.totalValue
                    );

                    const data = {
                        class: _conciliationData.class,
                        department: _conciliationData.department,
                        rpsNumber: _nfseData?.rpsNumber || _nfseData?.number,
                        rpsSerie: _nfseData?.rpsSerie || 0,
                        rpsDate: manageIssueDate(_nfseData.issueDateIso)
                    }

                    data['electronicDocument'] = script_parameters.getNFSeId(), data['operationNature'] = operationNature.taxationMunicipality

                    const vendorBillRecord = vendor_bil_service.load({ id: vendorBillForConciliation[0].id });
                    vendor_bil_service.set({
                        record: vendorBillRecord,
                        data: data
                    });
                    vendor_bil_service.save(vendorBillRecord);

                    processing_nfse_service.setSubmit({
                        recordId: _conciliationData.id,
                        status: processing_nfse_service.status.concluded,
                        invoice: vendorBillForConciliation[0].id,
                        reprocessing: 'F',
                        errorMessage: ""
                    });

                    nfse_service.setSubmit({
                        recordId: _conciliationData.nfse.id,
                        conciliationTransaction: vendorBillForConciliation[0].id
                    });
                } catch (error) {
                    log.error({ title: 'error', details: error });

                    processing_nfse_service.setSubmit({
                        recordId: _conciliationData.id,
                        status: processing_nfse_service.status.error,
                        errorMessage: getExceptionMessage(error),
                        reprocessing: 'F'
                    });
                }
            },
            create_invoice: function (_conciliationData) {
                try {
                    const _nfseData = nfse_service.getById(_conciliationData.nfse.id);
                    const _vendorBill = vendor_bil_service.create({ isDynamic: true });

                    const data = {
                        vendor: _conciliationData.vendor.id,
                        location: _conciliationData.location,
                        class: _conciliationData.class,
                        department: _conciliationData.department,
                        rpsNumber: _nfseData?.rpsNumber || _nfseData?.number,
                        rpsSerie: _nfseData?.rpsSerie || 0,
                        rpsDate: manageIssueDate(_nfseData.issueDateIso),
                        itemList: [{
                            item: _conciliationData.item.id,
                            rate: _conciliationData.totalValue,
                            location: _conciliationData.location
                        }]
                    }

                     data['electronicDocument'] = script_parameters.getNFSeId(), data['operationNature'] = operationNature.taxationMunicipality

                    vendor_bil_service.set({
                        record: _vendorBill,
                        data: data
                    });

                    const vendorBillId = vendor_bil_service.save(_vendorBill, { ignore: true })
                    log.audit('vendorBillId', vendorBillId);

                    processing_nfse_service.setSubmit({
                        recordId: _conciliationData.id,
                        status: processing_nfse_service.status.concluded,
                        invoice: vendorBillId,
                        reprocessing: 'F',
                        errorMessage: ""
                    });

                    nfse_service.setSubmit({
                        recordId: _conciliationData.nfse.id,
                        conciliationTransaction: vendorBillId
                    });
                } catch (error) {
                    log.error({ title: 'error', details: error });

                    processing_nfse_service.setSubmit({
                        recordId: _conciliationData.id,
                        status: processing_nfse_service.status.error,
                        errorMessage: getExceptionMessage(error),
                        reprocessing: 'F'
                    });
                }
            }
        }

        function reduce(context) {
            const _conciliationData = JSON.parse(context.values[0]);

            log.audit({
                title: '_conciliationData',
                details: _conciliationData
            });

            try {
                const action = reconciliationAction[_conciliationData.conciliationTypeCode];

                log.audit({
                    title: 'action',
                    details: action
                });


                if (typeof action === 'function') {
                    action(_conciliationData);
                }
            } catch (exception) {
                log.error({
                    title: 'Purchase Order Management Exception',
                    details: getExceptionMessage(exception)
                });
            }
        }

        function manageIssueDate(date) {
            return new Date(`${date}T07:00:00.000Z`)
        }

        function removeLines(recordObj, _conciliationData) {
            const lineCount = recordObj.getLineCount({ sublistId: 'item' });

            for (let i = lineCount - 1; i >= 0; i--) {
                recordObj.selectLine({
                    sublistId: 'item',
                    line: i
                });

                const rate = recordObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate'
                });

                const orderLine = recordObj.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'orderline'
                });

                const isMatch =
                    orderLine == _conciliationData.purchaseOrderLine &&
                    rate == _conciliationData.totalValue

                if (!isMatch) {
                    recordObj.removeLine({
                        sublistId: 'item',
                        line: i,
                        ignoreRecalc: true
                    });
                }

                recordObj.commitLine({
                    sublistId: 'item'
                });
            }
        }

        return {
            getInputData: getInputData,
            reduce: reduce
        }
    }
);