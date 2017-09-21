var AppController = function(model) {
    var self = this;
    this.model = model;
    this.viewController = new ViewController(this.model.PlayerName);

    this.model.RegisterCallback("otherPlayers", function(diffs) {
        self.viewController.RemovePlayers(diffs.removed);
        self.viewController.UpdatePlayers(diffs.updated);
        self.viewController.AddPlayers(diffs.added);
        self.viewController.UpdateOtherPlayersText();
    });

    this.model.RegisterCallback("requests", function(diffs) {
        console.log(diffs);
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
        if (self.model.PlayerStatus !== "waiting") { return; }
        t = $(t);
        var otherUID = t.data("uid");
        var action = t.attr("id");
        console.log(action)
    });
}
