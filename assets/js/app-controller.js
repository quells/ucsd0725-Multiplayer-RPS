var AppController = function(model) {
    var self = this;
    this.model = model;
    this.viewController = new ViewController(this.model.PlayerName);

    this.model.RegisterCallback("otherPlayers", function(diffs) {
        self.viewController.RemovePlayers(diffs.removed);
        self.viewController.UpdatePlayers(diffs.updated);
        self.viewController.AddPlayers(diffs.added);
    });
}
