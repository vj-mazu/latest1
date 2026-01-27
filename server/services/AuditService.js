const BalanceAuditTrail = require('../models/BalanceAuditTrail');

/**
 * Log rate transfer for audit purposes
 * @param {Object} data - Rate transfer data
 * @param {number} data.arrivalId - The arrival/shifting ID
 * @param {number} data.sourceKunchinintuId - Source kunchinittu ID
 * @param {number} data.destKunchinintuId - Destination kunchinittu ID
 * @param {number} data.sourceRate - Source kunchinittu average rate
 * @param {number} data.shiftedQuantity - Shifted quantity in quintals
 * @param {number} data.previousDestRate - Previous destination average rate
 * @param {number} data.newDestRate - New destination average rate
 * @param {Date} data.timestamp - Timestamp of rate transfer
 * @param {number} data.performedBy - User ID who performed the action
 * @returns {Promise<void>}
 */
async function logRateTransfer(data) {
  try {
    await BalanceAuditTrail.create({
      kunchinintuId: data.destKunchinintuId,
      transactionId: data.arrivalId,
      actionType: 'recalculation',
      previousBalance: {
        bags: 0, // Not tracking bags in rate transfer
        netWeight: 0,
        averageRate: data.previousDestRate
      },
      newBalance: {
        bags: 0,
        netWeight: 0,
        averageRate: data.newDestRate
      },
      balanceChange: {
        bags: 0,
        netWeight: 0,
        averageRate: data.newDestRate - data.previousDestRate
      },
      performedBy: data.performedBy,
      performedAt: data.timestamp,
      remarks: `Rate transfer from kunchinittu ${data.sourceKunchinintuId}`,
      metadata: {
        rateTransfer: true,
        sourceKunchinintuId: data.sourceKunchinintuId,
        sourceRate: data.sourceRate,
        shiftedQuantity: data.shiftedQuantity,
        previousDestRate: data.previousDestRate,
        newDestRate: data.newDestRate
      }
    });
    
    console.log(`✅ Rate transfer logged for kunchinittu ${data.destKunchinintuId}`);
  } catch (error) {
    console.error('Error logging rate transfer:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

module.exports = {
  logRateTransfer
};
