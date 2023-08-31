export interface IUser {
  user_id: string;
  user_name: string;
  password: string;
  role: number;
  remark: string;
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
