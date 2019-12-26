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
sign, `flatValues[1]` is indeed "Joe", the name property of `Joe` (or `myData.people[0]`). Next Joe trees says
he likes 3, that is 4 and 10, so trees 4 and 10 "are" the apple and the orange. And so on.