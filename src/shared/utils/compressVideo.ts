/**
 * Nén video ngay trên máy trước khi upload.
 *
 * Cách làm: phát file trong `<video>` ẩn, vẽ từng khung xuống canvas đã hạ chiều cao,
 * ghi canvas + track âm thanh gốc bằng `MediaRecorder`. Không thêm dependency, đổi lại
 * là nén **theo thời gian thực** (clip 10 s ≈ 10 s) và đầu ra WebM (BE đã cho phép).
 *
 * Bỏ qua (trả nguyên file) khi: file ≤ 8 MB, dài > 120 s, hoặc trình duyệt thiếu
 * `captureStream` / `MediaRecorder`. Nén xong mà không nhỏ hơn thì cũng trả file gốc.
 *
 * ponytail: realtime + WebM là mức đủ cho clip ngắn. Nâng cấp khi cần nén nhanh hơn
 * thời gian thực / ra MP4: WebCodecs + mp4box.js.
 */
const SKIP_BYTES = 8 * 1024 * 1024;
const MAX_SECONDS = 120;
const TARGET_HEIGHT = 720;
const FPS = 30;
const VIDEO_BPS = 2_000_000;

function hasCompressionSupport(): boolean {
    return (
        typeof MediaRecorder !== "undefined" &&
        typeof HTMLVideoElement !== "undefined" &&
        typeof HTMLCanvasElement !== "undefined" &&
        "captureStream" in HTMLCanvasElement.prototype
    );
}

function pickMimeType(): string {
    for (const type of ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]) {
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
}

/**
 * `MediaRecorder` cần chuỗi codecs, còn allowlist của BE (`media_type`) chỉ biết
 * container `video/webm` — grant gửi loại trần, không kèm codecs.
 */
function containerType(mimeType: string): string {
    return mimeType.split(";")[0];
}

export async function compressVideo(file: File): Promise<File> {
    if (file.size <= SKIP_BYTES || !hasCompressionSupport()) return file;

    const mimeType = pickMimeType();
    if (!mimeType) return file;

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.playsInline = true;
    video.preload = "auto";
    video.style.display = "none";
    document.body.appendChild(video);
    let audioCtx: AudioContext | null = null;

    try {
        await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject(new Error("Cannot read video"));
        });

        const duration = video.duration;
        if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_SECONDS) return file;

        const sourceHeight = video.videoHeight || TARGET_HEIGHT;
        const sourceWidth = video.videoWidth || Math.round((TARGET_HEIGHT * 16) / 9);
        const scale = Math.min(1, TARGET_HEIGHT / sourceHeight);

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(2, Math.round(sourceWidth * scale) & ~1);
        canvas.height = Math.max(2, Math.round(sourceHeight * scale) & ~1);
        const ctx = canvas.getContext("2d");
        // Canvas không có 2D context là môi trường lạ (hoặc trình duyệt chặn) — bỏ nén.
        if (!ctx) return file;

        // Autoplay policy: `play()` bị chặn khi còn tiếng, nên tắt tiếng lúc khởi động
        // rồi bật lại ngay — `MediaElementSource` đã chuyển âm thanh sang graph nên
        // loa không kêu, mà `captureStream()` của <video muted> thì trả track câm.
        video.muted = true;
        const ended = new Promise<void>((resolve) => {
            video.onended = () => resolve();
        });
        try {
            await video.play();
        } catch {
            return file;
        }
        video.muted = false;

        audioCtx = new AudioContext();
        await audioCtx.resume();
        const audioDest = audioCtx.createMediaStreamDestination();
        audioCtx.createMediaElementSource(video).connect(audioDest);

        const stream = canvas.captureStream(FPS);
        const audioTrack = audioDest.stream.getAudioTracks()[0];
        if (audioTrack) stream.addTrack(audioTrack);

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: VIDEO_BPS,
            audioBitsPerSecond: 96_000,
        });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunks.push(event.data);
        };

        const finished = new Promise<void>((resolve) => {
            recorder.onstop = () => resolve();
        });

        let drawing = true;
        const drawFrame = () => {
            if (!drawing) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawFrame);
        };

        recorder.start(1000);
        drawFrame();

        // `ended` là đường thoát bình thường; timeout chỉ để không treo khi giải mã lỗi.
        await Promise.race([ended, new Promise<void>((resolve) => setTimeout(resolve, duration * 1000 + 15_000))]);
        drawing = false;
        if (recorder.state !== "inactive") recorder.stop();
        await finished;

        const blob = new Blob(chunks, { type: containerType(mimeType) });
        // WebM lớn hơn bản gốc thì giữ bản gốc.
        if (blob.size === 0 || blob.size >= file.size) return file;

        const name = file.name.replace(/\.[^.]+$/, "") || "video";
        return new File([blob], `${name}.webm`, { type: containerType(mimeType) });
    } catch {
        // Thiết bị yếu / codec lạ: upload bản gốc còn hơn chặn người dùng.
        return file;
    } finally {
        URL.revokeObjectURL(url);
        video.remove();
        void audioCtx?.close();
    }
}
