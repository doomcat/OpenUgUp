var UGUP = {
    /**
     * Game enum of 5PG games with UGUP
     */
    GAME: {
        DAWN: "dawn",
        LEGACY: "legacy"
    },
    /**
     * Platform enum of 5PG platforms
     */
    PLATFORM: {
        KONG: "kongregate",
        ARMOR: "armor",
        FB: "facebook",
        NG: "newgrounds"
    },

    URLS: (function() {
        var urls = {};
        urls.ROOT = "http://ugup.5thplanetgames.com/api/";

        urls.USER_ID = urls.ROOT + "profile/id/[username]";
        urls.PROFILE = urls.ROOT + "profile/[id]";
        urls.RAID = urls.ROOT + "raid/hash/[id]/[hash]";

        var definitionPaths = ["raid", "equipment", "mount", "collection",
            "general", "troop", "legion",
            "magic", "tactic", "enchant",
            "itemset", "pet", "recipe"];

        for (var i in definitionPaths) {
            if (definitionPaths.hasOwnProperty(i)) {
                var path = definitionPaths[i];
                urls[path.toUpperCase() + "_DEFINITION"] = urls.ROOT + path + "/definition/id/[id]";
                urls["LIST_" + path.toUpperCase() + "_DEFINITIONS"] = urls.ROOT + path + "/definition/all";
            }
        }

        return urls;
    })(),

    ajax: function(url, callback) {

    },

    format: function(url, args) {

    }
};
UGUP.Dawn = UGUP.Legacy = function(cfg) {
    if (typeof this.initialize === "function") {
        this.initialize(cfg);
    }
};

UGUP.Dawn.prototype = UGUP.Legacy.prototype = {

    initialize: function(cfg) {
        this.cfg = cfg;
    },

    fetchUserId: function(username, callback) {
        UGUP.ajax(UGUP.format(UGUP.URLS.USER_ID, {"username": username}), callback);
    }

};