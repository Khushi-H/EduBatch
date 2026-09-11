const express = require('express');
const { createOrder, verifyPayment, paymentHistory, downloadReceipt } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.post('/create-order', authorize('student'), createOrder);
router.post('/verify', authorize('student'), verifyPayment);
router.get('/history', paymentHistory);
router.get('/:id/receipt', downloadReceipt);

module.exports = router;