/*
The idea with these is that updating state trees manually is challenging, especially with larger
OObject's and OArrays of arbitrary size. In simple cases it's more straight forward to manually
update/replace the state tree contents, however with large more complex state trees this automates
away the hassle of having to think about it and just update the entire thing if needed.
*/
import h from "./h.jsx";
import { OArray, OObject } from "destam-dom";

const convertToObservables = (value) => {
    if (Array.isArray(value)) {
        return OArray(value.map(convertToObservables));
    } else if (typeof value === 'object' && value !== null) {
        return OObject(Object.keys(value).reduce((acc, key) => {
            acc[key] = convertToObservables(value[key]);
            return acc;
        }, {}));
    }
    return value;
};

/*
Append upates to the existing state tree.

Example:
const stateTree = OObject({
    users: OArray[
        OObject{
            name: "Bob"
            email: "bob@example.com"
        }
    ]
    files: OArray([
        OObject({
            name: "file 1"
        })
    ])
})

const stateTreeUpdates = {
    users: OArray[
        OObject{
            name: "Sue",
            email: "sue@example.com"
        }
    ],
    files: OAArray([
        OObject({
            name: "file 2"
        })
    ])
}

updateStateTree(stateTree, stateTreeUpdates)

console.log(stateTree)
// Result:
const stateTree = OObject({
    users: OArray[
        OObject{
            name: "Bob"
            email: "bob@example.com"
        },
        OObject{
            name: "Sue",
            email: "sue@example.com"
        }
    ]
    files: OArray([
        OObject({
            name: "file 1"
        }),
        OObject({
            name: "file 2"
        })
    ])
})
*/
const updateStateTree = (existing, updates) => {
    const isObservable = (value) => {
        return value && value.observer !== undefined;
    };

    for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
            let newValue = updates[key];
            const existingValue = existing[key];

            if (!isObservable(newValue) && typeof newValue === 'object' && newValue !== null) {
                newValue = convertToObservables(newValue);
            }

            if (isObservable(existingValue)) {
                if (Array.isArray(existingValue)) {
                    if (!Array.isArray(newValue)) {
                        throw new Error("Expected newValue to be an array.");
                    }
                    existingValue.push(...newValue);
                } else if (typeof newValue === 'object' && newValue !== null) {
                    updateStateTree(existingValue, newValue);
                } else {
                    existingValue.set(newValue);
                }
            } else {
                existing[key] = newValue;
            }
        }
    }
};

/*
Completely replaces the contents of the existing state tree with new updates.

This function is useful when updates are not merely incremental and an entirely
new state is required while maintaining the observer. This might be necessary in
scenarios where the state tree has undergone significant changes that are easier
to redefine from scratch rather than modify incrementally.

Example usage:
const stateTree = OObject({
    users: OArray([
        OObject({
            name: "Bob",
            email: "bob@example.com"
        })
    ]),
    files: OArray([
        OObject({
            name: "file 1"
        })
    ])
});

const newState = {
    users: OArray([
        OObject({
            name: "Alice",
            email: "alice@example.com"
        })
    ]),
    files: OArray([
        OObject({
            name: "file 3"
        })
    ])
};

replaceStateTree(stateTree, newState);

console.log(stateTree)
// Result:
const stateTree = OObject({
    users: OArray([
        OObject({
            name: "Alice",
            email: "alice@example.com"
        })
    ]),
    files: OArray([
        OObject({
            name: "file 3"
        })
    ])
});
*/
const replaceStateTree = (existing, updates) => {
    const isObservable = (value) => {
        return value && value.observer !== undefined;
    };

    const keysToDelete = Object.keys(existing).filter(key => !updates.hasOwnProperty(key));
    keysToDelete.forEach(key => {
        delete existing[key];
    });

    for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
            let newValue = updates[key];
            let existingValue = existing[key];

            if (!isObservable(newValue) && typeof newValue === 'object' && newValue !== null) {
                newValue = convertToObservables(newValue);
            }

            if (isObservable(existingValue)) {
                if (Array.isArray(existingValue) && Array.isArray(newValue)) {
                    existingValue.splice(0, existingValue.length);
                    existingValue.push(...newValue);
                } else if (typeof existingValue === 'object' && existingValue !== null && typeof newValue === 'object' && newValue !== null) {
                    replaceStateTree(existingValue, newValue);
                } else {
                    existingValue.set(newValue);
                }
            } else {
                existing[key] = newValue;
            }
        }
    }
};

export { updateStateTree, replaceStateTree };
