
function cardClicked(event){
    if(this.style.opacity=="0" || this.classList.contains("hidden")){return;}
    cl = Array.from(this.cardDiv.classList);
    if(cl.includes("selected")){
        this.cardDiv.classList.remove("selected");
        remove(window.selectedCards, this);
    }
    else{
        this.cardDiv.classList.add("selected");
        selectedCards.push(this);
        if(selectedCards.length == 4){
            if(isQuartet(selectedCards.map(stripCard))){
                let qCards = Array.from(document.querySelector("#table").children);

                // sharedState.gameStartTime = sharedState.gameStartTime || Date.now();
                if(sharedState.peers[myId] === undefined){
                    sharedState.peers[myId] = {name: 'Score', deck:[], ready:false};
                }
                
                // update OUR deck
                let quartet = selectedCards.map(c => stripCard(c));
                quartet.push(new Date().valueOf());
                sharedState.peers[myId].deck.push(quartet);
                
                // update THE deck and tableCards (state only)
                for(let qCard of selectedCards){
                    let replacement = sharedState.deck.pop(0);
                    let index = qCards.indexOf(qCard);
                    sharedState.tableCards[index] = replacement;
                }

                if(window.swarm){
                    for(let peer of swarm.peers){
                        sendStateToPeer(peer)
                    }
                }

                selectedCards.forEach(x => x.cardDiv.classList.remove("selected"));
                selectedCards = [];
                
                saveState()
                animateState()
            }
            else{
                for(let c of selectedCards){
                    c.cardDiv.classList.add("shake");
                    setTimeout(() => c.cardDiv.classList.remove("shake"), 1000);
                }
                selectedCards.forEach(x => x.cardDiv.classList.remove("selected"));
                selectedCards = [];
            }
        }
    }

}


class Card extends HTMLElement{
    static get observedAttributes(){return ['color', 'number', 'shape']};

    constructor(){
        super();

        // Create a shadow root and give it styles.
        this.shadow = this.attachShadow({mode: 'open'});
        var link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", "assets/cardstyle.css");
        this.shadow.appendChild(link);
    }

    makeGlyph(shape, color){
        let colorDict = {
            "red": "rgb(220,80,80)",
            "yellow": "rgb(250,220,50)",
            "blue": "rgb(60,60,250)",
            "black": "rgb(50,50,50)",
        }
        color = colorDict[color];

        let table = document.querySelector(".table");
        let cs = getComputedStyle(table);
        let [w,h] = [parseFloat(cs.width), parseFloat(cs.height)];
        let size = ((w+h)/2) / 35;
        size = Math.floor(size);

        let glyph = document.createElementNS('http://www.w3.org/2000/svg','svg');
        glyph.setAttribute("width", `${size}`);
        glyph.setAttribute("height", `${size}`);
        glyph.style.margin = "auto";

        if(shape=='circle'){
            glyph.innerHTML = `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>`;
        }
        if(shape=='triangle'){
            glyph.innerHTML = `<polygon points="0,${size} ${size},${size} ${size/2},0" fill="${color}"/>`
        }
        if(shape=='square'){
            glyph.innerHTML = `<rect width="${size}" height="${size}" fill="${color}"/>`;
        }
        if(shape=='diamond'){
            glyph.innerHTML = `<polygon points="0,${size/2} ${size/2},${size} ${size},${size/2} ${size/2},0" fill="${color}"/>`
        }

        return glyph;
    }

    makeGlyph2(shape, color){
        let el = document.createElement("div");
        el.style.backgroundColor = color;
        el.style.width = "20px";
        el.style.height = "20px";
        el.innerText = shape[0];
        return el;
    }

    connectedCallback(){
        var shape = this.getAttribute('shape');
        var number = Number(this.getAttribute('number'));
        var color = this.getAttribute('color');

        this.cardDiv = document.createElement('div');
        this.cardDiv.setAttribute('class', 'cardDiv');
        this.addEventListener("click", cardClicked);

        for (let i=0; i<number; i++){
            let glyph = this.makeGlyph(shape,color)
            this.cardDiv.appendChild(glyph)
        }
        
        if(number == 4){
            // this.cardDiv.classList.add("fourGlyphs");

            this.cardDiv.innerHTML = `
                <div class="horizontal">
                    <div class="vertical">
                        ${this.makeGlyph(shape, color).outerHTML}
                        ${this.makeGlyph(shape, color).outerHTML}
                    </div>
                    <div class="vertical">
                        ${this.makeGlyph(shape, color).outerHTML}
                        ${this.makeGlyph(shape, color).outerHTML}
                    </div>
                </div>
            `;
        }
        else if(number == 0){
            hideCard(this);
        }
        
        this.shadow.appendChild(this.cardDiv);
    }
}



customElements.define('q-card', Card);


function createCard(n,c,s){
    let card = document.createElement("q-card")
    card.setAttribute('number', n)
    card.setAttribute('color', c)
    card.setAttribute('shape', s)
    return card;
}

function stripCard(card){
    return [
        card.getAttribute("number"),
        card.getAttribute("color"),
        card.getAttribute("shape")
    ]
}

function cardsEq(card1, card2){
    return JSON.stringify(card1) == JSON.stringify(card2)
}

function hideCard(card){
    card.style.opacity = "0";
    card.classList.add("hidden");
    card.cardDiv.style.opacity = "0";
    card.cardDiv.style.cursor = "default";
}