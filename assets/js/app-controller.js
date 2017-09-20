var AppController = function(model) {
    this.model = model;
    var self = this;

    this.status = function() {
        return self.model.PlayerStatus;
    }
}
