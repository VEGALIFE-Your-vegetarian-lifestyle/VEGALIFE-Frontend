// Giả lập độ trễ mạng khi dùng mock data
export const delay = (ms = 400) => new Promise<void>((resolve) => setTimeout(resolve, ms));