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
  allCompositions: [Composition]
  allRows: [Row]
  allShelfDishes: [ShelfDish]
}

type Mutation {
  createComposition: Composition,
  attachRows(composition: ID!, rows: [ID!]): [Row],
  detachRows(composition: ID!, rows: [ID]!): [Row],
  deleteComposition(id: ID!): ID,
  createRow: Row,
  deleteRow(id: ID!): ID,
  createShelfDish(input: ShelfDishInput): ShelfDish,
  deleteShelfDish(id: ID!): ID
}

type Cashier {
  id: ID!
  full_name: String
  birthdate: String
  salary: Int
}

type Composition {
  id: ID
  rows: [Row]
}

type Row {
  id: ID
  shelfDishes: [ShelfDish]
}

type ShelfDish {
  id: ID
  dish_id: ID
  shelf_life: String
  previous: ShelfDish
  next: ShelfDish
}

input ShelfDishInput {
  dish_id: ID
  shelf_life: String
}
`;

const schema = makeExecutableSchema({typeDefs, resolvers});

export default schema;
