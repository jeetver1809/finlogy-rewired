const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const detectionService = require('../services/detectionService');
const Anomaly = require('../models/Anomaly');

// Mock Models to prevent loading issues if needed, but better to connect really.
// We need to define the schemas if not loaded.
const UserSchema = new mongoose.Schema({ name: String });
const ExpenseSchema = new mongoose.Schema({ title: String, amount: Number, date: Date, user: mongoose.Schema.Types.ObjectId, category: String });
// Register if not exists
if (!mongoose.models.User) mongoose.model('User', UserSchema);
if (!mongoose.models.Expense) mongoose.model('Expense', ExpenseSchema);
if (!mongoose.models.Budget) mongoose.model('Budget', new mongoose.Schema({ name: String, amount: Number, user: mongoose.Schema.Types.ObjectId, isActive: Boolean, startDate: Date, endDate: Date }));

async function runDiagnosis() {
    console.log('🔬 Starting Anomaly Diagnosis...');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Mock Data
        const userId = new mongoose.Types.ObjectId(); // Random ID
        const transaction = {
            _id: new mongoose.Types.ObjectId(),
            title: 'Test Bribe',
            description: 'Suspicious unidentified cash transfer', // Should trigger AI heuristic
            amount: 9999, // High value
            category: 'Other',
            date: new Date()
        };

        // 1.5 Seed Previous Data to Test Duplicate & Budget
        const Expense = mongoose.model('Expense');
        const Budget = mongoose.model('Budget');

        // Seed Duplicate
        await Expense.create({
            user: userId,
            title: transaction.title, // Exact Match
            amount: transaction.amount,
            category: transaction.category,
            date: new Date(Date.now() - 60000) // 1 min ago
        });
        console.log('🌱 Seeded potential duplicate expense');

        // Seed Budget (limit 500)
        await Budget.create({
            user: userId,
            name: 'Test Budget',
            amount: 500,
            category: 'Other', // Matches transaction
            isActive: true,
            startDate: new Date(Date.now() - 86400000),
            endDate: new Date(Date.now() + 86400000)
        });
        console.log('🌱 Seeded active budget (Limit: 500)');

        // 2. Run Detection
        console.log('🕵️ calling detectionService.checkTransaction...');
        const anomalies = await detectionService.checkTransaction(transaction, userId);

        console.log('📊 Anomalies Detected:', JSON.stringify(anomalies, null, 2));

        if (anomalies.length > 0) {
            console.log('💾 Verifying Database Save...');
            // detectionService.checkTransaction ALREADY saves. 
            // We verify by querying.
            const saved = await Anomaly.find({ transactionId: transaction._id });
            console.log(`🗄️ Found ${saved.length} records in DB.`);
            if (saved.length > 0) {
                console.log('✅ SUCCESS: Anomaly saved correctly.');
                console.log('Severity in DB:', saved[0].severity);
            } else {
                console.error('❌ FAILURE: Anomalies returned but NOT found in DB. Save failed?');
            }
        } else {
            console.warn('⚠️ No anomalies detected. AI or Rules failed to trigger.');
        }

    } catch (error) {
        console.error('❌ DIAGNOSIS CRASHED:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runDiagnosis();
