export interface ICategory {
    id?: string;
    name: string;
    parentId?: string | null;
    is_deleted?: boolean;
    children?: ICategory[];
  }
  
  export interface ICategoryResponse {
    success: boolean;
    message: string;
    data?: ICategory | ICategory[];
  }
  
  export interface IDeleteCategoryRequest {
    id: string;
    user_id: string;
  }