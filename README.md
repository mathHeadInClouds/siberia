# siberia package

serializing cyclical data structures in JavaScript.

### algorithm

Our example's cyclical data structure centers around 2 people and 3 fruits, each having an icon.

![JoeJaneAppleOrangePear_ICONS](https://mathheadinclouds.github.io/img/JJAOP.png)

Joe Brit likes apples and oranges, while Jane Kraut likes apples and pears.

![JoeLikes_JaneLikes_IMG](https://mathheadinclouds.github.io/img/JoeLikes_JaneLikes.png)

You can see here on the right hand side in which way we are visualizing arrays. In order to make the data structure cyclic, in addition to the people having `.likes`, the fruits have `.likedBy`. For example,

![AppleEaters_IMG](https://mathheadinclouds.github.io/img/AppleEaters.png)

<!------ https://mathheadinclouds.github.io/img/applesOranges.png) -->

Here is the JavaScript code generating our data structure

```javascript
var Joe = { name: 'Joe' };
var Jane = { name: 'Jane' };
var Apple = { name: 'Apple' };
var Orange = { name: 'Orange' };
var Pear = { name: 'Pear' };
function addlike(person, fruit){
    person.likes = person.likes || [];
    fruit.likedBy = fruit.likedBy || [];
    person.likes.push(fruit);
    fruit.likedBy.push(person);
}
addlike(Joe, Apple); addlike(Joe, Orange);
addlike(Jane, Apple); addlike(Jane, Pear);
var myData = { people: [Joe, Jane], fruits: [Apple, Orange, Pear] };
```

This gives us the following object graph (the root object, *myData*, is the tree with the crown, center left)

![ObjectGraph_IMG](https://mathheadinclouds.github.io/img/ObjectGraph.png)

To serialize, we have to find a way of encoding the information contained in our object graph in a non-cyclical fashion.

When we determine the object graph by applying the a recusive `discover` function to the root object (`discover` is essentially depth first search with an added stop condition for already seen objects), we can easily "count" the nodes (objects) of the object graph, i.e., label them with consecutive integers, starting at zero (zero always being the label for the root). We'll then also "count" the encountered non-objects (or "atoms"); they'll get the negative integers as labels. In our example, all atoms are strings. [A more general example would contain other atom types - such as numbers and "quasi-atomic objects", e.g. regular expressions or date objects (JavaScript builtin objects having a standard way of stringifying them)]. For example, the pear gets number 8 simply because it's the 8th object discovered by our search algorithm. Here is the object graph again with those integer labels added.

![ObjectGraphWithLabels_IMG](https://mathheadinclouds.github.io/img/ObjectGraphWithLabels.png)

With the integer labels, serializing is easy. The "frozen version" of each object is an object with the same keys, but each of the values replaced by some integer. Each of these integers is an index into some table; either the objects table, or, in case the of a negative number, the atoms table.

Here is the objects table of our example.

![the13objects_IMG](https://mathheadinclouds.github.io/img/the13objects.png)

And the atoms table

![the5atoms_IMG](https://mathheadinclouds.github.io/img/the5atoms.png)

For example, the frozen version of the pear object (which has `.name = "Pear"` and `.likedBy` = *array containing Jane*) is the object `{name: -4, likedBy: 9}`, because the atoms table has string "Pear" in slot 4, and the objects table has an array containing Jane in slot 9.

A slightly simplified version of the serialization algorithm (namely, one which does everything except deal with typing the atoms; especially, it will work for our example data structure) has only 32 lines of code, here it is:

```javascript
function forestify_aka_decycle(root){
	var objects = [], inverseObjects = new WeakMap(), forest = [];
	var atomics = {}, atomicCounter = 0;
	function discover(obj){
	    var currentIdx = objects.length;
	    inverseObjects.set(obj, currentIdx);
	    objects.push(obj);
	    forest[currentIdx] = Array.isArray(obj) ? [] : {};
	    Object.keys(obj).forEach(function(key){
	        var val = obj[key], type = typeof val;
	        if ((type==='object')&&(val!==null)){
	            if (inverseObjects.has(val)){ // known object already has index
	                forest[currentIdx][key] = inverseObjects.get(val);
	            } else {                      // unknown object, must recurse
	                forest[currentIdx][key] = discover(val);
	            }
	        } else {
	            if (!(val in atomics)){
	                ++atomicCounter;                 // atoms table new entry
	                atomics[val] = atomicCounter;
	            }
	            forest[currentIdx][key] = -atomics[val];      // rhs negative
	        }
	    });
	    return currentIdx;
	}
	discover(root);
	return {
		objectsTable: forest,
		atomsTable  : [null].concat(Object.keys(atomics))
	};
}
```

The objects table, being an array which in each slot contains a simple key-value pair list (with is a depth 1 tree), is called the forest, thus the name.
And since the trees of the forest are frozen, "siberia" was chosen as the name of the algorithm.

The reverse process (`unforestify` aka retrocycle) in even more straightforward: First, for each tree in the forest, generate either an empty array, or an empty plain object. Then, in a double loop over trees of the forest, and keys of the tree, do an obvious assignment, the right hand side of which is a "thawed" tree in the thawed forest we're just constructing, or a atom fetched from the atmoics table.


```javascript
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
    function unforestify(forestified){ return thawForest(forestified)[0]; }
```

Above simplified versions of `forestify` and `unforestify` you can find in file siberiaUntyped.js (below 100 lines of code), which is not used, but provided for easier learning. Main differences between the simplified version and the real version are, first, atom typing, and second, the real version has non-recursive version of forsetify (little hard to read, admittedly), in order to prevent a stack overflow error you otherwise would get when you're dealing with extremely large objects (such as linked list with 100,000 nodes.)

### Douglas Crockford

**Why siberia is faster than Douglas Crockford's decycle.js (2018 version), by an unbounded factor**: First, a similarity. Above `discover` function is similar to the function `derez`, which occurs inside of `.decycle`. Just as `discover`, `derez` is essentially depth first search with an additional stop condition if a previously encountered object is encountered once again, and in both cases, ES6 feature `WeakMap` is used to generate a lookup table of known objects. In both cases, the domain of the `WeakMap` consists of the nodes of the object graph (i.e., objects discovered so far.) But those objects are mapped to different things in `discover` vs `derez`. In `discover`, it's the object index, and in `derez` it's the path from the root to the object. That path is JavaScript code, which is later fed to `eval`, when we deserialize again.

For example, we already saw that our pear object is mapped (by `discover`) to the number 8, because it's the 8th object being discovered. Let's look at above depiction of the object graph, and trace the path from root to pear, i.e. 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8. We encounter objects root -> AllPeople -> Joe -> JoesFruits -> Apple -> AppleEaters -> Jane -> JanesFruits -> Pear. The keys (edge labels) we see between those objects are "people", 0, "likes", 0, "likedBy", 1, "likes", 1.

![fromRootToPear_IMG](https://mathheadinclouds.github.io/img/root2pear.png)

Now, in the Douglas Crockford version, we can do

```javascript
dougsFridge = JSON.decycle(myData)
dougsFridge.fruits[2].$ref
```

The result will be following string:

```javascript
$["people"][0]["likes"][0]["likedBy"][1]["likes"][1]
```

It is not surprising at all that of the many possible paths from root to pear, siberia and Douglas Crockfords algorithm found the same route. After all, both are depth first search with "seen already" stop condition added, garnished with storing some stuff.

The difference: Storing the the path takes up space which is linear in the number of nodes involved, which is unbounded, and in the other direction, from path to thawed object, that then has runtime which is linear in the number of nodes involved. On the other hand, in *siberia*, storing the information of the path takes constant space (just one integer is stored), and going back from that integer to the thawed object is just an array lookup, which takes constant time.

On top of that, `eval` and regular expressions are used, which can be slow (especially the latter), further degrading runtime performance. (This being by far not as bad as the other problem.)

### implementation

rest of the readme refers to slightly outdated version (work in currect progress (July 2020))

For our example data structure,

```javascript
JSON.Siberia.forestify(myData)
```

gives

![JsonSiberiaForestifyMyData_IMG](https://mathheadinclouds.github.io/img/forestifyMyData.png)

`.forest` is the objects table, and `.atoms` is the atomics table (as described in the algorithm section). `.types` in better explained when we're dealing with atoms of more than one type. Let's look at an example.

```javascript
var millisecondsPerDay = 24*60*60*1000;
var y2k = new Date((23*365+7*366)*millisecondsPerDay);
var yesterday = new Date(new Date()-millisecondsPerDay);
var tomorrow = new Date((new Date()-0)+millisecondsPerDay);
var obj = {
    re : /d+/g,
    t: [yesterday, tomorrow],
    y2ks : [y2k, y2k, new Date(y2k)],
    n: {almostEvil : 665.9, computahEsplode : Math.sqrt(-1), emperorsGarments : null}
}
forestified = JSON.Siberia.forestify(obj);
```

![forestifiedAtomicPlethora_IMG](https://mathheadinclouds.github.io/img/forestifiedWithTypes.png)

It should be obvious how `types` works. For example `atoms[4],atoms[5],atoms[6],atoms[7]` are all Dates, because `types[2]` says that Dates start (inclusive) at index 4, and `types[3]` says that they end (exclusive) at index 8.

Thanks to the type information, with siberia, first serializing and then deserializing are much closer to emulating "true cloning" than doing the same with plain JSON. (siberia isn't perfect either; functions with variables depending on closures won't work properly, to give one example).

```javascript
forestified = JSON.Siberia.forestify(obj);
stringified = JSON.Siberia.stringify(forestified);
unstr = JSON.Siberia.unstringify(stringified);
siberianClone = JSON.Siberia.unforestify(unstr);
[siberianClone.re, siberianClone.n.computahEsplode, siberianClone.n.emperorsGarments, siberianClone.y2ks[0].getFullYear()]
// result : [/d+/g, NaN, null, 2000]
```

`JSON.Siberia.stringify` is almost the same as `JSON.stringify`, and `JSON.Siberia.unstringify` is almost the same as JSON.parse. The difference is `JSON.Siberia.stringify` expects the argument object to be (like) a result of calling `JSON.Siberia.forestify`, and will use the type information appropriately. For example, for a `RegExp` object, the `.toString` method is called to properly turn the object into a string. Similarly, `JSON.Siberia.unstringify` expects the argument string to have the appropriate format and, again, uses the type information appropriately; for example, for a stringified `RegExp` object, `eval` is called on the string, so the string is turned into a `RegExp` again. 

![arrows_IMG](https://mathheadinclouds.github.io/img/arrows.png)

`forestify` and `unforestify` are the equivalents of what in Douglas Crockfords version is called `decycle` and `retrocycle` - meaning, turning an arbitrary object into another object which doesn't have any cycles, and reversing this process, respectively. Those are the first step in freezing, and the second step in thawing, respectively. The second step in freezing and the first step in thawing (dealing with strings) were discussed in the preceding paragraph. Doing the two steps at once is called `.serialize` and `.unserialize`, as the black diagram shows. Furthermore, Doing the round trip (`.forestify`, then `.unforestify`) is called `.clone`.

```javascript
inferiorClone = JSON.parse(JSON.stringify(obj))
[inferiorClone.re, inferiorClone.computahEsplode, inferiorClone.emperorsGarments, typeof inferiorClone.now]
// result: [{}, null, null, "string"]
```

Note that the serialization result is "self contained", and thus suitable for communication from JavaScript to non-JavaScript. A, say, Python programmer does not have to read some JavaScript spec to interpret a siberian serialization result - it is human readable *without* a spec, that is important. It would be a bad idea to move some information from the serialized string "to the spec" (such as NaN is 5), in order to save a couple of bytes. The string should have an obvious interpretation. So it does, I'd say - If you see how it can be even more obvious, tell me.

### options

```javascript
JSON.Siberia.getOptions().nullify
// result: {functions: false, symbols: false, RegExp: false}
```

nullify is the only thing that has options in this version. Here, you can decide if functions, Symbols, and regular expressions should be turned into nulls (as functions and Symbols are by `JSON.stringify`), or if they should be stringified.

You change options like this: 

```javascript
JSON.Siberia.setOptions.nullify.functions.true()   // function serialized to string
JSON.Siberia.setOptions.nullify.functions.false()  // function serialized to null
```

### todo - soon

There is some support (work in progress) for the usage in visualizing cyclical data structures. Calling `.forestify` multiple times for several objects which are "connected" (hence have the same object graph, only with a different root) is not good enough; there must be a forestified data structure which is shared between those various nodes, such that you can do a "root switch". The readme will describe this part in more detail once the code is more stable.  Use `.analyzeObjectGraph` at your own risk (maybe better not quite yet). To be on the safe side, just use the 6 methods in the above black box, plus the `.clone` method.

manually adding custom "quasi atomic objects"

tutorial "movie" or slides, walking through the steps of the algorithm, with our example data structure.

### todo - maybe later, maybe never

serializing functions depending on variables in closures

supporting constructors other than Array, plain object.

DOM objects??

language-specific objects in non-JavaScript languages. Consistent system to construct an "obvious human readable" standard. If that can't be done, don't do DOM objects.

<!---
### links
* [tutarial](https://mathheadinclouds.github.io/testsiberia/) - speed tests, tutorial movie, html version of readme
-->
