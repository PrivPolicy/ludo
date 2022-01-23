class Speech {
    constructor() {
        this.messages = {};

        this.synth = window.speechSynthesis;

        this.voices = [];
        this.activeVoice = 0;

        this.synthUtterance = new SpeechSynthesisUtterance();
    }

    Init() {
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = this.Populate.bind(this);
        }
    }

    Populate() {
        this.voices = this.synth.getVoices();

        for (let i = 0; i < this.voices.length; i++) {
            if (this.voices[i].lang === "pl-PL") {
                this.activeVoice = i;
                break;
            }
        }

        console.log(this.voices[this.activeVoice]);
    }

    Speak(message, literal = false) {
        if (literal == false) {
            message = this.messages[message] || "";
        }

        this.synthUtterance.text = message;
        this.synthUtterance.voice = this.voices[this.activeVoice];
        this.synthUtterance.rate = 1;
        this.synthUtterance.pitch = 1;

        this.synth.speak(this.synthUtterance);
    }
}

export { Speech };