function DiffObjects(obj_old, obj_new) {
    var added = {};
    var removed = {};
    var updated = {};
    for (var p in obj_new) {
        if (obj_old[p] === undefined) {
            added[p] = obj_new[p]
        } else {
            // Brittle, be on the lookout for bugs
            if (JSON.stringify(obj_old[p]) !== JSON.stringify(obj_new[p])) {
                updated[p] = obj_new[p]
            }
        }
    }
    for (var p in obj_old) {
        if (obj_new[p] === undefined) {
            removed[p] = obj_old[p]
        }
    }
    return {
        "added": added,
        "removed": removed,
        "updated": updated
    }
};

function UnionObjects(primary, secondary) {
    // If key exists on both primary and secondary,
    // then the value in primary has precedence
    var combined = JSON.parse(JSON.stringify(secondary));
    for (var p in primary) {
        combined[p] = primary[p];
    }
    return combined;
};

function Capitalize(s) {
    s = s || "";
    if (s.length === 0) { return ""; }
    var c = s.split(" ");
    c.forEach(function(s, i) { c[i] = s[0].toUpperCase() + s.slice(1); });
    return c.join(" ");
};

function ParsePlayerName(name) {
    name = name || "";
    name = name.split(".");
    var color = Capitalize(name[0].split("-").join(" "));
    var noun = Capitalize(name[1]);
    return color + " " + noun;
};
