const Koa = require('koa')
const app = new Koa()
const socketServer = require('http').Server(app.callback())
const io = require('socket.io')(socketServer, { cors: true })
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('koa2-cors')


const index = require('./routes/index')
const users = require('./routes/users')

app.use(cors())

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

io.on('connection', socket => {
  console.log(`链接成功....`)

  let roomID = null
  socket.on('joinRoom', (data, fn) => {
    console.log('data', data, fn)
    socket.join(data.roomName)
    roomID = data.roomName
    socket.emit('clientMessage', { 'code': 200, 'msg': '加入房间成功', 'roomName': data.roomName })
  })

  socket.on('leaveRoom', (data, fn) => {
    socket.leave(data.roomName)
    socket.emit('clientMessage', { 'code': 200, 'msg': '已退出房间', 'roomName': data.roomName })
  })


  // 监听客户端sendMsg事件
  socket.on('message', (data, fn) => {
    // console.log('message_data', data)
    socket.broadcast.to(roomID).emit('receive', data)  // 广播事件
    socket.emit('clientMessage',{ 'code': 0, 'msg': '消息发送成功' })
  })
})


socketServer.listen(520, () => {
  console.log('socket is running on port 520')
})

module.exports = app
