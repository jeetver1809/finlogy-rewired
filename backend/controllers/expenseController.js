const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const AuditLog = require('../models/AuditLog'); // [NEW] Audit Log

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = { user: req.user.id };

    if (category) {
      query.category = category;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const expenses = await Expense.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expenses',
    });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expense',
    });
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      user: req.user.id,
    };

    const expense = await Expense.create(expenseData);

    // Update related budgets
    await updateBudgetsAfterExpense(req.user.id, expense.category, expense.date);

    // [NEW] Audit Log (Create)
    await AuditLog.create({
      user: req.user.id,
      action: 'EXPENSE_CREATE',
      resource: 'Expense',
      resourceId: expense._id,
      details: {
        category: expense.category,
        amount: expense.amount
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating expense',
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    let expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    const oldCategory = expense.category;
    const oldDate = expense.date;

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    // Update related budgets for both old and new categories
    await updateBudgetsAfterExpense(req.user.id, oldCategory, oldDate);
    await updateBudgetsAfterExpense(req.user.id, expense.category, expense.date);

    // [NEW] Audit Log (Update)
    await AuditLog.create({
      user: req.user.id,
      action: 'EXPENSE_UPDATE',
      resource: 'Expense',
      resourceId: expense._id,
      details: {
        amount: { old: expense.amount, new: req.body.amount || expense.amount },
        description: { old: expense.description, new: req.body.description || expense.description }
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expense',
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    await expense.deleteOne();

    // Update related budgets
    await updateBudgetsAfterExpense(req.user.id, expense.category, expense.date);

    // [NEW] Audit Log (Delete)
    await AuditLog.create({
      user: req.user.id,
      action: 'EXPENSE_DELETE',
      resource: 'Expense',
      resourceId: expense._id,
      details: {
        amount: expense.amount,
        category: expense.category,
        refunded: false // Just an example detail
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense',
    });
  }
};

// Helper function to update budgets after expense changes
const updateBudgetsAfterExpense = async (userId, category, date) => {
  try {
    console.log(`🔄 Updating budgets for User: ${userId}, Category: ${category}, Date: ${date}`);
    // Find budgets that might be affected
    const budgets = await Budget.find({
      user: userId,
      $or: [
        { category: category },
        { category: 'total' },
      ],
      startDate: { $lte: date },
      endDate: { $gte: date },
      isActive: true,
    });

    console.log(`Found ${budgets.length} budgets to update.`);

    // Update spent amount for each budget
    for (const budget of budgets) {
      console.log(`Updating budget: ${budget.name} (${budget._id})`);
      await budget.updateSpent();
      console.log(`Budget updated: ${budget.name}. New Spent: ${budget.spent}`);
    }
  } catch (error) {
    console.error('Error updating budgets:', error);
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
};
