class Dice {
    constructor(DOMHandle) {
        this.html = {
            "1": '<div class="first-face"><div class="pip"></div></div>',
            "2": '<div class="second-face"><span class= "pip"></span><span class="pip"></span></div>',
            "3": '<div class="third-face"><span class= "pip"></span><span class="pip"></span><span class="pip"></span></div>',
            "4": '<div class="fourth-face"><div class= "column"><span class="pip"></span><span class="pip"></span></div><div class="column"><span class="pip"></span><span class="pip"></span></div></div >',
            "5": '<div class="fifth-face"><div class= "column"><span class="pip"></span><span class="pip"></span></div><div class="column"><span class="pip"></span></div><div class="column"><span class="pip"></span><span class="pip"></span></div></div>',
            "6": '<div class="sixth-face"><div class= "column"><span class="pip"></span><span class="pip"></span><span class="pip"></span></div><div class="column"><span class="pip"></span><span class="pip"></span><span class="pip"></span></div></div>',
        }

        this.DOMHandle = DOMHandle;
    }

    Display(roll) {
        this.DOMHandle.innerHTML = "";

        this.DOMHandle.innerHTML = this.html[roll];
    }

    Hide() {
        this.DOMHandle.innerHTML = "";
    }
}

export { Dice };