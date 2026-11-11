/**
* @NApiVersion 2.1
* @NScriptType ScheduledScript
* @NModuleScope public
* @author Project Dome - João Lima Neves
*/

define([
    'N/file',
    'N/task',
    'N/log',
    '../pd_jei_service/pd-jei-file.service.js'
], function (
    file,
    task,
    log,
    file_service
) {
    const TO_PROCESS_FOLDER_ID = 32485;
    const PROCESSED_FOLDER_ID = 32486;
    const IMPORT_SCRIPT_ID = 'custimport_619_7326248_487';

    function execute(context) {
        const _filesToProcess = file_service.getByFolderId(TO_PROCESS_FOLDER_ID);

        _filesToProcess.forEach(function (result) {
            const _fileId = result.id || result.getValue({ name: 'internalid' });
            const _fileName = result.name || result.getValue({ name: 'name' });

            try {
                const _importTask = task.create({
                    taskType: task.TaskType.CSV_IMPORT,
                    importFile: file.load({ id: _fileId }),
                    mappingId: IMPORT_SCRIPT_ID
                });
                const taskId = _importTask.submit();

                log.audit('Importação enviada', `Task ID: ${taskId}`);

                const _processedFile = file.load({ id: _fileId });

                _processedFile.folder = PROCESSED_FOLDER_ID;
                _processedFile.save();

                log.audit('Arquivo movido', `Arquivo ${_fileName} foi movido para a pasta Processado`);
            } catch (error) {
                log.error('Erro ao processar arquivo CSV', error);
            }
            return true;
        });
    }
    return {
        execute
    };
});