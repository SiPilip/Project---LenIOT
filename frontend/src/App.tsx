import { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import { Map, List, AlertCircle } from "lucide-react";
import {
  useEntities,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
} from "./api/entities";
import type { EntityInput } from "./types/entity";
import { MapView } from "./components/map/MapView";
import { EntityList } from "./components/entity/EntityList";
import { EntityFormModal } from "./components/entity/EntityFormModal";
import { EntityDetailModal } from "./components/entity/EntityDetailModal";
import { DeleteConfirmModal } from "./components/entity/DeleteConfirmModal";
import { MapProvider, useMapContext } from "./context/MapContext";
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

  const {
    selectedEntityId,
    selectEntity,
    isPickingLocation,
    pickedCoordinates,
    startPickingLocation,
    finishPickingLocation,
    activeModal,
    editingEntity,
    deletingEntity,
    detailEntity,
    openCreateModal,
    openEditModal,
    openDetailModal,
    openDeleteModal,
    closeModal,
    mobileTab,
    setMobileTab,
  } = useMapContext();

  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId) || null,
    [entities, selectedEntityId]
  );

  const handleSelectEntity = (id: string | null) => {
    selectEntity(id);
  };

  const handleFormSubmit = async (input: EntityInput) => {
    if (editingEntity) {
      await updateMutation.mutateAsync({ id: editingEntity.id, input });
      toast.success(`Entity "${input.name}" updated successfully.`);
    } else {
      const created = await createMutation.mutateAsync(input);
      selectEntity(created.id);
      toast.success(`Entity "${input.name}" created successfully.`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntity) return;
    try {
      await deleteMutation.mutateAsync(deletingEntity.id);
      if (selectedEntityId === deletingEntity.id) {
        selectEntity(null);
      }
      toast.success(`Entity "${deletingEntity.name}" deleted.`);
      closeModal();
    } catch {
      toast.error("Failed to delete entity. Please check your network connection.");
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col md:flex-row overflow-hidden bg-brand-50 font-sans text-zinc-900">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "border border-brand-200 bg-white text-zinc-900 text-xs shadow-lg rounded-lg font-sans",
          duration: 3500,
        }}
      />

      {/* Backend connection notification banner */}
      {fetchError && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Backend API offline at http://localhost:8080. Start the Go backend via: go run ./cmd/api
          </span>
        </div>
      )}

      {/* Sidebar / Entity List */}
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
            // On mobile, switch to map view when entity is selected
            setMobileTab("map");
          }}
          onAddEntity={openCreateModal}
          onEditEntity={openEditModal}
          onDeleteEntity={openDeleteModal}
          isLoading={isLoading}
        />
      </div>

      {/* Map View */}
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
          onOpenDetail={openDetailModal}
          onOpenEdit={openEditModal}
          onMapClickCoordinates={(lat, lng) => {
            finishPickingLocation(lat, lng);
            toast.success(`Coordinates selected: [${lat}, ${lng}]`);
          }}
          isPickingLocation={isPickingLocation}
        />

        {/* Mobile floating view switch (Map vs List) */}
        <div className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center bg-white/95 backdrop-blur-md rounded-full p-1 shadow-xl border border-brand-200">
          <button
            onClick={() => setMobileTab("map")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all min-h-11 min-w-25 justify-center cursor-pointer",
              mobileTab === "map"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-zinc-600 hover:text-brand-900"
            )}
          >
            <Map className="w-4 h-4" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setMobileTab("list")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all min-h-11 min-w-25 justify-center cursor-pointer",
              mobileTab === "list"
                ? "bg-brand-600 text-white shadow-sm"
                : "text-zinc-600 hover:text-brand-900"
            )}
          >
            <List className="w-4 h-4" />
            <span>List ({entities.length})</span>
          </button>
        </div>
      </main>

      {/* Entity Create / Edit Modal */}
      <EntityFormModal
        isOpen={activeModal === "create" || activeModal === "edit"}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        initialData={editingEntity}
        pickedCoordinates={pickedCoordinates}
        onStartPickLocation={startPickingLocation}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Entity Detail Modal */}
      <EntityDetailModal
        entity={detailEntity || selectedEntity}
        isOpen={activeModal === "detail"}
        onClose={closeModal}
        onEdit={(entity) => openEditModal(entity)}
        onDelete={(entity) => openDeleteModal(entity)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        entity={deletingEntity}
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapProvider>
        <Dashboard />
      </MapProvider>
    </QueryClientProvider>
  );
}
