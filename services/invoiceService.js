const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');

/**
 * Auto-generate an invoice from a subscription's order lines.
 * Called when subscription transitions to 'active'.
 */
const generateFromSubscription = async (subscriptionId) => {
  const subscription = await Subscription.findById(subscriptionId)
    .populate('orderLines.product', 'name salesPrice')
    .populate('customer', 'name email')
    .populate('plan', 'name price billingPeriod');

  if (!subscription) throw new Error('Subscription not found');

  // Build invoice items from orderLines
  const items = subscription.orderLines.map((line) => ({
    description: line.product?.name || 'Subscription Service',
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    amount: parseFloat((line.quantity * line.unitPrice).toFixed(2)),
  }));

  // Aggregate tax from order lines (average)
  const avgTax =
    subscription.orderLines.reduce((sum, l) => sum + (l.tax || 0), 0) /
    subscription.orderLines.length;

  const invoice = await Invoice.create({
    subscription: subscription._id,
    customer: subscription.customer._id,
    items,
    tax: parseFloat(avgTax.toFixed(2)),
    discount: 0,
    dueDate: subscription.expirationDate,
    status: 'draft',
  });

  return invoice;
};

module.exports = { generateFromSubscription };
