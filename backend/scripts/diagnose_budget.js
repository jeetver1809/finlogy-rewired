require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

async function diagnose() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB...\n');

    // Get the main user (the one with 58+ expenses)
    const userId = '68566f7de24cc963d2314bfd';

    console.log('=== BUDGETS FOR USER ===');
    const budgets = await Budget.find({ user: userId, isActive: true });

    for (const budget of budgets) {
        console.log(`\nBudget: ${budget.name}`);
        console.log(`  Category: "${budget.category}"`);
        console.log(`  Limit: ₹${budget.amount}`);
        console.log(`  Period: ${budget.startDate?.toDateString()} - ${budget.endDate?.toDateString()}`);
        console.log(`  Stored Spent: ₹${budget.spent}`);

        // Calculate actual spend via aggregation
        const stats = await Expense.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    category: { $regex: new RegExp(`^${budget.category}$`, 'i') },
                    date: {
                        $gte: budget.startDate,
                        $lte: budget.endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const actualSpend = stats.length > 0 ? stats[0].total : 0;
        console.log(`  Calculated Spend: ₹${actualSpend}`);
        console.log(`  Exceeds Budget? ${actualSpend > budget.amount ? '🚨 YES' : '✅ No'}`);
    }

    console.log('\n=== EXPENSE CATEGORIES (DISTINCT) ===');
    const categories = await Expense.distinct('category', { user: userId });
    console.log('Categories:', categories);

    process.exit();
}

diagnose().catch(err => {
    console.error(err);
    process.exit(1);
});
