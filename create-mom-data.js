// Create test data for mom in Cosmos DB
// Run this in Azure Portal Data Explorer or via Cosmos DB SDK

const testData = {
  // 1. Client data
  client: {
    "id": "mom",
    "clientId": "mom",
    "type": "client", 
    "name": "Äiti",
    "displayName": "Kultaseni",
    "timezone": "Europe/Helsinki",
    "language": "fi",
    "createdAt": "2025-09-09T12:00:00Z",
    "settings": {
      "smsEnabled": true,
      "smsCount": 4,
      "weatherLocation": "Helsinki",
      "reminderTimes": ["08:00", "12:00", "16:00", "20:00"]
    }
  },

  // 2. Photos (3 pieces)
  photos: [
    {
      "id": "photo_mom_001",
      "clientId": "mom",
      "type": "photo",
      "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", 
      "caption": "Kaunis järvimaisema",
      "isActive": true,
      "uploadedAt": "2025-09-09T12:00:00Z"
    },
    {
      "id": "photo_mom_002",
      "clientId": "mom", 
      "type": "photo",
      "url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
      "caption": "Syksy metsässä", 
      "isActive": true,
      "uploadedAt": "2025-09-09T12:00:00Z"
    },
    {
      "id": "photo_mom_003",
      "clientId": "mom",
      "type": "photo", 
      "url": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400",
      "caption": "Auringonlasku",
      "isActive": true,
      "uploadedAt": "2025-09-09T12:00:00Z"
    }
  ],

  // 3. Today's foods (4 meals)
  foods: [
    {
      "id": "food_mom_breakfast_20250909",
      "clientId": "mom",
      "type": "food",
      "mealTime": "breakfast",
      "timeSlot": "08:00", 
      "date": "2025-09-09",
      "suggestions": ["Kaurapuuro marjojen kanssa 🫐", "Voileipä juustolla ☕"],
      "encouragingMessage": "Hyvää huomenta kultaseni! ☀️",
      "completed": false
    },
    {
      "id": "food_mom_lunch_20250909", 
      "clientId": "mom",
      "type": "food",
      "mealTime": "lunch",
      "timeSlot": "12:00",
      "date": "2025-09-09",
      "suggestions": ["Lohikeitto ja leipää 🍲", "Salaatti ja voileipä 🥗"],
      "encouragingMessage": "Lounas aika rakas! 💚",
      "completed": false
    },
    {
      "id": "food_mom_dinner_20250909",
      "clientId": "mom",
      "type": "food", 
      "mealTime": "dinner",
      "timeSlot": "16:00",
      "date": "2025-09-09", 
      "suggestions": ["Lihapullat perunoiden kanssa 🥔", "Broileriwokki 🍚"],
      "encouragingMessage": "Päivällinen aika! 🍽️",
      "completed": false
    },
    {
      "id": "food_mom_evening_20250909",
      "clientId": "mom",
      "type": "food",
      "mealTime": "evening",
      "timeSlot": "20:00", 
      "date": "2025-09-09",
      "suggestions": ["Jogurtti ja mysli 🥣", "Tee ja keksejä 🍪"],
      "encouragingMessage": "Mukava iltapala! 🌙", 
      "completed": false
    }
  ],

  // 4. Medications (2 daily)
  medications: [
    {
      "id": "med_mom_morning_20250909",
      "clientId": "mom", 
      "type": "medication",
      "name": "Muistilääke",
      "dosage": "1 tabletti",
      "timeSlot": "morning",
      "time": "08:00",
      "date": "2025-09-09",
      "instructions": "Aamulla ruoan kanssa",
      "completed": false,
      "recurring": true
    },
    {
      "id": "med_mom_evening_20250909",
      "clientId": "mom",
      "type": "medication", 
      "name": "Verenpainelääke",
      "dosage": "1 tabletti", 
      "timeSlot": "evening",
      "time": "20:00",
      "date": "2025-09-09",
      "instructions": "Illalla vedellä",
      "completed": false,
      "recurring": true
    }
  ],

  // 5. Upcoming appointments 
  appointments: [
    {
      "id": "apt_mom_20250912_001",
      "clientId": "mom",
      "type": "appointment",
      "title": "Lääkärin vastaanotto", 
      "description": "Muista lääkkeet ja henkilökortti mukaan",
      "date": "2025-09-12",
      "time": "14:00",
      "location": "Terveysasema Kamppi",
      "reminderBefore": 60
    },
    {
      "id": "apt_mom_20250915_001", 
      "clientId": "mom",
      "type": "appointment",
      "title": "Hiustenleikkaus",
      "description": "Kampaamo Sirkka", 
      "date": "2025-09-15",
      "time": "10:30",
      "location": "Kampaamo Sirkka",
      "reminderBefore": 30
    }
  ]
};

// Instructions:
console.log('=== COSMOS DB DATA IMPORT INSTRUCTIONS ===');
console.log('1. Go to Azure Portal → Cosmos DB → Data Explorer');
console.log('2. Select ReminderAppDB database');
console.log('3. For each container, click "New Item" and paste the JSON:');
console.log('');

console.log('CLIENTS CONTAINER:');
console.log(JSON.stringify(testData.client, null, 2));
console.log('');

console.log('PHOTOS CONTAINER (add 3 items):');
testData.photos.forEach((photo, i) => {
  console.log(`Photo ${i+1}:`);
  console.log(JSON.stringify(photo, null, 2));
  console.log('');
});

console.log('FOODS CONTAINER (add 4 items):');
testData.foods.forEach((food, i) => {
  console.log(`Food ${i+1} (${food.mealTime}):`);
  console.log(JSON.stringify(food, null, 2)); 
  console.log('');
});

console.log('MEDICATIONS CONTAINER (add 2 items):');
testData.medications.forEach((med, i) => {
  console.log(`Medication ${i+1}:`);
  console.log(JSON.stringify(med, null, 2));
  console.log('');
});

console.log('APPOINTMENTS CONTAINER (add 2 items):');
testData.appointments.forEach((apt, i) => {
  console.log(`Appointment ${i+1}:`);
  console.log(JSON.stringify(apt, null, 2));
  console.log('');
});

console.log('=== AFTER IMPORT ===');
console.log('Test API: GET https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom');
console.log('Expected: "storage": "cosmos", dailyPhotoUrl with image, dailyTasks with 6 items (4 foods + 2 meds)');
