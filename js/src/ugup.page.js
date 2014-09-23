function initUgUpTest() {
    var picker = document.getElementById("ugup-api-picker"),
        optionsArea = document.getElementById("ugup-api-params");

    for (var n in UGUP.Dawn.prototype) {
        if (typeof UGUP.Dawn.prototype[n] === "function" && n.indexOf("fetch") === 0) {
            var opt = document.createElement("option");
            opt.name = n;
            opt.appendChild(document.createTextNode(n.substr(5).replace(/([A-Z])/g, ' $1')));
            opt.params = getParamNames(UGUP.Dawn.prototype[n]);
            picker.appendChild(opt);
        }
    }


    picker.onchange = function() {
        var opt = this.selectedOptions[0],
            params = opt.params;



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