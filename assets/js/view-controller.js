var ViewController = function(playerName) {
    // Initialize views
    var welcomeText = "Welcome " + ParsePlayerName(playerName) + "!";
    var textColor = playerName.split(".")[0] + "-text";
    $("#welcomeHeader").text(welcomeText).addClass(textColor);

    this.otherPlayers = {};
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

    self.firstRunFlag = true;
    this.AddPlayers = function(players) {
        for (var uid in players) {
            self.otherPlayers[uid] = players[uid];
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
    }

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
            self.otherPlayers[uid] = players[uid];
        }
    }

    this.RemovePlayers = function(players) {
        if (self.firstRunFlag) {
            $("#otherPlayers > div").addClass("hide");
            $("#otherPlayers").append($("<p class='caption'>"));
            $("#otherPlayers").append($("<ul class='collection'>"));
            self.firstRunFlag = false;
        }
        for (var uid in players) {
            $("#" + uid).remove();
            delete self.otherPlayers[uid];
        }
    }

    this.UpdateOtherPlayersText = function() {

    }
}
