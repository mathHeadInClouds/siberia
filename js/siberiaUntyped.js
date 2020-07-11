(function(){
    function forestify(root){
        var objects = [], inverseObjects = new WeakMap(), forest = [];
        var atomics = {}, atomicCounter = 0;
        function discover(obj){
            var currentIdx = objects.length;
            inverseObjects.set(obj, currentIdx);
            objects.push(obj);
            forest[currentIdx] = Array.isArray(obj) ? [] : {};
            var keys = Object.keys(obj);
            for (var i=0; i<keys.length; i++){
                var key = keys[i], val = obj[key], type = typeof val;
                if ((type==='object')&&(val!==null)){
                    if (inverseObjects.has(val)){
                        forest[currentIdx][key] = inverseObjects.get(val);
                    } else {
                        forest[currentIdx][key] = discover(val);
                    }
                } else {
                    if (!(val in atomics)){
                        ++atomicCounter;
                        atomics[val] = atomicCounter;
                    }
                    forest[currentIdx][key] = -atomics[val];
                }
            }
            return currentIdx;
        }
        discover(root);
        var atomsTable = [];
        Object.keys(atomics).forEach(function(k){
            atomsTable[atomics[k]] = k;
        });
        return {
            objectsTable: forest,
            atomsTable  : atomsTable
        };
    }
    function thawForest(forestified) {
        var thawedObjects = [];
        var objectsTable = forestified.objectsTable;
        var atomsTable = forestified.atomsTable;
        var i, entry, thawed, keys, j, key, frozVal;
        for (i=0; i<objectsTable.length; i++){
            entry = objectsTable[i];
            thawedObjects[i] = Array.isArray(entry) ? [] : {};
        }
        for (i=0; i<objectsTable.length; i++){
            entry = objectsTable[i];
            thawed = thawedObjects[i];
            keys = Object.keys(entry);
            for (j=0; j<keys.length; j++){
                key = keys[j];
                frozVal = entry[key];
                thawed[key] = (frozVal>=0) ? thawedObjects[frozVal] : atomsTable[-frozVal];
            }
        }
        return thawedObjects;
    };
    function unforestify(forestified){
        return thawForest(forestified)[0];
    }
    function stringify(forestified){
        return JSON.stringify(forestified);
    }
    function unstringify(string){
        var parsed         = JSON.parse(string);
        return parsed;
    }
    function serialize(object){
        return stringify(forestify(object));
    }
    function unserialize(string){
        return unforestify(unstringify(string));
    }
    function clone(object){
        return unforestify(forestify({content: object})).content;
    }
    JSON.SiberiaSimple = {
        forestify   : forestify,
        thawForest  : thawForest,
        unforestify : unforestify,
        stringify   : stringify,
        unstringify : unstringify,
        serialize   : serialize,
        unserialize : unserialize,
        clone       : clone
    };
})();
