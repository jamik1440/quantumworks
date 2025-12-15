// Performance monitoring utility
export class PerformanceMonitor {
    private metrics: Map<string, number[]> = new Map();

    measure(name: string, fn: () => void): void {
        const start = performance.now();
        fn();
        const duration = performance.now() - start;

        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(duration);
    }

    async measureAsync(name: string, fn: () => Promise<void>): Promise<void> {
        const start = performance.now();
        await fn();
        const duration = performance.now() - start;

        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name)!.push(duration);
    }

    getStats(name: string) {
        const values = this.metrics.get(name) || [];
        if (values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        return {
            count: values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
        };
    }

    report(): void {
        console.group('Performance Report');
        this.metrics.forEach((_, name) => {
            const stats = this.getStats(name);
            if (stats) {
                console.log(`${name}:`, stats);
            }
        });
        console.groupEnd();
    }

    clear(): void {
        this.metrics.clear();
    }
}

// Global instance
export const perfMonitor = new PerformanceMonitor();
