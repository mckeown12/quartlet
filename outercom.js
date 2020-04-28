function makeStylesheet(path){
    let link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", path);
    return link;
}

class Outercom extends HTMLElement {
    static get observedAttributes(){return ['color', 'number', 'shape']};
    constructor(){
        super();
        // Create a shadow root and give it styles.
        this.shadow = this.attachShadow({mode: 'open'});

        this.shadow.appendChild(makeStylesheet("outercom.css"));
        this.shadow.appendChild(makeStylesheet("fa/css/all.css"));
        this.classList.add("outercom")
    }
    connectedCallback(){
        let icon = document.createElement("i")
        icon.classList.add("far")
        icon.classList.add("fa-comment-alt")
        icon.classList.add("fa-5x")
        icon.classList.add("fa-flip-horizontal")
        this.box = document.createElement("div")
        this.box.classList.add("outer-box")
        this.shadow.appendChild(icon)
        this.form = document.createElement("form")
        this.form.classList.add("form")
        this.form.setAttribute("action", "javascript:void(0)")
        this.form.setAttribute("onsubmit", "this.handleMessage")
        this.input = document.createElement("input")
        this.input.setAttribute("type", "text")
        this.input.classList.add("textbox")
        this.form.appendChild(this.input)
        this.submit = document.createElement("input")
        this.submit.setAttribute("type", "submit")
        this.submit.setAttribute("value", "send")
        this.form.appendChild(this.submit)
        // this.inputBox.addEventListener(onsubmit, this.handleMessage)
        // this.inputBox.classList.add("my-input-box")
        this.box.appendChild(this.form)
        this.shadow.appendChild(this.box)

    }
    set swarm(swarm){
        this.swarm = swarm
    }
    get swarm(){
        return this.swarm
    }
    handleMessage(peer, data){
        let text = document.createElement("p")
        text.innerHTML = data
        this.box.appendChild(text)
    }
}
customElements.define('outer-com', Outercom);
