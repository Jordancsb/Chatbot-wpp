const connectionReady = (cb = () =>{}) => {
  console.log('Pronto para receber mensagens!')
  cb()
}

const connectionLost = (cb = () =>{}) => {
  console.log('** Erro de autenticação gera o QRCODE novamente (exclua o arquivo session.json) **');
  cb()
}


module.exports = {connectionReady, connectionLost}