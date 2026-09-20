const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const app=express(),server=http.createServer(app),io=new Server(server);
const waiting=[];
app.use(express.static(__dirname));

function remove(id){const i=waiting.indexOf(id);if(i>=0)waiting.splice(i,1)}
function findPair(socket){
  remove(socket.id);
  const other=waiting.shift();
  if(other && io.sockets.sockets.get(other)){
    socket.partner=other;io.sockets.sockets.get(other).partner=socket.id;
    socket.emit('matched',{id:other,initiator:true});
    io.to(other).emit('matched',{id:socket.id,initiator:false});
  }else{waiting.push(socket.id);socket.emit('waiting')}
}
io.on('connection',socket=>{
  socket.on('join',()=>findPair(socket));
  socket.on('next',()=>{
    const p=socket.partner;if(p&&io.sockets.sockets.get(p)){io.to(p).emit('partner-left');io.sockets.sockets.get(p).partner=null}
    socket.partner=null;findPair(socket);
  });
  socket.on('signal',({to,data})=>io.to(to).emit('signal',{from:socket.id,data}));
  socket.on('chat',({to,text})=>{if(socket.partner===to)io.to(to).emit('chat',{text})});
  socket.on('leave',()=>{remove(socket.id);const p=socket.partner;if(p&&io.sockets.sockets.get(p)){io.to(p).emit('partner-left');io.sockets.sockets.get(p).partner=null}});
  socket.on('disconnect',()=>{remove(socket.id);const p=socket.partner;if(p&&io.sockets.sockets.get(p))io.to(p).emit('partner-left')});
});
server.listen(process.env.PORT||3000,()=>console.log('RandomChat running on port '+(process.env.PORT||3000)));