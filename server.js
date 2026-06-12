(async () => {
    const { fork } = await import("child_process");
    const { WebSocketServer } = await import("ws");
    const { pack, unpack } = await import("msgpackr");
    const http = await import("http");


    const PROXIES = ["http://budget-v6.whiteproxies.com:27020"];
    const prod = false;

    // HTTP SERVER
    const server = http.createServer((req, res) => {
        res.writeHead(426, {"Content-Type": "text/plain"});
        res.end("pluh");
    });


    // WS SERVER
    function randint(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }

    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws, req) => {
        const addr = req.socket.remoteAddress
        console.log(addr, "connected");

        let workers = [];
        let challenge;
        let verified = false;

        let tank = "Auto-6";
        let tanks = [];
        let tankIdx = 0;

        let proxyIdx = 0;

        function sendToWorker(worker, msg) {
            try {
                if (worker && worker.connected) {
                    worker.send(msg);
                }
            } catch (e) {
                console.error('Failed to send to worker:', e);
            }
        }

        function removeWorker(dead) {
            workers = workers.filter(w => w !== dead && w.connected);
        }


        function packet(...args) {
            ws.send(pack(args));
        }

        function close() {
            ws.close();
            for (const worker of workers) {
                sendToWorker(worker, { type: "destroy" });
            }
        }

        ws.on("message", (msg) => {
            try {
                const data = unpack(msg);
                const type = data.shift();

                switch (type) {
                    case "M":
                        if (challenge || data[0] != 72011) {
                            close();
                        }

                        challenge = randint(0b1000000000, 0b1111111111);
                        packet("M", challenge);
                        break;
                        
                    case "C":
                        if (data[0] == (challenge ^ 845)) {
                            verified = true;
                            console.log(addr, "verified");
                        } else {
                            close();
                            console.log(addr, "true noob")
                        }

                        break;

                    case "Z":
                        tank = data[0];
                        if (tank instanceof Array) {
                            tanks = tank;
                            tankIdx = 0;

                            for (const worker of workers) {
                                tank = tanks[tankIdx];
                                sendToWorker(worker, { type: "tankselect", tank });

                                tankIdx++;
                                if (tankIdx >= tanks.length) {
                                    tankIdx = 0;
                                }
                            }
                        } else {
                            tanks = [];
                            for (const worker of workers) {
                                sendToWorker(worker, { type: "tankselect", tank })
                            }
                        }

                        break;

                    case "F":
                        if (verified) {
                            if (proxyIdx >= PROXIES.length) {
                                proxyIdx = 0;
                            }
                            console.log("connecting with proxy", PROXIES[proxyIdx])

                            const worker = fork("index.js", []);
                            workers.push(worker);

                            // clean up worker list when it exits or errors
                            worker.on('exit', (code, signal) => {
                                console.log('worker exited', code, signal);
                                removeWorker(worker);
                            });
                            worker.on('error', (err) => {
                                console.error('worker error', err);
                                removeWorker(worker);
                            });

                            if (tanks.length) {
                                sendToWorker(worker, { type: "tankselect", tank: tanks[tankIdx] });
                                tankIdx++;
                                if (tankIdx >= tanks.length) {
                                    tankIdx = 0;
                                }
                            } else {
                                sendToWorker(worker, { type: "tankselect", tank });
                            }

                            sendToWorker(worker, { type: "start", config: {
                                id: 0,
                                proxy: {
                                    type: "http",
                                    url: PROXIES[proxyIdx]
                                },
                                hash: "#" + data[0],
                                name: "discord.gg/ugNk5GDCja",
                                stats: [0, 0, 0, 0, 0, 0, 0, 9],
                                type: "follow",
                                token: "follow-8fe6ca",
                                autoFire: false,
                                autoRespawn: true,
                                keys: [],
                                keysHold: [],
                                tank: "Auto4",
                                chatSpam: "",
                                squadId: data[0],
                                reconnectAttempts: 3,
                                reconnectDelay: 15000,
                            }});

                            proxyIdx++;
                        }

                        break;

                    case "B":
                        if (verified) {
                            for (const worker of workers) {
                                worker.send({ type: "destroy" });
                            }
                            workers = [];
                        }

                        break;
                        
                    case "A":
                        if (verified) {
                            for (const worker of workers) {
                                worker.send({
                                    type: "position",
                                    x: data[0],
                                    y: data[1],
                                    mouseX: data[2],
                                    mouseY: data[3],
                                    mouseDown: data[4],
                                    rMouseDown: data[5],
                                    mouse: data[6],
                                    feeding: data[7],
                                    shift: data[8]
                                });
                            }
                        }
                        break;
                
                    default:
                        close();
                        break;
                }
            } catch (e) {
                console.error(e);
            }
        });

        ws.on("close", () => {
            for (const worker of workers) {
                sendToWorker(worker, { type: "destroy" });
            }

            console.log(addr, "disconnected");
        });
    });


    const port = prod ? process.env.PORT : 8082;
    server.listen(port, () => {
        console.log("Server listening on port", port);
    });
})();
(async () => {
    const { fork } = await import("child_process");
    const { WebSocketServer } = await import("ws");
    const { pack, unpack } = await import("msgpackr");
    const http = await import("http");

    // 1. Your 10 Webshare Proxies loaded in
    const PROXIES = [
        'http://cewyuwxq:8erdzea2m635@38.154.203.95:5863',
        'http://cewyuwxq:8erdzea2m635@64.137.96.74:6462',
        'http://cewyuwxq:8erdzea2m635@198.105.121.200:6641',
        'http://cewyuwxq:8erdzea2m635@209.127.138.10:5784',
        'http://cewyuwxq:8erdzea2m635@38.154.185.97:6370',
        'http://cewyuwxq:8erdzea2m635@84.247.60.125:6095',
        'http://cewyuwxq:8erdzea2m635@142.111.67.146:5611',
        'http://cewyuwxq:8erdzea2m635@191.96.254.138:6185',
        'http://cewyuwxq:8erdzea2m635@104.239.107.47:5699',
        'http://cewyuwxq:8erdzea2m635@23.229.19.94:8689'
    ];
    
    const MAX_BOTS = PROXIES.length; // Set absolute cap to 10 bots
    const prod = false;

    // HTTP SERVER
    const server = http.createServer((req, res) => {
        res.writeHead(426, {"Content-Type": "text/plain"});
        res.end("pluh");
    });

    // WS SERVER
    function randint(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }

    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws, req) => {
        const addr = req.socket.remoteAddress
        console.log(addr, "connected");

        let workers = [];
        let challenge;
        let verified = false;

        let tank = "Auto-6";
        let tanks = [];
        let tankIdx = 0;

        let proxyIdx = 0;

        function sendToWorker(worker, msg) {
            try {
                if (worker && worker.connected) {
                    worker.send(msg);
                }
            } catch (e) {
                console.error('Failed to send to worker:', e);
            }
        }

        function removeWorker(dead) {
            workers = workers.filter(w => w !== dead && w.connected);
        }

        function packet(...args) {
            ws.send(pack(args));
        }

        function close() {
            ws.close();
            for (const worker of workers) {
                sendToWorker(worker, { type: "destroy" });
            }
        }

        ws.on("message", (msg) => {
            try {
                const data = unpack(msg);
                const type = data.shift();

                switch (type) {
                    case "M":
                        if (challenge || data[0] != 72011) {
                            close();
                        }

                        challenge = randint(0b1000000000, 0b1111111111);
                        packet("M", challenge);
                        break;
                        
                    case "C":
                        if (data[0] == (challenge ^ 845)) {
                            verified = true;
                            console.log(addr, "verified");
                        } else {
                            close();
                            console.log(addr, "true noob")
                        }
                        break;

                    case "Z":
                        tank = data[0];
                        if (tank instanceof Array) {
                            tanks = tank;
                            tankIdx = 0;

                            for (const worker of workers) {
                                tank = tanks[tankIdx];
                                sendToWorker(worker, { type: "tankselect", tank });

                                tankIdx++;
                                if (tankIdx >= tanks.length) {
                                    tankIdx = 0;
                                }
                            }
                        } else {
                            tanks = [];
                            for (const worker of workers) {
                                sendToWorker(worker, { type: "tankselect", tank })
                            }
                        }
                        break;

                    case "F": // This handles spawning a bot
                        if (verified) {
                            // 2. Strict Limit Check
                            if (workers.length >= MAX_BOTS) {
                                console.log(`[Limit] Maximum cap of ${MAX_BOTS} bots reached! Spawning blocked.`);
                                break;
                            }

                            // 3. Dynamic Proxy Rotation
                            if (proxyIdx >= PROXIES.length) {
                                proxyIdx = 0;
                            }
                            const currentProxy = PROXIES[proxyIdx];
                            console.log("connecting with proxy", currentProxy);

                            const worker = fork("index.js", []);
                            workers.push(worker);

                            worker.on('exit', (code, signal) => {
                                console.log('worker exited', code, signal);
                                removeWorker(worker);
                            });
                            worker.on('error', (err) => {
                                console.error('worker error', err);
                                removeWorker(worker);
                            });

                            if (tanks.length) {
                                sendToWorker(worker, { type: "tankselect", tank: tanks[tankIdx] });
                                tankIdx++;
                                if (tankIdx >= tanks.length) {
                                    tankIdx = 0;
                                }
                            } else {
                                sendToWorker(worker, { type: "tankselect", tank });
                            }

                            sendToWorker(worker, { type: "start", config: {
                                id: workers.length, // Uses updated sequential worker id
                                proxy: {
                                    type: "http",
                                    url: currentProxy
                                },
                                hash: "#" + data[0],
                                name: "discord.gg/ugNk5GDCja",
                                stats: [0, 0, 0, 0, 0, 0, 0, 9],
                                type: "follow",
                                token: "follow-8fe6ca",
                                autoFire: false,
                                autoRespawn: true,
                                keys: [],
                                keysHold: [],
                                tank: "Auto4",
                                chatSpam: "",
                                squadId: data[0],
                                reconnectAttempts: 3,
                                reconnectDelay: 15000,
                            }});

                            proxyIdx++; // Move index up for next spawn command
                        }
                        break;

                    case "B":
                        if (verified) {
                            for (const worker of workers) {
                                worker.send({ type: "destroy" });
                            }
                            workers = [];
                        }
                        break;
                        
                    case "A":
                        if (verified) {
                            for (const worker of workers) {
                                worker.send({
                                    type: "position",
                                    x: data[0],
                                    y: data[1],
                                    mouseX: data[2],
                                    mouseY: data[3],
                                    mouseDown: data[4],
                                    rMouseDown: data[5],
                                    mouse: data[6],
                                    feeding: data[7],
                                    shift: data[8]
                                });
                            }
                        }
                        break;
                
                    default:
                        close();
                        break;
                }
            } catch (e) {
                console.error(e);
            }
        });

        ws.on("close", () => {
            for (const worker of workers) {
                sendToWorker(worker, { type: "destroy" });
            }
            console.log(addr, "disconnected");
        });
    });

    const port = prod ? process.env.PORT : 8082;
    server.listen(port, () => {
        console.log("Server listening on port", port);
    });
})();
