import Conf from 'conf';

interface AppConfig {
    CANVAS_API_TOKEN?: string;
    CANVAS_API_DOMAIN?: string;
}

export class ConfigManager {
    private conf: Conf<AppConfig>;

    constructor() {
        this.conf = new Conf<AppConfig>({
            projectName: 'canvas-mcp-server',
            projectSuffix: ''
        });
    }

    set(key: keyof AppConfig, value: string): void {
        this.conf.set(key, value);
    }

    get(key: keyof AppConfig): string | undefined {
        return this.conf.get(key);
    }

    getAll(): AppConfig {
        return this.conf.store;
    }

    clear(): void {
        this.conf.clear();
    }

    hasConfig(): boolean {
        return this.conf.has('CANVAS_API_TOKEN') && this.conf.has('CANVAS_API_DOMAIN');
    }

    get path(): string {
        return this.conf.path;
    }
}
