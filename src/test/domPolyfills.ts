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

    // PostDetailPage.handleShare đọc clipboard; jsdom không implement.
    if (!navigator.clipboard) {
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: async () => {} },
        });
    }
}

export {};
