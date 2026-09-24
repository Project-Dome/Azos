const NFSE_RESTLET = {
    script: 'customscript_pd_ai_nfse_rt',
    deployment: 'customdeploy_pd_ai_nfse_rt'
};

const NFSE_TABLE_SELECTOR = '#nfse-list';

const NFSE_TABLE_COLUMNS = [
    // { name: 'status', title: 'Status De Conciliação' },
    { name: 'checkbox', title: 'conciliar', checkbox: true },
    { name: 'docNumber', title: 'Número da Nota' },
    { name: 'issueDate', title: 'Dt. da Emissão' },
    { name: 'vendorName', title: 'Nome Prestador' },
    { name: 'vendorCnpj', title: 'CNPJ Prestador' },
    { name: 'ncm', title: 'Código do Serviço' },
    { name: 'totalValueDisplay', title: 'Valor Total da Nota' },
    { name: 'item', title: 'Item De Conciliação' },
    { name: 'transactionConciliation', title: 'Transação De Conciliação' },
    { name: 'purchaseOrderLine', title: 'Linha do PCompra' },
    { name: 'location', title: 'Localização' },
    { name: 'class', title: 'Classe' },
    { name: 'department', title: 'Departamento' },
    { name: 'conciliationType', title: 'Tipo De Conciliação' },

    {
        name: 'checkbox', title: 'Configurado', align: 'center', formatter: function (value, row, index) {
            return `<input type="checkbox" id="chk_${row.docNumber}" name="conciliation" disabled>`;
        }
    },
    // { name: 'vendorName', title: 'Nome Prestador' },
    // { name: 'takerCnpj', title: 'CNPJ Tomador' },
    // { name: 'vendor', title: 'Fornecedor' },
    // { name: 'inverseQtdOrValueUnitDisplay', title: 'Inverter Qtde/Valor Unit' },
];


$(document).ready(function () {
    const filterCache = loadFilters();

    if (filterCache) {
        $("#vendor-cnpj-filter").val(filterCache.vendorCnpj);
        $("#subsidiary").data('value', filterCache.subsidiary);
        $("#doc-number-filter").val(filterCache.docNumber);
        $("#start-date-filter").val(filterCache.startDate);
        $("#end-date-filter").val(filterCache.endDate);
        $("#vendor-category-filter").data('value', filterCache.vendorCategory);

        applyFilter();
        deleteFilters();
    }
    $(document).on('change', 'input[name="btSelectItem"]', function () {
        const removeDataButtonElement = document.getElementById('remove-data-button');
        // const insertDataButtonElement = document.getElementById('insert-data-button');

        if (this.checked) {
            const line = getSelectedLines();
            const linePOData = linePO()

            const isConfiguration = document.getElementById(`chk_${line[0].docNumber}`);

            if (isConfiguration.checked) {
                removeDataButtonElement.hidden = false;
            } else {
                removeDataButtonElement.hidden = true;
            }

            if (linePOData.length > 0) {
                const itemCard = document.getElementById('item-card');

                if (linePOData[0].conciliationTypeCode == 'create_invoice_for_po') {
                    return itemCard.hidden = true;
                } else if (linePOData[0].conciliationTypeCode == 'reconcile_invoice') {
                    return itemCard.hidden = true;
                } else if (linePOData[0].conciliationTypeCode == 'reconcile_invoice_without_po') {
                    return itemCard.hidden = true;
                } else {
                    return itemCard.hidden = false;
                }
            }

        } else {
            removeDataButtonElement.hidden = true;
        }
    });
});

function applyMasks() {
    $('.date').mask('00/00/0000');
}

function clearFilter() {
    $('#filter-container').find('input').each(function () {
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

function saveFilters() {
    const filters = getFilters();
    localStorage.setItem('po_filters', JSON.stringify(filters));
}

function loadFilters() {
    const stored = localStorage.getItem('po_filters');
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Erro ao ler filtros do localStorage', e);
        return null;
    }
}

function deleteFilters() {
    localStorage.removeItem('po_filters');
}

function getFilters() {
    var _vendorCnpj = $("#vendor-cnpj-filter").val()
    var _subsidiary = $("#subsidiary").data('value')
    var _docNumber = $("#doc-number-filter").val()
    var _startDate = $("#start-date-filter").val()
    var _endDate = $("#end-date-filter").val()
    var _vendorCategory = $("#vendor-category-filter").data('value')

    if (!isNullOrEmpty(_startDate)) {
        if (!_startDate.isValidDate()) {
            throw `Data inválida: ${_startDate}`;
        }
    }

    if (!isNullOrEmpty(_endDate)) {
        if (!_endDate.isValidDate()) {
            throw `Data inválida: ${_endDate}`;
        }
    }

    var _filters = {
        vendorCnpj: _vendorCnpj,
        subsidiary: _subsidiary,
        docNumber: _docNumber,
        startDate: _startDate,
        endDate: _endDate,
        vendorCategory: _vendorCategory,
        page: 1
    };

    return _filters;
}

function applyFilter() {
    loadTable();
}

function loadTable() {
    var _loadingModal = loading('Carregando Notas - NFS-e...');
    var _parameters = getFilters();

    if (!_parameters.subsidiary) {
        _loadingModal.modal('hide');

        $.modal({
            type: 'alert',
            title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
            message: 'Campo Subsidiaria é obrigatorio!'
        });
        $('#card-body-nfse-list').empty();


        $('#card-body-nfse-list').append($('#awaiting-parameters-template').html());

        return
    }

    buildTable({
        id: NFSE_TABLE_SELECTOR,
        columns: NFSE_TABLE_COLUMNS,
        restlet: NFSE_RESTLET,
        parameters: _parameters,
        singleSelect: true,
        searchingText: 'Buscando Notas - NFS-e...',
        emptyDataMessage: 'Nenhuma Nota - NFS-e!',
        loadingText: 'Carregando Notas - NFS-e...',
        transform: transformData,
        beforeLoad: beforeLoad,
        onError: function () {
            _loadingModal.modal('hide');
        }
    });

    function beforeLoad() {
        _loadingModal.modal('hide');
    }
}

function transformData(lines) {
    console.log(lines);

    return lines.map(function (line, index) {
        return {
            index: index,
            documentImportation: 'nfse',
            docFileNfseId: line.internalid,
            checkbox: false,
            issueDate: line.issuedateiso.toDate({ type: 'iso' }).format({ type: 'pt-br' }),
            issueDateIso: line.issuedateiso,
            vendorName: line.corporatename || line.fantasyname,
            vendorCnpj: line.vendorcnpj,
            takerCnpj: line.takercnpj,
            totalValueDisplay: parseCurrency(line.amount),
            totalValue: parseCurrency(line.amount),
            docNumber: line.docnumber,
            purchaseOrderId: null,
            transactionConciliation: null,
            purchaseOrderLine: null,
            item: null,
            itemId: null,
            vendor: null,
            vendorId: null,
            inverseQtdOrValueUnit: null,
            inverseQtdOrValueUnitDisplay: null,
            paymentTerms: null,
            paymentTermsId: null,
            ncm: line.servicecode,
            conciliationTypeCode: null,
            locationId: null,
            location: null,
            departmentId: null,
            department: null,
            classId: null,
            class: null,
        }
    });
}

function parseCurrency(value) {
    var _floatValue = manageParseFloat(value);

    return _floatValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 1,
        maximumFractionDigits: 8
    }).replace('R$', '')
}

function manageParseFloat(value) {
    if (String(value).includes(",")) {
        return parseFloat(value.replaceAll(".", "").replace(",", "."));
    } else {
        return parseFloat(value);
    }
}

function getSelectedLines() {
    var _selectedServicesNotes = $(NFSE_TABLE_SELECTOR).selectedRows();
    console.info('_selectedServicesNotes', _selectedServicesNotes);

    if (_selectedServicesNotes.length <= 0) {
        $.modal({
            type: 'alert',
            title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
            message: 'Selecione ao menos 1 linha!'
        });

        return false;
    };

    if (_selectedServicesNotes.length > 1) {
        $.modal({
            type: 'alert',
            title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
            message: 'Selecione 1 nota por vez!'
        });

        return false;
    };

    return _selectedServicesNotes
};

async function updateLineNFSe(line, vendorData) {
    const checkedIds = $(NFSE_TABLE_SELECTOR)
        .find('input[name="conciliation"]:checked')
        .map(function () {
            return this.id;
        })
        .get();

    let _purchaseOrderData = getValuesPurchaseOrderLine();

    let _valuesData = {
        itemName: $('#item-card option:selected').text(),
        itemId: $("#item-card").val(),
        location: $('#location option:selected').text(),
        locationId: $("#location").val(),
        class: $('#class option:selected').text(),
        classId: $("#class").val(),
        department: $('#department option:selected').text(),
        departmentId: $("#department").val(),
    }

    // if (window['configurationConciliation']) {
    //     window['configurationConciliationNfse'].nfse = {}
    //     window['configurationConciliationNfse'].nfse = {}
    // } else {

    // }

    $(NFSE_TABLE_SELECTOR).bootstrapTable('updateRow', {
        index: line.index,
        row: {
            item: !document.getElementById('item-card').hidden ? _valuesData.itemName : null,
            itemId: !document.getElementById('item-card').hidden ? _valuesData.itemId : null,
            location: _valuesData.location,
            locationId: _valuesData.locationId,
            class: _valuesData.class,
            classId: _valuesData.classId,
            department: _valuesData.department,
            departmentId: _valuesData.departmentId,
            vendorId: vendorData.id,
            checkbox: false,
            conciliationType: _purchaseOrderData.conciliationType,
            conciliationTypeCode: _purchaseOrderData.conciliationTypeCode,
            purchaseOrderId: _purchaseOrderData?.purchaseOrderId || null,
            transactionConciliation: _purchaseOrderData?.transactionNumber || null,
            purchaseOrderLine: _purchaseOrderData?.purchaseOrderLine || null,
            purchaseOrderItemLine: _purchaseOrderData?.purchaseOrderItemLine || null
        }
    });

    checkedIds.forEach(id => {
        document.getElementById(id)?.setAttribute('checked', true);
    });

    document.getElementById(`chk_${line.docNumber}`).checked = true;
}

function formatNcm(ncm) {
    if (ncm) {
        return ncm.replace(/\./g, "");
    }
};