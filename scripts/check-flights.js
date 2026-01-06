const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm';

async function checkFlights() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Flight = mongoose.model('Flight', new mongoose.Schema({}, { strict: false }));
    
    const count = await Flight.countDocuments();
    console.log(`\n📊 Total flights in database: ${count}`);
    
    if (count > 0) {
      const flights = await Flight.find().limit(5).lean();
      console.log('\n🛫 Sample flights:');
      flights.forEach(f => {
        console.log(`- ${f.airline} ${f.flightNumber}: ${f.departure?.airport} → ${f.arrival?.airport} on ${f.departure?.dateTime}`);
      });
      
      // Check specific route
      const mexCun = await Flight.find({
        'departure.airport': 'MEX',
        'arrival.airport': 'CUN'
      }).lean();
      console.log(`\n🔍 MEX → CUN flights: ${mexCun.length}`);
      
      if (mexCun.length > 0) {
        console.log('Dates available:');
        mexCun.forEach(f => {
          console.log(`- ${new Date(f.departure.dateTime).toISOString().split('T')[0]}`);
        });
      }
    } else {
      console.log('\n❌ No flights found in database. Need to seed data.');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFlights();
