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
        addShelf(root, {shelf, composition}) {
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) ' +
                'CREATE (r: Shelf {id: {shelfId}, capacity: {capacity}, dish_count: 0}), (c)-[:CONTAINS]->(r) RETURN (r)',
                {compositionId: composition, shelfId: create_UUID(), capacity: shelf.capacity}
            ).then(result => {
                return neo4j.recordToShelf(result.records[0])
            }).catch(error => {
                console.log("Add shelf error: " + error)
            })
        },
        deleteShelf(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (r: Shelf {id: {shelfId}}), (c: Composition)-[contRel:CONTAINS]-(r) DELETE contRel ' +
                'WITH r, r.id as id DELETE (r) RETURN id',
                {shelfId: id}
            ).then(result => {
                return result.records[0].get(0)
            }).catch(error => {
                console.log("Delete shelf error: " + error)
            })
        },
        addShelfDishFirst(root, {input, shelf}) {
            return neo4j.driver.session().run(
                'MATCH (shelf: Shelf {id: {shelfId}}) WHERE shelf.capacity > shelf.dish_count ' +
                'CREATE (new: ShelfDish {id: {shelfDishId}, dish_id: {dishId}, shelf_life: {shelfLife}}), (shelf)-[:CONTAINS]->(new) ' +
                'SET shelf.dish_count = shelf.dish_count + 1 ' +
                'WITH shelf, new ' +
                'OPTIONAL MATCH (shelf)-[:CONTAINS]->(first: ShelfDish) WHERE NOT (first)-[:NEXT]->() AND first <> new ' +
                'FOREACH (n IN CASE WHEN first IS NULL THEN [] ELSE [first] END | CREATE (new)-[:PREVIOUS]->(n), (n)-[:NEXT]->(new)) ' +
                'RETURN new',
                {shelfId: shelf, shelfDishId: create_UUID(), dishId: input.dish_id, shelfLife: input.shelf_life}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0])
            }).catch(error => {
                console.log("AddShelfDishFirst error: " + error)
            })
        },
        addShelfDishLast(root, {input, shelf}) {
            return neo4j.driver.session().run(
                'MATCH (shelf: Shelf {id: {shelfId}}) WHERE shelf.capacity > shelf.dish_count ' +
                'CREATE (new: ShelfDish {id: {shelfDishId}, dish_id: {dishId}, shelf_life: {shelfLife}}), (shelf)-[:CONTAINS]->(new) ' +
                'SET shelf.dish_count = shelf.dish_count + 1 ' +
                'WITH shelf, new ' +
                'OPTIONAL MATCH (shelf)-[:CONTAINS]->(last: ShelfDish) WHERE NOT (last)-[:PREVIOUS]->() AND last <> new ' +
                'FOREACH (n IN CASE WHEN last IS NULL THEN [] ELSE [last] END | CREATE (n)-[:PREVIOUS]->(new), (new)-[:NEXT]->(n)) ' +
                'RETURN new',
                {shelfId: shelf, shelfDishId: create_UUID(), dishId: input.dish_id, shelfLife: input.shelf_life}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0])
            }).catch(error => {
                console.log("AddShelfDishLast error: " + error)
            })
        },
        addShelfDishBefore(root, {input, shelfDish}) {
            return neo4j.driver.session().run(
                'MATCH (dish: ShelfDish {id: {shelfDishId}}), (shelf: Shelf)-[:CONTAINS]->(dish) WHERE shelf.capacity > shelf.dish_count ' +
                'CREATE (new: ShelfDish {id: {newShelfDishId}, dish_id: {dishId}, shelf_life: {shelfLife}}), (shelf)-[:CONTAINS]->(new), ' +
                '(dish)-[:PREVIOUS]->(new), (new)-[:NEXT]->(dish) ' +
                'SET shelf.dish_count = shelf.dish_count + 1 ' +
                'WITH dish, new ' +
                'OPTIONAL MATCH (dish)-[prevRel:PREVIOUS]->(previous: ShelfDish)-[nextRel:NEXT]->(:ShelfDish) WHERE previous <> new ' +
                'FOREACH (n IN CASE WHEN previous IS NULL THEN [] ELSE [previous] END | ' +
                'DELETE prevRel, nextRel CREATE (n)-[:NEXT]->(new), (new)-[:PREVIOUS]->(n)) ' +
                'RETURN new',
                {shelfDishId: shelfDish, newShelfDishId: create_UUID(), dishId: input.dish_id, shelfLife: input.shelf_life}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0])
            }).catch(error => {
                console.log("AddShelfDishBefore error: " + error)
            })
        },
        addShelfDishAfter(root, {input, shelfDish}) {
            return neo4j.driver.session().run(
                'MATCH (dish: ShelfDish {id: {shelfDishId}}), (shelf: Shelf)-[:CONTAINS]->(dish) WHERE shelf.capacity > shelf.dish_count ' +
                'CREATE (new: ShelfDish {id: {newShelfDishId}, dish_id: {dishId}, shelf_life: {shelfLife}}), (shelf)-[:CONTAINS]->(new), ' +
                '(dish)-[:NEXT]->(new), (new)-[:PREVIOUS]->(dish) ' +
                'SET shelf.dish_count = shelf.dish_count + 1 ' +
                'WITH dish, new ' +
                'OPTIONAL MATCH (dish)-[nextRel:NEXT]->(next: ShelfDish)-[prevRel:PREVIOUS]->(:ShelfDish) WHERE next <> new ' +
                'FOREACH (n IN CASE WHEN next IS NULL THEN [] ELSE [next] END | ' +
                'DELETE prevRel, nextRel CREATE (new)-[:NEXT]->(n), (n)-[:PREVIOUS]->(new)) ' +
                'RETURN new',
                {shelfDishId: shelfDish, newShelfDishId: create_UUID(), dishId: input.dish_id, shelfLife: input.shelf_life}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0])
            }).catch(error => {
                console.log("AddShelfDishAfter error: " + error)
            })
        },
        deleteShelfDish(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (dish: ShelfDish {id: {shelfDishId}}),(dish)<-[contRef:CONTAINS]-(shelf: Shelf) ' +
                'SET shelf.dish_count = shelf.dish_count - 1 ' +
                'DELETE contRef ' +
                'WITH dish ' +
                'OPTIONAL MATCH (dish)-[nextRel:NEXT]->(next: ShelfDish)-[nextPrevRel:PREVIOUS]->(dish) ' +
                'DELETE nextRel, nextPrevRel ' +
                'WITH dish, next ' +
                'OPTIONAL MATCH (dish)-[prevRel:PREVIOUS]->(previous: ShelfDish)-[prevNextRel:NEXT]->(dish) ' +
                'DELETE prevRel, prevNextRel ' +
                'WITH dish, next, previous, dish.id as deletedId ' +
                'FOREACH (nt IN CASE WHEN next IS NULL THEN [] ELSE [next] END | ' +
                '        FOREACH(pv IN CASE WHEN previous IS NULL THEN [] ELSE [previous] END | ' +
                '                CREATE (nt)-[:PREVIOUS]->(pv)-[:NEXT]->(nt) ' +
                '        ) ' +
                ') ' +
                'DELETE dish ' +
                'RETURN deletedId',
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
                console.log("Next dish fetch error: " + error);
            })
        },
        previous(shelfDish) {
            return neo4j.driver.session().run(
                'MATCH (d1: ShelfDish {id: {dishId}}) MATCH (d1)-[:PREVIOUS]->(d2: ShelfDish) RETURN d2',
                {dishId: shelfDish.id}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0]);
            }).catch(error => {
                console.log("Previous dish fetch error: " + error);
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