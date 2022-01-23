class ServerTime {
    constructor() {
        this.offset = 0;
        this.ping = 0;
    }

    Now() {
        return Date.now() + this.offset;
    }

    Sync() {
        let start = Date.now();
        let end;

        fetch("./php/Ping.php", { method: "GET" })
            .then((response) => {
                end = Date.now();
                this.ping = (end - start) / 2;
                return response.text();
            })
            .then(data => {
                this.offset = parseInt(data) - Date.now();
                console.warn("TIME: ", this.offset, this.ping, Date.now(), this.Now());
            });
    }
}

export { ServerTime };