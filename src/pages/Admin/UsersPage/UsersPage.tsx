import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/utils/formatDate";
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
import type { AdminUser, UserRole, UserStatus } from "@/types/user";
import { Ban, RefreshCcw, Search, Shield, User } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<UserStatus, string> = {
    created: "Đã tạo",
    activated: "Hoạt động",
    deactivated: "Đã vô hiệu hóa",
    suspended: "Đã khóa",
};

const ROLE_LABEL: Record<UserRole, string> = {
    ADMIN: "Quản trị viên",
    USER: "Người dùng",
};

export default function UsersPage() {
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

    const suspendMutation = useMutation({
        mutationFn: suspendUser,
        onSuccess: () => {
            toast.success("Đã khóa tài khoản");
            setConfirm(null);
            invalidate();
        },
        onError: () => toast.error("Không thể khóa tài khoản"),
    });

    const restoreMutation = useMutation({
        mutationFn: restoreUser,
        onSuccess: () => {
            toast.success("Đã mở khóa tài khoản");
            setConfirm(null);
            invalidate();
        },
        onError: () => toast.error("Không thể mở khóa tài khoản"),
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
                breadcrumb={["Admin", "Người dùng"]}
                title="Quản lý người dùng"
                description="Xem, tìm kiếm và quản lý trạng thái tài khoản."
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:max-w-sm sm:flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Tìm theo username hoặc email"
                        value={q}
                        onChange={(event) => setQ(event.target.value)}
                    />
                </div>
                <Select className="sm:w-52" value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
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
                                <TableHead>Username</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
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
                                                {ROLE_LABEL[user.role]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={user.status} />
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{formatDate(user.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                {user.status === "suspended" ? (
                                                    <Button size="sm" variant="outline" onClick={() => setConfirm({ type: "restore", user })}>
                                                        <RefreshCcw className="h-4 w-4" />
                                                        Mở khóa
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setConfirm({ type: "suspend", user })}
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                        Khóa
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
                            title="Không có người dùng nào"
                            description={hasFilter ? "Không có người dùng khớp với bộ lọc." : "Chưa có người dùng nào trên hệ thống."}
                            action={
                                <Button variant="outline" onClick={hasFilter ? clearFilters : () => refetch()}>
                                    {hasFilter ? "Xóa bộ lọc" : "Tải lại"}
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
                title={confirm?.type === "suspend" ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}
                description={
                    confirm?.type === "suspend"
                        ? `Tài khoản "${confirm.user.username}" sẽ bị khóa và không thể đăng nhập.`
                        : `Tài khoản "${confirm?.user.username}" sẽ được mở khóa trở lại.`
                }
                confirmLabel={confirm?.type === "suspend" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                destructive={confirm?.type === "suspend"}
                loading={suspendMutation.isPending || restoreMutation.isPending}
                onConfirm={handleConfirm}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: UserStatus }) {
    const variantMap: Record<UserStatus, Parameters<typeof Badge>[0]["variant"]> = {
        created: "outline",
        activated: "default",
        deactivated: "secondary",
        suspended: "destructive",
    };

    return <Badge variant={variantMap[status]}>{STATUS_LABEL[status]}</Badge>;
}
