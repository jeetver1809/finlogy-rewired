const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Expense = require('../models/Expense');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB...');
        try {
            const result = await Expense.aggregate([
                { $group: { _id: '$user', count: { $sum: 1 } } }
            ]);
            console.log('Expenses per user breakdown:');
            console.log(JSON.stringify(result, null, 2));

            const total = await Expense.countDocuments();
            console.log('Total Expenses in Collection:', total);
        } catch (err) {
            console.error(err);
        } finally {
            process.exit();
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
