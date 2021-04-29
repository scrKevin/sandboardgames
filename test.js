var obj = {
    "a": {"b": 1},
    "b": {"c": 2}
}

console.log("in")
for (o in obj){
    console.log(o)

    console.log(obj[o])
}

console.log("of entries")
for (const [key, value] of Object.entries(obj)) {
    console.log(value);
}

console.log("of values")
for (let value of Object.values(obj))
{
    console.log(value);
}

// fastest
let keys = Object.keys(obj);
for (let i = 0; i < keys.length; i++) {
    let value = obj[keys[i]];
}

var array = ["id1", "id2"]

for (a of array)
{
    console.log(a);
}