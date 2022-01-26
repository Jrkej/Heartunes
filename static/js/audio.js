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
var change = 5;
var pre = 0;

function onYouTubeIframeAPIReady() {
    IDs = [];
    console.log("Loading songs");
    var loaders = document.getElementsByClassName("song");
    var size = '0';
    if (document.location.href.includes("preload=1")) {
        pre = 1;
        change = 1;
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
    console.log("Loading players", IDs.length, players.length, loaders.length);
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

var done = false;
function onPlayerStateChange(event) {
    console.log(event.data)
    if (loadings < IDs.length) {
        if (event.data == change) {
            loadings += 1;
            event.target.pauseVideo();
            event.target.setVolume(100);
            document.getElementById("loading").innerHTML = loadings + "/" + IDs.length;
            if (loadings == IDs.length) loaded();
        }
    }
    if (event.data == YT.PlayerState.ENDED) {
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

function toggle() {
    var id = "youtube-button" + playing;
    var element = document.getElementById(id);
    if (element.className.includes("border-warning")) {
        element.className = "row g-0 border border-success rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative";
        players[playing].playVideo();
    } else {
        element.className = "row g-0 border border-warning rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative";
        players[playing].pauseVideo();
    }
}

function play(videoId) {
    if (videoId == playing) {
        toggle();
        return null;
    }
    clear();
    var id = "youtube-button" + videoId;
    var element = document.getElementById(id);
    element.className = "row g-0 border border-success rounded overflow-hidden flex-md-row mb-4 shadow-sm h-md-250 position-relative";
    players[videoId].seekTo(0);
    players[videoId].playVideo();
    playing = videoId;
}
function loaded() {
    var l = document.getElementById("loading");
    document.getElementById("pre").removeChild(l);
}

function loading() {
    console.log("changing screen");
    var l = document.createElement("div");
    l.className = "bg-dark text-center text-white fw-bold loading position-fixed";
    l.id = "loading";
    l.innerHTML = "Loading...";
    l.style = "width: 100vh;height: 100vh";
    document.getElementById("pre").appendChild(l)
    console.log("changed screen");
}