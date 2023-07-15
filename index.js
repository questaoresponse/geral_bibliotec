const express=require('express')
const cors=require('cors')
const socket=require('socket.io')
const http=require('http')
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');
const chave = 'teste-servidor'; // Substitua pela sua chave secreta
// Criptografar
function criptografar(texto){
const textoCriptografado = CryptoJS.AES.encrypt(texto, chave).toString();
return textoCriptografado
}


// Descriptografar
function descriptografar(texto){
  const bytesDescriptografados = CryptoJS.AES.decrypt(texto, chave);
  const textoDescriptografado = bytesDescriptografados.toString(CryptoJS.enc.Utf8);
  return textoDescriptografado
}

// Cria uma conexão com o banco de dados
class Banco_usuario{
constructor(){
  this.database='usuarios.db'
}
create(){
const db = new sqlite3.Database(this.database); // Ou especifique o caminho para um arquivo de banco de dados existente

// Executa uma consulta SQL
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users(nome,email,senha)');
});

// Fecha a conexão com o banco de dados
db.close();
}
update_usuario(valor_1,valor_2){
    this.valor_1=valor_1
    this.valor_2=valor_2
    const db = new sqlite3.Database(this.database);
    db.run('BEGIN TRANSACTION');
    db.serialize(() => {
      db.run('UPDATE users SET nome=? WHERE nome=?', [this.valor_1, this.valor_2]);
    })
    db.run('COMMIT');
    db.close();
}
update_email(valor_1,valor_2){
    this.valor_1=valor_1
    this.valor_2=valor_2
    const db = new sqlite3.Database(this.database);
    db.run('BEGIN TRANSACTION');
    db.serialize(() => {
      db.run('UPDATE users SET email=? WHERE nome=?', [this.valor_1, this.valor_2]);
    })
    db.run('COMMIT');
    db.close();
}
update_senha(valor_1,valor_2){
    this.valor_1=valor_1
    this.valor_2=valor_2
    const db = new sqlite3.Database(this.database);
    db.run('BEGIN TRANSACTION');
    db.serialize(() => {
      db.run('UPDATE users SET senha=? WHERE nome=?', [this.valor_1, this.valor_2]);
    })
    db.run('COMMIT');
    db.close();
}
async verificar_senha(usuario,email,senha) {
  const db = new sqlite3.Database(this.database);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all('SELECT * FROM users WHERE nome=? and email=? and senha=?', [usuario,email,senha], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          console.log(rows);
          if (rows.length > 0) {
            resolve('true');
          } else {
            resolve('false');
          }
        }
      });
    });
    db.close();
  });
}
async insert(valor_1, valor_2, valor_3) {
  const db = new sqlite3.Database(this.database);
  await new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION');
    db.serialize(() => {
      db.run('INSERT INTO users(nome,email,senha) VALUES (?, ?, ?)', [valor_1, valor_2, valor_3], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    db.run('COMMIT');
  });
  db.close();
}

async verificar_cadastro(usuario) {
  const db = new sqlite3.Database(this.database);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all('SELECT * FROM users WHERE nome=?', [usuario,], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          console.log(rows);
          if (rows.length > 0) {
            resolve('false');
          } else {
            resolve('true');
          }
        }
      });
    });
    db.close();
  });
}
}
class Banco_mensagens{
constructor(){
    this.database='usuarios.db'
    const db = new sqlite3.Database(this.database); // Ou especifique o caminho para um arquivo de banco de dados existente

    // Executa uma consulta SQL
    db.serialize(() => {
      db.run('CREATE TABLE IF NOT EXISTS mensagens(mensagem,nome)');
    });
    
    // Fecha a conexão com o banco de dados
    db.close();
}
async insert(mensagem,usuario) {
  const db = new sqlite3.Database(this.database);
  await new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION');
    db.serialize(() => {
      db.run('INSERT INTO mensagens(mensagem,nome) VALUES (?,?)', [mensagem,usuario], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    db.run('COMMIT');
  });
  db.close();
}
async getMensagens(usuario){
  const db = new sqlite3.Database(this.database);
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all('SELECT * FROM mensagens WHERE nome=?', [usuario], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          console.log(rows);
          resolve(rows)
        }
      });
    });
    db.close();
  });
}
}
var chave_jwt='corninho60'
var banco_usuario=new Banco_usuario()
banco_usuario.create()
var banco_mensagens=new Banco_mensagens()
const port=process.env.PORT || 5000
const app=express()
app.use(cors())
app.use(express.static('./public'))
// app.get('/',()=>{
//     console.log('conectado')
//     return 'oi'
// })
app.use(bodyParser.json())
app.post('/verificar',(req,res)=>{
  // Lógica para lidar com a solicitação POST
  console.log(req.headers)
  const body = req.headers.authorization; // Corpo da solicitação como objeto JavaScript
  console.log(body)
  if (body) {
    jwt.verify(body,chave_jwt,(err,decoded)=>{
    if (err){
      res.status(401).send('token não autorizado.')
    }else{
    console.log('dc',decoded)
    //var decoded=jwt.decode(body)
    //var decoded=descriptografar(body)
    console.log('decodificado',decoded)
    res.status(200).send('token autorizado')
    }
    })
  }else{
    res.status(401).send('token não autorizado')
  }
    // next(new Error('Token JWT ausente.'));
});
app.post('/cadastro',(req,res)=>{
  var data=req.body;
  var usuario_cadastro=data.usuario
  var email_cadastro=data.email
  var senha_cadastro=data.senha
  var verificacao_cadastro=banco_usuario.verificar_cadastro(usuario_cadastro)
  verificacao_cadastro.then(function(verificacao_cadastro){
  if (verificacao_cadastro=='true'){
    banco_usuario.insert(usuario_cadastro,email_cadastro,senha_cadastro)
    const token = jwt.sign({'usuario':usuario_cadastro},chave_jwt/* ,{ expiresIn: '189h' }*/);
    const cripto=criptografar(usuario_cadastro)
    res.send({'verificacao':'true','token':token,'cripto':cripto})
  }else{
    res.send({'verificacao':'false'})
  }
  console.log('cadastro',verificacao_cadastro)
})
});
app.post('/login',(req,res)=>{
  var data=req.body;
  var usuario_login=data.usuario
  var email_login=data.email
  var senha_login=data.senha
  var verificacao_login=banco_usuario.verificar_senha(usuario_login,email_login,senha_login)
  verificacao_login.then(function(verificacao_login){
  if (verificacao_login=='true'){
  const token = jwt.sign({'usuario':usuario_login},chave_jwt);
  const cripto=criptografar(usuario_cadastro)
  res.send({'verificacao':'true','token':token,'cripto':cripto})
  }else{
  res.send({'verificacao':'false'})
  }
  })
});
const https=http.createServer(app)
const io=socket(https,{
    path:'/socket.io'
})
const sessionMiddleware=session({
  secret: 'seu-segredo-aqui',
  resave: false,
  saveUninitialized: true
})
io.use((socket, next) => {
  //sessionMiddleware(socket.request, {}, next);
  console.log('socket',socket.handshake.query.token)
  const token = socket.handshake.query.token.token;
  const cripto=socket.handshake.query.token.cripto;
  if (token) {
    jwt.verify(token,chave_jwt,(err,decoded)=>{
      // O token JWT é válido, você pode acessar os dados decodificados em decoded
    // if (!err){
      var decoded=descriptografar(cripto)
      //var decoded=jwt.decode(token)
      console.log('decoded',decoded)
      socket.decoded={"usuario":decoded}
    //}
    })
  }else {
  }
});
io.on('connection',(socket)=>{
var usuario=false;
if (socket.decoded.usuario) {
    usuario=socket.docoded.usuario
    var mensagens=banco_mensagens.getMensagens(usuario)
    mensagens.then((mensagens)=>{
      socket.emit("mensagens_total",mensagens)
    })
}else{
    // socket.emit("status","nao_logado")
}
socket.on('disconnect',()=>{
    console.log('desconectou')
})
var teste=[]
socket.on('mensagem',(mensagem)=>{
    banco_mensagens.insert(mensagem,usuario)
    teste.push(mensagem)
    console.log(teste)
    io.emit('mensagem_enviada',teste)
})

})
https.listen(port,()=>{
    console.log(`listen on ${port}`)
})