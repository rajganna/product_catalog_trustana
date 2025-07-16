import { Repository } from 'typeorm';
import { Attribute } from '../entities/attribute.entity';
import { Category } from '../entities/category.entity';
export declare class AttributeSearchOptimizationService {
    private readonly attributeRepository;
    private readonly categoryRepository;
    constructor(attributeRepository: Repository<Attribute>, categoryRepository: Repository<Category>);
    refreshAttributeSearchOptimization(): Promise<void>;
    updateAttributeSearchVector(attributeId: string): Promise<void>;
    bulkUpdateAttributeSearchVectors(): Promise<void>;
    private refreshCategoryHierarchyView;
    private refreshAttributeCategoryMappingView;
    private refreshAttributeSearchVectorView;
    private calculateAttributeSearchVector;
    private calculateAttributeCategoryPaths;
    private getCategoryPath;
    private calculateAttributeRelevanceScore;
}
