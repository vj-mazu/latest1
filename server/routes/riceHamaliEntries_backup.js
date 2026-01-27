const express = require('express');
const { auth } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const router = express.Router();

// Get all rice hamali entries
router.get('/', auth, async (req, res) => {
  try {
    const { riceProductionId } = req.query;
    
    // Check if rice_hamali_entries table exists first
    const [tableExists] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'rice_hamali_entries'
    `);

    if (tableExists.length === 0) {
      console.log('⚠️ rice_hamali_entries table does not exist yet');
      return res.json({
        success: true,
        data: { entries: [] }
      });
    }
    
    let whereClause = 'WHERE rhe.is_active = true';
    const replacements = {};
    
    if (riceProductionId) {
      whereClause += ' AND rhe.rice_production_id = :riceProductionId';
      replacements.riceProductionId = riceProductionId;
    }

    const [entries] = await sequelize.query(`
      SELECT 
        rhe.id,
        rhe.rice_production_id,
        rhe.rice_hamali_rate_id,
        rhe.bags,
        rhe.remarks,
        rhe.created_at,
        rhe.updated_at,
        rhr.work_type,
        rhr.work_detail,
        rhr.rate_18_21,
        rhr.rate_21_24,
        rhr.rate_24_27,
        rp.date as production_date,
        rp."productType" as product_type,
        rp.bags as total_bags,
        u.username as created_by_username
      FROM rice_hamali_entries rhe
      LEFT JOIN rice_hamali_rates rhr ON rhe.rice_hamali_rate_id = rhr.id
      LEFT JOIN rice_productions rp ON rhe.rice_production_id = rp.id
      LEFT JOIN users u ON rhe.created_by = u.id
      ${whereClause}
      ORDER BY rhe.created_at DESC
    `, {
      replacements
    });

    res.json({
      success: true,
      data: { entries }
    });
  } catch (error) {
    console.error('Error fetching rice hamali entries:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch rice hamali entries' 
    });
  }
});

// Get rice hamali entries by rice production IDs (batch)
router.post('/batch', auth, async (req, res) => {
  try {
    const { riceProductionIds = [], stockMovementIds = [] } = req.body;
    
    if ((!riceProductionIds || riceProductionIds.length === 0) && 
        (!stockMovementIds || stockMovementIds.length === 0)) {
      return res.json({
        success: true,
        data: { entries: {} }
      });
    }

    // Check if rice_hamali_entries table exists first
    const [tableExists] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'rice_hamali_entries'
    `);

    if (tableExists.length === 0) {
      console.log('⚠️ rice_hamali_entries table does not exist yet');
      return res.json({
        success: true,
        data: { entries: {} }
      });
    }

    let allEntries = [];
    const groupedEntries = {};

    // Fetch entries for rice productions
    if (riceProductionIds.length > 0) {
      const prodPlaceholders = riceProductionIds.map((_, index) => `:prodId${index}`).join(',');
      const prodReplacements = {};
      riceProductionIds.forEach((id, index) => {
        prodReplacements[`prodId${index}`] = id;
      });

      const [prodEntries] = await sequelize.query(`
        SELECT 
          rhe.id,
          rhe.rice_production_id,
          rhe.rice_stock_movement_id,
          rhe.entry_type,
          rhe.rice_hamali_rate_id,
          rhe.bags,
          rhe.remarks,
          rhe.created_at,
          rhr.work_type,
          rhr.work_detail,
          rhr.rate_18_21,
          rhr.rate_21_24,
          rhr.rate_24_27,
          u.username as created_by_username,
          -- Extract worker name from remarks field
          CASE 
            WHEN rhe.remarks LIKE 'Worker: %' THEN 
              TRIM(SPLIT_PART(SPLIT_PART(rhe.remarks, 'Worker: ', 2), ',', 1))
            ELSE u.username
          END as worker_name,
          -- Add rice production details with variety and location
          rp."productType" as product_type,
          rp.date as production_date,
          rp."locationCode" as location_code,
          o.code as outturn_code,
          o."allottedVariety" as variety,
          p."brandName" as packaging_brand,
          p."allottedKg" as packaging_kg,
          -- Add movement type for display
          'production' as movement_type
        FROM rice_hamali_entries rhe
        LEFT JOIN rice_hamali_rates rhr ON rhe.rice_hamali_rate_id = rhr.id
        LEFT JOIN users u ON rhe.created_by = u.id
        LEFT JOIN rice_productions rp ON rhe.rice_production_id = rp.id
        LEFT JOIN outturns o ON rp."outturnId" = o.id
        LEFT JOIN packagings p ON rp."packagingId" = p.id
        WHERE rhe.rice_production_id IN (${prodPlaceholders}) AND rhe.is_active = true
        ORDER BY rhe.rice_production_id, rhe.created_at DESC
      `, {
        replacements: prodReplacements
      });

      // Group by rice production ID
      prodEntries.forEach(entry => {
        const key = entry.rice_production_id;
        if (!groupedEntries[key]) {
          groupedEntries[key] = [];
        }
        groupedEntries[key].push(entry);
      });
    }

    // Fetch entries for stock movements
    if (stockMovementIds.length > 0) {
      const movePlaceholders = stockMovementIds.map((_, index) => `:moveId${index}`).join(',');
      const moveReplacements = {};
      stockMovementIds.forEach((id, index) => {
        moveReplacements[`moveId${index}`] = id;
      });

      const [moveEntries] = await sequelize.query(`
        SELECT 
          rhe.id,
          rhe.rice_production_id,
          rhe.rice_stock_movement_id,
          rhe.entry_type,
          rhe.rice_hamali_rate_id,
          rhe.bags,
          rhe.remarks,
          rhe.created_at,
          rhr.work_type,
          rhr.work_detail,
          rhr.rate_18_21,
          rhr.rate_21_24,
          rhr.rate_24_27,
          u.username as created_by_username,
          -- Extract worker name from remarks field
          CASE 
            WHEN rhe.remarks LIKE 'Worker: %' THEN 
              TRIM(SPLIT_PART(SPLIT_PART(rhe.remarks, 'Worker: ', 2), ',', 1))
            ELSE u.username
          END as worker_name,
          -- Add stock movement details with proper variety and location
          rsm.movement_type as movement_type,
          rsm.variety as variety,
          rsm.location_code as location_code,
          rsm.date as movement_date,
          rsm.product_type as product_type,
          p."brandName" as packaging_brand,
          p."allottedKg" as packaging_kg,
          -- Add bill and lorry info for better identification
          rsm.bill_number as bill_number,
          rsm.lorry_number as lorry_number
        FROM rice_hamali_entries rhe
        LEFT JOIN rice_hamali_rates rhr ON rhe.rice_hamali_rate_id = rhr.id
        LEFT JOIN users u ON rhe.created_by = u.id
        LEFT JOIN rice_stock_movements rsm ON rhe.rice_stock_movement_id = rsm.id
        LEFT JOIN packagings p ON rsm."packagingId" = p.id
        WHERE rhe.rice_stock_movement_id IN (${movePlaceholders}) AND rhe.is_active = true
        ORDER BY rhe.rice_stock_movement_id, rhe.created_at DESC
      `, {
        replacements: moveReplacements
      });

      // Group by stock movement ID with "movement-" prefix to match frontend
      moveEntries.forEach(entry => {
        const key = `movement-${entry.rice_stock_movement_id}`;
        if (!groupedEntries[key]) {
          groupedEntries[key] = [];
        }
        groupedEntries[key].push(entry);
      });
    }

    res.json({
      success: true,
      data: { entries: groupedEntries }
    });
  } catch (error) {
    console.error('Error fetching rice hamali entries batch:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch rice hamali entries' 
    });
  }
});

// Bulk create rice hamali entries
router.post('/bulk', auth, async (req, res) => {
  try {
    const { riceProductionId, stockMovementId, movementType, isStockMovement, entries } = req.body;

    // Validate required fields
    if ((!riceProductionId && !stockMovementId) || !entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rice production ID or stock movement ID and entries array are required' 
      });
    }

    let totalBags = 0;
    let referenceId = null;

    if (isStockMovement && stockMovementId) {
      // Handle stock movement (Purchase/Sale/Palti)
      const [stockMovement] = await sequelize.query(`
        SELECT id, bags as total_bags FROM rice_stock_movements WHERE id = :stockMovementId
      `, {
        replacements: { stockMovementId }
      });

      if (stockMovement.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Stock movement not found'
        });
      }

      totalBags = stockMovement[0].total_bags;
      referenceId = stockMovementId;
      
      console.log('✅ Processing hamali for stock movement:', { stockMovementId, movementType, totalBags });
    } else {
      // Handle regular rice production
      const [riceProduction] = await sequelize.query(`
        SELECT id, bags as total_bags FROM rice_productions WHERE id = :riceProductionId
      `, {
        replacements: { riceProductionId }
      });

      if (riceProduction.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Rice production not found'
        });
      }

      totalBags = riceProduction[0].total_bags;
      referenceId = riceProductionId;
      
      console.log('✅ Processing hamali for rice production:', { riceProductionId, totalBags });
    }

    const transaction = await sequelize.transaction();
    
    try {
      const createdEntries = [];
      
      for (const entry of entries) {
        const { workType, workDetail, rate, bags, workerName, batchNumber } = entry;
        
        // Validate entry fields
        if (!workType || !workDetail || !rate || !bags) {
          throw new Error('Each entry must have workType, workDetail, rate, and bags');
        }
        
        // Find the rice hamali rate ID based on work type and detail
        const [rateResult] = await sequelize.query(`
          SELECT id FROM rice_hamali_rates 
          WHERE work_type = :workType AND work_detail = :workDetail AND is_active = true
          LIMIT 1
        `, {
          replacements: { workType, workDetail },
          transaction
        });

        if (rateResult.length === 0) {
          throw new Error(`Rice hamali rate not found for ${workType} - ${workDetail}`);
        }

        const riceHamaliRateId = rateResult[0].id;

        const [result] = await sequelize.query(`
          INSERT INTO rice_hamali_entries (
            rice_production_id, 
            rice_stock_movement_id,
            entry_type,
            rice_hamali_rate_id, 
            bags, 
            remarks,
            is_active,
            created_by
          ) VALUES (:riceProductionId, :stockMovementId, :entryType, :riceHamaliRateId, :bags, :remarks, true, :createdBy)
          RETURNING *
        `, {
          replacements: {
            riceProductionId: isStockMovement ? null : riceProductionId,
            stockMovementId: isStockMovement ? stockMovementId : null,
            entryType: isStockMovement ? movementType : 'production',
            riceHamaliRateId,
            bags,
            remarks: `${workerName ? `Worker: ${workerName}, ` : ''}${batchNumber ? `Batch: ${batchNumber}, ` : ''}${movementType ? `Type: ${movementType}, ` : ''}Rate: ₹${rate}`,
            createdBy: req.user.userId
          },
          transaction
        });
        
        createdEntries.push(result[0]);
      }
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: `${createdEntries.length} rice hamali entries created successfully`,
        data: { entries: createdEntries }
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error creating bulk rice hamali entries:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create rice hamali entries' 
    });
  }
});

// Add new rice hamali entry
router.post('/', auth, async (req, res) => {
  try {
    const {
      riceProductionId,
      riceHamaliRateId,
      bags,
      remarks
    } = req.body;

    // Validate required fields
    if (!riceProductionId || !riceHamaliRateId || !bags) {
      return res.status(400).json({
        success: false,
        error: 'Rice production ID, rice hamali rate ID, and bags are required'
      });
    }

    // Check if rice production exists
    const [riceProduction] = await sequelize.query(`
      SELECT id, bags as total_bags FROM rice_productions WHERE id = :riceProductionId
    `, {
      replacements: { riceProductionId }
    });

    if (riceProduction.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rice production not found'
      });
    }

    // Check if rice hamali rate exists
    const [riceHamaliRate] = await sequelize.query(`
      SELECT id FROM rice_hamali_rates WHERE id = :riceHamaliRateId AND is_active = true
    `, {
      replacements: { riceHamaliRateId }
    });

    if (riceHamaliRate.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rice hamali rate not found'
      });
    }

    // Validate bags don't exceed total
    if (bags > riceProduction[0].total_bags) {
      return res.status(400).json({
        success: false,
        error: `Bags cannot exceed total production bags (${riceProduction[0].total_bags})`
      });
    }

    const [result] = await sequelize.query(`
      INSERT INTO rice_hamali_entries 
      (rice_production_id, rice_hamali_rate_id, bags, remarks, created_by)
      VALUES (:riceProductionId, :riceHamaliRateId, :bags, :remarks, :createdBy)
      RETURNING *
    `, {
      replacements: {
        riceProductionId,
        riceHamaliRateId,
        bags,
        remarks: remarks || null,
        createdBy: req.user.userId
      }
    });

    res.json({
      success: true,
      message: 'Rice hamali entry added successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error adding rice hamali entry:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add rice hamali entry' 
    });
  }
});

// Update rice hamali entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { bags, remarks } = req.body;

    const [result] = await sequelize.query(`
      UPDATE rice_hamali_entries 
      SET 
        bags = :bags,
        remarks = :remarks,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = :id AND is_active = true
      RETURNING *
    `, {
      replacements: {
        id,
        bags,
        remarks
      }
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rice hamali entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Rice hamali entry updated successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error updating rice hamali entry:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update rice hamali entry' 
    });
  }
});

// Delete rice hamali entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await sequelize.query(`
      UPDATE rice_hamali_entries 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = :id
      RETURNING *
    `, {
      replacements: { id }
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rice hamali entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Rice hamali entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rice hamali entry:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete rice hamali entry' 
    });
  }
});

module.exports = router;