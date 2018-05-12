import {makeExecutableSchema, addMockFunctionsToSchema} from 'graphql-tools';
import resolvers from './resolvers';

const typeDefs = `
type Query {
  cashier(id: ID!): Cashier
  cashiers: [Cashier]
  
  cashbox(id: ID!): Cashbox
  cashboxes: [Cashbox]
  
  shift(id: ID!): Shift
  shifts: [Shift]
  
  dish(id: ID!): Dish
  dishes: [Dish]
  
  order(id: ID!): Order
  orders: [Order]
  
  composition(id: ID!): Composition
  compositions: [Composition]
  
  shelf(id: ID!): Shelf
  shelfs: [Shelf]
  
  shelfDish(id: Int!): [ShelfDish]
  shelfDishes: [ShelfDish]
}

type Mutation {
  addCashier(cashier: CashierInput!): Cashier
  updateCashier(id: ID!, cashier: CashierInput!): Cashier
  deleteCashier(id: ID!): Cashier
  
  addCashbox: Cashbox
  deleteCashbox(id: ID!): Cashbox
  
  addShift(shift: ShiftInput!): Shift
  updateShift(id: ID!, shift: ShiftInput!): Shift
  deleteShift(id: ID!): Shift
  
  addDish(dish: DishInput!): Dish
  updateDish(id: ID!, dish: DishInput!): Dish
  deleteDish(id: ID!): Dish
  
  addOrder(order: OrderInput!): Order
  updateOrder(id: ID!, order: OrderInput!): Order
  deleteOrder(id: ID!): Order

  addComposition: Composition
  deleteComposition(id: ID!): ID
  
  addShelf(shelf: ShelfInput, composition: ID!): Shelf
  deleteShelf(id: ID!): ID
   
  addShelfDish(shelfDish: ShelfDishInput!): ShelfDish
  addShelfDishFirst(input: ShelfDishInput, shelf: ID!): ShelfDish
  addShelfDishLast(input: ShelfDishInput, shelf: ID!): ShelfDish
  addShelfDishBefore(input: ShelfDishInput, shelfDish: ID!): ShelfDish
  addShelfDishAfter(input: ShelfDishInput, shelfDish: ID!): ShelfDish
  deleteShelfDish(id: ID!): ID
}

type Cashier {
  id: ID!
  full_name: String
  birthdate: String
  salary: Int
}
input CashierInput {
  full_name: String
  birthdate: String
  salary: Int
}

type Cashbox {
  id: ID!
}

type Shift {
  id: ID!
  type: Int
  date: String
  cashiers: [ShiftCashier]
}
type ShiftCashier {
  cashierInfo: ShiftCashierInfo
  cashbox: ID!
  isComplete: Boolean
}
type ShiftCashierInfo {
  cashier: Cashier
  full_name: String
}
input ShiftInput {
  type: Int
  date: String
  cashiers: [ShiftCashierInput]
}
input ShiftCashierInput {
  cashierId: ID
  cashboxId: ID
}

type Dish {
  id: ID!
  name: String
  price: Float
}
input DishInput {
  name: String
  price: Float
}

type Order {
  id: ID!
  price: Float
  date: String
  dishes: [OrderDish]
}
type OrderDish {
  dishInfo: OrderDishInfo
  amount: Int
}
type OrderDishInfo {
  dish: Dish
  name: String
  price: Float
}
input OrderInput {
  price: Float
  date: String
  dishes: [OrderDishInput]
}
input OrderDishInput {
  dishId: ID
  amount: Int
}

type Composition {
  id: ID!
  shelfs: [Shelf]
}

type Shelf {
  id: ID!
  capacity: Int!
  dish_count: Int! 
  shelfDishes: [ShelfDish]
}
input ShelfInput {
  capacity: Int!
}

type ShelfDish {
  id: ID!
  dish_id: ID!
  shelf_life: String!
  previous: ShelfDish
  next: ShelfDish
}
input ShelfDishInput {
  dish_id: ID!
  shelf_life: String!
}
`;

const schema = makeExecutableSchema({typeDefs, resolvers});

export default schema;
