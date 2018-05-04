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
cashierSchema.set('toObject', { virtuals: true })


const cashier = mongoose.model('cashiers', cashierSchema);

export default cashier;