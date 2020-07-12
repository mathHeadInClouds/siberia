(function(){
    function ascending(a,b){return Number(a)-Number(b);}
    function topOf(arr){
        if (!Array.isArray(arr)){
            debugger; throw new Error('array expected');
        }
        if (arr.length===0){
            debugger; throw new Error('empty array encountered');
        }
        return arr[arr.length-1];
    }
    var TYPE_NAMES = ['singleton_null', 'singleton_undefined', 'singleton_true', 'singleton_false','string', 'number', 'function', 'Date', 'RegExp', 'Native'];
    var TYPE_IDX = {};
    var T = {};
    var IS_SINGLETON = {};
    var IS_OBJECT = {};
    TYPE_NAMES.forEach(function(typeName, idx){
        TYPE_IDX[typeName] = idx;
        T[typeName] = typeName;
        IS_SINGLETON[typeName] = typeName.slice(0,10)==='singleton_';
        IS_OBJECT[typeName] = typeName in {Date: null, RegExp: null, Native: null, function: null};
    });
    function TYPE_OF(item){
        var f = {
            'object': function(){
                if (item===null) return T.singleton_null;
                if (item instanceof Date) return T.Date;
                if (item instanceof RegExp) return T.RegExp;
                if (Array.isArray(item)) return '';
                var c = item.constructor;
                if (c===Object) return '';
                var cstr = c.toString();
                var testSlice = cstr.slice(1+cstr.indexOf('{'),cstr.lastIndexOf('}')).trim();
                var isNative = (testSlice==='[native code]');
                if (isNative){ return T.Native; } else { return ''; }
            },
            'undefined': function(){ return T.singleton_undefined; },
            'string'   : function(){ return T.string; },
            'number'   : function(){ return T.number; },
            'function' : function(){ return T.function;  },
            'symbol'   : function(){ throw new Error('todo'); },
            'boolean': function(){
                if (item===true) return T.singleton_true;
                if (item===false) return T.singleton_false;
                throw new Error('unexpected');
            }
        }
        return (function(type){
            if (type in f) return f[type]();
            debugger;
            throw new Error('unexpected: unknown typeof');
        })(typeof item);
    }
    function objectGraph(argument){
        var root;
        var ty_arg = TYPE_OF(argument);
        var isWrappedHazard = (ty_arg.length>0);
        if (isWrappedHazard){
            root = { content: argument };
        } else {
            root = argument;
        }
        var stack = [root];
        var oKeys_stack = [];
        var oKeys_idx_stack = [];
        var objects = [], inverseObjects = new WeakMap(), forest = [];
        var atomBuckets = {}, counter = 0, atoms = [];
        var tos, aKeys_sing, aKeys_obj, aKeys, oKeys, oKeysIdx, new_object, ty;
        function discover_RECURSIVE(obj){ // easier to read version which, unfortunately, will generate stack overflow if used on extremely large objects - UNUSED
            var currentIdx = objects.length;
            inverseObjects.set(obj, currentIdx);
            objects.push(obj);
            forest[currentIdx] = Array.isArray(obj) ? [] : {};
            var keys = Object.keys(obj);
            for (var i=0; i<keys.length; i++){
                var key = keys[i], val = obj[key], type = TYPE_OF(val);
                if (type){
                    if (IS_SINGLETON[type]){
                        if (!(type in atomBuckets)){
                            ++counter;
                            atomBuckets[type] = counter;
                            atoms[counter] = val;
                        }
                        forest[currentIdx][key] = -atomBuckets[type];
                    } else {
                        if (!(type in atomBuckets)){
                            atomBuckets[type] = {};
                        }
                        if (IS_OBJECT[type]){
                            if (!(val in atomBuckets[type])){
                                atomBuckets[type][val] = new Map();
                            }
                            if (!atomBuckets[type][val].has(val)){
                                ++counter;
                                atomBuckets[type][val].set(val, counter);
                                atoms[counter] = val;
                            }
                            forest[currentIdx][key] = -atomBuckets[type][val].get(val);
                        } else {
                            if (!(val in atomBuckets[type])){
                                ++counter;
                                atomBuckets[type][val] = counter;
                                atoms[counter] = val;
                             }
                            forest[currentIdx][key] = -atomBuckets[type][val];
                        }
                    }
                } else {
                    if (inverseObjects.has(val)){
                        forest[currentIdx][key] = inverseObjects.get(val);
                    } else {
                        forest[currentIdx][key] = discover_RECURSIVE(val);
                    }
                }
            }
            return currentIdx;
        }
        function discover(){
            while (true){
                while (true){
                    tos = topOf(stack);
                    inverseObjects.set(tos, objects.length);
                    forest[objects.length] = Array.isArray(tos) ? [] : {};
                    objects.push(tos);
                    aKeys_sing = []; aKeys_obj = []; aKeys = []; oKeys = []; ty = {};
                    Object.keys(tos).forEach(function(key){
                        var v = tos[key], type = TYPE_OF(v);
                        (type
                            ? ( IS_SINGLETON[type] ? aKeys_sing : ( IS_OBJECT[type] ? aKeys_obj : aKeys ) )
                            : oKeys
                        ).push(key);
                        ty[key] = type;
                    });
                    aKeys_sing.forEach(function(key){
                        var v = tos[key], type = ty[key];
                        if (!(type in atomBuckets)){
                            ++counter;
                            atomBuckets[type] = counter;
                            atoms[counter] = v;
                        }
                        forest[objects.length-1][key] = -atomBuckets[type];
                    });
                    aKeys.forEach(function(key){
                        var v = tos[key], type = ty[key];
                        if (!(type in atomBuckets)){ atomBuckets[type] = {}; }
                        if (!(v in atomBuckets[type])){
                            ++counter;
                            atomBuckets[type][v] = counter;
                            atoms[counter] = v;
                        }
                        forest[objects.length-1][key] = -atomBuckets[type][v];
                    });
                    aKeys_obj.forEach(function(key){
                        var v = tos[key], type = ty[key];
                        if (!(type in atomBuckets)){ atomBuckets[type] = {}; }
                        if (!(v in atomBuckets[type])){
                            atomBuckets[type][v] = new Map();
                        }
                        if (!atomBuckets[type][v].has(v)){
                            ++counter;
                            atomBuckets[type][v].set(v, counter);
                            atoms[counter] = v;
                        }
                        forest[objects.length-1][key] = -atomBuckets[type][v].get(v);
                    });
                    new_object = null; oKeysIdx = -1;
                    while (new_object===null){
                        ++oKeysIdx;
                        if (oKeysIdx>=oKeys.length) break;
                        var o = tos[oKeys[oKeysIdx]];
                        if (inverseObjects.has(o)){
                            forest[objects.length-1][oKeys[oKeysIdx]] = inverseObjects.get(o);
                        } else {
                            new_object = o;
                        }
                    }
                    oKeys_stack.push(oKeys); oKeys_idx_stack.push(oKeysIdx);
                    if (new_object===null){ break; } else { stack.push(new_object); }
                }
                while (true){
                    if (stack.length===0) return;
                    tos = stack.pop(); oKeys = oKeys_stack.pop(); oKeysIdx = oKeys_idx_stack.pop();
                    if ((function tosHasNew(){
                        while (oKeysIdx<oKeys.length){
                            new_object = tos[oKeys[oKeysIdx]];
                            if (inverseObjects.has(new_object)){
                                forest[inverseObjects.get(tos)][oKeys[oKeysIdx]] = inverseObjects.get(new_object);
                            } else {
                                return true;
                            }
                            ++oKeysIdx;
                        }
                        return false;
                    })()) break;
                }
                stack.push(tos); oKeys_stack.push(oKeys); oKeys_idx_stack.push(oKeysIdx);
                stack.push(new_object);
            }
        }
        discover(); // if you use recursive version, pass root as argument
//console.log(atomBuckets);
        var types = [], sortedAtoms = [], reorder = [], newCounter = 0;
        Object.keys(atomBuckets).map(function(t){ return TYPE_IDX[t]; }).sort(ascending).forEach(function(typeIdx){
            var typeName = TYPE_NAMES[typeIdx];
            var bucket = atomBuckets[typeName];
            types.push({name: typeName, startIndex: 1+newCounter});
            if (IS_SINGLETON[typeName]){
                ++newCounter;
                reorder[bucket] = newCounter;
                sortedAtoms[newCounter] = atoms[bucket];
            } else {
                if (IS_OBJECT[typeName]){
                    Object.keys(bucket).forEach(function(valueString){
                        var map = bucket[valueString];
                        map.forEach(function(image, source){
                            ++newCounter;
                            reorder[image] = newCounter;
                            sortedAtoms[newCounter] = source;
                            if (source!==atoms[image]){
                                if (false) console.log(typeName,bucket,map,atoms,sortedAtoms,atomBuckets);
                                debugger; throw new Error('unexpected');
                            }
                        });
                    });
                } else {
                    Object.keys(bucket).forEach(function(valueString){
                        ++newCounter;
                        var oldIdx = bucket[valueString];
                        reorder[oldIdx] = newCounter;
                        sortedAtoms[newCounter] = atoms[oldIdx];
                    });
                }
            }
        });
//console.log(reorder);
        var sortedForest = forest.map(function(tree){
            var newTree = Array.isArray(tree) ? [] : {};
            Object.keys(tree).forEach(function(key){
                var _i_ = tree[key];
                newTree[key] = (_i_>=0) ? _i_ : -reorder[-_i_];
            });
            return newTree;
        });
        if (isWrappedHazard){
            return {
                objects        : [],
                inverseObjects : null,
                forest         : [],
                atoms          : sortedAtoms,
                types          : types,
                rootIdx        : -1
            };
        } else {
            return {
                objects        : objects,
                inverseObjects : inverseObjects,
                forest         : sortedForest,
                atoms          : sortedAtoms,
                types          : types,
                rootIdx        : 0
            };
        }
    }
    function forestify(root){
        var og = objectGraph(root);
        return {
            forest   : og.forest,
            atoms    : og.atoms,
            types    : og.types,
            rootIdx  : og.rootIdx
        };
    }
    function thawForest(forestified) {
        var thawedObjects = [];
        var forest = forestified.forest;
        var atoms = forestified.atoms;
        var i, entry, thawed, keys, j, key, frozVal;
        for (i=0; i<forest.length; i++){
            entry = forest[i];
            thawedObjects[i] = Array.isArray(entry) ? [] : {};
        }
        for (i=0; i<forest.length; i++){
            entry = forest[i];
            thawed = thawedObjects[i];
            keys = Object.keys(entry);
            for (j=0; j<keys.length; j++){
                key = keys[j];
                frozVal = entry[key];
                thawed[key] = (frozVal>=0) ? thawedObjects[frozVal] : atoms[-frozVal];
            }
        }
        return thawedObjects;
    };
    function unforestify(forestified){
        var rootIdx = forestified.rootIdx;
        if (rootIdx >= 0){
            var thawedObjects = thawForest(forestified);
            return thawedObjects[rootIdx];
        } else {
            return forestified.atoms[-rootIdx];
        }
    }
    function stringify(forestified){
        function identity(x){ return x; }
        function str(x) { return '' + x; }
        function tostr(o){ return o.toString(); }
        function native(o){
            var _ = '____';
            return _ + o.constructor.name + _;
        }
        var functions = {
            string : identity,
            number : str,
            Date   : tostr,
            RegExp : tostr,
            Native : native,
            function: function(){ return null; }
        };
        var atoms = forestified.atoms;
        var forest = forestified.forest;
        var rootIdx = forestified.rootIdx;
        var types = forestified.types;
        var _atoms = [];
        for (var t=0; t<types.length; t++){
            var _t_ = types[t];
            var typeName = _t_.name;
            var start = _t_.startIndex;
            var end = t<types.length-1 ? types[t+1].startIndex : atoms.length;
            var func = null;
            if (IS_SINGLETON[typeName]){
            } else {
                if (typeName in functions){ func = functions[typeName]; } else { debugger; throw new Error('case not found'); }
            }
            if (func!==null){
                for (var idx = start; idx < end; idx++){
                    _atoms[idx] = func(atoms[idx]);
                }
            }
        }
        return JSON.stringify({
            atoms  : _atoms,
            forest : forest,
            rootIdx: rootIdx,
            types  : types
        });
    }
    function unstringify(string){
        function identity(x){ return x; }
        function plus(x) { return +x; }
        function return_null(){ return null; }
        function regExpFromString(str){
            if ((typeof str)!=='string') return null;
            if (str.length<2) return null;
            if (str.charAt(0)!=='/') return null;
            var lastSlash = str.lastIndexOf('/');
            if (lastSlash<=0) return null;
            var theMeat = str.slice(1,lastSlash), flags = str.slice(1+lastSlash);
            return new RegExp(theMeat, flags);
        }
        var sing = {
            singleton_null      : function(){ return null; }
            ,singleton_undefined : function(){ return undefined; }
            ,singleton_true      : function(){ return true; }
            ,singleton_false     : function(){ return false; }
        };
        var notSing = {
            string  : identity,
            number  : plus,
            Date    : function(dateStr){ return new Date(dateStr); },
            RegExp  : regExpFromString,
            Native  : return_null,
            function: return_null
        };
        var parsed = JSON.parse(string);
        var _atoms = parsed.atoms;
        var forest = parsed.forest;
        var rootIdx = parsed.rootIdx;
        var types = parsed.types;
        var atoms = [];
        for (var t=0; t<types.length; t++){
            var _t_ = types[t];
            var typeName = _t_.name;
            var start = _t_.startIndex;
            var end = t<types.length-1 ? types[t+1].startIndex : _atoms.length;
            var func = null;
            if (IS_SINGLETON[typeName]){
                if (typeName in sing){ func = sing[typeName]; } else { debugger; throw new Error('case not found'); }
            } else {
                if (typeName in notSing){ func = notSing[typeName]; } else { debugger; throw new Error('case not found'); }
            }
            if (func!==null){
                for (var idx = start; idx < end; idx++){
                    atoms[idx] = func(_atoms[idx]);
                }
            }
        }
        if (types.filter(function(typeDescription){ return typeDescription.name==='function'}).length>=0){
            console.warn('please note: stringify/unstringify destroys functions');
        }
        return {
            atoms  : atoms,
            forest : forest,
            rootIdx: rootIdx,
            types  : types
        };
    }
    function serialize(object){
        return stringify(forestify(object));
    }
    function unserialize(string){
        return unforestify(unstringify(string));
    }
    function clone(object){
        return unforestify(forestify(object));
    }
    function CLONE(object){
        return unserialize(serialize(object));
    }
    function deepEqual_recursive(firstItem, secondItem){ // easier to read version which, unfortunately, will generate stack overflow if used on extremely large objects - UNUSED
        function equal(item1, item2, cb){
            var type1 = typeof item1;
            var type2 = typeof item2;
            if (type1!==type2) return false;
            if ((type1==='number')&&isNaN(item1)&&isNaN(item2)) return true;
            if (type1!=='object') return (item1===item2);
            if (item1===null) return (item2===null);
            if (item2===null) return (item1===null);
            return cb(item1, item2);
        }
        function obj_equal(obj1, obj2){
            var seen1 = new WeakMap();
            var seen2 = new WeakMap();
            var objectIndex = 0;
            function calcOwnKeys(node1, node2){
                var allKeys = {}, key;
                if (Object.getPrototypeOf(node1)!==Object.getPrototypeOf(node2)) return null;
                if ((node1 instanceof Date)&&(node2 instanceof Date)){ if (node1.toString()!==node2.toString()) return null; }
                if ((node1 instanceof RegExp)&&(node2 instanceof RegExp)){ if (node1.toString()!==node2.toString()) return null; }
                seen1.set(node1, objectIndex); seen2.set(node2, objectIndex);
                ++objectIndex;
                for (key in node1){ if (!(key in node2)) return null; allKeys[key] = null; }
                for (key in node2){ if (!(key in node1)) return null; allKeys[key] = null; }
                var ownKeys = [];
                for (var key in allKeys){
                    var own1 = node1.hasOwnProperty(key), own2 = node2.hasOwnProperty(key);
                    if (own1!==own2) return null;
                    if (!own1) continue;
                    ownKeys.push(key);
                }
                return ownKeys;
            }
            function eq(node1, node2){
                var ownKeys = calcOwnKeys(node1, node2);
                function compareCB(value1, value2){
                    var dejavu1 = seen1.has(value1);
                    var dejavu2 = seen2.has(value2);
                    if (dejavu1!==dejavu2) return false;
                    if (dejavu1) return seen1.get(value1)===seen2.get(value2);
                    return eq(value1, value2);
                }
                if (ownKeys===null) return false;
                for (var i=0; i<ownKeys.length; i++){
                    var key = ownKeys[i];
                    if (!equal(node1[key], node2[key], compareCB)) return false;
                }
                return true;
            }
            return eq(obj1, obj2);
        }
        return equal(firstItem, secondItem, obj_equal);
    }
    function deepEqual(firstItem, secondItem){
        function topOf(arr){
            if (!Array.isArray(arr)){ debugger; throw new Error('array expected'); }
            if (arr.length===0){ debugger; throw new Error('empty array encountered'); }
            return arr[arr.length-1];
        }
        function equal(item1, item2){
            var type1 = typeof item1;
            var type2 = typeof item2;
            if (type1!==type2) return false;
            if ((type1==='number')&&isNaN(item1)&&isNaN(item2)) return true;
            if (type1!=='object') return (item1===item2);
            if (item1===null) return (item2===null);
            if (item2===null) return (item1===null);
            return 'maybe';
        }
        function obj_equal(root1, root2){
            var seen1 = new WeakMap(), seen2 = new WeakMap(), objectIndex = 0;
            var stack1 = [root1], stack2 = [root2];
            var objKeysStack = [], objKeysIdxStack = [];
            var tos1, tos2, ownKeys, objKeys, i, key, kid1, kid2, b, oIdx, new_1, new_2;
            function calcOwnKeys(node1, node2){
                var allKeys = {}, key;
                if (Object.getPrototypeOf(node1)!==Object.getPrototypeOf(node2)) return null;
                if ((node1 instanceof Date)&&(node2 instanceof Date)){ if (node1.toString()!==node2.toString()) return null; }
                if ((node1 instanceof RegExp)&&(node2 instanceof RegExp)){ if (node1.toString()!==node2.toString()) return null; }
                seen1.set(node1, objectIndex); seen2.set(node2, objectIndex);
                ++objectIndex;
                for (key in node1){ if (!(key in node2)) return null; allKeys[key] = null; }
                for (key in node2){ if (!(key in node1)) return null; allKeys[key] = null; }
                var ownKeys = [];
                for (var key in allKeys){
                    var own1 = node1.hasOwnProperty(key), own2 = node2.hasOwnProperty(key);
                    if (own1!==own2) return null;
                    if (!own1) continue;
                    ownKeys.push(key);
                }
                return ownKeys;
            }
            function compare(){
                while (true){
                    while (true){
                        tos1 = topOf(stack1); tos2 = topOf(stack2);
                        ownKeys = calcOwnKeys(tos1, tos2);
                        if (ownKeys===null) return false;
                        objKeys = [];
                        for (i=0; i<ownKeys.length; i++){
                            key = ownKeys[i];
                            kid1 = tos1[key]; kid2 = tos2[key];
                            b = equal(kid1, kid2);
                            if ((typeof b)==='boolean'){ if (!b) return false; } else { objKeys.push(key); }
                        }
                        new_1 = null; new_2 = null; oIdx = -1;
                        while (new_1 === null){
                            ++oIdx;
                            if (oIdx>=objKeys.length) break;
                            key = objKeys[oIdx];
                            var o_1 = tos1[key], o_2 = tos2[key],
                                dejavu1 = seen1.has(o_1), dejavu2 = seen2.has(o_2);
                            if (dejavu1!==dejavu2) return false;
                            if (dejavu1){
                                if (seen1.get(o_1)!==seen2.get(o_2)) return false;
                            } else {
                                new_1 = o_1; new_2 = o_2;
                            }
                        }
                        objKeysStack.push(objKeys); objKeysIdxStack.push(oIdx);
                        if (new_1===null){
                            break;
                        } else {
                            stack1.push(new_1); stack2.push(new_2);
                        }
                    }
                    try {
                        while (true){
                            if (stack1.length===0) return true;
                            tos1 = stack1.pop(); tos2 = stack2.pop();
                            objKeys = objKeysStack.pop(); oIdx = objKeysIdxStack.pop();
                            if ((function tosHasNew(){
                                while (oIdx<objKeys.length){
                                    new_1 = tos1[objKeys[oIdx]]; new_2 = tos2[objKeys[oIdx]];
                                    var vue1 = seen1.has(new_1), vue2 = seen2.has(new_2);
                                    if (vue1!==vue2) throw new Error('Rumpelstilzchen');
                                    if (!vue1) return true;
                                    ++oIdx;
                                }
                                return false;
                            })()) break;
                        }
                    } catch(e){
                        if (e.message==='Rumpelstilzchen') return false;
                        throw(e);
                    }
                    stack1.push(tos1); stack2.push(tos2);
                    objKeysStack.push(objKeys); objKeysIdxStack.push(oIdx);
                    stack1.push(new_1); stack2.push(new_2);
                }
            }
            return compare();
        }
        var ans = equal(firstItem, secondItem);
        if ((typeof ans)==='boolean') return ans;
        return obj_equal(firstItem, secondItem);
    }
    JSON.Siberia = {
        objectGraph : objectGraph,
        forestify   : forestify,
        thawForest  : thawForest,
        unforestify : unforestify,
        stringify   : stringify,
        unstringify : unstringify,
        serialize   : serialize,
        unserialize : unserialize,
        clone       : clone,
        CLONE       : CLONE,
        deepEqual   : deepEqual
    };
})();
