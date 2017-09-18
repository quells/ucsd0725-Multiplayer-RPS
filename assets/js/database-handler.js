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

    this.connections = this.database.ref("/connections");
    this.database.ref(".info/connected").on("value", function(connected) {
        if (connected.val()) {
            var con = self.connections.push(true);
            con.onDisconnect().remove();
            self.uid = con.key;
            con.child("name").set(self.playerName);
            con.child("requests").on("value", function(snapshot) {
                self.requests = snapshot.val() || {};
                for (var uid in self.requests) {
                    if (!self.otherPlayers[uid]) {
                        delete self.requests[uid];
                        con.child("requests").child(uid).remove();
                    }
                }
                newRequestCallback();
            });
        }
    });
    this.connections.on("value", function(snapshot) {
        snapshot = snapshot.val();
        self.otherPlayers = {};
        for (var key in snapshot) {
            if (key !== self.uid) {
                self.otherPlayers[key] = snapshot[key].name;
            }
        }
        otherPlayersCallback();
    });

    this.challengePlayer = function(uid) {
        self.connections.child(uid).child("requests").child(self.uid).set(firebase.database.ServerValue.TIMESTAMP);
    }
}
