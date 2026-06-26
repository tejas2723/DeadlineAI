import { useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/**
 * Custom hook for task data management.
 */
const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tasks listing matching filters
  const fetchTasks = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/tasks', { params: filters });
      setTasks(res.data.tasks);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new task
  const createTask = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/tasks', data);
      toast.success('Task created successfully!');
      setTasks((prev) => [res.data.task, ...prev]);
      return res.data.task;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing task details
  const updateTask = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/tasks/${id}`, data);
      toast.success('Task updated successfully!');
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data.task : t)));
      return res.data.task;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted successfully!');
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle subtask completed status
  const toggleSubtask = async (taskId, subtaskId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/tasks/${taskId}/subtask/${subtaskId}`);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
      return res.data.task;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle subtask');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch task completion counts and aggregate stats
  const getStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/tasks/stats');
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generate Gemini suggestion for a task
  const suggestForTask = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/ai/suggest/${id}`);
      toast.success('Gemini advice loaded!');
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data.task : t)));
      return res.data.task;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI suggestion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    tasks,
    setTasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    suggestForTask,
    getStats,
  };
};

export default useTasks;
