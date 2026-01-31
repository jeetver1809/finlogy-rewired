const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Anomaly = require('../models/Anomaly');
const AuditLog = require('../models/AuditLog');

// All routes are protected
router.use(protect);

/**
 * 🛡️ SECURITY DASHBOARD
 * GET /api/security/dashboard
 * Returns stats, health score, and recent activity
 */
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch Stats
        const totalAnomalies = await Anomaly.countDocuments({ user: userId });
        const pendingAnomalies = await Anomaly.countDocuments({ user: userId, status: 'PENDING' });

        // 2. Fetch Recent Alerts (High/Medium priority first)
        const recentAlerts = await Anomaly.find({
            user: userId,
            status: 'PENDING'
        })
            .sort({ severity: -1, detectedAt: -1 }) // High -> Low, Newest -> Oldest
            .limit(5)
            .populate('transactionId', 'description amount category date');

        // 3. Fetch Recent Audit Logs
        const recentLogs = await AuditLog.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(10)
            .select('-__v');

        // 4. Calculate Health Score (Simple Algorithm)
        // Start at 100. Deduct points for unresolved anomalies based on severity.
        const activeAnomalies = await Anomaly.find({
            user: userId,
            status: { $in: ['PENDING', 'CONFIRMED'] }
        });

        let deduction = 0;
        activeAnomalies.forEach(a => {
            if (a.severity === 'HIGH') deduction += 15;
            else if (a.severity === 'MEDIUM') deduction += 5;
            else deduction += 2;
        });

        const healthScore = Math.max(0, 100 - deduction);

        res.json({
            success: true,
            data: {
                healthScore,
                stats: {
                    total: totalAnomalies,
                    pending: pendingAnomalies,
                    resolved: totalAnomalies - pendingAnomalies
                },
                recentAlerts,
                recentLogs
            }
        });

    } catch (error) {
        console.error('❌ Security Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * 📋 GET ANOMALIES
 * GET /api/security/anomalies
 * Filterable list of anomalies
 */
router.get('/anomalies', async (req, res) => {
    try {
        const { status, severity } = req.query;
        const filter = { user: req.user.id };

        if (status) filter.status = status;
        if (severity) filter.severity = severity;

        const anomalies = await Anomaly.find(filter)
            .sort({ detectedAt: -1 })
            .populate('transactionId', 'description amount category date');

        res.json({ success: true, data: anomalies });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * 📝 RESOLVE ANOMALY
 * POST /api/security/anomalies/:id/resolve
 * Human-in-the-loop action
 */
router.post('/anomalies/:id/resolve', async (req, res) => {
    try {
        const { action, resolutionNote } = req.body; // action: 'DISMISSED' or 'CONFIRMED'

        if (!['DISMISSED', 'CONFIRMED'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        const anomaly = await Anomaly.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!anomaly) {
            return res.status(404).json({ success: false, message: 'Anomaly not found' });
        }

        // Update Anomaly
        const oldStatus = anomaly.status;
        anomaly.status = action;
        anomaly.resolutionNote = resolutionNote;
        anomaly.resolvedAt = new Date();
        await anomaly.save();

        // Create Audit Log for this Action
        await AuditLog.create({
            user: req.user.id,
            action: action === 'DISMISSED' ? 'ANOMALY_DISMISSED' : 'ANOMALY_RESOLVED',
            resource: 'Anomaly',
            resourceId: anomaly._id,
            details: {
                previousStatus: oldStatus,
                newStatus: action,
                note: resolutionNote
            },
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });

        res.json({ success: true, data: anomaly });

    } catch (error) {
        console.error('Resolution Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * 📜 GET AUDIT LOGS
 * GET /api/security/audit-logs
 * Read-only list
 */
router.get('/audit-logs', async (req, res) => {
    try {
        const logs = await AuditLog.find({ user: req.user.id })
            .sort({ timestamp: -1 })
            .limit(100); // Reasonable limit

        res.json({ success: true, data: logs });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
