var AppController = function(model) {
    var self = this;
    this.model = model;
    this.viewController = new ViewController(this.model.PlayerName);

    this.consideringChallengeFrom = "";

    this.model.RegisterCallback("otherPlayers", function(diffs) {
        self.viewController.RemovePlayers(diffs.removed);
        self.viewController.UpdatePlayers(diffs.updated);
        self.viewController.AddPlayers(diffs.added);
        self.viewController.UpdateOtherPlayersText();
    });

    this.model.RegisterCallback("requests", function(diffs) {
        if (self.model.PlayerStatus !== "lobby") { return; }
        var considerSnapshot = self.consideringChallengeFrom;
        for (var uid in diffs.removed) {
            if (uid === self.consideringChallengeFrom) {
                self.consideringChallengeFrom = "";
            }
        }
        for (var uid in diffs.added) {
            if (self.consideringChallengeFrom === "") {
                self.consideringChallengeFrom = uid;
            } else {
                // Add to queue
            }
        }
        if (considerSnapshot.length === 0 && self.consideringChallengeFrom.length > 0) {
            // New Challenge
            var otherPlayerName = self.model.GetPlayerName(self.consideringChallengeFrom);
            self.viewController.ModalForChallengeFromPlayer(otherPlayerName, self.consideringChallengeFrom);
        } else if (considerSnapshot.length > 0 && self.consideringChallengeFrom.length > 0) {
            if (considerSnapshot !== self.consideringChallengeFrom) {
                // Different Challenge
            }
        } else if (considerSnapshot.length > 0 && self.consideringChallengeFrom.length === 0) {
            // Cancelled Challenge
            // Pull from queue
        }
    });

    this.viewController.RegisterClickCallback(".challengePlayer", function(t, e) {
        if (self.model.PlayerStatus !== "lobby") { return; }
        t = $(t);
        // Cannot challenge players who are 'waiting' or 'in-game'
        if (t.hasClass("tooltipped")) { return; }
        var otherUID = t.data("uid");
        var otherPlayerName = self.model.GetPlayerName(otherUID);

        self.viewController.ModalForChallengingPlayer(otherPlayerName, otherUID);
        self.model.ChallengePlayer(otherUID);
    });

    this.viewController.RegisterClickCallback(".btn-challenge", function(t, e) {
        t = $(t);
        var otherUID = t.data("uid");
        var action = t.attr("id");
        console.log(action)
    });
}
