import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createLocation, deleteLocation, getLocations, updateLocation } from "@/services/locationService";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { PageHeader } from "@/shared/components/PageHeader";
import { Pagination } from "@/shared/components/Pagination";
import { TableSkeleton } from "@/shared/components/TableSkeleton";
import { LOCATION_TYPES, type LocationItem, type LocationPayload, type LocationType } from "@/types/location";
import { getApiErrorMessage } from "@/utils/apiError";
import { LocationFormDialog } from "./LocationFormDialog";

const PAGE_SIZE = 8;

export default function LocationsPage() {
    const { t } = useTranslation(["location", "common"]);
    const queryClient = useQueryClient();
    const [placeType, setPlaceType] = useState<LocationType | "">("");
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<LocationItem | null>(null);
    const [deleting, setDeleting] = useState<LocationItem | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-locations", page, placeType],
        queryFn: () => getLocations({ page, size: PAGE_SIZE, placeType: placeType || undefined }),
    });

    // Xóa mềm xong thì Nearby cũng phải bỏ địa điểm đó, nên làm mới cả hai query.
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
        queryClient.invalidateQueries({ queryKey: ["nearby-locations"] });
    };
    const onError = (error: unknown) => {
        toast.error(getApiErrorMessage(error, t("admin.toast.failed")));
    };

    const createMutation = useMutation({
        mutationFn: createLocation,
        onSuccess: () => {
            toast.success(t("admin.toast.created"));
            setFormOpen(false);
            invalidate();
        },
        onError,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<LocationPayload> }) => updateLocation(id, payload),
        onSuccess: () => {
            toast.success(t("admin.toast.updated"));
            setFormOpen(false);
            invalidate();
        },
        onError,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLocation,
        onSuccess: () => {
            toast.success(t("admin.toast.deleted"));
            setDeleting(null);
            invalidate();
        },
        onError,
    });

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (location: LocationItem) => {
        setEditing(location);
        setFormOpen(true);
    };

    const handleTypeChange = (value: LocationType | "") => {
        setPlaceType(value);
        setPage(1);
    };

    const locations = data?.data ?? [];
    const totalPages = data?.totalPages ?? 1;
    const total = data?.total ?? 0;

    return (
        <div>
            <PageHeader
                breadcrumb={[t("common:admin"), t("admin.title")]}
                title={t("admin.title")}
                description={t("admin.description")}
                action={
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        {t("admin.create")}
                    </Button>
                }
            />

            <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                        aria-label={t("page.typeLabel")}
                        value={placeType}
                        onChange={(event) => handleTypeChange(event.target.value as LocationType | "")}
                        className="w-full sm:w-48"
                    >
                        <option value="">{t("allTypes")}</option>
                        {LOCATION_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {t(`type.${type}`)}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            {isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>{t("admin.columns.name")}</TableHead>
                                <TableHead>{t("admin.columns.address")}</TableHead>
                                <TableHead>{t("admin.columns.type")}</TableHead>
                                <TableHead>{t("admin.columns.rating")}</TableHead>
                                <TableHead>{t("admin.columns.price")}</TableHead>
                                <TableHead className="text-right">{t("admin.columns.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={6} />
                            ) : (
                                locations.map((location) => (
                                    <TableRow key={location.id}>
                                        <TableCell className="font-semibold">{location.name}</TableCell>
                                        <TableCell className="max-w-xs text-muted-foreground">{location.address}</TableCell>
                                        <TableCell>
                                            {location.placeType ? (
                                                <Badge variant="lightgreen">{t(`type.${location.placeType}`)}</Badge>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell>{location.rating ?? "—"}</TableCell>
                                        <TableCell>{location.priceLevel ? "$".repeat(location.priceLevel) : "—"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openEdit(location)}>
                                                    <Pencil className="h-4 w-4" />
                                                    {t("admin.actions.edit")}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setDeleting(location)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    {t("admin.actions.delete")}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && locations.length === 0 && (
                        <EmptyState
                            icon={MapPin}
                            title={t("admin.empty.title")}
                            description={placeType ? t("common:emptySearch") : t("admin.empty.description")}
                            action={
                                placeType ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            handleTypeChange("");
                                        }}
                                    >
                                        {t("common:clearFilter")}
                                    </Button>
                                ) : (
                                    <Button onClick={openCreate}>{t("admin.create")}</Button>
                                )
                            }
                        />
                    )}

                    {!isLoading && locations.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    <strong className="text-dark">{total}</strong>
                                </span>
                                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                            </div>
                        </div>
                    )}
                </>
            )}

            <LocationFormDialog
                open={formOpen}
                location={editing}
                loading={createMutation.isPending || updateMutation.isPending}
                onSubmit={(payload) => {
                    if (editing) updateMutation.mutate({ id: editing.id, payload });
                    else createMutation.mutate(payload);
                }}
                onClose={() => setFormOpen(false)}
            />

            <ConfirmDialog
                open={deleting !== null}
                title={`${t("admin.actions.delete")}?`}
                description={t("admin.confirmDelete", { name: deleting?.name })}
                confirmLabel={t("admin.actions.delete")}
                destructive
                loading={deleteMutation.isPending}
                onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
                onClose={() => setDeleting(null)}
            />
        </div>
    );
}
