import { useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import { Map, List, AlertCircle } from "lucide-react";
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
import { cn } from "./lib/utils";

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

  // Mobile active tab: 'map' or 'list'
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");

  // Map coordinate picking state
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState<{ lat: number; lng: number } | null>(
    null
  );

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
    // On mobile, switch to map view so user can pick coordinates easily
    setMobileTab("map");
  };

  const handleMapClickCoordinates = (lat: number, lng: number) => {
    setPickedCoordinates({ lat, lng });
    setIsPickingLocation(false);
    setIsFormOpen(true);
    toast.success(`Location selected: [${lat}, ${lng}]`);
  };

  const handleFormSubmit = async (input: EntityInput) => {
    if (editingEntity) {
      await updateMutation.mutateAsync({ id: editingEntity.id, input });
      toast.success(`Entity "${input.name}" updated successfully.`);
    } else {
      const created = await createMutation.mutateAsync(input);
      setSelectedEntityId(created.id);
      toast.success(`Entity "${input.name}" created successfully.`);
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
      toast.success(`Entity "${deletingEntity.name}" deleted.`);
      setDeletingEntity(null);
    } catch {
      toast.error("Failed to delete entity. Please check your network.");
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col md:flex-row overflow-hidden bg-white dark:bg-zinc-950 font-sans">
      {/* Toast provider with Shadcn styling */}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs shadow-lg rounded-lg",
          duration: 3500,
        }}
      />

      {/* Backend connection banner if unreachable */}
      {fetchError && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Backend API offline at http://localhost:8080. Start the Go backend via: go run ./cmd/api
          </span>
        </div>
      )}

      {/* Sidebar: Visible always on desktop (md:block), or only when active tab is 'list' on mobile */}
      <div
        className={cn(
          "h-full md:block",
          mobileTab === "list" ? "block w-full" : "hidden md:block"
        )}
      >
        <EntityList
          entities={entities}
          selectedEntityId={selectedEntityId}
          onSelectEntity={(id) => {
            handleSelectEntity(id);
            // On mobile, switch to map view when entity is selected to see it on the map
            setMobileTab("map");
          }}
          onAddEntity={handleOpenAddForm}
          onEditEntity={handleOpenEditForm}
          onDeleteEntity={(entity) => setDeletingEntity(entity)}
          isLoading={isLoading}
        />
      </div>

      {/* Main Map View: Visible always on desktop, or only when active tab is 'map' on mobile */}
      <main
        className={cn(
          "flex-1 h-full relative",
          mobileTab === "map" ? "block w-full" : "hidden md:block"
        )}
      >
        <MapView
          entities={entities}
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelectEntity}
          onMapClickCoordinates={handleMapClickCoordinates}
          isPickingLocation={isPickingLocation}
        />

        {/* Mobile floating navigation switch (Map vs List) */}
        <div className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-full p-1 shadow-xl border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setMobileTab("map")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all min-h-[44px] min-w-[100px] justify-center cursor-pointer",
              mobileTab === "map"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
            )}
          >
            <Map className="w-4 h-4" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setMobileTab("list")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all min-h-[44px] min-w-[100px] justify-center cursor-pointer",
              mobileTab === "list"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
            )}
          >
            <List className="w-4 h-4" />
            <span>List ({entities.length})</span>
          </button>
        </div>
      </main>

      {/* Entity Create / Edit Dialog */}
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

      {/* Entity Detail Dialog */}
      <EntityDetailModal
        entity={selectedEntity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(entity) => handleOpenEditForm(entity)}
        onDelete={(entity) => setDeletingEntity(entity)}
      />

      {/* Delete Confirmation Dialog */}
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
