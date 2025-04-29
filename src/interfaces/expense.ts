export interface ICategory {
    id: string;
    name: string;
    is_deleted?: boolean;
  }
  
  export interface IBreakdownItem {
    id?: string;
    expense_id?: string;
    name?: string;
    price: number;
    quantity: number;
    category_id?: string | null;
    category?: ICategory | null;
  }
  
  export interface IExpense {
    id?: string;
    user_id: string;
    category_id: string;
    category?: ICategory | null;
    expense: number;
    date: string;
    note?: string | null;
    is_deleted?: boolean;
    breakdownItems?: IBreakdownItem[];
    
    // Filtering fields
    date_type?: string;
    search_value?: string;
    page?: number;
    start_date?: string;
    end_date?: string;
    
    // For delete operation
    delete_ids?: string[];
  }

  export interface IDeleteExpenseRequest {
    user_id: string;
    expense_ids: string[];
  }
  
  // Response interfaces remain the same
  export interface IExpenseResponse {
    success: boolean;
    message: string;
    totalPages?: number;
    currentPage?: number;
    totalRows?: number;
    totalAmount?: number;
    data?: IExpense[];
  }
  
  export interface ISingleExpenseResponse {
    success: boolean;
    message: string;
    data?: IExpense;
  }
  
  export interface IBasicResponse {
    success: boolean;
    message: string;
  }