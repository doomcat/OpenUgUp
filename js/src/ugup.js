/**
 * @namespace
 * @type {
            {
                GAME: {
                    DAWN: string,
                    LEGACY: string
                },
                PLATFORM: {
                    KONG: string,
                    ARMOR: string,
                    FB: string,
                    NG: string
                },
                API_DEFINITION_TYPES: Array,
                _buildUrls: Function,
                _buildDefinitionFetchFns: Function,
                _createDefByIdFn: Function,
                _createDefListFn: Function,
                _defTypeToDefKey: Function,
                _defTypeToDefListKey: Function,
                _defTypeToDefnKey: Function,
                _defTypeToDefnListKey: Function,
                _wrapModelCallback: Function,
                Strings: {
                    capitalizeFirstLetter: Function
                },
                _standard_ajax_bridge: Function,
                _greasemonkey_ajax_bridge: Function,
                format: Function,
                Dawn: null,
                Legacy: null
            }
        }
 */

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

    /**
     * List of the types that can be queried for definition/id/[id] and definition/all
     */
    API_DEFINITION_TYPES: ["raid", "equipment", "mount", "collection",
                            "general", "troop", "legion",
                            "magic", "tactic", "enchant",
                            "itemset", "pet", "recipe"],

    _buildUrls: function(root) {
        var urls = {};

        urls.ROOT = root || "http://ugup.5thplanetgames.com/api/";

        urls.USER_ID = urls.ROOT + "profile/id/[username]";
        urls.PROFILE = urls.ROOT + "profile/[id]";
        urls.RAID = urls.ROOT + "raid/hash/[id]/[hash]";

        for (var i = UGUP.API_DEFINITION_TYPES.length - 1; i >= 0; i--) {
            var path = UGUP.API_DEFINITION_TYPES[i];
            urls[UGUP._defTypeToDefKey(path)] = urls.ROOT + path + "/definition/id/[id]";
            urls[UGUP._defTypeToDefListKey(path)] = urls.ROOT + path + "/definition/all";
        }

        return urls;
    },

    _buildDefinitionFetchFns: function() {
        var defns = {};

        for (var i = UGUP.API_DEFINITION_TYPES.length - 1; i >= 0; i--) {
            var path = UGUP.API_DEFINITION_TYPES[i];
            defns[UGUP._defTypeToDefnKey(path)] = UGUP._createDefByIdFn(path);
            defns[UGUP._defTypeToDefListKey(path)] = UGUP._createDefListFn(path);
        }


        return defns;
    },

    _createDefByIdFn: function(path) {
        return function(id, callback) {
            this.ajax({
                url: UGUP.format(this.urls[UGUP._defTypeToDefKey(path)], {"id": id}),
                callback: UGUP._wrapModelCallback(UGUP.Models[UGUP._defTypeToDefKey(path)], callback)
            });
        };
    },

    _createDefListFn: function(path) {
        return function(callback) {
            this.ajax({
                url: UGUP.format(UGUP._defTypeToDefListKey(path)),
                callback: UGUP._wrapModelCallback(UGUP.Models[UGUP._defTypeToDefKey(path)], callback)
            });
        };
    },

    _defTypeToDefKey: function(def) {
        return def.toUpperCase() + "_DEFINITION";
    },

    _defTypeToDefListKey: function(def) {
        return "LIST_" + def.toUpperCase() + "_DEFINITIONS";
    },

    _defTypeToDefnKey: function(def) {
        return "fetch" + UGUP.Strings.capitalizeFirstLetter(def) + "Definition";
    },

    _defTypeToDefnListKey: function(def) {
        return "fetchAll" + UGUP.Strings.capitalizeFirstLetter(def) + "Definitions";
    },

    _wrapModelCallback: function(modelType, callback) {
        return function(response) {
            var model;
            if (response.status == 200) {
                model = modelType.from(JSON.parse(response.responseText).data);
            }
            if (typeof callback === "function") {
                callback(response, model);
            }
        }
    },

    _standard_ajax_bridge: function(params) {

    },

    _greasemonkey_ajax_bridge: function(params) {

    },

    format: function(str, args) {
        for (var key in args) {
            if (args.hasOwnProperty(key)) {
                str = str.replace("{" + key + "}", args[key]);
            }
        }

        return str;
    },

    Strings: {
        capitalizeFirstLetter: function (str)
        {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    },

    Models: {
        int: {
            from: function(data) {
                return parseInt(data);
            }
        },
        string: {
            from: function(data) {
                return "" + data;
            }
        },
        SIMPLE_ITEM: {
            "itemtype": "int",
            "itemid": "int",
            from: function(data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key) && key in this && UGUP.Models[this[key]]) {
                        data[key] = UGUP.Models[this[key]].from(data[key]);
                    }
                }
                return data;
            }
        },
        ACHIEVEMENT: {
            "achievementid": "int"
        },
        PROFILE:  {
            "fname": "string",
            "level": "int",
            "gender": "string",
            "classID": "USER_CLASS",
            "guildID": "int",
            "hairID": "int",
            "skinID": "int",
            "faceID": "int",
            "platform": "PLATFORM",
            "ugupoptout": "int",
            "id": "string",
            "equipment": ["SIMPLE_ITEM"],
            "achievements": ["ACHIEVEMENT"],
            "messages": ["string"]
        }
    },

    Dawn:null, Legacy:null
};

/**
 * Create a new instance of a Dawn UGUP connector
 * @type {Function}
 */
UGUP.Dawn = function DawnConnector(cfg) {
    if (typeof this.initialize === "function") {
        cfg.__game = UGUP.GAME.DAWN;
        this.initialize(cfg);
    }
};

/**
 * Create a new instance of a Legacy UGUP connector
 * @type {Function}
 */
UGUP.Legacy = function LegacyConnector(cfg) {
    if (typeof this.initialize === "function") {
        cfg.__game = UGUP.GAME.LEGACY;
        this.initialize(cfg);
    }
};

UGUP.Dawn.prototype =
UGUP.Legacy.prototype = {

    initialize: function(cfg) {
        this.cfg = cfg;
        this.urls = UGUP._buildUrls(cfg.urlRoot);
    },

    ajax: function(params) {
        if (typeof this.cfg.customAjaxBridge === "function") {
            this.cfg.customAjaxBridge(params);
        }
        else if (this.cfg.gm_mode) {
            UGUP._greasemonkey_ajax_bridge(params);
        }
        else {
            UGUP._standard_ajax_bridge(params);
        }
    },

    fetchUserId: function(username, callback) {
        this.ajax({
            url: UGUP.format(this.urls.USER_ID, {"username": username}),
            callback: UGUP._wrapModelCallback(callback, UGUP.Models.USER_ID)
        });
    },

    fetchUserProfileById: function(userId, callback) {

    },

    fetchUserProfileByUsername: function(username, callback) {

    }

};

(function (){
    var defns = UGUP._buildDefinitionFetchFns();
    for (var defnName in defns) {
        if (defns.hasOwnProperty(defnName)) {
            UGUP.Dawn.prototype[defnName] = defns[defnName];
        }
    }
})();