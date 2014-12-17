function initUgUpTest() {
    var apiKeyInput = document.getElementById("ugup-api-key"),
        gamePicker = document.getElementById("ugup-api-game-picker"),
        platformPicker = document.getElementById("ugup-api-platform-picker"),
        apiPicker = document.getElementById("ugup-api-picker"),
        optionsArea = document.getElementById("ugup-api-params"),
        runQueryBtn = document.getElementById("upup-api-run-btn"),
        queryArea = document.getElementById("ugup-api-query"),
        renderArea = document.getElementById("ugup-api-render"),
        resultsArea = document.getElementById("ugup-api-results"),
        opt;

    for (var game in UGUP.GAME) {
        if (UGUP.GAME.hasOwnProperty(game) && typeof UGUP.GAME[game] !== "function") {
            opt = document.createElement("option");
            opt.name = UGUP.GAME[game];
            opt.appendChild(document.createTextNode(game));
            gamePicker.appendChild(opt);
        }
    }

    for (var platform in UGUP.PLATFORM) {
        if (UGUP.PLATFORM.hasOwnProperty(platform) && typeof UGUP.PLATFORM[platform] !== "function") {
            opt = document.createElement("option");
            opt.name = platform;
            opt.appendChild(document.createTextNode(UGUP.PLATFORM[platform].name));
            opt.platform = UGUP.PLATFORM[platform];
            platformPicker.appendChild(opt);
        }
    }

    for (var n in UGUP.Dawn.prototype) {
        if (typeof UGUP.Dawn.prototype[n] === "function" && n.indexOf("fetch") === 0) {
            opt = document.createElement("option");
            opt.name = n;
            opt.appendChild(document.createTextNode(n.substr(5).replace(/([A-Z])/g, ' $1')));
            opt.params = getParamNames(UGUP.Dawn.prototype[n]);
            apiPicker.appendChild(opt);
        }
    }


    apiPicker.onchange = function() {
        var opt = this.selectedOptions[0],
            params = opt.params,
            i, param,
            html = "";

        for (i = 0; i < params.length - 1; i++) {
            param = params[i];
            html += "<label for='api-param-" + param + "'>" + param + ": <input id='api-param-" + param + "' name='" + param + "'></label>";
        }

        if (!params.length) {
            html += "No parameters";
        }

        optionsArea.innerHTML = html;
    };

    runQueryBtn.onclick = function() {
        var apiFnOpt = apiPicker.selectedOptions[0],
            functionName = apiFnOpt.name,
            apiKey = apiKeyInput.value.trim(),
            gameOpt = gamePicker.selectedOptions[0],
            gameKey = gameOpt.name,
            platformOpt = platformPicker.selectedOptions[0],
            platformKey = platformOpt.name,
            paramInputs = optionsArea.getElementsByTagName("input"),
            paramValues = [],
            paramValuesClean = [],
            i,
            connectorArgs = "";

        UGUP.Elements.removeAllChildren(renderArea);

        if (functionName && platformKey && gameKey) {
            for (i = 0; i < paramInputs.length; i++) {
                var paramVal = paramInputs[i].value;
                paramValuesClean.push(paramVal);

                if (paramInputs[i].name !== "id") {
                    paramVal = '"' + paramVal + '"';
                }
                paramValues.push(paramVal);
            }

            if (apiKey) {
                connectorArgs += "apiKey: \"" + apiKey + "\", ";
            }

            connectorArgs += "platform: UGUP.PLATFORM." + platformKey;

            gameKey = gameKey.charAt(0).toUpperCase() + gameKey.slice(1).toLowerCase();

            connectorArgs = "{" + connectorArgs + "}";

            var queryHTML = "Running Query: <br>";
            queryHTML += "<pre class='code prettyprint lang-js'>var connector = new UGUP." + gameKey + "(" + connectorArgs + ");\n";
            queryHTML += "connector." + functionName + "(" + (paramValues.length ? paramValues.join(", ") + ", ": "") + "callback);</pre><br>";

            queryArea.innerHTML = queryHTML;

            resultsArea.innerHTML = "<img src='img/loading.gif' />";

            // This is the callback function used by the generated UGUP connector
            paramValuesClean.push(function(response, model) {
                resultsArea.innerHTML = "";

                if (model._modelType && typeof model._modelType.render === "function") {
                    resultsArea.innerHTML += '<button type="button" id="ugup-api-render-btn" class="btn btn-success">Render OpenUGUP Model</button>';
                }

                if (model && !response) {
                    response = "" + response + " // A blank response with a defined model usually means the model was already requested and cached."
                }
                resultsArea.innerHTML += "OpenUGUP Model: \n <pre class='code prettyprint lang-js'>" + (window.js_beautify ? js_beautify(JSON.stringify(model)) : JSON.stringify(model)) + "</pre>";
                resultsArea.innerHTML += "\n\n\nRaw Response: \n <pre class='code prettyprint lang-js'>" + (window.js_beautify ? js_beautify(JSON.stringify(response)) : JSON.stringify(response)) + "</pre>";

                var renderBtn = document.getElementById("ugup-api-render-btn");

                if (renderBtn) {
                    renderBtn.onclick = function() {
                        UGUP.Elements.removeAllChildren(renderArea);
                        model._modelType.render(model, connector, function(el){renderArea.appendChild(el);});
                    };
                }

                // This function can take a while, and can be done async from the rest of things
                if (typeof window.prettyPrint === "function") {
                    setTimeout(function(){prettyPrint();}, 1000);
                }
            });

            // Create the configured connector
            var connector = new UGUP[gameKey]({apiKey: apiKey,
                                               platform: UGUP.PLATFORM[platformKey],
                                               urlRoot: "http://getkonge.org/games/lots/ugup/proxytest.php/"
                                              });
            connector[functionName].apply(connector, paramValuesClean);
        }
        else {
            alert("Not a valid query");
        }
    };
}

// Borrowed from http://stackoverflow.com/a/9924463/1449525
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);

    if (result === null) {
        result = [];
    }

    return result;
}


initUgUpTest();