import neo4j from './neo4j-connector'
import mongodb from './mongodb-connector'
import cassandra from './cassandra-connector'

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
            });
        },
        compositions() {
            return neo4j.driver.session().run(
                'MATCH (c: Composition) RETURN c'
            ).then(result => {
                return result.records.map(neo4j.recordToComposition)
            });
        },
        shelf(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (r: Shelf {id: {id}}) RETURN r',
                {id: id}
            ).then(result => {
                return neo4j.recordToShelf(result.records[0]);
            });
        },
        shelfs() {
            return neo4j.driver.session().run(
                'MATCH (r: Shelf) RETURN r'
            ).then(result => {
                return result.records.map(neo4j.recordToShelf)
            });
        },
        shelfDish(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (d: ShelfDish {id: {id}}) RETURN d',
                {id: id}
            ).then(result => {
                return result.records.map(neo4j.recordToShelfDish)
            });
        },
        shelfDishes() {
            return neo4j.driver.session().run(
                'MATCH (d: ShelfDish) RETURN d'
            ).then(result => {
                return result.records.map(neo4j.recordToShelfDish)
            });
        },
        cashboxQueue(root, {id}) {
            return cassandra.client.execute(
                'SELECT * FROM CustomerQueue WHERE cashbox_id = ?',
                [id]
            ).then(result => {
                return cassandra.responseToCashboxQueue(result)[0];
            });
        },
        cashboxQueues() {
            return cassandra.client.execute(
                'SELECT * FROM CustomerQueue'
            ).then(result => {
                return cassandra.responseToCashboxQueue(result);
            });
        }
    },
    Mutation: {
        addCashier(root, {cashier}) {
            if (!cashier.full_name || !cashier.full_name.length) {
                throw new Error("Need to specify full name")
            }
            if (cashier.salary && cashier.salary < 0) {
                throw new Error("Salary must not be negative")
            }
            if (cashier.birthdate) {
                if (!cashier.birthdate.length) {
                    throw new Error("Birthdate must not be empty")
                }
                cashier.birthdate = new Date(cashier.birthdate).toISOString();
            }
            return mongodb.cashiers.create(cashier);
        },
        updateCashier(root, {id, cashier}) {
            if (cashier.full_name && !cashier.full_name.length) {
                throw new Error("Full name must not be empty")
            }
            if (cashier.salary && cashier.salary < 0) {
                throw new Error("Salary must not be negative")
            }
            if (cashier.birthdate) {
                if (!cashier.birthdate.length) {
                    throw new Error("Birthdate must not be empty")
                }
                cashier.birthdate = new Date(cashier.birthdate).toISOString();
            }
            return mongodb.cashiers.findByIdAndUpdate(id, {$set: cashier}, {new: true}).then((cashier) => {
                return mongodb.shifts.find().then((shifts) => {
                        shifts.forEach((shift) => {
                            if (shift.cashiers) {
                                shift.cashiers.forEach((shiftCashier) => {
                                    if (shiftCashier.cashierId == cashier.id) {
                                        shiftCashier.full_name = cashier.full_name;
                                        shiftCashier.save();
                                    }
                                });
                            }
                        });
                        return cashier;
                });
            })
        },
        deleteCashier(root, {id}) {
            return mongodb.cashiers.findByIdAndRemove(id);
        },
        addCashbox() {
            return mongodb.cashboxes.create({});
        },
        deleteCashbox(root, {id}) {
            return mongodb.cashboxes.findOneAndRemove({_id: id});
        },
        addShift(root, {shift}) {
            if (!shift.type) {
                throw new Error("Need to specify type")
            }
            if (!shift.date || !shift.date.length) {
                throw new Error("Need to specify date")
            }
            shift.date = new Date(shift.date).toISOString();
            return shift.cashiers
                ? Promise.all(shift.cashiers.map((shiftCashier) => {
                    return Promise.all([
                        mongodb.cashiers.findById(shiftCashier.cashierId).then((cashier) => {
                            if (!cashier) {
                                throw new Error("No cashier with id: " + shiftCashier.cashierId);
                            }
                            return {
                                cashierInfo: {
                                    full_name: cashier.full_name,
                                    cashierId: cashier.id
                                },
                                cashbox: shiftCashier.cashboxId,
                                isComplete: false
                            }
                        }),
                        mongodb.cashboxes.findById(shiftCashier.cashboxId).then((cashbox) => {
                            if (!cashbox) {
                                throw new Error("No cashbox with id: " + shiftCashier.cashboxId);
                            }
                            return cashbox;
                        })]
                    ).then((results) => results[0]);
                })).then(cashiers => {
                    shift.cashiers = cashiers;
                    return mongodb.shifts.create(shift);
                })
                : mongodb.shifts.create(shift);
        },
        updateShift(root, {id, shift}) {
            if (shift.date) {
                if (!shift.date.length) {
                    throw new Error("Birthdate must not be empty")
                }
                shift.date = new Date(shift.date).toISOString();
            }
            return shift.cashiers
                ? Promise.all(shift.cashiers.map((shiftCashier) => {
                    return Promise.all([
                        mongodb.cashiers.findById(shiftCashier.cashierId).then((cashier) => {
                            if (!cashier) {
                                throw new Error("No cashier with id: " + shiftCashier.cashierId);
                            }
                            return {
                                cashierInfo: {
                                    full_name: cashier.full_name,
                                    cashierId: cashier.id
                                },
                                cashbox: shiftCashier.cashboxId,
                                isComplete: false
                            }
                        }),
                        mongodb.cashboxes.findById(shiftCashier.cashboxId).then((cashbox) => {
                            if (!cashbox) {
                                throw new Error("No cashbox with id: " + shiftCashier.cashboxId);
                            }
                            return cashbox;
                        })]
                    ).then((results) => results[0]);
                })).then(cashiers => {
                    shift.cashiers = cashiers;
                    return mongodb.shifts.findByIdAndUpdate(id, {$set: shift}, {new: true});
                })
                : mongodb.shifts.findByIdAndUpdate(id, {$set: shift}, {new: true});
        },
        deleteShift(root, {id}) {
            return mongodb.shifts.findOneAndRemove({_id: id});
        },
        addDish(root, {dish}) {
            if (!dish.name || !dish.name.length) {
                throw new Error("Need to specify name")
            }
            if (!dish.price) {
                throw new Error("Need to specify price")
            }
            if (dish.price < 0) {
                throw new Error("Price must not be negative")
            }
            return mongodb.dishes.create(dish);
        },
        updateDish(root, {id, dish}) {
            if (dish.name && !dish.name.length) {
                throw new Error("Name must not be empty")
            }
            if (dish.price && dish.price < 0) {
                throw new Error("Price must not be negative")
            }
            return mongodb.dishes.findByIdAndUpdate(id, {$set: dish}, {new: true});
        },
        deleteDish(root, {id}) {
            return mongodb.dishes.findOneAndRemove({_id: id});
        },
        addOrder(root, {order}) {
            if (!order.date || !order.date.length) {
                throw new Error("Need to specify date")
            }
            if (!order.price) {
                throw new Error("Need to specify price")
            }
            if (!order.dishes || !order.dishes.length) {
                throw new Error("Need to specify dishes")
            }
            if (order.price < 0) {
                throw new Error("Price must not be negative")
            }
            order.date = new Date(order.date).toISOString();
            return Promise.all(order.dishes.map(function (orderDish) {
                if (orderDish.amount <= 0) {
                    throw new Error("Amount must be greater than zero")
                }
                return mongodb.dishes.findById(orderDish.dishId).then((dish) => {
                    if (!dish) {
                        throw new Error("No dish with id: " + orderDish.dishId);
                    }
                    return {
                        dishInfo: {
                            name: dish.name,
                            price: dish.price,
                            dishId: dish.id
                        },
                        amount: orderDish.amount
                    }
                });
            })).then(dishes => {
                order.dishes = dishes;
                return mongodb.orders.create(order);
            });
        },
        updateOrder(root, {id, order}) {
            if (order.price && order.price < 0) {
                throw new Error("Price must not be negative")
            }
            if (order.date) {
                if (!order.date.length) {
                    throw new Error("Date must not be empty")
                }
                order.date = new Date(order.date).toISOString();
            }
            return order.dishes
                ? Promise.all(order.dishes.map(function (orderDish) {
                    if (orderDish.amount <= 0) {
                        throw new Error("Amount must be greater than zero")
                    }
                    return mongodb.dishes.findById(orderDish.dishId).then((dish) => {
                        if (!dish) {
                            throw new Error("No dish with id: " + orderDish.dishId);
                        }
                        return {
                            dishInfo: {
                                name: dish.name,
                                price: dish.price,
                                dishId: dish.id
                            },
                            amount: orderDish.amount
                        }
                    });
                })).then(dishes => {
                    order.dishes = dishes;
                    return mongodb.orders.findByIdAndUpdate(id, {$set: order}, {new: true});
                })
                : mongodb.orders.findByIdAndUpdate(id, {$set: order}, {new: true});
        },
        deleteOrder(root, {id}) {
            return mongodb.orders.findOneAndRemove({_id: id});
        },
        addComposition() {
            return neo4j.driver.session().run(
                'CREATE (c: Composition {id: {compositionId}}) RETURN (c)',
                {compositionId: create_UUID()}
            ).then(result => {
                return neo4j.recordToComposition(result.records[0])
            });
        },
        deleteComposition(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) WITH c, c.id as id DELETE (c) RETURN id',
                {compositionId: id}
            ).then(result => {
                if (!result.records[0]) {
                    throw new Error("No composition with id: " + id)
                }
                return result.records[0].get(0)
            });
        },
        addShelf(root, {shelf, compositionId}) {
            if (!shelf.capacity) {
                throw new Error("Need to specify capacity")
            }
            if (shelf.capacity < 0) {
                throw new Error("Capacity must not be negative")
            }
            return neo4j.driver.session().run(
                'MATCH (c: Composition {id: {compositionId}}) ' +
                'CREATE (r: Shelf {id: {shelfId}, capacity: {capacity}, dish_count: 0}), (c)-[:CONTAINS]->(r) RETURN (r)',
                {compositionId: compositionId, shelfId: create_UUID(), capacity: shelf.capacity}
            ).then(result => {
                if (!result.records[0]) {
                    throw new Error("No composition with id: " + compositionId)
                }
                return neo4j.recordToShelf(result.records[0])
            });
        },
        updateShelf(root, {id, shelf}) {
            if (!shelf.capacity) {
                throw new Error("Need to specify capacity")
            }
            if (shelf.capacity < 0) {
                throw new Error("Capacity must not be negative")
            }
            return neo4j.driver.session().run(
                'MATCH (shelf: Shelf{id: {shelfId}}) SET shelf.capacity = {capacity} ' +
                'RETURN shelf',
                {shelfId: id, capacity: shelf.capacity}
            ).then(result => {
                if (!result.records[0]) {
                    throw new Error("No shelf with id: " + id)
                }
                return neo4j.recordToShelf(result.records[0])
            });
        },
        deleteShelf(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (r: Shelf {id: {shelfId}}), (c: Composition)-[contRel:CONTAINS]-(r) DELETE contRel ' +
                'WITH r, r.id as id DELETE (r) RETURN id',
                {shelfId: id}
            ).then(result => {
                if (!result.records[0]) {
                    throw new Error("No shelf with id: " + id)
                }
                return result.records[0].get(0)
            });
        },
        addShelfDishFirst(root, {shelfDish, shelfId}) {
            if (!shelfDish.shelf_life) {
                throw new Error("Need to specify shelf life")
            }
            if (!shelfDish.dish) {
                throw new Error("Need to specify dish")
            }
            if (shelfDish.shelf_life < 0) {
                throw new Error("Shelf life must not be negative")
            }
            let date = new Date();
            const shelf_life = date.setMinutes(date.getMinutes() + shelfDish.shelf_life);
            return mongodb.dishes.findById(shelfDish.dish).then((dish) => {
                if (!dish) {
                    throw new Error("No dish with id: " + shelfDish.dish);
                }
                return neo4j.driver.session().run(
                    'MATCH (shelf: Shelf {id: {shelfId}}) WHERE shelf.capacity > shelf.dish_count ' +
                    'CREATE (new: ShelfDish {id: {shelfDishId}, dish: {dishId}, shelf_life: {shelfLife}}), (shelf)-[:CONTAINS]->(new) ' +
                    'SET shelf.dish_count = shelf.dish_count + 1 ' +
                    'WITH shelf, new ' +
                    'OPTIONAL MATCH (shelf)-[:CONTAINS]->(first: ShelfDish) WHERE NOT (first)-[:NEXT]->() AND first <> new ' +
                    'FOREACH (n IN CASE WHEN first IS NULL THEN [] ELSE [first] END | CREATE (new)-[:PREVIOUS]->(n), (n)-[:NEXT]->(new)) ' +
                    'RETURN new',
                    {shelfId: shelfId, shelfDishId: create_UUID(), dishId: shelfDish.dish, shelfLife: shelf_life}
                ).then(result => {
                    if (!result.records[0]) {
                        throw new Error("Cannot put dish on shelf with id: " + shelfId)
                    }
                    return neo4j.recordToShelfDish(result.records[0])
                })
            });
        },
        addShelfDishLast(root, {shelfDish, shelfId}) {
            if (!shelfDish.shelf_life) {
                throw new Error("Need to specify shelf life")
            }
            if (!shelfDish.dish) {
                throw new Error("Need to specify dish")
            }
            if (shelfDish.shelf_life < 0) {
                throw new Error("Shelf life must not be negative")
            }
            let date = new Date();
            const shelf_life = date.setMinutes(date.getMinutes() + shelfDish.shelf_life);
            return mongodb.dishes.findById(shelfDish.dish).then((dish) => {
                if (!dish) {
                    throw new Error("No dish with id: " + shelfDish.dish);
                }
                return neo4j.driver.session().run(
                    'MATCH (shelf: Shelf {id: {shelfId}}) WHERE shelf.capacity > shelf.dish_count ' +
                    'CREATE (new: ShelfDish {id: {shelfDishId}, dish: {dishId}, shelf_life: {shelfLife}}), (shelf)-[:CONTAINS]->(new) ' +
                    'SET shelf.dish_count = shelf.dish_count + 1 ' +
                    'WITH shelf, new ' +
                    'OPTIONAL MATCH (shelf)-[:CONTAINS]->(last: ShelfDish) WHERE NOT (last)-[:PREVIOUS]->() AND last <> new ' +
                    'FOREACH (n IN CASE WHEN last IS NULL THEN [] ELSE [last] END | CREATE (n)-[:PREVIOUS]->(new), (new)-[:NEXT]->(n)) ' +
                    'RETURN new',
                    {shelfId: shelfId, shelfDishId: create_UUID(), dishId: shelfDish.dish, shelfLife: shelf_life}
                ).then(result => {
                    if (!result.records[0]) {
                        throw new Error("Cannot put dish on shelf with id: " + shelfId)
                    }
                    return neo4j.recordToShelfDish(result.records[0])
                })
            });
        },
        addShelfDishBefore(root, {shelfDish, targetShelfDishId}) {
            if (!shelfDish.shelf_life) {
                throw new Error("Need to specify shelf life")
            }
            if (!shelfDish.dish) {
                throw new Error("Need to specify dish")
            }
            if (!targetShelfDishId) {
                throw new Error("Need to specify target shelf dish id")
            }
            if (shelfDish.shelf_life < 0) {
                throw new Error("Shelf life must not be negative")
            }
            let date = new Date();
            const shelf_life = date.setMinutes(date.getMinutes() + shelfDish.shelf_life);
            return mongodb.dishes.findById(shelfDish.dish).then((dish) => {
                if (!dish) {
                    throw new Error("No dish with id: " + shelfDish.dish);
                }
                return neo4j.driver.session().run(
                    'MATCH (dish: ShelfDish {id: {shelfDishId}}), (shelf: Shelf)-[:CONTAINS]->(dish) WHERE shelf.capacity > shelf.dish_count ' +
                    'CREATE (new: ShelfDish {id: {newShelfDishId}, dish: {dishId}, shelf_life: {shelfLife}}), (shelf)-[:CONTAINS]->(new), ' +
                    '(dish)-[:PREVIOUS]->(new), (new)-[:NEXT]->(dish) ' +
                    'SET shelf.dish_count = shelf.dish_count + 1 ' +
                    'WITH dish, new ' +
                    'OPTIONAL MATCH (dish)-[prevRel:PREVIOUS]->(previous: ShelfDish)-[nextRel:NEXT]->(:ShelfDish) WHERE previous <> new ' +
                    'FOREACH (n IN CASE WHEN previous IS NULL THEN [] ELSE [previous] END | ' +
                    'DELETE prevRel, nextRel CREATE (n)-[:NEXT]->(new), (new)-[:PREVIOUS]->(n)) ' +
                    'RETURN new',
                    {
                        shelfDishId: targetShelfDishId,
                        newShelfDishId: create_UUID(),
                        dishId: shelfDish.dish,
                        shelfLife: shelf_life
                    }
                ).then(result => {
                    if (!result.records[0]) {
                        throw new Error("Cannot put before dish with id: " + targetShelfDishId)
                    }
                    return neo4j.recordToShelfDish(result.records[0])
                })
            });
        },
        addShelfDishAfter(root, {shelfDish, targetShelfDishId}) {
            if (!shelfDish.shelf_life) {
                throw new Error("Need to specify shelf life")
            }
            if (!shelfDish.dish) {
                throw new Error("Need to specify dish")
            }
            if (!targetShelfDishId) {
                throw new Error("Need to specify target shelf dish id")
            }
            if (shelfDish.shelf_life < 0) {
                throw new Error("Shelf life must not be negative")
            }
            let date = new Date();
            const shelf_life = date.setMinutes(date.getMinutes() + shelfDish.shelf_life);
            return mongodb.dishes.findById(shelfDish.dish).then((dish) => {
                if (!dish) {
                    throw new Error("No dish with id: " + shelfDish.dish);
                }
                return neo4j.driver.session().run(
                    'MATCH (dish: ShelfDish {id: {shelfDishId}}), (shelf: Shelf)-[:CONTAINS]->(dish) WHERE shelf.capacity > shelf.dish_count ' +
                    'CREATE (new: ShelfDish {id: {newShelfDishId}, dish: {dishId}, shelf_life: {shelfLife}}), (shelf)-[:CONTAINS]->(new), ' +
                    '(dish)-[:NEXT]->(new), (new)-[:PREVIOUS]->(dish) ' +
                    'SET shelf.dish_count = shelf.dish_count + 1 ' +
                    'WITH dish, new ' +
                    'OPTIONAL MATCH (dish)-[nextRel:NEXT]->(next: ShelfDish)-[prevRel:PREVIOUS]->(:ShelfDish) WHERE next <> new ' +
                    'FOREACH (n IN CASE WHEN next IS NULL THEN [] ELSE [next] END | ' +
                    'DELETE prevRel, nextRel CREATE (new)-[:NEXT]->(n), (n)-[:PREVIOUS]->(new)) ' +
                    'RETURN new',
                    {
                        shelfDishId: targetShelfDishId,
                        newShelfDishId: create_UUID(),
                        dishId: shelfDish.dish,
                        shelfLife: shelf_life
                    }
                ).then(result => {
                    if (!result.records[0]) {
                        throw new Error("Cannot put after dish with id: " + targetShelfDishId)
                    }
                    return neo4j.recordToShelfDish(result.records[0])
                });
            })
        },
        updateShelfDish(root, {id, shelfDish}) {
            if (!shelfDish.shelf_life) {
                throw new Error("Need to specify shelf life")
            }
            if (!shelfDish.dish) {
                throw new Error("Need to specify dish")
            }
            if (shelfDish.shelf_life < 0) {
                throw new Error("Shelf life must not be negative")
            }
            let date = new Date();
            const shelf_life = date.setMinutes(date.getMinutes() + shelfDish.shelf_life);
            return mongodb.dishes.findById(shelfDish.dish).then((dish) => {
                if (!dish) {
                    throw new Error("No dish with id: " + shelfDish.dish);
                }
                return neo4j.driver.session().run(
                    'MATCH (shelfDish: ShelfDish {id: {shelfDishId}}) SET shelfDish.dish = {dish}, shelfDish.shelf_life = {shelfLife} ' +
                    'RETURN shelfDish',
                    {shelfDishId: id, dish: shelfDish.dish, shelfLife: shelf_life}
                ).then(result => {
                    if (!result.records[0]) {
                        throw new Error("No dish with id: " + id)
                    }
                    return neo4j.recordToShelfDish(result.records[0])
                });
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
                if (!result.records[0]) {
                    throw new Error("No dish with id: " + id)
                }
                return result.records[0].get(0)
            });
        },
        addToQueue(root, {cashboxId}) {
            if (!cashboxId) {
                throw new Error("Need to specify cashbox id")
            }
            return mongodb.cashboxes.findById(cashboxId).then((cashbox) => {
                if (!cashbox) {
                    throw new Error("No cashbox with id: " + cashboxId)
                }
                return cassandra.client.execute(
                    'INSERT INTO CustomerQueue(cashbox_id, enqueued_at) VALUES(?, ?)',
                    [cashboxId, new Date()]
                ).then(result => {
                    return cashboxId;
                });
            })
        },
        deleteFromQueue(root, {cashboxId}) {
            if (!cashboxId) {
                throw new Error("Need to specify cashbox id")
            }
            return cassandra.client.execute(
                'SELECT * FROM CustomerQueue LIMIT 1'
            ).then(result => {
                if (!result.rows[0]) {
                    throw new Error("No cashbox with id: " + cashboxId)
                }
                return cassandra.client.execute(
                    'DELETE FROM CustomerQueue WHERE cashbox_id = ? AND enqueued_at = ?',
                    [result.rows[0].cashbox_id, result.rows[0].enqueued_at]
                )
            });
        }
    },
    ShiftCashierInfo: {
        cashier(shiftCashierInfo) {
            return mongodb.cashiers.findById(shiftCashierInfo.cashierId);
        }
    },
    OrderDishInfo: {
        dish(orderDishInfo) {
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
            });
        }
    },
    Shelf: {
        shelfDishes(shelf) {
            return neo4j.driver.session().run(
                'MATCH (r: Shelf {id: {shelfId}}) MATCH (d: ShelfDish) WHERE (r)-[:CONTAINS]->(d) RETURN d',
                {shelfId: shelf.id}
            ).then(result => {
                return result.records.map(neo4j.recordToShelfDish);
            });
        }
    },
    ShelfDish: {
        dish(shelfDish) {
            return mongodb.dishes.findById(shelfDish.dish)
        },
        next(shelfDish) {
            return neo4j.driver.session().run(
                'MATCH (d1: ShelfDish {id: {dishId}}) MATCH (d1)-[:NEXT]->(d2: ShelfDish) RETURN d2',
                {dishId: shelfDish.id}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0]);
            });
        },
        previous(shelfDish) {
            return neo4j.driver.session().run(
                'MATCH (d1: ShelfDish {id: {dishId}}) MATCH (d1)-[:PREVIOUS]->(d2: ShelfDish) RETURN d2',
                {dishId: shelfDish.id}
            ).then(result => {
                return neo4j.recordToShelfDish(result.records[0]);
            });
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