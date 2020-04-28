// general helpers:
emojis = ["🖕", "⌛", "👨‍👨‍👧‍", "😆", "⛽", "💩", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "😍","👵","🐻","😚","🤦‍♂️","📍","⛷","😢","👋"];

const range = (n => [...Array(n).keys()]);
const flatten = (l => [].concat(...l));

const any = (l => l.reduce((a,b) => a || b));
const all = (l => l.reduce((a,b) => a && b));

function choice(l){
    let index = Math.floor(Math.random() * l.length);
    return l[index];
}

const f = (a, b) => flatten( a.map(d => b.map(e => flatten([d, e]))) );
const cartesian = (...arrays) => arrays.reduce(f)

function print(newMsg){
    let c = document.querySelector("#console");
    let oldMessages = Array.from(c.children);

    for(let [i,msg] of oldMessages.slice(0,-1).entries()){
        c.children[i].innerHTML = c.children[i+1].innerHTML;
    }

    let d = new Date();
    let timestamp = `${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}`
    newMsg = `${timestamp} - ${choice(emojis)}: ${newMsg}`;

    c.children[c.children.length - 1].innerHTML = newMsg;
    console.log(newMsg);
}

function shuffle (array) {
    array = Array.from(array);
	var currentIndex = array.length;
	var temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
};

function remove(arr, value) {
    arr.forEach((x,i) => x == value ? arr.splice(i,1) : null);
}

function setDiff(A, B, comparator){
    let aMinusB = [];
    for(let a of A){
        if(!any(B.map(b => comparator(a,b)))){
            aMinusB.push(a);
        }
    }
    return aMinusB;
}

function findCardInTable(card){
    let [n,c,s] = card;
    let selector = `q-card[number='${n}'][color='${c}'][shape='${s}']`
    // console.log(selector)
    return document.querySelector(selector);
}

//////////////

function allEqual(list){
    s = new Set(list);
    return s.size == 1;
}

function allDiff(list){
    s = new Set(list);
    return s.size == list.length;
}


function matchInPairs(quartet){
    let [a,b,c,d] = quartet;
    return ((a == b) && (c == d)) || 
            ((a == c) && (b == d)) || 
            ((a == d) && (b == c));
}

function isQuartet(listOfCards){
    let bool = true;

    if(any(listOfCards.map(c => c == undefined))){
        return false;
    }

    for(let [i,attr] of ["number", "color", "shape"].entries()){
        // l = listOfCards.map(c => c.getAttribute(attr));
        l = listOfCards.map(c => c[i]);
        bool = bool && ( matchInPairs(l) || allEqual(l) || allDiff(l) );
    }

    return bool;
}


function kTuplesOfN(k,n){
    if(k > n){
        return [];
    }
    else if(k==n){
        return [range(n)]
    }
    else if(k==1){
        return range(n).map(i => [i])
    }
    else{
        let km1TuplesOfNm1 = kTuplesOfN(k-1,n-1)
        let kTuplesOfNm1 = kTuplesOfN(k,n-1)
        let containsN = km1TuplesOfNm1.map(l => l.concat(n-1))
        return containsN.concat(kTuplesOfNm1)
    }
}

function findQuartets(cards){
    cards = Array.from(cards);
    // cards = cards.filter(function(x){
    //     let o = x.style.opacity;
    //     return o == "" || o == "1";
    // });

    let subsets = kTuplesOfN(4, cards.length);
    subsets = subsets.map(subset => subset.map(i => cards[i]));
    return subsets.filter(subset => isQuartet(subset));
}

function createDeck(){
    let numbers = ['1', '2', '3', '4']
    let colors = ['red', 'black', 'yellow', 'blue']
    let shapes = ['square', 'diamond', 'triangle', 'circle']
    let props = cartesian(numbers, colors, shapes)
    return props;
}


function updateNumQuartets(){
    document.querySelector("#numQuartets").innerText = `${findQuartets(sharedState.tableCards).length}`;
}

function hint(){
    let quartets = findQuartets(sharedState.tableCards);
    let i = Math.floor(Math.random() * quartets.length)
    for(let card of quartets[i]){
        card = findCardInTable(card);
        card.cardDiv.classList.add('hint')
        setTimeout(() => card.cardDiv.classList.remove('hint'), 420)
    }
}

function countdownToGameStart(){
    let modal = createNewModal("Game Starting", `The game is about to start`);
    let startTime = Date.now() / 1000;
    setTimeout(function(){
        window.countdownInterval = setInterval(function(){
            let timeElapsed = (Date.now()/1000 - startTime);
            let timeLeft = Math.floor(5 - timeElapsed);
            modal.updateContent(`New game in ${timeLeft} seconds!`);

            if(timeLeft < 1){
                clearInterval(window.countdownInterval);
                modal.destroy();
            }

        },200);
    }, 1000);
    document.body.appendChild(modal);
}

function congratulateAndCountdown(winner){
    // alert(`Game Over! Congratulations to "${winner}"!`);
    let modal = createNewModal("Game Over", `Congratulations to ${winner}!`);
    let startTime = Date.now() / 1000;
    setTimeout(function(){
        window.countdownInterval = setInterval(function(){
            let timeElapsed = (Date.now()/1000 - startTime);
            let timeLeft = Math.floor(5 - timeElapsed);
            modal.updateContent(`Congratulations to ${winner}!<br>New game in ${timeLeft} seconds!`);

            if(timeLeft < 1){
                clearInterval(window.countdownInterval);
                modal.destroy();
            }

        },200);
    }, 1000);
    document.body.appendChild(modal);
}

function checkGameOver(){
    if(findQuartets(sharedState.tableCards).length == 0){

        // determine the winner.
        let peers = [myId];
        let winner = "you"
        if(window.swarm !== undefined){
            peers.push(...Object.keys(swarm.remotes));
            let deckLength = (a => sharedState.peers[a].deck.length);
            let winnerId = peers.sort((a,b) => deckLength(a) > deckLength(b) ? -1 : 1)[0];
            winner = sharedState.peers[winnerId].name;
        }

        congratulateAndCountdown(winner);

        // If I'm the starter, then send everybody the new in 5 seconds.
        let starter = peers.sort((a,b) => a < b ? -1 : 1)[0];
        if (myId == starter){
            setTimeout(function(){
                startGame();
                animateState();
                
                if(window.swarm !== undefined){
                    for(let peer of swarm.peers){
                        sendStateToPeer(peer);
                    }
                }
            },4000);
        }
    }
}

function cheat(){
    let quartets = findQuartets(sharedState.tableCards);
    let i = Math.floor(Math.random() * quartets.length)
    for(let card of quartets[i]){
        findCardInTable(card).click();
    }
}

function cheatN(n){
    for(let i=0;i<n;i++){
        setTimeout(cheat, 450*i);
    }
}

function toggleSettings(){
    let gameSettings = document.getElementById("gameSettings")
    let content = document.querySelector(".settingsContent")
    let hamburger = document.getElementById("hamburger");
    let active = Array.from(hamburger.classList).includes("is-active");
    if(active){
        gameSettings.classList.add("settingsHidden")
        gameSettings.style.alignItems = "center";
        content.classList.add("hidden")
        hamburger.classList.remove("is-active");
    }
    else{
        gameSettings.classList.remove("settingsHidden")
        gameSettings.style.alignItems = "flex-start";
        content.classList.remove("hidden")
        hamburger.classList.add("is-active");
    }
}

function enableButton(){
    let userName = document.getElementById("userName").value
    let roomName = document.getElementById("roomName").value
    if ((userName != '') && (roomName != '')){
        document.getElementById('joinRoomButton').disabled=false
    }
    else{
        document.getElementById('joinRoomButton').disabled=true
    }
}

function playWithFriends(){
    document.querySelector("#playWithFriends1").classList.add("hidden");
    document.querySelector("#playWithFriends2").classList.remove("hidden");
    // document.querySelector("#hint").classList.add("hidden");

    // hack to ensure all table cards are replaced by animateState
    let table = document.querySelector("#table");
    Array.from(table.children).forEach(card => {
        table.replaceChild(createCard(0, "blue", "square"), card);
    });

    // Join the requested room name with the requested username.
    let uname = document.querySelector("#userName").value;
    let rname = document.querySelector("#roomName").value;
    joinRoom(rname, uname);
    animateState()
}


function startGame(){
    let deck = shuffle(createDeck());
    sharedState.gameStartTime = Date.now();
    sharedState.timestamp = Date.now();
    sharedState.deck = deck.slice(12);
    sharedState.tableCards = deck.slice(0,12);
    for(let peer of Object.values(sharedState.peers)){
        peer.deck=[]
    }
}

function singlePlayerInitState(){
    let deck = shuffle(createDeck());
    return {
        roomName: "C00L_R00M",
        type: "state",                  // as opposed to newId
        timestamp: Date.now(),          // when was this state last updated.
        gameStartTime: Date.now(),
        gameEndTime: null,
        peers: {},
        deck: deck.slice(12),           // cards not on the table or in players' decks.
        tableCards: deck.slice(0,12)    // cards on the table
    }
}

function saveState(){
    localStorage.setItem("sharedState", JSON.stringify(sharedState));
    localStorage.setItem("oldId", window.swarm ? swarm.me : 'localMe');
}

function killState(){
    localStorage.removeItem("sharedState");
    localStorage.removeItem("oldId");
}

function loadState(){
    window.sharedState = JSON.parse(localStorage.getItem("sharedState"));
    window.oldId = localStorage.getItem("oldId");
    if(sharedState == null){
        sharedState = singlePlayerInitState();
    }
}


/////////// animating state ////////////

function animateReadyState(){
    let playWithFriends2 = document.getElementById("playWithFriends2");
    let playersReady = document.getElementById("playersReady");
    let playersNotReady = document.getElementById("playersNotReady");
    let readyPeerString = ''
    let notReadyPeerString = ''
    for(let peer of Object.values(sharedState.peers)){
        if(peer.ready){
            readyPeerString += `<span class="player_name">${peer.name}</span>`
        }
        else{
            notReadyPeerString += `<span class="player_name">${peer.name}</span>`
        }
    }
    playersReady.innerHTML = readyPeerString;
    playersNotReady.innerHTML = notReadyPeerString;

    if(sharedState.gameStartTime != null){
        playWithFriends2.classList.add("hidden");
    }
    else{
        playWithFriends2.classList.remove("hidden");
    }
}

function animateScoreState(){
    let scores = document.getElementById("scores");
    let stateString = ''
    for(let peer of Object.values(sharedState.peers)){
        stateString +=`<span class="score"><b>${peer.name}</b>: ${peer.deck.length}</span>`
    }
    scores.innerHTML = stateString

    if(sharedState.gameStartTime != null){
        try{
            scores.classList.remove("hidden");
        }catch{}
    }
    else{
        scores.classList.add("hidden");
    }
}

function animateTableState(){
    let {tableCards, gameStartTime} = sharedState;
    if(gameStartTime === null){
        return;
    }else if([false, undefined].includes(window.countedDown)){
        countdownToGameStart();
        window.countedDown = true;
    }
    
    //find table diff
    let table = document.getElementById('table');
    let oldTableCards = Array.from(table.children);
    let oldTableState = oldTableCards.map(qcard => stripCard(qcard));

    // q-cards
    let leavingCards = []
    let arrivingCards = []

    for(let i=0; i<12; i++){
        let leaving = oldTableCards[i]
        let arriving;
        if(tableCards[i]){
            arriving = createCard(...tableCards[i]);
        }
        else{
            arriving = document.createElement("q-card");
            arriving.setAttribute('number', 0);
            arriving.setAttribute('color', "red");
            arriving.setAttribute('shape', "diamond");
        }

        if(!cardsEq(stripCard(leaving), stripCard(arriving))){
            leavingCards.push(leaving);
            arrivingCards.push(arriving);
        }
    }


    leavingCards.forEach(c => c.style.opacity="0");
    if(leavingCards.length > 0){
        selectedCards.forEach(x => x.cardDiv.classList.remove("selected"));
        selectedCards = [];
    }


    setTimeout(function(){
        for(let i=0; i<arrivingCards.length; i++){
            let arriving = arrivingCards[i];
            let leaving = leavingCards[i];
            table.replaceChild(arriving, leaving);
            
            arriving.style.opacity = "1";
        }

        updateNumQuartets();
        checkGameOver();
    }, 300)
}

function animateState(){
    animateReadyState();
    animateScoreState();
    animateTableState();
}