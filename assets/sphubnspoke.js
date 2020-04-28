// const hub = signalhub('quartet', [
//         'https://signalhub-jccqtwhdwc.now.sh',
//     // 'https://signalhub-hzbibrznqa.now.sh'
// ])

// Shared objects: deck, table, players(and their sets), chat
// all messages will be json with two keys: type and body
// deck is shared once at the beginning
// players is updated every time someone connects or gets a set and is resent to everyone
// table is updated every time someone gets a set
// chat is updated every time someone sends a message

const signalhub = require("signalhub");
const createSwarm = require("webrtc-swarm");
window.Peer = require("simple-peer");


/*
    Types of messages:
    ==================
    WHEN JOINING THE GAME:
        nameChoiceNotification: Send your name to your peers along with your current and past ids.
        readyNotification: Let a peer know that you're ready to play.
        startCommand: an initial game state and starttime (5 seconds in future)
    
    DURING GAMEPLAY:
        newState: a new state of the game (because someone got a quartet).
*/




window.joinRoom = function(roomName, myName){
    window.username = myName;

    const hub = signalhub(`quartet_${roomName}`, ['http://192.168.0.118:8080'])
    window.swarm = createSwarm(hub)
    let ids = JSON.parse(window.localStorage.getItem('oldIds'))
    if(ids===null){ids=[]}
    ids.push(window.swarm.me)
    window.localStorage.setItem('oldIds') = JSON.stringify(ids)
    // "connect" means a new peer. 
    swarm.on("connect", function(peer, id){
        peer.on("data", getHandler(peer, id));
        let oldIds = window.localStorage.getItem(oldIds)
        if(oldIds==null){oldIds=[]}
        sendToPeer({
            type: "nameChoiceNotification", 
            data: {name:myName, currentId: swarm.me, oldIds:oldIds}
        }, peer);
    })

    // setInterval(function(){
        for(let peer of swarm.peers){
            
        }
    // },4000);
}


function getHandler(peer, id){
    function handler(data){
        data = JSON.parse(data.toString());
        handlePeerData(peer, id, data);
    }
    return handler;
}

function handlePeerData(peer, id, data){
    console.log(`${JSON.stringify(data)} from ${id}`)
    let type;
    ({type, data} = data);
    let handlers = {
        nameChoiceNotification: nameChoiceNotificationHandler,
        newState: newStateHandler
    }
    return handlers[type](peer, id, data);
}

function sendToPeer(data, peer){
    peer.send(JSON.stringify(data));
}

function nameChoiceNotificationHandler(peer, id, data){
    let {name, currentId, oldIds} = data;
    let oldPeerState = {};
    for(let id of oldIds){
        if(id in sharedState.peers){
            oldPeerState = sharedState.peers[id];
            delete sharedState.peers[id];
        }
    }
    oldPeerState.name = name;
    if(!("ready" in oldPeerState)){
        oldPeerState.ready = (sharedState.gameStartTime != null);
    }
    if(!("deck" in oldPeerState)){
        oldPeerState.deck = [];
    }

    sharedState.peers[currentId] = oldPeerState;
    //tell the dude what the state is!
}
//todo: make sure peers are preserved when updating state
function newStateHandler(peer, id, yourState){
    let myLen = window.sharedState.deck.length;
    let myTime = window.sharedState.timestamp;
    let yourLen = yourState.deck.length;
    let yourTime = yourState

    if ((myLen < yourLen) ||
        ((myLen == yourLen) && (myTime < yourTime))){
        sendToPeer({
            type:"newState", 
            data:{
                timestamp: Date.now(),
                state: window.sharedState
            }
        }, peer);
    }
    else{
        updateAndAnimateState(yourState);
    }

}