import { SeedService } from '../services/seed.service';
export declare class SeedController {
    private readonly seedService;
    constructor(seedService: SeedService);
    seedData(): Promise<{
        message: string;
    }>;
}
