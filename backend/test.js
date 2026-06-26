require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');

const runTest = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Cleanup existing test user/tasks
    console.log('Cleaning up existing test data...');
    await User.deleteMany({ email: 'test@example.com' });
    
    // Create test user
    console.log('Creating test user...');
    const user = new User({
      name: 'Test Hackathon User',
      email: 'test@example.com',
      password: 'password123',
      preferences: {
        workHoursPerDay: 10,
        aiTone: 'motivational',
        reminderEnabled: true,
      },
    });

    const savedUser = await user.save();
    console.log('User saved successfully! (Notice password is hidden in toJSON):', savedUser);

    // Test password matching
    // Retrieve user with password explicitly selected since select: false is set
    const userWithPassword = await User.findById(savedUser._id).select('+password');
    const isMatch = await userWithPassword.matchPassword('password123');
    console.log(`Password match verification: ${isMatch ? '✅ Success' : '❌ Failed'}`);

    // Create test task linked to user
    console.log('Creating test task linked to user...');
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 3); // 3 days from now

    const task = new Task({
      user: savedUser._id,
      title: 'Implement AI prioritization endpoint',
      description: 'Call Gemini 2.5 Pro API and score all tasks',
      priority: 'high',
      status: 'todo',
      deadline: deadlineDate,
      estimatedHours: 4,
      tags: ['hackathon', 'backend', 'gemini'],
      subtasks: [
        { title: 'Read API documentation', completed: true },
        { title: 'Write geminiService.js wrapper', completed: false },
        { title: 'Write integration test', completed: false },
      ],
    });

    const savedTask = await task.save();
    console.log('Task saved successfully:', savedTask);

    // Verify virtuals and status completedAt hook
    console.log('\n--- Virtual Fields Verification ---');
    console.log(`Task title: ${savedTask.title}`);
    console.log(`Days until deadline: ${savedTask.daysUntilDeadline} days`); // Expected: 3
    console.log(`Subtask progress: completed=${savedTask.subtaskProgress.completed}, total=${savedTask.subtaskProgress.total}`); // Expected: 1/3
    console.log('------------------------------------\n');

    // Test completedAt automatic set hook
    console.log('Updating task status to completed...');
    savedTask.status = 'completed';
    const updatedTask = await savedTask.save();
    console.log(`Task status is now: ${updatedTask.status}`);
    console.log(`completedAt date stamp: ${updatedTask.completedAt}`); // Expected: current time stamp

    // Clean up database
    console.log('Cleaning up test data from DB...');
    await Task.deleteMany({ user: savedUser._id });
    await User.findByIdAndDelete(savedUser._id);

    console.log('Closing database connection...');
    await mongoose.connection.close();
    console.log('Verification test complete!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

runTest();
