/**
 * MBD Sortable primitives — dnd-kit wrappers with Bloomberg styling.
 */

import { type ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── SortableList ───────────────────────────────────────────────────────────

interface SortableListProps {
  items: string[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SortableList({ items, onReorder, children, className, disabled }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

// ─── SortableItem ───────────────────────────────────────────────────────────

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
  showHandle?: boolean;
  disabled?: boolean;
}

export function SortableItem({ id, children, className, showHandle = true, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'shadow-lg shadow-orange-500/20 rounded',
        className,
      )}
      {...attributes}
    >
      <div className="flex items-center">
        {showHandle && !disabled && (
          <div
            {...listeners}
            className="shrink-0 cursor-grab active:cursor-grabbing px-1 text-gray-500 hover:text-orange-400 transition-colors touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
