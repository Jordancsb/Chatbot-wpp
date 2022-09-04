const mimeDb = require('mime-db')
const fs = require('fs')

/**
 * Salvar arquivos mídias recebidos!
 * @param {*} media 
 */


const saveMedia = (media) => {
    const extensionProcess = mimeDb[media.mimetype]
    const ext = extensionProcess.extensions[0]
    fs.writeFile(`./media/${Date.now()}.${ext}`, media.data, { encoding: 'base64' }, function (err) {
        console.log('** Arquivo de mídia salvo **');
    });
}

module.exports = {saveMedia}