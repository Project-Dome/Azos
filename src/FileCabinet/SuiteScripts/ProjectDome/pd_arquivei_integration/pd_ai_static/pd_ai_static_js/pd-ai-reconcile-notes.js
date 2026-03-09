const PROCESSING_RECORD_RESTLET = {
    script: 'customscript_pd_ai_conciliation_record',
    deployment: 'customdeploy_pd_ai_conciliation_record'
};

function reconcileNotes() {
    const indexSelectedLines = $('input[name="conciliation"]:checked').map(function () {
        return $(this).closest('tr').data('index');
    }).get();

    console.log('indexSelectedLines', indexSelectedLines);

    if (isNullOrEmpty(indexSelectedLines)) {
        $.modal({
            type: 'alert',
            title: '<i class="fa fa-check text-success"></i>Success!',
            message: 'Nenhuma nota configurada!'
        });

        return;
    }

    let mapData = []

    indexSelectedLines.forEach(function (index) {

        const currentRow = $(NFSE_TABLE_SELECTOR).bootstrapTable('getData')[index];

        const div = document.createElement('div');
        div.innerHTML = currentRow.conciliationType;
        const conciliationType = div.textContent;

        currentRow.conciliationType = conciliationType;

        mapData.push(currentRow);

        if (isNullOrEmpty(currentRow.purchaseOrder) && isNullOrEmpty(currentRow.vendor) && isNullOrEmpty(currentRow.item)) {
            $.modal({
                type: 'alert',
                title: '<i class="fa fa-exclamation-triangle text-danger"></i>Atenção!',
                message: 'As notas sem pedido de compra só podem ser conciliadas se Item e Fornecedor estiverem preenchidos!'
            });

            return false;
        }
    });

    console.log('mapData', mapData)

    $.modal({
        type: 'html',
        title: '<h5><i class="fa fa-pen text-info"></i>Confirmação</h5>',
        html: $('#confirmation-popup-template').html(),
        buttons: {
            cancel: {
                text: '<i class="fa fa-times text-danger"></i>Cancelar',
                isCloser: true,
            },
            confirm: {
                text: '<i id="1" class="fa fa-check text-success"></i>Confirmar',
                isCloser: true,
                action: function () {
                    var _transferLoading = loading('Conciliando Notas');

                    post({
                        restlet: PROCESSING_RECORD_RESTLET,
                        data: mapData,
                        onSuccess: function () {

                            $.modal({
                                type: 'alert',
                                title: '<i class="fa fa-check text-success"></i>Success!',
                                message: 'Processo de Conciliação iniciado!',
                                buttons: {
                                    ok: {
                                        text: 'OK',
                                        btnClass: 'btn-green',
                                        action: function () {
                                            window.location.reload();
                                        }
                                    },
                                }
                            });


                        },
                        onError: function (errorMessage) {
                            $.modal({
                                type: 'alert',
                                title: '<i class="fa fa-exclamation-triangle text-danger"></i>Attention!',
                                message: errorMessage
                            });
                        },
                        onComplete: function () {
                            saveFilters();

                            _transferLoading.modal('hide');

                            setTimeout(function () {
                                location.reload();
                            }, 3500);
                        }
                    });
                }
            }
        }
    })
};