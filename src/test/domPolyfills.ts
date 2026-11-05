// jsdom thiếu vài API mà component dùng. Bù tối thiểu, chỉ chạy khi có DOM.
if (typeof window !== "undefined") {
    if (!window.matchMedia) {
        window.matchMedia = (query: string) =>
            ({
                matches: false,
                media: query,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => false,
            }) as MediaQueryList;
    }

    class NoopObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
            return [];
        }
    }
    Object.assign(globalThis, {
        ResizeObserver: globalThis.ResizeObserver ?? NoopObserver,
        IntersectionObserver: globalThis.IntersectionObserver ?? NoopObserver,
    });

    // TipTap gọi scrollIntoView khi selection đổi.
    if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};

    // <dialog> của jsdom chưa có showModal/close — Dialog component gọi trực tiếp.
    const dialogProto = window.HTMLDialogElement?.prototype;
    if (dialogProto && !dialogProto.showModal) {
        dialogProto.showModal = function showModal(this: HTMLDialogElement) {
            this.setAttribute("open", "");
        };
        dialogProto.close = function close(this: HTMLDialogElement) {
            this.removeAttribute("open");
        };
    }

    // PostDetailPage.handleShare đọc clipboard; jsdom không implement.
    if (!navigator.clipboard) {
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: async () => {} },
        });
    }
}

export {};
