import { IsString, IsUUID } from 'class-validator';

// ─── GET /categories

export class CategoryDto {
  // category.category_id
  @IsUUID()
  categoryId: string;

  // category.name
  @IsString()
  name: string;

  // category.description
  @IsString()
  description: string;
}
