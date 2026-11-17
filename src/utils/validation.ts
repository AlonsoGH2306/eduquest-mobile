export const URL_PATTERN = /^https?:\/\/.+/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export type Validator<T> = (values: T) => Partial<Record<keyof T, string>>;

export const validateLogin: Validator<{ username: string; password: string }> = (values) => {
  const errors: Partial<Record<'username' | 'password', string>> = {};
  if (values.username.trim().length < 3) errors.username = 'Escribe tu usuario (mínimo 3 caracteres).';
  if (!values.password) errors.password = 'Escribe tu contraseña.';
  return errors;
};

type RegisterForm = { username: string; email: string; password: string; confirmPassword: string };

export const validateRegister: Validator<RegisterForm> = (values) => {
  const errors: Partial<Record<keyof RegisterForm, string>> = {};
  const username = values.username.trim();
  if (username.length < 3 || username.length > 50) {
    errors.username = 'El usuario debe tener entre 3 y 50 caracteres.';
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Escribe un correo válido.';
  if (values.password.length < 8) {
    errors.password = 'Usa al menos 8 caracteres.';
  } else if (!PASSWORD_PATTERN.test(values.password)) {
    errors.password = 'Incluye al menos una letra y un número.';
  }
  if (!values.confirmPassword) errors.confirmPassword = 'Vuelve a escribir tu contraseña.';
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Las contraseñas no coinciden.';
  return errors;
};

type DocumentForm = {
  title: string;
  description: string;
  fileUrl: string;
  tags: string;
  course: string;
  university: string;
};

export const validateDocument: Validator<DocumentForm> = (values) => {
  const errors: Partial<Record<keyof DocumentForm, string>> = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Ponle un título al material.';
  else if (title.length > 150) errors.title = 'Máximo 150 caracteres.';
  if (!URL_PATTERN.test(values.fileUrl.trim())) {
    errors.fileUrl = 'Pega un enlace que empiece con http:// o https://';
  }
  if (values.course.trim().length > 100) errors.course = 'Máximo 100 caracteres.';
  if (values.university.trim().length > 100) errors.university = 'Máximo 100 caracteres.';
  return errors;
};

type GroupForm = { name: string; description: string; visibility: string; password: string; confirmPassword: string };

export const validateGroup: Validator<GroupForm> = (values) => {
  const errors: Partial<Record<keyof GroupForm, string>> = {};
  const name = values.name.trim();
  if (!name) errors.name = 'El grupo necesita un nombre.';
  else if (name.length > 100) errors.name = 'Máximo 100 caracteres.';
  if (values.visibility === 'PRIVATE') {
    if (!values.password) errors.password = 'Ponle una contraseña para que solo entren tus invitados.';
    else if (values.password.length < 4) errors.password = 'Usa al menos 4 caracteres.';
    else if (values.password.length > 50) errors.password = 'Máximo 50 caracteres.';
  }
  if (values.visibility === 'PRIVATE' && values.password && values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }
  return errors;
};

export const hasErrors = (errors: Record<string, string | undefined>) =>
  Object.values(errors).some(Boolean);
