/**
 * @NApiVersion 2.1
 * @NModuleScope public
 */
define(
    [
        'N/record',
        'N/search'
    ],
    function (
        record,
        search
    ) {
        let TYPE = 'itemreceipt';

        function get(parameters) {
            let _columns = [
                { name: 'quantity', function: 'round' },
                { name: 'item' },
                { name: 'name' },
                search.createColumn({
                    name: "line",
                    join: "appliedToTransaction",
                    label: "ID da linha"
                })
            ]

            let _itemReceiptList = search.create({
                type: TYPE,
                columns: _columns,
                filters: [
                    {
                        name: "createdfrom",
                        operator: "anyof",
                        values: parameters?.transactionId
                    },
                    {
                        name: 'mainline',
                        operator: 'is',
                        values: 'F'
                    }
                ]
            })
                .run()
                .getRange({
                    start: 0,
                    end: 100
                })

            log.audit({ title: '_itemReceiptList', details: _itemReceiptList });

            return _itemReceiptList;
        }

        function map(options) {
            let _map = {};

            if (options.by = 'resultSearch') {

                options.data.forEach(lineData => {
                    let _values = lineData.values;

                    let _orderNumber = _values["appliedToTransaction.line"];

                    let _key = `${_values?.item[0]?.value}|${_orderNumber}`;

                    if (_map[_key] == null) _map[_key] = parseFloat(_values.quantity)
                    else { _map[_key] += parseFloat(_values.quantity) }
                });
            }

            log.audit({ title: '_map', details: _map });

            return _map;
        }

        return {
            get: get,
            map: map
        }
    }
)