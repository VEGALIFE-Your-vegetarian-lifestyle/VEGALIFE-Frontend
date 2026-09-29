import type { Video } from "@/types/video";

const chef = { id: "u-01", username: "vegan_chef" };
const nhien = { id: "u-02", username: "an_nhien" };
const thao = { id: "u-03", username: "minh_thao" };
const lan = { id: "u-04", username: "lan_anh" };
const green = { id: "u-05", username: "green_kitchen" };

export const videosSeed: Video[] = [
    { id: "vid-01", title: "Hướng dẫn nấu phở chay từ A đến Z", description: "Video 12 phút hướng dẫn nấu nước dùng và chuẩn bị topping.", mediaUrl: "", mimeType: "video/mp4", status: "succeed", uploader: chef, createdAt: "2026-09-28T10:00:00Z" },
    { id: "vid-02", title: "Làm sữa đậu nành tại nhà", description: "Cách xay và nấu sữa đậu nành không bị tanh.", mediaUrl: "", mimeType: "video/mp4", status: "uploading", uploader: nhien, createdAt: "2026-09-28T08:30:00Z" },
    { id: "vid-03", title: "Chả giò chay giòn rụm", description: "Bí quyết chiên chả giò không bị bể vỏ.", mediaUrl: "", mimeType: "video/mp4", status: "succeed", uploader: thao, createdAt: "2026-09-26T14:15:00Z" },
    { id: "vid-04", title: "Bún riêu chay nấm rơm", mediaUrl: "", mimeType: "video/mp4", status: "failed", uploader: green, createdAt: "2026-09-25T17:00:00Z" },
    { id: "vid-05", title: "Salad đậu gà kiểu Địa Trung Hải", description: "Salad nhanh cho bữa trưa văn phòng.", mediaUrl: "", mimeType: "video/mp4", status: "succeed", uploader: lan, createdAt: "2026-09-24T09:45:00Z" },
    { id: "vid-06", title: "Cà ri chay nước cốt dừa", mediaUrl: "", mimeType: "video/webm", status: "pending", uploader: chef, createdAt: "2026-09-23T19:20:00Z" },
    { id: "vid-07", title: "Bánh mì chay kẹp nấm", description: "Nhân nấm xào sả ớt ăn kèm dưa chua.", mediaUrl: "", mimeType: "video/mp4", status: "succeed", uploader: green, createdAt: "2026-09-21T11:10:00Z" },
    { id: "vid-08", title: "Sinh tố xanh cho buổi sáng", mediaUrl: "", mimeType: "video/mp4", status: "succeed", uploader: nhien, createdAt: "2026-09-19T06:50:00Z" },
    { id: "vid-09", title: "Đậu hũ chiên sả ớt", description: "Món ăn nhanh dưới 15 phút.", mediaUrl: "", mimeType: "video/mp4", status: "failed", uploader: thao, createdAt: "2026-09-17T15:30:00Z" },
];