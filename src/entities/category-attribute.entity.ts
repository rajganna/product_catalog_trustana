import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm'
import { Category } from './category.entity'
import { Attribute } from './attribute.entity'

export enum LinkType {
  DIRECT = 'direct',
  INHERITED = 'inherited',
  GLOBAL = 'global',
}

@Entity('category_attributes')
@Unique(['categoryId', 'attributeId'])
export class CategoryAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  categoryId: string

  @Column({ type: 'uuid' })
  attributeId: string

  @Column({
    type: 'enum',
    enum: LinkType,
    default: LinkType.DIRECT,
  })
  linkType: LinkType

  @ManyToOne(() => Category, category => category.categoryAttributes)
  @JoinColumn({ name: 'categoryId' })
  category: Category

  @ManyToOne(() => Attribute, attribute => attribute.categoryAttributes)
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute

  @CreateDateColumn()
  createdAt: Date
}
