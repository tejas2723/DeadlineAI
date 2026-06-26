const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a subtask title'],
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please associate this task with a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Task description cannot exceed 2000 characters'],
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'completed', 'overdue'],
      default: 'todo',
    },
    deadline: {
      type: Date,
      required: [true, 'Please add a deadline date'],
    },
    estimatedHours: {
      type: Number,
      default: 1,
      min: [0.5, 'Estimated hours must be at least 0.5'],
      max: [200, 'Estimated hours cannot exceed 200'],
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    subtasks: {
      type: [subtaskSchema],
      default: [],
    },
    aiSuggestion: {
      type: String,
      default: '',
    },
    deadlineEmailSent: {
      type: Boolean,
      default: false,
    },
    overdueEmailSent: {
      type: Boolean,
      default: false,
    },
    energy: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    cognitiveEffort: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for calculating days remaining until the deadline
taskSchema.virtual('daysUntilDeadline').get(function () {
  if (!this.deadline) return 0;
  const now = new Date();
  const diffTime = this.deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for calculating subtask completion progress
taskSchema.virtual('subtaskProgress').get(function () {
  const total = this.subtasks ? this.subtasks.length : 0;
  const completed = this.subtasks ? this.subtasks.filter(sub => sub.completed).length : 0;
  return { completed, total };
});

// Compound indexes for query optimization
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, deadline: 1 });
taskSchema.index({ user: 1, priority: 1 });

// Pre-save hook to automatically set completedAt when status changes to completed
taskSchema.pre('save', function () {
  if (this.isModified('status')) {
    if (this.status === 'completed') {
      this.completedAt = new Date();
    } else {
      this.completedAt = undefined;
    }
  }
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
