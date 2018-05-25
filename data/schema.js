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
  
  shelfDish(id: ID!): [ShelfDish]
  shelfDishes: [ShelfDish]
  
  cashboxQueue(id: ID!): CashboxQueue
  cashboxQueues: [CashboxQueue]
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
  
  addShelf(shelf: ShelfInput!, compositionId: ID!): Shelf
  updateShelf(id: ID!, shelf: ShelfInput!): Shelf
  deleteShelf(id: ID!): ID
   
  addShelfDishFirst(shelfDish: ShelfDishInput!, shelfId: ID!): ShelfDish
  addShelfDishLast(shelfDish: ShelfDishInput!, shelfId: ID!): ShelfDish
  addShelfDishBefore(shelfDish: ShelfDishInput!, targetShelfDishId: ID!): ShelfDish
  addShelfDishAfter(shelfDish: ShelfDishInput!, targetShelfDishId: ID!): ShelfDish
  updateShelfDish(id: ID!, shelfDish: ShelfDishInput!): ShelfDish
  deleteShelfDish(id: ID!): ID
  
  addToQueue(cashboxId: ID!): String
  deleteFromQueue(cashboxId: ID!): String
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
  capacity: Int
}

type ShelfDish {
  id: ID!
  dish: Dish!
  shelf_life: String!
  previous: ShelfDish
  next: ShelfDish
}
input ShelfDishInput {
  dish: ID
  shelf_life: Int
}

type CashboxQueue {
  cashbox_id: ID!
  enqueued_at: [String!]
}
`;

const schema = makeExecutableSchema({typeDefs, resolvers});

export default schema;
