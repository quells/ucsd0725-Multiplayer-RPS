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
