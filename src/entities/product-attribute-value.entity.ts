import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { Attribute } from './attribute.entity'
import { Product } from './product.entity'

@Entity('product_attribute_values')
@Unique(['productId', 'attributeId'])
export class ProductAttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  productId: string

  @Column({ type: 'uuid' })
  attributeId: string

  @Column({ type: 'jsonb' })
  value: unknown

  @ManyToOne(() => Product, product => product.attributeValues)
  @JoinColumn({ name: 'productId' })
  product: Product

  @ManyToOne(() => Attribute, attribute => attribute.productAttributeValues)
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
