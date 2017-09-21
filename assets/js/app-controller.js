var AppController = function(model) {
    var self = this;
    this.model = model;
    this.viewController = new ViewController(this.model.PlayerName);

    this.consideringMatchWith = "";

    this.model.RegisterCallback("otherPlayers", function(diffs) {
        self.viewController.RemovePlayers(diffs.removed);
        self.viewController.UpdatePlayers(diffs.updated);
        self.viewController.AddPlayers(diffs.added);
        self.viewController.UpdateOtherPlayersText();
    });

    this.model.RegisterCallback("requests", function(diffs) {
        if (self.model.PlayerStatus !== "lobby") { return; }
        var considerSnapshot = self.consideringMatchWith;
        for (var uid in diffs.removed) {
            if (uid === self.consideringMatchWith) {
                self.consideringMatchWith = "";
            }
        }
        for (var uid in diffs.added) {
            if (self.consideringMatchWith === "") {
                self.consideringMatchWith = uid;
            } else {
                // Add to queue
            }
        }
        if (considerSnapshot.length === 0 && self.consideringMatchWith.length > 0) {
            // New Challenge
            var otherPlayerName = self.model.GetPlayerName(self.consideringMatchWith);
            self.viewController.ModalForChallengeFromPlayer(otherPlayerName, self.consideringMatchWith);
        } else if (considerSnapshot.length > 0 && self.consideringMatchWith.length > 0) {
            if (considerSnapshot !== self.consideringMatchWith) {
                // Different Challenge (not sure this will ever happen, but...)
                var oldPlayerName = self.model.GetPlayerName(considerSnapshot);
                var otherUID = self.consideringMatchWith;
                var otherPlayerName = self.model.GetPlayerName(otherUID);
                self.viewController.CancelChallengeFromPlayer(oldPlayerName);
                setTimeout(function() {
                    self.viewController.ModalForChallengeFromPlayer(otherPlayerName, otherUID)
                }, 1100);
            }
        } else if (considerSnapshot.length > 0 && self.consideringMatchWith.length === 0) {
            // Cancelled Challenge
            var otherPlayerName = self.model.GetPlayerName(considerSnapshot);
            self.viewController.CancelChallengeFromPlayer(otherPlayerName);
            // Pull from queue
        }
    });

    this.model.RegisterCallback("responses", function(diffs) {
        var union = UnionObjects(diffs.added, diffs.updated);
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
                    console.log("start game, challeng-er")
                }
                return;
            }
        }
    });

    this.viewController.RegisterClickCallback(".challengePlayer", function(t, e) {
        if (self.model.PlayerStatus !== "lobby") { return; }
        t = $(t);
        // Cannot challenge players who are 'waiting' or 'in-game'
        if (t.hasClass("tooltipped")) { return; }
        var otherUID = t.data("uid");
        var otherPlayerName = self.model.GetPlayerName(otherUID);

        self.consideringMatchWith = otherUID;
        self.viewController.ModalForChallengingPlayer(otherPlayerName, otherUID);
        self.model.ChallengePlayer(otherUID);
    });

    this.viewController.RegisterClickCallback(".btn-challenge", function(t, e) {
        t = $(t);
        var otherUID = t.data("uid");
        var action = t.attr("id");
        switch (action) {
            case "acceptChallenge":
                self.model.RespondToChallenge(otherUID, true);
                console.log("start game, challeng-ee")
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
}
