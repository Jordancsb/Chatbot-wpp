require('dotenv').config()
const fs = require('fs');
const express = require('express');
const cors = require('cors')
const qrcode = require('qrcode-terminal');
const { Client,LocalAuth  } = require('whatsapp-web.js');
const mysqlConnection = require('./config/mysql')
const { middlewareClient } = require('./middleware/client')
const { generateImage, cleanNumber, checkEnvFile, createClient, isValidNumber } = require('./controllers/handle')
const { connectionReady, connectionLost } = require('./controllers/connection')
const { saveMedia } = require('./controllers/save')
const { getMessages, responseMessages, bothResponse } = require('./controllers/flows')
const { sendMedia, sendMessage, lastTrigger, sendMessageButton, readChat } = require('./controllers/send')
const app = express();
app.use(cors())
app.use(express.json())
const MULTI_DEVICE = process.env.MULTI_DEVICE || 'true';
const server = require('http').Server(app)

const port = process.env.PORT || 3000
let client;
app.use('/', require('./routes/web'))

const listenMessage = () => client.on('message', async msg => {
    const { from, body, hasMedia } = msg;

    if(!isValidNumber(from)){
        return
    }

    if (from === 'status@broadcast') {
        return
    }
    message = body.toLowerCase();
    console.log('BODY',message)
    const number = cleanNumber(from)
    await readChat(number, message)

    if (process.env.SAVE_MEDIA && hasMedia) {
        const media = await msg.downloadMedia();
        saveMedia(media);
    }

    if (process.env.DATABASE === 'dialogflow') {
        if(!message.length) return;
        const response = await bothResponse(message);
        await sendMessage(client, from, response.replyMessage);
        if (response.media) {
            sendMedia(client, from, response.media);
        }
        return
    }

    const lastStep = await lastTrigger(from) || null;
    if (lastStep) {
        const response = await responseMessages(lastStep)
        await sendMessage(client, from, response.replyMessage);
    }

    const step = await getMessages(message);

    if (step) {
        const response = await responseMessages(step);

        await sendMessage(client, from, response.replyMessage, response.trigger);

        if(response.hasOwnProperty('actions')){
            const { actions } = response;
            await sendMessageButton(client, from, null, actions);
            return
        }

        if (!response.delay && response.media) {
            sendMedia(client, from, response.media);
        }
        if (response.delay && response.media) {
            setTimeout(() => {
                sendMedia(client, from, response.media);
            }, response.delay)
        }
        return
    }

    if (process.env.DEFAULT_MESSAGE === 'true') {
        const response = await responseMessages('DEFAULT')
        await sendMessage(client, from, response.replyMessage, response.trigger);

        if(response.hasOwnProperty('actions')){
            const { actions } = response;
            await sendMessageButton(client, from, null, actions);
        }
        return
    }
});



client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: { headless: true }
    });
    
client.on('qr', qr => generateImage(qr, () => {
        qrcode.generate(qr, { small: true });
        
        console.log(`Ver QR http://localhost:${port}/qr`)
        socketEvents.sendQR(qr)
}))

client.on('ready', (a) => {
        connectionReady()
        listenMessage()
        // socketEvents.sendStatus(client)
});

client.on('auth_failure', (e) => {
        // console.log(e)
        // connectionLost()
});

client.on('authenticated', () => {
        console.log('AUTHENTICATED'); 
});

    client.initialize();

if (process.env.DATABASE === 'mysql') {
    mysqlConnection.connect()
}

server.listen(port, () => {
    console.log(`El server esta listo por el puerto ${port}`);
})
checkEnvFile();


