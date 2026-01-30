const express = require('express');
const { Op } = require('sequelize');
const { auth, authorize } = require('../middleware/auth');
const PurchaseRate = require('../models/PurchaseRate');
const Arrival = require('../models/Arrival');
const User = require('../models/User');
const { Kunchinittu } = require('../models/Location');

const router = express.Router();

// Automatic kunchinittu average rate calculation function
// This calculates the rate based on DIRECT PURCHASES only
// Rates from shiftings are handled separately in the shifting approval logic
const calculateKunchinintuAverageRate = async (kunchinintuId) => {
  try {
    console.log(`🔄 Auto-calculating average rate for kunchinittu ${kunchinintuId}`);

    // Get kunchinittu
    const kunchinittu = await Kunchinittu.findByPk(kunchinintuId);
    if (!kunchinittu) {
      console.log(`⚠️ Kunchinittu ${kunchinintuId} not found`);
      return;
    }

    // Get all approved purchase records for this kunchinittu with rates
    // Use raw: false to ensure we get fresh data from database
    const purchaseRecords = await Arrival.findAll({
      where: {
        toKunchinintuId: kunchinintuId,
        movementType: 'purchase',
        status: 'approved',
        adminApprovedBy: { [Op.not]: null }
      },
      include: [
        {
          model: PurchaseRate,
          as: 'purchaseRate',
          attributes: ['totalAmount', 'averageRate'],
          required: true // Only include records that have rates
        }
      ],
      // Force fresh data from database, bypass any caching
      raw: false,
      nest: true
    });

    console.log(`📊 Found ${purchaseRecords.length} purchase records with rates for kunchinittu ${kunchinintuId}`);

    if (purchaseRecords.length === 0) {
      // No direct purchase records with rates
      // Check if kunchinittu already has a rate from previous shiftings
      if (kunchinittu.averageRate && kunchinittu.averageRate > 0) {
        console.log(`✅ Kunchinittu already has rate from previous shiftings: ₹${kunchinittu.averageRate}/Q - keeping it`);
        // Keep the existing rate, just update the calculation timestamp
        await kunchinittu.update({
          lastRateCalculation: new Date()
        });
        return;
      }

      // No records with rates and no existing rate, set average rate to 0
      await kunchinittu.update({
        averageRate: 0,
        lastRateCalculation: new Date()
      });
      console.log(`✅ Average rate set to 0 (no records with rates)`);
      return;
    }

    console.log(`🔍 Purchase records found:`, purchaseRecords.map(r => ({
      id: r.id,
      netWeight: r.netWeight,
      totalAmount: r.purchaseRate?.totalAmount,
      averageRate: r.purchaseRate?.averageRate,
      updatedAt: r.purchaseRate?.updatedAt,
      hasRate: !!r.purchaseRate
    })));

    // Calculate weighted average rate based on PURCHASES ONLY
    let totalAmount = 0;
    let totalWeight = 0;

    purchaseRecords.forEach(record => {
      const netWeight = parseFloat(record.netWeight || 0);
      const recordTotalAmount = parseFloat(record.purchaseRate.totalAmount || 0);

      totalAmount += recordTotalAmount;
      totalWeight += netWeight;
    });

    // Calculate average rate per 75kg (quintal)
    const averageRate = totalWeight > 0 ? (totalAmount / totalWeight) * 75 : 0;

    // Update kunchinittu with calculated average rate
    await kunchinittu.update({
      averageRate: parseFloat(averageRate.toFixed(2)),
      lastRateCalculation: new Date()
    });

    console.log(`✅ Auto-calculated average rate: ₹${averageRate.toFixed(2)}/Q for kunchinittu ${kunchinintuId}`);

  } catch (error) {
    console.error(`❌ Error calculating average rate for kunchinittu ${kunchinintuId}:`, error);
  }
};

// POST /api/purchase-rates - Create or update purchase rate (Manager/Admin only)
router.post('/', auth, authorize('manager', 'admin'), async (req, res) => {
  try {
    const {
      arrivalId,
      sute = 0,
      suteCalculationMethod = 'per_bag',
      baseRate,
      rateType,
      baseRateCalculationMethod = 'per_bag',
      h = 0,
      b = 0,
      bCalculationMethod,
      lf = 0,
      lfCalculationMethod,
      egb = 0,
      hCalculationMethod = 'per_bag'
    } = req.body;

    // Validate required fields
    if (!arrivalId || !baseRate || !rateType || !bCalculationMethod || !lfCalculationMethod || !hCalculationMethod) {
      return res.status(400).json({
        error: 'Missing required fields: arrivalId, baseRate, rateType, bCalculationMethod, lfCalculationMethod, hCalculationMethod'
      });
    }

    // Validate numeric values (h can be negative, others must be positive)
    const numericFields = { sute, baseRate, b, lf, egb };
    for (const [field, value] of Object.entries(numericFields)) {
      if (isNaN(parseFloat(value))) {
        return res.status(400).json({ error: `Invalid numeric value for ${field}` });
      }
      if (parseFloat(value) < 0) {
        return res.status(400).json({ error: `${field} must be a positive number` });
      }
    }

    // Validate h separately (can be negative)
    if (isNaN(parseFloat(h))) {
      return res.status(400).json({ error: 'Invalid numeric value for h (hamali)' });
    }

    // Validate rate type
    if (!['CDL', 'CDWB', 'MDL', 'MDWB'].includes(rateType)) {
      return res.status(400).json({ error: 'Invalid rate type. Must be CDL, CDWB, MDL, or MDWB' });
    }

    // Validate calculation methods
    if (!['per_bag', 'per_quintal'].includes(suteCalculationMethod)) {
      return res.status(400).json({ error: 'Invalid Sute calculation method' });
    }
    if (!['per_bag', 'per_quintal'].includes(bCalculationMethod)) {
      return res.status(400).json({ error: 'Invalid B calculation method' });
    }
    if (!['per_bag', 'per_quintal'].includes(lfCalculationMethod)) {
      return res.status(400).json({ error: 'Invalid LF calculation method' });
    }
    if (!['per_bag', 'per_quintal'].includes(hCalculationMethod)) {
      return res.status(400).json({ error: 'Invalid H calculation method' });
    }

    // Check if arrival exists and is a purchase record
    const arrival = await Arrival.findByPk(arrivalId);
    if (!arrival) {
      return res.status(404).json({ error: 'Purchase record not found' });
    }
    if (arrival.movementType !== 'purchase') {
      return res.status(400).json({ error: 'Rates can only be added to purchase records' });
    }

    // Get arrival data
    const bags = parseFloat(arrival.bags);
    const actualNetWeight = parseFloat(arrival.netWeight);
    const actualGrossWeight = parseFloat(arrival.grossWeight);

    // Parse input values
    const suteNum = parseFloat(sute);
    const baseRateNum = parseFloat(baseRate);
    const hNum = parseFloat(h);
    const bNum = parseFloat(b);
    const lfNum = parseFloat(lf);
    const egbNum = parseFloat(egb);

    // NEW CALCULATION LOGIC (Based on User Confirmation - Updated with Column Type Rules)
    // Column Type Rules:
    // CDL: EGB=Normal, LF=Normal, H=Normal (Added to total)
    // CDWB: EGB=0, LF=Normal, H=Normal (Added to total)
    // MDL: EGB=Normal, LF=0, H=Subtracted from total
    // MDWB: EGB=0, LF=0, H=Subtracted from total

    // 1. Calculate Sute Weight (Deduction in Kg)
    let suteWeightKg = 0;
    if (suteNum > 0) {
      if (suteCalculationMethod === 'per_bag') {
        suteWeightKg = suteNum * bags;
      } else {
        suteWeightKg = (actualNetWeight / 100) * suteNum;
      }
    }

    // 2. Sute Net Weight (Remaining weight after deduction)
    const suteNetWeight = actualNetWeight - suteWeightKg;

    // 3. Base Rate Amount (Calculated ONLY on Sute Net Weight)
    const baseDivisor = baseRateCalculationMethod === 'per_bag' ? 75 : 100;
    const baseRateAmount = (suteNetWeight / baseDivisor) * baseRateNum;

    let hAmount;
    if (hCalculationMethod === 'per_bag') {
      // Per actual bag: bags × h
      hAmount = bags * hNum;
    } else {
      // Per quintal: (original net weight ÷ 100) × h
      hAmount = (actualNetWeight / 100) * hNum;
    }

    // 4. B Calculation
    let bAmount;
    if (bCalculationMethod === 'per_bag') {
      // Per actual bag: bags × b
      bAmount = bags * bNum;
    } else {
      // Per quintal: (original net weight ÷ 100) × b
      bAmount = (actualNetWeight / 100) * bNum;
    }

    // 5. LF Calculation with column-type specific rules
    // MDL and MDWB: LF = 0 (no LF allowed)
    let effectiveLfNum = lfNum;
    if (['MDL', 'MDWB'].includes(rateType)) {
      effectiveLfNum = 0; // Force LF to 0 for MDL and MDWB
    }

    let lfAmount;
    if (lfCalculationMethod === 'per_bag') {
      // Per actual bag: bags × effectiveLfNum
      lfAmount = bags * effectiveLfNum;
    } else {
      // Per quintal: (original net weight ÷ 100) × lf
      lfAmount = (actualNetWeight / 100) * effectiveLfNum;
    }

    // 6. EGB Calculation with column-type specific rules
    // CDL and MDL: EGB = Normal (Bags × EGB)
    // CDWB and MDWB: EGB = 0 (no EGB allowed)
    const showEGB = ['CDL', 'MDL'].includes(rateType);
    const egbAmount = showEGB ? bags * egbNum : 0;

    // 7. Total Amount = Base Rate Amount (on Sute Net Weight) + Adjustments (on Original Weight)
    // For MDL and MDWB: H is SUBTRACTED from total (negative contribution)
    // For CDL and CDWB: H is ADDED to total (positive contribution)
    // Use Math.abs to ensure H is always treated as positive value, then negate for MDL/MDWB
    const hContribution = ['MDL', 'MDWB'].includes(rateType) ? -Math.abs(hAmount) : Math.abs(hAmount);
    const totalAmount = baseRateAmount + hContribution + bAmount + lfAmount + egbAmount;

    // 8. Average Rate Calculation (per 75kg)
    const averageRate = (totalAmount / actualNetWeight) * 75;

    // Two-line horizontal formula (Perfect compact format matching user request)
    let line1Parts = [];
    if (suteNum !== 0) {
      const unit = suteCalculationMethod === 'per_bag' ? 'b' : 'q';
      line1Parts.push(`${parseFloat(suteNum)}s/${unit}`);
    }
    const baseUnit = baseRateCalculationMethod === 'per_bag' ? 'b' : 'q';
    line1Parts.push(`+${parseFloat(baseRateNum)}${rateType}/${baseUnit}`);
    const line1 = line1Parts.join('  ');

    let line2Parts = [];
    if (hNum !== 0) {
      const unit = hCalculationMethod === 'per_bag' ? 'b' : 'q';
      line2Parts.push(`${hNum > 0 ? '+' : ''}${parseFloat(hNum)}h/${unit}`);
    }
    if (bNum !== 0) {
      const unit = bCalculationMethod === 'per_bag' ? 'b' : 'q';
      line2Parts.push(`${bNum > 0 ? '+' : ''}${parseFloat(bNum)}b/${unit}`);
    }
    if (effectiveLfNum !== 0) {
      const unit = lfCalculationMethod === 'per_bag' ? 'b' : 'q';
      line2Parts.push(`${effectiveLfNum > 0 ? '+' : ''}${parseFloat(effectiveLfNum)}lf/${unit}`);
    }
    if (showEGB && egbNum !== 0) {
      line2Parts.push(`${egbNum > 0 ? '+' : ''}${parseFloat(egbNum)}egb/b`);
    }
    const line2 = line2Parts.join('  ');

    const amountFormula = line1 + (line2 ? '\n' + line2 : '');

    // Check if rate already exists
    const existingRate = await PurchaseRate.findOne({ where: { arrivalId } });

    let purchaseRate;
    let created = false;

    if (existingRate) {
      // Update existing rate
      console.log(`📝 Updating existing rate for arrival ${arrivalId}`);
      console.log(`   Old Total Amount: ₹${existingRate.totalAmount}`);
      console.log(`   New Total Amount: ₹${parseFloat(totalAmount.toFixed(2))}`);
      
      await existingRate.update({
        sute: suteNum,
        suteCalculationMethod,
        baseRate: baseRateNum,
        rateType,
        baseRateCalculationMethod,
        h: hNum,
        hCalculationMethod,
        b: bNum,
        bCalculationMethod,
        lf: lfNum,
        lfCalculationMethod,
        egb: egbNum,
        amountFormula,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        averageRate: parseFloat(averageRate.toFixed(2)),
        updatedBy: req.user.userId
      });
      purchaseRate = existingRate;
      console.log(`✅ Rate updated successfully`);
    } else {
      // Create new rate
      console.log(`✨ Creating new rate for arrival ${arrivalId}`);
      purchaseRate = await PurchaseRate.create({
        arrivalId,
        sute: suteNum,
        suteCalculationMethod,
        baseRate: baseRateNum,
        rateType,
        baseRateCalculationMethod,
        h: hNum,
        hCalculationMethod,
        b: bNum,
        bCalculationMethod,
        lf: lfNum,
        lfCalculationMethod,
        egb: egbNum,
        amountFormula,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        averageRate: parseFloat(averageRate.toFixed(2)),
        createdBy: req.user.userId
      });
      created = true;
      console.log(`✅ Rate created successfully`);
    }

    // Fetch the complete record with associations
    const savedRate = await PurchaseRate.findOne({
      where: { arrivalId },
      include: [
        { model: User, as: 'creator', attributes: ['username', 'role'] },
        { model: User, as: 'updater', attributes: ['username', 'role'] }
      ]
    });

    // Automatically calculate and update kunchinittu average rate
    try {
      if (arrival.toKunchinintuId) {
        await calculateKunchinintuAverageRate(arrival.toKunchinintuId);
      }
    } catch (error) {
      console.error('Error updating kunchinittu average rate:', error);
      // Don't fail the main operation if average rate calculation fails
    }

    res.json({
      message: created ? 'Purchase rate created successfully' : 'Purchase rate updated successfully',
      purchaseRate: savedRate
    });
  } catch (error) {
    console.error('Create/update purchase rate error:', error);
    console.error('Error details:', error.message);
    console.error('Request body:', req.body);
    res.status(500).json({ error: error.message || 'Failed to save purchase rate' });
  }
});

// GET /api/purchase-rates/:arrivalId - Fetch purchase rate by arrival ID
router.get('/:arrivalId', auth, async (req, res) => {
  try {
    const { arrivalId } = req.params;

    const purchaseRate = await PurchaseRate.findOne({
      where: { arrivalId },
      include: [
        { model: User, as: 'creator', attributes: ['username', 'role'] },
        { model: User, as: 'updater', attributes: ['username', 'role'] }
      ]
    });

    res.json({ purchaseRate });
  } catch (error) {
    console.error('Fetch purchase rate error:', error);
    res.status(500).json({ error: 'Failed to fetch purchase rate' });
  }
});

module.exports = { router, calculateKunchinintuAverageRate };
