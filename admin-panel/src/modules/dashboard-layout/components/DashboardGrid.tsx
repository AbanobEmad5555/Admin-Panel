"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AdminLanguage } from "@/modules/localization/types";
import type { DashboardModuleRecord } from "@/modules/dashboard-layout/types/dashboardLayout.types";
import DashboardModuleCard from "@/modules/dashboard-layout/components/DashboardModuleCard";

type DashboardGridProps = {
  modules: DashboardModuleRecord[];
  language: AdminLanguage;
  isSaving: boolean;
  onReorder: (activeId: DashboardModuleRecord["moduleId"], overId: DashboardModuleRecord["moduleId"]) => void;
};

type SortableDashboardCardProps = {
  module: DashboardModuleRecord;
  language: AdminLanguage;
  isSaving: boolean;
  disableNavigation: boolean;
};

function SortableDashboardCard({
  module,
  language,
  isSaving,
  disableNavigation,
}: SortableDashboardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: module.moduleId,
    disabled: isSaving,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <DashboardModuleCard
        module={module}
        language={language}
        isDragging={isDragging}
        isSaving={isSaving}
        disableNavigation={disableNavigation || isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
}

export default function DashboardGrid({
  modules,
  language,
  isSaving,
  onReorder,
}: DashboardGridProps) {
  const [isNavigationLocked, setIsNavigationLocked] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const ids = useMemo(() => modules.map((module) => module.moduleId), [modules]);

  useEffect(() => {
    if (!isNavigationLocked) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsNavigationLocked(false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [isNavigationLocked]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setIsNavigationLocked(true);

    if (!over || active.id === over.id) {
      return;
    }

    onReorder(
      String(active.id) as DashboardModuleRecord["moduleId"],
      String(over.id) as DashboardModuleRecord["moduleId"]
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <SortableDashboardCard
              key={module.moduleId}
              module={module}
              language={language}
              isSaving={isSaving}
              disableNavigation={isNavigationLocked}
            />
          ))}
        </section>
      </SortableContext>
    </DndContext>
  );
}
