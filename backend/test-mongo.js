require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI.substring(0, 60) + '...');

mongoose.connect(process.env.MONGO_URI, { 
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Connection Error:', err.message);
    console.log('Error Code:', err.codeName);
    process.exit(1);
  });
