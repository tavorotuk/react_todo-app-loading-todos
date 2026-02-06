/* eslint-disable jsx-a11y/label-has-associated-control */
import './TodoItem.scss';

import React from 'react';
import classNames from 'classnames';
import { Todo } from '../../types/Todo';
import { Loader } from '../Loader';

interface Props {
  // Data
  todo: Todo;

  // State
  isEditing: boolean;
  isLoading: boolean;
  tempTitle: string; //? query

  // Actions (Handlers)
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; //? setEditQuery
  onEdit: (todo: Todo) => void; //? Double click
  onSubmit: (event: React.FormEvent) => void; //? Enter
  onCancel: () => void; //? Escape
  onSave: () => void; //? Blur
  onToggle: () => void; //? Checkbox
  onDelete: () => void; //? Cross button
}

export const TodoItem: React.FC<Props> = ({
  todo,
  isEditing,
  isLoading,
  tempTitle,
  onChange,
  onEdit,
  onSubmit,
  onCancel,
  onSave,
  onToggle,
  onDelete,
}) => {
  return (
    <>
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
            onChange={onToggle}
          />
        </label>

        {isEditing ? (
          <form onSubmit={onSubmit}>
            <input
              data-cy="TodoTitleField"
              type="text"
              className="todo__title-field"
              placeholder="Empty todo will be deleted"
              value={tempTitle}
              onChange={onChange}
              onBlur={onSave}
              onKeyUp={e => {
                if (e.key === 'Escape') {
                  onCancel();
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
              onDoubleClick={() => onEdit(todo)}
            >
              {todo.title}
            </span>

            <button
              type="button"
              className="todo__remove"
              data-cy="TodoDelete"
              onClick={onDelete}
            >
              ×
            </button>
          </>
        )}

        <Loader isLoading={isLoading} />
      </div>
    </>
  );
};
