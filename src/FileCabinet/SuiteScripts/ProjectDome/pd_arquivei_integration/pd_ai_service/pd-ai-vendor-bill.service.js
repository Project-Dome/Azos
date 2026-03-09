/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/record',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,

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

            _vendorBillSet[FIELDS.vendor.name] = options.data?.vendor;
            _vendorBillSet[FIELDS.location.name] = options.data?.location;
            _vendorBillSet[FIELDS.class.name] = options.data?.class;
            _vendorBillSet[FIELDS.department.name] = options.data?.department;
            _vendorBillSet[FIELDS.electronicDocument.name] = options.data?.electronicDocument;
            _vendorBillSet[FIELDS.operationNature.name] = options.data?.operationNature;
            _vendorBillSet[FIELDS.rpsSerie.name] = options.data?.rpsSerie;
            _vendorBillSet[FIELDS.rpsNumber.name] = options.data?.rpsNumber;
            _vendorBillSet[FIELDS.rpsDate.name] = options.data?.rpsDate;

            if (options.data.itemList) {
                _vendorBillSet.sublists[ITEM_SUBLIST_ID] = manageItemSubListData(options.data.itemList);
            }

            log.audit('_vendorBillSet', _vendorBillSet);

            const record = record_util
                .handler(options.record)
                .set(_vendorBillSet);

            return record
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
