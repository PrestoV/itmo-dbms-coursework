const neo4j = require('neo4j-driver').v1;

const SERVER_URI = 'bolt://35.237.53.82:7687';
const SERVER_USER = 'neo4j';
const SERVER_PASSWORD = 'Ues-3rh-XH7-79P';

const driver = neo4j.driver(SERVER_URI, neo4j.auth.basic(SERVER_USER, SERVER_PASSWORD));

const recordToShelf = function (record) {
    if (!record) {
        return null
    }
    const props = record.get(0).properties;
    return {
        id: props.id,
        capacity: props.capacity,
        dish_count: props.dish_count
    };
};

const recordToComposition = function (record) {
    if (!record) {
        return null
    }
    const props = record.get(0).properties;
    return {
        id: props.id
    };
};

const recordToShelfDish = function (record) {
    if (!record) {
        return null
    }
    const props = record.get(0).properties;
    return {
        id: props.id,
        dish: props.dish,
        shelf_life: new Date(props.shelf_life)
    };
};

export default {
    driver,
    recordToComposition,
    recordToShelf,
    recordToShelfDish
};