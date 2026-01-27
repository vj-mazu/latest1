const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createDefaultUsers = async () => {
  try {
    // Check if users already exist
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('👥 Default users already exist');
      return;
    }

    // Create default users
    const defaultUsers = [
      {
        username: 'staff',
        password: await bcrypt.hash('staff123', 12),
        role: 'staff'
      },
      {
        username: 'rohit',
        password: await bcrypt.hash('rohit456', 12),
        role: 'manager'
      },
      {
        username: 'ashish',
        password: await bcrypt.hash('ashish789', 12),
        role: 'admin'
      }
    ];

    await User.bulkCreate(defaultUsers);
    console.log('✅ Default users created successfully');
    console.log('👤 Staff: username=staff, password=staff123');
    console.log('👤 Manager: username=rohit, password=rohit456');
    console.log('👤 Admin: username=ashish, password=ashish789');
  } catch (error) {
    console.error('❌ Error creating default users:', error);
  }
};

module.exports = createDefaultUsers;