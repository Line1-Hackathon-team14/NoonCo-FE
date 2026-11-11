const MB = 1024 * 1024

/**
 * 바이트를 "2.4MB"처럼 MB 소수 첫째 자리로 표시한다.
 *
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => `${(bytes / MB).toFixed(1)}MB`
