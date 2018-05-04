import mongoose from 'mongoose';

mongoose.connect('mongodb://35.231.143.48:27017/db');

const cashierSchema = mongoose.Schema({
    full_name: String,
    birthdate: mongoose.Schema.Types.Date,
    salary: Number
});
cashierSchema.virtual('id').get(function() {
    return this._id;
});
cashierSchema.set('toJSON', { virtuals: true });
cashierSchema.set('toObject', { virtuals: true });

const cashboxSchema = mongoose.Schema({});
cashboxSchema.virtual('id').get(function() {
    return this._id;
});
cashboxSchema.set('toJSON', { virtuals: true });
cashboxSchema.set('toObject', { virtuals: true });

const shiftSchema = mongoose.Schema({
    type: Number,
    date: mongoose.Schema.Types.Date,
    cashiers: [{
        cashier: {
            cashierId: mongoose.Schema.Types.ObjectId,
            full_name: String
        },
        cashbox: mongoose.Schema.Types.ObjectId,
        isComplete: Boolean
    }]
});
shiftSchema.virtual('id').get(function() {
    return this._id;
});
shiftSchema.set('toJSON', { virtuals: true });
shiftSchema.set('toObject', { virtuals: true });

const dishSchema = mongoose.Schema({
    name: String,
    price: Number
});
dishSchema.virtual('id').get(function() {
    return this._id;
});
dishSchema.set('toJSON', { virtuals: true });
dishSchema.set('toObject', { virtuals: true });

const orderSchema = mongoose.Schema({
    price: Number,
    date: mongoose.Schema.Types.Date,
    dishes: [{
        dish: {
            dishId: mongoose.Schema.Types.ObjectId,
            name: String,
            price: Number
        },
        amount: Number
    }]
});
orderSchema.virtual('id').get(function() {
    return this._id;
});
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const cashiers = mongoose.model('cashiers', cashierSchema);
const cashboxes = mongoose.model('cashboxes', cashboxSchema);
const shifts = mongoose.model('shifts', shiftSchema);
const dishes = mongoose.model('dishes', dishSchema);
const orders = mongoose.model('orders', orderSchema);

export default {
    cashiers,
    cashboxes,
    shifts,
    dishes,
    orders
};