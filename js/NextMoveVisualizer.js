class NextMoveVisualizer {
    /**
     * @param {HTMLDivElement} DOMHandle 
     */
    constructor(DOMHandle) {
        this.DOMHandle = DOMHandle;

        this.DOMElement = null;
    }

    /**
     * @param {Number} size 
     */
    Create(size) {
        this.DOMElement = document.createElement("div");

        this.Hide();
        this.DOMElement.classList.add("next-move-visualizer");

        this.DOMElement.style.width = size + "px";
        this.DOMElement.style.height = size + "px";
        this.DOMElement.style.borderRadius = (size / 2) + "px";

        this.DOMHandle.append(this.DOMElement);
    }

    /**
     * @param {Number} left 
     * @param {Number} top 
     */
    Move(left, top) {
        this.DOMElement.style.left = left + "px";
        this.DOMElement.style.top = top + "px";
    }

    /**
     * @param {String} color
     * @param {"kill" | "move"} type
     */
    Show(color, type) {
        this.DOMElement.classList.add(color);

        // if (type == "kill") {
        //     this.DOMElement.innerHTML = "&#9760;";
        // } else {
        //     this.DOMElement.innerHTML = "";
        // }

        this.DOMElement.classList.remove("hidden");
    }
    Hide() {
        this.DOMElement.classList.add("hidden");
        this.DOMElement.innerHTML = "";
        this.DOMElement.classList.remove("red", "blue", "green", "yellow");
    }
}

export { NextMoveVisualizer };