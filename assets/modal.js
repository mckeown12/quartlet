function zip(...args){
    let lengths = args.map(a => a.length);
    let n = Math.min(...lengths);
    let zipped = [];
    for(let i=0; i<n; i++){
        zipped.push(args.map(a => a[i]));
    }
    return zipped;
};

/* 
    a template literal that does nothing... not related to lit-html or polymer
    although we are using the lit-html syntax highlighting ;)
*/
function html(strings, ...args) {
    let result = [strings[0]];

    for (let i=0; i < args.length; i++){
        result.push(args[i]);
        result.push(strings[i+1]);
    }

    return result.join('');
}
  
const closeIconStyles = html`
    <style>
        .closeModal {
            margin: 0px 0px 0px auto;

            width: 32px;
            height: 32px;
            border-radius: 50%;
            text-align:right;
            font-size:25px;
            font-family:sans-serif;
            cursor:pointer;
        }

        .closeModal:hover{
            opacity: 0.6;
        }

    </style>
`

const otherModalStyles = html`
    <style>
        .modalHeader{
            display:flex;
            align-items:center;
            font-size: 20pt;
            font-variant: bold;
            padding-bottom:12px;
            margin:0px;

            border-bottom: 1px solid lightgrey;
        }

        .modalOuter{
            position: fixed;
            top: 0px;
            left: 0px;
            width: 100vw;
            height: 100vh;
            z-index:1000;

            background:rgba(0,0,0,0.5);

            display: flex;
            justify-content: center;
            align-items: center;
        }

        .modalInner{
            min-width:350px;
            width: 30vw;
            height: 30vh;
            background: whitesmoke;
            border-radius: 5px;
            padding: 12px;
        }

        .content{ }

    </style>
`;

const modalTemplateStr = html`
    ${closeIconStyles}
    ${otherModalStyles}

    <div class="modalOuter">
        <div class="modalInner">
            
            <div class="modalHeader">
                <slot name="title"></slot>

                <p class="closeModal" id="closeModal">
                    <svg class="modalX" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                    </svg>
                </p>
            </div>
            
            <br>
            <slot name="content"></slot>
        </div>
    </div>
`;

const modalTemplate = document.createElement('template');
modalTemplate.innerHTML = modalTemplateStr;



class Modal extends HTMLElement{
    static get observedAttributes(){return []};

    constructor(htmlContent){
        super();

        // Create a shadow root and fill it with the template.
        this.shadow = this.attachShadow({mode: 'open'});
        this.shadow.appendChild(modalTemplate.content.cloneNode(true));
        this.shadow.getElementById("closeModal").addEventListener("click", this.destroy.bind(this));
    }

    destroy(){
        this.parentElement.removeChild(this);
    }

    updateTitle(title){
        this.querySelector("[slot='title']").innerHTML = title;
    }

    updateContent(content){
        this.querySelector("[slot='content']").innerHTML = content;
    }

}


customElements.define("my-modal", Modal);


function createNewModal(title, content, settings){
    let modal = document.createElement("my-modal");
    modal.innerHTML = html`
        <span slot="title"> ${title} </span>
        <span slot="content"> ${content} </span>
    `;

    if(settings !== undefined && "self_destruct_ms" in settings)
        setTimeout(modal.destroy.bind(modal), settings.self_destruct_ms);

    return modal;
}






// handler = createNewModal(`this ${content} is still loading...`, height=50%, min-width=)