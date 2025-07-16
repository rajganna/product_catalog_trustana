import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { CategoryAttribute } from './category-attribute.entity'
import { ProductAttributeValue } from './product-attribute-value.entity'

export enum AttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
}

@Entity('attributes')
export class Attribute {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string

  @Column({
    type: 'enum',
    enum: AttributeType,
    default: AttributeType.TEXT,
  })
  type: AttributeType

  @Column({ type: 'jsonb', nullable: true })
  options: Record<string, unknown> | null // For select/multi-select options

  @Column({ type: 'boolean', default: false })
  isRequired: boolean

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  // Search optimization fields
  @Column({ type: 'text', nullable: true })
  searchVector: string // Concatenated searchable text for full-text search

  @Column({ type: 'text', nullable: true })
  categoryPaths: string // Pipe-separated category paths this attribute applies to

  @Column({ type: 'numeric', default: 0 })
  relevanceScore: number // Relevance score for search ranking

  @OneToMany(
    () => CategoryAttribute,
    categoryAttribute => categoryAttribute.attribute,
  )
  categoryAttributes: CategoryAttribute[]

  @OneToMany(
    () => ProductAttributeValue,
    productAttributeValue => productAttributeValue.attribute,
  )
  productAttributeValues: ProductAttributeValue[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
