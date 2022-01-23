import { BPM } from "./BoardPositionMatrix.js";

class Board {
    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas, canvasPawns) {
        this.fieldSize = 40;
        this.fieldGap = 16;
        this.margin = 14;
        this.lineWidth = 2.5;
        this.colors = {
            bg: "rgb(9,9,11)", // 17,17,21
            fg: "whitesmoke",
            red: "#ff4040",
            yellow: "#cccc00",
            green: "#40ff40",
            blue: "#4040ff",
        }
        this.font = `${this.fieldSize - 12}px Trebuchet MS`;

        this.drawTask = null;

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        /**
         * @type {HTMLDivElement}
         */
        this.canvasPawns = canvasPawns;

        this.totalSize = 0;

        /**
         * @type {{red: String[], blue: String[], green: String[], yellow: String[]}}
         */
        this.pawns = {
            red: [null, null, null, null],
            blue: [null, null, null, null],
            green: [null, null, null, null],
            yellow: [null, null, null, null],
        }

        this.DrawStart();
    }

    /**
     * 
     * @param {string} position 
     * @returns {{x: Number, y: Number} | false}
     */
    static BoardPositionDecode(position) {
        return BPM[position] || false;
    }

    /**
     * @param {String} position 
     * @param {Number} roll 
     * @param {"red" | "blue" | "green" | "yellow"} color 
     * @param {{red: String[], blue: String[], green: String[], yellow: String[]}} pawns 
     * @returns {Boolean}
     */
    static CheckIfValidMove(position, roll, color, pawns) {
        let offset = {
            "R": [0, 39],
            "B": [10, 9],
            "G": [20, 19],
            "Y": [30, 29]
        };

        let [pawnArea, pawnNumber] = [position.split("-")[0], parseInt(position.split("-")[1])];
        let colorCapital = color[0].toUpperCase();

        let newPawnPosition = "";

        if (pawnArea[0] == "H") {
            return (roll == 1 || roll == 6);
        } else if (pawnArea[0] == "P") {
            let newPawnNumber = pawnNumber + roll;
            let offsetEnd = offset[colorCapital][1];

            if (pawnNumber <= offsetEnd && newPawnNumber > offsetEnd) { //kapujemy baze
                let diff = newPawnNumber - offsetEnd;

                if (diff > 4) {
                    // console.warn("Invalid move (moved OOB)");
                    return false;
                } else {
                    newPawnPosition = `${colorCapital}-${diff}`;

                    for (const c in pawns) {
                        if (c == color) {
                            for (let i = 0; i < 4; i++) {
                                if (pawns[c][i] == newPawnPosition) {
                                    // console.warn("Invalid move (can't stack pawns in base 1)");
                                    return false;
                                }
                            }
                        }
                    }

                    return true;
                }
            } else {
                return true;
            }
        } else {
            if (pawnNumber + roll > 4) {
                return false;
            }

            let newPawnPosition = `${colorCapital}-${pawnNumber + roll}`;

            for (const c in pawns) {
                if (c == color) {
                    for (let i = 0; i < 4; i++) {
                        if (pawns[c][i] == newPawnPosition) {
                            // console.warn("Invalid move (can't stack pawns in base 2)");
                            return false;
                        }
                    }
                }
            }

            return true;
        }
    }


    /**
     * @param {String} position
     * @param {Number} roll
     * @param {String} color
     * @param {{red: String[], blue: String[], green: String[], yellow: String[]}} pawns
     * @returns {{position: String, type: String} | false}
     */
    static CalculateNextMovePosition(position, roll, color, pawns) {
        let offset = {
            "R": [0, 39],
            "B": [10, 9],
            "G": [20, 19],
            "Y": [30, 29]
        };

        let perimeterLength = 40;

        let newPawnPosition = "";
        let colorCapital = color[0].toUpperCase();

        let [pawnArea, pawnNumber] = [position.split("-")[0], parseInt(position.split("-")[1])];

        if (pawnArea == "P") { //perimeter
            let newPawnNumber = pawnNumber + roll;
            let offsetEnd = offset[colorCapital][1];
            if (pawnNumber <= offsetEnd && newPawnNumber > offsetEnd) { //kapujemy baze
                let diff = newPawnNumber - offsetEnd;

                if (diff > 4) {
                    return false;
                } else {
                    newPawnPosition = `${colorCapital}-${diff}`;

                    for (const c in pawns) {
                        if (c == color) {
                            for (let i = 0; i < 4; i++) {
                                if (pawns[c] == newPawnPosition) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            } else {
                newPawnNumber = newPawnNumber % perimeterLength;

                newPawnPosition = `P-${newPawnNumber}`;
            }
        } else if (pawnArea[0] == "H") { //home
            if (roll == 1 || roll == 6) {
                newPawnPosition = `P-${offset[pawnArea[1]][0]}`;
            } else {
                return false;
            }
        } else { //base
            let newPawnNumber = pawnNumber + roll;

            if (newPawnNumber <= 4) {
                newPawnPosition = `${colorCapital}-${newPawnNumber}`;

                for (const position in pawns[color]) {
                    if (newPawnPosition == position) {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }

        let o = { type: "move", position: newPawnPosition };

        for (const c in pawns) {
            for (let i = 0; i < 4; i++) {
                if (pawns[c][i] == newPawnPosition && c != color) {
                    o.type = "kill";
                }
            }
        }

        return o;
    }

    DrawStart() {
        if (this.drawTask == null) {
            this.drawTask = setInterval(() => {
                this.PreDraw();
                this.Draw();
                this.PostDraw();
            }, 1000 / 60);
        }
    }

    DrawStop() {
        if (this.drawTask != null) {
            clearInterval(this.drawTask);
            this.drawTask = null;
        }
    }

    PreDraw() {
        this.totalSize = 11 * this.fieldSize + 10 * this.fieldGap + 2 * this.margin;

        this.ctx.canvas.width = this.totalSize;
        this.ctx.canvas.height = this.totalSize;

        this.ctx.lineCap = 'round';
    }

    Draw() {
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.rect(0, 0, this.totalSize, this.totalSize);
        this.ctx.fill()

        // this.ctx.strokeStyle = "whitesmoke";
        this.ctx.lineWidth = this.lineWidth;

        // for (let y = 0; y < 11; y++) {
        //     for (let x = 0; x < 11; x++) {
        //         this.ctx.fillStyle = "none";
        //         this.ctx.strokeStyle = "none";

        //         let px = x * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin;
        //         let py = y * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin;

        //         this.ctx.beginPath();
        //         this.ctx.arc(px, py, this.fieldSize / 2, 0, Math.PI * 2);
        //         this.ctx.fill();
        //         this.ctx.closePath();
        //     }
        // }

        for (const color in this.pawns) {
            this.ctx.fillStyle = "none";
            this.ctx.strokeStyle = "none";

            /**
             * @type {String[]}
             */
            let v = this.pawns[color];

            //! draw pawns

            v.forEach(el => {
                if (el != null) {
                    let o = Board.BoardPositionDecode(el);

                    if (o != false) {
                        this.ctx.fillStyle = this.colors[color];

                        let { x, y } = o;

                        let px = x * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin;
                        let py = y * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin;

                        this.ctx.beginPath();
                        this.ctx.arc(px, py, this.fieldSize / 2 - 5, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.closePath();
                    }
                }
            });
        }

        //! draw board

        for (let y = 0; y < 11; y++) {
            for (let x = 0; x < 11; x++) {
                if (((y >= 4 && y <= 6) || (x >= 4 && x <= 6) || ((x <= 1 && (y <= 1 || y >= 9)) || (x >= 9 && (y <= 1 || y >= 9)))) && (x != 5 || y != 5)) {
                    this.ctx.fillStyle = "none";
                    this.ctx.strokeStyle = this.colors.fg;

                    if ((y == 5 && x >= 1 && x <= 4) || (x <= 1 && y <= 1) || (x == 0 && y == 4)) {
                        this.ctx.strokeStyle = this.colors.red;
                    } else if ((y == 5 && x >= 6 && x <= 9) || (x >= 9 && y >= 9) || (x == 10 && y == 6)) {
                        this.ctx.strokeStyle = this.colors.green;
                    } else if ((x == 5 && y >= 1 && y <= 4) || (x >= 9 && y <= 1) || (x == 6 && y == 0)) {
                        this.ctx.strokeStyle = this.colors.blue;
                    } else if ((x == 5 && y >= 6 && y <= 9) || (x <= 1 && y >= 9) || (x == 4 && y == 10)) {
                        this.ctx.strokeStyle = this.colors.yellow;
                    }

                    let px = x * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin;
                    let py = y * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin;

                    this.ctx.beginPath();
                    this.ctx.arc(px, py, this.fieldSize / 2, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            }
        }
    }

    PostDraw() {
        let fields = {};

        for (const c in this.pawns) {
            /**
             * @type {String[]}
             */
            let v = this.pawns[c];

            v.forEach(el => {
                if (el === null) {
                    return;
                }

                if (fields[el] === undefined) {
                    fields[el] = 1;
                } else {
                    fields[el] = fields[el] + 1;
                }
            });
        }

        for (const field in fields) {
            /**
             * @type {Number}
             */
            let v = fields[field];

            if (v > 1) {
                let r = Board.BoardPositionDecode(field);

                if (r) {
                    let { x, y } = r;

                    let px = x * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin;
                    let py = y * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin;

                    this.ctx.font = this.font; //'32px Arial'
                    // console.log(this.ctx.font);
                    // console.log(px, py);
                    this.ctx.textAlign = "center";
                    this.ctx.textBaseline = "middle";
                    this.ctx.strokeStyle = "rgb(8,8,8)";
                    this.ctx.fillStyle = "rgb(8,8,8)";
                    this.ctx.fillText(`${v}`, px, py);
                    this.ctx.strokeText(`${v}`, px, py);
                }
            }
        }
    }

    /**
     * 
     * @param {"red" | "blue" | "green" | "yellow"} color 
     */
    DrawHTMLPawns(color, roll, onclick, onmouseenter, onmouseleave) {
        this.ResetHTMLPawns();

        for (let i = 0; i < 4; i++) {
            const pawn = this.pawns[color][i];

            if (Board.CheckIfValidMove(pawn, roll, color, this.pawns) == false) {
                continue;
            }

            let r = Board.BoardPositionDecode(pawn);

            if (r) {
                let { x, y } = r;

                let d = document.createElement("div");

                d.style.width = this.fieldSize + "px";
                d.style.height = this.fieldSize + "px";
                d.style.borderRadius = this.fieldSize / 2 + "px";
                d.style.left = (x * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin) - 20 + "px";
                d.style.top = (y * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin) - 20 + "px";

                d.classList.add("pawn", color);

                let res = Board.CalculateNextMovePosition(pawn, roll, color, this.pawns);

                if (res != false) {
                    let r2 = Board.BoardPositionDecode(res.position);
                    let type = res.type;

                    if (r2) {
                        let x2 = r2.x;
                        let y2 = r2.y;

                        x2 = x2 * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin - 20 + 2;
                        y2 = y2 * (this.fieldSize + this.fieldGap) + this.fieldSize / 2 + this.margin - 20 + 2;

                        d.onmouseenter = () => onmouseenter(x2, y2, color, type);
                        d.onmouseleave = () => onmouseleave();
                    }
                }

                d.onclick = () => onclick(i);

                this.canvasPawns.append(d);
            } else {
                // console.warn("Invalid pawn position!", r);
            }
        }
    }

    ResetHTMLPawns() {
        this.canvasPawns.innerHTML = "";
    }
}

export { Board };