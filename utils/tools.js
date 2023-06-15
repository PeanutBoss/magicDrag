export function throttle(fn, delay) {
    let flag = true;
    return () => {
        if (!flag)
            return;
        flag = false;
        setTimeout(() => {
            fn();
            flag = true; // 核心
        }, delay);
    };
}
