// Shared objects: deck, table, players(and their sets), chat
// all messages will be json with two keys: type and body
// deck is shared once at the beginning
// players is updated every time someone connects or gets a set and is resent to everyone
// table is updated every time someone gets a set
// chat is updated every time someone sends a message

// Michael Scott's Meridith Palmer Memorial Celebrity Rabies-Awareness Fun-Run Pro-Am Race...#forthecure.
window.nonce = '420msdmsmpmcrafrparftc69';

function encode(s){
    return s;
    // return `${s}_${window.nonce}`
}

function decode(s){
    return s;
    // return s.split("_").slice(0,-1).join('_');
}


// We are hosting.
function hostRoom(roomName, myName){
    window.peer = new Peer(id = encode(roomName), {debug:3});

    // once we've connected to the PeerServer.
    peer.on('open', function(id) {
        window.hosting = true;
        window.username = myName;
        console.log(`Hosting!`);
    });

    // We weren't able to connect to the PeerServer.
    peer.on('error', function(err){
        console.log("Can't host...let's try joining again...");
        joinRoom(roomName, myName)
    });

    peer.on("connection", function(conn) {
        console.log(`connection established with someone else...: ${conn.metadata.name}`)

        conn.on('open', function(){
            console.log(`connection with ${conn.metadata.name} ready-to-use`);
            conn.on('data', handleClientData);
        });
    })
}

//We are trying to join. (fallback to hosting)
function joinRoom(roomName, myName){
    window.username = myName;
    window.peer = new Peer({debug:3});

    // once we've connected to the PeerServer.
    peer.on('open', id => (window.peerid = id));

    var conn = peer.connect(encode(roomName), {
        reliable: true,
        metadata: {name: myName}
    });

    // try to connect to pre-existing host.
    conn.on('open', function() {
        console.log(`Connected to room '${roomName}'...`)
        window.hosting=false;

        // Receive messages
        conn.on('data', handleHostData);
    });

    // host yourself if connecting failed
    peer.on('error', function(err){
        window.err = err;
        if(err.type == "peer-unavailable"){
            console.log(`Couldn't join room '${roomName}', hosting instead...: ${err}`);
            hostRoom(roomName, myName);
        }
        else if(err.type == "unavailable-id"){
            alert(`Another user in the room has already taken the name ${myName}`);
            document.querySelector("#playWithFriends1").classList.remove("hidden");
            document.querySelector("#playWithFriends2").classList.add("hidden");
        }
        else{
            console.log(`Error when connecting to room ${roomName}`);
            console.log(err);
        }
    });   
}


function sendMsg(message, peer){
    let conn = window.peer.connections[peer];
    conn[0].send(message);
}


function shoutMsg(message){
    for(let peer of Object.keys(window.peer.connections)){
        sendMsg(message, peer);
    }
}


function handleClientData(data){
    let {type,body} = data;

    if(type == "quartet"){
        console.log(`Recieved Quartet: ${body}`);
        replaceCards(window.deck, window.table, body);
        shoutMsg({
            type: "state",
            body: window.sharedState
        });
    }
}

function handleHostData(data){
    let {type,body} = data;

    if(type == "state"){
        window.sharedState = body;
        console.log(`Recieved Shared State: ${body}`);
    }
}
