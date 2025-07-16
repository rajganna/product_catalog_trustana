import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Product } from './product.entity'
import { CategoryAttribute } from './category-attribute.entity'

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string

  @Column({ type: 'uuid', nullable: true })
  parentId: string

  @ManyToOne(() => Category, category => category.children)
  @JoinColumn({ name: 'parentId' })
  parent: Category

  @OneToMany(() => Category, category => category.parent)
  children: Category[]

  @OneToMany(() => Product, product => product.category)
  products: Product[]

  @OneToMany(
    () => CategoryAttribute,
    categoryAttribute => categoryAttribute.category,
  )
  categoryAttributes: CategoryAttribute[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Virtual fields for counts
  directAttributeCount?: number
  productCount?: number
}
