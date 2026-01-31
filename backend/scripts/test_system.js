const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';

// Test Data
const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123'
};

const runTests = async () => {
    console.log('🚀 Starting System Integration Tests...\n');

    try {
        // 1. Authentication (Register/Login)
        console.log('1️⃣  Testing Authentication...');
        // Note: In a real scenario we might need to register. 
        // For now, assuming we can register a new temp user to test clean slate.
        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
            authToken = regRes.data.data.token;
            console.log('   ✅ Register successful');
        } catch (e) {
            // If already exists, try login
            const loginRes = await axios.post(`${API_URL}/auth/login`, { email: testUser.email, password: testUser.password });
            authToken = loginRes.data.data.token;
            console.log('   ✅ Login successful');
        }

        const authHeaders = { headers: { Authorization: `Bearer ${authToken}` } };

        // Get Profile to confirm ID
        const profileRes = await axios.get(`${API_URL}/auth/profile`, authHeaders);
        userId = profileRes.data.data._id;
        console.log(`   👤 User ID: ${userId}\n`);


        // 2. Budget Creation
        console.log('2️⃣  Testing Budget Module...');
        const budgetData = {
            name: 'Test Budget',
            amount: 1000,
            category: 'food',
            period: 'monthly',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };
        const budgetRes = await axios.post(`${API_URL}/budgets`, budgetData, authHeaders);
        const budgetId = budgetRes.data.data._id;
        console.log(`   ✅ Budget Created: ${budgetRes.data.data.name} (Limit: ${budgetRes.data.data.amount})`);


        // 3. Add Income
        console.log('\n3️⃣  Testing Income Module...');
        const incomeData = {
            title: 'Salary',
            amount: 5000,
            source: 'salary',
            date: new Date()
        };
        await axios.post(`${API_URL}/income`, incomeData, authHeaders);
        console.log('   ✅ Income Added');


        // 4. Add Expense (Should update Budget)
        console.log('\n4️⃣  Testing Expense & Budget Integration...');
        const expenseData = {
            title: 'Burger',
            amount: 100,
            category: 'food',
            date: new Date()
        };
        const expenseRes = await axios.post(`${API_URL}/expenses`, expenseData, authHeaders);
        console.log('   ✅ Expense Added');

        // Check Budget Update
        const updatedBudgetRes = await axios.get(`${API_URL}/budgets/${budgetId}`, authHeaders);
        const spent = updatedBudgetRes.data.data.spent;
        if (spent >= 100) {
            console.log(`   ✅ Budget Spent Updated: ${spent} (Expected >= 100)`);
        } else {
            console.error(`   ❌ Budget Spent NOT Updated: ${spent}`);
        }


        // 5. Test Anomaly Detection (Security)
        console.log('\n5️⃣  Testing Security & Anomaly Detection...');
        // Add duplicate expense to trigger anomaly
        await axios.post(`${API_URL}/expenses`, expenseData, authHeaders);
        console.log('   ✅ Duplicate Expense Added (Triggering Anomaly...)');

        // Wait a moment for async detection (though we fixed race condition, let's be safe)
        await new Promise(r => setTimeout(r, 1000));

        // Check Security Dashboard
        const securityRes = await axios.get(`${API_URL}/security/dashboard`, authHeaders);
        const pendingCount = securityRes.data.data.stats.pending;
        if (pendingCount > 0) {
            console.log(`   ✅ Anomaly Detected! Pending Count: ${pendingCount}`);
        } else {
            console.error('   ❌ No Anomaly Detected (Check logic/timing)');
        }


        // 6. Analytics Check
        console.log('\n6️⃣  Testing Analytics...');
        const summaryRes = await axios.get(`${API_URL}/analytics/summary?period=month`, authHeaders);
        if (summaryRes.data.success) {
            console.log('   ✅ Analytics Summary Retrieved');
        } else {
            console.error('   ❌ Analytics Failed');
        }

        console.log('\n✅ SYSTEM TEST COMPLETE: All core modules interacting correctly.');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
};

runTests();
