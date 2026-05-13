export type Role = 'admin' | 'doctor' | 'patient';

export type PrescriptionStatus = 'pending' | 'consumed';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  doctor?: {
    id: string;
    specialty?: string;
    license?: string;
  };
  patient?: {
    id: string;
  };
};

export type PrescriptionItem = {
  id: string;
  name: string;
  dosage?: string;
  quantity?: number;
  instructions?: string;
};

export type Prescription = {
  id: string;
  code: string;
  status: PrescriptionStatus;
  notes?: string;
  createdAt: string;
  consumedAt?: string;
  patient: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  author: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  items: PrescriptionItem[];
};