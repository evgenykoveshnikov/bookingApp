
export interface Place {
  id: string;
  owner_user_id: string;
  name: string;
  address: string;
  capacity: number;
  created_at: string;
  imageUrl: string;
}

export interface CreatePlaceFormData {
  name: string;
  address: string;
  capacity: number;
  image: FileList; 
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  role: 'user' | 'admin'; 
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin'; 
}


