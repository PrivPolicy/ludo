import { SETTINGS } from "./SETTINGS.js";
import { Board } from "./Board.js";
import { Speech } from "./Speech.js";
import { Dice } from "./Dice.js";
import { NextMoveVisualizer } from "./NextMoveVisualizer.js";
import { ServerTime } from "./ServerTime.js";

class Mensch_ärgere_Dich_nicht {
    constructor(DOMHandle) {
        this.DOMHandle = DOMHandle;

        this.validUsername = false;

        this.html = {
            joinOverlay: null,
            game: null,
            username: null,
            usernameContainer: null,
            joinButton: null,
            gameDisplay: null,
            changeReadyStatus: null,
            gameTimer: null,
            canvas: null,
            canvasPawns: null,
            nextMoveVisualizer: null,
            gameOther: null,
            diceControls: null,
            diceRoll: null,
            diceResult: null,
            diceImage: null,

            gameOver: null,
            gameOverTitle: null,
            gameOverWinner: null,
            gameOverReplay: null,
        };

        this.ajaxTask = null;

        this.gameStartsTask = null;
        this.gameStarts = -1;

        this.turnTimeTask = null;
        this.turnTimeEnd = -1;

        this.board = null;

        this.speech = new Speech();
        this.speech.Init();

        this.dice = null;

        this.nextMoveVisualizer = null;

        this.gameOver = false;

        this.serverTime = new ServerTime();
        this.ajaxCount = 0;

        this.InitHTML();
        this.CheckSession();
    }

    InitHTML() {
        this.html.joinOverlay = document.getElementById("join-overlay");
        this.html.username = document.getElementById("username");
        this.html.usernameContainer = document.getElementById("username-container");
        this.html.joinButton = document.getElementById("join-button");
        this.html.game = document.getElementById("game");
        this.html.gameDisplay = document.getElementById("game-display");
        this.html.changeReadyStatus = document.getElementById("player-ready");
        this.html.gameTimer = document.getElementById("game-timer");
        this.html.canvasPawns = document.getElementById("canvas-pawns");
        this.html.nextMoveVisualizer = document.getElementById("next-move-visualizer");
        this.html.gameOther = document.getElementById("game-other");
        this.html.diceControls = document.getElementById("dice-controls");
        this.html.diceRoll = document.getElementById("dice-roll");
        this.html.diceResult = document.getElementById("dice-result");
        this.html.diceImage = document.getElementById("dice-image");
        this.html.gameOver = document.getElementById("game-over");
        this.html.gameOverTitle = document.getElementById("game-over-title");
        this.html.gameOverWinner = document.getElementById("game-over-winner");
        this.html.gameOverReplay = document.getElementById("game-over-replay");

        this.html.canvas = document.getElementById("canvas");
        this.board = new Board(this.html.canvas, this.html.canvasPawns);

        this.dice = new Dice(this.html.diceImage);

        this.nextMoveVisualizer = new NextMoveVisualizer(this.html.nextMoveVisualizer);
        this.nextMoveVisualizer.Create(this.board.fieldSize - 4);

        this.html.username.oninput = this.ValidateUsername.bind(this);
        this.html.username.addEventListener("keyup", (e) => {
            e.preventDefault();

            if (e.keyCode === 13) {
                this.QuickJoin();
            }
        });
        this.html.joinButton.onclick = this.QuickJoin.bind(this);
        this.html.changeReadyStatus.onclick = this.ChangeReadyState.bind(this);
        this.html.diceRoll.onclick = this.RollDice.bind(this);
        this.html.gameOverReplay.onclick = () => { window.location.reload(true) };
    }

    ValidateUsername() {
        /**
         * @type {String}
         */
        let u = this.html.username.value;

        let regexp = /^[A-Za-z0-9 ]{3,}$/gm;

        this.validUsername = u.match(regexp) != null;

        if (this.validUsername) {
            this.html.usernameContainer.classList.remove("invalid");
        } else {
            this.html.usernameContainer.classList.add("invalid");
        }
    }

    CheckSession() {
        fetch('./php/CheckSession.php', { method: "POST" })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.log(data.error);
                } else if (data.session == "loaded") {
                    //!do stuff
                    this.AjaxStart();
                    this.GetGameState();
                    console.log(data.session);
                } else {
                    console.log(data);
                }
            });
    }

    QuickJoin() {
        if (this.validUsername == false) {
            return;
        }

        let fd = new FormData();
        //@ts-ignore
        fd.append("nick", document.getElementById("username").value)

        fetch('./php/QuickJoin.php',
            {
                method: "POST",
                body: fd
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.log(data.error);
                } else if (data.session == "created") {
                    //!do stuff
                    this.AjaxStart();
                    this.GetGameState();
                    console.log(data.session);
                } else {
                    console.log(data);
                }
            });
    }

    ChangeReadyState() {
        fetch('./php/ChangeReadyStatus.php', { method: "POST" })
            .then(response => response.json())
            .then(data => {
                if (data.status == 1) {
                    this.html.changeReadyStatus.classList.add("ready");
                    this.html.changeReadyStatus.innerHTML = "Ready";
                } else if (data.status == 0) {
                    this.html.changeReadyStatus.classList.remove("ready");
                    this.html.changeReadyStatus.innerHTML = "Not ready";
                }

                this.GetGameState();
            });
    }

    GetGameState() {
        if (this.ajaxCount++ % SETTINGS.timeSyncDelay == 0) {
            this.serverTime.Sync();
        }

        fetch('./php/GetGameState.php', { method: "POST" })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.warn(data.error);

                    if (data.action && data.action == "restart") {
                        location.reload();
                    }

                    return;
                }

                let o = data[0];

                o["board_data"] = JSON.parse(o["board_data"]);
                o["player_data"] = JSON.parse(o["player_data"]);

                this.ProcessGameState(o);
            });
    }

    AjaxStart() {
        if (this.ajaxTask == null) {
            this.ajaxTask = setInterval(() => {
                this.GetGameState();
            }, SETTINGS.ajaxDelay);
        }
    }

    AjaxStop() {
        if (this.ajaxTask != null) {
            clearInterval(this.ajaxTask);
            this.ajaxTask = null;
        }
    }

    AjaxReset() {
        this.AjaxStop();
        this.AjaxStart();
    }

    GameStartsStart(gameStarts) {
        if (this.gameStartsTask == null) {
            this.gameStarts = gameStarts;

            this.gameStartsTask = setInterval(() => {
                this.html.gameTimer.innerText = `Game starts in ${Math.max(0, Math.round((this.gameStarts - this.serverTime.Now()) / 1000))} seconds`;
            }, SETTINGS.gameStartsUpdateDelay);
        }
    }

    GameStartsStop() {
        if (this.gameStartsTask != null) {
            this.gameStarts = -1;
            this.html.gameTimer.innerText = "";

            clearInterval(this.gameStartsTask);
            this.gameStartsTask = null;
        }
    }

    TurnTimeStart(turnTimeEnd, nick, color) {
        if (this.turnTimeTask == null) {
            this.turnTimeEnd = turnTimeEnd;

            this.turnTimeTask = setInterval(() => {
                this.html.gameTimer.innerHTML = `<span class="${color}">${nick}</span> ends the turn in ${Math.max(0, Math.round((this.turnTimeEnd - this.serverTime.Now()) / 1000))} seconds`;
            }, SETTINGS.gameStartsUpdateDelay);
        }
    }

    TurnTimeStop() {
        if (this.gameStartsTask != null) {
            this.gameStarts = -1;
            this.html.gameTimer.innerText = "";

            clearInterval(this.gameStartsTask);
            this.gameStartsTask = null;
        }
    }

    RollDice() {
        fetch('./php/RollDice.php', { method: "POST" })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.log(data.error);
                } else {
                    this.html.diceResult.innerHTML = `<span class="${data.color}">You</span> rolled: ${data.roll}`;
                    this.dice.Display(data.roll);

                    this.html.diceRoll.classList.remove("active");

                    this.board.DrawHTMLPawns(data.color, data.roll, this.PawnClick.bind(this), this.PawnMouseEnter.bind(this), this.PawnMouseLeave.bind(this));

                    let message = "";

                    switch (data.roll) {
                        case 1: { message = "jeden"; break; }
                        case 2: { message = "dwa"; break; }
                        case 3: { message = "trzy"; break; }
                        case 4: { message = "cztery"; break; }
                        case 5: { message = "pięć"; break; }
                        case 6: { message = "sześć"; break; }
                    }

                    this.speech.Speak(message, true);
                }
            });
    }

    /**
     * @param {0 | 1 | 2 | 3} id 
     */
    PawnClick(id) {
        //! narazie brak sprawdzania poprawności ruchu

        this.PawnMove(id);
    }

    /**
     * @param {0 | 1 | 2 | 3} id
     */
    PawnMove(id) {
        fetch('./php/PawnMove.php', { method: "POST", body: `id=${id}`, headers: { "Content-Type": "application/x-www-form-urlencoded" } })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.log(data.error);
                } else {
                    this.AjaxReset();
                    this.nextMoveVisualizer.Hide();
                    this.board.ResetHTMLPawns();
                    this.GetGameState();
                }
            });
    }

    /**
     * @param {Number} left
     * @param {Number} top
     * @param {String} color
     * @param {"move" | "kill"} type
     */
    PawnMouseEnter(left, top, color, type) {
        this.nextMoveVisualizer.Move(left, top);
        this.nextMoveVisualizer.Show(color, type);
    }

    PawnMouseLeave() {
        this.nextMoveVisualizer.Hide();
    }

    /**
     * 
     * @param {Object} state 
     * @param {Object} state.board_data 
     * @param {Number} state.board_data.starts
     * @param {Number} state.board_data.roll
     * @param {"red" | "blue" | "green" | "yellow"} state.board_data.turn
     * @param {Number} state.board_data.turn_start
     * @param {Number} state.board_data.turn_end
     * @param {String} state.board_data.winner_color
     * @param {String} state.board_data.winner_nick
     * @param {String} state.board_data.your_color
     * @param {String} state.board_data.your_nick
     * @param {Number} state.board_data.ends
     * @param {String} state.board_data.your_color
     * @param {{red: String[], blue: String[], green: String[], yellow: String[]}} state.board_data.pawns
     * @param {{id1: {nick: String, joined: Number, status: Number, color: String}, id2: {nick: String, joined: Number, status: Number, color: String}, id3: {nick: String, joined: Number, status: Number, color: String}, id4: {nick: String, joined: Number, status: Number, color: String}}} state.player_data
     * @param {String} state.you
     * @param {Number} state.state
     */
    ProcessGameState(state) {
        this.html.joinOverlay.classList.add("hidden");

        let you = state.you;

        if (state.state == 0) {
            /**
         * @type {NodeListOf<HTMLDivElement>}
         */
            let players = document.querySelectorAll("#player-display #players .player");
            let keys = Object.keys(state["player_data"]);
            let youSet = false;

            for (const player of players) {
                player.innerHTML = "Waiting...";
                player.classList.remove("red", "green", "yellow", "blue", "ready");
            }

            for (let i = 0; i < 4; i++) {
                if (keys[i] !== undefined) {
                    // console.log(you, keys[i]);

                    if (you == keys[i]) {
                        let p = state["player_data"][you];
                        youSet = true;

                        players[0].innerHTML = p.nick;
                        players[0].classList.add(p.color);

                        players[0].classList.remove("ready");
                        this.html.changeReadyStatus.classList.remove("ready");
                        this.html.changeReadyStatus.innerHTML = "Not ready";
                        if (p.status == 1) {
                            players[0].classList.add("ready");
                            this.html.changeReadyStatus.classList.add("ready");
                            this.html.changeReadyStatus.innerHTML = "Ready";
                        }
                    } else {
                        let index = youSet ? i : i + 1;

                        let p = state["player_data"][keys[i]];

                        players[index].innerHTML = p.nick;
                        players[index].classList.add(p.color);

                        players[index].classList.remove("ready");
                        if (p.status == 1) {
                            players[index].classList.add("ready");
                        }
                    }
                }
            }

            if (state["board_data"].starts == -1) {
                this.GameStartsStop();
            } else if (state["board_data"].starts != this.gameStarts) {
                clearInterval(this.gameStartsTask);
                this.gameStartsTask = null;

                this.GameStartsStart(state["board_data"].starts);
            }
        } else if (state.state == 1 || (state.state == 2 && this.gameOver == false)) {
            this.GameStartsStop();

            this.board.pawns = state["board_data"].pawns;

            this.html.changeReadyStatus.style.display = "none";
            document.getElementById("player-display").classList.add("small");
            this.html.gameDisplay.classList.remove("hidden");

            let players = document.querySelectorAll("#player-display #players .player");
            let keys = Object.keys(state["player_data"]);
            let turn = state["board_data"].turn;
            let youSet = false;

            if (state.player_data[state.you].color == state.board_data.turn) { // your turn
                if (state.board_data.roll == -1) {
                    this.html.diceRoll.classList.add("active");
                } else {
                    this.html.diceRoll.classList.remove("active");
                }

                if (this.html.diceResult.children.length > 0) {
                    if (this.html.diceResult.children[0].innerText != "You") {
                        this.html.diceResult.innerHTML = "";
                        this.dice.Hide();
                    }
                } else {
                    this.html.diceResult.innerHTML = "";
                    this.dice.Hide();
                }

                if (state.board_data.roll != -1 && this.html.canvasPawns.innerHTML == "") {
                    this.html.diceResult.innerHTML = `<span class="${state["board_data"].turn}">You</span> rolled: ${state["board_data"].roll}`;
                    this.dice.Display(state["board_data"].roll);

                    this.board.DrawHTMLPawns(state.board_data.turn, state.board_data.roll, this.PawnClick.bind(this), this.PawnMouseEnter.bind(this), this.PawnMouseLeave.bind(this));
                }
            } else {
                this.html.diceRoll.classList.remove("active");

                this.board.ResetHTMLPawns();
                this.nextMoveVisualizer.Hide();

                if (state["board_data"].roll != -1) {
                    let nick;

                    for (const player in state["player_data"]) {
                        let p = state["player_data"][player];

                        if (p.color == state["board_data"].turn) {
                            nick = p.nick;
                            break;
                        }
                    }

                    this.html.diceResult.innerHTML = `<span class="${state["board_data"].turn}">${nick}</span> rolled: ${state["board_data"].roll}`;
                    this.dice.Display(state["board_data"].roll);
                } else {
                    this.html.diceResult.innerHTML = "";
                    this.dice.Hide();
                }
            }

            for (const player of players) {
                //@ts-ignore
                player.innerText = "Empty";
            }

            for (let i = 0; i < 4; i++) {
                if (keys[i] !== undefined) {
                    if (you == keys[i]) {
                        let p = state["player_data"][you];
                        youSet = true;

                        players[0].innerHTML = p.nick;
                        players[0].classList.add(p.color);

                        players[0].classList.remove("ready");
                        if (p.color == turn) {
                            players[0].classList.add("ready");
                        }
                    } else {
                        let index = youSet ? i : i + 1;

                        let p = state["player_data"][keys[i]];

                        players[index].innerHTML = p.nick;
                        players[index].classList.add(p.color);

                        players[index].classList.remove("ready");
                        if (p.color == turn) {
                            players[index].classList.add("ready");
                        }
                    }
                }
            }

            if (state["board_data"].turn_end != this.turnTimeEnd) {
                clearInterval(this.turnTimeTask);
                this.turnTimeTask = null;

                let nick;
                for (const player in state["player_data"]) {
                    let p = state["player_data"][player];

                    if (p.color == state["board_data"].turn) {
                        nick = p.nick;
                        break;
                    }
                }

                this.TurnTimeStart(state["board_data"].turn_end, nick, state["board_data"].turn);
            }

            if (state.state == 2) {
                this.gameOver = true;
                console.warn("Game Over");
            }
        } else if (state.state == 2) {
            //do nothing
        } else if (state.state == 3) {
            this.AjaxStop();
            this.TurnTimeStop();
            this.GameStartsStop();

            this.GameOver(state.board_data.winner_nick, state.board_data.winner_color, state.board_data.your_nick, state.board_data.your_color);
        }
    }

    GameOver(winnerNick, winnerColor, yourNick, yourColor) {
        this.html.gameOver.classList.remove("hidden");

        if (winnerColor == yourColor) {
            this.html.gameOverWinner.innerHTML = `<span class='${yourColor}'>You</span> are the winner!</br>Good job!`;
        } else {
            this.html.gameOverWinner.innerHTML = `<span class='${winnerColor}'>${winnerNick}</span> is the winner!</br>Better luck next time, <span class='${yourColor}'>${yourNick}</span>!`;
        }
    }
}

export { Mensch_ärgere_Dich_nicht };