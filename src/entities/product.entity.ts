import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Category } from './category.entity'
import { ProductAttributeValue } from './product-attribute-value.entity'

@Entity('products')
@Index(['isActive', 'categoryId'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number

  @Column({ type: 'uuid' })
  categoryId: string

  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category

  @OneToMany(
    () => ProductAttributeValue,
    productAttributeValue => productAttributeValue.product,
  )
  attributeValues: ProductAttributeValue[]

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
