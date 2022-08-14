var player;
var conn;
var controller = null;
var cUrl;
var done = false;
var user = "user" + parseInt(99999999 * Math.random());
var cCom = -1;

var apiServer = window.location;

function onPlayerReady(event) {
    setInterval(updateTime, 1000);
    event.target.playVideo();
}

async function apic(data) {
    let resp = await api({
        method: "setProto",
        data: data
    });
}

function serialize(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}


async function api(data) {
    return await fetch(apiServer, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: serialize(data)
    }).then(async res => {
        return await res.json();
    });
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        cUrl = getId();
        done = true;
    } else if(event.data == YT.PlayerState.PLAYING) {
        if (iAmControlling()) apic("play " + player.getCurrentTime());
    } else if (event.data == YT.PlayerState.PAUSED) {
        if (iAmControlling()) apic("pause " + player.getCurrentTime());
    }
}

function updateTime(event) {
    if (player.getPlayerState() == YT.PlayerState.PLAYING && done) {
        if (iAmControlling()) apic("time " + player.getCurrentTime());
    }
}

function updateUrl(url) {
    var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    var matches = url.match(p);
    if (matches) {
        let furl = matches[1];
        apic("urlSync " + furl);
    } else {
        return false;
    }
}

function stopVideo() {
    player.pauseVideo();
}

function getId() {
    var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    var matches = player.getVideoUrl().match(p);
    return matches[1];
}

async function fetchApi() {
    let data = await api({
        method: "ping",
        data: "user " + user
    });
    parseProto(data);
}

function parseProto(data) {
    for (da of data) {
        let info = da.split("|");
        let command = info[1].split(" ");
        if ( parseInt(info[0]) > cCom) {
            switch (command[0]) {
                case "control": 
                {
                    $_("#controller").innerHTML = command[1];
                    break;
                }
                case "userCount":
                {
                    if (iAmControlling()) {
                        SyncUrl($_("#urlBar").value);
                    }
                    document.getElementById("userCount").innerHTML = command[1];
                    break;
                }
                case "pause":
                {
                    if (iAmControlling()) break;
                    player.seekTo(command[1], true);
                    stopVideo();
                    break;
                }
                case "urlSync":
                {
                    if (iAmControlling()) break;
                    cUrl = command[1];
                    player.loadVideoById(command[1], 0);
                    break;
                }
                case "time":
                {
                    if (iAmControlling()) break;
                    var estimatedTimeOnMaster = parseInt(command[1]) + 1;
                    if (Math.abs(estimatedTimeOnMaster - player.playerInfo.currentTime) > 3 || player.getPlayerState() == 2 && Math.abs(estimatedTimeOnMaster - player.playerInfo.currentTime) > 0.2) {
                        if (getId() == cUrl) {
                            player.seekTo(estimatedTimeOnMaster, true);
                            player.playVideo();
                        } else {
                            player.loadVideoById(cUrl, estimatedTimeOnMaster);
                            player.playVideo();
                        }

                    }
                    break;
                }
                case "play": 
                {
                    if(iAmControlling()) break;
                    var estimatedTimeOnMaster = parseInt(command[1]) + 1;
                    player.seekTo(estimatedTimeOnMaster, true);
                    player.playVideo();
                }
            }
            cCom = parseInt(info[0]);
        }
    }
}

function onYouTubeIframeAPIReady() {

    player = new YT.Player('player', {
        height: '1080',
        width: '1920',
        videoId: 'jWlOhhBSzBk',
        origin: "https://hud.koopahtmaniac.com",
        playerVars: {
            'playsinline': 1,
            'autoplay': 1,
            'controls': 1,
            'autohide': 1,
            'wmode': 'opaque',
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    setInterval(fetchApi, 1000);
}

window.onload = function() {
    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";

    var fst = document.getElementsByTagName('script')[0];
    fst.parentNode.insertBefore(tag, fst);

    $_("#username").innerHTML = user;

    

    $_("#takeControl").onclick = function(ev) {
        apic("control " + user);
    };
};



function iAmControlling() {
    return $_("#controller").innerHTML == user;
}

function $_(sel) {
    return document.querySelector(sel);
}