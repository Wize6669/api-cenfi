export interface Category{
  id?: number;
  name: string;
  superCategoryId: number;
}

export interface CategoryList extends Pick<Category, 'id'| 'name'| 'superCategoryId' >{
  questionCount: number;
}
