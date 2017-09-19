var DatabaseHandler = function(otherPlayersCallback, newRequestCallback) {
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

    this.uid = undefined;
    this.playerName = RandomName();
    this.otherPlayers = {};
    this.requests = {};

    var self = this;
    this.otherPlayersCallback = otherPlayersCallback;
    this.newRequestCallback = newRequestCallback;

    this.connections = this.database.ref("/connections");
    this.database.ref(".info/connected").on("value", function(connected) {
        if (connected.val()) {
            var con = self.connections.push(true);
            con.onDisconnect().remove();
            self.uid = con.key;
            con.child("name").set(self.playerName);
            con.child("requests").on("value", function(snapshot) {
                var oldRequests = JSON.parse(JSON.stringify(self.requests));
                self.requests = snapshot.val() || {};
                var cancelledRequests = {};
                for (var uid in oldRequests) {
                    if (self.requests[uid] === undefined) {
                        cancelledRequests[uid] = true;
                    }
                }
                var newRequests = {};
                for (var uid in self.requests) {
                    if (oldRequests[uid] === undefined) {
                        newRequests[uid] = true;
                    }
                }
                self.newRequestCallback({
                    "cancelled": cancelledRequests,
                    "new": newRequests
                });
            });
        }
    });
    this.connections.on("value", function(snapshot) {
        snapshot = snapshot.val();
        self.otherPlayers = {};
        // Filter out user's id
        for (var key in snapshot) {
            if (key !== self.uid) {
                self.otherPlayers[key] = snapshot[key].name;
            }
        }
        // Remove requests from disconnected players
        var requests = self.requests;
        for (var key in requests) {
            if (self.otherPlayers[key] === undefined) {
                delete requests[key];
                self.connections.child(self.uid).child("requests").child(key).remove();
            }
        }
        self.requests = requests;
        self.otherPlayersCallback();
    });

    this.challengePlayer = function(uid) {
        self.connections.child(uid).child("requests").child(self.uid).set(firebase.database.ServerValue.TIMESTAMP);
    }

    this.cancelChallenge = function(uid) {
        self.connections.child(uid).child("requests").child(self.uid).remove();
    }
}
