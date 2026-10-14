import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { formatDateLocale } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/apiError";
import { useListParams } from "@/hooks/useListParams";
import { getUsers, restoreUser, suspendUser } from "@/services/adminUserService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { PageHeader } from "@/shared/components/PageHeader";
import { Pagination } from "@/shared/components/Pagination";
import { TableSkeleton } from "@/shared/components/TableSkeleton";
import type { AdminUser, UserStatus } from "@/types/user";
import { Ban, RefreshCcw, Search, Shield, User } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const USER_STATUSES: UserStatus[] = ["created", "activated", "deactivated", "suspended"];

export default function UsersPage() {
    const { t } = useTranslation("admin");
    const queryClient = useQueryClient();
    const { page, q, status, debouncedQ, setQ, setStatus, setPage, clearFilters } = useListParams();
    const [confirm, setConfirm] = useState<{ type: "suspend" | "restore"; user: AdminUser } | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["admin-users", page - 1, debouncedQ, status],
        queryFn: () =>
            getUsers({
                page: page - 1,
                size: PAGE_SIZE,
                status: status || undefined,
            }),
        placeholderData: keepPreviousData,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });

    // BE trả 409 kèm lý do (đã khóa rồi / chưa bị khóa) — hiện nguyên văn thay vì câu chung.
    const onError = (fallback: string) => (error: unknown) => {
        toast.error(getApiErrorMessage(error, fallback));
    };

    const suspendMutation = useMutation({
        mutationFn: suspendUser,
        onSuccess: () => {
            toast.success(t("users.toast.suspended"));
            setConfirm(null);
            invalidate();
        },
        onError: onError(t("users.toast.suspendFailed")),
    });

    const restoreMutation = useMutation({
        mutationFn: restoreUser,
        onSuccess: () => {
            toast.success(t("users.toast.restored"));
            setConfirm(null);
            invalidate();
        },
        onError: onError(t("users.toast.restoreFailed")),
    });

    const handleConfirm = () => {
        if (!confirm) return;
        if (confirm.type === "suspend") suspendMutation.mutate(confirm.user.id);
        else restoreMutation.mutate(confirm.user.id);
    };

    const filteredUsers =
        data?.data.filter(
            (user) =>
                user.username.toLowerCase().includes(debouncedQ.toLowerCase()) ||
                user.email.toLowerCase().includes(debouncedQ.toLowerCase()),
        ) ?? [];

    const hasFilter = q !== "" || status !== "";

    return (
        <div>
            <PageHeader
                breadcrumb={[t("common:admin"), t("users.title")]}
                title={t("users.title")}
                description={t("users.description")}
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-sm sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder={t("users.searchPlaceholder")}
                        aria-label={t("users.searchLabel")}
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                </div>
                <Select className="sm:w-52" aria-label={t("users.filterLabel")} value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">{t("users.allStatuses")}</option>
                    {USER_STATUSES.map((value) => (
                        <option key={value} value={value}>
                            {t(`users.status.${value}`)}
                        </option>
                    ))}
                </Select>
            </div>

            {isError ? (
                <ErrorState onRetry={() => refetch()} />
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>{t("users.column.username")}</TableHead>
                                <TableHead>{t("users.column.email")}</TableHead>
                                <TableHead>{t("users.column.role")}</TableHead>
                                <TableHead>{t("users.column.status")}</TableHead>
                                <TableHead>{t("users.column.createdAt")}</TableHead>
                                <TableHead className="text-right">{t("users.column.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton columns={6} />
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                                <Shield className="mr-1 h-3 w-3" />
                                                {t(`users.role.${user.role}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={user.status} />
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDateLocale(user.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                {user.status === "suspended" ? (
                                                    <Button size="sm" variant="outline" onClick={() => setConfirm({ type: "restore", user })}>
                                                        <RefreshCcw className="h-4 w-4" />
                                                        {t("users.action.unlock")}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setConfirm({ type: "suspend", user })}
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                        {t("users.action.lock")}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {!isLoading && filteredUsers.length === 0 && (
                        <EmptyState
                            icon={User}
                            title={t("users.empty.title")}
                            description={t(hasFilter ? "users.empty.filtered" : "users.empty.all")}
                            action={
                                <Button variant="outline" onClick={hasFilter ? clearFilters : () => refetch()}>
                                    {t(hasFilter ? "common:clearFilter" : "users.empty.reload")}
                                </Button>
                            }
                        />
                    )}

                    {data && data.totalPages > 1 && (
                        <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
                    )}
                </>
            )}

            <ConfirmDialog
                open={confirm !== null}
                title={t(confirm?.type === "suspend" ? "users.confirm.lockTitle" : "users.confirm.unlockTitle")}
                description={t(confirm?.type === "suspend" ? "users.confirm.lockDescription" : "users.confirm.unlockDescription", {
                    username: confirm?.user.username ?? "",
                })}
                confirmLabel={t(confirm?.type === "suspend" ? "users.confirm.lockConfirm" : "users.confirm.unlockConfirm")}
                destructive={confirm?.type === "suspend"}
                loading={suspendMutation.isPending || restoreMutation.isPending}
                onConfirm={handleConfirm}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}

const STATUS_VARIANT: Record<UserStatus, Parameters<typeof Badge>[0]["variant"]> = {
    created: "outline",
    activated: "default",
    deactivated: "secondary",
    suspended: "destructive",
};

function StatusBadge({ status }: { status: UserStatus }) {
    const { t } = useTranslation("admin");
    return <Badge variant={STATUS_VARIANT[status]}>{t(`users.status.${status}`)}</Badge>;
}
