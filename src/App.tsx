/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */

// #region IMPORTS
// -------------------------------------------------------------------------
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { UserWarning } from './UserWarning';
import { Todo } from './types/Todo';
import { FilterType } from './types/FilterType';
import {
  createTodo,
  deleteTodo,
  getTodos,
  updateTodo,
  USER_ID,
} from './api/todos';
// -------------------------------------------------------------------------
// #endregion IMPORTS

export const App: React.FC = () => {
  // #region STATE
  // -------------------------------------------------------------------------
  // Data State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  // UI & Status State
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Filter State
  const [filterBy, setFilterBy] = useState<FilterType>(FilterType.All);

  // Form & Editing State
  const [title, setTitle] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editQuery, setEditQuery] = useState('');
  // -------------------------------------------------------------------------
  // #endregion STATE

  // #region DERIVED VARIABLES
  // -------------------------------------------------------------------------
  const activeTodosCount = todos.filter(todo => !todo.completed).length;
  const completedTodosCount = todos.filter(todo => todo.completed).length;

  const visibleTodos = todos.filter(todo => {
    switch (filterBy) {
      case FilterType.Active:
        return !todo.completed;
      case FilterType.Completed:
        return todo.completed;
      case FilterType.All:
      default:
        return true;
    }
  });
  // -------------------------------------------------------------------------
  // #endregion DERIVED VARIABLES

  // #region LIFECYCLE & EFFECTS
  // -------------------------------------------------------------------------
  function loadTodos() {
    getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
      });
  }

  // Initial Load
  useEffect(() => {
    loadTodos();
  }, []);

  // Error Message Timer
  useEffect(() => {
    if (errorMessage) {
      const timer = window.setTimeout(() => {
        setErrorMessage('');
      }, 3000);

      return () => window.clearTimeout(timer);
    }
  }, [errorMessage]);
  // -------------------------------------------------------------------------
  // #endregion LIFECYCLE & EFFECTS

  // #region HANDLERS
  // -------------------------------------------------------------------------

  // --- General Handlers ---
  const handleClearError = () => {
    setErrorMessage('');
  };

  // --- Create Handlers ---
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Title should not be empty');

      return;
    }

    setTempTodo({
      id: 0,
      title: title,
      userId: USER_ID,
      completed: false,
    }); // fake Todo

    createTodo(title.trim())
      .then((newTodo) => {
        setTodos(currentTodos => [...currentTodos, newTodo]);
        setTitle('');
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
      })
      .finally(() => {
        setTempTodo(null);
      });
  };

  // --- Delete Handlers ---
  const handleDeleteTodo = (todoId: number) => {
    setProcessingIds(currentIds => [...currentIds, todoId]);

    deleteTodo(todoId)
      .then(() => {
        setTodos(currentTodos => currentTodos
          .filter(todo => todo.id !== todoId)
        );
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
      })
      .finally(() => {
        setProcessingIds(currentIds => currentIds
          .filter(id => id !== todoId));
      });
  };

  const handleClearCompletedTodos = async () => {
    const completedTodos = todos.filter(todo => todo.completed);
    const idsToDelete = completedTodos.map(todo => todo.id);

    setProcessingIds(currentIds => [...currentIds, ...idsToDelete]);

    idsToDelete.map(async (id) => {
      try {
        await deleteTodo(id);
        setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));
      } catch {
        setErrorMessage('Unable to delete a todo');
      } finally {
        setProcessingIds(currentIds => currentIds.filter(pId => pId !== id));
      }
    });
  };

  // --- Update & Toggle Handlers ---
  const handleUpdateTodo = (todoId: number, data: Partial<Todo>) => {
    setProcessingIds(currentIds => [...currentIds, todoId]);

    updateTodo(todoId, data)
      .then(updatedTodo => {
        setTodos(currentTodos => currentTodos.map(todo =>
          todo.id === todoId ? updatedTodo : todo
        ));
      })
      .catch(() => {
        setErrorMessage('Unable to update a todo');
      })
      .finally(() => {
        setProcessingIds(currentIds => currentIds.filter(id => id !== todoId));
      });
  };

  const handleToggleAll = () => {
    const shouldBeCompleted = activeTodosCount > 0;
    const todosToUpdate = todos.filter(todo =>
      shouldBeCompleted !== todo.completed);
    const idsToUpdate = todosToUpdate.map(todo => todo.id);

    if (idsToUpdate.length === 0) {
      return;
    }

    setProcessingIds(currentIds => [...currentIds, ...idsToUpdate]);

    idsToUpdate.forEach(id => {
      updateTodo(id, { completed: shouldBeCompleted })
        .then(updatedTodo => {
          setTodos(currentTodos => currentTodos.map(todo =>
            todo.id === id ? updatedTodo : todo
          ));
        })
        .catch(() => {
          setErrorMessage('Unable to update a todo');
        })
        .finally(() => {
          setProcessingIds(currentIds => currentIds.filter(pId => pId !== id));
        });
    });
  };

  // --- Edit Handlers ---
  const handleEdit = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditQuery(todo.title);
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setEditQuery('');
  };

  const handleSaveEdit = (todoId: number) => {
    if (editingTodoId !== todoId) {
      return;
    }

    const trimmedTitle = editQuery.trim();

    if (!trimmedTitle) {
      handleDeleteTodo(todoId);
      setEditingTodoId(null);

      return;
    }

    const currentTodo = todos.find(t => t.id === todoId);

    if (currentTodo && currentTodo.title === trimmedTitle) {
      handleCancelEdit();

      return;
    }

    handleUpdateTodo(todoId, { title: trimmedTitle });
    setEditingTodoId(null);
  };

  // -------------------------------------------------------------------------
  // #endregion HANDLERS

  // #region RENDER
  // -------------------------------------------------------------------------
  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            data-cy="ToggleAllButton"
            className={classNames(
              'todoapp__toggle-all', {
                'active': activeTodosCount === 0 && todos.length > 0
              }
            )}
            onClick={handleToggleAll}
          />

          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={title}
              onChange={event => setTitle(event.target.value)}
              autoFocus
              disabled={!!tempTodo}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {visibleTodos.map(todo => (
            <div
              data-cy="Todo"
              className={classNames('todo', {
                completed: todo.completed,
              })}
              key={todo.id}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                  onChange={() => handleUpdateTodo(
                    todo.id,
                    { completed: !todo.completed }
                  )}
                />
              </label>

              {editingTodoId === todo.id ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSaveEdit(todo.id);
                  }}
                >
                  <input
                    data-cy="TodoTitleField"
                    type="text"
                    className="todo__title-field"
                    placeholder="Empty todo will be deleted"
                    value={editQuery}
                    onChange={(e) => setEditQuery(e.target.value)}
                    onBlur={() => handleSaveEdit(todo.id)}
                    onKeyUp={(e) => {
                      if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    autoFocus
                  />
                </form>
              ) : (
                <>
                  <span
                    data-cy="TodoTitle"
                    className="todo__title"
                    onDoubleClick={() => handleEdit(todo)}
                  >
                    {todo.title}
                  </span>

                  <button
                    type="button"
                    className="todo__remove"
                    data-cy="TodoDelete"
                    onClick={() => handleDeleteTodo(todo.id)}
                  >
                    ×
                  </button>
                </>
              )}

              <div
                data-cy="TodoLoader"
                className={classNames(
                  "modal overlay", {
                    "is-active": processingIds.includes(todo.id),
                  }
                )}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}
          {tempTodo && (
            <div
              data-cy="Todo"
              className="todo"
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                />
              </label>
              <span data-cy="TodoTitle" className="todo__title">
                {tempTodo.title}
              </span>
              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
              >
                ×
              </button>
              <div data-cy="TodoLoader" className="modal overlay is-active">
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          )}
        </section>

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {activeTodosCount} items left
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                data-cy="FilterLinkAll"
                className={classNames(
                  "filter__link",
                  {
                    selected: filterBy === FilterType.All
                  }
                )}
                onClick={() => setFilterBy(FilterType.All)}
              >
                All
              </a>

              <a
                href="#/active"
                data-cy="FilterLinkActive"
                className={classNames(
                  "filter__link",
                  {
                    selected: filterBy === FilterType.Active
                  }
                )}
                onClick={() => setFilterBy(FilterType.Active)}
              >
                Active
              </a>

              <a
                href="#/completed"
                data-cy="FilterLinkCompleted"
                className={classNames(
                  "filter__link",
                  {
                    selected: filterBy === FilterType.Completed
                  }
                )}
                onClick={() => setFilterBy(FilterType.Completed)}
              >
                Completed
              </a>
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={completedTodosCount === 0}
              onClick={handleClearCompletedTodos}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          {
            'hidden': errorMessage.length === 0,
          },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={handleClearError}
        />
        {errorMessage}
      </div>
    </div>
  );
  // -------------------------------------------------------------------------
  // #endregion RENDER

};
