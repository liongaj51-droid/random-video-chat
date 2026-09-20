const socket=io();
const localVideo=document.querySelector('#localVideo'),remoteVideo=document.querySelector('#remoteVideo');
const startBtn=document.querySelector('#startBtn'),nextBtn=document.querySelector('#nextBtn');
const muteBtn=document.querySelector('#muteBtn'),camBtn=document.querySelector('#camBtn');
const statusEl=document.querySelector('#status'),input=document.querySelector('#messageInput'),sendBtn=document.querySelector('#sendBtn'),messages=document.querySelector('#messages');
let stream=null,pc=null,partner=null,initiator=false;

const rtcConfig={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
function status(x){statusEl.textContent=x}
function addMsg(who,text){const d=document.createElement('div');d.className='msg';d.textContent=who+': '+text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight}

async function start(){
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    localVideo.srcObject=stream;
    startBtn.disabled=true; nextBtn.disabled=false; muteBtn.disabled=false; camBtn.disabled=false;
    input.disabled=false;sendBtn.disabled=false; status('Mencari partner...');
    socket.emit('join');
  }catch(e){status('Kamera/mic tidak diizinkan');alert('Izinkan akses kamera dan mikrofon di browser.')}
}
function makePC(){
  pc=new RTCPeerConnection(rtcConfig);
  stream.getTracks().forEach(t=>pc.addTrack(t,stream));
  pc.onicecandidate=e=>{if(e.candidate&&partner)socket.emit('signal',{to:partner,data:{candidate:e.candidate}})};
  pc.ontrack=e=>remoteVideo.srcObject=e.streams[0];
  pc.onconnectionstatechange=()=>{if(['failed','disconnected','closed'].includes(pc.connectionState))status('Koneksi terputus')};
}
async function call(){
  makePC(); const offer=await pc.createOffer(); await pc.setLocalDescription(offer);
  socket.emit('signal',{to:partner,data:{sdp:pc.localDescription}});
}
socket.on('waiting',()=>status('Menunggu orang lain...'));
socket.on('matched',async ({id,initiator:i})=>{partner=id;initiator=i;status('Partner ditemukan!');messages.innerHTML='';if(initiator)await call()});
socket.on('signal',async ({from,data})=>{
  if(!pc)makePC(); partner=from;
  if(data.sdp){
    await pc.setRemoteDescription(data.sdp);
    if(data.sdp.type==='offer'){const answer=await pc.createAnswer();await pc.setLocalDescription(answer);socket.emit('signal',{to:partner,data:{sdp:pc.localDescription}})}
  } else if(data.candidate) {try{await pc.addIceCandidate(data.candidate)}catch(e){}}
});
socket.on('chat',({text})=>addMsg('Partner',text));
socket.on('partner-left',()=>{status('Partner keluar — mencari lagi...');remoteVideo.srcObject=null;closePC();socket.emit('join')});
function closePC(){if(pc){pc.close();pc=null}partner=null}
function next(){closePC();remoteVideo.srcObject=null;messages.innerHTML='';status('Mencari partner...');socket.emit('next')}
startBtn.onclick=start; nextBtn.onclick=next;
muteBtn.onclick=()=>{const t=stream?.getAudioTracks()[0];if(t){t.enabled=!t.enabled;muteBtn.textContent=t.enabled?'🎤 Mic':'🔇 Mic Off'}};
camBtn.onclick=()=>{const t=stream?.getVideoTracks()[0];if(t){t.enabled=!t.enabled;camBtn.textContent=t.enabled?'📷 Kamera':'🚫 Kamera Off'}};
function send(){const text=input.value.trim();if(!text||!partner)return;addMsg('Kamu',text);socket.emit('chat',{to:partner,text});input.value=''}
sendBtn.onclick=send;input.addEventListener('keydown',e=>{if(e.key==='Enter')send()});
window.addEventListener('beforeunload',()=>socket.emit('leave'));