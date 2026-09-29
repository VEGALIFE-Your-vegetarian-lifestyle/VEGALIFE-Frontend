import type { Post } from "@/types/post";

const chef = { id: "u-01", username: "vegan_chef" };
const nhien = { id: "u-02", username: "an_nhien" };
const thao = { id: "u-03", username: "minh_thao" };
const lan = { id: "u-04", username: "lan_anh" };
const green = { id: "u-05", username: "green_kitchen" };

const mainDish = { id: "cat-01", name: "Món chính" };
const snack = { id: "cat-02", name: "Món ăn vặt" };
const drink = { id: "cat-03", name: "Đồ uống" };
const weekly = { id: "cat-04", name: "Thực đơn tuần" };
const nutrition = { id: "cat-05", name: "Dinh dưỡng" };

// Sắp xếp mới nhất trước
export const postsSeed: Post[] = [
    { id: "post-01", title: "Cách nấu phở chay thanh đạm tại nhà", content: "Nước dùng phở chay được ninh từ củ cải trắng, cà rốt, hành tây nướng và các loại gia vị như hoa hồi, quế, thảo quả.\nBánh phở trụng qua nước sôi, thêm nấm và đậu hũ chiên.", status: "processed", viewCount: 0, author: chef, categories: [mainDish], createdAt: "2026-09-29T02:10:00Z" },
    { id: "post-02", title: "Sữa hạnh nhân tự làm chỉ với 3 bước", content: "Ngâm hạnh nhân qua đêm, xay với nước lọc theo tỉ lệ 1:4 rồi lọc qua khăn sạch.\nCó thể thêm chút muối và đường thốt nốt.", status: "processed", viewCount: 0, author: nhien, categories: [drink], createdAt: "2026-09-28T15:45:00Z" },
    { id: "post-03", title: "Thực đơn chay 7 ngày cho người mới bắt đầu", content: "Thực đơn chia theo từng bữa, ưu tiên đậu, hạt và rau xanh để đủ đạm và chất xơ.\nMỗi ngày gồm ba bữa chính và một bữa phụ.", status: "published", viewCount: 1234, author: thao, categories: [weekly, nutrition], createdAt: "2026-09-27T09:00:00Z" },
    { id: "post-04", title: "Đậu hũ sốt cà chua kiểu Huế", content: "Đậu hũ chiên vàng, sốt cùng cà chua, hành lá và chút ớt sa tế.\nMón ăn đơn giản, hợp với cơm nóng.", status: "published", viewCount: 856, author: lan, categories: [mainDish], createdAt: "2026-09-26T11:30:00Z" },
    { id: "post-05", title: "Bún riêu chay nấm rơm", content: "Riêu chay làm từ đậu hũ non, nấm rơm băm nhuyễn và cà chua.\nNước dùng ngọt thanh từ nấm và rau củ.", status: "processed", viewCount: 0, author: green, categories: [mainDish], createdAt: "2026-09-26T08:15:00Z" },
    { id: "post-06", title: "Chả giò rau củ chiên giòn", content: "Nhân gồm cà rốt, khoai môn, nấm mèo và miến.\nCuốn chặt tay, chiên lửa vừa để vỏ giòn đều.", status: "hidden", viewCount: 412, author: chef, categories: [snack], createdAt: "2026-09-24T13:20:00Z" },
    { id: "post-07", title: "Bổ sung vitamin B12 khi ăn chay", content: "B12 chủ yếu có trong thực phẩm bổ sung và một số thực phẩm tăng cường.\nNên kiểm tra định kỳ và tham khảo ý kiến chuyên gia.", status: "published", viewCount: 2301, author: nhien, categories: [nutrition], createdAt: "2026-09-22T07:40:00Z" },
    { id: "post-08", title: "Cơm chiên nấm và đậu que", content: "Cơm nguội chiên cùng nấm đông cô, đậu que và chút nước tương.\nThêm hành phi để dậy mùi.", status: "unpublished", viewCount: 0, author: thao, categories: [mainDish], rejectReason: "Nội dung sao chép từ nguồn khác, chưa ghi nguồn tham khảo.", createdAt: "2026-09-21T10:00:00Z" },
    { id: "post-09", title: "Sinh tố bơ chuối không sữa", content: "Bơ, chuối, sữa yến mạch và một ít đá xay nhuyễn.\nCó thể thêm hạt chia để tăng chất xơ.", status: "created", viewCount: 0, author: lan, categories: [drink], createdAt: "2026-09-20T16:10:00Z" },
    { id: "post-10", title: "Bánh tráng nướng chay kiểu Đà Lạt", content: "Bánh tráng nướng với trứng thay thế từ bột đậu nành, hành lá và phô mai thực vật.\nMón ăn vặt được nhiều bạn trẻ yêu thích.", status: "published", viewCount: 978, author: green, categories: [snack], createdAt: "2026-09-18T12:00:00Z" },
    { id: "post-11", title: "Protein từ thực vật: nên ăn gì mỗi ngày", content: "Đậu lăng, đậu gà, đậu hũ, tempeh và các loại hạt đều là nguồn đạm tốt.\nKết hợp nhiều nguồn để đủ các axit amin cần thiết.", status: "published", viewCount: 1745, author: chef, categories: [nutrition], createdAt: "2026-09-15T09:30:00Z" },
    { id: "post-12", title: "Thực đơn chay tuần 39: nhẹ bụng sau lễ", content: "Thực đơn ưu tiên món canh, rau luộc và ngũ cốc nguyên hạt.\nGiảm dầu mỡ, tăng lượng nước uống mỗi ngày.", status: "hidden", viewCount: 320, author: thao, categories: [weekly], createdAt: "2026-09-12T08:00:00Z" },
];