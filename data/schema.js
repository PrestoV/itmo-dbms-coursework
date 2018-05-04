import {makeExecutableSchema, addMockFunctionsToSchema} from 'graphql-tools';
import resolvers from './resolvers';

const typeDefs = `
type Query {
  cashier(id: ID!): Cashier
  cashiers: [Cashier]
  getFortuneCookie: String # we'll use this later
  composition(id: Int!): Composition
  row(id: Int!): Row
  shelfDish(id: Int!): [ShelfDish]
  allShelfDishes: [ShelfDish]
}

type Cashier {
  id: ID!
  full_name: String
  birthdate: String
  salary: Int
}

type Composition {
  id: Int
  rows: [Row]
}

type Row {
  id: Int
  dishes: [ShelfDish]
}

type ShelfDish {
  id: Int
  dish_id: ID
  shelf_life: String
  previous: ShelfDish
  next: ShelfDish
}
`;

const schema = makeExecutableSchema({typeDefs, resolvers});

export default schema;
