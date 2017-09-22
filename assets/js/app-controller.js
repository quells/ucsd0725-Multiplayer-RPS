var AppController = function(model) {
    var self = this;
    this.model = model;
    this.viewController = new ViewController(this.model.PlayerName);

    this.consideringMatchWith = "";
    this.leftFirst = false;

    this.model.RegisterCallback("otherPlayers", function(diffs) {
        self.viewController.RemovePlayers(diffs.removed);
        self.viewController.UpdatePlayers(diffs.updated);
        self.viewController.AddPlayers(diffs.added);
        self.viewController.UpdateOtherPlayersText();
    });

    this.model.RegisterCallback("requests", function(diffs) {
        if (self.model.PlayerStatus === "in-game") {
            var union = UnionObjects(diffs.added, diffs.updated);
            union = UnionObjects(union, diffs.unchanged);
            for (var uid in union) {
                self.model.RespondToChallenge(uid, false);
            }
            return;
        }
        var considerSnapshot = self.consideringMatchWith;
        for (var uid in diffs.removed) {
            if (uid === self.consideringMatchWith) {
                self.consideringMatchWith = "";
            }
        }
        for (var uid in UnionObjects(diffs.added, diffs.unchanged)) {
            if (self.consideringMatchWith === "") {
                self.consideringMatchWith = uid;
            } else {
                // Add to queue
            }
        }
        if (considerSnapshot.length === 0 && self.consideringMatchWith.length > 0) {
            // New Challenge
            if (self.model.PlayerStatus === "lobby") {
                var otherPlayerName = self.model.GetPlayerName(self.consideringMatchWith);
                self.viewController.ModalForChallengeFromPlayer(otherPlayerName, self.consideringMatchWith);
                self.model.SetOwnStatus("waiting");
            }
        } else if (considerSnapshot.length > 0 && self.consideringMatchWith.length > 0) {
            if (considerSnapshot !== self.consideringMatchWith) {
                // Different Challenge (not sure this will ever happen, but...)
                if (self.model.PlayerStatus === "waiting") {
                    console.log("one in a million?");
                    var oldPlayerName = self.model.GetPlayerName(considerSnapshot);
                    var otherUID = self.consideringMatchWith;
                    var otherPlayerName = self.model.GetPlayerName(otherUID);
                    self.viewController.CancelChallengeFromPlayer(oldPlayerName);
                    self.model.SetOwnStatus("waiting");
                    setTimeout(function() {
                        self.viewController.ModalForChallengeFromPlayer(otherPlayerName, otherUID)
                    }, 1500);
                }
            } else {
                // Bug here
            }
        } else if (considerSnapshot.length > 0 && self.consideringMatchWith.length === 0) {
            // Cancelled Challenge
            if (self.model.PlayerStatus === "waiting") {
                var otherPlayerName = self.model.GetPlayerName(considerSnapshot);
                self.viewController.CancelChallengeFromPlayer(otherPlayerName);
                setTimeout(function() {
                    if (self.model.PlayerStatus === "waiting") {
                        console.log("cancelled challenge");
                        self.model.SetOwnStatus("lobby");
                    }
                }, 1500);
            }
            // Pull from queue
        }
    });

    this.model.RegisterCallback("responses", function(diffs) {
        var union = UnionObjects(diffs.added, diffs.updated);
        union = UnionObjects(union, diffs.unchanged);
        // ^ Fixes issue where repeatedly declining a request would not update the challenger,
        //   though perhaps that would be a feature, not a bug, to prevent abuse.
        //   For the purposes of a homework assignment, erring on the side of not-locking-up the UI.
        if (self.model.PlayerStatus !== "waiting") { return; }
        var considerSnapshot = self.consideringMatchWith;
        for (var uid in union) {
            if (uid === considerSnapshot) {
                var otherPlayerName = self.model.GetPlayerName(uid);
                var response = union[uid];
                self.viewController.DisplayResponseToChallenge(otherPlayerName, response);
                self.model.RemoveResponses(response);
                if (response) {
                    // Start game
                    self.viewController.TransitionTo("game");
                    self.model.StartGame(uid);
                }
                return;
            }
        }
    });

    this.viewController.RegisterClickCallback(".challengePlayer", function(e) {
        if (self.model.PlayerStatus !== "lobby") { return; }
        var t = $(this);
        // Cannot challenge players who are 'waiting' or 'in-game'
        if (t.hasClass("tooltipped")) { return; }
        var otherUID = t.data("uid");
        var otherPlayerName = self.model.GetPlayerName(otherUID);

        self.consideringMatchWith = otherUID;
        self.viewController.ModalForChallengingPlayer(otherPlayerName, otherUID);
        self.model.ChallengePlayer(otherUID);
    });

    this.viewController.RegisterClickCallback(".btn-challenge", function(e) {
        var t = $(this);
        var otherUID = t.data("uid");
        var action = t.attr("id");
        switch (action) {
            case "acceptChallenge":
                self.model.RespondToChallenge(otherUID, true);
                self.viewController.TransitionTo("game");
                break;
            case "declineChallenge":
                self.model.RespondToChallenge(otherUID, false);
                break;
            case "cancelChallenge":
                self.model.CancelChallenge(otherUID);
                break;
            default:
                throw new Error("AppController.clickCallback error: unknown button action " + action);
        }
    });

    // In-Game

    this.model.RegisterCallback("game", function(diffs) {
        for (var p in diffs.removed) {
            if (p === "opponent") {
                if (self.leftFirst) {
                    self.leftFirst = false;
                } else {
                    var opponentName = self.model.GetPlayerName(self.model.OpponentUID);
                    self.viewController.ShowNotification(opponentName + "has left the game.", function() {
                        $("#gameHeading").text("Game Over");
                    });
                }
            }
        }
        console.log("game", diffs);
    });

    this.model.RegisterCallback("opponent", function(diffs) {
        for (var p in diffs.removed) {
            if (p === "name") {
                if (self.leftFirst) {
                    self.leftFirst = false;
                } else {
                    var opponentName = self.model.GetPlayerName(self.model.OpponentUID);
                    self.viewController.ShowNotification(opponentName + "has left the game.", function() {
                        $("#gameHeading").text("Game Over");
                    });
                }
            }
        }
        console.log("opponent", diffs);
    });

    this.viewController.RegisterClickCallback("#backToLobby", function(e) {
        self.leftFirst = true;
        self.model.ExitGame();
        self.viewController.TransitionTo("lobby");
    });

    this.viewController.RegisterClickCallback(".btn-move", function(e) {
        var move = $(this).data("move");
        console.log(move);
    });
}
