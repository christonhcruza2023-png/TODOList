const mongoose = require('mongoose');

const CATEGORIES = ['Personal', 'School', 'Work', 'Health', 'Shopping', 'Projects', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters.'],
    },
    category: {
      type: String,
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}.`,
      },
      default: 'Other',
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: `Priority must be one of: ${PRIORITIES.join(', ')}.`,
      },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: `Status must be one of: ${STATUSES.join(', ')}.`,
      },
      default: 'Pending',
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'tasks',
  }
);

// Supports the "today", "upcoming" and "completed" views.
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = { Task, CATEGORIES, PRIORITIES, STATUSES };
