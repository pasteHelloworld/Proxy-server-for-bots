(async () => {
    const { fork } = await import("child_process");
    const { WebSocketServer } = await import("ws");
    const { pack, unpack } = await import("msgpackr");
    const http = await import("http");
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const PROXIES = [
        'socks5://72.195.34.35:27360',
        'socks5://184.178.172.5:15303',
        'socks5://72.195.34.41:4145',
        'socks5://174.75.211.193:4145',
        'socks5://67.201.33.10:25283',
        'socks5://121.169.46.116:1090',
        'socks5://5.255.117.127:1080',
        'socks5://5.255.113.177:1080',
        'socks5://149.62.186.244:1080',
        'socks5://5.255.99.75:1080',
        'socks5://206.123.156.220:7080',
        'socks5://206.123.156.212:5483',
        'socks5://206.123.156.233:6157',
        'socks5://195.19.48.233:1080',
        'socks5://206.123.156.210:4606'
    ];

    const MAX_BOTS = PROXIES.length;
    const prod = false;

    const server = http.createServer((req, res) => {
        res.writeHead(426, {"Content-Type": "text/plain"});
        res.end("pluh");
    });

    function randint(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }

    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws, req) => {
        const addr = req.socket.remoteAddress;
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
                            console.log(addr, "true noob");
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
                                if (tankIdx >= tanks.length) tankIdx = 0;
                            }
                        } else {
                            tanks = [];
                            for (const worker of workers) {
                                sendToWorker(worker, { type: "tankselect", tank });
                            }
                        }
                        break;

                    case "F":
                        if (verified) {
                            if (workers.length >= MAX_BOTS) {
                                console.log(`[Limit] Maximum cap of ${MAX_BOTS} bots reached! Spawning blocked.`);
                                break;
                            }

                            if (proxyIdx >= PROXIES.length) proxyIdx = 0;
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
                                if (tankIdx >= tanks.length) tankIdx = 0;
                            } else {
                                sendToWorker(worker, { type: "tankselect", tank });
                            }

                            sendToWorker(worker, { type: "start", config: {
                                id: workers.length,
                                proxy: {
                                    type: "socks5",
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
