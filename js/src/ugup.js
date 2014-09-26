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
                            "magic", /* "tactic", <- seems broken */ "enchant",
                            "itemset", "pet", "recipe"],

    Cache: {
        /**
         *
         * @param {string|number} typeKey
         * @param {UGUP.model|[UGUP.model]} models
         */
        storeData: function(typeKey, models) {
            // If models is null, don't try to cache anything
            if (models) {
                // If it's not an array, just make it an array of one for consistency
                if (!UGUP.Arrays.isArray(models)) {
                    models = [models];
                }
                // If it's already an array, assume that it's a full cache
                else {
                    UGUP.Cache._fullCache[typeKey] = true;
                }

                if (!UGUP.Cache[typeKey]) {
                    UGUP.Cache[typeKey] = {};
                }

                for (var i = 0; i < models.length; i++) {
                    var model = models[i];
                    UGUP.Cache[typeKey][model.id] = model;
                }
            }
        },

        /**
         * @param {string|number} typeKey
         * @param {string?|number?} modelId
         */
        fetchData: function(typeKey, modelId) {
            var cache = UGUP.Cache[typeKey];
            if (cache) {
                // Looking for a single model from the cache
                if (modelId) {
                    return cache[modelId];
                }
                // Looking for a complete model listing from the cache. First make sure the cache is full
                else if (UGUP.Cache._fullCache[typeKey]) {
                    var resultArr = [];

                    for (var i in cache) {
                        if (cache.hasOwnProperty(i)) {
                            resultArr.push(cache[i]);
                            // TODO: Sort them by .id
                        }
                    }

                    return resultArr;
                }
            }
        },

        _fullCache: {}
    },

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
                if (!UGUP.Models[UGUP.Defn._defTypeToDefKey(path)]) {
                    window.console && window.console.warn("UGUP.JS: Failed to located model for '" + path + "': " + UGUP.Defn._defTypeToDefKey(path));
                }
                // TODO: Check Cache First
                this.ajax({
                    url: this.urls[UGUP.Defn._defTypeToDefKey(path)],
                    urlParams: {"id": id},
                    callback: UGUP.Models._wrapModelCallback(
                        UGUP.Models[UGUP.Defn._defTypeToDefKey(path)],
                        UGUP.Defn._createCacheInterceptorFn(path, callback),
                        this)
                });
            };
        },

        _createDefListFn: function(path) {
            return function(callback) {
                if (!UGUP.Models[UGUP.Defn._defTypeToDefKey(path)]) {
                    window.console && window.console.warn("UGUP.JS: Failed to located model for '" + path + "': " + UGUP.Defn._defTypeToDefKey(path));
                }
                // TODO: Check Cache First
                this.ajax({
                    url: this.urls[UGUP.Defn._defTypeToDefListKey(path)],
                    callback: UGUP.Models._wrapModelCallback(
                        UGUP.Models[UGUP.Defn._defTypeToDefKey(path)],
                        UGUP.Defn._createCacheInterceptorFn(path, callback),
                        this)
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

        _createCacheInterceptorFn: function(path, callback) {
            return function(response, model) {
                UGUP.Cache.storeData(path, model);

                if (typeof callback === "function") {
                    callback(response, model);
                }
            };
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
            // TODO Interface to a GM layer XHR
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

    /**
     * UgUp Models
     * If a model has a from method, the recursion ends there. If not, the models will continue to dig deeper until all types are resolved
     */
    Models: {
        boolean: {
            from: function(data) {
                return !!data;
            }
        },
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
        ENCHANT_DEFINITION: {
            "id": "int",
            "name": "string",
            "proc_name": "string",
            "proc_desc": "string"
        },
        ITEM_RARITY: {

        },
        ITEMSET_DEFINITION: {
            "id": "int",
            "name": "string",
            "item": "RECIPE_ITEM" // array
        },
        LEGION_DEFINITION: {
            "id": "int",
            "name": "string",
            "num_gen": "int",
            "num_trp": "int",
            "bonus": "int",
            "bonusSpecial": "int",
            "bonusText": "string",
            "rarity": "ITEM_RARITY",
            "value_gold": "int",
            "value_credits": "int",
            "canpurchase": "boolean",
            "questReq": "boolean",
            "lore": "string",
            "proc_name": "string",
            "proc_desc": "string",
            "specification": "string",
            "general_format": "LEGION_PEOPLE_FORMAT",
            "troop_format": "LEGION_PEOPLE_FORMAT"
        },
        LEGION_PEOPLE_FORMAT: {
            "race": "LEGION_RACE",
            "role": "LEGION_ROLE",
            "source": "LEGION_SOURCE",
            "qty": "int"
        },
        LEGION_RACE: {
            // This is an OpenUGUP only model not provided anywhere in normal UgUp
            // Legion Race expects to consume an int (or string of int)
            from: function(data, connector) {
                return UGUP.LegionRace[connector.cfg.game.toUpperCase()].fromId(parseInt(data));
            }
        },
        LEGION_ROLE: {
            // This is an OpenUGUP only model not provided anywhere in normal UgUp
            // Legion Role expects to consume an int (or string of int)
            from: function(data, connector) {
                return UGUP.LegionRole[connector.cfg.game.toUpperCase()].fromId(parseInt(data));
            }
        },
        LEGION_SOURCE: {
            // This is an OpenUGUP only model not provided anywhere in normal UgUp
            // Legion Source expects to consume an int (or string of int)
            from: function(data, connector) {
                return UGUP.LegionSource[connector.cfg.game.toUpperCase()].fromId(parseInt(data));
            }
        },
        MAGIC_DEFINITION: {
            "id": "int",
            "name": "string",
            "rarity": "ITEM_RARITY",
            "value_gold": "int",
            "value_credits": "int",
            "questReq": "boolean",
            "lore": "string",
            "proc_desc": "string"
        },
        PET_DEFINITION: {
            "id": "int",
            "name": "string",
            "rarity": "ITEM_RARITY",
            "lore": "string",
            "proc_desc": "string"
        },
        PLATFORM: {
            // This is an OpenUGUP only model not provided anywhere in normal UgUp
            // Platform expects to consume an int (or string of int)
            from: function(data) {
                return UGUP.PLATFORM.valueOf(parseInt(data));
            }
        },
        PLAYER_CLASS: {
            // This is an OpenUGUP only model not provided anywhere in normal UgUp
            // Player Class expects to consume an int (or string of int)
            from: function(data) {
                return UGUP.PlayerClass.fromId(parseInt(data));
            }            
        },
        PROFILE: {
            "fname": "string",
            "level": "int",
            "gender": "string",
            "classID": "int",
            "class": "PLAYER_CLASS",
            "guildID": "int",
            "hairID": "int",
            "skinID": "int",
            "faceID": "int",
            "platform": "PLATFORM",
            "ugupoptout": "int",
            "id": "USER_ID",
            "equipment": "SIMPLE_ITEM", // array
            "achievements": "ACHIEVEMENT", // array
            "messages": "PROFILE_MESSAGE", // array

            initialize: function(response, model) {
                if (model && model.classID) {
                    model["class"] = UGUP.PlayerClass.fromId(model.classID);
                }
            },

            render: function(model) {
                // TODO: Draw the character profile on a canvas or similar
                console.log("Begin Rendering Character!");

                // First, we need to make sure we have all the item definitions needed

            }
        },
        PROFILE_MESSAGE: {
            "message": "string"
        },
        RAID: {
            "id": "int",
            "summonerid": "USER_ID",
            "raidid": "int",
            "debuff1id": "int",
            "debuff2id": "int",
            "debuff3id": "int",
            "debuff4id": "int",
            "debuff5id": "int",
            "debuff6id": "int",
            "guildshared": "boolean",
            "hash": "string",
            "difficulty": "int",
            "enragehealth": "int",
            "maxhealth": "int",
            "currenthealth": "int",
            "nummembers": "int",
            "iscomplete": "boolean",
            "definition": "RAID_DEFINITION",

            render: function() {
                // TODO: Render the raid on a canvas or similar
            }
        },
        RAID_DEFINITION: {
            "id": "int",
            "name": "string",
            "shortname": "string",
            "maxattackers": "int",
            "guildraid": "boolean",
            "raidtimer": "int",
            "cooldowntimer": "int",
            "numdebuffs": "int",
            "size": "RAID_SIZE",
            "image": "string",
            "icon": "string",
            "postimage": "string",
            "classid": "int",
            "difficulty": "RAID_DIFFICULTY",

            render: function() {
                // TODO: Decide how to render a Raid Definition. Maybe wiki format?
            }
        },
        RAID_DIFFICULTY: {
            // This is an OpenUGUP only model not provided anywhere in normal UgUp
            // Raid Difficulty expects to consume an int (or string of int)
            from: function(data) {
                return UGUP.RaidDifficulty.fromId(parseInt(data));
            }
        },
        RAID_SIZE: {
            // This is an OpenUGUP only model not provided anywhere in normal UgUp
            // Raid Difficulty expects to consume an int (or string of int)
            from: function(data) {
                return UGUP.RaidSize.fromId(parseInt(data));
            }
        },
        SIMPLE_ITEM: {
            "itemtype": "int",
            "itemid": "int"
        },
        RECIPE_DEFINITION: {
            "id": "int",
            "name": "string",
            "type": "RECIPE_TYPE",
            "subtype": "RECIPE_SUBTYPE",
            "item": "RECIPE_ITEM", // array
            "result": "RECIPE_ITEM" // array
        },
        RECIPE_ITEM: {
            "id": "int",
            "type": "int",
            "quantity": "int"
        },
        RECIPE_SUBTYPE: {
            // Recipe Subtype expects to consume an int (or string of int)
            // TODO: Come up with a specific model for this (need to map the types)
            from: function(data) {
                return parseInt(data);
            }
        },
        RECIPE_TYPE: {
            // This is an OpenUGUP only model not provided anywhere in normal UgUp
            // Recipe Type expects to consume an int (or string of int)
            from: function(data) {
                return UGUP.RecipeType.fromId(parseInt(data));
            }

        },
        USER_ID: {
            // USER_ID is kind of sneaky in that there isn't anything at the top level of this, it's just a string result
            from: function(data) {
                return data;
            }
        },

        // -- Models Helper Methods -- //
        _defaultFromMethod: function(data, connector) {
            var result = {};
            // For every key in the data
            for (var key in data) {
                if (data.hasOwnProperty(key) ) {
                    // If this model has that key and there is a UGUP model for it
                    if (key in this && UGUP.Models[this[key]]) {
                        if (UGUP.Arrays.isArray(data[key])) {
                            result[key] = [];
                            for (var i = 0; i < data[key].length; i++) {
                                result[key].push(UGUP.Models[this[key]].from(data[key][i], connector));
                            }
                        }
                        else {
                            result[key] = UGUP.Models[this[key]].from(data[key], connector);
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
        _wrapModelCallback: function(modelType, callback, connector) {
            return function(response) {
                var model, parsedJSON;
                // Check the base HTTP response code, we're expecting pure 200, no other 20x codes
                if (response.status == 200) {
                    try {
                        // Parse the JSON
                        var tmpJson = JSON.parse(response.responseText);
                        // Get the result object
                        parsedJSON = tmpJson.result;

                        // If the service reports a data success
                        if (!!tmpJson.success) {
                            // If we know how to parse this kind of model
                            if (modelType && typeof modelType.from === "function") {
                                // Parse into the model
                                model = modelType.from(parsedJSON, connector);
                                if (model) {
                                    if (typeof modelType.initialize === "function") {
                                        modelType.initialize(parsedJSON, model);
                                    }
                                    model._raw = parsedJSON;
                                    model._modelType = modelType;
                                }
                                else {
                                    window.console && window.console.warn("UGUP.JS: Failed to fill model type: ", modelType, " from: ", parsedJSON);
                                }
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
                    catch(ex) {
                        // Some kind of failure in the query. Log it
                        // TODO Better logging mechanism
                        // TODO Specific handling of known error codes
                        window.console && window.console.error("UGUP.JS: Failed handling API response.", ex);
                    }
                }
                if (typeof callback === "function") {
                    callback(response, model || parsedJSON || {});
                }
            }
        }
    },

    LegionRace: {
        SUNS: {
            Any: {
                id: 0,
                key: "Any",
                name: "Any"
            },
            Human: {
                id: 1,
                key: "Human",
                name: "Human"
            },
            Robot: {
                id: 2,
                key: "Robot",
                name: "Robot"
            },
            Rylattu: {
                id: 3,
                key: "Rylattu",
                name: "Rylattu"
            },
            Sussurra: {
                id: 4,
                key: "Sussurra",
                name: "Sussurra"
            },
            Piscarian: {
                id: 5,
                key: "Piscarian",
                name: "Piscarian"
            },
            Snuuth: {
                id: 6,
                key: "Snuuth",
                name: "Snuuth"
            },
            Vlarg: {
                id: 7,
                key: "Vlarg",
                name: "Vlarg"
            },
            Hukkral: {
                id: 8,
                key: "Hukkral",
                name: "Huk-Kral"
            },

            fromId: function(id) {
                var modelRoot = UGUP.LegionRace.SUNS,
                    cache = modelRoot._idCache;
                // If we've made the cache, check it
                if (cache) {
                    return cache[id];
                }
                // Haven't made the cache yet? Generate it now, then try again
                else {
                    cache = {};
                    for (var modelKey in modelRoot) {
                        if (modelRoot.hasOwnProperty(modelKey) && typeof modelRoot[modelKey] !== "function") {
                            var model = modelRoot[modelKey];
                            cache[model.id] = model;
                        }
                    }

                    // Actually store the cache
                    modelRoot._idCache = cache;

                    // Now that we've generated the cache, try again
                    return modelRoot.fromId(id);
                }
            }
        }
    },
    LegionRole: {
        SUNS: {
            Any: {
                id: 0,
                key: "Any",
                name: "Any"
            },
            Tank: {
                id: 1,
                key: "Tank",
                name: "Tank"
            },
            Melee: {
                id: 2,
                key: "Melee",
                name: "Melee"
            },
            Ranged: {
                id: 3,
                key: "Ranged",
                name: "Ranged"
            },
            Healer: {
                id: 4,
                key: "Healer",
                name: "Healer"
            },
            Special: {
                id: 5,
                key: "Special",
                name: "Special (Role)"
            },

            fromId: function(id) {
                var modelRoot = UGUP.LegionRace.SUNS,
                    cache = modelRoot._idCache;
                // If we've made the cache, check it
                if (cache) {
                    return cache[id];
                }
                // Haven't made the cache yet? Generate it now, then try again
                else {
                    cache = {};
                    for (var modelKey in modelRoot) {
                        if (modelRoot.hasOwnProperty(modelKey) && typeof modelRoot[modelKey] !== "function") {
                            var model = modelRoot[modelKey];
                            cache[model.id] = model;
                        }
                    }

                    // Actually store the cache
                    modelRoot._idCache = cache;

                    // Now that we've generated the cache, try again
                    return modelRoot.fromId(id);
                }
            }
        }
    },
    LegionSource: {
        SUNS: {
            Any: {
                id: 0,
                key: "Any",
                name: "Any"
            },
            Strength: {
                id: 1,
                key: "Strength",
                name: "Strength"
            },
            Agility: {
                id: 2,
                key: "Agility",
                name: "Agility"
            },
            Intellect: {
                id: 3,
                key: "Intellect",
                name: "Intellect"
            },
            Discipline: {
                id: 4,
                key: "Discipline",
                name: "Discipline"
            },
            Special: {
                id: 5,
                key: "Special",
                name: "Special (Attribute)"
            },

            fromId: function(id) {
                var modelRoot = UGUP.LegionRace.SUNS,
                    cache = modelRoot._idCache;
                // If we've made the cache, check it
                if (cache) {
                    return cache[id];
                }
                // Haven't made the cache yet? Generate it now, then try again
                else {
                    cache = {};
                    for (var modelKey in modelRoot) {
                        if (modelRoot.hasOwnProperty(modelKey) && typeof modelRoot[modelKey] !== "function") {
                            var model = modelRoot[modelKey];
                            cache[model.id] = model;
                        }
                    }

                    // Actually store the cache
                    modelRoot._idCache = cache;

                    // Now that we've generated the cache, try again
                    return modelRoot.fromId(id);
                }
            }
        }
    },

    PlayerClass: {
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
                text: "Galactic Avengers truly know what it means to be interstellar heroes. Their Energy and Stamina recover at an exceptional rate, allowing them to perform a lifetime's worth of daring deeds each day.",
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
            var pc = UGUP.PlayerClass,
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

    RaidDifficulty: {
        1: {
            name: "Normal",
            shortName: "N"
        },
        2: {
            name: "Hard",
            shortName: "L"
        },
        3: {
            name: "Legendary",
            shortName: "L"
        },
        4: {
            name: "Nightmare",
            shortName: "NM"
        },

        fromId: function(id) {
            return UGUP.RaidDifficulty[id];
        }
    },

    RaidSize: {
        Small: {
            id: 0,
            name: "Small",
            textColor: "#52E461",
            icon: ""
        },
        Medium: {
            id: 1,
            name: "Medium",
            textColor: "#E3E82F",
            icon: ""
        },
        Large: {
            id: 2,
            name: "Large",
            textColor: "#F0690F",
            icon: ""
        },
        Epic: {
            id: 3,
            name: "Epic",
            textColor: "#CC003A",
            icon: ""
        },
        Colossal: {
            id: 4,
            name: "Colossal",
            textColor: "#00ACFF",
            icon: ""
        },
        Personal: {
            id: 5,
            name: "Personal",
            textColor: "#64FD67",
            icon: ""
        },
        SmallPlus: {
            id: 6,
            name: "Small +",
            textColor: "#52E461",
            icon: ""
        },
        SmallSpecial: {
            id: 7,
            name: "Small Special",
            textColor: "#52E461",
            icon: ""
        },
        MediumPlus: {
            id: 8,
            name: "Medium +",
            textColor: "#E3E82F",
            icon: ""
        },
        MediumSpecial: {
            id: 9,
            name: "Medium Special",
            textColor: "#E3E82F",
            icon: ""
        },
        LargePlus: {
            id: 10,
            name: "Large +",
            textColor: "#F0690F",
            icon: ""
        },
        LargeSpecial: {
            id: 11,
            name: "Large Special",
            textColor: "#F0690F",
            icon: ""
        },
        EpicPlus: {
            id: 12,
            name: "Epic +",
            textColor: "#CC003A",
            icon: ""
        },
        EpicSpecial: {
            id: 13,
            name: "Epic Special",
            textColor: "#CC003A",
            icon: ""
        },
        ColossalPlus: {
            id: 14,
            name: "Colossal +",
            textColor: "#00ACFF",
            icon: ""
        },
        ColossalSpecial: {
            id: 15,
            name: "Colossal Special",
            textColor: "#00ACFF",
            icon: ""
        },
        Titanic: {
            id: 16,
            name: "Titanic",
            textColor: "#D8005F",
            icon: ""
        },
        TitanicSpecial: {
            id: 17,
            name: "Titanic Special",
            textColor: "#D8005F",
            icon: ""
        },
        Galactic: {
            id: 18,
            name: "Galactic",
            textColor: "#568BF7",
            icon: ""
        },
        GalacticSpecial: {
            id: 19,
            name: "Galactic Special",
            textColor: "#568BF7",
            icon: ""
        },

        fromId: function(id) {
            var modelRoot = UGUP.LegionRace.SUNS,
                cache = modelRoot._idCache;
            // If we've made the cache, check it
            if (cache) {
                return cache[id];
            }
            // Haven't made the cache yet? Generate it now, then try again
            else {
                cache = {};
                for (var modelKey in modelRoot) {
                    if (modelRoot.hasOwnProperty(modelKey) && typeof modelRoot[modelKey] !== "function") {
                        var model = modelRoot[modelKey];
                        cache[model.id] = model;
                    }
                }

                // Actually store the cache
                modelRoot._idCache = cache;

                // Now that we've generated the cache, try again
                return modelRoot.fromId(id);
            }
        }
    },

    RecipeType: {
        General: {
            id: 1,
            name: "General"
        },
        Collection: {
            id: 2,
            name: "Collection"
        },
        Alliance: {
            id: 3,
            name: "Alliance"
        },
        Legendary: {
            id: 4,
            name: "Legendary"
        },
        Misc: {
            id: 5,
            name: "Misc."
        },

        fromId: function(id) {
            var modelRoot = UGUP.LegionRace.SUNS,
                cache = modelRoot._idCache;
            // If we've made the cache, check it
            if (cache) {
                return cache[id];
            }
            // Haven't made the cache yet? Generate it now, then try again
            else {
                cache = {};
                for (var modelKey in modelRoot) {
                    if (modelRoot.hasOwnProperty(modelKey) && typeof modelRoot[modelKey] !== "function") {
                        var model = modelRoot[modelKey];
                        cache[model.id] = model;
                    }
                }

                // Actually store the cache
                modelRoot._idCache = cache;

                // Now that we've generated the cache, try again
                return modelRoot.fromId(id);
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
            callback: UGUP.Models._wrapModelCallback(UGUP.Models.USER_ID, callback, this)
        });
    },

    fetchUserProfileById: function(userId, callback) {
        this.ajax({
            url: this.urls.PROFILE,
            urlParams: {"id": userId},
            callback: UGUP.Models._wrapModelCallback(UGUP.Models.PROFILE, callback, this)
        });
    },

    fetchUserProfileByUsername: function(username, callback) {
        this.fetchUserId(username, function(response, model) {
            this.fetchUserProfileById(model, callback);
        }.bind(this));
    },

    fetchRaid: function(id, hash, callback) {
        this.ajax({
            url: this.urls.RAID,
            urlParams: {"id": id, "hash": hash},
            callback: UGUP.Models._wrapModelCallback(UGUP.Models.RAID, callback, this)
        });
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