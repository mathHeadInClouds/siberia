# siberia
Let's create a cyclical data structure. 2 people, each of which having arrays of fruits they eat,
and 3 fruits, each of which having arrays of people who eat them.

![JoeJaneAppleOrangePear](https://mathheadinclouds.github.io/img/applesOranges.png)

Due to the cycles, you cannot use JSON.stringify to serialize the data

![JSONstringifyERROR](https://mathheadinclouds.github.io/img/JSONstringifyERROR.png)

this package will inject an object JSON.Siberia into your browser's JSON object, so that you can then
serialize cyclic objects in a 2-step process. A "forestify" step which turns the object into a
"version of itself" which has all the objects information, but encoded differently, namely, without cycles.
And the second step being plain old JSON.stringify, turning the intermediate object into a string.

JSON.Siberia.forestify(myData)

![forestify](https://mathheadinclouds.github.io/img/forestify2.png)

Starting with the object you wish to serialize as the root, recursively looping through the key-value pairs
of the object, you will encouter more objects; namely, some of the values of those key-value pairs, and then,
recursively going on in the same way. All of those objects will go into an array called `forest`. the "trees"
(entries of the forest array) "are" (nay, "have the same information as") those encountered objects, and the
tree at index zero "is" (nay, encodes) the root. The trees will have the same keys as the original objects,
but the values are changed. A value, if originally an object, is replaced by the non-negative integer which is
the array index of the tree which encodes that object. And those values which are originally not objects become
negative integers. Those, in turn, if you drop the minus sign again, are then indices into the `flatValues` array
which is a sibling of `forest` in the result object `.forestify` has returned. `flatValues` will cluster together
by type (string, number, etc.) details below.

In the example, the root (our object `myData`) is encoded by the tree `forest[0]` which has the same keys as `myData`
(namely, "people" and "fruits"), with respective values 1 and 12, meaning that `forest[1]` and `forest[12]`,
respectively encode `myData.people` and `myData.fruits`. Now, `forest[1]` is an array with entries 2 and 6, which
means that `forest[2]` "is" Joe and `forest[6]` "is" Jane. `forest[2]` has name `-1`, and, dropping the minus
sign, `flatValues[1]` is indeed "Joe", the name property of `Joe` (or `myData.people[0]`). Next, Joe's tree says
he likes 3, that is 4 and 10, so trees 4 and 10 "are" the apple and the orange. And so on.

`typeRegular` is used to identify the "sections" of `flatValues`. From the start index of a section (inclusive) til
the start index of the next section (exclusive), all entries of `flatValues` have the same type, i.e., all strings,
all numbers, etc. Here, some special objects with JavaScript built-in constructors (such as Date) are treated
as "primitives" (like string, number, etc). Finally, `typeSingletons` deals with special values (such as null,
undefined, NaN), making sure that after serializing and then deserializing we have exactly what we started with.
(Unlikely JSON, which, unfathomably, turns NaN into null). In later versions, you'll be able to specify more (custom)
"primitives" in some optional argument.

Other methods of `JSON.Siberia`: 

![siberian_methods](https://mathheadinclouds.github.io/img/siberian_methods.png)

`.stringify` is just `JSON.stringify`, the second step of the serialization process (see above), and both steps together
are what `.serialize` does. The respective inverses of `.forestify`, `.stringify`, and `.serialize` are
`.unforestify`, `.unstringify`, and `.unserialize`.

                                                 `.serialize`
                   -------------------------------------------------------------------->
                      `.forestify`                                   `.stringify`
object with cycles --------------------> object without cycles ------------------------> string
                   <--------------------                       <------------------------
                       `.unforestify`                                `.unstrigify`       
                   <--------------------------------------------------------------------
                                              `.unserialize`

The tiny difference between `.unstringify` and `JSON.parse` has to do rather technical typing issues
(turning Date strings into Dates, things like that)

`.thawForest` gives the array of the "encountered" objects (see above, the zeroth of which is the root) - you need
that e.g. when you want to visualize a cyclic data structure and don't repeat yourself in the serialization.

`.clone` is basically `unforestify(forestify)` and definitely a better clone than `JSON.parse(JSON.stringify)`.

The rest of the methods are used when visualizing a cyclic data structure and will be commented more in a later version.
Essentially, you want to "root switch" on an existing forest instead of computing `.forestify` again when you 
navigate the cyclic object tree in your visualization, and that "root switch" is what the remaining methods deal with.