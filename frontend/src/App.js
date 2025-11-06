import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:8080/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo'
  });

  // Carrega as tarefas quando o componente monta
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erro ao carregar tarefas');
      const data = await response.json();
      setTasks(data || []);
    } catch (err) {
      setError('Não foi possível carregar as tarefas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingTask) {
        // Atualiza tarefa existente
        const response = await fetch(`${API_URL}/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Erro ao atualizar tarefa');
      } else {
        // Cria nova tarefa
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Erro ao criar tarefa');
      }

      // Reseta o formulário
      setFormData({ title: '', description: '', status: 'todo' });
      setShowForm(false);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao excluir tarefa');
      fetchTasks();
    } catch (err) {
      setError('Erro ao excluir tarefa');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status
    });
    setShowForm(true);
  };

  const handleMove = async (task, newStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, status: newStatus })
      });
      if (!response.ok) throw new Error('Erro ao mover tarefa');
      fetchTasks();
    } catch (err) {
      setError('Erro ao mover tarefa');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', status: 'todo' });
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Kanban - Gerenciador de Tarefas</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          {showForm ? 'Cancelar' : '+ Nova Tarefa'}
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Carregando...</div>}

      {showForm && (
        <div className="task-form">
          <h2>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Digite o título da tarefa"
              />
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="todo">A Fazer</option>
                <option value="progress">Em Progresso</option>
                <option value="done">Concluída</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
              </button>
              <button type="button" className="btn-secondary" onClick={cancelForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="kanban-board">
        <Column
          title="A Fazer"
          status="todo"
          tasks={filterTasksByStatus('todo')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMove={handleMove}
        />
        <Column
          title="Em Progresso"
          status="progress"
          tasks={filterTasksByStatus('progress')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMove={handleMove}
        />
        <Column
          title="Concluídas"
          status="done"
          tasks={filterTasksByStatus('done')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      </div>
    </div>
  );
}

function Column({ title, status, tasks, onEdit, onDelete, onMove }) {
  return (
    <div className="column">
      <div className="column-header">
        <h2>{title}</h2>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div className="column-content">
        {tasks.length === 0 ? (
          <p className="empty-message">Nenhuma tarefa aqui</p>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onMove }) {
  const getNextStatus = () => {
    if (task.status === 'todo') return 'progress';
    if (task.status === 'progress') return 'done';
    return null;
  };
  const getPrevStatus = () => {
    if (task.status === 'done') return 'progress';
    if (task.status === 'progress') return 'todo';
    return null;
  };
  const nextStatus = getNextStatus();
  const prevStatus = getPrevStatus();

  return (
    <div className="task-card">
      <div className="task-header">
        <h3>{task.title}</h3>
      </div>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <div className="task-actions">
        <button 
          className="btn-icon" 
          onClick={() => onEdit(task)}
          title="Editar"
        >
          ✏️{/* Ícone de lápis */}
        </button>
        {prevStatus && (
          <button 
            className="btn-icon" 
            onClick={() => onMove(task, prevStatus)}
            title="Mover para trás"
          >
            ⬅️{/* Ícone de seta para esquerda */}
          </button>
        )}
        {nextStatus && (
          <button 
            className="btn-icon" 
            onClick={() => onMove(task, nextStatus)}
            title="Mover para frente"
          >
            ➡️{/* Ícone de seta para direita */}
          </button>
        )}
        <button 
          className="btn-icon btn-delete"
          onClick={() => onDelete(task.id)}
          title="Excluir"
        >
          🗑️{/* Ícone de lixeira */}
        </button>
      </div>
    </div>
  );

<div className="footer">
  <p>
    &copy; 2025 Josevan Oliveira — Projeto realizado como desafio de recrutamento para Veritas Consultoria.
  </p>
</div>

}


export default App;
