var ViewController = function(playerName) {
    // Initialize views
    var welcomeText = "Welcome " + ParsePlayerName(playerName) + "!";
    var textColor = playerName.split(".")[0] + "-text";
    $("#welcomeHeader").text(welcomeText).addClass(textColor);
    // See firstRunFlag in this.RemovePlayers, which runs first on app launch

    // Local Data
    this.otherPlayersCount = 0;
    this.colorCode = {
        "lobby": "green-text",
        "waiting": "orange-text",
        "in-game": "red-text"
    }
    this.shapeCode = {
        "lobby": "play_circle_filled",
        "waiting": "play_circle_filled",
        "in-game": "do_not_disturb_on"
    }
    var self = this;

    // Callbacks
    this.clickCallbacks = {};
    this.RegisterClickCallback = function(target, callback) {
        if (target === undefined) { return; }
        if (callback === undefined) { return; }
        var callbacks = self.clickCallbacks[target] || {index: 0};

        var i = callbacks.index;
        callbacks[i] = callback;
        callbacks.index = i + 1;
        self.clickCallbacks[target] = callbacks;
    };
    $(document).on("click", function(event) {
        // Potential to be performance bottleneck...
        var target = $(event.target);
        for (var t in self.clickCallbacks) {
            if (target.is(t)) {
                for (var p in self.clickCallbacks[t]) {
                    if (p === "index") { continue; }
                    var callback = self.clickCallbacks[t][p];
                    callback(target, event);
                }
            }
        }
    })

    // OtherPlayers List
    this.AddPlayers = function(players) {
        for (var uid in players) {
            self.otherPlayersCount++;
            var color = self.colorCode[players[uid].status];
            var shape = self.shapeCode[players[uid].status];
            var otherPlayer = $("<a href='#' class='challengePlayer'>");
            otherPlayer.html(ParsePlayerName(players[uid].name));
            otherPlayer.addClass(color);
            if (players[uid].status !== "lobby") {
                otherPlayer.addClass("tooltipped");
                var tooltipText = (players[uid].status === "waiting") ? "Waiting for Match" : "Currently in Match";
                otherPlayer.tooltip({
                    "position": "right",
                    "delay": "50",
                    "tooltip": tooltipText
                });
            }
            var icon = $("<i class='material-icons'>").addClass(color).text(shape);
            var rightIcon = $("<span class='secondary-content'>").append(icon);
            otherPlayer.append(rightIcon);
            otherPlayer.data("uid", uid);
            var listItem = $("<li class='collection-item'>").append(otherPlayer);
            listItem.attr("id", uid);
            $("#otherPlayers > ul").append(listItem);
        }
    };
    this.UpdatePlayers = function(players) {
        var removeColorClasses = function (i, n) {
            var cs = [];
            n.split(" ").forEach(function(c) { if (c.slice(c.length-4) === "text") { cs.push(c); } });
            return cs.join(" ");
        }
        for (var uid in players) {
            var link = $("#" + uid + " > a");
            link.removeClass(removeColorClasses);
            link.addClass(self.colorCode[players[uid].status]);
            var icon = $("#" + uid + " > a > span > i");
            icon.removeClass(removeColorClasses);
            icon.addClass(self.colorCode[players[uid].status]);
            icon.text(self.shapeCode[players[uid].status]);
        }
    };
    this.firstRunFlag = true;
    this.RemovePlayers = function(players) {
        if (self.firstRunFlag) {
            $("#otherPlayers > div").addClass("hide");
            $("#otherPlayers").append($("<p class='caption'>"));
            $("#otherPlayers").append($("<ul class='collection'>"));
            self.firstRunFlag = false;
        }
        for (var uid in players) {
            self.otherPlayersCount--;
            $("#" + uid).remove();
        }
    };
    this.UpdateOtherPlayersText = function() {
        if (self.otherPlayersCount < 1) {
            $("#otherPlayers > p.caption").html("It looks like no one else is online.<br>Share this page with a friend to play with them!");
            $("#otherPlayers > ul").addClass("hide");
        } else {
            $("#otherPlayers > p.caption").html("Choose another player to play against.");
            $("#otherPlayers > ul").removeClass("hide");
        }
    };

    // ChallengeModal
    this.ModalForChallengingPlayer = function(otherPlayerName, otherUID) {
        $("#challenge > .modal-content > h4").html("You have challenged <span>" + otherPlayerName + "</span> to a match!");
        $(".btn-challenge").addClass("hide").data("uid", otherUID);
        $("#cancelChallenge").removeClass("hide");
        $("#challenge").modal("open");
    }
}
