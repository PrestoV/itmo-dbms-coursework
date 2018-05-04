import neo4j from './neo4j-connector'

import { Cashier } from './mongoose-connector';

const resolvers = {
  Query: {
    author(root, args) {
      return { id: 1, firstName: 'Hello', lastName: 'World' };
    },
    allAuthors() {
      return [{ id: 1, firstName: 'Hello', lastName: 'World' }];
    },
    cashier(id) {
      return Cashier.findById(id)
    },
    composition(root, args) {
      return neo4j.driver.session().run(
        'MATCH (c:Composition {id: {id}}) RETURN c',
        {id: args.id}
      ).then(result => {
        return neo4j.recordToComposition(result.records[0]);
      }).catch(error => {
        console.log("composition result error: " + error);
      })
    },
    row(root, args) {
      return neo4j.driver.session().run(
        'MATCH (r:Row {id: {id}}) RETURN r',
        {id: args.id}
      ).then(result => {
        return neo4j.recordToRow(result.records[0]);
      }).catch(error => {
        console.log("row result error: " + error);
      })
    },
    shelfDish(root, args) {
      return neo4j.driver.session().run(
        'MATCH (d:Dish {id: {id}}) RETURN d',
        {id: args.id}
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
  Author: {
    posts(author) {
      return [
        { id: 1, title: 'A post', text: 'Some text', views: 2 },
        { id: 2, title: 'Another post', text: 'Some other text', views: 200 }
      ];
    }
  },
  Post: {
    author(post) {
      return { id: 1, firstName: 'Hello', lastName: 'World' };
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