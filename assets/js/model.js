var Model = function() {
    // Initialize Firebase
    var firebaseConfig = {
      apiKey: "AIzaSyDche8iZhBNbdpWq8bpLi9YKyjwuCh1M9w",
      authDomain: "ungnawed-leech.firebaseapp.com",
      databaseURL: "https://ungnawed-leech.firebaseio.com",
      projectId: "ungnawed-leech",
      storageBucket: "",
      messagingSenderId: "798037079320"
    };
    firebase.initializeApp(firebaseConfig);
    this.database = firebase.database();

    // Raw Data
    this.connections = {};  // All Connections
    this.requests = {};     // User's Requests
    this.responses = {};    // User's Responses
    this.game = {};         // User's Game

    // Local Data
    this.UID = "";
    this.PlayerName = RandomName();
    this.PlayerStatus = "lobby";
    this.OtherPlayers = {};
    this.OpponentUID = "";
    var self = this;

    // Callbacks
    this.callbacks = {
        "connections": {index: 0},
        "otherPlayers": {index: 0},
        "requests": {index: 0},
        "responses": {index: 0},
        "opponentDisconnected": {index: 0},
        "notifications": {index: 0}
    };
    // Dynamic self-modification! WooooOOOOoooo
    this.RegisterCallback = function(target, callback) {
        if (target === undefined) { return; }
        if (callback === undefined) { return; }
        var callbacks = self.callbacks[target];
        if (callbacks === undefined) {
            callbacks = {index: 0};
            console.log("Model.RegisterCallback log: new target " + target);
        }

        var i = callbacks.index;
        callbacks[i] = callback;
        callbacks.index = i + 1;
        self.callbacks[target] = callbacks;
    };
    this.fireCallbacks = function(target, diffs) {
        if (target === undefined) { return; }
        if (diffs === undefined) { return; }

        if (self.callbacks[target] === undefined) {
            throw new Error("Model.fireCallback error: unknown target " + target);
        }
        var callbacks = self.callbacks[target];

        for (var p in callbacks) {
            if (p === "index") { continue; }
            callbacks[p](diffs);
        }
    };

    this.GetPlayerName = function(uid, parsed) {
        if (this.connections[uid] === undefined) { return "Unknown Player"; }
        if (parsed === undefined) { parsed = true; }
        return parsed ? ParsePlayerName(this.connections[uid].name) : this.connections[uid].name;
    };

    this.SetOwnStatus = function(status) {
        self.PlayerStatus = status;
        self.database.ref("/connections").child(self.UID).child("status").set(status);
    }
    this.ChallengePlayer = function(otherUID) {
        self.SetOwnStatus("waiting");
        self.database.ref("/connections").child(otherUID).child("requests").child(self.UID).set(firebase.database.ServerValue.TIMESTAMP);
    };
    this.CancelChallenge = function(otherUID) {
        self.SetOwnStatus("lobby");
        self.database.ref("/connections").child(otherUID).child("requests").child(self.UID).remove();
    };
    this.RespondToChallenge = function(otherUID, response) {
        self.database.ref("/connections").child(self.UID).child("requests").child(otherUID).remove();
        self.database.ref("/connections").child(otherUID).child("responses").child(self.UID).set(response);
        if (response) {
            self.SetOwnStatus("in-game");
            self.StartGame(otherUID);
        } else {
            self.SetOwnStatus("lobby");
        }
    };
    this.RemoveResponses = function(response) {
        self.database.ref("/connections").child(self.UID).child("responses").remove();
        if (response) {
            self.SetOwnStatus("in-game");
        } else {
            self.SetOwnStatus("lobby");
        }
    };
    this.StartGame = function(otherUID) {
        self.OpponentUID = otherUID;
        self.game = {
            "wins": 0,
            "losses": 0,
            "ties": 0,
            "opponent": otherUID
        };
        self.database.ref("/connections").child(otherUID).on("value", function(snapshot) {
            if (snapshot.val() === null) {
                self.fireCallbacks("opponentDisconnected", DiffObjects({"uid": self.OpponentUID, "name": self.GetPlayerName(self.OpponentUID)}, {}));
            }
        });
    };
    this.ExitGame = function() {
        self.OpponentUID = "";
        self.game = {};
        self.SetOwnStatus("lobby");
    };
    this.CanMakeMove = function() {
        return (self.game["own-move"] === undefined);
    };
    this.MakeMove = function(move) {
        self.game["own-move"] = move;
        self.database.ref("/connections").child(self.OpponentUID).child("notifications").push(move);
    };
    this.ReceiveOpponentMove = function(move, keyToRemove) {
        self.game["opponent-move"] = move;
        self.database.ref("/connections").child(self.UID).child("notifications").child(keyToRemove).remove();
    }
    this.ResetMoves = function() {
        delete self.game["own-move"];
        delete self.game["opponent-move"];
    };
    this.HandleMoves = function() {
        var ownMove = self.game["own-move"];
        var opponentMove = self.game["opponent-move"];
        //   R P S
        // R D L W
        // P W D L
        // S L W D
        var outcomeMap = [
            [0, -1, 1],
            [1, 0, -1],
            [-1, 1, 0]
        ];
        if ((ownMove !== undefined) && (opponentMove !== undefined)) {
            var outcome = outcomeMap[ownMove][opponentMove];
            self.ResetMoves();
            switch (outcome) {
                case -1:
                    self.game.losses = self.game.losses + 1;
                    break;
                case 0:
                    self.game.ties = self.game.ties + 1;
                    break;
                case 1:
                    self.game.wins = self.game.wins + 1;
                    break;
                default:
                    throw new Error("Model.HandleMoves error: unknown outcome " + ownMove + " " + opponentMove);
            }
            return {
                "ownMove": ownMove,
                "opponentMove": opponentMove,
                "outcome": outcome
            };
        }
        return undefined;
    };

    this.isLit = false;
    this.Ignite = function() {
        // Allows callbacks to be registered before all the Firebase stuff starts
        if (self.isLit) { return; }
        self.isLit = true;
        self.RegisterCallback("connections", function(diffs) {
            // Populate OtherPlayers
            var snapshot_old = JSON.parse(JSON.stringify(self.OtherPlayers));
            for (var p in diffs.added) {
                if (p === self.UID) { continue; }
                self.OtherPlayers[p] = diffs.added[p];
            }
            for (var p in diffs.updated) {
                if (p === self.UID) { continue; }
                self.OtherPlayers[p] = diffs.updated[p];
            }
            for (var p in diffs.removed) {
                if (p === self.UID) {
                    console.log("Model.connectionsCallback warning: I no longer exist on the server");
                } else {
                    delete self.OtherPlayers[p];
                    // Filter out disconnected players from requests
                    if (self.requests[p]) {
                        self.database.ref("/connections").child(self.UID).child("requests").child(p).remove();
                        self.database.ref("/connections").child(self.UID).child("status").set("lobby");
                    }
                }
            }
            diffs = DiffObjects(snapshot_old, self.OtherPlayers);
            self.fireCallbacks("otherPlayers", diffs);
        });

        // Firebase
        self.database.ref("/connections").on("value", function(snapshot) {
            // Update local cache of users
            snapshot = snapshot.val();
            var diffs = DiffObjects(self.connections, snapshot);
            self.fireCallbacks("connections", diffs);
            self.connections = snapshot;
        });
        self.database.ref(".info/connected").on("value", function(connected) {
            if (connected.val()) {
                // New user
                var con = self.database.ref("/connections").push({
                    "name": self.PlayerName,
                    "status": "lobby"
                });
                con.onDisconnect().remove();
                self.UID = con.key;

                con.child("status").on("value", function(snapshot) {
                    snapshot = snapshot.val();
                    self.fireCallbacks("requests", DiffObjects({}, {}));
                    self.PlayerStatus = snapshot;
                });

                con.child("requests").on("value", function(snapshot) {
                    snapshot = snapshot.val() || {};
                    var diffs = DiffObjects(self.requests, snapshot);
                    self.fireCallbacks("requests", diffs);
                    self.requests = snapshot;
                });

                con.child("responses").on("value", function(snapshot) {
                    snapshot = snapshot.val() || {};
                    var diffs = DiffObjects(self.responses, snapshot);
                    self.fireCallbacks("responses", diffs);
                    self.responses = snapshot;
                });

                con.child("notifications").on("value", function(snapshot) {
                    snapshot = snapshot.val() || {};
                    var diffs = DiffObjects({}, snapshot);
                    self.fireCallbacks("notifications", diffs);
                });
            }
        });
    };
};
