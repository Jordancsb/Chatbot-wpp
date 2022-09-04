const { Client, LegacySessionAuth, LocalAuth } = require('whatsapp-web.js')
const http = require('http')
const https = require('https')
const fs = require('fs')
const qr = require('qr-image')

const MULTI_DEVICE = process.env.MULTI_DEVICE || 'true';

const cleanNumber = (number) => {
    number = number.replace('@c.us', '');
    number = `${number}@c.us`;
    return number
}

const saveExternalFile = (url) => new Promise((resolve, reject) => {
    const ext = url.split('.').pop()
    const checkProtocol = url.split('/').includes('https:');
    const handleHttp = checkProtocol ? https : http;
    const name = `${Date.now()}.${ext}`;
    const file = fs.createWriteStream(`${__dirname}/../mediaSend/${name}`);
    console.log(url)
     handleHttp.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close();
            resolve(name)
        });
        file.on('error', function() {
            console.log('erro')
            file.close();  
            resolve(null)
        });
    });
})

const checkIsUrl = (path) => {
    try{
        regex = /^(http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/i;
        match = path.match(regex);
        return match[0]
    }catch(e){
        return null
    }
}

const generateImage = (base64, cb = () => {}) => {
    let qr_svg = qr.image(base64, { type: 'svg', margin: 4 });
    qr_svg.pipe(require('fs').createWriteStream('./mediaSend/qr-code.svg'));
    console.log(`⚡ Aperte F5 - QR atualiza a cada minuto ⚡'`);
    cb()
}

const checkEnvFile = () => {
    const pathEnv = `${__dirname}/../.env`;
    const isExist = fs.existsSync(pathEnv);
    if(!isExist){
        console.log(`Arquivo .env não encontrado ou ele ainda não foi criado!`)
    }
}

/**
 * 
 * @param {*} session 
 * @param {*} cb 
 */
const createClient =  () => {
    client = new Client({
        authStrategy: new LocalAuth(
            {dataPath: './sessions/',
            clientId: 'bot'}),
        puppeteer: { headless: false }
 
    });
}

const isValidNumber = (rawNumber) => {
    const regexGroup = /\@g.us\b/gm;
    const exist = rawNumber.match(regexGroup);
    return !exist
}

module.exports = {cleanNumber, saveExternalFile, generateImage, checkIsUrl, checkEnvFile, createClient, isValidNumber}