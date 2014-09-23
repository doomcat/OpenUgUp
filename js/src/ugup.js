/**
 * @namespace UGUP
 * @type {
            {
                GAME: {
                    DAWN: string,
                    SUNS: string
                },
                PLATFORM: {
                    KONG: Object,
                    ARMOR: Object,
                    FB: Object,
                    NG: Object,
                    valueOf: Function(number)
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
                    int: Object,
                    string: Object,
                    SIMPLE_ITEM: Object,
                    ACHIEVEMENT: Object,
                    PROFILE: Object,
                    _defaultFromMethod: Function(Object),
                    _wrapModelCallback: Function(UGUP.model, callback)
                },
                Dawn: null,
                Suns: null,
            }
        }
 */
var UGUP = {
    /**
     * Game enum of 5PG games with UGUP
     */
    GAME: {
        DAWN: "dawn",
        SUNS: "suns"
    },
    /**
     * Platform enum of 5PG platforms
     */
    PLATFORM: {
        FB: {
            name: "Facebook",
            key: "facebook",
            id: 1
        },
        KONG: {
            name: "Kongregate",
            key: "kongregate",
            id: 2
        },
        ARMOR: {
            name: "Armor Games",
            key: "armor",
            id: 3
        },
        NG: {
            name: "Newgrounds",
            key: "newgrounds",
            id: 4
        },

        valueOf: function(ordinal) {
            var ret;
            for (var platform in UGUP.PLATFORM) {
                // Using == for type coercion in case we're given a string of the ordinal
                if (UGUP.PLATFORM.hasOwnProperty(platform) && UGUP.PLATFORM[platform].id == ordinal) {
                    ret = UGUP.PLATFORM[platform];
                    break;
                }
            }
            return ret;
        }
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
                    url: this.urls[UGUP.Defn._defTypeToDefListKey(path)],
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
            // Modified from https://gist.github.com/Xeoncross/7663273
            try {
                var req = new(window.XMLHttpRequest || window.ActiveXObject)('MSXML2.XMLHTTP.3.0');
                req.open(params.data ? 'POST' : 'GET', params.url, true);
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

            var queryParams = "";

            if (cfg.apiKey) {
                queryParams += "apikey=" + cfg.apiKey;
            }
            if (cfg.game) {
                if (queryParams) queryParams += "&";
                queryParams += "game=" + cfg.game;
            }
            if (cfg.platform) {
                if (queryParams) queryParams += "&";
                queryParams += "platform=" + (typeof cfg.platform === "string" ? cfg.platform : cfg.platform.key);
            }

            if (queryParams) {
                if (params.url.indexOf("?") < 0) {
                    params.url += "?";
                }
                params.url += queryParams;
            }

            return params;
        }
    },

    Strings: {
        format: function(str, args) {
            if (args && typeof args === "object") {
                for (var key in args) {
                    if (args.hasOwnProperty(key)) {
                        str = str.replace("[" + key + "]", args[key]);
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
        ACHIEVEMENT: {
            "achievementid": "int"
        },
        PLATFORM: {
            // Platform expects to consume an int (or string of int) and
            from: function(data) {
                return UGUP.PLATFORM.valueOf(data);
            }
        },
        PLAYER_CLASS: {
            // Platform expects to consume an int (or string of int) and
            from: function(data) {
                return UGUP.PlayerClasses.fromId(parseInt(data));
            }            
        },
        PROFILE: {
            "fname": "string",
            "level": "int",
            "gender": "string",
            "classID": "PLAYER_CLASS",
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
        },
        SIMPLE_ITEM: {
            "itemtype": "int",
            "itemid": "int"
        },
        USER_ID: {
            // USER_ID is kind of sneaky in that there isn't anything at the top level of this, it's just a string result
            from: function(data) {
                return data;
            }
        },

        // -- Models Helper Methods -- //
        _defaultFromMethod: function(data) {
            var result = {_raw: data};
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
                var model, parsedJSON;
                // Check the base HTTP response code, we're expecting pure 200, no other 20x codes
                if (response.status == 200) {
                    // Parse the JSON
                    var tmpJson = JSON.parse(response.responseText);
                    // Get the result object
                    parsedJSON = tmpJson.result;

                    // If the service reports a data success
                    if (!!tmpJson.success) {
                        // If we know how to parse this kind of model
                        if (modelType && typeof modelType.from === "function") {
                            // Parse into the model
                            model = modelType.from(parsedJSON);
                        }
                        else {
                            // Don't know how to deal with this
                            // TODO Better logging mechanism
                            window.console && window.console.warn("UGUP.JS: Failed to process model from type: ", modelType);
                        }
                    }
                    else {
                        // Some kind of failure in the query. Log it
                        // TODO Better logging mechanism
                        // TODO Specific handling of known error codes
                        window.console && window.console.error("UGUP.JS: Failed API call. Code: ", tmpJson.code, " Reason: ", tmpJson.reason);
                    }
                }
                if (typeof callback === "function") {
                    callback(response, model || parsedJSON);
                }
            }
        }
    },

    PlayerClasses: {
        Tier0: [{
            id: 1,
            dawn: {
                name: "Peon",
                text: "",
                icon: ""
            },
            suns: {
                name: "Prisoner",
                text: "",
                icon: "prisoner.jpg"
            },
            energyTimer: 120,
            staminaTimer: 120
        }],
        Tier1: [{
            id: 2,
            dawn: {
                name: "Battlemaster",
                text: "",
                icon: ""
            },
            suns: {
                name: "Soldier",
                text: "Soldiers recover their Stamina more quickly, so they may throw themselves into battle more often. But they regain Energy more slowly.",
                icon: "soldier.jpg"
            },
            energyTimer: 120,
            staminaTimer: 100
        },{
            id: 3,
            dawn: {
                name: "Wanderer",
                text: "",
                icon: ""
            },
            suns: {
                name: "Pilot",
                text: "Pilots recover their Energy faster, and can therefore complete missions more swiftly. However, they regain Stamina more slowly.",
                icon: "pilot.jpg"
            },
            energyTimer: 100,
            staminaTimer: 120
        },{
            id: 4,
            dawn: {
                name: "Adventurer",
                text: "",
                icon: ""
            },
            suns: {
                name: "Explorer",
                text: "Explorers walk a middle path, regenerating both Energy and Stamina at a moderate rate.",
                icon: "explorer.jpg"
            },
            energyTimer: 110,
            staminaTimer: 110
        }],
        Tier2: [{
            id: 5,
            dawn: {
                name: "Warlord",
                text: "",
                icon: ""
            },
            suns: {
                name: "Space Reaver",
                text: "Space Reavers love to lead their comrades into battle against interstellar threats. Their Stamina recharges quickly, but their Energy regenerates slowly.",
                icon: "spacereaver.jpg"
            },
            energyTimer: 110,
            staminaTimer: 90
        },{
            id: 6,
            dawn: {
                name: "World-Strider",
                text: "",
                icon: ""
            },
            suns: {
                name: "Hot Shot",
                text: "Hot Shots are daredevil pilots, whose quickly recharging Energy reserves allow them to complete missions more quickly. But their Stamina recharges more slowly.",
                icon: "hotshot.jpg"
            },
            energyTimer: 90,
            staminaTimer: 110
        },{
            id: 7,
            dawn: {
                name: "Champion",
                text: "",
                icon: ""
            },
            suns: {
                name: "Spacefarer",
                text: "Spacefarers prefer to divide their exploits between missions and epic battles. They regenerate both Stamina and Energy at a moderate rate.",
                icon: "spacefarer.jpg"
            },
            energyTimer: 100,
            staminaTimer: 100
        }],
        Tier3: [{
            id: 8,
            dawn: {
                name: "Warmaster",
                text: "",
                icon: ""
            },
            suns: {
                name: "Star-Slayer",
                text: "Star-Slayers live for battle. Their days are filled with laser fire, and the death screams of their enemies. Their Stamina replenishes quickly, allowing them to throw themselves back into combat. But their Energy recovers more slowly.",
                icon: "starslayer.jpg"
            },
            energyTimer: 100,
            staminaTimer: 80
        },{
            id: 9,
            dawn: {
                name: "Realm-Walker",
                text: "",
                icon: ""
            },
            suns: {
                name: "Space Ace",
                text: "Space Aces are exceptional pilots, with amazing reflexes and nerves of steel. Their Energy regeneration is phenomenal, allowing them to spend countless hours in the cockpit, though they recover Stamina more slowly.",
                icon: "spaceace.jpg"
            },
            energyTimer: 80,
            staminaTimer: 100
        },{
            id: 10,
            dawn: {
                name: "Hero",
                text: "",
                icon: ""
            },
            suns: {
                name: "Void-Treader",
                text: "Void-Treaders seek a range of challenges. Sometimes they undertake heroic missions, at other times they battle their rivals for glory. They forsake larger bonuses, preferring to recover both Energy and Stamina at a moderate rate.",
                icon: "voidtreader.jpg"
            },
            energyTimer: 90,
            staminaTimer: 90
        }],
        Tier4: [{
            id: 11,
            dawn: {
                name: "Luminary",
                text: "",
                icon: ""
            },
            suns: {
                name: "Galactic Avenger",
                text: "Galactic Avengers truly know what it means to be interstellar heroes. Their Energy and Stamina recover at an exceptional rate, allowing them to perform a lifetime’s worth of daring deeds each day.",
                icon: "galacticavenger.jpg"
            },
            energyTimer: 75,
            staminaTimer: 75
        }],
        Tier5: [{
            id: 12,
            dawn: {
                name: "Immortal",
                text: "",
                icon: ""
            },
            suns: {
                name: "Immortal",
                text: "Only the greatest of heroes can be deemed an Immortal -- one whose name and deeds will live forever. You are now among that select few, and have been awarded a special Tactics and Sidekicks for your remarkable achievement.",
                icon: "imortalclass.jpg"
            },
            energyTimer: 45,
            staminaTimer: 45
        }],
        Tier6: [{
            id: 14,
            dawn: {
                name: "Immortal Drake Slayer",
                text: "",
                icon: ""
            },
            suns: {
                name: "Immortal Sian Hero",
                text: "Your name is eternal, and no one will forget the part you\'ve played in the war against the Centurians. Few shall ever possess the Tactic and Sidekick which are now yours to wield and display.",
                icon: "class_immortal_sian_hero.jpg"
            },
            energyTimer: 45,
            staminaTimer: 45
        }],

        fromId: function(classId) {
            var pc = UGUP.PlayerClasses,
                cache = pc.idCache;
            // If we've made the cache, check it
            if (cache) {
                return cache[classId];
            }
            // Haven't made the cache yet? Generate it now, then try again
            else {
                pc.idCache = cache = {};
                for (var tier in pc) {
                    if (pc.hasOwnProperty(tier) && typeof pc[tier] !== "function") {
                        for (var i = 0; i < pc[tier].length; i++) {
                            var playerClass = pc[tier][i];
                            cache[playerClass.id] = playerClass;
                        }
                    }
                }

                // Now that we've generated the cache, try again
                return pc.fromId(classId);
            }
        }
    },

    Dawn:null, Suns:null
};

// Prepare the models
(function (){
    for (var model in UGUP.Models) {
        if (UGUP.Models.hasOwnProperty(model) && model && typeof UGUP.Models[model] === "object") {
            UGUP.Models[model] = UGUP.model(UGUP.Models[model]);
        }
    }
})();

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
 * Create a new instance of a Suns UGUP connector
 * @constructor
 * @param {UGUP.Config} cfg
 */
UGUP.Suns = function SunsConnector(cfg) {
    if (typeof this.initialize === "function") {
        cfg.game = UGUP.GAME.SUNS;
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
UGUP.Suns.prototype = {

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
            callback: UGUP.Models._wrapModelCallback(UGUP.Models.USER_ID, callback)
        });
    },

    fetchUserProfileById: function(userId, callback) {
        this.ajax({
            url: this.urls.PROFILE,
            urlParams: {"id": userId},
            callback: UGUP.Models._wrapModelCallback(UGUP.Models.PROFILE, callback)
        });
    },

    fetchUserProfileByUsername: function(username, callback) {
        this.fetchUserId(username, function(response, model) {
            this.fetchUserProfileById(model, callback);
        }.bind(this));
    }

};

// Prepare the query functions
(function (){
    var defns = UGUP.Defn._buildDefinitionFetchFns();
    for (var defnName in defns) {
        if (defns.hasOwnProperty(defnName)) {
            UGUP.Dawn.prototype[defnName] = defns[defnName];
        }
    }
})();