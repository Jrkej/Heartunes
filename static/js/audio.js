console.log("WELCOCME TO HEARTUNES!");
loading();
var playing = "NONE";
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


var players = {};
var loadings = 0;
var vids = 0;
var IDs = [];
var change = 0;
var pre = 0;
var playDur = -1;
var timer;
var nameLength = 37;

function onYouTubeIframeAPIReady() {
    console.log("Loading songs");
    var loaders = document.getElementsByClassName("song");
    var size = '0';
    change = YT.PlayerState.CUED;

    if (document.location.href.includes("preload=1")) {
        pre = 1;
        change = YT.PlayerState.PLAYING;
    }

    if (document.location.href.includes("debug=1")) {
        size = '100';
    }

    for (var i = 0; i < loaders.length; i++) {
        var videoId = loaders.item(i).id.replace("youtube-audio", "");
        IDs.push(videoId);
        var player = new YT.Player(videoId, {
            height: size,
            width: size,
            playerVars: {
                autoplay: 1,
                loop: 0,
                playsinline: 1
            },
            events: {
                'onReady': ready,
                'onStateChange': onPlayerStateChange
            }
        });
        players[videoId] = player;
    }
    console.log("Loading players", IDs.length);
}

function ready(e) {
    e.target.setPlaybackQuality("small");
    e.target.setVolume(0);
    if (pre == 1) {
        e.target.loadVideoById({videoId: IDs[vids]});
    } else {
        e.target.cueVideoById({videoId: IDs[vids]});
    }
    players[IDs[vids]] = e.target;
    vids += 1;
    document.getElementById("loading").innerHTML = loadings + "/" + IDs.length;
}

function prettyDur(s) {
    var mins = Math.floor(s/60);
    var hours = Math.floor(mins/60);
    var sec = Math.floor(s%60);
    mins %= 60;
    var dur = "";
    if (hours > 0) dur = hours + ":"
    if (hours > 0 || mins > 0) {
        if (hours > 0 && mins < 10) dur = dur + "0" + mins + ":"
        else dur = mins + ":"
    }
    if (sec < 10) {
        dur += "0"
    }
    dur += sec
    if (s < 60) dur = "0:" + dur

    return dur
}

function onPlayerStateChange(event) {
    if (event.data == -1) {
        console.log("Unstarted", event.target.m.id);
    } else if (event.data == YT.PlayerState.ENDED) {
        console.log("Ended", event.target.m.id);
    } else if (event.data == YT.PlayerState.PLAYING) {
        console.log("Playing", event.target.m.id);
    } else if (event.data == YT.PlayerState.PAUSED) {
        console.log("Paused", event.target.m.id);
    } else if (event.data == YT.PlayerState.BUFFERING) {
        console.log("Buffering", event.target.m.id);
    } else if (event.data == YT.PlayerState.CUED) {
        console.log("Cued", event.target.m.id);
    } else {
        console.log("Invalid event = ", event.data, event.target.m.id);
    }
    
    if (loadings < IDs.length) {
        if (event.data == change) {
            loadings += 1;
            event.target.pauseVideo();
            event.target.setVolume(100);
            document.getElementById("loading").innerHTML = loadings + "/" + IDs.length;
            if (loadings == IDs.length) loaded();
        }
    } else if (event.data == YT.PlayerState.PLAYING && event.target.m.id == playing) {
        play();
    } else if (event.data == YT.PlayerState.PAUSED && event.target.m.id == playing) {
        pause();
    } else if (event.data == YT.PlayerState.ENDED) {
        console.log("starting next");
        next(1);
    }
}

function clear() {
    if (playing == "NONE") return null;
    var id = "youtube-button" + playing;
    var element = document.getElementById(id);
    element.className = "row g-0 border border-danger rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative";
    playDur = -1;
    clearInterval(timer);
    document.getElementById("duration").value = 0;
    document.getElementById("current-time").innerHTML = "00:00";

    playing = "NONE";
}

function seekTo() {
    if (playDur == -1 || playing == "NONE") return null;

    var slider = document.getElementById("duration")
    var value = Math.floor(playDur/slider.max * slider.value)
    players[playing].seekTo(value);
}

function seekVolume() {
    if (playing == "NONE") return null;
    players[playing].setVolume(document.getElementById("volume").value);
}


function play() {
    if (playing == "NONE") return null;
    
    var id = "youtube-button" + playing;
    var element = document.getElementById(id);
    element.className = "row g-0 border border-success rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative";
    document.getElementById("toggler").className = "fa fa-pause fa-lg";
    players[playing].playVideo();
    seekVolume()
}

function seekTimer() {
    var slider = document.getElementById("duration");
    if (playDur == -1 || playing == "NONE") {
        slider.value = 0;
        return null;
    }

    var c = players[playing].getCurrentTime();
    slider.value = Math.floor(slider.max * c/playDur);
    document.getElementById("current-time").innerHTML = prettyDur(c);
    players[playing].setVolume(document.getElementById("volume").value);
}

function pause(){
    if (playing == "NONE") return null;

    var id = "youtube-button" + playing;
    var element = document.getElementById(id);
    element.className = "row g-0 border border-warning rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative";
    document.getElementById("toggler").className = "fa fa-play fa-lg";
    players[playing].pauseVideo();
}

function next(add) {
    if (playing == "NONE") return null;
    document.getElementById("prev").className = "fa fa-backward fa-lg disabled";
    document.getElementById("next").className = "fa fa-forward fa-lg disabled";
    var ID = IDs[(IDs.indexOf(playing) + add + IDs.length)%IDs.length];
    load(ID);
    document.getElementById("prev").className = "fa fa-backward fa-lg";
    document.getElementById("next").className = "fa fa-forward fa-lg";
}

function toggle() {
    if (playing == "NONE") return null;

    var id = "youtube-button" + playing;
    var element = document.getElementById(id);
    if (element.className.includes("border-warning")) {
        play();
    } else {
        pause();
    }
}

function load(videoId) {
    if (videoId == playing) {
        toggle();
        return null;
    }
    var prev = playing;
    clear();
    playing = videoId;
    if (prev != "NONE") players[prev].pauseVideo();
    playDur = players[playing].getDuration();
    players[playing].seekTo(0);

    document.getElementById("playing-img").src = document.getElementById("img-" + playing).src
    document.getElementById("playing-name").innerHTML = document.getElementById("name-" + playing).innerHTML.slice(0, Math.min(nameLength, document.getElementById("name-" + playing).innerHTML.length))
    if (document.getElementById("name-" + playing).innerHTML.length > nameLength) document.getElementById("playing-name").innerHTML += "..."
    document.getElementById("total-time").innerHTML = prettyDur(playDur);
    document.getElementById("current-time").innerHTML = "00:00";

    timer = setInterval(seekTimer, 1000);
    
    play();
}

function loaded() {
    var rems = []
    for (var i  = 0; i < IDs.length; i++) {
        var info = document.getElementById("info-" + IDs[i]);
        var dur = players[IDs[i]].getDuration();
        if (dur == 0) {
            rems.push(IDs[i]);
            document.getElementById("songs").removeChild(document.getElementById("youtube-audio"+IDs[i]))
            continue;
        }

        if (info.innerHTML.includes("Duration : NA")) {
            info.innerHTML = info.innerHTML.replace("Duration : NA", "Duration : " + prettyDur(dur))
        }
    }

    IDs = IDs.filter(function(element){ 
        return !rems.includes(element); 
    });

    var l = document.getElementById("loading");
    document.getElementById("pre").removeChild(l);
    document.getElementById("after").className = "container-fluid";
    document.getElementById("player-bottom").className = "navbar fixed-bottom navbar-expand-sm navbar-dark bg-danger";
    document.body.className = "bg-dark";
}

function loading() {
    console.log("changing screen");
    var l = document.createElement("div");
    l.className = "bg-dark text-center text-white fw-bold position-fixed";
    l.id = "loading";
    l.innerHTML = "Loading...";
    l.style = "width: 100vh;height: 100vh";
    document.getElementById("pre").appendChild(l)
    console.log("changed screen");
}

function copy(theText){
    var hiddenCopy = document.createElement('div');
    hiddenCopy.innerHTML = theText;
    hiddenCopy.style.position = 'absolute';
    hiddenCopy.style.left = '-9999px';

    var currentRange;
    if(document.getSelection().rangeCount > 0) {
         currentRange = document.getSelection().getRangeAt(0);
         window.getSelection().removeRange(currentRange);
    } else {
         currentRange = false;
    }

    document.body.appendChild(hiddenCopy);
    var CopyRange = document.createRange();
    CopyRange.selectNode(hiddenCopy);
    window.getSelection().addRange(CopyRange);

    try {
         document.execCommand('copy');
    } catch(err) {
         window.alert("Your Browser Doesn't support this! Error : " + err);
    }

    window.getSelection().removeRange(CopyRange);
    document.body.removeChild(hiddenCopy);

    if(currentRange) {
         window.getSelection().addRange(currentRange);
    }
}