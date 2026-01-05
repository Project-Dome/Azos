/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mario Augusto Braga Costa
 */
define(
    [
        'N/record',
        'N/file',
        'N/encode',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-date.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,
        file,
        encode,

        record_util,
        search_util,
        date_util
    ) {
        const TYPE = 'customrecord_pd_ai_doc_imp_nfse'
        const FIELDS = {
            id: { name: 'internalid' },
            subsidiary: { name: 'custrecord_pd_ai_din_subsidiaria', type: 'list' },
            urlNext: { name: 'custrecord_pd_ai_din_url_next' },
        };

        function getBySubsidiary(subsidiaryId) {
            return search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.subsidiary, 'anyof', subsidiaryId))
            });
        };

        function load(object) {
            return record.load({ type: TYPE, id: object.id, isDynamic: ifNullOrEmpty(object?.isDynamic, false) });
        }

        function save(record, options) {
            return record.save({
                ignoreMandatoryFields: ifNullOrEmpty(options?.ignore, false)
            })
        }


        function set(options) {
            let _documentImportation = {};

            _documentImportation[FIELDS.subsidiary.name] = options?.data?.subsidiary;
            _documentImportation[FIELDS.urlNext.name] = options?.data?.urlNext;

            return record_util
                .handler(options.record)
                .set(_documentImportation);
        }

        function create() {
            return record.create({ type: TYPE });
        }

        function setSubmit(options) {
            let _mapValues = {};

            options?.urlNext ? _mapValues[FIELDS.urlNext.name] = options.urlNext : null;

            return record.submitFields({
                type: TYPE,
                id: options.recordId,
                values: _mapValues
            });
        }

        return {
            getBySubsidiary: getBySubsidiary,
            create: create,
            save: save,
            set: set,
            setSubmit: setSubmit
        }
    }
);