import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Entity } from "../types/entity";

export type ModalType = "none" | "create" | "edit" | "detail" | "delete";

interface MapContextType {
  center: [number, number]; // [lng, lat]
  zoom: number;
  selectedEntityId: string | null;
  isPickingLocation: boolean;
  pickedCoordinates: { lat: number; lng: number } | null;
  activeModal: ModalType;
  editingEntity: Entity | null;
  deletingEntity: Entity | null;
  detailEntity: Entity | null;
  mobileTab: "map" | "list";

  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  selectEntity: (id: string | null) => void;
  startPickingLocation: () => void;
  finishPickingLocation: (lat: number, lng: number) => void;
  cancelPickingLocation: () => void;
  openCreateModal: () => void;
  openEditModal: (entity: Entity) => void;
  openDetailModal: (entity: Entity) => void;
  openDeleteModal: (entity: Entity) => void;
  closeModal: () => void;
  setMobileTab: (tab: "map" | "list") => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

// Default center in Indonesia (South Sumatra / Palembang)
const DEFAULT_CENTER: [number, number] = [104.7565, -2.9835];
const DEFAULT_ZOOM = 7;

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);
  const [pickedCoordinates, setPickedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<Entity | null>(null);
  const [detailEntity, setDetailEntity] = useState<Entity | null>(null);
  const [mobileTab, setMobileTab] = useState<"map" | "list">("map");

  const selectEntity = useCallback((id: string | null) => {
    setSelectedEntityId(id);
  }, []);

  const startPickingLocation = useCallback(() => {
    setActiveModal("none");
    setIsPickingLocation(true);
    setMobileTab("map");
  }, []);

  const finishPickingLocation = useCallback((lat: number, lng: number) => {
    setPickedCoordinates({ lat, lng });
    setIsPickingLocation(false);
    setActiveModal(editingEntity ? "edit" : "create");
  }, [editingEntity]);

  const cancelPickingLocation = useCallback(() => {
    setIsPickingLocation(false);
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingEntity(null);
    setPickedCoordinates(null);
    setActiveModal("create");
  }, []);

  const openEditModal = useCallback((entity: Entity) => {
    setEditingEntity(entity);
    setPickedCoordinates(null);
    setActiveModal("edit");
  }, []);

  const openDetailModal = useCallback((entity: Entity) => {
    setDetailEntity(entity);
    setSelectedEntityId(entity.id);
    setActiveModal("detail");
  }, []);

  const openDeleteModal = useCallback((entity: Entity) => {
    setDeletingEntity(entity);
    setActiveModal("delete");
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal("none");
  }, []);

  const value = useMemo(
    () => ({
      center,
      zoom,
      selectedEntityId,
      isPickingLocation,
      pickedCoordinates,
      activeModal,
      editingEntity,
      deletingEntity,
      detailEntity,
      mobileTab,
      setCenter,
      setZoom,
      selectEntity,
      startPickingLocation,
      finishPickingLocation,
      cancelPickingLocation,
      openCreateModal,
      openEditModal,
      openDetailModal,
      openDeleteModal,
      closeModal,
      setMobileTab,
    }),
    [
      center,
      zoom,
      selectedEntityId,
      isPickingLocation,
      pickedCoordinates,
      activeModal,
      editingEntity,
      deletingEntity,
      detailEntity,
      mobileTab,
      selectEntity,
      startPickingLocation,
      finishPickingLocation,
      cancelPickingLocation,
      openCreateModal,
      openEditModal,
      openDetailModal,
      openDeleteModal,
      closeModal,
    ]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export function useMapContext(): MapContextType {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}
