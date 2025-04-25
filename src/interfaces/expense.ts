export interface IBreakdownItem {
    id?: string;
    expense_id?: string;
    name: string;
    price: number;
    quantity: number;
    is_deleted?: boolean;
}

export interface IExpense {
    id?: string | number;
    user_id?: string;
    category: string;
    expense: number;
    date?: string;
    note?: string;
    date_type?: string;
    search_value?: string;
    delete_ids?: string[];
    is_deleted?: boolean;
    breakdownItems?: IBreakdownItem[];
    start_date?: string;
    end_date?: string;
}