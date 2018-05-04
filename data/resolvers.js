import neo4j from './neo4j-connector'
import cashier from './mongodb-connector'


const resolvers = {
    Query: {
        cashier(root, {id}) {
            cashier.findById(id)
        },
        cashiers() {
            return cashier.find();
        },
        composition(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (c:Composition {id: {id}}) RETURN c',
                {id: id}
            ).then(result => {
                return neo4j.recordToComposition(result.records[0]);
            }).catch(error => {
                console.log("Composition fetch error: " + error);
            })
        },
        row(root, {id}) {
            return neo4j.driver.session().run(
                'MATCH (r:Row {id: {id}}) RETURN r',
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
        dishes(row) {
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

export default resolvers;