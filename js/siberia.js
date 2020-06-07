(function(){
    var reconstruct_symbol = function(symbolName){
        return Symbol(symbolName);
    };
    var reconstruct_function = function(strval){
        return eval('('+strval+')');
    };
    var reconstruct_RegExp = function(str){
        return eval(str);
    };
    var reconstruct = {
        _string  : null,
        _number  : null,
        _symbol  : reconstruct_symbol,
        _function: reconstruct_function,
        Boolean  : function(arg){ return new Boolean(arg); },
        Date     : function(arg){ return new Date(arg); },
        Number   : function(arg){ return new Number(arg); },
        RegExp   : reconstruct_RegExp,
        String   : function(arg){ return new String(arg); }
    };
    var options = {};
    options.nullify = {};
    options.nullify.functions = false;
    options.nullify.symbols   = false;
    options.nullify.RegExp    = false;
    var stringify_replacer;
    function compute_stringify_replacer(){
        stringify_replacer = options.nullify.RegExp
            ? options.nullify.functions
                ? options.nullify.symbols
                    ? function(key,value){
                        var type = typeof value;
                        if (type==='object'){
                            if (value===null) return null;
                            if (value.constructor===RegExp) return null;
                            return value;
                        }
                        return value;
                    } : function(key,value){
                        var type = typeof value;
                        if (type==='object'){
                            if (value===null) return null;
                            if (value.constructor===RegExp) return null;
                            return value;
                        }
                        if (type==='symbol'  ) return value.toString().slice(7,-1);
                        return value;
                    }
                : options.nullify.symbols
                    ? function(key,value){
                        var type = typeof value;
                        if (type==='object'){
                            if (value===null) return null;
                            if (value.constructor===RegExp) return null;
                            return value;
                        }
                        if (type==='function') return value.toString();
                        return value;
                    } : function(key,value){
                        var type = typeof value;
                        if (type==='object'){
                            if (value===null) return null;
                            if (value.constructor===RegExp) return null;
                            return value;
                        }
                        if (type==='symbol'  ) return value.toString().slice(7,-1);
                        if (type==='function') return value.toString();
                        return value;
                    }
            : options.nullify.functions
                ? options.nullify.symbols
                    ? function(key,value){
                        var type = typeof value;
                        if (type==='object'){
                            if (value===null) return null;
                            if (value.constructor===RegExp) return value.toString();
                            return value;
                        }
                        return value;
                    } : function(key,value){
                        var type = typeof value;
                        if (type==='object'){
                            if (value===null) return null;
                            if (value.constructor===RegExp) return value.toString();
                            return value;
                        }
                        if (type==='symbol'  ) return value.toString().slice(7,-1);
                        return value;
                    }
                : options.nullify.symbols
                    ? function(key,value){
                        var type = typeof value;
                        if (type==='object'){
                            if (value===null) return null;
                            if (value.constructor===RegExp) return value.toString();
                            return value;
                        }
                        if (type==='function') return value.toString();
                        return value;
                    } : function(key,value){
                        var type = typeof value;
                        if (type==='object'){
                            if (value===null) return null;
                            if (value.constructor===RegExp) return value.toString();
                            return value;
                        }
                        if (type==='symbol'  ) return value.toString().slice(7,-1);
                        if (type==='function') return value.toString();
                        return value;
                    }
    }
    var setOptions = {};
    setOptions.nullify = {};
    setOptions.nullify.functions = {};
    setOptions.nullify.symbols   = {};
    setOptions.nullify.RegExp    = {};
    setOptions.nullify.functions.true = function(){
        options.nullify.functions = true;
        compute_stringify_replacer();
        reconstruct._function = null;
    }
    setOptions.nullify.functions.false = function(){
        options.nullify.functions = false;
        compute_stringify_replacer();
        reconstruct._function = reconstruct_function;
    }
    setOptions.nullify.symbols.true = function(){
        options.nullify.symbols = true;
        compute_stringify_replacer();
        reconstruct._symbol = null;
    }
    setOptions.nullify.symbols.false = function(){
        options.nullify.symbols = false;
        compute_stringify_replacer();
        reconstruct._symbol = reconstruct_symbol;
    }
    setOptions.nullify.RegExp.true = function(){
        options.nullify.RegExp = true;
        compute_stringify_replacer();
        reconstruct.RegExp = null;
    }
    setOptions.nullify.RegExp.false = function(){
        options.nullify.RegExp = false;
        compute_stringify_replacer();
        reconstruct.RegExp = reconstruct_RegExp;
    }
    var getOptions = function(){ return options; }
    compute_stringify_replacer();
    function sortComparatorNumericalAscending(a,b){return Number(a)-Number(b);}
    var typeNames_singleton = [null, "NULL", "UNDEFINED", "TRUE", "FALSE", "NAN", "INFINITY", "MINUS_INFINITY"];
    var typeNames_regular   = ["_string", "_number", "_symbol", "_function", "Boolean", "Date", "Number", "RegExp", "String"];
    var typeNames = typeNames_singleton.concat(typeNames_regular);
    var typeNames_regular_startIndex = typeNames_singleton.length;
    var TYPES = {};
    typeNames.forEach(function(typeName, index){
        if (index > 0){
            TYPES[typeName] = index;
        }
    });
    var value_of_singleton = {
        NULL: null,
        UNDEFINED : undefined,
        TRUE: true,
        FALSE : false,
        NAN : NaN,
        INFINITY: Infinity,
        MINUS_INFINITY: -Infinity
    };
    function typeIndex(item) {
        if (item===null) return TYPES.NULL;
        if (item===undefined) return TYPES.UNDEFINED;
        var type = typeof item;
        if (type==='boolean'){
            if (item===true) return TYPES.TRUE;
            if (item===false) return TYPES.FALSE;
            throw new Error("won't happen");
        }
        if (type==='number'){
            if (item===Infinity) return TYPES.INFINITY;
            if (item===-Infinity) return TYPES.MINUS_INFINITY;
            if (isNaN(item)) return TYPES.NAN;
            return TYPES._number
        }
        if (type==='string') return TYPES._string;
        if (type==='symbol') return TYPES._symbol;
        if (type==='function') return TYPES._function;
        if (type!=='object') throw new Error("won't happen");
        if (item instanceof Boolean) return TYPES.Boolean;
        if (item instanceof Date) return TYPES.Date;
        if (item instanceof Number) return TYPES.Number;
        if (item instanceof RegExp) return TYPES.RegExp;
        if (item instanceof String) return TYPES.String;
        return 0;
    }
    function infant(value) { return Array.isArray(value) ? [] : {}; }
    function forestify(object) {
        var ti = typeIndex(object);
        if (ti!==0) return object;
        var result = {};
        result.typeSingletons = {};
        result.typeRegular = [];
        var valueLookups = {};
        var valueLookupCount = {};
        var groupedValues = {};
        var objects = [object];
        var forest = [infant(object)];
        var bucket = new WeakMap(); // bucket = inverse of objects 
        bucket.set(object, 0); // i.e., map object to index in array
        function addToBucket(obj) {
            var result = objects.length;
            objects.push(obj);
            bucket.set(obj, result);
            return result;
        }
        function isInBucket(obj) {
            return bucket.has(obj);
            // objects[bucket.get(obj)] === obj, iff true is returned
        }
        function process(source, target) {
            Object.keys(source).forEach(function(key){
                var value = source[key];
                var tyIdx = typeIndex(value);
                if (tyIdx===0){
                    var ptr;
                    if (isInBucket(value)) {
                        ptr = bucket.get(value);
                    } else {
                        ptr = addToBucket(value);
                        var newTree = infant(value);
                        forest.push(newTree);
                        process(value, newTree);
                    }
                    target[key] = ptr;
                } else {
                    if (tyIdx >= typeNames_regular_startIndex){
                        valueLookupCount[tyIdx] = (typeof valueLookupCount[tyIdx] === 'number') ? valueLookupCount[tyIdx] : 0;
                        valueLookups[tyIdx] = valueLookups[tyIdx] || {};
                        groupedValues[tyIdx] = groupedValues[tyIdx] || [];
                        if (value in valueLookups[tyIdx]){
                            // do nothing
                        } else {
                            valueLookups[tyIdx][value] = valueLookupCount[tyIdx]++;
                            groupedValues[tyIdx].push(value);
                        }
                        target[key] = { type: tyIdx, index: valueLookups[tyIdx][value] };
                    } else {
                        result.typeSingletons[typeNames[tyIdx]] = tyIdx;
                        target[key] = -tyIdx;
                    }
                }
            });
        }
        process(object, forest[0]);
        var SK = Object.keys(result.typeSingletons);
        var last_singleton = (SK.length>0)
            ? Math.max.apply(null, SK.map(function(key){ return result.typeSingletons[key]; }))
            : 0;
        var typeStart = 1 + last_singleton;
        var typeStartLookup = [];
        Object.keys(groupedValues).sort(sortComparatorNumericalAscending).forEach(function(tyIdx){
            var typeName = typeNames[tyIdx];
            var typeCount = groupedValues[tyIdx].length;
            var typeEnd = typeStart + typeCount;
            result.typeRegular.push({typeName: typeName, idxStart: typeStart});
            typeStartLookup[tyIdx] = typeStart;
            typeStart = typeEnd;
        });
        var flatValues = [];
        Object.keys(result.typeSingletons).forEach(function(typeName){
            flatValues[TYPES[typeName]] = value_of_singleton[typeName];
        });
        for (var treeIdx=0; treeIdx<forest.length; treeIdx++){
            function array_forEach(entry, i){
                var tyEntry = typeof entry;
                if (tyEntry==='number'){
                    // do nothing
                } else {
                    if (tyEntry==='object'){
                        var IDX = typeStartLookup[entry.type] + entry.index;
                        flatValues[IDX] = groupedValues[entry.type][entry.index];
                        tree[i] = -IDX;
                    } else {
                        debugger; throw new Error("won't happen");
                    }
                }
            }
            function object_forEach(key){
                var entry = tree[key];
                var tyEntry = typeof entry;
                if (tyEntry==='number'){
                    // do nothing
                } else {
                    if (tyEntry==='object'){
                        var IDX = typeStartLookup[entry.type] + entry.index;
                        flatValues[IDX] = groupedValues[entry.type][entry.index];
                        tree[key] = -IDX;
                    } else {
                        debugger; throw new Error("won't happen");
                    }
                }
            }
            var tree = forest[treeIdx];
            if (Array.isArray(tree)){
                tree.forEach(array_forEach);
            } else {
                Object.keys(tree).forEach(object_forEach);
            }
        }
        result.forest = forest;
        result.flatValues = flatValues;
        return result;
    };
    function thawForest(forestified) {
        var typeSingletons  = forestified.typeSingletons;
        var typeRegular     = forestified.typeRegular;
        var forest          = forestified.forest;
        var flatValues      = forestified.flatValues;
        var objects         = [];
        var objectRequested = [];
        var todo            = [];
        function processTree(idx) {
            if (idx in objects) return objects[idx];
            if (objectRequested[idx]) return null;
            objectRequested[idx] = true;
            var tree = forest[idx];
            var node = infant(tree);
            for (var key in tree) {
                var o = tree[key];
                var I = +o;
                if (isNaN(I)){
                    debugger; throw new Error("won't happen");
                } else {
                    if (I >= 0){
                        var value = processTree(I);
                        if (value === null) {
                            todo.push({node: node, key: key, idx: I});
                        } else {
                            node[key] = value;
                        }
                    } else {
                        node[key] = flatValues[-I];
                    }
                }
            }
            objects[idx] = node;
            return node;
        }
        var result = processTree(0);
        for (var i = 0; i < todo.length; i++) {
            var item = todo[i];
            item.node[item.key] = objects[item.idx];
        }
        return objects;
    };
    function unforestify(forestified){
        return thawForest(forestified)[0];
    }
    function stringify(forestified){
        return JSON.stringify(forestified, stringify_replacer);
    }
    function unstringify(string){
        var parsed         = JSON.parse(string);
        var typeSingletons = parsed.typeSingletons;
        var typeRegular    = parsed.typeRegular;
        var forest         = parsed.forest;
        var flatValues     = parsed.flatValues;
        Object.keys(typeSingletons).forEach(function(typeName){
            flatValues[TYPES[typeName]] = value_of_singleton[typeName];
        });
        for (var t=0; t<typeRegular.length; t++){
            var typeName = typeRegular[t].typeName;
            var idxStart = typeRegular[t].idxStart;
            var idxEnd = (t+1>=typeRegular.length) ? flatValues.length : typeRegular[t+1].idxStart;
            var f = reconstruct[typeName];
            if (f){
                for (var i=idxStart; i<idxEnd; i++){
                    flatValues[i] = f(flatValues[i]);
                }
            }
        }
        return parsed;
    }
    function serialize(object){
        return stringify(forestify(object));
    }
    function unserialize(string){
        return unforestify(unstringify(string));
    }
    function getKeySetsUpto(object, depth){
        function unaryPlus(x){ return +x; }
        if (depth===0) return [];
        if (depth<0) throw new Error('illegal argument');
        var keySets    = new Array(depth);
        var arrayAtLvl = new Array(depth);
        for (var i=0; i<depth; i++){
            keySets[i] = {};
            arrayAtLvl[i] = true;
        }
        function inner(node, level){
            if (!node) return;
            if (typeof node !== 'object') return;
            var keys    = Object.keys(node);
            var keySet  = keySets[level];
            var arrHere = Array.isArray(node);
            var arrAll  = arrayAtLvl[level] && arrHere;
            if (arrAll){
                var i=-1;
                var L = keys.length;
                while (true){
                    ++i;
                    if (i>=L) break;
                    var _key = keys[i];
                    var  key = +_key;
                    if (isNaN(key)||(key<0)||(key===Infinity)) break;
                    if (Math.round(key)!==key) break;
                    keySet[_key] = null;
                }
                if (i<L){
                    arrAll = false;
                    for(;i<L;i++){
                        keySet[keys[i]] = null;
                    }
                }
            } else {
                keys.forEach(function(key){
                    keySet[key] = null;
                });
            }
            arrayAtLvl[level] = arrAll;
            if (level < depth-1){
                keys.forEach(function(key){
                    inner(node[key], level+1);
                });
            }
        }
        inner(object, 0);
        var result = new Array(depth);
        for (var i=0; i<depth; i++){
            var keys = Object.keys(keySets[i]);
            if (arrayAtLvl[i]){
                result[i] = keys.map(unaryPlus);
            } else {
                result[i] = keys;
            }
        }
        return result;
    }
    function clone(object){
        return unforestify(forestify({content: object})).content;
    }
    JSON.Siberia = {
        forestify   : forestify,
        thawForest  : thawForest,
        unforestify : unforestify,
        stringify   : stringify,
        unstringify : unstringify,
        serialize   : serialize,
        unserialize : unserialize,
        clone       : clone,
        getKeySetsUpto: getKeySetsUpto,
        setOptions  : setOptions,
        getOptions  : getOptions
    };
    function ObjectGraphAnalysis(frozen, thawed, treeIndex, sourceObject){
        this.frozen = frozen;
        this.thawed = thawed;
        this.treeIndex = treeIndex;
        this.sourceObject = sourceObject || null;
    }
    function PrimitiveGraphAnalysis(value){
        this.value = value;
    }
    JSON.Siberia.graphAnalysisNULL = new PrimitiveGraphAnalysis(null);
    ObjectGraphAnalysis.prototype.primitive    = false;
    ObjectGraphAnalysis.prototype.get          = function(){ return this.thawed[this.treeIndex]; };
    ObjectGraphAnalysis.prototype.getTree      = function(){ return this.frozen.forest[this.treeIndex]; };
    ObjectGraphAnalysis.prototype.getTreeIndex = function(){ return this.treeIndex; };
    ObjectGraphAnalysis.prototype.keys = function(){
        var obj = this.get();
        if (!obj) return [];
        if ((typeof obj)!=='object') return [];
        return Object.keys(obj);
    };
    ObjectGraphAnalysis.prototype.keySetsUpto = function(depth){
        return JSON.Siberia.getKeySetsUpto(this.get(), depth)
    };
    ObjectGraphAnalysis.prototype.getChild = function(key){
        var tree = this.getTree();
        if (key in tree){
            var treeEntry = tree[key];
            if (Number.isInteger(treeEntry)){
                if (treeEntry>=0){
                    var s = this.sourceObject;
                    return new ObjectGraphAnalysis(this.frozen, this.thawed, treeEntry, (s&&s[key]) || null);
                } else {
                    var v = this.frozen.flatValues[-treeEntry];
                    return new PrimitiveGraphAnalysis(v);
                }
            } else {
                debugger; throw new Error("won't happen");
            }
        } else {
            return JSON.Siberia.graphAnalysisNULL;
        }
    };
    PrimitiveGraphAnalysis.prototype.primitive    = true;
    PrimitiveGraphAnalysis.prototype.get          = function(){ return this.value; };
    PrimitiveGraphAnalysis.prototype.getTree      = function(){ return null; };
    PrimitiveGraphAnalysis.prototype.getTreeIndex = function(){ return -1; };
    PrimitiveGraphAnalysis.prototype.keys         = function(){ return []; };
    PrimitiveGraphAnalysis.prototype.keySetsUpto = function(depth){
        return JSON.Siberia.getKeySetsUpto({}, depth)
    };
    PrimitiveGraphAnalysis.prototype.getChild = function(key){
        return JSON.Siberia.graphAnalysisNULL;
    };
    function isObjectGraphAnalysis(obj){
        return obj && ((typeof obj)==='object') && (
            (obj instanceof ObjectGraphAnalysis) || (obj instanceof PrimitiveGraphAnalysis) );
    }
    function analyzeObjectGraph(object){
        var frozen = JSON.Siberia.forestify(object);
        if (object===frozen) return new PrimitiveGraphAnalysis(frozen);
        var thawed = JSON.Siberia.thawForest(frozen);
        return new ObjectGraphAnalysis(frozen, thawed, 0, object);
    }
    JSON.Siberia.isObjectGraphAnalysis  = isObjectGraphAnalysis;
    JSON.Siberia.ObjectGraphAnalysis    = ObjectGraphAnalysis;
    JSON.Siberia.PrimitiveGraphAnalysis = PrimitiveGraphAnalysis;
    JSON.Siberia.analyzeObjectGraph     = analyzeObjectGraph;
})();
