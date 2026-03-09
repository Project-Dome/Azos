const TRANSACTIONS_FOR_CONCILIATION = {
    script: 'customscript_pd_ai_transaction_conc_rt',
    deployment: 'customdeploy_pd_ai_transaction_conc_rt'
};

const ITEM_RESTLET = {
    script: 'customscript_pd_ai_item_rt',
    deployment: 'customdeploy_pd_ai_item_rt'
};

const LOCATION_RESTLET = {
    script: 'customscript_pd_ai_location_rt',
    deployment: 'customdeploy_pd_ai_location_rt'
};

const CLASS_RESTLET = {
    script: 'customscript_pd_ai_class_rt',
    deployment: 'customdeploy_pd_ai_class_rt'
};

const DEPARTMENT_RESTLET = {
    script: 'customscript_pd_ai_department_rt',
    deployment: 'customdeploy_pd_ai_department_rt'
};

const PURCHASE_ORDER_LINE_TABLE = '#purchase-order-line-list';

const PURCHASE_ORDER_COLUMNS = [
    {
        name: 'checkbox',
        checkbox: true,
        formatter: function checkboxFormatter(value, row, index) {
            return { checked: false, disabled: row.isDisabled };
        }
    },
    { name: 'transactionNumber', title: 'Número Da Transação' },
    { name: 'status', title: 'Status' },
    { name: 'line', title: 'Linha' },
    { name: 'itemName', title: 'Item' },
    { name: 'quantity', title: 'Quantidade' },
    { name: 'valueTotalDisplay', title: 'Valor Total' },
    { name: 'rate', title: 'Valor Unitário' },
    { name: 'description', title: 'Descrição' },
    { name: 'quantityBilled', title: 'Faturado' },
    { name: 'quantityReceipt', title: 'Recebido' },
    { name: 'attention', title: 'Atenção' },
];

function clearFilterCardBoard() {
    $('#filter-container-card').find('input').each(function () {
        let _element = $(this);
        let _isAutoComplete = _element.is('.autocomplete');

        if (_isAutoComplete) {
            _element
                .data('value', '')
                .trigger('data-value-changed');
        }

        _element.val('');
    });
}

function getFiltersCard() {
    var _purchaseOrderFilter = $("#purchase-order-filter").val();
    var _vendor = $("#vendor-card").data('value');
    var _filters = {
        purchaseOrderFilter: _purchaseOrderFilter,
        vendor: _vendor,
        page: 1
    };

    return _filters;
}

function loadCardTable(selectedLines) {
    buildTable({
        id: PURCHASE_ORDER_LINE_TABLE,
        columns: PURCHASE_ORDER_COLUMNS,
        restlet: TRANSACTIONS_FOR_CONCILIATION,
        parameters: selectedLines[0],
        singleSelect: true,
        searchingText: 'Buscando Linhas do Pedido...',
        emptyDataMessage: 'Nenhuma linha',
        loadingText: 'Carregando Linhas do Pedido...',
        transform: transformDataCardBoard
    });
}

function transformDataCardBoard(lines) {
    console.log(lines);

    return lines.map(function (line, lineIndex) {
        return {
            quantityBilled: line.quantityBilled,
            quantityAvailable: line.quantityAvailable,
            quantityReceipt: line.quantityReceipt,
            // eligibilityValidate: line.eligibilityValidate,
            isDisabled: line?.isValidVendorBill == "F" ? true : false,
            attention: manageMessage(line),
            lineIndex: lineIndex,
            id: line.id,
            transactionNumber: line.transactionNumber,
            status: line.status,
            line: line.line,
            itemName: line.itemName,
            itemId: line.itemId,
            quantity: line.quantity,
            valueTotalDisplay: parseFloat(line.valueTotal).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }),
            rate: parseFloat(ifNullOrEmpty(line?.rate, 0))?.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }),
            valueTotal: line.valueTotal,
            description: line.description || '-',
            ncm: line.ncm,
            conciliationTypeCode: line.conciliationTypeCode
        }
    });
}

function manageMessage(line) {
    // if (line.isItemReceipt == 'T') {
    //     return '<p style="color: green;">Tem recebimento para Faturar</p>'
    // } 
    if (line.conciliationTypeCode == 'create_invoice_for_po') {
        return '<p style="color: green;">Criar a fatura para a PO e conciliar a nota</p>'
    }
    else if (line.conciliationTypeCode == 'reconcile_invoice_without_po') {
        return '<p style="color: green;">Conciliar a Fatura</p>'
    } else if (line.conciliationTypeCode == 'reconcile_invoice') {
        return '<p style="color: green;">Tem faturamento para Conciliar</p>'
    } else {
        return '<p style="color: green;">Criar a fatura e conciliar a nota</p>'
    }
}

// function manageCode(line) {
//     // if (line.isItemReceipt == 'T') {
//     //     return 'receipt_to_invoice'
//     // } 
//     if (line.isItemReceipt == 'F' && line.quantityBilled == 0) {
//         return 'create_invoice_for_po'
//     } else if (line.isItemReceipt == 'F' && line.quantityBilled > 0) {
//         return 'reconcile_invoice'
//     } else {
//         return 'create_invoice'
//     }
// }

function linePO() {
    let _selectedPurchaseOrderLine = $(PURCHASE_ORDER_LINE_TABLE).selectedRows();

    const div = document.createElement('div');
    div.innerHTML = _selectedPurchaseOrderLine.attention;
    const conciliationType = div.textContent;

    _selectedPurchaseOrderLine.attention = conciliationType;

    return _selectedPurchaseOrderLine
};

function getValuesPurchaseOrderLine(type) {
    let _selectedPurchaseOrderLine = linePO();

    if (_selectedPurchaseOrderLine.length <= 0) {
        $.modal({
            type: 'alert',
            title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
            message: 'Selecione ao menos 1 linha!'
        });

        return false;
    };

    console.log('_selectedPurchaseOrderLine', _selectedPurchaseOrderLine);

    let _purchaseOrderData = {}

    _purchaseOrderData['purchaseOrderId'] = _selectedPurchaseOrderLine[0].id;
    _purchaseOrderData['transactionNumber'] = _selectedPurchaseOrderLine[0].transactionNumber;
    _purchaseOrderData['purchaseOrderLine'] = _selectedPurchaseOrderLine[0].line;
    _purchaseOrderData['purchaseOrderItemLine'] = _selectedPurchaseOrderLine[0].itemId;
    _purchaseOrderData['purchaseOrderItemNcm'] = _selectedPurchaseOrderLine[0].ncm;
    _purchaseOrderData['purchaseOrderItemValue'] = _selectedPurchaseOrderLine[0].valueTotal;
    _purchaseOrderData['conciliationType'] = _selectedPurchaseOrderLine[0].attention;
    _purchaseOrderData['conciliationTypeCode'] = _selectedPurchaseOrderLine[0].conciliationTypeCode;

    console.log('_purchaseOrderData', _purchaseOrderData)

    if (type === 'nfe') {
        _selectedPurchaseOrderLine[0].vendor = $("#vendor-card").data('value');
        return _selectedPurchaseOrderLine
    };

    return _purchaseOrderData
}

function removeData() {
    let _selectedNotesList = getSelectedLines();
    if (!_selectedNotesList) return;

    removeReconciliationConfiguration(_selectedNotesList[0])
}

function removeReconciliationConfiguration(nfData) {
    switch (nfData.documentImportation) {
        case 'nfse':
            remove(nfData)
            break;
        case 'nfe':
            updateLineNFe(nfData.index, nfData.file);
            break;
        case 'cte':
            updateLineCTe(nfData.index)
            break;
    }

    function remove(nfData) {
        const checkedIds = $(NFSE_TABLE_SELECTOR)
            .find('input[name="conciliation"]:checked')
            .map(function () {
                return this.id;
            })
            .get();

        $(NFSE_TABLE_SELECTOR).bootstrapTable('updateRow', {
            index: nfData.index,
            row: {
                location: null,
                locationId: null,
                class: null,
                classId: null,
                department: null,
                departmentId: null,
                item: null,
                itemId: null,
                vendorId: null,
                checkbox: false,
                conciliationType: '-',
                purchaseOrderId: null,
                purchaseOrder: null,
                purchaseOrderLine: null,
                purchaseOrderItemLine: null
            }
        });

        checkedIds.forEach(id => {
            document.getElementById(id)?.setAttribute('checked', true);
        });

        document.getElementById(`chk_${nfData.docNumber}`).checked = false;

        const removeDataButtonElement = document.getElementById('remove-data-button');
        removeDataButtonElement.hidden = true;
    }
}

async function openValueEntry() {
    let _selectedNotesList = getSelectedLines();
    if (!_selectedNotesList) return;

    const vendorData = await getVendorByCNPJ(_selectedNotesList[0].vendorCnpj);
    if (!vendorData) return;

    loadLocation();
    loadDepartment();
    loadClass();

    $.modal({
        type: 'html',
        title: '<h5>⚙️ Configurar PO</h5>',
        html: $('#enter-values-po-template').html(),
        size: 'extra-large',
        ready: function (modal) {
            manageAutocompleteElements(modal);
            // loadLocation();
            loadItem();
            loadCardTable(_selectedNotesList);
        },
        buttons: {
            cancel: {
                text: '<i class="fa fa-times text-danger"></i>Cancelar',
                isCloser: true,
            },
            confirm: {
                text: '<i id="1" class="fa fa-check text-success"></i>Confirmar',
                isCloser: true,
                action: function () {
                    if (!$("#location").val()) {
                        $.modal({
                            type: 'alert',
                            title: '<i class="fa fa-exclamation-triangle text-danger"></i> Atenção!',
                            message: 'Por favor, selecione a localização antes de continuar.'
                        });
                        return;
                    }

                    if (!document.getElementById('item-card').hidden && !$("#item-card").val()) {
                        $.modal({
                            type: 'alert',
                            title: '<i class="fa fa-exclamation-triangle text-danger"></i> Atenção!',
                            message: 'Por favor, selecione um item antes de continuar.'
                        });
                        return;
                    }


                    manageUpdateLine(_selectedNotesList, vendorData);

                    const removeDataButtonElement = document.getElementById('remove-data-button');
                    removeDataButtonElement.hidden = true;
                }
            }
        }
    });

    function manageUpdateLine(selectedNotesList, vendorData) {
        selectedNotesList.forEach(function (line) {
            switch (line.documentImportation) {
                case 'nfse':
                    updateLineNFSe(line, vendorData);
                    break;
                case 'nfe':
                    updateLineNFe(line.index, line.file);
                    break;
                case 'cte':
                    updateLineCTe(line.index)
                    break;
            }
        });
    }
};

function loadLocation() {
    const _parameters = getFilters();

    get({
        restlet: LOCATION_RESTLET,
        parameters: {
            subsidiary: _parameters.subsidiary
        },
        onSuccess: function (response) {
            $("#location").empty();
            $("#location").append(`<option value="">Selecione uma localização...</option>`);

            $.each(response, function (index, itemData) {
                $("#location").append(`<option value="${itemData.id}">${itemData.name}</option>`);
            });
        },
        onError: function (errorData) {
            const errorMessage = JSON.parse(errorData)?.error?.message || 'Erro desconhecido.';
            $.modal({
                type: 'alert',
                title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
                message: errorMessage
            });
        },
        onComplete: function () {
        }
    });
}

function loadDepartment() {
    const _parameters = getFilters();

    get({
        restlet: DEPARTMENT_RESTLET,
        parameters: {
            subsidiary: _parameters.subsidiary
        },
        onSuccess: function (response) {
            $("#department").empty();
            $("#department").append(`<option value="">Selecione um departamento...</option>`);

            $.each(response, function (index, itemData) {
                $("#department").append(`<option value="${itemData.id}">${itemData.name}</option>`);
            });
        },
        onError: function (errorData) {
            const errorMessage = JSON.parse(errorData)?.error?.message || 'Erro desconhecido.';
            $.modal({
                type: 'alert',
                title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
                message: errorMessage
            });
        },
        onComplete: function () {
        }
    });
}

function loadClass() {
    const _parameters = getFilters();

    get({
        restlet: CLASS_RESTLET,
        parameters: {
            subsidiary: _parameters.subsidiary
        },
        onSuccess: function (response) {
            $("#class").empty();
            $("#class").append(`<option value="">Selecione uma classe...</option>`);

            $.each(response, function (index, itemData) {
                $("#class").append(`<option value="${itemData.id}">${itemData.name}</option>`);
            });
        },
        onError: function (errorData) {
            const errorMessage = JSON.parse(errorData)?.error?.message || 'Erro desconhecido.';
            $.modal({
                type: 'alert',
                title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
                message: errorMessage
            });
        },
        onComplete: function () {
        }
    });
}

function loadItem() {
    const nfseData = $(NFSE_TABLE_SELECTOR).selectedRows();

    console.log('nfseData', nfseData);

    get({
        restlet: ITEM_RESTLET,
        parameters: {
            conciliation: SUITELET_PARAMETERS.conciliation,
            taker: nfseData[0].takerCnpj
        },
        onSuccess: function (response) {
            $("#item-card").empty();
            $("#item-card").append(`<option value="">Selecione um item...</option>`);

            $.each(response, function (index, itemData) {
                $("#item-card").append(`<option value="${itemData.id}">${itemData.name}</option>`);
            });
        },
        onError: function (errorData) {
            const errorMessage = JSON.parse(errorData)?.error?.message || 'Erro desconhecido.';
            $.modal({
                type: 'alert',
                title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
                message: errorMessage
            });
        },
        onComplete: function () {
        }
    });
}

const GET_VENDOR_RESTLET = {
    script: 'customscript_pd_ai_vendor_rt',
    deployment: 'customdeploy_pd_ai_vendor_rt'
};

function getVendorByCNPJ(vendorCNPJ) {
    return new Promise((resolve, reject) => {
        get({
            restlet: GET_VENDOR_RESTLET,
            parameters: { vendorCNPJ },
            onSuccess: function (response) {
                resolve(response);
            },
            onError: function (errorData) {
                const errorMessage = JSON.parse(errorData)?.error?.message || 'Erro desconhecido.';
                $.modal({
                    type: 'alert',
                    title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
                    message: errorMessage
                });
                reject(errorMessage);
            },
            onComplete: function () {
            }
        });
    });
}