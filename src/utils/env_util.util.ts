export function isFourInt32(arr: any) {
    return (
        Array.isArray(arr) &&
        arr.length === 4 &&
        arr.every(n => typeof n === "number" && (n | 0) === n)
    );
}