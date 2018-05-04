import neo4j from './neo4j-connector'

import { Cashier } from './mongoose-connector';

const resolvers = {
  Query: {
    cashier(id) {
      return Cashier.findById(id)
    },
    composition(root, { id }) {
      return neo4j.driver.session().run(
        'MATCH (c:Composition {id: {id}}) RETURN c',
        {id: id}
      ).then(result => {
        return neo4j.recordToComposition(result.records[0]);
      }).catch(error => {
        console.log("composition result error: " + error);
      })
    },
    row(root, { id }) {
      return neo4j.driver.session().run(
        'MATCH (r:Row {id: {id}}) RETURN r',
        {id: id}
      ).then(result => {
        return neo4j.recordToRow(result.records[0]);
      }).catch(error => {
        console.log("row result error: " + error);
      })
    },
    shelfDish(root, { id }) {
      return neo4j.driver.session().run(
        'MATCH (d:Dish {id: {id}}) RETURN d',
        {id: id}
      ).then(result => {
        return result.records.map(neo4j.recordToShelfDish)
      }).catch(error => {
        console.log("dish result error: " + error);
      })
    },
    allShelfDishes() {
      return neo4j.driver.session().run(
        'MATCH (d: Dish) RETURN d'
      ).then(result => {
        return result.records.map(neo4j.recordToShelfDish)
      }).catch(error => {
        console.log("All dishes result error: " + error);
      })
    }
  },
  Row: {
    dishes(row) {
      return neo4j.driver.session().run(
        'MATCH (r: Row {id: {rowId}}) MATCH (d:Dish) WHERE (r)-[:CONTAINS]-(d) RETURN d',
        {rowId: row.id}
      ).then(result => {
        return result.records.map(neo4j.recordToShelfDish);
      }).catch(error => {
        console.log("row result error: " + error);
      })
    }
  }
};

export default resolvers;