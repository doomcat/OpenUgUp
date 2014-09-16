/**
 * @namespace UGUP
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
                Defn: {
                    _buildDefinitionFetchFns: Function,
                    _createDefByIdFn: Function,
                    _createDefListFn: Function,
                    _defTypeToDefKey: Function,
                    _defTypeToDefListKey: Function,
                    _defTypeToDefnKey: Function,
                    _defTypeToDefnListKey: Function
                },
                Ajax: {
                    _standard_ajax_bridge: Function,
                    _greasemonkey_ajax_bridge: Function,
                    injectAjaxParams: Function
                },
                Strings: {
                    format: Function(string, Array),
                    capitalizeFirstLetter: Function(string)
                },
                Urls: {
                    _buildUrls: Function()
                },
                Arrays: {
                    isArray: Function(Object)
                },
                model: Function(Object),
                Models: {
                    int: {from: Function(Object)},
                    string: {from: Function(Object)} ,
                    SIMPLE_ITEM: {from: Function(Object)} ,
                    ACHIEVEMENT: {from: Function(Object)} ,
                    PROFILE: {from: Function(Object)} ,
                    _defaultFromMethod: Function(Object),
                    _wrapModelCallback: Function(UGUP.model, callback)
                },
                Dawn: null,
                Legacy: null,
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

    Defn: {
        _buildDefinitionFetchFns: function() {
            var defns = {};

            for (var i = UGUP.API_DEFINITION_TYPES.length - 1; i >= 0; i--) {
                var path = UGUP.API_DEFINITION_TYPES[i];
                defns[UGUP.Defn._defTypeToDefnKey(path)] = UGUP.Defn._createDefByIdFn(path);
                defns[UGUP.Defn._defTypeToDefnListKey(path)] = UGUP.Defn._createDefListFn(path);
            }


            return defns;
        },

        _createDefByIdFn: function(path) {
            return function(id, callback) {
                this.ajax({
                    url: this.urls[UGUP.Defn._defTypeToDefKey(path)],
                    urlParams: {"id": id},
                    callback: UGUP.Models._wrapModelCallback(UGUP.Models[UGUP.Models._defTypeToDefKey(path)], callback)
                });
            };
        },

        _createDefListFn: function(path) {
            return function(callback) {
                this.ajax({
                    url: UGUP.Defn._defTypeToDefListKey(path),
                    callback: UGUP.Models._wrapModelCallback(UGUP.Models[UGUP.Defn._defTypeToDefKey(path)], callback)
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
        }
    },

    Ajax: {
        _standard_ajax_bridge: function(params) {
            try {
                var req = new(this.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
                req.open(params.data ? 'POST' : 'GET', params.url, 1);
                req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                req.onreadystatechange = function () {
                    req.readyState > 3 && params.callback && params.callback(req);
                };
                req.send(params.data)
            } catch (e) {
                window.console && console.log(e);
            }
        },

        _greasemonkey_ajax_bridge: function(params) {

        },

        /**
         *
         * @param {UGUP.Ajax.Params} params
         * @param {UGUP.Config} cfg
         * @returns {UGUP.Ajax.Params}
         */
        injectAjaxParams: function(params, cfg) {
            params.originalUrl = params.url;
            params.url = UGUP.Strings.format(params.url, params.urlParams);
            if (params.indexOf("?") < 0) {
                params.url += "?";
            }

            if (cfg.apiKey) {

            }

            return params;
        }
    },

    Strings: {
        format: function(str, args) {
            if (args && typeof args === "object") {
                for (var key in args) {
                    if (args.hasOwnProperty(key)) {
                        str = str.replace("{" + key + "}", args[key]);
                    }
                }
            }

            return str;
        },

        capitalizeFirstLetter: function (str)
        {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    },

    Urls: {
        _buildUrls: function(root) {
            var urls = {};

            urls.ROOT = root || "http://ugup.5thplanetgames.com/api/";

            urls.USER_ID = urls.ROOT + "profile/id/[username]";
            urls.PROFILE = urls.ROOT + "profile/[id]";
            urls.RAID = urls.ROOT + "raid/hash/[id]/[hash]";

            for (var i = UGUP.API_DEFINITION_TYPES.length - 1; i >= 0; i--) {
                var path = UGUP.API_DEFINITION_TYPES[i];
                urls[UGUP.Defn._defTypeToDefKey(path)] = urls.ROOT + path + "/definition/id/[id]";
                urls[UGUP.Defn._defTypeToDefListKey(path)] = urls.ROOT + path + "/definition/all";
            }

            return urls;
        }
    },

    Arrays: {
        isArray: function(obj) {
            // Might not be the best ever
            // Borrowed from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
            return Array.isArray ? Array.isArray(obj) : Object.prototype.toString.call(obj) === '[object Array]';
        }
    },

    model: function Model(modelConfig) {
        if (!modelConfig.from) {
            modelConfig.from = UGUP.Models._defaultFromMethod;
        }
        return modelConfig;
    },

    Models: {
        int: UGUP.model({
            from: function(data) {
                return parseInt(data);
            }
        }),
        string: UGUP.model({
            from: function(data) {
                return "" + data;
            }
        }),
        SIMPLE_ITEM: UGUP.model({
            "itemtype": "int",
            "itemid": "int"
        }),
        ACHIEVEMENT: UGUP.model({
            "achievementid": "int"
        }),
        PROFILE: UGUP.model({
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
            "equipment": "SIMPLE_ITEM", // array
            "achievements": "ACHIEVEMENT", // array
            "messages": "string" // array
        }),
        _defaultFromMethod: function(data) {
            var result = {raw: data};
            // For every key in the data
            for (var key in data) {
                if (data.hasOwnProperty(key) ) {
                    // If this model has that key and there is a UGUP model for it
                    if (key in this && UGUP.Models[this[key]]) {
                        if (UGUP.Arrays.isArray(data[key])) {
                            result[key] = [];
                            for (var i = 0; i < data[key].length; i++) {
                                result[key].push(UGUP.Models[this[key]].from(data[key][i]));
                            }
                        }
                        else {
                            result[key] = UGUP.Models[this[key]].from(data[key]);
                        }
                    }
                    // Just take the raw value
                    else {
                        result[key] = data[key];
                    }
                }
            }
            return result;
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
        }
    },

    Dawn:null, Legacy:null
};

/**
 * @typedef {{
        apiKey: string,
        game: UGUP.GAME,
        platform: UGUP.PLATFORM,

        urlRoot: string,
        customAjaxBridge: Function(UGUP.Ajax.Params),
        useGMAjaxBridge: boolean
    }}
 */
UGUP.Config;

/**
 * @typedef {{
        url: string,
        urlParams: Object.<string, string>
        callback: Function(XMLHttpRequest, UGUP.model?)
    }}
 */
UGUP.Ajax.Params;



/**
 * Create a new instance of a Dawn UGUP connector
 * @constructor
 * @param {UGUP.Config} cfg
 */
UGUP.Dawn = function DawnConnector(cfg) {
    if (typeof this.initialize === "function") {
        cfg.game = UGUP.GAME.DAWN;
        this.initialize(cfg);
    }
};

/**
 * Create a new instance of a Legacy UGUP connector
 * @constructor
 * @param {UGUP.Config} cfg
 */
UGUP.Legacy = function LegacyConnector(cfg) {
    if (typeof this.initialize === "function") {
        cfg.game = UGUP.GAME.LEGACY;
        this.initialize(cfg);
    }
};

/**
 *
 * @type {
            {
               initialize: Function,
               ajax: Function,
               fetchUserId: Function,
               fetchUserProfileById: Function,
               fetchUserProfileByUsername: Function

            }
        }
 */
UGUP.Dawn.prototype =
UGUP.Legacy.prototype = {

    /**
     *
     * @param {UGUP.Config} cfg
     */
    initialize: function(cfg) {
        this.cfg = cfg;
        this.urls = UGUP.Urls._buildUrls(cfg.urlRoot);
    },

    ajax: function(params) {
        params = UGUP.Ajax.injectAjaxParams(params, this.cfg);
        if (typeof this.cfg.customAjaxBridge === "function") {
            this.cfg.customAjaxBridge(params);
        }
        else if (this.cfg.useGMAjaxBridge) {
            UGUP.Ajax._greasemonkey_ajax_bridge(params);
        }
        else {
            UGUP.Ajax._standard_ajax_bridge(params);
        }
    },

    fetchUserId: function(username, callback) {
        this.ajax({
            url: this.urls.USER_ID,
            urlParams: {"username": username},
            callback: UGUP.Models._wrapModelCallback(callback, UGUP.Models.USER_ID)
        });
    },

    fetchUserProfileById: function(userId, callback) {

    },

    fetchUserProfileByUsername: function(username, callback) {

    }

};

(function (){
    var defns = UGUP.Defn._buildDefinitionFetchFns();
    for (var defnName in defns) {
        if (defns.hasOwnProperty(defnName)) {
            UGUP.Dawn.prototype[defnName] = defns[defnName];
        }
    }
})();