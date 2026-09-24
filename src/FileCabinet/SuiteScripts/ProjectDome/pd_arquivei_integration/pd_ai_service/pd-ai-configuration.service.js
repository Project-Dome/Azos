/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        search_util
    ) {
        const TYPE = 'customrecord_pd_ai_configuration';
        const FIELDS = {
            enableManualLines: { name: 'custrecord_pd_ai_cfg_manual_lines_cb', type: 'checkbox' },
            deptLineLevel: { name: 'custrecord_pd_ai_cfg_dept_line_level_cb', type: 'checkbox' },
            deptBodyEdit: { name: 'custrecord_pd_ai_cfg_dept_body_edit_cb', type: 'checkbox' },
            classBodyEdit: { name: 'custrecord_pd_ai_cfg_class_body_edit_cb', type: 'checkbox' },
            vendorAlert: { name: 'custrecord_pd_ai_cfg_vendor_alert_cb', type: 'checkbox' }
        };

        function get() {
            return search_util.first({
                type: TYPE,
                columns: FIELDS
            });
        };

        return {
            get: get
        };
    }
);
