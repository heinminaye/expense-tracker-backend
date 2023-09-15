export interface IUser {
  user_id: string;
  user_name: string;
  password: string;
  role: number;
  staff_id: string;
  is_deleted: boolean;
  delete_user_id: string;
}
export interface UserLogin {
  user_id: string;
  password: string;
  uuid: string;
  fcmtoken: string;
}

export interface UpdatePassword{
  user_id: string;
  current_password: string;
  new_password: string;
}
