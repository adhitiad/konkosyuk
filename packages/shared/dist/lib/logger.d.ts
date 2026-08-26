export interface LogMetadata {
    requestId?: string;
    userId?: string;
    route?: string;
    action?: string;
    status?: string;
    duration?: number;
    ip?: string;
    userAgent?: string;
    [key: string]: unknown;
}
export declare const logger: import("winston").Logger;
export declare function logError(error: unknown, context: string, metadata?: LogMetadata): void;
export declare function logInfo(message: string, metadata?: LogMetadata): void;
export declare function logWarn(message: string, metadata?: LogMetadata): void;
export declare function logDebug(message: string, metadata?: LogMetadata): void;
export declare function logSecurityEvent(event: string, metadata?: LogMetadata): void;
export declare function logApiRequest(method: string, path: string, statusCode: number, duration: number, userId?: string, requestId?: string): void;
export declare function logDatabaseQuery(query: string, duration: number, rowsAffected?: number, requestId?: string): void;
export declare function logPaymentEvent(event: string, provider: string, bookingId?: string, metadata?: LogMetadata): void;
export declare function logAuthEvent(event: string, userId?: string, metadata?: LogMetadata): void;
export default logger;
//# sourceMappingURL=logger.d.ts.map