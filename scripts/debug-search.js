const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm';

async function debugSearch() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const Flight = mongoose.model('Flight', new mongoose.Schema({}, { strict: false }));
    
    // Get MEX -> CUN flights
    const flights = await Flight.find({
      'departure.airport': 'MEX',
      'arrival.airport': 'CUN'
    }).lean();
    
    console.log(`Found ${flights.length} flights MEX -> CUN\n`);
    
    flights.forEach((f, i) => {
      console.log(`\n--- Flight ${i + 1} ---`);
      console.log('ID:', f._id);
      console.log('Airline:', f.airline);
      console.log('Flight Number:', f.flightNumber);
      console.log('Departure Airport:', f.departure.airport);
      console.log('Arrival Airport:', f.arrival.airport);
      console.log('Departure DateTime:', f.departure.dateTime);
      console.log('Status:', f.status);
      console.log('Classes:', f.classes?.length || 0);
    });
    
    // Test the exact query the API uses
    console.log('\n\n--- Testing API Query ---');
    const departureDate = '2026-01-28';
    const [year, month, day] = departureDate.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    
    console.log('Date Range:', {
      start: startOfDay.toISOString(),
      end: endOfDay.toISOString()
    });
    
    const apiQuery = {
      'departure.airport': 'MEX',
      'arrival.airport': 'CUN',
      'departure.dateTime': {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'available'
    };
    
    console.log('\nQuery:', JSON.stringify(apiQuery, null, 2));
    
    const apiResults = await Flight.find(apiQuery).lean();
    console.log(`\nAPI Query Results: ${apiResults.length} flights`);
    
    if (apiResults.length === 0) {
      console.log('\n❌ No results! Checking why...');
      
      // Check without date
      const withoutDate = await Flight.find({
        'departure.airport': 'MEX',
        'arrival.airport': 'CUN',
        status: 'available'
      }).lean();
      console.log(`Without date filter: ${withoutDate.length} flights`);
      
      // Check without status
      const withoutStatus = await Flight.find({
        'departure.airport': 'MEX',
        'arrival.airport': 'CUN',
        'departure.dateTime': {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).lean();
      console.log(`Without status filter: ${withoutStatus.length} flights`);
      
      // Check just date range
      const justDate = await Flight.find({
        'departure.dateTime': {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).lean();
      console.log(`Just date range: ${justDate.length} flights`);
      
      if (justDate.length > 0) {
        console.log('\nFlights in date range:');
        justDate.forEach(f => {
          console.log(`- ${f.departure.airport} -> ${f.arrival.airport} at ${f.departure.dateTime}`);
        });
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSearch();
