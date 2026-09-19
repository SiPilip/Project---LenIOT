import { useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  useEntities,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
} from "./api/entities";
import type { Entity, EntityInput } from "./types/entity";
import { MapView } from "./components/map/MapView";
import { EntityList } from "./components/entity/EntityList";
import { EntityFormModal } from "./components/entity/EntityFormModal";
import { EntityDetailModal } from "./components/entity/EntityDetailModal";
import { DeleteConfirmModal } from "./components/entity/DeleteConfirmModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Dashboard() {
  const { data: entities = [], isLoading, error: fetchError } = useEntities();
  const createMutation = useCreateEntity();
  const updateMutation = useUpdateEntity();
  const deleteMutation = useDeleteEntity();

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deletingEntity, setDeletingEntity] = useState<Entity | null>(null);

  // Map coordinate picking state
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState<{ lat: number; lng: number } | null>(
    null
  );

  // Notification toast state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId) || null,
    [entities, selectedEntityId]
  );

  const handleSelectEntity = (id: string) => {
    setSelectedEntityId(id);
    setIsDetailOpen(true);
  };

  const handleOpenAddForm = () => {
    setEditingEntity(null);
    setPickedCoordinates(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (entity: Entity) => {
    setEditingEntity(entity);
    setPickedCoordinates(null);
    setIsFormOpen(true);
  };

  const handleStartPickLocation = () => {
    setIsFormOpen(false);
    setIsPickingLocation(true);
  };

  const handleMapClickCoordinates = (lat: number, lng: number) => {
    setPickedCoordinates({ lat, lng });
    setIsPickingLocation(false);
    setIsFormOpen(true);
    showNotification("success", `Coordinates selected: [${lat}, ${lng}]`);
  };

  const handleFormSubmit = async (input: EntityInput) => {
    if (editingEntity) {
      await updateMutation.mutateAsync({ id: editingEntity.id, input });
      showNotification("success", `Entity "${input.name}" updated successfully.`);
    } else {
      const created = await createMutation.mutateAsync(input);
      setSelectedEntityId(created.id);
      showNotification("success", `Entity "${input.name}" created successfully.`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntity) return;
    try {
      await deleteMutation.mutateAsync(deletingEntity.id);
      if (selectedEntityId === deletingEntity.id) {
        setSelectedEntityId(null);
        setIsDetailOpen(false);
      }
      showNotification("success", `Entity "${deletingEntity.name}" deleted.`);
      setDeletingEntity(null);
    } catch {
      showNotification("error", "Failed to delete entity.");
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col md:flex-row overflow-hidden bg-white dark:bg-zinc-950">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-xs font-medium border animate-in slide-in-from-top-4 duration-300 ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Connection warning banner if backend is unreachable */}
      {fetchError && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-amber-500 text-zinc-900 px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 shadow-md">
          <AlertCircle className="w-4 h-4" />
          <span>
            Unable to connect to backend API at http://localhost:8080. Make sure the Go backend is running.
          </span>
        </div>
      )}

      {/* Sidebar / Entity List */}
      <EntityList
        entities={entities}
        selectedEntityId={selectedEntityId}
        onSelectEntity={handleSelectEntity}
        onAddEntity={handleOpenAddForm}
        onEditEntity={handleOpenEditForm}
        onDeleteEntity={(entity) => setDeletingEntity(entity)}
        isLoading={isLoading}
      />

      {/* Main Map View */}
      <main className="flex-1 h-full relative">
        <MapView
          entities={entities}
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelectEntity}
          onMapClickCoordinates={handleMapClickCoordinates}
          isPickingLocation={isPickingLocation}
        />
      </main>

      {/* Entity Create / Edit Modal */}
      <EntityFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsPickingLocation(false);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingEntity}
        pickedCoordinates={pickedCoordinates}
        onStartPickLocation={handleStartPickLocation}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Entity Detail Modal */}
      <EntityDetailModal
        entity={selectedEntity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(entity) => handleOpenEditForm(entity)}
        onDelete={(entity) => setDeletingEntity(entity)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        entity={deletingEntity}
        isOpen={!!deletingEntity}
        onClose={() => setDeletingEntity(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
