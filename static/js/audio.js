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

function onPlayerStateChange(event) {
    if (event.data == -1) {
        console.log("Unstarted");
    } else if (event.data == YT.PlayerState.ENDED) {
        console.log("Ended");
    } else if (event.data == YT.PlayerState.PLAYING) {
        console.log("Playing");
    } else if (event.data == YT.PlayerState.PAUSED) {
        console.log("Paused");
    } else if (event.data == YT.PlayerState.BUFFERING) {
        console.log("Buffering");
    } else if (event.data == YT.PlayerState.CUED) {
        console.log("Cued");
    } else {
        console.log("Invalid event = ", event.data);
    }
    
    if (loadings < IDs.length) {
        if (event.data == change) {
            loadings += 1;
            event.target.pauseVideo();
            event.target.setVolume(100);
            document.getElementById("loading").innerHTML = loadings + "/" + IDs.length;
            if (loadings == IDs.length) loaded();
        }
    } else if (event.data == YT.PlayerState.Playing) {
        pause()
    } else if (event.data == YT.PlayerState.ENDED) {
        play(IDs[(IDs.indexOf(playing) + 1)%IDs.length]);
    }
}

function clear() {
    if (playing == "NONE") return null;
    var id = "youtube-button" + playing;
    var element = document.getElementById(id);
    element.className = "row g-0 border border-danger rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative";
    players[playing].pauseVideo();
    playing = "NONE";
}

function play() {
    var id = "youtube-button" + playing;
    var element = document.getElementById(id);
    element.className = "row g-0 border border-success rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative";
    players[playing].playVideo();
}

function pause(){
    var id = "youtube-button" + playing;
    var element = document.getElementById(id);
    element.className = "row g-0 border border-warning rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative";
    players[playing].pauseVideo();
}

function toggle() {
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
    clear();
    playing = videoId;
    players[videoId].seekTo(0);
    play();
}

function loaded() {
    var l = document.getElementById("loading");
    document.getElementById("pre").removeChild(l);
    document.getElementById("after").className = "container-fluid";
    document.body.className = "bg-dark";
}

function loading() {
    console.log("changing screen");
    var l = document.createElement("div");
    document.getElementById("after").className = "invisible overflow-hidden";
    document.body.className = "bg-dark overflow-hidden"
    l.className = "bg-dark text-center text-white fw-bold position-fixed";
    l.id = "loading";
    l.innerHTML = "Loading...";
    l.style = "width: 100vh;height: 100vh";
    document.getElementById("pre").appendChild(l)
    console.log("changed screen");
}