/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/record',
        'N/search',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,
        search,

        record_util,
        search_util
    ) {
        const TYPE = 'vendorbill';
        let FIELDS = {
            vendor: { name: 'entity', type: 'list' },
            date: { name: 'trandate', type: 'date' },
            orderLine: { name: 'line', join: 'appliedToTransaction' },
            createdFrom: { name: 'createdfrom' },
            location: { name: 'location' },
            rate: { name: 'rate' },
            class: { name: 'class' },
            department: { name: 'department' },
            subsidiary: { name: 'subsidiary' },
            quantity: { name: 'quantity' },
            valueTotal: { name: 'amount' },
            transactionNumber: { name: 'transactionnumber' },
            electronicDocument: { name: 'custbody_brl_tran_l_def_edoc_category' },
            operationNature: { name: 'custbody_brl_tran_l_transaction_nature' },
            vendorCnpj: { name: 'custbody_brl_tran_t_vendor_fed_tx_reg' },
            rpsSerie: { name: 'custbody_brl_tran_t_rps_series' },
            rpsNumber: { name: 'custbody_brl_tran_t_rps_num' },
            rpsDate: { name: 'custbody_brl_tran_dt_rps_date' },
            taxLine: { name: 'taxline' },

            // paymentTerms: { name: 'custbody_sit_t_desc_cond_pgto', type: 'list' },
            // edocCategory: { name: 'custbody_brl_tran_l_def_edoc_category' },
            // transactionNature: { name: 'custbody_brl_tran_l_transaction_nature' },

            mainLine: { name: 'mainline', onlyFilter: true },
            invoiceConciliation: { name: 'custrecord_pd_ai_nfse_concil_transac', join: 'custrecord_pd_ai_nfse_concil_transac' },
        };

        const ITEM_SUBLIST_ID = 'item';
        const ITEM_SUBLIST_FIELDS = {
            item: { name: 'item', type: 'list' },
            quantity: { name: 'quantity' },
            amount: { name: 'amount' },
            orderLine: { name: 'orderline' },
            rate: { name: 'rate' },
            location: { name: 'location' },
        };

        function getLineVendorBillByPO(poIds) {
            return search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.createdFrom, 'anyof', poIds))
                    .and(search_util.query(FIELDS.mainLine, 'is', 'F'))
                    .and(search_util.query(FIELDS.taxLine, 'is', 'F'))
                    .and(search_util.query(FIELDS.invoiceConciliation, 'anyof', '@NONE@'))
            });
        }

        function getVendorBillIsNotCreateByPO(vendorId, subsidiaryData, nfseValue) {
            FIELDS['isValidVendorBill'] = {
                name: 'formulatext',
                formula: "CASE WHEN {rate} >= " + nfseValue + " THEN 'T' WHEN {rate} < " + nfseValue + " THEN 'F' END"
            }

            return search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: buildQuery(vendorId, subsidiaryData)
            });

            function buildQuery(vendorId, subsidiaryData) {
                const _query = search_util
                    .where(search_util.query(FIELDS.createdFrom, 'anyof', '@NONE@'))
                    .and(search_util.query(FIELDS.mainLine, 'is', 'F'))
                    .and(search_util.query(FIELDS.taxLine, 'is', 'F'))
                    .and(search_util.query(FIELDS.invoiceConciliation, 'anyof', '@NONE@'))
                    .and(search_util.query(FIELDS.vendor, 'anyof', vendorId))

                if (!isNullOrEmpty(subsidiaryData)) {
                    _query.and(search_util.query(FIELDS.subsidiary, 'anyof', subsidiaryData.id));
                }

                return _query;
            }
        }

        function mapLines(linesVendorBill) {
            let _map = {};

            linesVendorBill.forEach(lineData => {

                if (_map[`${lineData.createdFrom}&${lineData.orderLine}`]) {
                    _map[`${lineData.createdFrom}&${lineData.orderLine}`].validInvoiceQuantity += 1;
                    _map[`${lineData.createdFrom}&${lineData.orderLine}`].vendorBillList.push(lineData.id);
                } else {
                    lineData.validInvoiceQuantity = 1;
                    lineData.vendorBillList = [].push(lineData.id);
                    _map[`${lineData.createdFrom}&${lineData.orderLine}`] = lineData
                }
            });

            return _map;
        }

        function create(options) {
            return record.create({ type: TYPE, isDynamic: ifNullOrEmpty(options?.isDynamic, false) });
        }

        function transformData(fromType, fromId) {
            const _record = record.transform({
                fromType: fromType,
                fromId: fromId,
                toType: TYPE,
                isDynamic: true
            });

            return _record;
        }

        function save(record, options) {
            return record.save({
                ignoreMandatoryFields: ifNullOrEmpty(options?.ignore, true)
            })
        }

        function set(options) {
            let _vendorBillSet = { sublists: {} };

            // DEV-866: só envia o campo quando vier preenchido, pra não apagar
            // valores que já existem na fatura (ex.: classe/departamento).
            const BODY_FIELDS = [
                'vendor', 'location', 'class', 'department',
                'electronicDocument', 'operationNature',
                'rpsSerie', 'rpsNumber', 'rpsDate'
            ];

            BODY_FIELDS.forEach(function (key) {
                const value = options.data?.[key];

                if (hasValue(value)) {
                    _vendorBillSet[FIELDS[key].name] = value;
                }
            });

            if (options.data.itemList) {
                _vendorBillSet.sublists[ITEM_SUBLIST_ID] = manageItemSubListData(options.data.itemList);
            }

            log.audit('_vendorBillSet', _vendorBillSet);

            const record = record_util
                .handler(options.record)
                .set(_vendorBillSet);

            return record
        }

        // Não usa isNullOrEmpty de propósito: 0 (ex.: rpsSerie) é valor válido.
        function hasValue(value) {
            if (value === null || value === undefined) return false;
            if (typeof value === 'string' && value.trim() === '') return false;
            if (Array.isArray(value) && value.length === 0) return false;
            return true;
        }

        function getPaymentStatus(vendorBillId) {
            const _lookup = search.lookupFields({
                type: TYPE,
                id: vendorBillId,
                columns: ['statusref', 'amountremaining', 'total']
            });

            const _status = _lookup?.statusref?.[0]?.value || _lookup?.statusref || '';
            const _total = Math.abs(parseFloat(_lookup?.total) || 0);
            const _remaining = Math.abs(parseFloat(_lookup?.amountremaining) || 0);

            return {
                status: _status,
                isPaidInFull: _status === 'paidInFull',
                isPartiallyPaid: _status !== 'paidInFull' && _total > 0 && _remaining < _total,
                total: _total,
                amountRemaining: _remaining
            };
        }

        function manageItemSubListData(itemList) {
            const mapItem = [];

            itemList.forEach(function (itemData) {
                let map = {};

                map[ITEM_SUBLIST_FIELDS.item.name] = itemData.item;
                map[ITEM_SUBLIST_FIELDS.rate.name] = itemData.rate;
                map[ITEM_SUBLIST_FIELDS.location.name] = itemData.location;

                mapItem.push(map);
            })

            log.audit('mapItem', mapItem);

            return mapItem;
        }

        function readData(options) {
            try {
                return record_util
                    .handler(options)
                    .data({
                        fields: FIELDS,
                        sublists: {
                            itemList: {
                                name: ITEM_SUBLIST_ID,
                                fields: ITEM_SUBLIST_FIELDS,
                            }
                        }
                    });
            } catch (error) {
                log.error({ title: 'readData - erro', details: error });
            }
        }

        function load(object) {
            return record.load({ type: TYPE, id: object.id, isDynamic: ifNullOrEmpty(object?.isDynamic, false) });
        }

        return {
            getVendorBillIsNotCreateByPO: getVendorBillIsNotCreateByPO,
            getLineVendorBillByPO: getLineVendorBillByPO,
            getPaymentStatus: getPaymentStatus,
            transformData: transformData,
            readData: readData,
            mapLines: mapLines,
            create: create,
            load: load,
            save: save,
            set: set
        };
    }
);
