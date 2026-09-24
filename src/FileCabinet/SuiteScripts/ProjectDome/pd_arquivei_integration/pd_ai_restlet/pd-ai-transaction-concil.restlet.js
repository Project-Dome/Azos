/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @author Project Dome - Mário Augusto Braga Costa
 */

define(
    [
        'N/log',
        'N/query',

        '../pd_ai_service/pd-ai-item-receipt.service',
        '../pd_ai_service/pd-ai-vendor.service',
        '../pd_ai_service/pd-ai-vendor-bill.service',
        '../pd_ai_service/pd-ai-subsidiary.service',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        log,
        sql_query,

        item_receipt_service,
        vendor_service,
        vendor_bill_service,
        subsidiary_service
    ) {
        const STATUS_APPROVED = 2;
        const STATUS_OTHER_THAN_CLOSED = 'PurchOrd:H';

        function getHandler(parameters) {
            return getPurchaseOrderList(parameters);
        }

        function getPurchaseOrderList(parameters) {
            let _purchaseOrderList = [];

            let _vendor = vendor_service.getByCNPJ(formatCNPJ(parameters.vendorCnpj));

            if (!_vendor) {
                log.error({ title: 'Não foi possível localizar o fornecedor correspondente.', details: parameters.vendorCnpj });

                throw new Error(`Não foi possível localizar o fornecedor correspondente com o cnpj informado. ${formatCNPJ(parameters.vendorCnpj)}`);
            }

            const _query = buildQuery(parameters);

            const _pagedData = sql_query.runSuiteQLPaged({
                query: _query,
                pageSize: 1000
            });

            let _purchaseOrderId = [];

            _pagedData.pageRanges.map(function (pageRange) {
                var _pageResult = _pagedData.fetch(pageRange.index);
                var _pageResultLines = _pageResult.data.results;

                _pageResultLines.forEach(function (resultLine) {
                    var _values = resultLine.values;

                    _purchaseOrderId.push(_values[0]);

                    _purchaseOrderList.push({
                        id: _values[0],
                        transactionNumber: _values[1],
                        status: _values[2],
                        line: _values[3],
                        itemId: _values[4],
                        itemName: _values[5],
                        quantity: _values[6],
                        valueTotal: _values[7],
                        description: _values[8],
                        ncm: _values[9],
                        quantityBilled: _values[10],
                        isItemReceipt: _values[11],
                        rate: _values[12]
                    });
                });
            });

            // log.audit({ title: '_purchaseOrderList', details: _purchaseOrderList });

            // if (_purchaseOrderList == '') return [{
            //     transactionNumber: null,
            //     status: null,
            //     line: null,
            //     itemId: null,
            //     itemName: null,
            //     quantity: 1,
            //     valueTotal: manageParseFloat(parameters.totalValue),
            //     description: null,
            //     ncm: null,
            //     quantityBilled: null,
            //     isItemReceipt: null,
            //     quantityReceipt: null,
            //     eligibilityValidate: true,
            //     quantityAvailable: 1,
            //     conciliationTypeCode: 'create_invoice'
            // }];

            log.audit({
                title: 'data',
                details: {
                    vendor: _vendor.id,
                    taler: parameters?.takerCnpj ?
                        subsidiary_service.getByCnpj(formatCNPJ(parameters.takerCnpj))
                        : null,
                    total: manageParseFloat(parameters.totalValue)
                }
            })

            const linesVendorBillIsNotCreatedFrom = vendor_bill_service.getVendorBillIsNotCreateByPO(
                _vendor.id,
                parameters?.takerCnpj ?
                    subsidiary_service.getByCnpj(formatCNPJ(parameters.takerCnpj))
                    : null,
                manageParseFloat(parameters.totalValue)
            );

            // log.audit({ title: 'mapLinesVendorBill', details: mapLinesVendorBill });

            // let _itemList = item_receipt_service.get({
            //     transactionId: _purchaseOrderId
            // });
            // log.audit({ title: '_itemList', details: _itemList });

            // const _newObjectFields = JSON.parse(JSON.stringify(_itemList));
            // let _mapItemReceiptList = item_receipt_service.map({
            //     data: _newObjectFields,
            //     by: 'resultSearch'
            // });
            // log.audit({ title: '_mapItemReceiptList', details: _mapItemReceiptList });

            let _itemsList = []

            if (!isNullOrEmpty(_purchaseOrderList)) {

                const linesVendorBill = vendor_bill_service.getLineVendorBillByPO(_purchaseOrderId);
                const mapLinesVendorBill = vendor_bill_service.mapLines(linesVendorBill);

                _purchaseOrderList.forEach(function (purchaseLine, index) {
                    let _isValidVendorBill = mapLinesVendorBill[`${purchaseLine.id}&${purchaseLine.line}`];
                    // let _receipt = _mapItemReceiptList[`${purchaseLine.itemId}|${purchaseLine.line}`];
                    // let _notHasItemReceipt = _receipt == null || _receipt == undefined || _receipt == '';

                    // log.audit({ title: 'purchaseLine', details: purchaseLine });
                    // log.audit({ title: 'HasVendorBillSemConciliation', details: _isValidVendorBill });

                    if (purchaseLine.quantityBilled > 0) {
                        if (_isValidVendorBill) {
                            let newObject = JSON.parse(JSON.stringify(purchaseLine));

                            newObject.conciliationTypeCode = 'reconcile_invoice';
                            newObject.validInvoiceQuantity = _isValidVendorBill.validInvoiceQuantity;

                            _itemsList.push(newObject);
                        }
                    }
                    if (purchaseLine.quantityBilled < purchaseLine.quantity) {
                        purchaseLine.conciliationTypeCode = 'create_invoice_for_po';
                        purchaseLine.validInvoiceQuantity = purchaseLine.quantity - purchaseLine.quantityBilled;

                        _itemsList.push(purchaseLine);
                    }

                    // if (purchaseLine.isItemReceipt == 'T') {
                    //     if (_notHasItemReceipt) {
                    //         _purchaseOrderList[index]['quantityReceipt'] = 0;
                    //         _purchaseOrderList[index]['eligibilityValidate'] = (0 - parseFloat(purchaseLine.quantityBilled)) > 0;
                    //         _purchaseOrderList[index]['quantityAvailable'] = (0 - parseFloat(purchaseLine.quantityBilled));

                    //         _itemsList.push(purchaseLine)
                    //     } else {
                    //         _purchaseOrderList[index]['quantityReceipt'] = _receipt;
                    //         _purchaseOrderList[index]['eligibilityValidate'] = (_receipt - parseFloat(purchaseLine.quantityBilled)) > 0;
                    //         _purchaseOrderList[index]['quantityAvailable'] = (_receipt - parseFloat(purchaseLine.quantityBilled));

                    //         _itemsList.push(purchaseLine)
                    //     }
                    // }
                    // else {

                    //     _purchaseOrderList[index]['quantityReceipt'] = '-';
                    //     _purchaseOrderList[index]['eligibilityValidate'] = true //parseFloat(purchaseLine.quantity) - parseFloat(purchaseLine.quantityBilled) > 0;
                    //     // _purchaseOrderList[index]['quantityAvailable'] = parseFloat(purchaseLine.quantity) - parseFloat(purchaseLine.quantityBilled);
                    //     // _purchaseOrderList[index]['valueTotalConciliation'] = parseFloat(purchaseLine.rate) * (_receipt - parseFloat(purchaseLine.quantityBilled));
                    //     _itemsList.push(purchaseLine)
                    // }
                });
            }

            if (!isNullOrEmpty(linesVendorBillIsNotCreatedFrom)) {

                linesVendorBillIsNotCreatedFrom.forEach(function (lineData) {
                    lineData.conciliationTypeCode = 'reconcile_invoice_without_po';

                    _itemsList.push(lineData);
                });
            }

            _itemsList.push({
                transactionNumber: null,
                status: null,
                line: null,
                itemId: null,
                itemName: null,
                quantity: 1,
                valueTotal: manageParseFloat(parameters.totalValue),
                description: null,
                ncm: null,
                quantityBilled: null,
                isItemReceipt: null,
                quantityReceipt: null,
                eligibilityValidate: true,
                quantityAvailable: 1,
                conciliationTypeCode: 'create_invoice'
            })

            log.audit({ title: '_itemsList', details: _itemsList });

            return _itemsList;

            function buildQuery(parameters) {
                log.audit('parameters of the purchase order', parameters)
                return `
                    select
                        t.id as purchaseorderId,
                        t.transactionnumber as transactionnumber,
                        ts.name as status,
                        tl.id,
                        tl.item as itemId,
                        i.fullname as name,
                        tl.quantity,
                        tl.netamount as amount,
                        tl.memo,
                        ncmItem.custrecord_fte_itemcode_t_code,
                        tl.quantitybilled,
                        i.isfulfillable,
                        tl.rate
                    from
                        transaction as t
                        inner join transactionstatus ts ON t.status = ts.id and t.type = ts.trantype
                        inner join vendor as v on v.id = t.entity and v.custentity_brl_entity_t_fed_tax_reg = '${formatCNPJ(parameters.vendorCnpj)}'
                        inner join transactionline as tl on(
                            t.id = tl.transaction
                            AND tl.mainline = 'F'
                            AND tl.taxline = 'F'
                            AND tl.item is not null
                            AND tl.isclosed = 'F'
                            AND ( 
                                tl.rate = ${manageParseFloat(parameters.totalValue)} 
                                    OR tl.netamount = ${manageParseFloat(parameters.totalValue)} 
                                )
                            )
                        inner join subsidiary as s on s.id = tl.subsidiary and s.custrecord_brl_subsd_t_fed_tx_reg = '${formatCNPJ(parameters.takerCnpj)}'
                        inner join item as i on(
                            tl.item = i.id
                        )
                        left outer join customrecord_fte_itemcode as ncmItem on(
                            i.custitem_fte_item_l_itemcode = ncmItem.id
                        )
                    where
                        recordtype = 'purchaseorder'
                        -- AND t.id = 801
                        AND ( 
                            approvalstatus = ${STATUS_APPROVED}
                            OR approvalstatus IS NULL
                        )
                        AND
                            status != '${STATUS_OTHER_THAN_CLOSED}'
                        AND
                            t.entity = v.id
                    `;
            }
        }

        function formatCNPJ(cnpj) {
            cnpj = cnpj.replace(/\D/g, '');

            cnpj = cnpj.replace(/^(\d{2})(\d)/, '$1.$2');
            cnpj = cnpj.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            cnpj = cnpj.replace(/\.(\d{3})(\d)/, '.$1/$2');
            cnpj = cnpj.replace(/(\d{4})(\d)/, '$1-$2');

            return String(cnpj);
        };

        function manageParseFloat(value) {
            if (String(value).includes(",")) {
                return parseFloat(value.replaceAll(".", "").replace(",", "."));
            } else {
                return parseFloat(value);
            }
        }

        return {
            get: getHandler
        }
    }
)
