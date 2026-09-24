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
        const TYPE = 'customrecord_pd_ai_nfse_conciliation';
        const FIELDS = {
            status: { name: 'custrecord_pd_ai_nc_status', type: 'list' },
            nfse: { name: 'custrecord_pd_ai_nc_nfse', type: 'list' },
            errorMessage: { name: 'custrecord_pd_ai_nc_error_message' },
            reprocessing: { name: 'custrecord_pd_ai_nc_reprocessing', type: 'checkbox' },
            issueDate: { name: 'custrecord_pd_ai_nc_issue_date', type: 'date' },
            vendor: { name: 'custrecord_pd_ai_nc_vendor', type: 'list' },
            totalValue: { name: 'custrecord_pd_ai_nc_total_value' },
            purchaseOrder: { name: 'custrecord_pd_ai_nc_po', type: 'list' },
            purchaseOrderLine: { name: 'custrecord_pd_ai_nc_po_line' },
            item: { name: 'custrecord_pd_ai_nc_item', type: 'list' },
            invoice: { name: 'custrecord_pd_ai_nc_invoice', type: 'list' },
            conciliationType: { name: 'custrecord_pd_ai_nc_conciliation_type', type: 'list' },
            conciliationTypeCode: { name: 'custrecord_pd_ai_ct_code', join: 'custrecord_pd_ai_nc_conciliation_type' },
            location: { name: 'custrecord_pd_ai_nc_location' },
            class: { name: 'custrecord_pd_ai_nc_class' },
            department: { name: 'custrecord_pd_ai_nc_department' }
            // serviceCode: { name: 'custrecord_pd_ai_pnfse_service_code' },
            // inverseQtdOrValueUnit: { name: 'custrecord_pd_ai_pnfse_inv_qtd_value', type: 'checkbox' },
            // paymentTerms: { name: 'custrecord_pd_ai_pnfse_payment_terms', type: 'list' },
            // rpsSerie: { name: 'custrecord_pd_ai_nfse_rps_serie', join: 'custrecord_pd_ai_pnfse_nfse_file' },
            // rpsNumber: { name: 'custrecord_pd_ai_nfse_rps_number', join: 'custrecord_pd_ai_pnfse_nfse_file' }
        };
        const STATUS = {
            concluded: 1,
            error: 2,
            pending: 3
        };

        const CONCILIATION_TYPE_ID = {
            receipt_to_invoice: 1,
            create_invoice_for_po: 2,
            reconcile_invoice: 3,
            create_invoice: 4,
            reconcile_invoice_without_po: 5
        }

        function load(object) {
            return record.load({ type: TYPE, id: object.id, isDynamic: ifNullOrEmpty(object?.isDynamic, false) });
        }

        function save(record, options) {
            return record.save({
                ignoreMandatoryFields: ifNullOrEmpty(options?.ignore, false)
            })
        }

        function set(options) {
            const _nFseData = {};

            _nFseData[FIELDS.status.name] = options.data?.status;
            _nFseData[FIELDS.nfse.name] = options.data?.nfse;
            _nFseData[FIELDS.errorMessage.name] = options.data?.errorMessage;
            _nFseData[FIELDS.reprocessing.name] = options.data?.reprocessing;
            _nFseData[FIELDS.issueDate.name] = options.data?.issueDate;
            _nFseData[FIELDS.vendor.name] = options.data?.vendor;
            _nFseData[FIELDS.totalValue.name] = options.data?.totalValue;
            _nFseData[FIELDS.purchaseOrder.name] = options.data?.purchaseOrder;
            _nFseData[FIELDS.purchaseOrderLine.name] = options.data?.purchaseOrderLine;
            _nFseData[FIELDS.item.name] = options.data?.item
            _nFseData[FIELDS.conciliationType.name] = options.data?.conciliationType;
            _nFseData[FIELDS.location.name] = options.data?.location;
            _nFseData[FIELDS.class.name] = options.data?.class;
            _nFseData[FIELDS.department.name] = options.data?.department;
            _nFseData[FIELDS.invoice.name] = options.data?.invoice;
            // _nFseData[FIELDS.vendorName.name] = options.vendorName;
            // _nFseData[FIELDS.vendorCnpj.name] = options.vendorCnpj;
            // _nFseData[FIELDS.serviceCode.name] = options.serviceCode;
            // _nFseData[FIELDS.inverseQtdOrValueUnit.name] = options.inverseQtdOrValueUnit;
            // _nFseData[FIELDS.paymentTerms.name] = options.paymentTermsId;

            return record_util
                .handler(options.record)
                .set(_nFseData)
        }

        function create() {
            return record.create({ type: TYPE });
        }

        function setSubmit(options) {
            let _mapValues = {};

            options?.status ? _mapValues[FIELDS.status.name] = options.status : null;
            options?.invoice ? _mapValues[FIELDS.invoice.name] = options.invoice : null;
            options?.errorMessage !== null && options?.errorMessage !== undefined ? _mapValues[FIELDS.errorMessage.name] = options.errorMessage : null;
            options?.reprocessing ? _mapValues[FIELDS.reprocessing.name] = options.reprocessing : null;

            log.audit({ title: '_mapValues', details: _mapValues });

            return record.submitFields({
                type: TYPE,
                id: options.recordId,
                values: _mapValues
            });
        }

        function getProcessRecord() {
            return search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: buildQuery()
            });

            function buildQuery() {
                let _query = search_util
                    .where(search_util.query(FIELDS.status, 'anyof', STATUS.pending))
                    .or(search_util.query(FIELDS.reprocessing, 'is', true))

                return _query
            }
        }

        return {
            create: create,
            getProcessRecord: getProcessRecord,
            setSubmit: setSubmit,
            set: set,
            save: save,
            load: load,
            status: STATUS,
            CONCILIATION_TYPE_ID: CONCILIATION_TYPE_ID
        };
    }
);
