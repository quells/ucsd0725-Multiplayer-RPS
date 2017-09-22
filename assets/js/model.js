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
    this.game = {};         // User's Game (belongs to challenger)

    // Local Data
    this.UID = "";
    this.PlayerName = RandomName();
    this.PlayerStatus = "lobby";
    this.OtherPlayers = {};
    var self = this;

    // Callbacks
    this.callbacks = {
        "connections": {index: 0},
        "otherPlayers": {index: 0},
        "requests": {index: 0},
        "responses": {index: 0},
        "game": {index: 0}
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

        // target = target + "Callbacks";
        if (self.callbacks[target] === undefined) {
            throw new Error("Model.fireCallback error: unknown target " + target);
        }
        var callbacks = self.callbacks[target];

        for (var p in callbacks) {
            if (p === "index") { continue; }
            callbacks[p](diffs);
        }
    };

    this.GetPlayerName = function(uid) {
        if (this.connections[uid] === undefined) {
            return "Unknown Player";
        }
        return ParsePlayerName(this.connections[uid].name);
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
            self.database.ref("/connections").child(self.UID).child("game").set({
                "wins": 0,
                "losses": 0,
                "ties": 0
            })
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

                con.child("game").on("value", function(snapshot) {
                    snapshot = snapshot.val() || {};
                    var diffs = DiffObjects(self.game, snapshot);
                    self.fireCallbacks("game", diffs);
                    self.game = snapshot;
                });
            }
        });
    };
};
