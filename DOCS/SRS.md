# SRS — VEGALIFE

## 0. Thông tin tài liệu

| Trường | Giá trị |
|--------|---------|
| **Tên hệ thống** | VEGALIFE — Vegan Community Platform |
| **Loại sản phẩm** | Web Application (Full-stack) |
| **Đối tượng** | Người ăn chay, người quan tâm đến chế độ ăn chay |
| **Phiên bản** | 1.0.0-MVP |
| **Trạng thái** | Draft |
| **Nguồn tham chiếu** | Backend: `VEGALIFE-backend`, Frontend: `VEGALIFE-Frontend` |
| **Ký hiệu ưu tiên** | [MVP] = Must-have cho MVP · [SHOULD] = Nên có sau MVP · [LATER] = Backlog |

### Quyết định nền tảng

| Lĩnh vực | Quyết định | Lý do |
|----------|-----------|-------|
| **Backend** | Spring Boot 3.5.5 + Java 21 | Stable, ecosystem mạnh, JPA/Hibernate support tốt |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS | Developer experience tốt, type-safety, hot-reload nhanh |
| **Database** | PostgreSQL | JSONB support (AI messages), spatial queries (location) |
| **State Management** | Zustand (frontend), TanStack Query (data fetching) | Lightweight, easy to use |
| **Schema Migration** | Flyway | Reliable, version-controlled migrations |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) | Auto-generated, developer-friendly |

---

## 1. Giới thiệu

### 1.1 Bối cảnh

Thị trường thực phẩm chay đang phát triển nhanh tại Việt Nam và thế giới. Tuy nhiên, cộng đồng người ăn chay thiếu một nền tảng số tập trung để:
- Chia sẻ kiến thức, công thức nấu ăn chay
- Lên kế hoạch dinh dưỡng cá nhân hóa dựa trên chỉ số cơ thể (BMI)
- Tìm kiếm cửa hàng/thực phẩm chay gần vị trí
- Tương tác với cộng đồng qua bình luận, vote

VEGALIFE ra đời để giải quyết nhu cầu này — một web platform kết nối cộng đồng người ăn chay, cung cấp công cụ hỗ trợ dinh dưỡng và nội dung giáo dục.

### 1.2 Mục tiêu sản phẩm

Xây dựng một web platform hoàn chỉnh cho phép:
1. **Kết nối cộng đồng**: Người dùng đăng bài blog, video hướng dẫn nấu ăn chay, bình luận, vote
2. **Hỗ trợ dinh dưỡng**: AI Chatbot tư vấn dinh dưỡng chay, lên meal plan theo BMI và nguyên liệu có sẵn
3. **Tìm kiếm & khám phá**: Tìm kiếm recipe, video, blog, cửa hàng chay theo tên món ăn/địa điểm
4. **Quản lý nội dung**: Admin kiểm duyệt và quản lý toàn bộ nội dung nền tảng

### 1.3 Mục tiêu KHÔNG thuộc MVP

- Mobile app (iOS/Android)
- Payment/gói subscription
- Live cooking stream
- Multi-language (i18n)
- Push notification
- Social login (Google, Facebook)
- Recipe recommendation engine (ML-based)

### 1.4 Tiêu chí thành công

| Metric | Target |
|--------|--------|
| Số user đăng ký MVP | ≥ 100 active users |
| Số blog/video được tạo | ≥ 50 pieces of content |
| Thời gian load trang chủ | ≤ 2s (95th percentile) |
| API response time (p95) | ≤ 500ms |
| Uptime | ≥ 99% |
| User satisfaction (survey) | ≥ 4/5 |

---

## 2. Phạm vi hệ thống

### 2.1 Trong phạm vi MVP [MVP]

| Feature | Mô tả |
|---------|-------|
| Authentication | Đăng ký, đăng nhập, đăng xuất, đổi mật khẩu |
| User Profile | Quản lý thông tin cá nhân, BMI metrics |
| Blog Posts | Tạo, chỉnh sửa, xem, tìm kiếm blog |
| Video/Tutorial | Upload, xem, tìm kiếm video nấu ăn chay |
| Comments & Votes | Bình luận (nested), upvote/downvote post |
| Categories | Quản lý danh mục recipe/blog (Admin) |
| Weekly Meal Plan | Tạo meal plan theo BMI, nguyên liệu có sẵn |
| Location Search | Tìm cửa hàng/thực phẩm chay theo vị trí |
| Food Search | Tìm recipe, video liên quan đến món ăn |
| AI Nutrition Chatbot | Chatbot trả lời câu hỏi dinh dưỡng chay (LLM-based) |

### 2.2 SHOULD

| Feature | Mô tả |
|---------|-------|
| Email verification | Xác thực email khi đăng ký |
| Rich text editor | Soạn thảo blog với markdown/rich text |
| Media library | Thư viện ảnh/video cá nhân |
| Notification system | Thông báo khi có comment/vote mới |
| Rating restaurants | Đánh giá sao cho cửa hàng chay |
| Export meal plan | Xuất meal plan dưới dạng PDF |

### 2.3 LATER

| Feature | Mô tả |
|---------|-------|
| Recipe recommendation (ML) | Gợi ý recipe dựa trên lịch sử |
| Social features | Follow user, share bài viết |
| Mobile apps | iOS/Android native apps |
| Subscription tiers | Gói premium tính năng |
| Ingredient barcode scanner | Quét mã vạch nguyên liệu |
| Grocery delivery integration | Đặt hàng từ cửa hàng chay |

---

## 3. Actors và phân quyền

### 3.1 Danh sách vai trò

| Role | Mã | Mô tả |
|------|-----|-------|
| **Administrator** | `ADMIN` | Quản trị viên nền tảng, quản lý toàn bộ nội dung |
| **Authorized User** | `USER` | Người dùng đã đăng nhập, đầy đủ tính năng |
| **Unauthorized User** | `GUEST` | Khách viếng thăm, không đăng nhập |

### 3.2 Ma trận quyền

| Action | ADMIN | USER | GUEST |
|--------|-------|------|-------|
| View public blogs/videos | ✅ | ✅ | ✅ |
| Search blogs/videos | ✅ | ✅ | ✅ |
| Register account | ❌ | ❌ | ✅ |
| Login | ❌ | ✅ | ❌ |
| Create blog post | ✅ | ✅ | ❌ |
| Edit own blog post | ✅ | ✅ | ❌ |
| Delete any blog post | ✅ | ❌ | ❌ |
| Upload video | ✅ | ✅ | ❌ |
| Comment on posts | ✅ | ✅ | ❌ |
| Vote on posts | ✅ | ✅ | ❌ |
| Create weekly meal plan | ❌ | ✅ | ❌ |
| View vegan shops/restaurants | ✅ | ✅ | ✅ |
| Search by food/recipe | ✅ | ✅ | ✅ |
| AI Chatbot (full) | ✅ | ✅ | ⚠️ Limited (3 queries) |
| Manage categories | ✅ | ❌ | ❌ |
| Moderate comments | ✅ | ❌ | ❌ |
| Suspend users | ✅ | ❌ | ❌ |
| View own profile | ✅ | ✅ | ❌ |
| Update own profile | ✅ | ✅ | ❌ |

⚠️ = Limited trial access

### 3.3 Nguyên tắc phân quyền

1. **Role-based Access Control (RBAC)**: Mọi endpoint đều kiểm tra role của user
2. **Ownership check**: User chỉ có thể sửa/xóa nội dung của chính mình (trừ ADMIN)
3. **Soft delete**: Tất cả entity đều có `deleted_at` — dữ liệu không bị xóa vĩnh viễn
4. **Guest restriction**: Token-less requests bị từ chối cho mọi write operation
5. **Admin override**: ADMIN có thể thao tác trên mọi resource bất kể ownership

---

## 4. Authentication & quản lý phiên

### 4.1 Chính sách tạo tài khoản

| Yêu cầu | Mô tả |
|---------|-------|
| Username | 3–50 ký tự, alphanumeric + underscore, unique |
| Email | Valid email format, unique, phải verified (SHOULD) |
| Password | Minimum 8 ký tự, ít nhất 1 uppercase, 1 lowercase, 1 number, 1 special char |
| Registration flow | Guest → Fill form → Account created (status=`created`) → Activate (status=`activated`) |
| Duplicate detection | Kiểm tra username/email trước khi tạo |

### 4.2 Luồng đăng nhập

```
┌──────────┐    credentials    ┌────────────┐   JWT      ┌──────────┐
│  Guest   │ ──────────────►  │ Auth API   │ ─────────► │  Client  │
│          │                  │            │            │ (store)  │
└──────────┘                  └────────────┘            └──────────┘
                               │
                               │ validate
                               ▼
                          ┌──────────┐
                          │  User DB │
                          └──────────┘
```

1. Client gửi `POST /api/auth/login` với `{ email, password }`
2. Server xác thực với BCrypt
3. Nếu thành công: trả về `access_token` (JWT, 15min expiry) + `refresh_token` (JWT, 7d expiry)
4. Client lưu token vào `httpOnly` cookie hoặc localStorage
5. Mỗi request kèm `Authorization: Bearer <token>`

### 4.3 Session/Token

| Loại token | Thời hạn | Lưu trữ | Refresh |
|------------|----------|---------|---------|
| Access Token | 15 phút | httpOnly cookie / memory | Tự động bằng refresh token |
| Refresh Token | 7 ngày | httpOnly cookie | Quay lại step 1 |

**JWT Payload:**
```json
{
  "sub": "<user_id>",
  "role": "USER",
  "iat": 1690000000,
  "exp": 1690009000
}
```

### 4.4 Đăng xuất, khóa tài khoản, đổi mật khẩu

| Thao tác | Mô tả |
|----------|-------|
| **Đăng xuất** | `POST /api/auth/logout` — invalidate refresh token, clear cookies |
| **Khóa tài khoản** | ADMIN set `status = 'suspended'` — user không thể login |
| **Tắt tài khoản** | User self-deactivate: `status = 'deactivated'` — soft remove data |
| **Đổi mật khẩu** | `PUT /api/auth/password` — cần current_password + new_password |
| **Reset mật khẩu** | `POST /api/auth/forgot-password` — gửi link reset qua email (SHOULD) |

---

## 5. Domain model & State machine

### 5.1 Mô hình nghiệp vụ chính

```
┌──────────┐     1:1     ┌──────────────┐
│   User   │ ◄────────► │  UserProfile │
│          │             │ (BMI metrics)│
└────┬─────┘             └──────────────┘
     │
     │ 1:N
     ├──► Post (Blog) ──► Post_Category
     │         │
     │         ├──► Comment (N:N recursive)
     │         ├──► Vote
     │         ├──► Post_Media
     │         └──► Post_Recipe
     │
     ├──► Video (Media with mime_type=video/*)
     │
     ├──► Menu ──► Menu_Detail ──► Dish
     │
     ├──► AI_Conversation ──► AI_Message
     │
     └──► Location (shops/restaurants)
              │
              └──► Category (food type)
```

### 5.2 State transitions

#### Post Status Machine
```
  ┌─────────┐    create     ┌───────────┐
  │ Created │ ───────────► │ Processed │
  └────┬────┘               └─────┬─────┘
       │                          │ publish / approve
       │ reject                   ▼
       │                ┌───────────────┐     hide      ┌───────────┐
       │                │   Published   │ ◄──────────── │  Hidden   │
       │                └───────────────┘               └───────────┘
       │                         │
       │                  unpublished (user action)
       │                         │
       ▼                         ▼
  ┌───────────┐           ┌───────────────┐
  │  Created  │           │  Unpublished  │
  └───────────┘           └───────────────┘
```

**Detailed Transitions:**
| From | To | Trigger | Actor |
|------|-----|---------|-------|
| Initial | Created | Post created | User/Admin |
| Created | Processed | Post submitted for review | User/Admin |
| Processed | Published | Admin approves post | Admin |
| Processed | Published | Analyzer approves content | Auto-analyzer |
| Processed | Unpublished | Admin rejects post | Admin |
| Published | Hidden | User hides post | User/Admin |
| Hidden | Published | User republishes post | User/Admin |
| Published/Hidden/Unpublished | Created | Edit draft | User/Admin |

#### User Status Machine
```
  ┌──────────┐   verify      ┌───────────┐
  │ Created  │ ───────────► │ Activated │
  └────┬─────┘              └─────┬─────┘
       │ suspend                  │ restore
       │                          │
       ▼                          ▼
  ┌───────────┐           ┌─────────────┐
  │ Suspended │ ◄──────── │ Deactivated │
  └─────┬─────┘           └─────────────┘
        │ activate
        ▼
  ┌───────────┐
  │ Activated │
  └───────────┘
```

**Detailed Transitions:**
| From | To | Trigger | Actor |
|------|-----|---------|-------|
| Initial | Created | User registers | User |
| Created | Activated | User verifies email | User |
| Activated | Suspended | Admin suspends account | Admin |
| Suspended | Activated | Admin restores account | Admin |
| Activated | Deactivated | User deletes own account | User |
| Deactivated | Activated | Admin reactivates account | Admin (SHOULD) |

#### Menu Status Machine
```
  ┌─────────┐    approve      ┌───────────┐
  │ Drafted │ ────────────► │ Scheduled │
  └────┬────┘               └─────┬─────┘
       │ cancel                    │ complete (auto)
       ▼                           ▼
  ┌───────────┐           ┌─────────────┐
  │ Cancelled │           │ Completed   │
  └───────────┘           └─────────────┘
```

**Detailed Transitions:**
| From | To | Trigger | Actor |
|------|-----|---------|-------|
| Initial | Drafted | Menu plan created | User |
| Drafted | Scheduled | User approves menu plan | User |
| Scheduled | Cancelled | User cancels scheduled menu | User |
| Scheduled | Completed | Menu period completed | System (auto) |

#### Media Upload Status Machine
```
  ┌──────────┐    start      ┌───────────┐
  │ Pending  │ ───────────► │ Uploading │
  └────┬─────┘              └─────┬─────┘
       │ fail                     │ succeed
       ▼                          ▼
  ┌──────────┐           ┌──────────┐
  │  Failed  │           │  Succeed │
  └──────────┘           └──────────┘
```

**Detailed Transitions:**
| From | To | Trigger | Actor |
|------|-----|---------|-------|
| Initial | Pending | Media selected for upload | User |
| Pending | Uploading | Processing to upload media | System |
| Uploading | Succeed | Upload succeeded | System |
| Uploading | Failed | Upload failed | System |

---

## 6. Yêu cầu chức năng (theo module/role)

### FR-01 - Authentication [MVP]

#### FR-01-01: Register Account

**Acceptance Criteria:**

```gherkin
Scenario: Guest registers successfully
  Given I am an unauthorized user
  When I submit a registration form with valid username, email, and password
  Then my account is created with status "created"
  And I receive a success message

Scenario: Duplicate username registration fails
  Given an existing user with username "john_doe"
  When I try to register with the same username
  Then the registration is rejected
  And an error "Username already exists" is shown

Scenario: Weak password registration fails
  Given I am an unauthorized user
  When I submit a password shorter than 8 characters
  Then the registration is rejected
  And an error "Password must be at least 8 characters" is shown
```

#### FR-01-02: Login

**Acceptance Criteria:**

```gherkin
Scenario: User logs in successfully
  Given I am a registered user with status "activated"
  When I submit correct email and password
  Then I receive an access_token and refresh_token
  And I am redirected to the dashboard

Scenario: Login with wrong password fails
  Given I am a registered user
  When I submit incorrect password
  Then login is rejected
  And an error "Invalid credentials" is shown

Scenario: Suspended user cannot login
  Given my account status is "suspended"
  When I attempt to log in
  Then login is rejected
  And an error "Account has been suspended" is shown
```

#### FR-01-03: Logout

**Acceptance Criteria:**

```gherkin
Scenario: User logs out
  Given I am an authenticated user
  When I click logout
  Then my session tokens are invalidated
  And I am redirected to the home page
```

### FR-02 - User Profile [MVP]

#### FR-02-01: View Own Profile

**Acceptance Criteria:**

```gherkin
Scenario: Authorized user views their profile
  Given I am logged in
  When I navigate to my profile page
  Then I see my username, email, avatar, height, weight, age, gender
  And I see my calculated BMI value
```

#### FR-02-02: Update Profile (BMI Metrics)

**Acceptance Criteria:**

```gherkin
Scenario: User updates body metrics
  Given I am logged in
  When I update height, weight, age, gender
  Then my profile is updated
  And my BMI is recalculated automatically
  And the new BMI category (Underweight/Normal/Overweight/Obese) is displayed

Scenario: Invalid height/weight values are rejected
  Given I am logged in
  When I enter height > 250cm or weight > 300kg
  Then the update is rejected
  And an error is shown
```

### FR-03 - Blog Posts [MVP]

#### FR-03-01: Create Blog Post

**Acceptance Criteria:**

```gherkin
Scenario: User creates and publishes a blog post
  Given I am an authorized user or admin
  When I fill in title, content, select categories, and upload featured image
  And I select media (images/videos) for the post
  Then the system checks the content for violations
  If no violation is detected, the system stores the media in Cloud Storage
  And the post is saved in My Post section with status "Created"
  And I am redirected to the home page
  And I receive a confirmation notification

Scenario: Post with content violation is rejected
  Given I am composing a blog post with violating content
  When I submit the post for publishing
  Then the system detects the content violation
  And the post is not published
  And I receive a rejection notification explaining the violation

Scenario: Admin publishes approved post
  Given a post exists with status "Processed"
  When admin approves the post
  Then the post status changes to "Published"
  And it appears in the public blog feed

Scenario: Admin rejects post
  Given a post exists with status "Processed"
  When admin rejects the post
  Then the post status changes to "Unpublished"
  And the author is notified of rejection
```

#### FR-03-02: View Blog Feed

**Acceptance Criteria:**

```gherkin
Scenario: Guest views published blog posts
  Given there are published blog posts
  When I visit the blog page
  Then I see a list of published posts sorted by newest first
  And each post shows title, featured image, author, view count

Scenario: Guest views blog detail
  Given a published blog post exists
  When I click on a post
  Then I see the full content, author info, comments section
  And the view_count increments by 1
```

#### FR-03-03: Edit/Delete Blog Post

**Acceptance Criteria:**

```gherkin
Scenario: Author edits their own post
  Given I created a blog post
  When I edit the title or content
  Then the post is updated with new timestamp
  And the previous version is not accessible

Scenario: Admin deletes any post
  Given any blog post exists
  When admin deletes it
  Then the post's deleted_at is set (soft delete)
  And it no longer appears in public feeds
```

### FR-04 - Videos [MVP]

#### FR-04-01: Upload Video

**Acceptance Criteria:**

```gherkin
Scenario: User uploads a cooking tutorial video
  Given I am an authorized user or admin
  When I upload a video file with title and description
  Then the media status is "uploading"
  And after processing, status becomes "succeed"
  And the video appears in the video feed

Scenario: Video upload exceeds size limit
  Given I am an authorized user
  When I upload a video larger than 100MB
  Then the upload is rejected
  And an error is shown
```

#### FR-04-02: View Video Feed

**Acceptance Criteria:**

```gherkin
Scenario: Guest views video feed
  Given there are successful videos
  When I visit the video page
  Then I see a grid of video thumbnails with titles
  And I can play the video inline or in detail page
```

### FR-05 - Comments & Votes [MVP]

#### FR-05-01: Comment on Post

**Acceptance Criteria:**

```gherkin
Scenario: User comments on a blog post
  Given I am an authorized user
  When I type a comment on a published post and submit
  Then the comment appears under the post
  And the comment supports nested replies (parent_id)

Scenario: Guest cannot comment
  Given I am an unauthorized user
  When I try to submit a comment
  Then I am redirected to login page
```

#### FR-05-02: Vote on Post

**Acceptance Criteria:**

```gherkin
Scenario: User upvotes a post
  Given I am an authorized user viewing a post
  When I click upvote
  Then the post's upvote count increases
  And my vote is recorded

Scenario: User changes vote
  Given I already upvoted a post
  When I click downvote instead
  Then my vote changes from upvote to downvote
  And counts are adjusted accordingly

Scenario: User cannot vote twice on same type
  Given I already upvoted a post
  When I try to upvote again
  Then the action is ignored
```

### FR-06 - Categories [MVP]

#### FR-06-01: Manage Categories (Admin)

**Acceptance Criteria:**

```gherkin
Scenario: Admin creates a new category
  Given I am an admin
  When I create a category with name and description
  Then the category is created
  And it appears in the category list

Scenario: Admin assigns category to post
  Given a post exists
  When admin assigns one or more categories to it
  Then the post_category relationship is created
```

### FR-07 - Weekly Meal Plan [MVP]

#### FR-07-01: Create Meal Plan Based on BMI (Paid Feature)

**Acceptance Criteria:**

```gherkin
Scenario: Paid user creates a weekly meal plan
  Given I am an authorized user with an active paid package
  When I navigate to Weekly Menu Planner
  And I fill in personal information: age, gender, height, weight, activity level
  And I select a health goal (weight loss / weight maintenance / muscle gain)
  And I enter allergies, dietary restrictions, and available ingredients
  And I submit the information
  Then the system validates my information
  And the AI Meal Planner analyzes my data
  And a personalized 7-day meal plan is generated
  And each day includes Breakfast, Lunch, Dinner
  And meals respect my BMI category, health goal, allergies, and dietary restrictions
  And I can review and save the plan

Scenario: Non-paid user tries to use AI Meal Planner
  Given I am an authorized user without an active paid package
  When I navigate to Weekly Menu Planner
  Then I am prompted to purchase a paid package
  And I cannot generate meal plans until subscribed

Scenario: Underweight user gets high-calorie plan
  Given my BMI indicates "Underweight" and health goal is "muscle gain"
  When meal plan is generated
  Then meals with higher calorie density and protein are prioritized

Scenario: Overweight user gets low-calorie plan
  Given my BMI indicates "Overweight" and health goal is "weight loss"
  When meal plan is generated
  Then meals with lower calorie density are prioritized

Scenario: Meal plan respects allergies
  Given I have declared allergy to "peanuts"
  When meal plan is generated
  Then no meals contain peanuts or peanut-derived ingredients

Scenario: Incomplete information is rejected
  Given I am filling the personal information form
  When I submit without completing required fields
  Then the system highlights missing fields
  And the meal plan is not generated
```

#### FR-07-02: View Meal Plan

**Acceptance Criteria:**

```gherkin
Scenario: User views their weekly menu
  Given a meal plan exists for the current week
  When I navigate to meal plan page
  Then I see a table organized by day and meal type
  And each meal shows dish name, ingredients, calories
```

### FR-08 - Location Search [MVP]

#### FR-08-01: Search Nearby Vegan Shops/Restaurants

**Acceptance Criteria:**

```gherkin
Scenario: User searches nearby vegan shops with location granted
  Given I am on the restaurant page
  When I select "Nearby Vegan Places"
  And I grant location permission
  Then the system obtains my current location
  And displays nearby vegan/vegetarian shops and restaurants on the map
  And each result shows name, address, rating, distance, phone

Scenario: User denies location permission
  Given I am on the restaurant page
  When I select "Nearby Vegan Places"
  And I deny location permission
  Then I am prompted to enter address manually
  And nearby search uses the provided address

Scenario: User views place details
  Given nearby places are displayed on the map
  When I select a place
  Then the place's details are displayed (name, address, hours, rating, etc.)
```

#### FR-08-02: Get Suggested Shops by Food

**Acceptance Criteria:**

```gherkin
Scenario: Get suggested shops related to searched food
  Given I search for "tofu" in the global search
  When results are returned
  Then vegan shops selling tofu are suggested
  And they appear in the location results section
```

### FR-09 - Food/Recipe Search [MVP]

#### FR-09-01: Search Recipes, Videos, Blogs

**Acceptance Criteria:**

```gherkin
Scenario: Global search by keyword
  Given I am on the search page
  When I search for "pho chay"
  Then I see matching blog posts, videos, and recipes
  And results are grouped by type

Scenario: Get suggested videos/blogs for recipe
  Given I search for "bun cha chay"
  When results are returned
  Then videos and blogs mentioning "bun cha chay" are included
  And they are ranked by relevance
```

### FR-10 - AI Nutrition Chatbot [MVP]

#### FR-10-01: Chat with AI Bot

**Acceptance Criteria:**

```gherkin
Scenario: Authorized user chats with AI bot
  Given I am an authorized user
  When I open the AI Nutrition Chatbot
  And I enter a nutrition-related question
  Then the AI responds with relevant information
  And the conversation is saved
  And I can continue asking follow-up questions

Scenario: Guest uses limited chatbot
  Given I am an unauthorized user
  When I open the AI Nutrition Chatbot
  And I send my 1st, 2nd, 3rd query
  Then the AI responds normally
  But when my trial quota is exhausted
  And I attempt a 4th query
  Then I am prompted to register/login
  And further queries are blocked until authentication

Scenario: Ask about BMI/calorie metrics
  Given I am chatting with the AI bot
  When I ask "What is a healthy BMI?"
  Then the AI explains BMI ranges in natural language
  And provides context for vegan diets

Scenario: Ask ingredient substitution
  Given I am chatting with the AI bot
  When I ask "What can I substitute for eggs in baking?"
  Then the AI suggests vegan alternatives (flax egg, chia egg, etc.)
  And explains ratios and methods
```

### FR-11 - Admin Content Moderation [MVP]

#### FR-11-01: Moderate Comments

**Acceptance Criteria:**

```gherkin
Scenario: Admin hides inappropriate comment
  Given a comment exists on a post
  When admin marks it as hidden
  Then the comment is no longer visible to regular users
  And the author is notified (SHOULD)
```

#### FR-11-02: Manage Users

**Acceptance Criteria:**

```gherkin
Scenario: Admin suspends a user
  Given a user has violated community guidelines
  When admin suspends the user
  Then the user's status becomes "suspended"
  And they cannot log in or access features

Scenario: Admin views member list
  Given I am an admin
  When I open the members management page
  Then I see all registered users with status, role, join date
  And I can search/filter the list
```

---

## 7. Business Rules & Policy Specification

> Tài liệu này mô tả các quy tắc nghiệp vụ bắt buộc của nền tảng VEGALIFE — technology-neutral, áp dụng cho bất kỳ frontend/backend nào triển khai hệ thống.

---

### 7.1 Authentication

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-AUTH-001** | Unique User Identity | [MVP] | Every registered account must have a unique email address and a unique username. The system must never allow a new account to be created with an email or username that already belongs to another account. |
| **BR-AUTH-002** | Password Confirmation Match | [MVP] | During registration, the user must enter their password twice (Password and Confirm Password). Both entries must match exactly, or the account must not be created. |
| **BR-AUTH-003** | Email Verification Required for Activation | [MVP] | A newly registered account starts in an inactive state (`created`) and cannot log in until the user confirms ownership of the email address. The system must clearly tell an unactivated user that verification is required. |
| **BR-AUTH-004** | Verification Token Expiration (24h) | [MVP] | The verification link/code sent to confirm an email address is valid for 24 hours from issuance. After 24 hours, or once used, it can no longer activate the account. Only the most recently issued link/code is valid — requesting a new one cancels any earlier unused one. |
| **BR-AUTH-005** | Password Minimum Length (8 chars) | [MVP] | A password must be at least 8 characters long. This applies every time a password is set or changed, not only at registration. |
| **BR-AUTH-006** | Username Format and Length (3–50 chars) | [MVP] | A username must be between 3 and 50 characters, and may only contain letters, numbers, underscores, and periods. Applies at registration and any time a username can be changed. |
| **BR-AUTH-007** | Email Format and Length (valid, max 100 chars) | [MVP] | An email address must be in a valid email format and must not exceed 100 characters. Applies at registration and whenever an email can be changed. |
| **BR-AUTH-008** | Login Requires Valid Credentials and Activated Account | [MVP] | A user can only log in when their identifier (email/username) and password are both correct AND their account is activated. The system must tell the user which situation applies ("account not yet activated" vs "incorrect credentials") without revealing which specific field is wrong. |
| **BR-AUTH-009** | Access Token Short Lifetime (15 minutes) | [MVP] | A logged-in session stays actively verified for 15 minutes. After that window, the session must be silently renewed via refresh token rather than requiring the user to re-login. |
| **BR-AUTH-010** | Refresh Token Long Lifetime (7 days) | [MVP] | A user remains logged in, without re-entering credentials, for up to 7 days from their last login. Once 7 days pass, the user must log in again. |
| **BR-AUTH-011** | Refresh Token Stored as SHA-256 Hash | [MVP] | The refresh token credential must never be stored in readable form. It is shown to the device only once at issuance. Server stores only the SHA-256 hash for validation. |
| **BR-AUTH-012** | Non-Rotating Refresh Token (MVP Simplification) | [MVP] | For MVP, the same refresh token may be reused repeatedly until it reaches its 7-day limit or the user logs out. This is a documented simplification for later security hardening. |
| **BR-AUTH-013** | Logout Revokes Refresh Token | [MVP] | Logging out immediately and permanently ends that session's ability to silently renew itself, even if its 7-day allowance has not yet run out. |
| **BR-AUTH-014** | Access Token Blacklist on Demand | [MVP] | When a user logs out, or when a security-sensitive event occurs (such as a password change), any currently active session must be cut off immediately — the system cannot wait for the normal 15-minute expiry. |
| **BR-AUTH-015** | Expired Token Cleanup Daily | [SHOULD] | The system must remove expired and revoked session records at least once every day to prevent outdated data accumulation. |

---

### 7.2 User Profile

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-PROFILE-001** | Profile Fields Validation | [MVP] | Profile information (name, bio, phone number, avatar) must meet defined format and length rules before saving. Any value that fails must be rejected with a clear reason. |
| **BR-PROFILE-002** | Profile Ownership | [MVP] | Any user may view another member's public profile, but only the profile's owner may edit or delete it. Administrator is the sole exception. |
| **BR-PROFILE-003** | Profile Auto-Creation | [MVP] | The moment an account becomes `activated`, it must automatically have an associated `user_profile` with default values (height, weight, age, gender nullable). There must be no point where an activated account exists without a profile. |

---

### 7.3 Administrator

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-ADMIN-001** | Member Account Management | [MVP] | Administrator can view the full list of registered members and can activate or deactivate any member account. A deactivated account cannot log in or use the platform until an Administrator reactivates it. |
| **BR-ADMIN-002** | Content Moderation Authority | [MVP] | Administrator may review, edit, or remove any blog, video, or comment on the platform, regardless of who originally created it. Every moderation action must be recorded (who did what, to what, and when) for audit purposes. |
| **BR-ADMIN-003** | Category Creation and Maintenance | [MVP] | Only Administrator may create, edit, retire, or remove content categories. A category still used by existing content must not be deletable outright — it can only be retired from future use, so existing content is not broken. |
| **BR-ADMIN-004** | Administrator Role Enforcement | [MVP] | The management actions in BR-ADMIN-001 through BR-ADMIN-003 are available only to accounts holding the Administrator role. No other account type can perform them under any circumstance. |

---

### 7.4 Content Management (Blog / Recipe / Video Posts)

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-CONTENT-001** | Content Ownership for Edit/Delete | [MVP] | A user may edit or delete only the content (blog, recipe, or video) that they personally created. Administrator is the sole exception. |
| **BR-CONTENT-002** | Content Type Selection Required | [MVP] | Every piece of content must be declared as either **Blog** or **Video** at creation time, and this type cannot change afterward. Each type has its own required information — a Video must include a video file/link, a Blog must include written content. The platform must enforce that the right information is present for the chosen type. |
| **BR-CONTENT-003** | Draft and Publish States | [MVP] | Content can be kept as a private **Draft** (visible only to creator and Admin) or made **Published** (visible to everyone). Content cannot move from Draft to Published unless it has all required information (BR-CONTENT-002) and is assigned to at least one active category (BR-CONTENT-004). Only the creator or Admin may change between these states. |
| **BR-CONTENT-004** | Category Assignment Required | [MVP] | Every piece of content must be linked to at least one **active** category before it can be published. Content with no category, or only inactive/retired categories, cannot be published. |

---

### 7.5 Comments

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-COMMENT-001** | Comment Requires Authentication | [MVP] | Only a logged-in, authorized user may post a comment. Anyone, including guests, may read existing comments. |
| **BR-COMMENT-002** | Comment Ownership for Edit/Delete | [MVP] | A user may edit or delete only their own comments. Administrator is the sole exception. |

---

### 7.6 Votes / Likes

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-VOTE-001** | Vote Requires Authentication | [MVP] | Only a logged-in, authorized user may cast a vote on content. A guest may see the total vote count but cannot cast a vote themselves. |
| **BR-VOTE-002** | Single Vote Per User Per Content | [MVP] | A user may cast at most one vote on any given piece of content. If they vote again on content they have already voted for, this removes their existing vote rather than adding a second one (toggle behavior). |

---

### 7.7 Vegan Cooking Tutorial Videos

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-VIDEO-001** | Video Upload Format and Size Restriction | [MVP] | An uploaded cooking tutorial video must be in an accepted format and within an acceptable file-size limit. Files outside these limits must be rejected with user notification before the upload is treated as complete. |
| **BR-VIDEO-002** | Video Searchable by Keyword and Category | [MVP] | Every published video must be discoverable through both keyword search and category browsing, on equal footing with blog and recipe content. A user should never have to know content is a video to find it. |

---

### 7.8 Weekly Menu (BMI-based)

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-MENU-001** | Weekly Menu Requires Personal Index Input | [MVP] | To generate a weekly menu, the user must provide personal information needed to determine BMI (height, weight, age, gender, activity level). A weekly menu cannot be generated without this information. The platform must explain what is missing if the user tries without it. |
| **BR-MENU-002** | Weekly Menu Based on Available Materials | [MVP] | The user must specify which ingredients/materials they have available. The generated weekly menu must prioritize recipes using those materials while fitting the nutritional target implied by the user's BMI. If not enough matching recipes exist, the user must be told the menu is only a **partial match** — never silently return an incomplete result. |

---

### 7.9 Nearby Vegan Places

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-NEARBY-001** | Location Access Required for Nearby Search | [MVP] | To view nearby vegan shops/restaurants, the user must provide a location — either by allowing automatic detection or by entering it manually. Manual entry must always remain available as an alternative if automatic detection is denied. |
| **BR-NEARBY-002** | Nearby Results Sorted by Distance | [MVP] | Nearby places must always be presented ordered from closest to farthest relative to the user's chosen location. |
| **BR-NEARBY-003** | Suggested Shops Related to Searched Food | [MVP] | When a user searches for or views a specific dish/recipe, the platform must surface nearby shops/restaurants that offer that dish, prioritized ahead of the general nearby list. If none exist nearby, the general nearby list must still be shown rather than an empty result. |

---

### 7.10 Search & Related-Content Suggestions

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-SEARCH-001** | Related Content Suggestions | [MVP] | When a user views a piece of content, or completes a search, the platform must show related blogs, videos, or recipes based on shared category or topic, so the user has a natural next step to explore. |
| **BR-SEARCH-002** | Search Access for All User Types | [MVP] | Searching for and viewing published content must be available to everyone, including guests who have not logged in — this must never require an account. |

---

### 7.11 AI Nutrition Chatbot

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-CHATBOT-001** | Chatbot Topic Scope Restriction | [MVP] | The AI Nutrition Chatbot may only answer questions about vegetarian/vegan nutrition, ingredient substitution, and BMI/calorie-related topics. A question outside this scope must be politely declined rather than answered. |
| **BR-CHATBOT-002** | Authentication Required to Use Chatbot | [MVP] | Only a logged-in, authorized user may ask the AI Nutrition Chatbot a question. A guest who has not logged in must be clearly told that logging in is required, and must not be able to submit a question. |
| **BR-CHATBOT-003** | AI Service Unavailability Handling | [MVP] | If the chatbot is temporarily unable to produce a response, the user must be clearly told the service is unavailable right now — never receive silence, a broken reply, or a made-up answer. |

---

### 7.12 Public (Unauthorized User) Access

| Code | Rule Title | Priority | Description / Policy |
|------|-----------|----------|---------------------|
| **BR-PUBLIC-001** | Unauthorized User Read-Only Access | [MVP] | A guest who has not logged in may search for and view published blogs and videos, but cannot comment, vote, upload, create content, edit a profile, or use the AI Nutrition Chatbot. Any attempt to do one of these must prompt the guest to log in first, with a clear explanation — never fail silently. |

---

## 8. Main Flows & Use Cases

### 8.1 Main Flows (MF)

#### MF-01 – Browse and Search Vegan Content

| Step | Actor | System Action | User Action |
|------|-------|---------------|-------------|
| 1 | — | Displays available vegan content | User accesses VEGALIFE application |
| 2 | System | Displays blogs, videos, recipes | User browses available content |
| 3 | — | — | User enters keyword, food name, or recipe name |
| 4 | System | Searches for matching content | — |
| 5 | System | Displays search results | User selects a content item |
| 6 | System | Displays selected content and related content | — |

**Precondition:** None (public flow)
**Postcondition:** User views content details

---

#### MF-02 – Create and Publish Vegan Content

| Step | Actor | System Action | User Action |
|------|-------|---------------|-------------|
| 1 | System | — | Authenticated User selects Create Post |
| 2 | — | — | User writes the content |
| 3 | — | — | User selects media (images/videos) |
| 4 | — | — | User selects Publish |
| 5 | System | Checks submitted content for violations | — |
| 6 | System | If no violation, checks if media selected | — |
| 7 | System | Stores media in Cloud Storage | — |
| 8 | System | Stores post in User's My Post section | — |
| 9 | System | Redirects to home page with new post | User receives notification |

**Precondition:** User is authenticated
**Postcondition:** Post saved and visible (pending approval if required)
**Exception:** Content violation detected → Post rejected, user notified

---

#### MF-03 – Find Nearby Vegan Shops and Restaurants

| Step | Actor | System Action | User Action |
|------|-------|---------------|-------------|
| 1 | — | — | User selects Nearby Vegan Places |
| 2 | System | Requests location permission | — |
| 3 | — | — | User grants location permission |
| 4 | System | Obtains user's current location | — |
| 5 | System | Sends search request with location to Map Service | — |
| 6 | Map Service | Searches for nearby vegan/vegetarian shops | — |
| 7 | Map Service | Returns nearby places to System | — |
| 8 | System | Displays available places on map | User selects a place |
| 9 | System | Displays selected place's details | — |

**Precondition:** User has location feature accessible
**Postcondition:** User views nearby vegan places
**Exception:** Location permission denied → Manual address input fallback

---

#### MF-04 – Consult AI Nutrition Chatbot

| Step | Actor | System Action | User Action |
|------|-------|---------------|-------------|
| 1 | — | — | User opens AI Nutrition Chatbot |
| 2 | System | Checks user's authentication status | — |
| 3a | System | Allows authorized user to enter question | Authorized user enters nutrition question |
| 3b | System | Checks trial quota for unauthorized user | Unauthorized user enters question (if quota available) |
| 4 | System | Sends question to AI Nutrition Chatbot | — |
| 5 | AI Chatbot | Generates response | — |
| 6 | System | Displays response to user | — |
| 7 | — | — | User decides: ask another question or close |
| 8 | System | Allows continuation or closes chatbot | — |

**Precondition:** None (available to all users)
**Postcondition:** Conversation saved (authenticated users only)
**Exception:** Guest quota exhausted → Prompt to register/login

---

#### MF-05 – Create Weekly Vegan Menu (AI Meal Planner)

| Step | Actor | System Action | User Action |
|------|-------|---------------|-------------|
| 1 | — | — | User selects Weekly Menu Planner |
| 2 | System | Displays personal information input form | — |
| 3 | — | — | User enters: age, gender, height, weight, activity level |
| 4 | — | — | User selects health goal (weight loss/maintenance/muscle gain) |
| 5 | — | — | User enters allergies, dietary restrictions, available ingredients |
| 6 | — | — | User submits information |
| 7 | System | Validates submitted information | — |
| 8 | System | Checks whether information is complete | — |
| 9 | System | Sends user info to AI Meal Planner | — |
| 10 | AI Meal Planner | Analyzes info and generates personalized weekly meal plan | — |
| 11 | AI Meal Planner | Returns generated weekly plan to System | — |
| 12 | System | Displays generated weekly plan | User reviews the plan |
| 13 | — | — | User saves the weekly menu |
| 14 | System | Confirms weekly menu saved | — |

**Precondition:** User is authenticated, has active paid package for AI Meal Planner
**Postcondition:** Weekly menu saved in user's account
**Exception:** Incomplete info → Prompt for missing fields; No paid package → Prompt to subscribe

---

### 8.2 Use Cases

| ID | Use Case | Actor | Primary Flow | Exception Flow |
|----|----------|-------|--------------|----------------|
| UC-01 | Register Account | Guest | Fill form → Submit → Account created | Duplicate username/email |
| UC-02 | Login | Guest/User | Enter credentials → Validate → Return tokens | Wrong credentials, suspended account |
| UC-03 | Logout | User/Admin | Click logout → Invalidate tokens | Token expired |
| UC-04 | Browse Vegan Content | Guest/User/Admin | Load page → View content → Browse posts/videos | No content → Show empty state |
| UC-05 | Search Content | Guest/User/Admin | Enter keyword → Fetch matches → Display results | No results → Show suggestions |
| UC-06 | Create Blog Post | User/Admin | Write content → Select media → Publish → Content check → Store media → Save post | Content violation, validation error |
| UC-07 | Edit Blog Post | Author/Admin | Open post → Modify → Save | Not owner → Redirect to login |
| UC-08 | Delete Blog Post | Author/Admin | Confirm → Soft delete | Not owner → Forbidden |
| UC-09 | Approve/Reject Post | Admin | Review processed post → Approve or Reject | — |
| UC-10 | Upload Video | User/Admin | Select file → Upload → Process → Succeed | File too large, unsupported format |
| UC-11 | View Video Feed | Guest/User/Admin | Load page → Fetch videos | No videos → Show empty state |
| UC-12 | Comment on Post | User/Admin | Type comment → Submit → Save | Not logged in → Redirect to login |
| UC-13 | Reply to Comment | User/Admin | Select parent → Type → Submit | Parent deleted → Show error |
| UC-14 | Vote on Post | User/Admin | Click upvote/downvote → Save | Already voted → Toggle vote |
| UC-15 | Create Meal Plan | User (Paid) | Fill BMI + activity + goals + restrictions → AI generates plan → Review → Save | Missing BMI data, no paid package, incomplete info |
| UC-16 | View Meal Plan | User | Navigate to page → Fetch menu | No plan exists → Show create CTA |
| UC-17 | Search Nearby Places | Guest/User/Admin | Grant location → Get location → Fetch nearby → Display on map | GPS denied → Manual input |
| UC-18 | View Place Details | Guest/User/Admin | Select place from map → View details | — |
| UC-19 | Global Search | Guest/User/Admin | Enter keyword → Aggregate results | No results → Show suggestions |
| UC-20 | Chat with AI Bot | User/Guest | Type question → Send AI → Receive answer → Continue or close | Guest limit exceeded → Prompt register |
| UC-21 | Manage Categories | Admin | Create/edit/delete category | Name conflict → Error |
| UC-22 | Moderate Content | Admin | Review post/comment → Hide/remove | Already hidden → No-op |
| UC-23 | Suspend User | Admin | Select user → Set status=suspended | Already suspended → No-op |
| UC-24 | Update Profile | User/Admin | Modify fields → Save | Invalid BMI metrics → Reject |
| UC-25 | Verify Email | User | Click verification link → Account activated | Link expired → Resend link |

---

## 9. Màn hình và Route

### 9.1 Public Shell (Guest)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Hero banner, featured posts, trending videos |
| `/blog` | BlogPage | List of published blog posts |
| `/blog/:id` | BlogDetailPage | Full blog post content + comments |
| `/videos` | VideoPage | Grid of cooking tutorial videos |
| `/video/:id` | VideoDetailPage | Video player + metadata |
| `/restaurants` | RestaurantPage | Map/list of vegan shops |
| `/search` | SearchPage | Global search interface |
| `/chatbot` | ChatbotPage | AI Nutrition Chatbot (limited for guest) |
| `/register` | Auth/Register | Registration form |
| `/login` | Auth/Login | Login form |
| `/*` | NotFoundPage | 404 page |

### 9.2 User Shell (Authorized User)

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | HomePage | Personalized feed |
| `/profile` | ProfilePage | View/edit own profile + BMI metrics |
| `/profile/edit` | Profile/Edit | Edit profile form |
| `/blog/create` | CreatePostPage | Create new blog post |
| `/blog/:id/edit` | EditPostPage | Edit existing post |
| `/my-posts` | Profile/MyPosts | List of user's own posts |
| `/videos/upload` | UploadVideoPage | Upload cooking video |
| `/meal-plan` | MealPlanPage | View/create weekly meal plan |
| `/meal-plan/create` | MealPlan/Create | Create new meal plan wizard |
| `/restaurants` | RestaurantPage | Search vegan shops |
| `/search` | SearchPage | Global search |
| `/chatbot` | ChatbotPage | Full AI Chatbot access |

### 9.3 Admin Shell

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/dashboard` | Admin/Dashboard | Stats overview |
| `/admin/users` | Admin/Users | Manage registered members |
| `/admin/posts` | Admin/Posts | Manage all blog posts |
| `/admin/videos` | Admin/Videos | Manage all videos |
| `/admin/comments` | Admin/Comments | Moderate comments |
| `/admin/categories` | Admin/Categories | CRUD categories |
| `/admin/locations` | Admin/Locations | Manage shop/restaurant entries |

---

## 10. Data Model

### 10.1 Entity Schema Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
├──────────────────────────────────────────────────────────────────┤
│ user (id, username, email, password_hash, role, status, ...)     │
│ user_profile (id, user_id FK, height_cm, weight_kg, age, ...)   │
├──────────────────────────────────────────────────────────────────┤
│                       CONTENT                                   │
├──────────────────────────────────────────────────────────────────┤
│ post (id, user_id FK, location_id FK, title, content, status)   │
│ post_category (post_id FK, category_id FK)                      │
│ post_media (post_id FK, media_id FK)                            │
│ post_recipe (post_id FK, recipe_id FK)                          │
│ comment (id, user_id FK, parent_id FK, post_id FK, content)     │
│ vote (id, user_id FK, post_id FK, vote_type)                    │
│ media (id, media_url, thumbnail_url, status, mime_type, ...)    │
├──────────────────────────────────────────────────────────────────┤
│                     RECIPES                                     │
├──────────────────────────────────────────────────────────────────┤
│ category (id, name, description)                                │
│ dish (id, name, description, image_url, cuisine_type)           │
│ recipe (id, dish_id FK, user_id FK, name, instructions, ...)    │
│ recipe_ingredient (recipe_id FK, ingredient_id FK, amount, unit)│
│ ingredient (id, name, calories, protein_g, ...)                 │
├──────────────────────────────────────────────────────────────────┤
│                     MEAL PLAN                                   │
├──────────────────────────────────────────────────────────────────┤
│ menu (id, user_id FK, start_date, end_date, status)             │
│ menu_detail (id, menu_id FK, dish_id FK, date, meal_type)       │
├──────────────────────────────────────────────────────────────────┤
│                   LOCATION                                      │
├──────────────────────────────────────────────────────────────────┤
│ location (id, name, address, latitude, longitude, place_type, ..)│
├──────────────────────────────────────────────────────────────────┤
│                       AI                                       │
├──────────────────────────────────────────────────────────────────┤
│ ai_conversation (id, user_id FK, title, summary, recent_messages)│
│ ai_message (id, conversation_id FK, role, content)              │
│ ai_usage (id, user_id FK, request_count, period_start, ...)     │
└──────────────────────────────────────────────────────────────────┘
```

### 10.2 Relationships

| Relationship | Type | Cascade |
|-------------|------|---------|
| User ↔ UserProfile | 1:1 | ON DELETE CASCADE |
| User → Post | 1:N | ON DELETE CASCADE |
| User → Comment | 1:N | ON DELETE CASCADE |
| User → Vote | 1:N | ON DELETE CASCADE |
| User → Menu | 1:N | ON DELETE CASCADE |
| User → AI_Conversation | 1:N | ON DELETE SET NULL |
| Post ↔ Category | M:N | ON DELETE CASCADE |
| Post ↔ Media | M:N | ON DELETE CASCADE |
| Post ↔ Recipe | M:N | ON DELETE CASCADE |
| Post → Comment | 1:N (recursive) | ON DELETE CASCADE |
| Comment → Comment | 1:N (parent_id) | ON DELETE CASCADE |
| Menu → Menu_Detail | 1:N | ON DELETE CASCADE |
| Menu_Detail → Dish | N:1 | ON DELETE CASCADE |
| Recipe → Dish | N:1 | ON DELETE CASCADE |
| Recipe ↔ Ingredient | M:N | ON DELETE CASCADE |
| AI_Conversation → AI_Message | 1:N | ON DELETE CASCADE |

### 10.3 Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| user | idx_user_email | Fast email lookup for login |
| user | idx_user_status | Filter active users |
| user_profile | idx_user_profile_user_id | Join with user |
| post | idx_post_user_id | User's posts |
| post | idx_post_location_id | Location-based posts |
| post | idx_post_status | Filter by status |
| post | idx_post_published_at | Sort by publish date |
| comment | idx_comment_post_id | Post's comments |
| comment | idx_comment_user_id | User's comments |
| comment | idx_comment_parent_id | Nested replies |
| vote | idx_vote_post_id | Post's votes |
| menu | idx_menu_user_id | User's menus |
| menu | idx_menu_start_date | Date range queries |
| menu_detail | idx_menu_detail_date_meal | Quick lookup by day+meal |
| location | idx_location_coords | Spatial queries (nearby) |
| location | idx_location_place_type | Filter by type |
| ai_conversation | idx_ai_conversation_user_id | User's conversations |
| ai_message | idx_ai_message_conversation_id | Conversation messages |

---

## 11. API Requirements

### 11.1 Quy ước

| Quy ước | Giá trị |
|---------|---------|
| **Base URL** | `/api/v1` |
| **Format** | RESTful JSON |
| **Auth Header** | `Authorization: Bearer <token>` |
| **Content-Type** | `application/json` |
| **Pagination** | `?page=1&size=20` → `{ data, total, page, size, totalPages }` |
| **Sorting** | `?sort=createdAt,desc` |
| **Date Format** | ISO 8601: `2026-09-29T10:30:00Z` |
| **ID Format** | UUID v4 |

### 11.2 Endpoint Table

#### Auth Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new account |
| POST | `/api/v1/auth/login` | Public | Login, get tokens |
| POST | `/api/v1/auth/logout` | Auth | Logout, invalidate tokens |
| POST | `/api/v1/auth/refresh` | Auth (refresh) | Refresh access token |
| PUT | `/api/v1/auth/password` | Auth | Change password |

#### User Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/users/me` | Auth | Get own profile |
| PUT | `/api/v1/users/me` | Auth | Update own profile |
| GET | `/api/v1/users/:id` | Auth | Get user by ID |
| GET | `/api/v1/users` | Admin | List all users (paginated) |
| PATCH | `/api/v1/users/:id/status` | Admin | Update user status |

#### Post Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/posts` | Public | List published posts (paginated) |
| GET | `/api/v1/posts/:id` | Public | Get post detail |
| POST | `/api/v1/posts` | Auth | Create new post |
| PUT | `/api/v1/posts/:id` | Auth (owner/Admin) | Update post |
| DELETE | `/api/v1/posts/:id` | Auth (owner/Admin) | Soft delete post |
| GET | `/api/v1/posts/user/:userId` | Public | Get user's posts |

#### Comment Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/posts/:postId/comments` | Public | Get comments for post |
| POST | `/api/v1/posts/:postId/comments` | Auth | Add comment |
| POST | `/api/v1/comments/:id/reply` | Auth | Reply to comment |
| DELETE | `/api/v1/comments/:id` | Auth (owner/Admin) | Soft delete comment |

#### Vote Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/posts/:postId/vote` | Auth | Upvote/Downvote post |
| DELETE | `/api/v1/posts/:postId/vote` | Auth | Remove vote |

#### Media Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/media` | Public | List videos (paginated) |
| GET | `/api/v1/media/:id` | Public | Get media detail |
| POST | `/api/v1/media/upload` | Auth | Upload video/image |
| DELETE | `/api/v1/media/:id` | Auth (owner/Admin) | Soft delete media |

#### Category Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/categories` | Public | List all categories |
| POST | `/api/v1/categories` | Admin | Create category |
| PUT | `/api/v1/categories/:id` | Admin | Update category |
| DELETE | `/api/v1/categories/:id` | Admin | Soft delete category |

#### Dish Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/dishes` | Public | List all dishes |
| GET | `/api/v1/dishes/:id` | Public | Get dish detail |

#### Recipe Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/recipes` | Public | List recipes (paginated) |
| GET | `/api/v1/recipes/:id` | Public | Get recipe detail |
| POST | `/api/v1/recipes` | Auth | Create recipe |
| PUT | `/api/v1/recipes/:id` | Auth (owner/Admin) | Update recipe |
| DELETE | `/api/v1/recipes/:id` | Auth (owner/Admin) | Soft delete recipe |

#### Meal Plan Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/menus` | Auth | List user's menus |
| GET | `/api/v1/menus/:id` | Auth (owner) | Get menu detail |
| POST | `/api/v1/menus` | Auth | Create menu |
| POST | `/api/v1/menus/:id/generate` | Auth | Auto-generate from BMI + ingredients |
| PUT | `/api/v1/menus/:id` | Auth (owner) | Update menu |
| DELETE | `/api/v1/menus/:id` | Auth (owner) | Cancel menu |

#### Location Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/locations` | Public | List locations (paginated) |
| GET | `/api/v1/locations/nearby` | Public | Nearby locations by lat/lng |
| POST | `/api/v1/locations` | Admin | Create location |
| PUT | `/api/v1/locations/:id` | Admin | Update location |
| DELETE | `/api/v1/locations/:id` | Admin | Soft delete location |

#### Search Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/search?q=<query>` | Public | Global search (posts, videos, recipes, locations) |

#### AI Module

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/ai/conversations` | Auth | List user's conversations |
| POST | `/api/v1/ai/conversations` | Auth | Create new conversation |
| GET | `/api/v1/ai/conversations/:id` | Auth (owner) | Get conversation with messages |
| POST | `/api/v1/ai/conversations/:id/messages` | Auth | Send message, receive AI response |
| DELETE | `/api/v1/ai/conversations/:id` | Auth (owner) | Delete conversation |

### 11.3 Request/Response Sample

#### Login Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "vegan_chef",
    "email": "chef@vegalife.com",
    "role": "USER",
    "avatarUrl": "https://cdn.vegalife.com/avatars/123.jpg"
  }
}
```

#### Create Post Request
```json
{
  "title": "Cách làm phở chay ngon tại nhà",
  "content": "Phở chay là món ăn...",
  "categoryIds": ["cat-1", "cat-2"],
  "featuredImageUrl": "https://cdn.vegalife.com/posts/456.jpg",
  "locationId": "loc-1"
}
```

#### Create Post Response
```json
{
  "id": "post-uuid-here",
  "title": "Cách làm phở chay ngon tại nhà",
  "content": "Phở chay là món ăn...",
  "status": "created",
  "viewCount": 0,
  "author": {
    "id": "user-uuid",
    "username": "vegan_chef"
  },
  "categories": [...],
  "createdAt": "2026-09-29T10:30:00Z"
}
```

#### Search Response
```json
{
  "query": "pho chay",
  "results": {
    "posts": [
      {
        "id": "post-1",
        "title": "Cách làm phở chay...",
        "type": "post"
      }
    ],
    "videos": [
      {
        "id": "media-1",
        "title": "Hướng dẫn phở chay",
        "type": "video"
      }
    ],
    "recipes": [
      {
        "id": "recipe-1",
        "name": "Phở chay truyền thống",
        "type": "recipe"
      }
    ],
    "locations": []
  },
  "total": 3
}
```

---

## 12. Error Codes

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| ERR-001 | 400 | Bad Request | Invalid request payload |
| ERR-002 | 401 | Unauthorized | Missing or invalid authentication token |
| ERR-003 | 403 | Forbidden | Insufficient permissions for this action |
| ERR-004 | 404 | Not Found | Resource does not exist |
| ERR-005 | 409 | Conflict | Duplicate username or email |
| ERR-006 | 409 | Conflict | Already voted on this post |
| ERR-007 | 413 | Payload Too Large | File exceeds size limit (100MB) |
| ERR-008 | 415 | Unsupported Media Type | Invalid file format |
| ERR-009 | 422 | Unprocessable Entity | Validation error (password policy, BMI range) |
| ERR-010 | 429 | Too Many Requests | Rate limit exceeded |
| ERR-011 | 451 | Unavailable For Legal Reasons | Content removed by admin |
| ERR-020 | 401 | Token Expired | Access token has expired, refresh needed |
| ERR-021 | 401 | Refresh Token Expired | Refresh token expired, re-login required |
| ERR-030 | 403 | Account Suspended | User account is suspended by admin |
| ERR-031 | 403 | Account Deactivated | User account is deactivated |
| ERR-050 | 400 | Guest Chat Limit Exceeded | Unauthorized user exceeded 3 chat queries |
| ERR-100 | 500 | Internal Server Error | Unexpected server error |
| ERR-101 | 502 | Bad Gateway | External service (AI provider) unavailable |
| ERR-102 | 503 | Service Unavailable | Database connection failed |

### Error Response Format
```json
{
  "error": {
    "code": "ERR-005",
    "message": "Duplicate username or email",
    "details": {
      "field": "email",
      "value": "test@example.com"
    },
    "timestamp": "2026-09-29T10:30:00Z"
  }
}
```

---

## 13. Transaction & Concurrency

### 13.1 Transaction Flow

| Operation | Transaction Scope | Isolation |
|-----------|-------------------|-----------|
| Create Post + Assign Categories | `post` insert + `post_category` inserts | READ_COMMITTED |
| Create Menu + Generate Details | `menu` insert + multiple `menu_detail` inserts | READ_COMMITTED |
| Vote Toggle | Delete old vote (if exists) + insert new vote | READ_COMMITTED |
| Create Comment + Increment Post Views | `comment` insert + `post.view_count++` | READ_COMMITTED |
| AI Message + Usage Count | `ai_message` insert + `ai_usage.request_count++` | READ_COMMITTED |

### 13.2 Idempotency

| Endpoint | Idempotent? | Strategy |
|----------|-------------|----------|
| POST /auth/register | No | Unique constraint on email/username |
| POST /posts | No | Auto-generated UUID |
| POST /posts/:id/vote | Yes | UNIQUE(user_id, post_id) — toggle on duplicate |
| POST /comments | No | Auto-generated UUID |
| POST /media/upload | No | Unique file hash (SHOULD) |
| POST /menus/:id/generate | Yes | Check if draft exists for date range |

### 13.3 Concurrency Handling

| Scenario | Strategy |
|----------|----------|
| Concurrent vote changes | Optimistic lock or REPLACE INTO |
| Concurrent post edits | Last-write-wins with `updated_at` check |
| Concurrent meal plan generation | Row-level lock on menu during generation |
| View count increment | Batched counter (increment every N views) |

---

## 14. Non-functional Requirements

### 14.1 Bảo mật

| Requirement | Implementation |
|-------------|----------------|
| Password hashing | BCrypt (cost factor ≥ 12) |
| Token security | JWT in httpOnly cookies, CSRF protection |
| Input validation | Yup (frontend) + Bean Validation (backend) |
| SQL injection prevention | Parameterized queries (JPA/Hibernate) |
| XSS prevention | React auto-escaping, CSP headers |
| CORS | Whitelist frontend origin only |
| Rate limiting | 100 req/min per IP on auth endpoints |
| HTTPS | Required in production |
| Sensitive data | Never log passwords, tokens, PII |

### 14.2 Hiệu năng

| Metric | Target |
|--------|--------|
| API p95 response time | ≤ 500ms |
| API p99 response time | ≤ 1000ms |
| Page load (first content) | ≤ 2s on 4G |
| Time to Interactive | ≤ 3.5s |
| Database query time | ≤ 100ms per query (with indexes) |
| Static asset caching | Cache-Control: max-age=31536000 (immutable) |
| CDN | Static assets served via CDN (SHOULD) |

### 14.3 Khả dụng

| Requirement | Target |
|-------------|--------|
| Uptime | ≥ 99% monthly |
| Health check | `GET /actuator/health` returns OK |
| Graceful degradation | AI features fallback to static responses |
| Error pages | Custom 404, 500 pages |
| Maintenance mode | Admin-controlled maintenance flag |

### 14.4 Tương thích

| Platform | Browser | Minimum Version |
|----------|---------|-----------------|
| Desktop | Chrome | 120+ |
| Desktop | Firefox | 120+ |
| Desktop | Safari | 17+ |
| Desktop | Edge | 120+ |
| Mobile | Chrome Android | 120+ |
| Mobile | Safari iOS | 17+ |

### 14.5 Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | Minimum 4.5:1 for text |
| Keyboard navigation | All interactive elements focusable |
| ARIA labels | Images, buttons, forms labeled |
| Screen reader | Semantic HTML, proper heading hierarchy |
| Focus indicators | Visible focus ring on all interactive elements |

---

## 15. UI States

### 15.1 Loading States

| Component | State | Behavior |
|-----------|-------|----------|
| Blog Feed | Skeleton | Show placeholder cards with shimmer animation |
| Video Grid | Skeleton | Show placeholder thumbnails |
| Profile Page | Spinner | Centered spinner while fetching data |
| AI Chatbot | Typing indicator | "..." animation while AI is responding |
| Form Submit | Disabled button | Button shows loading spinner, disabled |

### 15.2 Empty States

| Component | Condition | UI |
|-----------|-----------|-----|
| Blog Feed | No published posts | Illustration + "No posts yet" + CTA to create |
| Video Feed | No videos | Illustration + "No videos yet" |
| Meal Plan | No plans created | "Create your first meal plan" CTA card |
| Comments | No comments | "Be the first to comment" prompt |
| Search Results | No matches | "No results for '{query}'" + suggestions |
| Restaurants | None nearby | "No vegan shops found nearby" + expand radius option |

### 15.3 Error States

| Component | Condition | UI |
|-----------|-----------|-----|
| Any page | Network error | Retry button + error message |
| Form submission | Validation error | Inline field errors in red |
| Image upload | Failed | "Upload failed. Try again" with retry button |
| Video playback | Error | "Unable to play video" + fallback thumbnail |
| AI Chatbot | Provider unavailable | "AI temporarily unavailable. Try again later" |

---

## 16. Acceptance Criteria

| ID | Criterion | Priority | Verified By |
|----|-----------|----------|-------------|
| AC-01 | User can register with valid credentials | [MVP] | Unit Test |
| AC-02 | User can login and receive JWT tokens | [MVP] | Integration Test |
| AC-03 | Guest cannot access protected routes | [MVP] | E2E Test |
| AC-04 | User can create, edit, delete own posts | [MVP] | Integration Test |
| AC-05 | Admin can delete any post | [MVP] | Integration Test |
| AC-06 | Published posts appear in public feed | [MVP] | E2E Test |
| AC-07 | User can comment and reply to comments | [MVP] | Integration Test |
| AC-08 | User can upvote/downvote posts | [MVP] | Integration Test |
| AC-09 | User can upload video | [MVP] | Integration Test |
| AC-10 | User can create meal plan based on BMI | [MVP] | Integration Test |
| AC-11 | Meal plan respects BMI category needs | [MVP] | Unit Test |
| AC-12 | User can search vegan shops by location | [MVP] | E2E Test |
| AC-13 | Global search returns posts, videos, recipes | [MVP] | E2E Test |
| AC-14 | AI Chatbot responds to nutrition questions | [MVP] | Integration Test |
| AC-15 | Guest limited to 3 chat queries | [MVP] | E2E Test |
| AC-16 | Admin can manage categories | [MVP] | Integration Test |
| AC-17 | Admin can suspend users | [MVP] | Integration Test |
| AC-18 | Admin can moderate comments | [MVP] | Integration Test |
| AC-19 | API response time p95 ≤ 500ms | [MVP] | Load Test |
| AC-20 | All pages responsive on mobile | [MVP] | Manual Test |
| AC-21 | WCAG 2.1 AA compliance | [SHOULD] | Audit Tool |
| AC-22 | Soft delete implemented on all entities | [MVP] | Code Review |
| AC-23 | Password meets complexity policy | [MVP] | Unit Test |
| AC-24 | Token refresh works without re-login | [MVP] | Integration Test |

---

## 17. Test Strategy

### 17.1 Unit Tests

| Layer | Framework | Coverage Target |
|-------|-----------|-----------------|
| Service | JUnit 5 + Mockito | ≥ 80% |
| Utils | JUnit 5 | ≥ 90% |
| BMI Calculator | JUnit 5 | 100% |
| Validation | JUnit 5 | 100% |

**Test examples:**
```java
// BMI calculation
@Test
void calculateBmi_normalWeight_returnsNormal() {
    double bmi = BmiCalculator.calculate(65, 170); // 65kg, 170cm
    assertEquals(BmiCategory.NORMAL, BmiCalculator.categorize(bmi));
}

// Vote toggle
@Test
void toggleVote_upvoteThenDownvote_resultsInDownvote() {
    voteService.toggleVote(userId, postId, VoteType.UPVOTE);
    voteService.toggleVote(userId, postId, VoteType.DOWNVOTE);
    assertTrue(voteRepository.existsByUserIdAndPostIdAndVoteType(userId, postId, VoteType.DOWNVOTE));
}
```

### 17.2 Integration Tests

| Layer | Framework | Approach |
|-------|-----------|----------|
| Repository | JUnit 5 + H2 In-Memory DB | Test real DB interactions |
| Controller | MockMvc | HTTP layer testing |
| Auth Flow | MockMvc + JWT | Full login/token flow |
| Meal Plan Generation | JUnit 5 + Real Service | End-to-end generation logic |

### 17.3 E2E Tests

| Tool | Coverage |
|------|----------|
| Playwright / Cypress | Critical user flows |

**E2E Scenarios:**
1. Register → Login → Create Post → Publish → View in Feed
2. Login → Comment on Post → Vote on Post
3. Login → Create Meal Plan → View Meal Plan
4. Guest → Search → View Results → Attempt Chatbot (limit test)
5. Admin → Login → Manage Users → Suspend User → Verify Login Blocked
6. Upload Video → Wait Processing → View in Video Feed

### 17.4 Security Tests

| Test | Tool | Description |
|------|------|-------------|
| OWASP ZAP | ZAP Scanner | Automated vulnerability scan |
| SQL Injection | Manual | Test all inputs for injection |
| XSS | Manual | Test all user-generated content rendering |
| JWT Tampering | Manual | Test token signature validation |
| Rate Limiting | k6 / Artillery | Verify rate limits enforced |

### 17.5 Load Tests

| Tool | Scenario | Target |
|------|----------|--------|
| k6 | Homepage load | 1000 concurrent users |
| k6 | API search | 500 req/s |
| k6 | Video upload | 50 concurrent uploads |

---

## 18. Kiến trúc đề xuất

### 18.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Routes   │  │ Components│  │ Stores  │  │ TanStack Query│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/HTTPS (REST API)
                           │ Authorization: Bearer JWT
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SPRING BOOT BACKEND                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   API Layer (Controllers)                 │   │
│  │  /auth  /users  /posts  /comments  /votes  /media       │   │
│  │  /categories  /dishes  /recipes  /menus  /locations     │   │
│  │  /search  /ai                                              │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │                  Service Layer                            │   │
│  │  AuthService  PostService  CommentService  MealPlan...   │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │                Repository Layer (JPA)                     │   │
│  │  UserRepository  PostRepository  ...                      │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │                  Database (PostgreSQL)                    │   │
│  │  Tables: user, post, comment, vote, menu, location, ...  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              External Services                            │   │
│  │  AI Provider (LLM API)  Cloud Storage (S3)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 18.2 Tech Stack & Responsibility

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Frontend UI** | React 19 + TypeScript | Component rendering, routing, state |
| **Styling** | Tailwind CSS 4 + class-variance-authority | Utility-first styling, variant patterns |
| **Build** | Vite 8 | Fast dev server, optimized production build |
| **State** | Zustand | Client-side state (auth, theme, UI) |
| **Data Fetching** | TanStack Query v5 | Caching, background refetch, pagination |
| **HTTP Client** | Axios | API calls, interceptors for auth |
| **Validation** | Yup + Formik | Form validation schemas |
| **Notifications** | Sonner | Toast notifications |
| **Icons** | Lucide React | Icon library |
| **Theme** | next-themes | Dark/light mode |
| **Backend** | Spring Boot 3.5.5 + Java 21 | REST API, business logic |
| **ORM** | Spring Data JPA + Hibernate | Database abstraction, queries |
| **Migration** | Flyway | Schema versioning |
| **Security** | Spring Security + JWT | Authentication, authorization |
| **Docs** | SpringDoc OpenAPI | Swagger UI auto-generation |
| **Database** | PostgreSQL | Relational data storage |
| **Storage** | Cloud Storage (S3-compatible) | Media files, images, videos |
| **AI** | External LLM API | Natural language responses |
| **Testing** | JUnit 5, Mockito, MockMvc, H2 | Backend tests |
| **E2E** | Playwright/Cypress | Frontend E2E tests |
| **CI/CD** | GitHub Actions | Build, test, deploy automation |

### 18.3 Package Structure (Backend)

```
com.vegalife/
├── VegalifeApplication.java
├── shared/
│   ├── config/          # Security, CORS, Jackson, Flyway configs
│   ├── security/        # JWT filter, UserDetailsService, PasswordEncoder
│   ├── exception/       # GlobalExceptionHandler, custom exceptions
│   └── util/            # Common utilities (BMI calc, date helpers)
├── user/
│   ├── controller/      # AuthController, UserController
│   ├── service/         # AuthService, UserService
│   └── repository/      # UserRepository, UserProfileRepository
├── content/
│   ├── controller/      # PostController, CommentController, VoteController
│   ├── service/         # PostService, CommentService, VoteService
│   └── repository/      # PostRepository, CommentRepository, VoteRepository
├── media/
│   ├── controller/      # MediaController
│   ├── service/         # MediaService (upload, process)
│   └── repository/      # MediaRepository
├── recipe/
│   ├── controller/      # CategoryController, DishController, RecipeController
│   ├── service/         # CategoryService, DishService, RecipeService
│   └── repository/      # CategoryRepository, DishRepository, RecipeRepository
├── mealplan/
│   ├── controller/      # MenuController
│   ├── service/         # MenuService, MealPlanGenerator
│   └── repository/      # MenuRepository, MenuDetailRepository
├── location/
│   ├── controller/      # LocationController
│   ├── service/         # LocationService (nearby search)
│   └── repository/      # LocationRepository
├── search/
│   ├── controller/      # SearchController
│   └── service/         # SearchService (aggregate across modules)
└── ai/
    ├── controller/      # AiChatController
    ├── service/         # AiChatService (LLM integration)
    └── repository/      # AiConversationRepository, AiMessageRepository
```

---

## 19. Seed Data & Demo

### 19.1 Dữ liệu seed

```sql
-- Categories
INSERT INTO category (id, name, description) VALUES
  ('cat-1', 'Pure Vegan', '100% plant-based recipes'),
  ('cat-2', 'High-Protein Vegan', 'Protein-rich vegan meals'),
  ('cat-3', 'Quick & Easy', 'Recipes under 30 minutes'),
  ('cat-4', 'Vegan Desserts', 'Sweet treats without animal products');

-- Dishes
INSERT INTO dish (id, name, description, cuisine_type) VALUES
  ('dish-1', 'Phở Chay', 'Traditional Vietnamese vegan pho', 'Vietnamese'),
  ('dish-2', 'Bún Chả Chay', 'Vegan bun cha with grilled tofu', 'Vietnamese'),
  ('dish-3', 'Cơm Tấm Chay', 'Vegan broken rice with BBQ seitan', 'Vietnamese'),
  ('dish-4', 'Green Curry Vegan', 'Thai green curry with vegetables', 'Thai');

-- Ingredients
INSERT INTO ingredient (id, name, calories, protein_g, carbohydrate_g, fat_g, fiber_g) VALUES
  ('ing-1', 'Tofu', 144, 17.3, 4.3, 8.7, 2.3),
  ('ing-2', 'Brown Rice', 123, 2.7, 25.6, 1.0, 1.8),
  ('ing-3', 'Broccoli', 55, 3.7, 11.2, 0.6, 5.1),
  ('ing-4', 'Coconut Milk', 230, 2.3, 3.3, 24.0, 0.0);

-- Sample User (Admin) -- password: VegalifeAdmin@2026 (BCrypt hashed)
INSERT INTO "user" (id, username, email, password_hash, role, status, email_verified) VALUES
  ('admin-1', 'admin_vegalife', 'admin@vegalife.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJAWiE2ZC16', 'ADMIN', 'activated', true);

-- Sample User (Regular)
INSERT INTO "user" (id, username, email, password_hash, role, status, email_verified) VALUES
  ('user-1', 'vegan_chef', 'chef@vegalife.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJAWiE2ZC16', 'USER', 'activated', true);

-- Sample UserProfile
INSERT INTO user_profile (id, user_id, height_cm, weight_kg, age, gender) VALUES
  ('prof-1', 'user-1', 170.00, 65.00, 28, 'female');

-- Sample Location (Vegan Shop)
INSERT INTO location (id, name, address, latitude, longitude, place_type, rating, price_level) VALUES
  ('loc-1', 'Green Garden Vegan', '123 Nguyen Hue, District 1, HCMC', 10.7769, 106.7009, 'restaurant', 4.5, 2),
  ('loc-2', 'Organic Market', '45 Le Loi, District 1, HCMC', 10.7750, 106.7020, 'grocery', 4.2, 2);
```

### 19.2 Hero Demo Script

```
1. [Guest] Mở trang chủ → Xem hero banner với featured posts
2. [Guest] Scroll xuống → Xem trending videos
3. [Guest] Click vào 1 blog post → Đọc nội dung + comments
4. [Guest] Vào /chatbot → Gửi 3 câu hỏi miễn phí
   Q1: "Ăn chay có đủ protein không?"
   Q2: "Thay trứng bằng gì khi bake cake?"
   Q3: "BMI bao nhiêu là tốt?"
5. [Guest] Câu thứ 4 → Hiển thị prompt "Register for full access"
6. [Guest] Click Register → Điền form → Account created
7. [User] Login → Dashboard personalized
8. [User] Vào Profile → Cập nhật BMI (170cm, 65kg → BMI 22.5 Normal)
9. [User] Vào /meal-plan → Tạo meal plan tuần này
   → Chọn nguyên liệu: tofu, broccoli, brown rice, coconut milk
   → System generate 7-day plan phù hợp Normal BMI
10. [User] Vào /blog/create → Tạo blog post mới → Publish
11. [User] Vào /videos/upload → Upload video hướng dẫn nấu phở chay
12. [User] Vào /restaurants → Tìm vegan shop gần vị trí
13. [User] Vào /search → Tìm "pho chay" → Xem kết quả aggregate
14. [Admin] Login vào /admin → Xem stats dashboard
15. [Admin] Vào /admin/posts → Duyệt post chờ approve
16. [Admin] Vào /admin/categories → Thêm category mới
17. [Admin] Vào /admin/users → Xem danh sách members
```

---

## 20. Kế hoạch triển khai

### Phase 1: Foundation (Weeks 1–3) [MVP]

| Task | Duration | Deliverable |
|------|----------|-------------|
| Setup project scaffolding (backend + frontend) | 3 days | Repo structure, CI pipeline |
| Database schema + Flyway migrations | 4 days | All SQL migration files |
| Authentication module (register, login, JWT) | 5 days | Auth API + login/register UI |
| User profile module (CRUD + BMI) | 4 days | Profile API + profile UI |
| Basic layout shells (Public, User, Admin) | 3 days | Route structure, shell components |

### Phase 2: Core Content (Weeks 4–6) [MVP]

| Task | Duration | Deliverable |
|------|----------|-------------|
| Blog Posts module (CRUD + publish flow) | 7 days | Post API + create/edit/view UI |
| Comments module (nested + moderation) | 5 days | Comment API + UI |
| Vote module (upvote/downvote) | 3 days | Vote API + UI |
| Categories module (Admin CRUD) | 3 days | Category API + admin UI |
| Media module (upload + processing) | 5 days | Media API + upload UI |

### Phase 3: Features (Weeks 7–9) [MVP]

| Task | Duration | Deliverable |
|------|----------|-------------|
| Video feed + detail page | 4 days | Video API + video UI |
| Meal Plan module (create + generate) | 7 days | Meal plan API + wizard UI |
| Location module (nearby search) | 5 days | Location API + map UI |
| Global Search module | 4 days | Search API + search UI |
| AI Chatbot integration | 5 days | Chatbot API + chat UI |

### Phase 4: Admin & Polish (Weeks 10–11) [MVP]

| Task | Duration | Deliverable |
|------|----------|-------------|
| Admin dashboard + user management | 4 days | Admin UI |
| Admin content moderation | 3 days | Moderation UI |
| Admin category/location management | 3 days | Admin management UI |
| Responsive design polish | 3 days | Mobile-friendly UI |
| Error states, loading states, empty states | 3 days | Complete UX coverage |

### Phase 5: Testing & Deployment (Weeks 12–13) [MVP]

| Task | Duration | Deliverable |
|------|----------|-------------|
| Unit tests (backend) | 4 days | ≥ 80% coverage |
| Integration tests (backend) | 4 days | All critical paths tested |
| E2E tests (frontend) | 4 days | Critical user flows |
| Performance tuning | 3 days | Meet p95 targets |
| Docker setup + deployment scripts | 3 days | Deployable containers |
| Documentation finalization | 2 days | README, API docs |

### SHOULD Phase (Post-MVP)

| Feature | Estimated Effort |
|---------|------------------|
| Email verification | 3 days |
| Rich text editor for posts | 5 days |
| Notification system | 5 days |
| Restaurant ratings | 3 days |
| Export meal plan PDF | 3 days |
| Social login (Google) | 5 days |

---

## 21. Definition of Done

### Checklist MVP

- [ ] **Authentication**: Register, login, logout, token refresh working
- [ ] **User Profile**: View/edit profile, BMI calculation accurate
- [ ] **Blog Posts**: Create, edit, publish, view, search posts
- [ ] **Comments**: Add, reply, delete comments (nested)
- [ ] **Votes**: Upvote, downvote, toggle vote working
- [ ] **Categories**: Admin CRUD, assign to posts
- [ ] **Videos**: Upload, process, view video feed
- [ ] **Meal Plan**: Create plan, auto-generate based on BMI + ingredients
- [ ] **Locations**: Search nearby vegan shops/restaurants
- [ ] **Search**: Global search across posts, videos, recipes, locations
- [ ] **AI Chatbot**: Responds to nutrition questions, guest limit enforced
- [ ] **Admin Panel**: Manage users, posts, videos, comments, categories
- [ ] **Responsive Design**: Works on desktop, tablet, mobile
- [ ] **Error Handling**: All error states covered (loading, empty, error)
- [ ] **Soft Delete**: All entities support soft delete
- [ ] **Tests**: Unit ≥ 80%, Integration critical paths, E2E core flows
- [ ] **API Docs**: Swagger UI accessible and complete
- [ ] **Docker**: docker-compose up works for dev environment
- [ ] **Performance**: API p95 ≤ 500ms, page load ≤ 2s
- [ ] **Security**: BCrypt passwords, JWT auth, input validation, CORS configured

---

## 22. Quyết định mặc định / Câu hỏi mở

| ID | Question | Default Decision | Rationale |
|----|----------|------------------|-----------|
| OQ-01 | AI Provider nào cho Chatbot? | OpenAI GPT-4o-mini (fallback: Claude Haiku) | Cost-effective, good Vietnamese support |
| OQ-02 | Cloud storage cho media? | AWS S3 (hoặc Cloudflare R2 để tiết kiệm) | Reliable, scalable, CDN integration |
| OQ-03 | Email service cho verification? | Resend hoặc SendGrid | Simple API, good deliverability |
| OQ-04 | Meal plan generation algorithm? | Rule-based + nutritional database + AI analysis | Deterministic baseline, AI enhances recommendations |
| OQ-04a | Is AI Meal Planner a paid feature? | Yes, requires paid package | Monetization strategy for sustainability |
| OQ-05 | Search implementation? | PostgreSQL full-text search (FTS) | Built-in, no external dependency for MVP |
| OQ-06 | Location proximity calculation? | PostgreSQL PostGIS extension | Accurate geospatial queries |
| OQ-07 | Video processing? | FFmpeg via backend service | Transcode, thumbnail extraction |
| OQ-08 | Real-time chatbot response? | SSE (Server-Sent Events) hoặc streaming | Streaming feel without WebSocket complexity |
| OQ-09 | Deployment target? | Railway / Render / AWS ECS | Managed services, easy CI/CD |
| OQ-10 | Dark mode default? | Light mode default, user can toggle | Better readability for food content |
| OQ-11 | Pagination style? | Cursor-based for feeds, offset for admin | Better performance for large datasets |
| OQ-12 | Image optimization? | Next/Image equivalent trong React (sharp preprocessing) | Reduce payload, lazy loading |
| OQ-13 | Language for AI responses? | Vietnamese by default, English supported | Target audience is Vietnamese |
| OQ-14 | Recipe difficulty levels? | EASY, MEDIUM, HARD (as defined in schema) | Simple categorization |
| OQ-15 | How to handle deleted user's content? | Keep content, anonymize author | Preserve community knowledge |

---

## 23. Thuật ngữ

| Term | Definition |
|------|-----------|
| **Vegan** | Chế độ ăn loại trừ hoàn toàn sản phẩm từ động vật (thịt, sữa, trứng, mật ong) |
| **Vegetarian** | Người ăn chay nói chung (có thể bao gồm sữa/trứng) — VEGALIFE tập trung vào Vegan |
| **BMI** | Body Mass Index — chỉ số khối cơ thể, tính bằng kg/m² |
| **Meal Plan** | Kế hoạch bữa ăn hàng tuần, lên lịch Breakfast/Lunch/Dinner |
| **Post** | Bài viết blog trên nền tảng |
| **Media** | File uploaded (image hoặc video), phân biệt bằng mime_type |
| **Dish** | Món ăn (ví dụ: Phở Chay, Bún Chả Chay) |
| **Recipe** | Công thức nấu ăn chi tiết (bao gồm instructions, ingredients, servings) |
| **Ingredient** | Nguyên liệu/thành phần (tofu, broccoli, gạo lứt...) với thông tin dinh dưỡng |
| **Category** | Danh mục phân loại (Pure Vegan, High-Protein, Quick & Easy...) |
| **Location** | Cửa hàng/thực phẩm chay (restaurant, grocery, cafe, market) |
| **Place Type** | Loại địa điểm: restaurant, grocery, cafe, market |
| **AI Chatbot** | Trợ lý AI dựa trên LLM, tư vấn dinh dưỡng chay |
| **Soft Delete** | Kỹ thuật đánh dấu xóa bằng `deleted_at` thay vì xóa vĩnh viễn |
| **JWT** | JSON Web Token — cơ chế authentication stateless |
| **Access Token** | Token ngắn hạn (15 phút) để truy cập API |
| **Refresh Token** | Token dài hạn (7 ngày) để lấy lại access token |
| **RBAC** | Role-Based Access Control — phân quyền theo vai trò |
| **Flyway** | Công cụ quản lý database migration |
| **BCrypt** | Hashing algorithm cho mật khẩu |
| **PostgreSQL FTS** | Full-Text Search trong PostgreSQL |
| **PostGIS** | Extension PostgreSQL cho queries địa lý |

---

## 24. Kết luận

VEGALIFE là một web platform toàn diện phục vụ cộng đồng người ăn chay, với 3 vai trò (Admin, User, Guest) và các tính năng cốt lõi:

**MVP Scope (13 weeks):**
- ✅ Authentication & User Profile (với BMI, activity level)
- ✅ Blog Posts + Comments + Votes (content violation check, media cloud storage)
- ✅ Video Tutorial Upload & Viewing
- ✅ Categories Management (Admin)
- ✅ Weekly Meal Plan (AI-generated, paid feature — requires subscription package)
- ✅ Location Search (vegan shops/restaurants with location permission)
- ✅ Global Search (aggregate posts, videos, recipes, locations)
- ✅ AI Nutrition Chatbot (guest limited 3 queries, user full access)
- ✅ Admin Panel (users, content, categories moderation; approve/reject posts)

**Admin Default Account:**
| Trường | Giá trị |
|--------|---------|
| Username | `admin_vegalife` |
| Email | `admin@vegalife.com` |
| Password | `VegalifeAdmin@2026` |
| Role | ADMIN |
| Status | Activated |

**Công nghệ:** Spring Boot 3.5.5 + PostgreSQL (backend), React 19 + TypeScript + Vite + Tailwind CSS (frontend).

**Triển khai:** 5 phase trong 13 tuần, bao gồm testing, performance tuning, và Docker deployment.

File SRS này là tài liệu nền tảng cho toàn bộ quá trình phát triển VEGALIFE MVP. Mọi thay đổi scope cần được review và cập nhật tài liệu.
