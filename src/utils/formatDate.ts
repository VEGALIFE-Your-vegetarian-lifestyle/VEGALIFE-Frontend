export function formatDate(iso: string): string {
    const date = new Date(iso);
    return `${date.getDate()} tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}