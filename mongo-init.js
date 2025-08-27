// MongoDB initialization script
db = db.getSiblingDB('mern-lms');

// Create collections
db.createCollection('users');
db.createCollection('courses');
db.createCollection('enrollments');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

db.courses.createIndex({ "educator": 1 });
db.courses.createIndex({ "category": 1 });
db.courses.createIndex({ "isPublished": 1 });
db.courses.createIndex({ "title": "text", "description": "text", "tags": "text" });

db.enrollments.createIndex({ "student": 1, "course": 1 }, { unique: true });
db.enrollments.createIndex({ "student": 1 });
db.enrollments.createIndex({ "course": 1 });

print('MongoDB initialized successfully');
