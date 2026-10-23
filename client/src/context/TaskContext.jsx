import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { tasksApi } from '../services/api';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [revision, setRevision] = useState(0);
  const [modal, setModal] = useState(null);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  const createTask = useCallback(
    async (payload) => {
      const response = await tasksApi.create(payload);
      refresh();
      return response.data;
    },
    [refresh]
  );

  const updateTask = useCallback(
    async (id, payload) => {
      const response = await tasksApi.update(id, payload);
      refresh();
      return response.data;
    },
    [refresh]
  );

  const deleteTask = useCallback(
    async (id) => {
      await tasksApi.remove(id);
      refresh();
    },
    [refresh]
  );

  const toggleStatus = useCallback(
    async (task) => {
      const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      const response = await tasksApi.updateStatus(task._id, nextStatus);
      refresh();
      return response.data;
    },
    [refresh]
  );

  const openCreate = useCallback(() => setModal({ type: 'create' }), []);
  const openEdit = useCallback((task) => setModal({ type: 'edit', task }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const value = useMemo(
    () => ({
      revision,
      refresh,
      createTask,
      updateTask,
      deleteTask,
      toggleStatus,
      modal,
      openCreate,
      openEdit,
      closeModal,
    }),
    [
      revision,
      refresh,
      createTask,
      updateTask,
      deleteTask,
      toggleStatus,
      modal,
      openCreate,
      openEdit,
      closeModal,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskStore() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskStore must be used within a TaskProvider');
  return context;
}
