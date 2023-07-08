// const { use } = require("passport");

const socket = io('/');
const videoGrid = $('#video-grid');
const myVideo = document.createElement('video');
myVideo.muted = false;

var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '5000'
});

let myVideoStream;
const peers = {}    

// On joining
peer.on('open', (userId) => {
    console.log(ROOM_ID);
    socket.emit('join-room', ROOM_ID, userId,USER_NAME);
    // USER_ID=userId;
})

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then((stream) => {
    
    myVideoStream=stream;
    // Adding our own video stream to webpage
    addVideoStream(myVideo, stream);

    peer.on('call', (call) => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', (userVideoStream) => {
            addVideoStream(video, userVideoStream);
        })
    })

    // Adding new users vedio stream
    socket.on('user-connected', (userId) => {
        setTimeout(connectToNewUser,500,userId, stream);
    })
})
.catch((err) => console.log(err));

// On disconnecting
socket.on('user-disconnected', userId => {
    if(peers[userId]) peers[userId].close();
})

// Function to add new User
const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    })

    peers[userId] = call;

    call.on('close', () => {
        video.remove();
    })
}

// Function to add new vedio 
const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videoGrid.append(video);
}


// Chat functionality

let text = $('input');

$('html').keydown((e) => {
    if(e.which == 13 && text.val().length !== 0)
    {
        socket.emit('sendMessage', text.val());
        text.val('');
    }
})


socket.on('addNewMessage', message => {
    $('.messages').append(`<li class = "message" ><b>${USER_NAME}</b><br/>${message}</li>`);
    scrollToBottom();
})

//scroll feature
const scrollToBottom= ()=>{
    let d=$('.main_chat_window');
    d.scrollTop(d,prop("scrollHeight"));
}

//mute our video
const muteUnmute = () =>{
    const enabled=myVideoStream.getAudioTracks()[0].enabled;
    if(enabled){
        myVideoStream.getAudioTracks()[0].enabled =false;
        setUnmuteButton();
    }else{
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled=true;
    }
}

const setMuteButton= () =>{
    const html=`
    <i class="fas fa-microphone"></i>
	<span class="remaining">Mute</span>
    `
    document.querySelector('.main_mute_button').innerHTML=html;
}

const setUnmuteButton= () =>{
    const html=`
    <i class="unmute fas fa-microphone-slash"></i>
	<span class="remaining">Unmute</span>
    `
    document.querySelector('.main_mute_button').innerHTML=html;
}

const playStop= () =>{
    console.log('object');
    let enabled=myVideoStream.getVideoTracks()[0].enabled;
    if(enabled){
        myVideoStream.getVideoTracks()[0].enabled=false;
        setPlayVideo();
    }else{
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled=true;
    }
}

const setPlayVideo=()=>{
    const html=`
    <i class="stop fas fa-video-slash"></i>
    <span class="remaining">play video</span>
    `
    document.querySelector('.main_video_button').innerHTML=html;
}

const setStopVideo=()=>{
    const html=`
    <i class="fas fa-video"></i>
    <span class="remaining">Stop Video</span>
    `
    document.querySelector('.main_video_button').innerHTML=html;  
}


//changing theme
const changeTheme=()=>{
    console.log('object');
    const css=document.getElementById('css');
    console.log(css.href);
    if(css.getAttribute("href")=="style.css"){
        css.setAttribute("href","styles.css");
    }else if(css.getAttribute("href")=="styles.css"){
        css.setAttribute("href","style.css");
    }
}


function leaveMeet() {
    var backlen = history.length;
    history.go(-backlen);
    window.location.href = '/';
}