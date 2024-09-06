const debounce = (fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout | undefined;

    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

export default debounce;