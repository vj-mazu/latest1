/**
 * Debug Purchase Rate Update and Kunchinittu Average Rate Recalculation
 * 
 * This script helps diagnose why kunchinittu average rates aren't updating
 * when purchase rates are edited.
 */

const { sequelize } = require('./config/database');
const { Op } = require('sequelize');
const PurchaseRate = require('./models/PurchaseRate');
const Arrival = require('./models/Arrival');
const { Kunchinittu } = require('./models/Location');

async function debugRateUpdate() {
  try {
    // Wait for associations to be set up
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('🔍 Debugging Purchase Rate Update Issue\n');
    console.log('='.repeat(80));

    // Step 1: Check what purchase data exists
    console.log('\n📋 Step 1: Checking purchase data in database...');
    
    // Check total purchase records
    const totalPurchases = await Arrival.count({
      where: { movementType: 'purchase' }
    });
    console.log(`   Total purchase records: ${totalPurchases}`);
    
    // Check approved purchases
    const approvedPurchases = await Arrival.count({
      where: {
        movementType: 'purchase',
        status: 'approved'
      }
    });
    console.log(`   Approved purchases: ${approvedPurchases}`);
    
    // Check admin-approved purchases
    const adminApprovedPurchases = await Arrival.count({
      where: {
        movementType: 'purchase',
        status: 'approved',
        adminApprovedBy: { [Op.not]: null }
      }
    });
    console.log(`   Admin-approved purchases: ${adminApprovedPurchases}`);
    
    // Check total purchase rates
    const totalRates = await PurchaseRate.count();
    console.log(`   Total purchase rates: ${totalRates}`);
    
    if (totalRates === 0) {
      console.log('\n❌ No purchase rates found in database');
      console.log('   This means no rates have been added to any purchase records yet.');
      return;
    }
    
    // Get purchase rates with their arrivals
    const ratesWithArrivals = await PurchaseRate.findAll({
      limit: 10,
      order: [['updatedAt', 'DESC']]
    });
    
    console.log(`\n📊 Found ${ratesWithArrivals.length} purchase rates (showing most recent):\n`);
    
    for (const rate of ratesWithArrivals) {
      const arrival = await Arrival.findByPk(rate.arrivalId);
      
      if (!arrival) {
        console.log(`   ⚠️  Rate ID ${rate.id}: Arrival ${rate.arrivalId} not found`);
        continue;
      }
      
      console.log(`   Rate ID: ${rate.id}`);
      console.log(`   Arrival ID: ${arrival.id}`);
      console.log(`   Date: ${new Date(arrival.date).toLocaleDateString('en-GB')}`);
      console.log(`   Status: ${arrival.status}`);
      console.log(`   Admin Approved: ${arrival.adminApprovedBy ? 'Yes' : 'No'}`);
      console.log(`   Kunchinittu ID: ${arrival.toKunchinintuId || 'None'}`);
      console.log(`   Total Amount: ₹${rate.totalAmount}`);
      console.log(`   Average Rate: ₹${rate.averageRate}/Q`);
      console.log(`   Updated: ${rate.updatedAt}`);
      console.log('');
    }
    
    // Now check kunchinittus
    console.log('\n📦 Checking Kunchinittus:\n');
    
    const kunchinittus = await Kunchinittu.findAll({
      limit: 5,
      order: [['id', 'ASC']]
    });
    
    for (const k of kunchinittus) {
      const purchaseCount = await Arrival.count({
        where: {
          toKunchinintuId: k.id,
          movementType: 'purchase',
          status: 'approved',
          adminApprovedBy: { [Op.not]: null }
        }
      });
      
      console.log(`   ${k.name} (ID: ${k.id})`);
      console.log(`   Average Rate: ₹${k.averageRate || 0}/Q`);
      console.log(`   Purchase Records: ${purchaseCount}`);
      console.log(`   Last Calculation: ${k.lastRateCalculation || 'Never'}`);
      console.log('');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Debug analysis complete\n');

  } catch (error) {
    console.error('❌ Error during debug:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the debug
debugRateUpdate();
