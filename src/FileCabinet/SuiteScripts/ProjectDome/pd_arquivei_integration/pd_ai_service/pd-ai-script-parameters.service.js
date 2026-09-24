/**
 * @NApiVersion 2.1
 * @ModuleScope public
 * @author Project Dome - Mário AUgusto Braga Costa
 */
define(
    [
        'N/runtime'
    ],
    function (
        runtime
    ) {
        const FIELDS = {
            nfseFolderId: { name: 'custscript_pd_ai_nfse_file' },
            nfseId: { name: 'custscript_pd_ai_nfse_id' }
        };

        function getFolderNFSeId() {
            var _scriptObj = runtime.getCurrentScript();

            return _scriptObj.getParameter({ ...FIELDS.nfseFolderId });
        }

        function getNFSeId() {
            var _scriptObj = runtime.getCurrentScript();

            return _scriptObj.getParameter({ ...FIELDS.nfseId });
        }

        return {
            getFolderNFSeId: getFolderNFSeId,
            getNFSeId: getNFSeId
        }
    }
)