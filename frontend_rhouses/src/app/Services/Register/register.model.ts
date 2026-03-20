export interface UserRegister {
  fullName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  isOwner: boolean;
  accessWord?: string; // El signo de interrogación (?) significa que es opcional
}
