import {MigrationInterface, QueryRunner} from "typeorm";

export class TrustanaProductCatalog1752245475795 implements MigrationInterface {
    name = 'TrustanaProductCatalog1752245475795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_attribute_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "attributeId" uuid NOT NULL, "value" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ff40ff8dd8a77cae073a7e95c17" UNIQUE ("productId", "attributeId"), CONSTRAINT "PK_b124baf1272037deac1c21cffe1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying(500), "sku" character varying(100) NOT NULL, "price" numeric(10,2), "categoryId" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying(500), "parentId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "category_attributes_linktype_enum" AS ENUM('direct', 'inherited', 'global')`);
        await queryRunner.query(`CREATE TABLE "category_attributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "categoryId" uuid NOT NULL, "attributeId" uuid NOT NULL, "linkType" "category_attributes_linktype_enum" NOT NULL DEFAULT 'direct', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a570d07f6fe15999b0eabe6eb2d" UNIQUE ("categoryId", "attributeId"), CONSTRAINT "PK_f58b128e30a1ad029b32fb79624" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "attributes_type_enum" AS ENUM('text', 'number', 'boolean', 'date', 'select', 'multi_select')`);
        await queryRunner.query(`CREATE TABLE "attributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" character varying(500), "type" "attributes_type_enum" NOT NULL DEFAULT 'text', "options" jsonb, "isRequired" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_32216e2e61830211d3a5d7fa72c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_6f387b01fd9800591fa425dd203" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_155f225a411a7955058946be337" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ADD CONSTRAINT "FK_38209e8493459f8b98aa107be2b" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ADD CONSTRAINT "FK_4eeba7ff3f73d77a0884341456e" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP CONSTRAINT "FK_4eeba7ff3f73d77a0884341456e"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP CONSTRAINT "FK_38209e8493459f8b98aa107be2b"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_155f225a411a7955058946be337"`);
        await queryRunner.query(`ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_6f387b01fd9800591fa425dd203"`);
        await queryRunner.query(`DROP TABLE "attributes"`);
        await queryRunner.query(`DROP TYPE "attributes_type_enum"`);
        await queryRunner.query(`DROP TABLE "category_attributes"`);
        await queryRunner.query(`DROP TYPE "category_attributes_linktype_enum"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "product_attribute_values"`);
    }

}
