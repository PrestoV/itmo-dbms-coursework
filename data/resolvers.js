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
        compositions() {
            return neo4j.driver.session().run(
                'MATCH (c: Composition) RETURN c'
            ).then(result => {
                return result.records.map(neo4j.recordToComposition)
            }).catch(error => {
                console.log("Compositions fetch error: " + error);
            })
        },
        shelf(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (r: Shelf {id: {id}}) RETURN r',
                {id: id}
            ).then(result => {
                return neo4j.recordToShelf(result.records[0]);
            }).catch(error => {
                console.log("Shelf fetch error: " + error);
            })
        },
        shelfs() {
            return neo4j.driver.session().run(
                'MATCH (r: Shelf) RETURN r'
            ).then(result => {
                return result.records.map(neo4j.recordToShelf)
            }).catch(error => {
                console.log("Shelfs fetch error: " + error);
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
        shelfDishes() {
            return neo4j.driver.session().run(
                'MATCH (d: ShelfDish) RETURN d'
            ).then(result => {
                return result.records.map(neo4j.recordToShelfDish)
            }).catch(error => {
                console.log("ShelfDishes fetch error: " + error);
            })
        }
    },
    Mutation: {
        addCashier(root, {input}) {
            input.birthdate = new Date(input.birthdate).toISOString();
            return mongodb.cashiers.create(input);
        },
        deleteCashier(root, {id}) {
            return mongodb.cashiers.findOneAndRemove({_id: id});
        },
        addComposition() {
            return neo4j.driver.session().run(
                'CREATE (c: Composition {id: {compositionId}}) RETURN (c)',
                {compositionId: create_UUID()}
            ).then(result => {
                return neo4j.recordToComposition(result.records[0])
            }).catch(error => {
                console.log("Add composition error: " + error)
            })
        },
        deleteComposition(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) WITH c, c.id as id DELETE (c) RETURN id',
                {compositionId: id}
            ).then(result => {
                return result.records[0].get(0)
            }).catch(error => {
                console.log("Delete composition error: " + error)
            })
        },
        addShelf(root, {composition}) {
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) CREATE (r: Shelf {id: {shelfId}}), (c)-[:CONTAINS]->(r) RETURN (r)',
                {compositionId: composition, shelfId: create_UUID()}
            ).then(result => {
                return neo4j.recordToShelf(result.records[0])
            }).catch(error => {
                console.log("Add shelf error: " + error)
            })
        },
        deleteShelf(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (r: Shelf {id: {shelfId}}) WITH r, r.id as id DELETE (r) RETURN id',
                {shelfId: id}
            ).then(result => {
                return result.records[0].get(0)
            }).catch(error => {
                console.log("Delete shelf error: " + error)
            })
        },
        addShelfDish(root, {input}) {
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
    ShiftCashierInfo: {
        cashier(shiftCashierInfo) {
            console.log(shiftCashierInfo.toString());
            return mongodb.cashiers.findById(shiftCashierInfo.cashierId);
        }
    },
    OrderDishInfo: {
        dish(orderDishInfo) {
            console.log(orderDishInfo.toString());
            return mongodb.dishes.findById(orderDishInfo.dishId);
        }
    },
    Composition: {
        shelfs(composition) {
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) MATCH (r: Shelf) WHERE (c)-[:CONTAINS]-(r) RETURN r',
                {compositionId: composition.id}
            ).then(result => {
                return result.records.map(neo4j.recordToShelf);
            }).catch(error => {
                console.log("Composition's shelfs fetch error: " + error);
            })
        }
    },
    Shelf: {
        shelfDishes(shelf) {
            return neo4j.driver.session().run(
                'MATCH (r: Shelf {id: {shelfId}}) MATCH (d: ShelfDish) WHERE (r)-[:CONTAINS]->(d) RETURN d',
                {shelfId: shelf.id}
            ).then(result => {
                return result.records.map(neo4j.recordToShelfDish);
            }).catch(error => {
                console.log("shelf's dishes fetch error: " + error);
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