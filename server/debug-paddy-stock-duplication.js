const { Sequelize, Op } = require('sequelize');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import models
const { sequelize } = require('./config/database');
const Arrival = require('./models/Arrival');
const { Kunchinittu, Warehouse, Variety } = require('./models/Location');
const User = require('./models/User');
const Outturn = require('./models/Outturn');
const RiceProduction = require('./models/RiceProduction');

async function debugPaddyStockDuplication() {
  try {
    console.log('🔍 Debugging Paddy Stock Yesterday Bifurcation Duplication Issue\n');
    console.log('Specific Case: 300 bags entered on Jan 31st in KN1-W1');
    console.log('Expected: Show 300 bags once on Feb 1st bifurcation');
    console.log('Actual: Shows 300 bags TWICE (600 total)\n');

    // Check for the specific date mentioned: Jan 31, 2026
    const targetDate = '2026-01-31';
    const nextDay = '2026-02-01';

    console.log(`Checking transactions on ${targetDate}...\n`);

    // Get all transactions on Jan 31st
    const jan31Transactions = await Arrival.findAll({
      where: {
        date: targetDate,
        status: { [Op.in]: ['approved', 'admin-approved'] }
      },
      include: [
        { model: Kunchinittu, as: 'toKunchinittu', attributes: ['name', 'code'] },
        { model: Kunchinittu, as: 'fromKunchinittu', attributes: ['name', 'code'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['name', 'code'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    console.log(`📅 Transactions on ${targetDate}: ${jan31Transactions.length} total\n`);

    // Group by kunchinittu
    const byKunchinittu = {};
    jan31Transactions.forEach(txn => {
      const kunchinintuId = txn.toKunchinintuId || txn.fromKunchinintuId;
      const kunchinintuName = txn.toKunchinittu?.name || txn.fromKunchinittu?.name || 'Unknown';
      const kunchinintuCode = txn.toKunchinittu?.code || txn.fromKunchinittu?.code || 'Unknown';
      
      if (!byKunchinittu[kunchinintuId]) {
        byKunchinittu[kunchinintuId] = {
          name: kunchinintuName,
          code: kunchinintuCode,
          transactions: []
        };
      }
      
      byKunchinittu[kunchinintuId].transactions.push({
        id: txn.id,
        movementType: txn.movementType,
        variety: txn.variety,
        bags: txn.bags,
        direction: txn.toKunchinintuId == kunchinintuId ? 'INWARD' : 'OUTWARD',
        warehouse: txn.toWarehouse?.name || 'N/A'
      });
    });

    console.log('📊 Transactions grouped by Kunchinittu:\n');
    Object.entries(byKunchinittu).forEach(([id, data]) => {
      console.log(`  ${data.code} (${data.name}):`);
      data.transactions.forEach(txn => {
        console.log(`    - ID ${txn.id}: ${txn.direction} ${txn.bags} bags, ${txn.variety}, ${txn.movementType}`);
      });
      console.log('');
    });

    // Now check how this would appear in opening stock calculation
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Simulating Opening Stock Calculation for ${nextDay}`);
    console.log('='.repeat(80));

    // Simulate the openingStockDetailed calculation
    const openingStockDetailed = {};

    jan31Transactions.forEach(txn => {
      const variety = txn.variety || 'Unknown';
      const process = ''; // Assuming no process type for paddy
      const location = txn.toKunchinittu?.code || 'Unknown';
      const product = 'Paddy';
      const packaging = 'Standard';
      const bagSize = 100; // Assuming 100kg bags for paddy

      // Create key similar to Records.tsx logic
      const key = `${variety}|${process}|${location}|${product}|${packaging}|${bagSize}`;

      if (!openingStockDetailed[key]) {
        openingStockDetailed[key] = 0;
      }

      // Add inward
      if (txn.toKunchinintuId) {
        const qtls = parseFloat(txn.netWeight) || (parseInt(txn.bags) * bagSize / 100);
        openingStockDetailed[key] += qtls;
        console.log(`  ✅ INWARD: ${key} += ${qtls} qtls (${txn.bags} bags)`);
      }

      // Subtract outward (only normal shifting)
      if (txn.fromKunchinintuId && txn.movementType === 'shifting') {
        const qtls = parseFloat(txn.netWeight) || (parseInt(txn.bags) * bagSize / 100);
        openingStockDetailed[key] -= qtls;
        console.log(`  ❌ OUTWARD: ${key} -= ${qtls} qtls (${txn.bags} bags)`);
      }
    });

    console.log(`\n📦 Opening Stock Detailed (${Object.keys(openingStockDetailed).length} unique keys):\n`);
    Object.entries(openingStockDetailed).forEach(([key, qtls]) => {
      if (qtls > 0.01) {
        const bags = Math.round(qtls * 100 / 100); // Assuming 100kg bags
        console.log(`  ${key}: ${qtls.toFixed(2)} qtls (${bags} bags)`);
      }
    });

    // Check for duplicate keys
    const keyCount = {};
    Object.keys(openingStockDetailed).forEach(key => {
      const normalizedKey = key.toUpperCase();
      keyCount[normalizedKey] = (keyCount[normalizedKey] || 0) + 1;
    });

    const duplicateKeys = Object.entries(keyCount).filter(([key, count]) => count > 1);
    
    if (duplicateKeys.length > 0) {
      console.log(`\n⚠️  DUPLICATE KEYS DETECTED:`);
      duplicateKeys.forEach(([key, count]) => {
        console.log(`  - ${key}: appears ${count} times`);
      });
    } else {
      console.log(`\n✅ No duplicate keys in openingStockDetailed`);
    }

    // Check if the issue is in the bifurcationGroups creation
    console.log(`\n${'='.repeat(80)}`);
    console.log('Simulating bifurcationGroups Creation');
    console.log('='.repeat(80));

    const bifurcationGroups = {};
    let groupCreationCount = 0;

    Object.entries(openingStockDetailed).forEach(([key, qtls]) => {
      if (qtls > 0.01) {
        const [stockVariety, stockProcess, location, product, packaging, bagSize] = key.split('|');
        
        // Simulate the grouping key creation from Records.tsx
        const displayLocation = (location || '').toUpperCase();
        const displayPackaging = (packaging || '').toUpperCase();
        let displayVariety = (stockVariety || product || 'Paddy').toUpperCase();
        
        const bifurcationKey = `${displayVariety}|${stockProcess?.toUpperCase() || ''}|${displayLocation}|${product}|${displayPackaging}|${bagSize}`;
        
        groupCreationCount++;
        console.log(`  [${groupCreationCount}] Creating group with key: ${bifurcationKey}`);
        
        if (!bifurcationGroups[bifurcationKey]) {
          bifurcationGroups[bifurcationKey] = {
            variety: displayVariety,
            location: displayLocation,
            packaging: displayPackaging,
            qtls: 0,
            bags: 0,
            bagSizeKg: Number(bagSize) || 100
          };
          console.log(`      ✅ NEW GROUP created`);
        } else {
          console.log(`      ⚠️  GROUP ALREADY EXISTS - ACCUMULATING`);
        }
        
        bifurcationGroups[bifurcationKey].qtls += qtls;
        bifurcationGroups[bifurcationKey].bags += Math.round(qtls * 100 / (Number(bagSize) || 100));
        
        console.log(`      Current totals: ${bifurcationGroups[bifurcationKey].bags} bags, ${bifurcationGroups[bifurcationKey].qtls.toFixed(2)} qtls`);
      }
    });

    console.log(`\n📊 Final bifurcationGroups (${Object.keys(bifurcationGroups).length} groups):\n`);
    Object.entries(bifurcationGroups).forEach(([key, group]) => {
      console.log(`  ${group.variety} @ ${group.location}: ${group.bags} bags, ${group.qtls.toFixed(2)} qtls`);
    });

    // Check if any group has exactly 600 bags (300 x 2)
    const suspiciousDuplicates = Object.values(bifurcationGroups).filter(g => g.bags === 600);
    if (suspiciousDuplicates.length > 0) {
      console.log(`\n⚠️  FOUND SUSPICIOUS DUPLICATES (600 bags = 300 x 2):`);
      suspiciousDuplicates.forEach(g => {
        console.log(`  - ${g.variety} @ ${g.location}: ${g.bags} bags`);
      });
    }

    console.log('\n\n✅ Diagnostic complete');
    console.log('\n💡 Next Steps:');
    console.log('1. Check if openingStockDetailed has duplicate keys with different cases');
    console.log('2. Verify bifurcationGroups grouping logic is case-insensitive');
    console.log('3. Check if data is being processed multiple times in the loop');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugPaddyStockDuplication();
