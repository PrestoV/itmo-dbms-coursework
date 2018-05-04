import neo4j from './neo4j-connector'
import mongodb from './mongodb-connector'

const resolvers = {
    Query: {
        cashier(root, {id}) {
            return mongodb.cashiers.findById(id);
        },
        cashiers() {
            return mongodb.cashiers.find();
        },
        cashbox(root, {id}) {
            return mongodb.cashboxes.findById(id);
        },
        cashboxes() {
            return mongodb.cashboxes.find();
        },
        shift(root, {id}) {
            return mongodb.shifts.findById(id);
        },
        shifts() {
            return mongodb.shifts.find();
        },
        dish(root, {id}) {
            return mongodb.dishes.findById(id);
        },
        dishes() {
            return mongodb.dishes.find();
        },
        order(root, {id}) {
            return mongodb.orders.findById(id);
        },
        orders() {
            return mongodb.orders.find();
        },
        composition(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {id}}) RETURN c',
                {id: id}
            ).then(result => {
                return neo4j.recordToComposition(result.records[0]);
            }).catch(error => {
                console.log("Composition fetch error: " + error);
            })
        },
        row(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (r: Row {id: {id}}) RETURN r',
                {id: id}
            ).then(result => {
                return neo4j.recordToRow(result.records[0]);
            }).catch(error => {
                console.log("Row fetch error: " + error);
            })
        },
        shelfDish(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (d: ShelfDish {id: {id}}) RETURN d',
                {id: id}
            ).then(result => {
                return result.records.map(neo4j.recordToShelfDish)
            }).catch(error => {
                console.log("Shelf dish fetch error: " + error);
            })
        },
        allCompositions() {
            return neo4j.driver.session().run(
                'MATCH (c: Composition) RETURN c'
            ).then(result => {
                return result.records.map(neo4j.recordToComposition)
            }).catch(error => {
                console.log("AllCompositions fetch error: " + error);
            })
        },
        allRows() {
            return neo4j.driver.session().run(
                'MATCH (r: Row) RETURN r'
            ).then(result => {
                return result.records.map(neo4j.recordToRow)
            }).catch(error => {
                console.log("AllRows fetch error: " + error);
            })
        },
        allShelfDishes() {
            return neo4j.driver.session().run(
                'MATCH (d: ShelfDish) RETURN d'
            ).then(result => {
                return result.records.map(neo4j.recordToShelfDish)
            }).catch(error => {
                console.log("AllShelfDishes fetch error: " + error);
            })
        }
    },
    Mutation: {
        createComposition() {
            return neo4j.driver.session().run(
                'CREATE (c: Composition {id: {compositionId}}) RETURN (c)',
                {compositionId: create_UUID()}
            ).then(result => {
                return neo4j.recordToComposition(result.records[0])
            }).catch(error => {
                console.log("Create composition error: " + error)
            })
        },
        attachRows(root, {composition, rows}) {
            console.log(rows);
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) MATCH (r: Row) WHERE r.id IN {rowIds} MERGE (c)-[:CONTAINS]->(r) RETURN r',
                {compositionId: composition, rowIds: rows}
            ).then(result => {
                return result.records.map(neo4j.recordToRow)
            }).catch(error => {
                console.log("Attach rows error: " + error)
            })
        },
        detachRows(root, {composition, rows}) {
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) MATCH (c)-[relation:CONTAINS]->(r: Row) WHERE r.id IN {rowIds} DELETE relation RETURN r',
                {compositionId: composition, rowIds: rows}
            ).then(result => {
                return result.records.map(neo4j.recordToRow)
            }).catch(error => {
                console.log("Detach rows error: " + error)
            })
        },
        deleteComposition(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) WITH c, c.id as id DETACH DELETE (c) RETURN id',
                {compositionId: id}
            ).then(result => {
                return result.records[0].get(0)
            }).catch(error => {
                console.log("Delete rows error: " + error)
            })
        },
        createRow() {
            return neo4j.driver.session().run(
                'CREATE (r: Row {id: {rowId}}) RETURN (r)',
                {rowId: create_UUID()}
            ).then(result => {
                return neo4j.recordToRow(result.records[0])
            }).catch(error => {
                console.log("Create row error: " + error)
            })
        },
        deleteRow(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (r: Row {id: {rowId}}) WITH r, r.id as id DETACH DELETE (r) RETURN id',
                {rowId: id}
            ).then(result => {
                return result.records[0].get(0)
            }).catch(error => {
                console.log("Delete row error: " + error)
            })
        },
        createShelfDish(root, {input}) {
            return neo4j.driver.session().run(
                'CREATE (d: ShelfDish {id: {shelfDishId}, dish_id: {dishId}, shelf_life: {shelfLife}}) RETURN (d)',
                {shelfDishId: create_UUID(), dishId: input.dish_id, shelfLife: input.shelf_life}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0])
            }).catch(error => {
                console.log("Create shelfDish error: " + error)
            })
        },
        deleteShelfDish(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (d: ShelfDish {id: {shelfDishId}}) WITH d, d.id as id DETACH DELETE (d) RETURN id',
                {shelfDishId: id}
            ).then(result => {
                return result.records[0].get(0)
            }).catch(error => {
                console.log("Delete shelfDish error: " + error)
            })
        }
    },
    Composition: {
        rows(composition) {
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) MATCH (r:Row) WHERE (c)-[:CONTAINS]-(r) RETURN r',
                {compositionId: composition.id}
            ).then(result => {
                return result.records.map(neo4j.recordToRow);
            }).catch(error => {
                console.log("Composition's rows fetch error: " + error);
            })
        }
    },
    Row: {
        shelfDishes(row) {
            return neo4j.driver.session().run(
                'MATCH (r: Row {id: {rowId}}) MATCH (d: ShelfDish) WHERE (r)-[:CONTAINS]->(d) RETURN d',
                {rowId: row.id}
            ).then(result => {
                return result.records.map(neo4j.recordToShelfDish);
            }).catch(error => {
                console.log("Row's dishes fetch error: " + error);
            })
        }
    },
    ShelfDish: {
        next(shelfDish) {
            return neo4j.driver.session().run(
                'MATCH (d1: ShelfDish {id: {dishId}}) MATCH (d1)-[:NEXT]->(d2: ShelfDish) RETURN d2',
                {dishId: shelfDish.id}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0]);
            }).catch(error => {
                console.log("After dish fetch error: " + error);
            })
        },
        previous(shelfDish) {
            return neo4j.driver.session().run(
                'MATCH (d1: ShelfDish {id: {dishId}}) MATCH (d1)-[:PREVIOUS]->(d2: ShelfDish) RETURN d2',
                {dishId: shelfDish.id}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0]);
            }).catch(error => {
                console.log("Before dish fetch error: " + error);
            })
        }
    }
};

function create_UUID(){
    let dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

export default resolvers;