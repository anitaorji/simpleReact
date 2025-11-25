import React, { useState, useEffect } from 'react';
import '../css/Tasks.css';
import '../css/TaskCompleted.css'

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7035/api';

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const res = await fetch(`${apiUrl}/tasks`);
                if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
                const data = await res.json();
                if (mounted) {
                    setTasks(data);
                    localStorage.setItem('tasks', JSON.stringify(data));
                    setError(null);
                }
            } catch (err) {
                const stored = JSON.parse(localStorage.getItem('tasks')) || [];
                if (mounted) {
                    setTasks(stored);
                    setError('Could not load from API; using localStorage.');
                }
                console.warn('Tasks load failed, falling back to localStorage:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, [apiUrl]);

    const handleAdd = async (e) => {
        e.preventDefault();
        const text = newTask.trim();
        if (!text) return;
        const payload = { title: text, isCompleted: false };
        try {
            const res = await fetch(`${apiUrl}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('POST failed');
            const saved = await res.json();
            const updated = [...tasks, saved];
            setTasks(updated);
            localStorage.setItem('tasks', JSON.stringify(updated));
        } catch (err) {
            const updated = [...tasks, { id: Date.now(), title: text, isCompleted: false }];
      setTasks(updated);
            localStorage.setItem('tasks', JSON.stringify(updated));
            console.warn('Add task failed to save to API, stored locally instead:', err);
        } finally {
            setNewTask('');
        }
    };
    return (
        <div className="tasks-container">
            <h2>Task Manager</h2>
            {loading && <p>Loading tasks...</p>}
            {error && <p style={{ color: 'orange' }}>{error}</p>}
            <form onSubmit={handleAdd}>
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Enter a new task"
                    required
                />
                <button type="submit">Add Task</button>
            </form>

            <TaskList tasks={tasks} setTasks={setTasks} apiUrl={apiUrl} /> 
        </div>
    );

    function TaskList({ tasks, setTasks, apiUrl }) {
    const toggleComplete = async (id) => {
        const updatedTasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task));
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));

        try {
            const toggled = updatedTasks.find((t) => t.id === id);
            await fetch(`${apiUrl}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: toggled.completed }),
            });
        } catch (err) {
            console.warn('Failed to sync toggle to API:', err);
        }
    };

    return (
        <ul className="task-list">
            {tasks.map((task) => (
                <li key={task.id} className={task.isCompleted ? 'completed' : ''}>
                    <span onClick={() => toggleComplete(task.id)}>{task.title}</span>
                </li>
            ))}
        </ul>
    );
}
};







export default Tasks;