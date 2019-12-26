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

![forestify](https://mathheadinclouds.github.io/img/forestify.png)