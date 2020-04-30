// Shared objects: deck, table, players(and their sets), chat
// all messages will be json with two keys: type and body
// deck is shared once at the beginning
// players is updated every time someone connects or gets a set and is resent to everyone
// table is updated every time someone gets a set
// chat is updated every time someone sends a message

const signalhub = require("signalhub");
const createSwarm = require("webrtc-swarm");
window.Peer = require("simple-peer");



window.joinRoom = function(roomName, myName){
    window.username = myName;
    window.countedDown = false;

    const hub = signalhub(`quartet_${roomName}`, ['https://signalhub-jccqtwhdwc.now.sh']);
    // const hub = signalhub(`quartet_${roomName}`, ['http://192.168.0.115:8080'])
    window.swarm = createSwarm(hub)
    window.myId = swarm.me;

    window.sharedState.roomName = roomName
    window.sharedState.gameStartTime = null;
    window.sharedState.peers = {}
    sharedState.peers[swarm.me] = {ready: false, deck: [], name: myName}

    // "connect" means a new peer. 
    swarm.on("connect", function(peer, id){
    setTimeout(_ => {console.log('here'); document.querySelector("#startGame").disabled=false;}, 300);
        sendStateToPeer(peer)
        peer.on("data", getHandler(peer, id));
    })

    document.querySelector("#leaveGame").innerHTML = `Exit Room <i>"${roomName}"</i>`;
}

window.rejoinRoom = function(roomName, myName){
    window.countedDown = true;
    let modal = window.createNewModal("","Please wait while we try to reconnect to your game!", {self_destruct_ms: 4000});
    document.body.appendChild(modal);

    const hub = signalhub(`quartet_${roomName}`, ['https://signalhub-jccqtwhdwc.now.sh']);
    // const hub = signalhub(`quartet_${roomName}`, ['http://192.168.0.115:8080'])
    window.swarm = createSwarm(hub)
    window.username = myName;
    window.myId = swarm.me;

    // try{
        sharedState.peers[myId] = JSON.parse(JSON.stringify(sharedState.peers[oldId]));
        delete sharedState.peers[oldId];

        let peerIds = Object.keys(sharedState.peers).map(p => p.slice(-4));
        print(`Replacing ${oldId.slice(-4)} with ${myId.slice(-4)}: ${peerIds}`);
    // }
    // catch{}

    // "connect" means a new peer. 
    swarm.on("connect", function(peer, id){
        print(`Got a new peer: ${id.slice(-4)}`);
        sendToPeer({type: "newId", oldId: oldId}, peer);
        sendStateToPeer(peer);
        peer.on("data", getHandler(peer, id));
    })
    document.querySelector("#leaveGame").innerHTML = `Exit Room <i>"${roomName}"</i>`;
}



function getHandler(peer, id){
    function handler(data){
        data = JSON.parse(data.toString());

        let handlers = {
            newId: newIdHandler,
            state: newStateHandler
        }
        handlers[data.type](peer, id, data);
        saveState();
    }
    return handler;
}

function sendToPeer(data, peer){
    peer.send(JSON.stringify(data));
}

window.sendStateToPeer = function(peer){
    sharedState.timestamp = Date.now();
    sendToPeer(sharedState, peer);
}


function newIdHandler(peer, id, info){
    print(`Replacing ${info.oldId.slice(-4)} with ${id.slice(-4)}`);
    try{
        let tmp = JSON.parse(JSON.stringify(sharedState.peers[info.oldId]));
        delete sharedState.peers[info.oldId];
        sharedState.peers[id] = tmp;
    }catch{}
        animateState();
}

//todo: make sure peers are preserved when updating state
function newStateHandler(peer, id, yourState){
    print(`New State: ${Object.keys(yourState.peers).map(p => p.slice(-4))}`)
    let willRespondBool = false;

    let {roomName, 
        timestamp, gameStartTime, gameEndTime,
        peers,
        deck, tableCards} = yourState;

    // If you have a gameStartTime < mine (or is null when mine isn't), respond and return.
    if ((gameStartTime < sharedState.gameStartTime) ||
        (gameStartTime == null && sharedState.gameStartTime != null)){
            sendStateToPeer(peer);
            return;
    }

    // If you have a gameStartTime > mine, (or mine is null and theirs isn't) I take your state (and return)
    let youAreReady = yourState.peers[id] ? yourState.peers[id].ready : false;
    let youSayWeStartedANewGame = (gameStartTime > sharedState.gameStartTime);
    let youTellMeWeStarted = (sharedState.gameStartTime == null && gameStartTime != null);

    if(youAreReady && (youSayWeStartedANewGame || youTellMeWeStarted)){
        if(!(swarm.me in yourState.peers)){
            let myPeer = sharedState.peers[swarm.me];
            sharedState = yourState;
            sharedState.peers[swarm.me] = myPeer;
            for(let peer of swarm.peers){
                sendStateToPeer(peer);
            }
        }
        else{
            // game is starting, right?
            let hamburger = document.querySelector("#hamburger");
            if(hamburger.classList.contains("is-active")){
                hamburger.click();
            }

            // don't double countdown after a game, but do countdown at the beginning.
            if(sharedState.gameStartTime == null){
                window.countedDown = false;
            }

            sharedState = yourState;
        }
        
        animateState()
        return;
    }

    // If I'm missing a peer, I will add them (unless they're my oldId)
    // If you think a peer is ready, I'll go with it.
    for (let yourPeerId of Object.keys(peers)){
        if (!(yourPeerId in sharedState.peers) && yourPeerId != oldId){
            sharedState.peers[yourPeerId] = peers[yourPeerId];
        }
        else if((yourPeerId in sharedState.peers) && peers[yourPeerId].ready){
            sharedState.peers[yourPeerId].ready = true;
        }
    }
    
    // If you're missing a peer (or you didn't know one was ready): willRespondBool = true;
    for (let myPeerId of Object.keys(sharedState.peers)){
        if (!(myPeerId in peers)){
            willRespondBool = true;
        }
        else if(!peers[myPeerId].ready && sharedState.peers[myPeerId].ready){
            willRespondBool = true;
        }
    }

    
    // If you are further along in the game, then I take your deck, tableCards, and peer scores.
    let myTableLen = sharedState.tableCards.filter(x => x != undefined).length;
    let yourTableLen = tableCards.filter(x => x != undefined).length;

    if (gameStartTime == null){
        // the game has not started!
    }
    else if ((deck.length + yourTableLen) < (sharedState.deck.length + myTableLen)){
        print("updating my deck, tableCards, and peer decks based on received state.");

        sharedState.deck = deck;
        sharedState.tableCards = tableCards;
        for(let yourPeerId of Object.keys(peers)){
            sharedState.peers[yourPeerId].deck = peers[yourPeerId].deck;
        }
    }

    if(willRespondBool){
        print(`sending state in response to received state.`);
        sendStateToPeer(peer);
    }

    animateState();
}

window.imReady = function(){
    document.getElementById('startGame').disabled = true
    sharedState.peers[swarm.me].ready = true
    let allReady = Object.values(sharedState.peers).reduce((a,b) => a && b.ready, true);

    if(allReady){
        startGame();
        let hamburger = document.querySelector("#hamburger");
        if(Array.from(hamburger.classList).includes("is-active")){
            hamburger.click();
        }
    }

    animateState()
    for(let peer of swarm.peers){
        sendStateToPeer(peer);
    }
}