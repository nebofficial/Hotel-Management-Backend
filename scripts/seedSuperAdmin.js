const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('../config/database');
const { User } = require('../models');

// Load environment variables
dotenv.config();

const seedSuperAdmin = async () => {
  try {
    // Connect to PostgreSQL
    await connectDB();

    console.log('PostgreSQL Connected');

    // Check if super admin already exists (by email or name)
    const existingAdmin = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: 'super_admin@gmail.com' },
          { email: 'super_admin' },
          { name: 'super_admin' }
        ]
      }
    });
    
    if (existingAdmin) {
      console.log('Super admin already exists. Updating credentials...');
      
      // Update password and ensure correct email/name
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('pass123@', salt);
      existingAdmin.password = hashedPassword;
      existingAdmin.email = 'super_admin@gmail.com';
      existingAdmin.name = 'super_admin'; // Allow login with username "super_admin"
      existingAdmin.role = 'super_admin';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('Super admin credentials updated successfully!');
      console.log('Email: super_admin@gmail.com');
      console.log('Username: super_admin');
      console.log('Password: pass123@');
      await sequelize.close();
      process.exit(0);
    }

    // Create super admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pass123@', salt);

    const superAdmin = await User.create({
      email: 'super_admin@gmail.com',
      name: 'super_admin', // This allows login with username "super_admin"
      password: hashedPassword,
      role: 'super_admin',
      hotelId: null,
      isActive: true,
    });

    console.log('Super admin created successfully!');
    console.log('Email: super_admin@gmail.com');
    console.log('Username: super_admin');
    console.log('Password: pass123@');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedSuperAdmin();
